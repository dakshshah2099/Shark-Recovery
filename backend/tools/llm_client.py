import json
import logging
from typing import Any, Dict, List, Optional
import litellm

try:
    from backend.config import settings
except ImportError:
    from config import settings

logger = logging.getLogger(__name__)

# Suppress noisy LiteLLM telemetry and debug logs
litellm.suppress_debug_info = True
litellm.drop_params = True


def get_llm_credentials() -> tuple[Optional[str], str]:
    """
    Returns (api_key, model_identifier) formatted for LiteLLM.
    Supports Google Gemini, OpenAI, and custom LiteLLM prefixes.
    """
    api_key = settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY
    if api_key:
        model = settings.LLM_MODEL
        if not model.startswith("gemini/") and not model.startswith("google/"):
            clean_model = model.replace("google:", "").replace("google-gla:", "")
            model = f"gemini/{clean_model}"
        return api_key, model

    if settings.OPENAI_API_KEY:
        return settings.OPENAI_API_KEY, "gpt-4o-mini"

    return None, settings.LLM_MODEL


async def complete_json_prompt(
    system_prompt: str,
    user_prompt: str,
    timeout: float = 12.0,
) -> Optional[Dict[str, Any]]:
    """
    Calls LLM via LiteLLM with structured JSON parsing.
    Returns parsed dict on success, or None on failure/fallback.
    """
    api_key, model = get_llm_credentials()
    if not api_key:
        logger.info("No LLM API key configured. Utilizing heuristic agent fallback.")
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
        logger.warning(f"LiteLLM invocation failed ({type(e).__name__}: {e}). Falling back to heuristic rule engine.")
        return None
