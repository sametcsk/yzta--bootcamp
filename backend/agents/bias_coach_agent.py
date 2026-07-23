from .bias_catalog import BIAS_DEFINITIONS, bias_name_tr, normalize_bias_label
from .llm_client import gemini_hazir_mi, llm_response_metadata, metin_uret
from .memory_agent import build_agent_memory, memory_context
from .rag_service import ilgili_kaynaklari_getir, kaynak_baglamini_olustur
from .safety_agent import guvenli_metin_veya_fallback


COACH_CONTENT = {
    "loss_aversion": (
        "Kayıp ihtimalinden hızla uzaklaşmak koruyucu görünebilir; fakat korku uzun vadeli planın önüne geçebilir.",
        "Bu seçimi planına uyduğu için mi, kayıp korkusuyla mı yaptın?",
    ),
    "anchoring": (
        "Eski bir fiyat veya ilk duyduğun rakam güncel koşulları değerlendirmeni zorlaştırmış olabilir.",
        "Bugünkü tablo değişseydi aynı seçimi yapar mıydın?",
    ),
    "mental_accounting": (
        "Parayı ayrı zihinsel kutulara koymak düzen sağlar; fakat toplam finansal tabloyu gizleyebilir.",
        "Bu parayı diğer kaynaklarından neden farklı değerlendirdin?",
    ),
    "disposition_effect": (
        "Kazancı hızla kesinleştirmek veya kaybı kabul etmemek kısa vadede rahatlatabilir, ama stratejiyi bozabilir.",
        "Kararını sonuçtan kaçınma isteği mi, önceden belirlediğin kural mı yönetti?",
    ),
    "present_bias": (
        "Bugünün rahatlığı gelecekteki hedeflerden daha görünür hale gelmiş olabilir.",
        "Bu seçimin gelecekteki bütçene etkisini nasıl tarif edersin?",
    ),
    "overconfidence": (
        "Kendi tahminine güvenmek faydalıdır; belirsizliği küçümsemek ise riski görünmez kılabilir.",
        "Tahmininin yanlış çıkabileceği bir senaryo düşündün mü?",
    ),
    "herd_behavior": (
        "Başkalarının seçimi bilgi verebilir; fakat tek başına karar gerekçesi değildir.",
        "Kalabalığın ne yaptığını bilmeseydin aynı seçimi yapar mıydın?",
    ),
    "status_quo_bias": (
        "Mevcut durumu korumak istikrar sağlar; koşullar değiştiğinde fırsat maliyeti yaratabilir.",
        "Seçeneği gerçekten uygun olduğu için mi, değişmemek daha kolay olduğu için mi seçtin?",
    ),
    "sunk_cost": (
        "Geçmişte harcanan para veya zaman geri gelmez; bugünkü karar gelecekteki sonuçlara göre değerlendirilebilir.",
        "Geçmiş maliyet hiç olmasaydı bugün yine aynı seçimi yapar mıydın?",
    ),
    "moral_hazard": (
        "Bir kararın sonucunu başkası üstlendiğinde risk daha küçük algılanabilir.",
        "Sonucun tamamını sen üstlenseydin aynı riski alır mıydın?",
    ),
}

BIAS_LIBRARY = {
    label: {
        "name_tr": details["name_tr"],
        "title": details["title"],
        "comment": COACH_CONTENT.get(
            label,
            ("Kararını planınla karşılaştır.", "Bu seçimi hangi bilgiye dayanarak yaptın?"),
        )[0],
        "question": COACH_CONTENT.get(label, ("", "Bu seçimi hangi bilgiye dayanarak yaptın?"))[1],
    }
    for label, details in BIAS_DEFINITIONS.items()
}

COACH_SYSTEM_PROMPT = (
    "You are a behavioral finance coach inside a Turkish financial simulation game. "
    "Your job is to explain the player's latest decision in a short, educational, non-judgmental way. "
    "Write the final answer in Turkish only. Use simple Turkish financial literacy language. "
    "Never give investment advice. Never tell the player to buy, sell, hold, add to portfolio, or avoid an asset. "
    "Do not promise returns, do not use diagnostic or clinical language, and do not shame the player. "
    "Focus on decision awareness, trade-offs, and the behavioral tendency visible in the latest choice."
)

