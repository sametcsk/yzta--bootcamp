import re

from .bias_catalog import bias_name_tr, normalize_bias_label


BIAS_TEXT_SIGNALS = {
    "loss_aversion": (
        r"\briske?\s+giremem\b",
        r"\brisk(?:e|i)?\s+(?:girmem|almam|istemem)\b",
        r"\bkaybetmek\s+istemem\b",
        r"\bgaranti(?:ye|li)?\b",
        r"\bkesin\s+olan\b",
    ),
    "anchoring": (
        r"\beski\s+(?:fiyat|rakam|değer)\b",
        r"\bilk\s+(?:fiyat|rakam)\b",
        r"\b\d+\s*(?:tl|dolar|bin).*\bverdim\b",
    ),
    "mental_accounting": (
        r"\bbütçeme?\b",
        r"\bayrı\s+(?:hesap|bütçe|para)\b",
        r"\bkenara\s+ayır",
        r"\bparanın\s+kaynağı\b",
    ),
    "disposition_effect": (
        r"\bkârı\s+(?:kilitle|garantiye\s+al)\b",
        r"\bzarar(?:ına|da)\s+satmam\b",
        r"\bkaybedeni\s+tut",
    ),
    "present_bias": (
        r"\bhemen\b",
        r"\bşimdi\b",
        r"\bbugün\b",
        r"\bbekleyemem\b",
        r"\bkim\s+bekleyecek\b",
    ),
    "overconfidence": (
        r"\bben\s+bilirim\b",
        r"\bkesin\s+(?:yükselecek|düşecek|olacak)\b",
        r"\bemini[mz]?\b",
    ),
    "herd_behavior": (
        r"\bherkes\b",
        r"\bben\s+de\s+(?:gir|al|sat)",
        r"\bfırsatı\s+kaçıramam\b",
        r"\bkalabalığı\s+takip\b",
    ),
    "status_quo_bias": (
        r"\bbildiğimden\s+şaşmam\b",
        r"\bdeğiştirmem\b",
        r"\bmevcut\s+(?:durum|düzen)\b",
        r"\baynı\s+şekilde\s+devam\b",
    ),
    "sunk_cost": (
        r"\bzaten\s+(?:harcadım|ödedim|verdim)\b",
        r"\bboşa\s+gitmesin\b",
        r"\bonca\s+(?:para|zaman|emek)\b",
        r"\bgeçmiş\s+maliyet\b",
        r"\bbırakamam\b",
    ),
    "moral_hazard": (
        r"\bbaşkası\s+öde",
        r"\bsigorta\s+karşılar\b",
        r"\bsonucunu\s+başkası\b",
        r"\bsorumluluk\s+başkasında\b",
    ),
    "confirmation_bias": (
        r"\bfikrimi\s+destek",
        r"\bters\s+kanıt",
        r"\bzaten\s+haklı",
        r"\bsadece\s+destekleyen\b",
    ),
}


def _event_history(data: dict) -> list:
    return data.get("event_history") or data.get("event_gecmisi") or data.get("event_kayitlari") or []


def _selected_option(data: dict) -> str:
    return str(data.get("selected_option") or data.get("secim_metin") or "").strip()


def _option_effects(data: dict) -> dict:
    effects = data.get("option_effects") or data.get("secim_etkileri") or {}
    return effects if isinstance(effects, dict) else {}


def _signal_scores(text: str) -> dict[str, int]:
    normalized_text = text.casefold()
    return {
        label: sum(bool(re.search(pattern, normalized_text)) for pattern in patterns)
        for label, patterns in BIAS_TEXT_SIGNALS.items()
    }


def _resolve_bias_label(data: dict) -> tuple[str, str]:
    raw_label = normalize_bias_label(
        data.get("bias_label") or data.get("bias_etiketi") or data.get("bias")
    )
    selected_option = _selected_option(data)
    scores = _signal_scores(selected_option)
    best_label, best_score = max(scores.items(), key=lambda item: item[1])
    raw_score = scores.get(raw_label, 0)

    if best_score > raw_score and best_score > 0:
        return best_label, "selected_option_override"
    if raw_label != "unknown":
        return raw_label, "event_label_confirmed"
    if best_score > 0:
        return best_label, "selected_option_inference"
    return "unknown", "neutral_signal"


def _history_label(item: dict) -> str:
    return _resolve_bias_label(item)[0]


def _high_impact(data: dict, effects: dict) -> bool:
    if data.get("high_impact") or data.get("buyuk_etki"):
        return True
    numeric_effects = [
        value
        for value in effects.values()
        if isinstance(value, (int, float))
    ]
    return any(abs(value) >= 1000 for value in numeric_effects)


def analyze_decision(data: dict) -> dict:
    raw_label = data.get("bias_label") or data.get("bias_etiketi") or data.get("bias")
    source_bias = normalize_bias_label(raw_label)
    detected_bias, resolution = _resolve_bias_label(data)
    history = _event_history(data)
    labels = [_history_label(item) for item in history]
    occurrence_count = labels.count(detected_bias) if history else 1
    event_title = data.get("event_title") or data.get("event_baslik") or "İsimsiz event"
    selected_option = _selected_option(data) or "Seçim bilgisi yok"
    effects = _option_effects(data)
    high_impact = _high_impact(data, effects)
    bias_scores = data.get("bias_scores") or (data.get("profile") or {}).get("bias_scores") or {}
    profile_bias_score = bias_scores.get(detected_bias)
    evidence = f'"{event_title}" olayında "{selected_option}" seçeneği tercih edildi.'
    if effects:
        evidence += f" Seçenek etkileri: {effects}."
    if isinstance(profile_bias_score, (int, float)):
        evidence += f" Başlangıç profilindeki {bias_name_tr(detected_bias)} skoru {round(profile_bias_score)}/100."
    return {
        "agent": "decision_analyst_agent",
        "source_bias_label": source_bias,
        "detected_bias": detected_bias,
        "bias_name_tr": bias_name_tr(detected_bias),
        "bias_resolution": resolution,
        "evidence": evidence,
        "option_effects": effects,
        "profile_bias_score": profile_bias_score,
        "high_impact": high_impact,
        "decision_count": len(history) or 1,
        "occurrence_count": occurrence_count,
    }


karar_analizi_yap = analyze_decision
