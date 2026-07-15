BIAS_LIBRARY = {
    "loss_aversion": {
        "name_tr": "Kayıptan Kaçınma",
        "title": "Kayıptan Kaçınma Sinyali",
        "comment": (
            "Bu karar, zarar ihtimalinden hızlıca uzaklaşma isteğiyle ilişkili olabilir. "
            "Bu bazen koruyucu olabilir; ancak yalnızca panikle verilirse uzun vadeli planı zayıflatabilir."
        ),
        "question": "Bu kararı planına uygun olduğu için mi, yoksa kayıp korkusuyla mı verdin?",
    },
    "anchoring": {
        "name_tr": "Referans Noktasına Takılma",
        "title": "Referans Fiyat Etkisi",
        "comment": (
            "Bu karar, geçmişteki bir fiyat veya beklentiye fazla bağlanma eğilimi gösterebilir. "
            "Referans noktası yararlı olabilir; fakat güncel koşulları görmeyi zorlaştırabilir."
        ),
        "question": "Bu kararda bugünkü tabloya mı, yoksa önceki bir fiyata mı daha çok odaklandın?",
    },
    "mental_accounting": {
        "name_tr": "Zihinsel Muhasebe",
        "title": "Parayı Kategorilere Ayırma",
        "comment": (
            "Bu karar, parayı kaynağına veya kullanım amacına göre ayrı zihinsel kutulara koyma eğilimiyle ilişkili olabilir. "
            "Bu bazen düzen sağlar; fakat toplam finansal resmi kaçırmaya neden olabilir."
        ),
        "question": "Bu parayı diğer birikimlerinden farklı mı değerlendirdin?",
    },
    "overconfidence": {
        "name_tr": "Aşırı Özgüven",
        "title": "Aşırı Özgüven Sinyali",
        "comment": (
            "Bu karar, sonucu tahmin etme becerine fazla güvenme eğilimi taşıyor olabilir. "
            "Özgüven karar almayı kolaylaştırır; ancak belirsizliği küçümsemek riski artırabilir."
        ),
        "question": "Bu kararda riskleri yeterince hesaba kattığını düşünüyor musun?",
    },
    "herd_behavior": {
        "name_tr": "Sürü Davranışı",
        "title": "Kalabalığı Takip Etme Sinyali",
        "comment": (
            "Bu karar, çevrenin veya piyasa kalabalığının davranışından etkilenmiş olabilir. "
            "Başkalarının hareketi bilgi verebilir; fakat tek başına karar nedeni olmamalıdır."
        ),
        "question": "Bu kararı kendi planına göre mi, yoksa herkes öyle yapıyor diye mi verdin?",
    },
    "disposition_effect": {
        "name_tr": "Kazananı Erken Satma Eğilimi",
        "title": "Kâr Realizasyonu Eğilimi",
        "comment": (
            "Bu karar, kazancı hızlıca kesinleştirme veya zarardaki pozisyonu geç kapatma eğilimiyle ilişkili olabilir. "
            "Kısa vadeli rahatlama uzun vadeli sonucu her zaman iyileştirmeyebilir."
        ),
        "question": "Bu kararda sonucu kapatma isteği mi, yoksa stratejin mi belirleyici oldu?",
    },
    "present_bias": {
        "name_tr": "Bugüne Aşırı Odaklanma",
        "title": "Kısa Vadeli Rahatlık Sinyali",
        "comment": (
            "Bu karar, bugünkü rahatlığı gelecekteki faydanın önüne koyma eğilimi gösterebilir. "
            "Kısa vadeli mutluluk önemlidir; fakat uzun vadeli etkisi de hesaba katılmalıdır."
        ),
        "question": "Bu seçimin gelecekteki bütçeni nasıl etkileyebileceğini düşündün mü?",
    },
    "status_quo_bias": {
        "name_tr": "Mevcut Durumu Koruma Eğilimi",
        "title": "Değişimden Kaçınma Sinyali",
        "comment": (
            "Bu karar, mevcut durumu koruma ve değişimden uzak durma eğilimiyle ilişkili olabilir. "
            "Bu bazen istikrar sağlar; fakat koşullar değiştiğinde fırsat maliyeti yaratabilir."
        ),
        "question": "Bu kararı gerçekten uygun olduğu için mi, yoksa değişimden kaçındığın için mi seçtin?",
    },
}


