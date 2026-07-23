from .bias_catalog import CORE_BIASES, bias_name_tr, normalize_bias_label
from .llm_client import gemini_hazir_mi, llm_response_metadata, metin_uret
from .memory_agent import build_agent_memory
from .rag_service import ilgili_kaynaklari_getir, kaynak_baglamini_olustur
from .safety_agent import guvenli_metin_veya_fallback


FINAL_REPORT_SYSTEM_PROMPT = (
    "You are the final behavioral finance report agent of a Turkish financial simulation game. "
    "Your task is to summarize the player's decision patterns for education and self-reflection. "
    "Write the final answer in Turkish only. Do not give investment advice, do not recommend buying or selling, "
    "do not promise returns, and do not use diagnostic or clinical language. "
    "Explain the behavioral pattern as an in-game educational observation, not as a psychological label. "
    "Use concise, clear, supportive Turkish suitable for a bootcamp demo."
)

FINAL_REPORT_USER_PROMPT_TEMPLATE = (
    "Player report data:\n"
    "- Profile name: {profile_name}\n"
    "- Total decision count: {decision_count}\n"
    "- Combined bias scores: {scores}\n"
    "- Scoring method: when both inputs exist, approximately 30% intro profile and 70% gameplay behavior.\n"
    "- Dominant tendency: {dominant_name}\n\n"
    "Session memory:\n"
    "{agent_memory}\n\n"
    "RAG source context:\n"
    "{rag_context}\n\n"
    "Fallback Turkish draft:\n"
    "{fallback_summary}\n\n"
    "Write one Turkish final report summary with these rules:\n"
    "1. Maximum 90 Turkish words.\n"
    "2. Mention that this is based on the player's in-game decisions and intro tendencies.\n"
    "3. Mention the dominant behavioral tendency naturally.\n"
    "4. Include one educational insight about decision habits.\n"
    "5. Do not mention exact investment actions, assets to buy/sell, or guaranteed outcomes.\n"
    "6. Do not sound like a medical or psychological diagnosis.\n"
    "7. Keep the tone clear, useful, and presentation-ready."
)


def _history(data: dict) -> list:
    return data.get("event_history") or data.get("event_gecmisi") or data.get("event_kayitlari") or []


def _clamp(value) -> float:
    try:
        return max(0.0, min(100.0, float(value)))
    except (TypeError, ValueError):
        return 0.0


def _gameplay_scores(metrics: dict, history: list[dict]) -> tuple[dict, dict]:
    totals = {label: 0.0 for label in CORE_BIASES}
    counts = {label: 0 for label in CORE_BIASES}
    event_scores = metrics.get("eventSkorlari") or {}
    event_counts = metrics.get("eventSayilari") or {}
    for raw_label, count in event_counts.items():
        label = normalize_bias_label(raw_label)
        if label in totals and count:
            totals[label] += _clamp(event_scores.get(raw_label, 0) / count * (100 / 15))
            counts[label] += 1
    history_counts = {label: 0 for label in CORE_BIASES}
    for item in history:
        label = normalize_bias_label(item.get("bias_label") or item.get("bias_etiketi") or item.get("bias"))
        if label in history_counts:
            history_counts[label] += 1
    total_history_evidence = sum(history_counts.values())
    for label, count in history_counts.items():
        if count and total_history_evidence:
            totals[label] += count / total_history_evidence * 100
            counts[label] += 1
    scores = {label: round(totals[label] / counts[label]) if counts[label] else None for label in CORE_BIASES}
    return scores, counts


def calculate_bias_scores(metrics: dict, intro_scores: dict | None = None, history: list[dict] | None = None) -> dict:
    gameplay, evidence = _gameplay_scores(metrics or {}, history or [])
    intro = {normalize_bias_label(key): _clamp(value) for key, value in (intro_scores or {}).items()}
    combined = {}
    for label in CORE_BIASES:
        has_intro = label in intro
        has_gameplay = evidence[label] > 0
        if has_intro and has_gameplay:
            combined[label] = round(0.3 * intro[label] + 0.7 * gameplay[label])
        elif has_gameplay:
            combined[label] = gameplay[label]
        elif has_intro:
            combined[label] = round(intro[label])
        else:
            combined[label] = None
    return {
        "scores": combined,
        "intro_scores": intro,
        "gameplay_scores": gameplay,
        "evidence_counts": evidence,
        "weights": {"intro": 0.3, "gameplay": 0.7},
    }


