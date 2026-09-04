import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

try:
    from backend.tools.tts_engine import (
        tts_engine,
        VOICE_CATALOG,
    )
except ImportError:
    from tools.tts_engine import (
        tts_engine,
        VOICE_CATALOG,
    )

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["Voice Recovery TTS"])


class SynthesizeRequest(BaseModel):
    text: str = Field(..., description="Text or Hinglish transcript to synthesize")
    voice: Optional[str] = Field(None, description="Kokoro voice ID or blend preset")
    speaker: Optional[str] = Field(None, description="Speaker role: AI_Agent or Customer")
    speed: float = Field(1.05, ge=0.5, le=2.0, description="Speech rate multiplier")


class SynthesizeResponse(BaseModel):
    success: bool
    audio_base64: str
    sample_rate: int
    duration_approx_sec: float
    voice_used: str
    clean_text: str


class DialogueTurnAudioItem(BaseModel):
    speaker: str
    text: str
    emotion: str
    timestamp_sec: int
    audio_base64: Optional[str] = None
    voice_used: Optional[str] = None
    devanagari_normalized: Optional[str] = None


class BatchSessionAudioRequest(BaseModel):
    dialogue: List[Dict[str, Any]]
    agent_voice: str = "shark_agent_alpha"
    customer_voice: str = "customer_male"
    speed: float = 1.05


class BatchSessionAudioResponse(BaseModel):
    success: bool
    dialogue: List[DialogueTurnAudioItem]
    model_engine: str = "Kokoro-82M ONNX + Devanagari G2P"


@router.get("/voices", response_model=List[Dict[str, Any]])
async def get_available_voices():
    """Lists supported Kokoro-82M voices and their Hinglish recovery profiles."""
    return tts_engine.get_catalog()


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_speech(req: SynthesizeRequest):
    """
    Synthesizes single Hinglish utterance using Kokoro-82M ONNX engine with
    phonetic Devanagari normalizer and acoustic neural style blends.
    """
    if not tts_engine.is_available:
        raise HTTPException(
            status_code=503,
            detail="Kokoro-82M TTS engine is unavailable or weights not loaded."
        )

    # Resolve voice based on speaker role if not explicitly provided
    target_voice = req.voice
    if not target_voice:
        if req.speaker == "Customer":
            target_voice = "customer_male"
        else:
            target_voice = "shark_agent_alpha"

    try:
        audio_b64, clean_text = tts_engine.synthesize_base64(
            text=req.text,
            voice=target_voice,
            speed=req.speed,
        )
        wav_bytes, sr, _ = tts_engine.synthesize(text=req.text, voice=target_voice, speed=req.speed)
        num_samples = (len(wav_bytes) - 44) // 2
        duration_sec = round(max(0.1, num_samples / sr), 2)

        return SynthesizeResponse(
            success=True,
            audio_base64=audio_b64,
            sample_rate=sr,
            duration_approx_sec=duration_sec,
            voice_used=target_voice,
            clean_text=clean_text,
        )
    except Exception as e:
        logger.error(f"Kokoro synthesis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")


@router.post("/session-audio", response_model=BatchSessionAudioResponse)
async def synthesize_dialogue_session(req: BatchSessionAudioRequest):
    """
    Synthesizes neural Kokoro audio for an entire multi-turn voice recovery session.
    """
    if not tts_engine.is_available:
        raise HTTPException(
            status_code=503,
            detail="Kokoro-82M TTS engine is unavailable."
        )

    processed_turns: List[DialogueTurnAudioItem] = []
    for turn in req.dialogue:
        speaker = turn.get("speaker", "AI_Agent")
        text = turn.get("text", "")
        emotion = turn.get("emotion", "neutral")
        timestamp_sec = turn.get("timestamp_sec", 0)

        voice = req.agent_voice if speaker == "AI_Agent" else req.customer_voice

        try:
            b64_audio, clean_text = tts_engine.synthesize_base64(text=text, voice=voice, speed=req.speed)
        except Exception as e:
            logger.warning(f"Failed to synthesize turn text ({text[:30]}...): {e}")
            b64_audio = None
            clean_text = text

        processed_turns.append(
            DialogueTurnAudioItem(
                speaker=speaker,
                text=text,
                emotion=emotion,
                timestamp_sec=timestamp_sec,
                audio_base64=b64_audio,
                voice_used=voice,
                devanagari_normalized=clean_text,
            )
        )

    return BatchSessionAudioResponse(
        success=True,
        dialogue=processed_turns,
        model_engine="Kokoro-82M ONNX + Devanagari G2P",
    )