BIAS_LABEL_ALIASES = {
    "asiri_ozguven": "overconfidence",
    "status_quo": "status_quo_bias",
}


def normalize_bias_label(label: str) -> str:
    return BIAS_LABEL_ALIASES.get(label, label)


def _event_history(data: dict) -> list:
    return (
        data.get("event_history")
        or data.get("event_gecmisi")
        or data.get("event_kayitlari")
        or []
    )


def _history_bias_label(item: dict) -> str:
    label = (
        item.get("bias")
        or item.get("bias_label")
        or item.get("bias_etiketi")
        or "bilinmiyor"
    )
    return normalize_bias_label(label)


def _coach_trigger(data: dict, bias_label: str) -> tuple[bool, str, int, int]:
    history = _event_history(data)
    labels = [_history_bias_label(item) for item in history]
    decision_count = len(history) or 1
    occurrence_count = labels.count(bias_label) if labels else 1
    high_impact = bool(data.get("high_impact") or data.get("buyuk_etki"))

    if decision_count == 1:
        return True, "İlk karar değerlendirmesi", occurrence_count, decision_count
    if high_impact:
        return True, "Finansal etkisi yüksek karar", occurrence_count, decision_count
    if occurrence_count == 1:
        return True, "Yeni bir davranış eğilimi görüldü", occurrence_count, decision_count
    if occurrence_count % 3 == 0:
        return True, f"Aynı eğilim {occurrence_count}. kez tekrarlandı", occurrence_count, decision_count
    if decision_count % 5 == 0:
        return True, f"{decision_count} kararlık ara değerlendirme", occurrence_count, decision_count
    return False, "Karar geçmişe kaydedildi", occurrence_count, decision_count


def generate_coach_comment(data: dict) -> dict:
    source_bias_label = (
        data.get("bias_label")
        or data.get("bias_etiketi")
        or data.get("bias")
        or "bilinmiyor"
    )
    bias_label = normalize_bias_label(source_bias_label)
    bias = BIAS_LIBRARY.get(
        bias_label,
        {
            "name_tr": "Davranışsal Sinyal",
            "title": "Karar Farkındalığı",
            "comment": (
                "Bu karar belirli bir davranışsal eğilime işaret ediyor olabilir. "
                "Önemli olan kararı korku, acele veya baskı yerine planla uyumlu şekilde değerlendirmektir."
            ),
            "question": "Bu kararı hangi düşünceyle verdiğini bir cümleyle açıklayabilir misin?",
        },
    )

    should_show, trigger_reason, occurrence_count, decision_count = _coach_trigger(
        data,
        bias_label,
    )
    event_title = data.get("event_title") or data.get("event_baslik")
    selected_option = data.get("selected_option") or data.get("secim_metin")
    context_parts = []
    if event_title and selected_option:
        context_parts.append(
            f"\"{event_title}\" olayında \"{selected_option}\" seçimini yaptın."
        )
    if occurrence_count > 1:
        context_parts.append(
            f"{bias['name_tr']} eğilimi karar geçmişinde {occurrence_count}. kez görülüyor."
        )
    context_parts.append(bias["comment"])

    return {
        "agent": "bias_coach_agent",
        "year": data.get("year", data.get("yil")),
        "event_title": event_title,
        "selected_option": selected_option,
        "profile_type": data.get("profile_type"),
        "source_bias_label": source_bias_label,
        "bias_label": bias_label,
        "bias_name_tr": bias["name_tr"],
        "coach_title": bias["title"],
        "coach_comment": " ".join(context_parts),
        "reflection_question": bias["question"],
        "should_show": should_show,
        "trigger_reason": trigger_reason,
        "occurrence_count": occurrence_count,
        "decision_count": decision_count,
        "disclaimer": "Bu yorum yatırım tavsiyesi değildir; karar davranışını anlamaya yöneliktir.",
    }


koc_yorumu_uret = generate_coach_comment
