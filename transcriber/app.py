"""Scriptune transcriber: a small HTTP service that runs OpenAI Whisper locally.

The Node API posts raw audio here instead of to a hosted speech-to-text vendor,
so recordings never leave the machine. Audio is decoded with PyAV (which ships
its own FFmpeg), resampled to 16 kHz mono, and handed to Whisper.

    POST /transcribe?language=en&prompt=...   body: audio bytes, Content-Type: audio/*
    GET  /health

Environment:
    WHISPER_MODEL        tiny | base | small | medium | large | turbo   (default: small)
                         All of these are multilingual; never use a ".en" model here.
    WHISPER_DEVICE       cpu | cuda                                     (default: cpu)
    WHISPER_THREADS      CPU threads for PyTorch                        (default: all cores)
    WHISPER_CACHE        where model files live                         (default: ~/.cache/whisper)
    WHISPER_MAX_BYTES    largest upload accepted                        (default: 25 MB)
    WHISPER_MAX_SECONDS  longest clip accepted after decoding           (default: 60)
"""
from __future__ import annotations

import asyncio
import hashlib
import io
import logging
import math
import os
import threading
import time
import urllib.error
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import av
import numpy as np
import torch
import whisper
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from whisper.tokenizer import LANGUAGES

MODEL_NAME = os.environ.get("WHISPER_MODEL", "small")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
THREADS = int(os.environ.get("WHISPER_THREADS", "0") or 0)
MAX_BYTES = int(os.environ.get("WHISPER_MAX_BYTES", str(25 * 1024 * 1024)))
MAX_SECONDS = float(os.environ.get("WHISPER_MAX_SECONDS", "60"))
# How long a request waits for the single Whisper slot before answering 503.
BUSY_TIMEOUT_S = float(os.environ.get("WHISPER_BUSY_TIMEOUT", "20"))
SAMPLE_RATE = 16_000
CACHE_DIR = Path(os.environ.get("WHISPER_CACHE", Path.home() / ".cache" / "whisper"))
# Smallest first: whichever of these is already on disk serves requests while
# the wanted model is still downloading.
FALLBACK_ORDER = ["tiny", "base", "small", "medium", "turbo", "large"]

# PyAV renamed AVError to FFmpegError in v14; accept either.
DECODE_ERRORS: tuple[type[BaseException], ...] = tuple(e for e in (getattr(av, "FFmpegError", None), getattr(av, "AVError", None)) if e is not None) or (Exception,)

log = logging.getLogger("transcriber")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

_model: whisper.Whisper | None = None
_model_name: str | None = None
_load_error: str | None = None
# Whisper is CPU-bound and not safe to share across threads, so requests take
# turns: the semaphore bounds how many wait, the lock guards the model itself.
_slot = asyncio.Semaphore(1)
_lock = threading.Lock()


def _expected_sha(name: str) -> str:
    # OpenAI hosts each checkpoint under its own SHA-256, e.g. .../<sha256>/small.pt
    return whisper._MODELS[name].split("/")[-2]  # noqa: SLF001


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def cached_model_path(name: str) -> Path | None:
    """The checkpoint on disk, only if its checksum is right."""
    path = CACHE_DIR / f"{name}.pt"
    if path.is_file() and _sha256(path) == _expected_sha(name):
        return path
    return None


def download_model(name: str) -> Path:
    """Fetch a checkpoint with HTTP range resume and retries.

    Whisper's own downloader starts over on every hiccup, which never finishes
    on a slow or flaky connection. This appends to a .part file, resumes from
    where it stopped, and only renames it once the checksum matches.
    """
    url = whisper._MODELS[name]  # noqa: SLF001
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    final = CACHE_DIR / f"{name}.pt"
    part = CACHE_DIR / f"{name}.pt.part"
    attempt = 0
    while True:
        attempt += 1
        have = part.stat().st_size if part.exists() else 0
        try:
            request = urllib.request.Request(url, headers={"Range": f"bytes={have}-"} if have else {})
            with urllib.request.urlopen(request, timeout=60) as source:
                if source.status == 200 and have:
                    have = 0  # server ignored the range: start again
                total = have + int(source.headers.get("Content-Length") or 0)
                log.info("Downloading Whisper %s (%.0f of %.0f MB)", name, have / 1e6, total / 1e6)
                with part.open("ab" if have else "wb") as output:
                    while True:
                        chunk = source.read(1 << 20)
                        if not chunk:
                            break
                        output.write(chunk)
        except urllib.error.HTTPError as error:
            if error.code != 416:  # 416 = nothing left to fetch; fall through to verification
                delay = min(60, 5 * attempt)
                log.warning("Download of %s failed (HTTP %s); retrying in %ss", name, error.code, delay)
                time.sleep(delay)
                continue
        except Exception as error:  # noqa: BLE001 - any network error: back off and resume
            delay = min(60, 5 * attempt)
            log.warning("Download of %s interrupted (%s); retrying in %ss", name, error, delay)
            time.sleep(delay)
            continue
        if part.exists() and _sha256(part) == _expected_sha(name):
            part.replace(final)
            log.info("Whisper %s downloaded and verified", name)
            return final
        log.warning("Checksum mismatch for %s; downloading again", name)
        part.unlink(missing_ok=True)


