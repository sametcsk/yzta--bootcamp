from collections import Counter

from .bias_catalog import bias_name_tr, normalize_bias_label


def _event_history(data: dict) -> list[dict]:
    return data.get("event_history") or data.get("event_gecmisi") or data.get("event_kayitlari") or []


def build_agent_memory(data: dict) -> dict:
    """Build a small, session-scoped memory summary from deterministic game data."""
    history = _event_history(data)
    labels = [
        normalize_bias_label(item.get("bias_label") or item.get("bias_etiketi") or item.get("bias"))
        for item in history
    ]
    counts = Counter(label for label in labels if label)
    repeated_biases = [
        {"bias_label": label, "bias_name_tr": bias_name_tr(label), "count": count}
        for label, count in counts.most_common()
        if count > 1
    ]
    recent_decisions = [
        {
            "year": item.get("year", item.get("yil")),
            "event_title": item.get("event_title") or item.get("event_baslik"),
            "selected_option": item.get("selected_option") or item.get("secim_metin"),
            "bias_label": normalize_bias_label(
                item.get("bias_label") or item.get("bias_etiketi") or item.get("bias")
            ),
        }
        for item in history[-3:]
    ]
    supplied_memory = data.get("agent_memory") or {}
    profile = data.get("profile") or {}
    profile_bias_scores = (
        data.get("bias_scores")
        or profile.get("bias_scores")
        or supplied_memory.get("profile_bias_scores")
        or {}
    )
    previous_coach_insights = (
        data.get("previous_coach_insights")
        or supplied_memory.get("previous_coach_insights")
        or []
    )[-3:]
    return {
        "scope": "current_game_session",
        "decision_count": len(history),
        "bias_counts": dict(counts),
        "repeated_biases": repeated_biases,
        "recent_decisions": recent_decisions,
        "profile_bias_scores": profile_bias_scores,
        "previous_coach_insights": previous_coach_insights,
    }


def memory_context(memory: dict, current_bias: str | None = None) -> str:
    current_label = normalize_bias_label(current_bias)
    count = memory.get("bias_counts", {}).get(current_label, 0)
    profile_score = memory.get("profile_bias_scores", {}).get(current_label)
    recent_text = "; ".join(
        f'{item.get("event_title")}: {item.get("selected_option")}'
        for item in memory.get("recent_decisions", [])
        if item.get("event_title") and item.get("selected_option")
    )
    profile_text = (
        f" Başlangıç profilindeki ilgili skor: {round(profile_score)}/100."
        if isinstance(profile_score, (int, float))
        else ""
    )
    return (
        f'Toplam karar: {memory.get("decision_count", 0)}. '
        f'Bu eğilimin görülme sayısı: {count}. '
        f'Son kararlar: {recent_text or "Henüz yeterli geçmiş yok"}.{profile_text}'
    )


ajan_hafizasi_olustur = build_agent_memory
