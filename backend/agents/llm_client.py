import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass


DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


def gemini_hazir_mi() -> bool:
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def llm_zorunlu_mu() -> bool:
    return os.getenv("REQUIRE_LLM", "false").strip().lower() in {"1", "true", "yes", "on"}


def _http_error_type(status_code: int) -> str:
    if status_code in {401, 403}:
        return "auth_error"
    if status_code == 404:
        return "model_not_found"
    if status_code == 429:
        return "rate_limit"
    if status_code >= 500:
        return "network_error"
    return "unknown"


def llm_response_metadata(result: dict, accepted: bool) -> dict:
    if result.get("status") == "success" and accepted:
        source = "gemini"
    elif result.get("status") == "error":
        source = "llm_error"
    elif result.get("status") == "success":
        source = "safety_fallback"
    else:
        source = "rule_based_fallback"
    return {
        "llm_enabled": bool(result.get("llm_enabled")),
        "generation_source": source,
        "llm_error_type": result.get("error_type"),
    }


def metin_uret(system_prompt: str, user_prompt: str, timeout: int = 12) -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip() or DEFAULT_GEMINI_MODEL
    if not api_key:
        return {"status": "disabled", "text": None, "model": model, "llm_enabled": False, "error_type": None}

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 500,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }
    request = Request(
        endpoint,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
        text = payload["candidates"][0]["content"]["parts"][0]["text"].strip()
        return {"status": "success", "text": text, "model": model, "llm_enabled": True, "error_type": None}
    except HTTPError as exc:
        error_type = _http_error_type(exc.code)
    except (URLError, TimeoutError):
        error_type = "network_error"
    except (KeyError, IndexError, json.JSONDecodeError, ValueError):
        error_type = "unknown"
    return {"status": "error", "text": None, "model": model, "llm_enabled": True, "error_type": error_type}