def _load(path: Path, name: str) -> None:
    global _model, _model_name, _load_error
    started = time.perf_counter()
    loaded = whisper.load_model(str(path), device=DEVICE)
    with _lock:
        _model, _model_name = loaded, name
    _load_error = None
    log.info("Whisper %s ready in %.1fs", name, time.perf_counter() - started)


def _fetch_wanted_in_background() -> None:
    """Download the wanted model with retries, then swap it in without a restart."""
    global _load_error
    try:
        _load(download_model(MODEL_NAME), MODEL_NAME)
    except Exception as error:  # noqa: BLE001 - surfaced on /health rather than lost in a thread
        _load_error = f"{MODEL_NAME}: {error}"
        log.error("Could not load Whisper %s: %s", MODEL_NAME, error)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if THREADS > 0:
        torch.set_num_threads(THREADS)
    if MODEL_NAME not in whisper._MODELS or MODEL_NAME.endswith(".en"):  # noqa: SLF001
        raise SystemExit(f"WHISPER_MODEL={MODEL_NAME!r} is not a multilingual Whisper model; use one of {', '.join(FALLBACK_ORDER)}")
    log.info("Whisper model=%s device=%s cache=%s", MODEL_NAME, DEVICE, CACHE_DIR)
    wanted = await asyncio.to_thread(cached_model_path, MODEL_NAME)
    if wanted is not None:
        await asyncio.to_thread(_load, wanted, MODEL_NAME)
    else:
        for name in FALLBACK_ORDER:
            if name == MODEL_NAME:
                continue
            path = await asyncio.to_thread(cached_model_path, name)
            if path is not None:
                log.warning("Model %s is not downloaded yet; serving %s meanwhile", MODEL_NAME, name)
                await asyncio.to_thread(_load, path, name)
                break
        else:
            log.warning("No Whisper model on disk yet; audio answers 503 until %s has downloaded", MODEL_NAME)
        threading.Thread(target=_fetch_wanted_in_background, name="whisper-download", daemon=True).start()
    yield


app = FastAPI(title="Scriptune transcriber", version="0.1.0", lifespan=lifespan)


def decode_audio(data: bytes) -> np.ndarray:
    """Any container FFmpeg understands (webm/opus, m4a/aac, wav, mp3...) -> float32 mono 16 kHz.

    Refuses clips longer than MAX_SECONDS while decoding, so a few MB of
    low-bitrate audio cannot expand into hundreds of MB of samples.
    """
    max_samples = int(SAMPLE_RATE * MAX_SECONDS)
    try:
        container = av.open(io.BytesIO(data))
    except DECODE_ERRORS as error:
        raise HTTPException(status_code=415, detail=f"Audio could not be decoded: {error}") from error
    with container:
        if container.duration is not None and container.duration / av.time_base > MAX_SECONDS:
            raise HTTPException(status_code=413, detail=f"Recordings longer than {MAX_SECONDS:.0f} seconds are not accepted.")
        stream = next((s for s in container.streams if s.type == "audio"), None)
        if stream is None:
            raise HTTPException(status_code=415, detail="The upload has no audio track.")
        resampler = av.AudioResampler(format="s16", layout="mono", rate=SAMPLE_RATE)
        chunks: list[np.ndarray] = []
        total = 0
        try:
            for frame in container.decode(stream):
                for resampled in resampler.resample(frame):
                    array = resampled.to_ndarray()
                    total += array.shape[-1]
                    if total > max_samples:
                        raise HTTPException(status_code=413, detail=f"Recordings longer than {MAX_SECONDS:.0f} seconds are not accepted.")
                    chunks.append(array)
            for resampled in resampler.resample(None):
                chunks.append(resampled.to_ndarray())
        except DECODE_ERRORS as error:
            raise HTTPException(status_code=415, detail=f"Audio could not be decoded: {error}") from error
    if not chunks:
        return np.zeros(0, dtype=np.float32)
    pcm = np.concatenate(chunks, axis=1)[0]
    return pcm.astype(np.float32) / 32768.0


