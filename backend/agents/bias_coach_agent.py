BIAS_LIBRARY = {
    "loss_aversion": {
        "name_tr": "Kayiptan Kacinma",
        "title": "Kayiptan Kacinma Sinyali",
        "comment": (
            "Bu karar, zarar ihtimalinden hizlica uzaklasma istegiyle iliskili olabilir. "
            "Bu bazen koruyucu olabilir; ancak yalnizca panikle verilirse uzun vadeli plani zayiflatabilir."
        ),
        "question": "Bu karari planina uygun oldugu icin mi, yoksa kayip korkusuyla mi verdin?",
    },
    "anchoring": {
        "name_tr": "Referans Noktasina Takilma",
        "title": "Referans Fiyat Etkisi",
        "comment": (
            "Bu karar, gecmisteki bir fiyat veya beklentiye fazla baglanma egilimi gosterebilir. "
            "Referans noktasi yararli olabilir; fakat guncel kosullari gormeyi zorlastirabilir."
        ),
        "question": "Bu kararda bugunku tabloya mi, yoksa onceki bir fiyata mi daha cok odaklandin?",
    },
    "mental_accounting": {
        "name_tr": "Zihinsel Muhasebe",
        "title": "Parayi Kategorilere Ayirma",
        "comment": (
            "Bu karar, parayi kaynagina veya kullanim amacina gore ayri zihinsel kutulara koyma egilimiyle iliskili olabilir. "
            "Bu bazen duzen saglar; fakat toplam finansal resmi kacirmaya neden olabilir."
        ),
        "question": "Bu parayi diger birikimlerinden farkli mi degerlendirdin?",
    },
    "overconfidence": {
        "name_tr": "Asiri Ozguven",
        "title": "Asiri Ozguven Sinyali",
        "comment": (
            "Bu karar, sonucu tahmin etme becerine fazla guvenme egilimi tasiyor olabilir. "
            "Ozguven karar almayi kolaylastirir; ancak belirsizligi kucumsemek riski artirabilir."
        ),
        "question": "Bu kararda riskleri yeterince hesaba kattigini dusunuyor musun?",
    },
    "herd_behavior": {
        "name_tr": "Suru Davranisi",
        "title": "Kalabaligi Takip Etme Sinyali",
        "comment": (
            "Bu karar, cevrenin veya piyasa kalabaliginin davranisindan etkilenmis olabilir. "
            "Baskalarinin hareketi bilgi verebilir; fakat tek basina karar nedeni olmamalidir."
        ),
        "question": "Bu karari kendi planina gore mi, yoksa herkes oyle yapiyor diye mi verdin?",
    },
    "disposition_effect": {
        "name_tr": "Kazanani Erken Satma Egilimi",
        "title": "Kar Realizasyonu Egilimi",
        "comment": (
            "Bu karar, kazanci hizlica kesinlestirme veya zarardaki pozisyonu gec kapatma egilimiyle iliskili olabilir. "
            "Kisa vadeli rahatlama uzun vadeli sonucu her zaman iyilestirmeyebilir."
        ),
        "question": "Bu kararda sonucu kapatma istegi mi, yoksa stratejin mi belirleyici oldu?",
    },
    "present_bias": {
        "name_tr": "Bugune Asiri Odaklanma",
        "title": "Kisa Vadeli Rahatlik Sinyali",
        "comment": (
            "Bu karar, bugunku rahatligi gelecekteki faydanin onune koyma egilimi gosterebilir. "
            "Kisa vadeli mutluluk onemlidir; fakat uzun vadeli etkisi de hesaba katilmalidir."
        ),
        "question": "Bu secimin gelecekteki butceni nasil etkileyebilecegini dusundun mu?",
    },
    "status_quo_bias": {
        "name_tr": "Mevcut Durumu Koruma Egilimi",
        "title": "Degisimden Kacinma Sinyali",
        "comment": (
            "Bu karar, mevcut durumu koruma ve degisimden uzak durma egilimiyle iliskili olabilir. "
            "Bu bazen istikrar saglar; fakat kosullar degistiginde firsat maliyeti yaratabilir."
        ),
        "question": "Bu karari gercekten uygun oldugu icin mi, yoksa degisimden kacindigin icin mi sectin?",
    },
}


def generate_coach_comment(data: dict) -> dict:
    bias_label = (
        data.get("bias_label")
        or data.get("bias_etiketi")
        or data.get("bias")
        or "bilinmiyor"
    )
    bias = BIAS_LIBRARY.get(
        bias_label,
        {
            "name_tr": "Davranissal Sinyal",
            "title": "Karar Farkindaligi",
            "comment": (
                "Bu karar belirli bir davranissal egilime isaret ediyor olabilir. "
                "Onemli olan karari korku, acele veya baski yerine planla uyumlu sekilde degerlendirmektir."
            ),
            "question": "Bu karari hangi dusunceyle verdigini bir cumleyle aciklayabilir misin?",
        },
    )

    return {
        "agent": "bias_coach_agent",
        "year": data.get("year") or data.get("yil"),
        "event_title": data.get("event_title") or data.get("event_baslik"),
        "selected_option": data.get("selected_option") or data.get("secim_metin"),
        "profile_type": data.get("profile_type"),
        "bias_label": bias_label,
        "bias_name_tr": bias["name_tr"],
        "coach_title": bias["title"],
        "coach_comment": bias["comment"],
        "reflection_question": bias["question"],
        "disclaimer": "Bu yorum yatirim tavsiyesi degildir; karar davranisini anlamaya yoneliktir.",
    }


koc_yorumu_uret = generate_coach_comment
