PROFILE_TEXTS = {
    "Guvenli Planlayici": {
        "display_name": "Guvenli Planlayici",
        "main_strength": "Planli hareket etme ve krizlerde panige kapilmama",
        "growth_area": "Fazla temkinli davranarak firsatlari gec yakalama",
        "summary": "Kararlarin guvenlik, duzen ve finansal istikrar arayisina isaret ediyor.",
        "first_advice": "Bu profile sahip kullanicilar genellikle acil durum payini korurken cesitlendirme fikrini de degerlendirmeye yatkindir.",
    },
    "Dengeli Stratejist": {
        "display_name": "Dengeli Stratejist",
        "main_strength": "Risk ve guvenlik arasinda olculu denge kurabilme",
        "growth_area": "Bazi donemlerde karar almakta gecikme",
        "summary": "Kararlarin hem buyumeyi hem de korunmayi dikkate alan dengeli bir yaklasim gosteriyor.",
        "first_advice": "Bu profil, farkli senaryolarda risk ve guvenlik arasindaki dengeyi gozlemlemeye odaklanir.",
    },
    "Cesur Firsatci": {
        "display_name": "Cesur Firsatci",
        "main_strength": "Firsatlari hizli fark etme ve aksiyon alabilme",
        "growth_area": "Kisa vadeli heyecanla gereksiz risk alma",
        "summary": "Kararlarin yuksek getiri ihtimali gordugunde hizli hareket etmeye yatkin oldugunu gosteriyor.",
        "first_advice": "Bu profil, tek bir karara tum sermayeyi baglamadan riskleri fark etmeye odaklanir.",
    },
    "Sabirli Biriktirici": {
        "display_name": "Sabirli Biriktirici",
        "main_strength": "Uzun vadeli dusunme ve birikim disiplini",
        "growth_area": "Baslangic sermayesi sinirliyken buyume firsatlarini yavas yakalama",
        "summary": "Kararlarin sabir, duzenli birikim ve uzun vadeli dayaniklilik egilimi tasiyor.",
        "first_advice": "Bu profile sahip kullanicilar genellikle kucuk ve duzenli adimlarla ilerleme davranisi gosterir.",
    },
    "Konfor Odakli": {
        "display_name": "Konfor Odakli",
        "main_strength": "Yasam kalitesini ve mutlulugu finansal kararlara dahil etme",
        "growth_area": "Gelir arttikca giderleri de hizla artirma riski",
        "summary": "Kararlarin bugunku konforu ve deneyimi onemsedigini gosteriyor.",
        "first_advice": "Bu profil, konfor hedefleri ile gider artisinin uzun vadeli etkisi arasindaki iliskiyi gozlemlemeye odaklanir.",
    },
    "Koruyucu Yatirimci": {
        "display_name": "Koruyucu Yatirimci",
        "main_strength": "Sermayeyi koruma ve buyuk kayiplardan uzak durma",
        "growth_area": "Yuksek enflasyonda fazla nakitte kalarak alim gucu kaybetme",
        "summary": "Kararlarin mevcut varligi korumaya ve belirsizlikten uzak durmaya yatkin.",
        "first_advice": "Bu profile sahip kullanicilar nominal para miktariyla birlikte reel alim gucunu da degerlendirmeye yatkindir.",
    },
}


def _answer_effect(answer: dict, key: str, default=0):
    effects = answer.get("effects") or {}
    if key in effects:
        value = effects.get(key)
        return default if value is None else value
    value = answer.get(key)
    return default if value is None else value


def _infer_risk_from_text(answer: dict) -> int:
    text = (
        answer.get("selected_text")
        or answer.get("secim_metin")
        or answer.get("metin")
        or ""
    ).lower()

    high_risk_words = ["risk", "hepsini", "harcadim", "ani yasa", "erken calistim", "ise yaradi"]
    low_risk_words = ["biriktirdim", "plan", "temkin", "koru", "bekle", "burslu"]

    if any(word in text for word in high_risk_words):
        return 2
    if any(word in text for word in low_risk_words):
        return 0
    return 1


def _risk_level(risk_score: int, answer_count: int) -> str:
    if answer_count <= 0:
        return "orta"
    average = risk_score / answer_count
    if average < 0.75:
        return "dusuk"
    if average < 1.45:
        return "orta"
    return "yuksek"


def _time_horizon(sabir: int) -> str:
    if sabir >= 65:
        return "uzun_vade"
    if sabir <= 40:
        return "kisa_vade"
    return "orta_vade"


def _profile_type(nakit: int, sabir: int, mutluluk: int, risk_level: str) -> str:
    if risk_level == "yuksek" and sabir <= 60:
        return "Cesur Firsatci"
    if risk_level == "dusuk" and sabir >= 65 and nakit >= 180000:
        return "Koruyucu Yatirimci"
    if risk_level == "dusuk" and sabir >= 60:
        return "Guvenli Planlayici"
    if nakit <= 90000 and sabir >= 60:
        return "Sabirli Biriktirici"
    if mutluluk >= 68 and sabir <= 50:
        return "Konfor Odakli"
    return "Dengeli Stratejist"


def generate_profile(data: dict) -> dict:
    answers = data.get("answers") or data.get("cevaplar") or []
    nakit = int(data.get("nakit", data.get("cash", 150000)) or 150000)
    sabir = int(data.get("sabir", data.get("patience", 50)) or 50)
    mutluluk = int(data.get("mutluluk", data.get("happiness", 50)) or 50)
    yillik_gelir = int(data.get("yillik_gelir", data.get("yillikGelir", 216000)) or 216000)

    risk_score = sum(
        int(_answer_effect(answer, "risk", _infer_risk_from_text(answer)))
        for answer in answers
    )

    risk = _risk_level(risk_score, len(answers))
    horizon = _time_horizon(sabir)
    profile_type = _profile_type(nakit, sabir, mutluluk, risk)
    profile_text = PROFILE_TEXTS[profile_type]

    return {
        "agent": "profile_agent",
        "profile_type": profile_type,
        "profile_name": profile_text["display_name"],
        "risk_level": risk,
        "time_horizon": horizon,
        "risk_score": risk_score,
        "starting_cash": nakit,
        "annual_income": yillik_gelir,
        "patience": sabir,
        "happiness": mutluluk,
        "main_strength": profile_text["main_strength"],
        "growth_area": profile_text["growth_area"],
        "summary": profile_text["summary"],
        "first_advice": profile_text["first_advice"],
        "disclaimer": "Bu profil yatirim tavsiyesi degildir; simulasyon icindeki davranis egilimlerini aciklar.",
    }


profil_uret = generate_profile