def run_whisper(audio: np.ndarray, language: str | None, prompt: str | None) -> dict[str, Any]:
    with _lock:
        assert _model is not None
        options: dict[str, Any] = {"fp16": DEVICE != "cpu", "word_timestamps": True, "task": "transcribe"}
        if language:
            options["language"] = language
        if prompt:
            options["initial_prompt"] = prompt
        result = _model.transcribe(audio, **options)
        result["_model"] = _model_name
        return result


async def read_body(request: Request) -> bytes:
    """Reject by Content-Length first, then stream with a running cap; never buffer an unbounded body."""
    declared = request.headers.get("content-length")
    if declared is not None and declared.isdigit() and int(declared) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Audio is larger than {MAX_BYTES} bytes.")
    parts: list[bytes] = []
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > MAX_BYTES:
            raise HTTPException(status_code=413, detail=f"Audio is larger than {MAX_BYTES} bytes.")
        parts.append(chunk)
    return b"".join(parts)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok" if _model is not None else "loading", "model": _model_name, "wanted": MODEL_NAME, "device": DEVICE, "error": _load_error}


@app.post("/transcribe")
async def transcribe(
    request: Request,
    language: str | None = Query(default=None, description="ISO 639-1 code such as en or yo; omit to auto-detect"),
    prompt: str | None = Query(default=None, max_length=500, description="Vocabulary to favour, e.g. hymn titles"),
) -> JSONResponse:
    if _model is None:
        raise HTTPException(status_code=503, detail=f"Whisper {MODEL_NAME} is still downloading; try again shortly.")
    # Whisper takes only the primary language subtag ("en", not "en-GB") and only ones it knows.
    lang = language.split("-")[0].lower() if language else None
    if lang is not None and lang not in LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language {language!r}; use a two-letter code Whisper knows, or omit it.")
    data = await read_body(request)
    if not data:
        raise HTTPException(status_code=400, detail="Send the audio as the request body.")

    try:
        await asyncio.wait_for(_slot.acquire(), timeout=BUSY_TIMEOUT_S)
    except (asyncio.TimeoutError, TimeoutError):
        raise HTTPException(status_code=503, detail="The transcriber is busy; try again in a moment.", headers={"Retry-After": "5"}) from None
    try:
        started = time.perf_counter()
        audio = await asyncio.to_thread(decode_audio, data)
        if audio.size < SAMPLE_RATE // 10:
            raise HTTPException(status_code=422, detail="The recording is too short to transcribe.")
        result = await asyncio.to_thread(run_whisper, audio, lang, prompt)
    finally:
        _slot.release()

    words = [
        {
            "word": w.get("word", "").strip(),
            "start": round(float(w.get("start", 0.0)), 3),
            "end": round(float(w.get("end", 0.0)), 3),
            "confidence": round(float(w.get("probability", 0.0)), 4),
        }
        for segment in result.get("segments", [])
        for w in segment.get("words", [])
        if w.get("word", "").strip()
    ]
    # One overall score: Whisper reports a mean log-probability per segment.
    logprobs = [float(s["avg_logprob"]) for s in result.get("segments", []) if "avg_logprob" in s]
    confidence = round(min(1.0, math.exp(sum(logprobs) / len(logprobs))), 4) if logprobs else None

    return JSONResponse(
        {
            "provider": "whisper",
            "model": result.get("_model") or MODEL_NAME,
            "transcript": (result.get("text") or "").strip(),
            "language": result.get("language"),
            "confidence": confidence,
            "words": words,
            "durationSeconds": round(audio.size / SAMPLE_RATE, 2),
            "latencyMs": round((time.perf_counter() - started) * 1000),
        }
    )
