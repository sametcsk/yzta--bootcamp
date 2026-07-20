from collections import Counter
import json
from .bias_coach_agent import BIAS_LIBRARY, normalize_bias_label

def _bias_name(label: str) -> str:
    canonical_label = normalize_bias_label(label) if label else label
    return BIAS_LIBRARY.get(canonical_label, {}).get("name_tr", "Davranışsal Sinyal")

def _normalize_history(data: dict) -> list:
    return data.get("event_history") or data.get("event_gecmisi") or data.get("event_kayitlari") or []

def calculate_bias_scores(metrics: dict) -> dict:
    # Safe getters
    def get(k, default=0): return metrics.get(k, default)
    event_scores = metrics.get("eventSkorlari", {})
    event_counts = metrics.get("eventSayilari", {})
    
    # Present Bias
    # x1: Event choices (Average score from present_bias events)
    pb_event_count = event_counts.get("present_bias", 0)
    pb_event_score = event_scores.get("present_bias", 0)
    x1_pb = min(1.0, max(0.0, pb_event_score / (pb_event_count * 15.0))) if pb_event_count > 0 else 0.5
    
    # x2: Luxury living duration
    total_years = get("toplamYil", 1)
    # max possible luxury points is 4 * total_years. We set ceiling at 60% of max.
    ceiling_luks = max(1, total_years * 4 * 0.6)
    x2_pb = min(1.0, get("luksYasamPuani", 0) / ceiling_luks)
    
    # x3: Luxury loans
    x3_pb = min(1.0, get("ihtiyacDisiKrediSayisi", 0) / 3.0) # maxes out at 3 bad loans
    
    present_bias_score = (0.3 * x1_pb + 0.4 * x2_pb + 0.3 * x3_pb) * 100

    # Loss Aversion
    la_event_count = event_counts.get("loss_aversion", 0)
    la_event_score = event_scores.get("loss_aversion", 0)
    x1_la = min(1.0, max(0.0, la_event_score / (la_event_count * 15.0))) if la_event_count > 0 else 0.5
    
    x2_la = min(1.0, get("panikSatisSayisi", 0) / 2.0) # maxes out at 2 panic sells
    # x3 could be safe haven obsession, but we just use event + panic sell
    
    loss_aversion_score = (0.4 * x1_la + 0.6 * x2_la) * 100

    # Anchoring
    anc_event_count = event_counts.get("anchoring", 0)
    anc_event_score = event_scores.get("anchoring", 0)
    x1_anc = min(1.0, max(0.0, anc_event_score / (anc_event_count * 15.0))) if anc_event_count > 0 else 0.5
    
    x2_anc = min(1.0, get("dusenBicakAlimSayisi", 0) / 2.0)
    
    anchoring_score = (0.5 * x1_anc + 0.5 * x2_anc) * 100

    # Mental Accounting
    ma_event_count = event_counts.get("mental_accounting", 0)
    ma_event_score = event_scores.get("mental_accounting", 0)
    x1_ma = min(1.0, max(0.0, ma_event_score / (ma_event_count * 15.0))) if ma_event_count > 0 else 0.5
    
    x2_ma = min(1.0, get("borcluykenYatirimSayisi", 0) / 3.0)
    
    mental_accounting_score = (0.4 * x1_ma + 0.6 * x2_ma) * 100

    # Disposition Effect
    de_event_count = event_counts.get("disposition_effect", 0)
    de_event_score = event_scores.get("disposition_effect", 0)
    x1_de = min(1.0, max(0.0, de_event_score / (de_event_count * 15.0))) if de_event_count > 0 else 0.5
    
    x2_de = min(1.0, get("erkenKarSatisSayisi", 0) / 2.0)
    
    disposition_score = (0.5 * x1_de + 0.5 * x2_de) * 100

    return {
        "scores": {
            "present_bias": round(present_bias_score),
            "loss_aversion": round(loss_aversion_score),
            "anchoring": round(anchoring_score),
            "mental_accounting": round(mental_accounting_score),
            "disposition_effect": round(disposition_score)
        },
        "details": {
            "present_bias_breakdown": {"w1_event": x1_pb, "w2_luxury": x2_pb, "w3_loan": x3_pb},
            "loss_aversion_breakdown": {"w1_event": x1_la, "w2_panic_sell": x2_la},
            "anchoring_breakdown": {"w1_event": x1_anc, "w2_falling_knife": x2_anc},
            "mental_accounting_breakdown": {"w1_event": x1_ma, "w2_debt_invest": x2_ma},
            "disposition_breakdown": {"w1_event": x1_de, "w2_early_profit": x2_de}
        }
    }


