from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from engine.simulasyon import yil_hesapla

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/yil-atla")
def yil_atla(state: dict):
    return yil_hesapla(state)

@app.get("/health")
def health():
    return {"status": "ok"}