COACH_USER_PROMPT_TEMPLATE = (
    "Latest game decision:\n"
    "- Event title: {event_title}\n"
    "- Selected option: {selected_option}\n"
    "- Detected behavioral tendency: {bias_name}\n\n"
    "Session memory summary:\n"
    "{memory_summary}\n\n"
    "RAG source context:\n"
    "{rag_context}\n\n"
    "Write one short Turkish coach comment with these rules:\n"
    "1. Maximum 55 Turkish words.\n"
    "2. Anchor the comment to the latest event and selected option.\n"
    "3. If the same tendency appeared before, mention the repetition gently in one sentence.\n"
    "4. If there is no repetition, do not imply that it repeated.\n"
    "5. Use the RAG context only as background; do not cite long source names in the comment.\n"
    "6. End with awareness, not advice. Do not recommend a financial action."
)


def _event_history(data: dict) -> list:
    return data.get("event_history") or data.get("event_gecmisi") or data.get("event_kayitlari") or []


def _history_label(item: dict) -> str:
    return normalize_bias_label(item.get("bias") or item.get("bias_label") or item.get("bias_etiketi"))


def _coach_trigger(data: dict, bias_label: str) -> tuple[bool, str, int, int]:
    history = _event_history(data)
    labels = [_history_label(item) for item in history]
    decision_count = len(history) or 1
    occurrence_count = labels.count(bias_label) if labels else 1
    if decision_count == 1:
        return True, "İlk karar değerlendirmesi", occurrence_count, decision_count
    if data.get("high_impact") or data.get("buyuk_etki"):
        return True, "Finansal etkisi yüksek karar", occurrence_count, decision_count
    if occurrence_count == 1:
        return True, "Yeni bir davranış eğilimi görüldü", occurrence_count, decision_count
    if occurrence_count % 3 == 0:
        return True, f"Aynı eğilim {occurrence_count}. kez tekrarlandı", occurrence_count, decision_count
    if decision_count % 5 == 0:
        return True, f"{decision_count} kararlık ara değerlendirme", occurrence_count, decision_count
    return False, "Karar geçmişe kaydedildi", occurrence_count, decision_count


def generate_coach_comment(data: dict) -> dict:
    decision_analysis = data.get("decision_analysis") or {}
    source_label = data.get("bias_label") or data.get("bias_etiketi") or data.get("bias")
    label = normalize_bias_label(decision_analysis.get("detected_bias") or source_label)
    content = COACH_CONTENT.get(
        label,
        (
            "Bu kararın planınla ve hedeflerinle ilişkisini gözden geçirmek faydalı olabilir.",
            "Bu seçimi hangi bilgiye dayanarak yaptın?",
        ),
    )
    should_show, reason, count, decision_count = _coach_trigger(data, label)
    event_title = data.get("event_title") or data.get("event_baslik")
    selected_option = data.get("selected_option") or data.get("secim_metin")
    agent_memory = data.get("agent_memory") or build_agent_memory(data)
    memory_summary = memory_context(agent_memory, label)
    fallback = (
        f'"{event_title}" olayında "{selected_option}" seçimini yaptın. {content[0]}'
        if event_title and selected_option
        else content[0]
    )
    sources = (
        data.get("rag_sources") or ilgili_kaynaklari_getir(label, "bias_coach_agent", limit=2)
    ) if should_show else []
    llm_result = {"status": "not_requested", "text": None, "llm_enabled": gemini_hazir_mi(), "error_type": None}
    llm_safe = False
    if should_show:
        llm_result = metin_uret(
            COACH_SYSTEM_PROMPT,
            COACH_USER_PROMPT_TEMPLATE.format(
                event_title=event_title,
                selected_option=selected_option,
                bias_name=bias_name_tr(label),
                memory_summary=memory_summary,
                rag_context=kaynak_baglamini_olustur(sources),
            ),
        )
        coach_comment, llm_safe = guvenli_metin_veya_fallback(llm_result.get("text"), fallback)
    else:
        coach_comment = fallback
    return {
        "agent": "bias_coach_agent",
        "year": data.get("year", data.get("yil")),
        "event_title": event_title,
        "selected_option": selected_option,
        "profile_type": data.get("profile_type"),
        "source_bias_label": source_label,
        "bias_label": label,
        "bias_name_tr": bias_name_tr(label),
        "coach_title": BIAS_DEFINITIONS.get(label, {}).get("title", "Karar Farkındalığı"),
        "coach_comment": coach_comment,
        "reflection_question": content[1],
        "should_show": should_show,
        "trigger_reason": reason,
        "occurrence_count": count,
        "decision_count": decision_count,
        "decision_analysis": decision_analysis or None,
        "agent_memory": agent_memory,
        "sources": sources,
        **llm_response_metadata(llm_result, llm_safe),
        "disclaimer": "Bu yorum yatırım tavsiyesi değildir; karar davranışını anlamaya yöneliktir.",
    }


koc_yorumu_uret = generate_coach_comment
