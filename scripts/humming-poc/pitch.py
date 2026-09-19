"""Audio -> key-free pitch contour, in semitones, sampled at QUERY_FPS."""
import numpy as np
import librosa
from scipy.signal import medfilt

SAMPLE_RATE = 16000
HOP = 320  # 20 ms
QUERY_FPS = 10
FMIN, FMAX = 65.0, 1000.0  # low male hum to high soprano


def load(path: str) -> np.ndarray:
    audio, _ = librosa.load(path, sr=SAMPLE_RATE, mono=True)
    return audio


def contour(audio: np.ndarray) -> np.ndarray:
    """Voiced pitch in semitones, silence removed, median-centred (so the key drops out)."""
    f0, voiced, _ = librosa.pyin(
        audio, fmin=FMIN, fmax=FMAX, sr=SAMPLE_RATE, frame_length=1024, hop_length=HOP
    )
    midi = librosa.hz_to_midi(f0[voiced & np.isfinite(f0)])
    if len(midi) < 10:
        return np.empty(0)
    midi = medfilt(midi, 5)
    midi = fold_octave_jumps(midi)
    # 50 fps -> QUERY_FPS by block medians.
    block = round(SAMPLE_RATE / HOP / QUERY_FPS)
    usable = len(midi) // block * block
    frames = np.median(midi[:usable].reshape(-1, block), axis=1)
    return frames - np.median(frames)


def fold_octave_jumps(midi: np.ndarray) -> np.ndarray:
    """Pull frames the tracker put an octave off back towards their neighbours."""
    local = medfilt(midi, 25)
    return midi - 12 * np.round((midi - local) / 12)