def generate_final_report(data: dict) -> dict:
    profile = data.get("profile") or {}
    final_state = data.get("final_state") or data.get("son_durum") or {}
    bias_metrics = final_state.get("bias_metrics", {})
    
    history = _normalize_history(data)

    bias_analysis = calculate_bias_scores(bias_metrics)
    bias_scores = bias_analysis["scores"]
    
    # Find dominant bias
    dominant_label = max(bias_scores, key=bias_scores.get) if bias_scores else None
    
    profile_name = profile.get("profile_name") or profile.get("profile_type") or "Belirsiz Profil"
    decision_count = len(history)
    dominant_name = _bias_name(dominant_label) if dominant_label else None

    # Construct the LLM Context Prompt string that the developer can pass to a real LLM
    llm_prompt = f"""
Sen klinik bir davranışsal finans analistisin. Aşağıdaki oyuncunun 18 yaşından ölümüne (veya iflasına) kadar olan finansal davranış verilerini analiz edip 3 maddelik keskin bir psikolojik/finansal teşhis raporu yazacaksın.

# OYUNCU PROFİLİ
- Başlangıç Tipi: {profile_name}
- Karar Sayısı: {decision_count}
- Final Net Servet: {final_state.get('net_worth', 0)} TL
- İflas Sayısı: {final_state.get('bankruptcy_count', 0)}

# DAVRANIŞSAL SKORLAR (0-100)
- Present Bias (Anlık Haz): {bias_scores.get('present_bias')} / 100
- Loss Aversion (Kayıptan Kaçınma): {bias_scores.get('loss_aversion')} / 100
- Anchoring (Çıpalama): {bias_scores.get('anchoring')} / 100
- Mental Accounting (Zihinsel Muhasebe): {bias_scores.get('mental_accounting')} / 100
- Disposition Effect (Kârı Erken Kesme): {bias_scores.get('disposition_effect')} / 100

# DETAYLI HAREKET DÖKÜMÜ (x1, x2, x3 parametreleri)
{json.dumps(bias_analysis['details'], indent=2)}

Lütfen bu verileri kullanarak, oyuncunun yüzüne gerçekleri çarpan, klinik dille yazılmış 3 maddelik kısa bir rapor oluştur.
"""

    summary = (
        f"{profile_name} profiliyle {decision_count} kritik karar verdin. "
        f"En belirgin davranışsal sinyal {dominant_name} ({bias_scores.get(dominant_label)}/100) olarak görünüyor."
    )

    return {
        "agent": "final_report_agent",
        "title": "Klinik Finansal Teşhis Raporu",
        "profile_type": profile.get("profile_type"),
        "profile_name": profile_name,
        "decision_count": decision_count,
        "dominant_bias": dominant_label,
        "dominant_bias_name_tr": dominant_name,
        "bias_scores": bias_scores,
        "bias_details": bias_analysis["details"],
        "llm_prompt_payload": llm_prompt,
        "summary": summary,
        "strengths": ["Analiz ediliyor... (LLM entegrasyonu beklentisi)"],
        "growth_areas": ["Analiz ediliyor... (LLM entegrasyonu beklentisi)"],
        "final_state": final_state
    }

final_rapor_uret = generate_final_report
