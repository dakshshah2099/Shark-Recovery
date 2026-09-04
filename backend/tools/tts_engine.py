import base64
import io
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Model and voice binaries paths
_BASE_DIR = Path(__file__).resolve().parent.parent
_WEIGHTS_DIRS = [
    _BASE_DIR / "kokoro_weights",
    _BASE_DIR.parent / "kokoro_weights",
    Path.home() / ".cache" / "kokoro_onnx",
]

_DEFAULT_MODEL_NAME = "kokoro-v1.0.onnx"
_DEFAULT_VOICES_NAME = "voices-v1.0.bin"

# Standard Kokoro voice catalog with Indian / Hinglish recommendations
VOICE_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "hf_alpha",
        "name": "Alpha (Hindi Female)",
        "gender": "female",
        "lang": "hi",
        "role_recommendation": "AI_Agent",
        "description": "Crisp, authoritative yet polite Indian female recovery specialist voice",
    },
    {
        "id": "hf_beta",
        "name": "Beta (Hindi Female)",
        "gender": "female",
        "lang": "hi",
        "role_recommendation": "AI_Agent",
        "description": "Warm, empathetic Indian female customer service voice",
    },
    {
        "id": "hm_omega",
        "name": "Omega (Hindi Male)",
        "gender": "male",
        "lang": "hi",
        "role_recommendation": "Customer",
        "description": "Natural, conversational Indian male voice",
    },
    {
        "id": "hm_psi",
        "name": "Psi (Hindi Male)",
        "gender": "male",
        "lang": "hi",
        "role_recommendation": "Customer",
        "description": "Calm, everyday conversational Indian male voice",
    },
    {
        "id": "af_heart",
        "name": "Heart (US Female)",
        "gender": "female",
        "lang": "en-us",
        "role_recommendation": "AI_Agent",
        "description": "Warm studio English voice",
    },
    {
        "id": "af_sky",
        "name": "Sky (US Female)",
        "gender": "female",
        "lang": "en-us",
        "role_recommendation": "AI_Agent",
        "description": "Clear and dynamic English voice",
    },
    {
        "id": "am_adam",
        "name": "Adam (US Male)",
        "gender": "male",
        "lang": "en-us",
        "role_recommendation": "Customer",
        "description": "Professional English male voice",
    },
    {
        "id": "bf_emma",
        "name": "Emma (UK Female)",
        "gender": "female",
        "lang": "en-gb",
        "role_recommendation": "AI_Agent",
        "description": "Refined British English female voice",
    },
]


