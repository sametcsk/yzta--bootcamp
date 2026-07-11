from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agents.bias_coach_agent import generate_coach_comment
from agents.final_report_agent import generate_final_report
from agents.profile_agent import generate_profile
from engine.simulasyon import yil_hesapla
from events.event_engine import detayli_bias_raporu


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/yil-atla")
def yil_atla(state: dict):
    mevcut_yil = state.get("yil", 2025)
    event_gecmisi = state.get("event_gecmisi", {})
    tetiklenenler = state.get("tetiklenenler", [])
    return yil_hesapla(state, mevcut_yil, event_gecmisi, tetiklenenler)


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
    return generate_profile(data)


@app.post("/agents/coach")
@app.post("/ajanlar/koc")
def koc_ajani(data: dict):
    return generate_coach_comment(data)


@app.post("/agents/final-report")
@app.post("/ajanlar/final-rapor")
def final_rapor_ajani(data: dict):
    return generate_final_report(data)

