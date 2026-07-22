from .bias_catalog import bias_name_tr, normalize_bias_label
from .rag_service import ilgili_kaynaklari_getir


def generate_learning_plan(data: dict) -> dict:
    report = data.get("report") or data.get("rapor") or data
    dominant = normalize_bias_label(report.get("dominant_bias")) if report.get("dominant_bias") else None
    sources = ilgili_kaynaklari_getir(dominant, "learning_plan_agent", limit=3) if dominant else []
    topics = [source["summary_tr"] for source in sources]
    if not topics:
        topics = ["Karar gerekçesini kaydetme", "Belirsizlik altında alternatif senaryoları karşılaştırma"]
    return {
        "agent": "learning_plan_agent",
        "title": "Kısa Öğrenme Planı",
        "focus_bias": dominant,
        "focus_bias_name_tr": bias_name_tr(dominant) if dominant else "Genel karar farkındalığı",
        "learning_topics": topics,
        "game_practices": ["Bir sonraki benzer eventte karar vermeden önce gerekçeni yaz.", "Sonucu değil, karar anında kullandığın bilgiyi değerlendir."],
        "sources": sources,
        "disclaimer": "Bu plan yatırım önerisi değil, finansal karar farkındalığı için eğitim içeriğidir.",
    }


ogrenme_plani_uret = generate_learning_plan