def preprocess_hinglish_for_tts(text: str) -> str:
    """
    Phonetically normalizes Romanized Hinglish and financial terms for Kokoro-82M.
    Converts currency symbols, acronyms, percentages, and romanized Hindi tokens.
    """
    cleaned = text
    # 1. Currency notation
    cleaned = re.sub(r"₹\s*([\d,]+)", r"\1 rupees ", cleaned)
    cleaned = re.sub(r"INR\s*([\d,]+)", r"\1 rupees ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"Rs\.?\s*([\d,]+)", r"\1 rupees ", cleaned, flags=re.IGNORECASE)

    # 2. Acronyms & FinTech terminology
    cleaned = re.sub(r"\bOTP\b", "O T P ", cleaned)
    cleaned = re.sub(r"\bUPI\b", "U P I ", cleaned)
    cleaned = re.sub(r"\bSMS\b", "S M S ", cleaned)
    cleaned = re.sub(r"\bIVR\b", "I V R ", cleaned)
    cleaned = re.sub(r"\b3DS\b", "three D secure ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b3D Secure\b", "three D secure ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bPTP\b", "Promise to Pay ", cleaned)
    cleaned = re.sub(r"\b1-click\b", "one click ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"(\d+)%", r"\1 percent ", cleaned)

    # 3. Romanized Hindi honorifics and speech clarity tokens
    cleaned = re.sub(r"\bji\b", "jee", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bnamaste\b", "namastey", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bdhanyawad\b", "dhanyawaad", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bhaan\b", "haan", cleaned, flags=re.IGNORECASE)

    # 4. Remove commas inside numbers (e.g. 14,999 -> 14999)
    cleaned = re.sub(r"(\d),(\d)", r"\1\2", cleaned)

    # Strip extra whitespace
    return re.sub(r"\s+", " ", cleaned).strip()


class KokoroTTSEngine:
    """
    Singleton wrapper for Kokoro-82M ONNX Text-to-Speech synthesis.
    """
    _instance: Optional["KokoroTTSEngine"] = None
    _initialized: bool = False

    def __new__(cls) -> "KokoroTTSEngine":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return

        self._kokoro = None
        self._model_path: Optional[str] = None
        self._voices_path: Optional[str] = None
        self._load_model()
        self._initialized = True

    def _find_weights(self) -> Tuple[Optional[str], Optional[str]]:
        """Locates model weights on disk."""
        for weights_dir in _WEIGHTS_DIRS:
            model_candidate = weights_dir / _DEFAULT_MODEL_NAME
            voices_candidate = weights_dir / _DEFAULT_VOICES_NAME
            if model_candidate.exists() and voices_candidate.exists():
                return str(model_candidate), str(voices_candidate)
        return None, None

    def _load_model(self) -> None:
        """Initializes the Kokoro-ONNX model if dependencies and files are available."""
        try:
            from kokoro_onnx import Kokoro
            import soundfile  # verify installed

            model_path, voices_path = self._find_weights()
            if not model_path or not voices_path:
                logger.warning(
                    "Kokoro weights not found in search paths. "
                    "Run download script to populate 'kokoro_weights/'."
                )
                return

            self._model_path = model_path
            self._voices_path = voices_path
            self._kokoro = Kokoro(model_path, voices_path)
            logger.info(f"Kokoro-82M ONNX loaded successfully from {model_path}")
        except ImportError as e:
            logger.warning(f"kokoro-onnx or soundfile not installed ({e}). Kokoro TTS disabled.")
        except Exception as e:
            logger.error(f"Failed to initialize Kokoro-82M ONNX: {e}", exc_info=True)

    @property
    def is_available(self) -> bool:
        return self._kokoro is not None

    def get_catalog(self) -> List[Dict[str, Any]]:
        return VOICE_CATALOG

    def synthesize(
        self,
        text: str,
        voice: str = "hf_alpha",
        speed: float = 1.0,
        lang: Optional[str] = None,
    ) -> Tuple[bytes, int]:
        """
        Synthesizes text into WAV audio bytes.
        Returns:
            (wav_bytes, sample_rate)
        """
        if not self.is_available:
            raise RuntimeError("Kokoro-82M engine is not available or weights not loaded.")

        import io
        import soundfile as sf

        # Determine language code based on voice prefix if not explicitly provided
        if not lang:
            if voice.startswith("h"):
                lang = "hi"
            elif voice.startswith("a"):
                lang = "en-us"
            elif voice.startswith("b"):
                lang = "en-gb"
            elif voice.startswith("j"):
                lang = "ja"
            elif voice.startswith("z"):
                lang = "zh"
            else:
                lang = "en-us"

        normalized_text = preprocess_hinglish_for_tts(text)

        # Kokoro synthesis
        samples, sample_rate = self._kokoro.create(
            normalized_text,
            voice=voice,
            speed=speed,
            lang=lang,
        )

        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format="WAV")
        return buffer.getvalue(), sample_rate

    def synthesize_base64(
        self,
        text: str,
        voice: str = "hf_alpha",
        speed: float = 1.0,
        lang: Optional[str] = None,
    ) -> str:
        """
        Synthesizes text and returns a base64 data URI (data:audio/wav;base64,...).
        """
        wav_bytes, _ = self.synthesize(text=text, voice=voice, speed=speed, lang=lang)
        b64_str = base64.b64encode(wav_bytes).decode("utf-8")
        return f"data:audio/wav;base64,{b64_str}"


# Global module singleton
tts_engine = KokoroTTSEngine()
