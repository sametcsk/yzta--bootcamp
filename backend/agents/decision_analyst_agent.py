from .bias_catalog import bias_name_tr, normalize_bias_label


def _event_history(data: dict) -> list:
    return data.get("event_history") or data.get("event_gecmisi") or data.get("event_kayitlari") or []


def analyze_decision(data: dict) -> dict:
    raw_label = data.get("bias_label") or data.get("bias_etiketi") or data.get("bias")
    detected_bias = normalize_bias_label(raw_label)
    history = _event_history(data)
    labels = [
        normalize_bias_label(item.get("bias_label") or item.get("bias_etiketi") or item.get("bias"))
        for item in history
    ]
    occurrence_count = labels.count(detected_bias) if history else 1
    event_title = data.get("event_title") or data.get("event_baslik") or "İsimsiz event"
    selected_option = data.get("selected_option") or data.get("secim_metin") or "Seçim bilgisi yok"
    high_impact = bool(data.get("high_impact") or data.get("buyuk_etki"))
    bias_scores = data.get("bias_scores") or (data.get("profile") or {}).get("bias_scores") or {}
    profile_bias_score = bias_scores.get(detected_bias)
    evidence = f'"{event_title}" olayında "{selected_option}" seçeneği tercih edildi.'
    if isinstance(profile_bias_score, (int, float)):
        evidence += f" Başlangıç profilindeki {bias_name_tr(detected_bias)} skoru {round(profile_bias_score)}/100."
    return {
        "agent": "decision_analyst_agent",
        "detected_bias": detected_bias,
        "bias_name_tr": bias_name_tr(detected_bias),
        "evidence": evidence,
        "profile_bias_score": profile_bias_score,
        "high_impact": high_impact,
        "decision_count": len(history) or 1,
        "occurrence_count": occurrence_count,
    }


karar_analizi_yap = analyze_decision
