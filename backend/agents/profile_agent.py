import json

def _normalize_turkish(text: str) -> str:
    mapping = {
        'ı': 'i', 'ş': 's', 'ğ': 'g', 'ç': 'c', 'ü': 'u', 'ö': 'o',
        'İ': 'i', 'Ş': 's', 'Ğ': 'g', 'Ç': 'c', 'Ü': 'u', 'Ö': 'o'
    }
    normalized = ""
    for char in text:
        normalized += mapping.get(char, char)
    return normalized.lower()

STORY_TEMPLATES = {
    "kolay": "18 yaşında bir gençsin; arkanda büyük bir maddi güvence ve ailenin sağladığı rahatlıkla hayata bir adım önde başlıyorsun. Bugünden itibaren piyasalara yatırım yapabilecek, kariyerinde kritik adımlar atabilecek ve karşına çıkan sürpriz olaylarla kendi kaderini şekillendireceksin. Unutma; bu simülasyonda alacağın her karar, hem servetini hem de gizli yatırımcı kimliğini adım adım inşa edecek. 60 yıllık bu uzun serüven sona erdiğinde; oyun sonu raporunda tüm hayatının özetini ve finansal karakterinin gerçek yüzünü detaylıca göreceksin. Bol şans!",
    "orta": "18 yaşında bir gençsin; kendi ayakların üzerinde durmanı gerektirecek mütevazı ama yeterli bir destekle hayata başlıyorsun. Bugünden itibaren piyasalara yatırım yapabilecek, kariyerinde kritik adımlar atabilecek ve karşına çıkan sürpriz olaylarla kendi kaderini şekillendireceksin. Unutma; bu simülasyonda alacağın her karar, hem servetini hem de gizli yatırımcı kimliğini adım adım inşa edecek. 60 yıllık bu uzun serüven sona erdiğinde; oyun sonu raporunda tüm hayatının özetini ve finansal karakterinin gerçek yüzünü detaylıca göreceksin. Bol şans!",
    "zor": "18 yaşında bir gençsin; arkanda hiçbir destek olmadan, cebinde yalnızca hayallerin ve üstesinden gelmen gereken yüklerle zorlu bir hayata atılıyorsun. Bugünden itibaren piyasalara yatırım yapabilecek, kariyerinde kritik adımlar atabilecek ve karşına çıkan sürpriz olaylarla kendi kaderini şekillendireceksin. Unutma; bu simülasyonda alacağın her karar, hem servetini hem de gizli yatırımcı kimliğini adım adım inşa edecek. 60 yıllık bu uzun serüven sona erdiğinde; oyun sonu raporunda tüm hayatının özetini ve finansal karakterinin gerçek yüzünü detaylıca göreceksin. Bol şans!"
}

def generate_profile(data: dict) -> dict:
    answers = data.get("answers") or data.get("cevaplar") or []
    nakit = int(data.get("nakit", data.get("cash", 150000)) or 150000)
    sabir = int(data.get("sabir", data.get("patience", 50)) or 50)
    mutluluk = int(data.get("mutluluk", data.get("happiness", 50)) or 50)
    yillik_gelir = int(data.get("yillik_gelir", data.get("yillikGelir", 216000)) or 216000)

    bias_scores = {
        "loss_aversion": 50,
        "mental_accounting": 50,
        "anchoring": 50,
        "disposition_effect": 50,
        "present_bias": 50
    }
    
    zorluk = "orta"
    
    for i, ans in enumerate(answers):
        qid = ans.get("question_id", i+1)
        
        # Determine difficulty from question 1
        if qid == 1:
            bs = ans.get("bias_skor", {})
            z = bs.get("zorluk", "").lower()
            if z in ["kolay", "orta", "zor"]:
                zorluk = z
                
        # Update bias scores
        bs = ans.get("bias_skor", {})
        for k, v in bs.items():
            if k in bias_scores:
                bias_scores[k] = v

    intro_story = STORY_TEMPLATES.get(zorluk, STORY_TEMPLATES["orta"])

    return {
        "agent": "profile_agent",
        "profile_type": "Davranissal Profil",
        "classification_model": "rule_based_v2",
        "profile_name": "Yatırımcı Adayı",
        "risk_level": "orta",
        "time_horizon": "orta",
        "risk_score": 0,
        "starting_cash": nakit,
        "annual_income": yillik_gelir,
        "patience": sabir,
        "happiness": mutluluk,
        "bias_scores": bias_scores,
        "intro_story": intro_story,
        "story_source": "rule_based_fragments",
        "disclaimer": "Bu profil 6 temel soruya verdiğiniz yanıtlarla oluşturulmuştur.",
    }

profil_uret = generate_profile
