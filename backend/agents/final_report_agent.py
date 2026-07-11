from collections import Counter

from .bias_coach_agent import BIAS_LIBRARY


def _bias_name(label: str) -> str:
    return BIAS_LIBRARY.get(label, {}).get("name_tr", "Davranissal Sinyal")


def _normalize_history(data: dict) -> list:
    return (
        data.get("event_history")
        or data.get("event_gecmisi")
        or data.get("event_kayitlari")
        or []
    )


def generate_final_report(data: dict) -> dict:
    profile = data.get("profile") or {}
    final_state = data.get("final_state") or data.get("son_durum") or {}
    history = _normalize_history(data)

    bias_labels = [
        item.get("bias")
        or item.get("bias_label")
        or item.get("bias_etiketi")
        or "bilinmiyor"
        for item in history
    ]
    counts = Counter(bias_labels)
    dominant_label = counts.most_common(1)[0][0] if counts else None

    strengths = []
    growth_areas = []

    profile_strength = profile.get("main_strength")
    profile_growth = profile.get("growth_area")
    if profile_strength:
        strengths.append(profile_strength)
    if profile_growth:
        growth_areas.append(profile_growth)

    if dominant_label == "loss_aversion":
        growth_areas.append("Dususte hizli rahatlama arayisi uzun vadeli planini zayiflatabilir.")
    elif dominant_label == "anchoring":
        growth_areas.append("Gecmis fiyatlara fazla baglanmak guncel kosullari degerlendirmeyi zorlastirabilir.")
    elif dominant_label == "mental_accounting":
        growth_areas.append("Parayi farkli kutulara ayirmak toplam finansal resmi gormeyi zorlastirabilir.")
    elif dominant_label == "overconfidence":
        growth_areas.append("Belirsizligi kucumsememek risk yonetimini guclendirir.")
    elif dominant_label:
        growth_areas.append("Kararlarini plan, risk ve zaman ufku acisindan tekrar degerlendirmek faydali olabilir.")

    if not strengths:
        strengths.append("Karar gecmisin finansal davranislarini analiz etmek icin yeterli veri uretmeye basladi.")
    if not growth_areas:
        growth_areas.append("Daha fazla event karari verdikce davranissal egilimlerin daha net gorunur hale gelecek.")

    bias_breakdown = [
        {
            "bias_label": label,
            "bias_name_tr": _bias_name(label),
            "count": count,
        }
        for label, count in counts.most_common()
    ]

    profile_name = profile.get("profile_name") or profile.get("profile_type") or "Belirsiz Profil"
    decision_count = len(history)
    dominant_name = _bias_name(dominant_label) if dominant_label else None

    if decision_count == 0:
        summary = (
            f"{profile_name} profili olustu; ancak final rapor icin henuz yeterli event karari yok. "
            "Oyun ilerledikce rapor daha anlamli hale gelir."
        )
    else:
        summary = (
            f"{profile_name} profiliyle {decision_count} kritik karar verdin. "
            f"En belirgin davranissal sinyal {dominant_name} olarak gorunuyor."
        )

    return {
        "agent": "final_report_agent",
        "title": "Finansal Davranis Raporun",
        "profile_type": profile.get("profile_type"),
        "profile_name": profile_name,
        "decision_count": decision_count,
        "dominant_bias": dominant_label,
        "dominant_bias_name_tr": dominant_name,
        "bias_breakdown": bias_breakdown,
        "summary": summary,
        "strengths": strengths,
        "growth_areas": growth_areas,
        "final_state": {
            "year": final_state.get("year", final_state.get("yil")),
            "age": final_state.get("age", final_state.get("yas")),
            "cash": final_state.get("cash", final_state.get("nakit")),
            "net_worth": final_state.get("net_worth", final_state.get("toplam_deger")),
        },
        "next_reflection": "Bir sonraki oyunda ayni profille farkli strateji deneyerek karar sonuc iliskisini karsilastir.",
        "disclaimer": "Bu rapor yatirim tavsiyesi degildir; simulasyon icindeki davranis egilimlerini aciklar.",
    }


final_rapor_uret = generate_final_report
