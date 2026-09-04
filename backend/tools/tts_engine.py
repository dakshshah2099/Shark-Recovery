import asyncio
import base64
import io
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np

try:
    from backend.tools.hinglish_normalizer import normalize_hinglish_to_devanagari
except ImportError:
    from tools.hinglish_normalizer import normalize_hinglish_to_devanagari

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

# Voice catalog with specialized acoustic blends for Hinglish
VOICE_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "shark_agent_alpha",
        "name": "Shark Agent Alpha (Empathetic Neural Blend)",
        "gender": "female",
        "lang": "hi",
        "role_recommendation": "AI_Agent",
        "description": "Optimized multi-vector blend (70% hf_alpha + 20% hf_beta + 10% af_heart) for authoritative, empathetic recovery",
    },
    {
        "id": "shark_agent_warm",
        "name": "Shark Agent Warm (Customer Service Blend)",
        "gender": "female",
        "lang": "hi",
        "role_recommendation": "AI_Agent",
        "description": "Soft, reassuring Indian female specialist (65% hf_beta + 25% hf_alpha + 10% af_sky)",
    },
    {
        "id": "customer_male",
        "name": "Customer Omega (Conversational Indian Male)",
        "gender": "male",
        "lang": "hi",
        "role_recommendation": "Customer",
        "description": "Realistic conversational Indian male buyer (75% hm_omega + 20% hm_psi + 5% am_adam)",
    },
    {
        "id": "customer_calm",
        "name": "Customer Psi (Calm Indian Male)",
        "gender": "male",
        "lang": "hi",
        "role_recommendation": "Customer",
        "description": "Gentle, measured Indian male buyer (80% hm_psi + 20% hm_omega)",
    },
    {
        "id": "customer_female",
        "name": "Customer Beta (Conversational Indian Female)",
        "gender": "female",
        "lang": "hi",
        "role_recommendation": "Customer",
        "description": "Conversational Indian female buyer (70% hf_beta + 25% hf_alpha + 5% af_heart)",
    },
    {
        "id": "hf_alpha",
        "name": "Raw Alpha (Native Hindi Female)",
        "gender": "female",
        "lang": "hi",
        "role_recommendation": "AI_Agent",
        "description": "Raw unblended Hindi Female voice",
    },
    {
        "id": "hm_omega",
        "name": "Raw Omega (Native Hindi Male)",
        "gender": "male",
        "lang": "hi",
        "role_recommendation": "Customer",
        "description": "Raw unblended Hindi Male voice",
    },
    {
        "id": "af_heart",
        "name": "Heart (US Studio Female)",
        "gender": "female",
        "lang": "en-us",
        "role_recommendation": "AI_Agent",
        "description": "Crisp American English voice",
    },
]


