from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agents.orchestrator import generate_safe_learning_plan, run_agent_flow
from agents.llm_client import llm_zorunlu_mu
from engine.simulasyon import yil_hesapla
from engine.opsiyon import generate_option_chain
from events.event_engine import detayli_bias_raporu

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _agent_response(flow_name: str, data: dict) -> dict:
    result = run_agent_flow(flow_name, data)
    if llm_zorunlu_mu() and result.get("generation_source") == "llm_error":
        raise HTTPException(
            status_code=503,
            detail={
                "message": "AI yanıtı şu an üretilemedi.",
                "llm_error_type": result.get("llm_error_type") or "unknown",
                "fallback_response": result,
            },
        )
    return result


@app.post("/yil-atla")
def yil_atla(state: dict):
    mevcut_yil = state.get("yil", 2025)
    event_gecmisi = state.get("event_gecmisi", {})
    tetiklenenler = state.get("tetiklenenler", [])
    return yil_hesapla(state, mevcut_yil, event_gecmisi, tetiklenenler)

@app.post("/opsiyon-zinciri")
def opsiyon_zinciri(data: dict):
    # data: {"fiyatlar": {...}, "mevduat_faizi": 0.40, "varliklar": ["bist_endeks", "bist_bankacilik", ...]}
    fiyatlar = data.get("fiyatlar", {})
    r = data.get("mevduat_faizi", 0.40)
    varliklar = data.get("varliklar", ["bist_endeks", "bist_bankacilik", "bist_teknoloji", "bist_insaat", "bist_saglik", "bist_perakende", "altin_try_gram"])
    
    volatiliteler = {
        "bist_endeks": 0.35,
        "bist_bankacilik": 0.45,
        "bist_teknoloji": 0.50,
        "bist_insaat": 0.40,
        "bist_saglik": 0.30,
        "bist_perakende": 0.35,
        "altin_try_gram": 0.20
    }
    
    zincir = {}
    for v in varliklar:
        S = fiyatlar.get(v, 100.0)
        if S <= 0:
            continue
        sigma = volatiliteler.get(v, 0.35)
        zincir[v] = generate_option_chain(S, r, sigma)
        
    return {"zincir": zincir}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/bias-raporu")
def bias_raporu(data: dict):
    kayitlar = data.get("event_kayitlari", [])
    return detayli_bias_raporu(kayitlar)


@app.post("/agents/profile")
@app.post("/ajanlar/profil")
def profil_ajani(data: dict):
    return _agent_response("profile", data)


@app.post("/agents/coach")
@app.post("/ajanlar/koc")
def koc_ajani(data: dict):
    return _agent_response("coach", data)


@app.post("/agents/final-report")
@app.post("/ajanlar/final-rapor")
def final_rapor_ajani(data: dict):
    return _agent_response("final_report", data)


@app.post("/agents/learning-plan")
@app.post("/ajanlar/ogrenme-plani")
def ogrenme_plani_ajani(data: dict):
    return generate_safe_learning_plan(data)


@app.post("/opsiyon-bias-analizi")
def opsiyon_bias_endpoint(req: dict):
    from engine.opsiyon_bias_analiz import analiz_et
    opsiyon_gecmisi = req.get("opsiyon_gecmisi", [])
    aktif_opsiyonlar = req.get("aktif_opsiyonlar", [])
    net_servet = req.get("net_servet", 0)
    
    sonuc = analiz_et(opsiyon_gecmisi, aktif_opsiyonlar, net_servet)
    return sonuc
