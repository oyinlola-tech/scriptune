# Scriptune transcriber

A local speech-to-text service for the API, built on [OpenAI Whisper](https://github.com/openai/whisper).
Recordings are transcribed on this machine; nothing is sent to a third-party vendor.

```bash
# from the repository root, once
npm run setup:transcriber        # creates transcriber/.venv and installs Whisper + PyTorch (CPU)

# then it starts with everything else
npm run dev

# or on its own
npm run dev:transcriber          # http://localhost:5005 (docs at /docs)
```

The first start downloads the model (about 480 MB for `small`) to `~/.cache/whisper`. The
download resumes after network drops and retries until it is done. While it is still on its
way, the service serves the smallest model already on disk (`tiny` after `npm run setup`),
so audio recognition works from the first minute and quietly switches to the better model
once it has arrived. `GET /health` shows `model` (in use) and `wanted` (configured).

Every listed model is multilingual: Whisper detects the language of each clip on its own
(English, Yoruba, Igbo, Hausa, French and about 90 others) when the API sends `language=auto`,
which is the default. Low-resource languages such as Yoruba are noticeably better on `medium`
or `turbo` than on `small`; `tiny`/`base` are only worth it for English on a slow machine.

| Variable          | Default | Notes                                                        |
| ----------------- | ------- | ------------------------------------------------------------ |
| `WHISPER_MODEL`   | `small` | `tiny`/`base` faster; `medium`/`turbo` more accurate, esp. Yoruba |
| `WHISPER_DEVICE`  | `cpu`   | `cuda` with an NVIDIA GPU and a CUDA build of PyTorch        |
| `WHISPER_THREADS` | all     | PyTorch CPU threads                                          |
| `TRANSCRIBER_PORT`| `5005`  | read by the launcher; the API's `WHISPER_URL` must match      |

Endpoints: `POST /transcribe?language=en&prompt=...` with the audio as the request body
(`Content-Type: audio/webm`, `audio/mp4`, `audio/wav`, ...) and `GET /health`.
