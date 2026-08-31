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
    Strictly reads the model name directly from settings.LLM_MODEL without auto-routing,
    and pairs it with the corresponding provider API key (Groq or Gemini).
    """
    model = settings.LLM_MODEL.strip() if settings.LLM_MODEL else "groq/openai/gpt-oss-120b"

    # Sync environment variables for LiteLLM provider integrations
    if settings.GROQ_API_KEY:
        os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
    if settings.GEMINI_API_KEY:
        os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY

    # Determine corresponding API key based on exact model prefix specified in .env
    if model.startswith("groq/"):
        return settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY"), model

    if model.startswith("gemini/") or model.startswith("google/"):
        return settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY"), model

    # Fallback to configured key
    key = settings.GROQ_API_KEY or settings.GEMINI_API_KEY
    return key, model


async def complete_json_prompt(
    system_prompt: str,
    user_prompt: str,
    timeout: float = 12.0,
) -> Optional[Dict[str, Any]]:
    """
    Dispatches prompt to the exact LLM model specified in settings.LLM_MODEL.
    Returns structured JSON on success, or None on failure/fallback to deterministic rule engine.
    """
    api_key, model = get_llm_credentials()
    if not api_key:
        logger.info(f"No API key provided for model '{model}'. Utilizing heuristic agent fallback.")
        return None

    try:
        messages = [
            {"role": "system", "content": system_prompt + "\n\nCRITICAL: Respond STRICTLY with valid JSON. Do NOT wrap in markdown backticks."},
            {"role": "user", "content": user_prompt},
        ]

        logger.info(f"Dispatching LLM call to LiteLLM with explicit model: {model}")
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
        logger.warning(f"LiteLLM call failed on '{model}' ({type(e).__name__}: {e}). Falling back to heuristic rule engine.")
        return None
