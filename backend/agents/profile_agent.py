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

PROFILE_STORY_SYSTEM_PROMPT = (
    "You are the narrative profile agent of a Turkish financial education simulation game. "
    "Your task is to write a short, vivid intro story that helps the player feel they are entering "
    "a life simulation, not filling out a survey. Write the final answer in Turkish only. "
    "Use warm, natural Turkish. Do not give investment advice, do not diagnose the player, do not use "
    "clinical language, and do not invent facts that are not present in the supplied context."
)

PROFILE_STORY_USER_PROMPT_TEMPLATE = (
    "Game context:\n"
    "- Player starts at age 18.\n"
    "- Difficulty level: {difficulty}\n"
    "- Top behavioral finance tendencies: {bias_names}\n"
    "- Concrete choices made by the player: {selected_details}\n\n"
    "Fallback draft in Turkish:\n{fallback_story}\n\n"
    "Rewrite the draft as a single Turkish story paragraph with these rules:\n"
    "1. Maximum 90 Turkish words.\n"
    "2. Include at least two concrete details from the player's choices.\n"
    "3. Mention the two dominant behavioral tendencies naturally, without sounding like a diagnosis.\n"
    "4. Do not list the decisions one by one.\n"
    "5. Do not create a new profile label.\n"
    "6. Do not recommend buying, selling, holding, investing, borrowing, or any financial action.\n"
    "7. Make it feel like the beginning of a financial life journey."
)


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


def _has_behavioral_answers(answers: list[dict]) -> bool:
    for answer in answers:
        raw_scores = answer.get("bias_skor") or answer.get("bias_scores") or {}
        for raw_label, value in raw_scores.items():
            if normalize_bias_label(raw_label) in CORE_BIASES and isinstance(value, (int, float)):
                return True
    return False


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
    has_behavioral_answers = _has_behavioral_answers(answers)
    if has_behavioral_answers:
        ranked_biases = sorted(bias_scores, key=lambda label: bias_scores[label], reverse=True)
        dominant_bias = ranked_biases[0]
        story_biases = ranked_biases[:2]
        selected_details = _story_details(answers)
        fallback_story = _fallback_story(difficulty, story_biases, selected_details)
        llm_result = metin_uret(
            PROFILE_STORY_SYSTEM_PROMPT,
            PROFILE_STORY_USER_PROMPT_TEMPLATE.format(
                difficulty=difficulty,
                bias_names=", ".join(bias_name_tr(label) for label in story_biases),
                selected_details=selected_details,
                fallback_story=fallback_story,
            ),
        )
    else:
        dominant_bias = None
        story_biases = []
        selected_details = []
        fallback_story = (
            "18 yaşında finansal yolculuğunun başındasın. Henüz davranışsal eğilimlerini "
            "gösterecek bir karar kaydı oluşmadı. Oyun ilerledikçe karar alışkanlıklarının "
            "nasıl şekillendiğini gözlemleyebileceksin."
        )
        llm_result = {
            "status": "not_requested",
            "text": None,
            "llm_enabled": False,
            "error_type": None,
        }
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
        "bias_scores_are_neutral": not has_behavioral_answers,
        "dominant_bias": dominant_bias,
        "dominant_bias_name_tr": bias_name_tr(dominant_bias) if dominant_bias else "Yeterli veri yok",
        "story_biases": story_biases,
        "story_details": selected_details,
        "intro_story": intro_story,
        "story_source": llm_metadata["generation_source"],
        **llm_metadata,
        "disclaimer": "Bu profil yatırım tavsiyesi değildir; simülasyon içindeki davranış eğilimlerini açıklar.",
    }


profil_uret = generate_profile
