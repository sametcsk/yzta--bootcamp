BIAS_DEFINITIONS = {
    "loss_aversion": {"name_tr": "Kayıptan Kaçınma", "title": "Kayıptan Kaçınma Sinyali"},
    "anchoring": {"name_tr": "Referans Noktasına Takılma", "title": "Referans Fiyat Etkisi"},
    "mental_accounting": {"name_tr": "Zihinsel Muhasebe", "title": "Parayı Kategorilere Ayırma"},
    "disposition_effect": {"name_tr": "Elden Çıkarma Etkisi", "title": "Kazancı ve Kaybı Yönetme Eğilimi"},
    "present_bias": {"name_tr": "Bugüne Aşırı Odaklanma", "title": "Kısa Vadeli Rahatlık Sinyali"},
    "overconfidence": {"name_tr": "Aşırı Özgüven", "title": "Aşırı Özgüven Sinyali"},
    "herd_behavior": {"name_tr": "Sürü Davranışı", "title": "Kalabalığı Takip Etme Sinyali"},
    "status_quo_bias": {"name_tr": "Mevcut Durumu Koruma Eğilimi", "title": "Değişimden Kaçınma Sinyali"},
    "sunk_cost": {"name_tr": "Batık Maliyet Yanılgısı", "title": "Geçmiş Maliyete Takılma Sinyali"},
    "moral_hazard": {"name_tr": "Ahlaki Tehlike", "title": "Riskin Sonucunu Başkasına Yükleme Sinyali"},
    "confirmation_bias": {"name_tr": "Doğrulama Yanlılığı", "title": "Seçici Kanıt Sinyali"},
}

BIAS_ALIASES = {
    "asiri_ozguven": "overconfidence",
    "herding": "herd_behavior",
    "herd": "herd_behavior",
    "status_quo": "status_quo_bias",
    "disposition": "disposition_effect",
    "batik_maliyet": "sunk_cost",
    "ahlaki_tehlike": "moral_hazard",
    "confirmation": "confirmation_bias",
    "dogrulama_yanliligi": "confirmation_bias",
}

CORE_BIASES = (
    "loss_aversion",
    "anchoring",
    "mental_accounting",
    "disposition_effect",
    "present_bias",
)

REPORT_BIASES = tuple(BIAS_DEFINITIONS)


def normalize_bias_label(label: str | None) -> str:
    normalized = str(label or "unknown").strip().lower().replace("-", "_").replace(" ", "_")
    return BIAS_ALIASES.get(normalized, normalized)


def bias_name_tr(label: str | None) -> str:
    return BIAS_DEFINITIONS.get(normalize_bias_label(label), {}).get("name_tr", "Davranışsal Sinyal")