def _dominant(scores: dict) -> str | None:
    available = {label: value for label, value in scores.items() if value is not None}
    return max(available, key=available.get) if available else None


def generate_final_report(data: dict) -> dict:
    profile = data.get("profile") or {}
    final_state = data.get("final_state") or data.get("son_durum") or {}
    history = _history(data)
    agent_memory = build_agent_memory(data)
    analysis = calculate_bias_scores(final_state.get("bias_metrics") or {}, profile.get("bias_scores") or {}, history)
    scores = analysis["scores"]
    dominant = _dominant(scores)
    profile_name = profile.get("profile_name") or profile.get("profile_type") or "Belirsiz Profil"
    dominant_name = bias_name_tr(dominant) if dominant else "Yeterli veri yok"
    sources = ilgili_kaynaklari_getir(dominant, "final_report_agent", limit=3) if dominant else []
    if dominant:
        fallback_summary = (
            f"{len(history)} oyun kararın ve başlangıç eğilimlerin birlikte değerlendirildi. "
            f"En görünür örüntü {dominant_name} oldu; bu bir tanı değil, oyun içindeki kararlarının eğitsel bir özetidir."
        )
        strengths = [
            "Karar geçmişini karşılaştırılabilir bir veri haline getirdin.",
            "Davranış eğilimlerini fark etmek için yeterli örnek oluşturdun.",
        ]
        growth_areas = [
            f"{dominant_name} ortaya çıktığında karar gerekçeni bir cümleyle kaydet.",
            "Karar öncesi planınla karar sonrası sonucu ayrı ayrı değerlendir.",
        ]
    else:
        fallback_summary = (
            "Davranışsal bir eğilim belirlemek için yeterli başlangıç veya oyun kararı verisi bulunmuyor. "
            "Daha fazla karar oluştuğunda rapor anlamlı bir karşılaştırma sunabilir."
        )
        strengths = ["Eksik veri varken kesin bir sonuca gidilmedi."]
        growth_areas = ["Raporu birkaç anlamlı oyun kararından sonra yeniden oluştur."]
    llm_result = (
        metin_uret(
            FINAL_REPORT_SYSTEM_PROMPT,
            FINAL_REPORT_USER_PROMPT_TEMPLATE.format(
                profile_name=profile_name,
                decision_count=len(history),
                scores=scores,
                dominant_name=dominant_name,
                agent_memory=agent_memory,
                rag_context=kaynak_baglamini_olustur(sources),
                fallback_summary=fallback_summary,
            ),
        )
        if dominant
        else {"status": "not_requested", "text": None, "llm_enabled": gemini_hazir_mi(), "error_type": None}
    )
    summary, llm_safe = guvenli_metin_veya_fallback(llm_result.get("text"), fallback_summary)
    llm_metadata = llm_response_metadata(llm_result, llm_safe)
    return {
        "agent": "final_report_agent",
        "title": "Davranışsal Finans Değerlendirmesi",
        "profile_type": profile.get("profile_type"),
        "profile_name": profile_name,
        "decision_count": len(history),
        "dominant_bias": dominant,
        "dominant_bias_name_tr": dominant_name,
        "bias_scores": scores,
        "bias_details": analysis,
        "summary": summary,
        "strengths": strengths,
        "growth_areas": growth_areas,
        "sources": sources,
        **llm_metadata,
        "agent_memory": agent_memory,
        "final_state": final_state,
        "disclaimer": (
            "Bu değerlendirme yatırım tavsiyesi veya psikolojik tanı değildir; "
            "yalnızca oyun içindeki davranış örüntülerini açıklar."
        ),
    }


final_rapor_uret = generate_final_report
