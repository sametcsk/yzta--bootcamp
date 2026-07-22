from .bias_catalog import CORE_BIASES, bias_name_tr, normalize_bias_label
from .llm_client import llm_response_metadata, metin_uret
from .safety_agent import guvenli_metin_veya_fallback


DIFFICULTY_OPENINGS = {
    "kolay": "18 yaşında, ailenden gelen güçlü bir güvenceyle hayata başladın.",
    "orta": "18 yaşında, mütevazı bir destekle kendi düzenini kurmaya başladın.",
    "zor": "18 yaşında, sınırlı kaynaklarla kendi yolunu açman gereken bir hayata adım attın.",
}

BIAS_STORY_LINES = {
    "loss_aversion": "İlk kararlarında kaybetme ihtimali, kazanma fırsatından biraz daha yüksek sesle konuştu.",
    "anchoring": "Karar verirken ilk duyduğun rakamların ve eski referansların izini taşımaya başladın.",
    "mental_accounting": "Paranı farklı amaçlara ayırmak sana düzen verdi; bazen büyük resmi ikinci plana itti.",
    "disposition_effect": "Kazancı güvenceye alma isteğin ile zararı kabullenme güçlüğün arasında kaldığın anlar oldu.",
    "present_bias": "Bugünün rahatlığı ile gelecekte kurmak istediğin hayat arasında sık sık seçim yaptın.",
}


def _value(data: dict, *keys: str, default):
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return default


def _extract_bias_scores(answers: list[dict]) -> tuple[dict, str]:
    scores = {label: 50 for label in CORE_BIASES}
    difficulty = "orta"
    for index, answer in enumerate(answers):
        question_id = answer.get("question_id", index + 1)
        raw_scores = answer.get("bias_skor") or answer.get("bias_scores") or {}
        if question_id == 1:
            candidate = str(raw_scores.get("zorluk", "")).lower()
            if candidate in DIFFICULTY_OPENINGS:
                difficulty = candidate
        for raw_label, value in raw_scores.items():
            label = normalize_bias_label(raw_label)
            if label in scores and isinstance(value, (int, float)):
                scores[label] = max(0, min(100, round(value)))
    return scores, difficulty


def _story_details(answers: list[dict]) -> list[str]:
    details = []
    for answer in answers[1:]:
        text = answer.get("selected_text") or answer.get("selected_option")
        if text:
            details.append(str(text).strip()[:90])
    return details[:3]


def _fallback_story(difficulty: str, dominant_biases: list[str], details: list[str]) -> str:
    tendency_lines = " ".join(BIAS_STORY_LINES[label] for label in dominant_biases[:2])
    decision_lines = " ".join(f'"{detail}" seçimin bu yolun izlerinden biri oldu.' for detail in details)
    return (
        f"{DIFFICULTY_OPENINGS[difficulty]} {decision_lines} {tendency_lines} "
        "Şimdi önünde uzun bir finansal yaşam var; vereceğin kararlar bu ilk eğilimi güçlendirebilir ya da dönüştürebilir."
    )


def generate_profile(data: dict) -> dict:
    answers = data.get("answers") or data.get("cevaplar") or []
    cash = int(_value(data, "nakit", "cash", default=150000))
    patience = int(_value(data, "sabir", "patience", default=50))
    happiness = int(_value(data, "mutluluk", "happiness", default=50))
    annual_income = int(_value(data, "yillik_gelir", "yillikGelir", default=216000))
    bias_scores, difficulty = _extract_bias_scores(answers)
    ranked_biases = sorted(bias_scores, key=lambda label: bias_scores[label], reverse=True)
    dominant_bias = ranked_biases[0]
    story_biases = ranked_biases[:2]
    selected_details = _story_details(answers)
    fallback_story = _fallback_story(difficulty, story_biases, selected_details)
    llm_result = metin_uret(
        "Sen bir finansal eğitim oyununda kısa ve sıcak intro hikayeleri yazarsın. Yatırım tavsiyesi verme; tanı koyma.",
        (
            f"Zorluk: {difficulty}. En belirgin iki eğilim: "
            f"{', '.join(bias_name_tr(label) for label in story_biases)}. "
            f"Oyuncunun seçimlerinden ayrıntılar: {selected_details}.\n"
            f"Taslak: {fallback_story}\n"
            "En fazla 90 kelimelik Türkçe bir hikaye yaz. Verilen seçimlerden en az iki somut "
            "ayrıntıyı ve iki baskın davranışsal eğilimi doğal biçimde mutlaka anlat. Kararları "
            "listeleme, profil etiketi uydurma, yatırım tavsiyesi verme ve klinik tanı koyma."
        ),
    )
    intro_story, llm_safe = guvenli_metin_veya_fallback(llm_result.get("text"), fallback_story)
    llm_metadata = llm_response_metadata(llm_result, llm_safe)

    return {
        "agent": "profile_agent",
        "profile_type": "Davranissal Profil",
        "classification_model": "rule_based_v3",
        "profile_name": "Davranışlarını Keşfeden Oyuncu",
        "risk_level": "orta",
        "time_horizon": "uzun",
        "risk_score": 0,
        "starting_cash": cash,
        "annual_income": annual_income,
        "patience": patience,
        "happiness": happiness,
        "bias_scores": bias_scores,
        "dominant_bias": dominant_bias,
        "dominant_bias_name_tr": bias_name_tr(dominant_bias),
        "story_biases": story_biases,
        "story_details": selected_details,
        "intro_story": intro_story,
        "story_source": llm_metadata["generation_source"],
        **llm_metadata,
        "disclaimer": "Bu profil yatırım tavsiyesi değildir; simülasyon içindeki davranış eğilimlerini açıklar.",
    }


profil_uret = generate_profile
