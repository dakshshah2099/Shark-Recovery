import json
import logging
import os
from typing import Any, Dict, List, Optional, Tuple
import litellm

try:
    from backend.config import settings
except ImportError:
    from config import settings

logger = logging.getLogger(__name__)

# Suppress noisy LiteLLM telemetry and debug logs
litellm.suppress_debug_info = True
litellm.drop_params = True


def get_llm_credentials() -> Tuple[Optional[str], str]:
    """
    Returns (api_key, model_identifier) optimized for Groq and Google Gemini via LiteLLM.
    """
    # 1. Sync environment variables for LiteLLM
    if settings.GROQ_API_KEY:
        os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
    if settings.GEMINI_API_KEY:
        os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
    if settings.GOOGLE_API_KEY:
        os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY

    model = settings.LLM_MODEL or "groq/llama-3.3-70b-versatile"

    # 2. Check if user configured Groq
    if model.startswith("groq/") or (settings.GROQ_API_KEY and not model.startswith("gemini/")):
        if settings.GROQ_API_KEY:
            if not model.startswith("groq/"):
                model = f"groq/{model}"
            return settings.GROQ_API_KEY, model

    # 3. Check if user configured Gemini
    gemini_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY
    if gemini_key:
        if not model.startswith("gemini/") and not model.startswith("google/"):
            clean_model = model.replace("google:", "").replace("google-gla:", "")
            model = f"gemini/{clean_model}"
        return gemini_key, model

    # 4. Check OpenAI fallback if provided
    if settings.OPENAI_API_KEY:
        return settings.OPENAI_API_KEY, "gpt-4o-mini"

    # Return configured Groq key if available
    if settings.GROQ_API_KEY:
        return settings.GROQ_API_KEY, "groq/llama-3.3-70b-versatile"

    return None, model


async def complete_json_prompt(
    system_prompt: str,
    user_prompt: str,
    timeout: float = 12.0,
) -> Optional[Dict[str, Any]]:
    """
    Calls LLM (Groq / Gemini / OpenAI) via LiteLLM with structured JSON parsing.
    Returns parsed dict on success, or None on failure/fallback to deterministic rule engine.
    """
    api_key, model = get_llm_credentials()
    if not api_key:
        logger.info("No active Groq or Gemini API key configured. Utilizing heuristic agent fallback.")
        return None

    try:
        messages = [
            {"role": "system", "content": system_prompt + "\n\nCRITICAL: Respond STRICTLY with valid JSON. Do NOT wrap in markdown backticks."},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(f"Dispatching LLM call to LiteLLM with model: {model}")
        response = await litellm.acompletion(
            model=model,
            api_key=api_key,
            messages=messages,
            temperature=0.2,
            timeout=timeout,
        )

        content = response.choices[0].message.content.strip()
        # Strip markdown fences if present
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        return json.loads(content)

    except Exception as e:
        logger.warning(f"LiteLLM call failed on {model} ({type(e).__name__}: {e}). Falling back to heuristic rule engine.")
        return None