class KokoroTTSEngine:
    """
    Singleton wrapper for Kokoro-82M ONNX Text-to-Speech synthesis with
    Devanagari phonetic Hinglish optimization and acoustic style blending.
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
        self._blend_cache: Dict[str, np.ndarray] = {}
        self._load_model()
        self._precompute_blends()
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
        """Initializes the Kokoro-ONNX model."""
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

    def _precompute_blends(self) -> None:
        """Computes and caches acoustic voice style blends in memory."""
        if not self._kokoro:
            return

        try:
            v_alpha = self._kokoro.get_voice_style("hf_alpha")
            v_beta = self._kokoro.get_voice_style("hf_beta")
            v_omega = self._kokoro.get_voice_style("hm_omega")
            v_psi = self._kokoro.get_voice_style("hm_psi")
            v_heart = self._kokoro.get_voice_style("af_heart")
            v_sky = self._kokoro.get_voice_style("af_sky")
            v_adam = self._kokoro.get_voice_style("am_adam")

            # 1. Shark Agent Alpha: Authoritative & Empathetic Recovery (Enhanced English Articulation)
            self._blend_cache["shark_agent_alpha"] = 0.55 * v_alpha + 0.20 * v_beta + 0.25 * v_heart
            # 2. Shark Agent Warm: Reassuring Support
            self._blend_cache["shark_agent_warm"] = 0.55 * v_beta + 0.25 * v_alpha + 0.20 * v_sky
            # 3. Customer Male: Conversational Buyer
            self._blend_cache["customer_male"] = 0.75 * v_omega + 0.20 * v_psi + 0.05 * v_adam
            # 4. Customer Calm: Relaxed Buyer
            self._blend_cache["customer_calm"] = 0.80 * v_psi + 0.20 * v_omega
            # 5. Customer Female: Conversational Buyer
            self._blend_cache["customer_female"] = 0.70 * v_beta + 0.25 * v_alpha + 0.05 * v_heart

            logger.info("Pre-computed 5 optimized Kokoro Hinglish voice blends.")
        except Exception as e:
            logger.warning(f"Voice blend precomputation note: {e}")

    @property
    def is_available(self) -> bool:
        return self._kokoro is not None

    def get_catalog(self) -> List[Dict[str, Any]]:
        return VOICE_CATALOG

    def _resolve_voice_style(self, voice_id: str) -> Union[str, np.ndarray]:
        """Resolves a voice ID to either a cached blended ndarray or standard string voice."""
        if voice_id in self._blend_cache:
            return self._blend_cache[voice_id]
        return voice_id

    def synthesize(
        self,
        text: str,
        voice: str = "shark_agent_alpha",
        speed: float = 1.05,
        lang: str = "hi",
    ) -> Tuple[bytes, int, str]:
        """
        Synthesizes text into WAV audio bytes with Devanagari Hinglish normalization.
        Returns:
            (wav_bytes, sample_rate, optimized_devanagari_text)
        """
        if not self.is_available:
            raise RuntimeError("Kokoro-82M engine is not available or weights not loaded.")

        import io
        import soundfile as sf

        # 1. Phonetically optimize Romanized Hinglish -> Devanagari
        # If the voice is pure English (e.g., af_heart), we keep latin English formatting
        if voice.startswith("af_") or voice.startswith("am_") or voice.startswith("bf_") or voice.startswith("bm_"):
            clean_text = text
            target_lang = "en-us"
        else:
            clean_text = normalize_hinglish_to_devanagari(text)
            target_lang = "hi"

        # 2. Resolve voice embedding (blended ndarray or raw voice string)
        voice_target = self._resolve_voice_style(voice)

        # 3. Kokoro inference
        samples, sample_rate = self._kokoro.create(
            clean_text,
            voice=voice_target,
            speed=speed,
            lang=target_lang,
        )

        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format="WAV")
        return buffer.getvalue(), sample_rate, clean_text

    def synthesize_base64(
        self,
        text: str,
        voice: str = "shark_agent_alpha",
        speed: float = 1.05,
        lang: str = "hi",
    ) -> Tuple[str, str]:
        """
        Synthesizes text and returns (audio_data_uri, optimized_devanagari_text).
        """
        wav_bytes, _, clean_text = self.synthesize(text=text, voice=voice, speed=speed, lang=lang)
        b64_str = base64.b64encode(wav_bytes).decode("utf-8")
        return f"data:audio/wav;base64,{b64_str}", clean_text


# Global module singleton
tts_engine = KokoroTTSEngine()


async def synthesize_kokoro_audio(
    text: str,
    voice: str = "shark_agent_alpha",
    speed: float = 1.05,
    lang: str = "hi",
) -> Dict[str, Any]:
    """Async convenience wrapper for Kokoro TTS synthesis with threadpool offload."""
    if not tts_engine.is_available:
        return {"success": False, "error": "Kokoro TTS engine not available"}
    try:
        def _run_synth():
            wav_bytes, sr, clean = tts_engine.synthesize(text=text, voice=voice, speed=speed, lang=lang)
            b64_str = base64.b64encode(wav_bytes).decode("utf-8")
            return {
                "success": True,
                "audio_base64": b64_str,
                "sample_rate": sr,
                "clean_text": clean,
            }
        return await asyncio.to_thread(_run_synth)
    except Exception as e:
        logger.warning(f"Error in synthesize_kokoro_audio: {e}")
        return {"success": False, "error": str(e)}
