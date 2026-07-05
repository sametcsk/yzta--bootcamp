from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── YARDIMCI ──────────────────────────────────────────────────
def normal(ortalama, std, min_val=None, max_val=None):
    deger = random.gauss(ortalama, std)
    if min_val is not None:
        deger = max(deger, min_val)
    if max_val is not None:
        deger = min(deger, max_val)
    return round(deger, 4)

# ── ENFLASYON ─────────────────────────────────────────────────
def enflasyon_sim(rejim, sakin_yil, kriz_mevcut, kriz_dusus_hizi):
    if rejim == 0:
        kriz_olasiligi = 1 - math.exp(-0.04 * sakin_yil)
        if random.random() < kriz_olasiligi and sakin_yil >= 3:
            rejim = 1
            sakin_yil = 0
            kriz_mevcut = normal(63, 8, min_val=50, max_val=80)
            kriz_dusus_hizi = normal(27, 5, min_val=18, max_val=38)
            enf = normal(kriz_mevcut, 4, min_val=kriz_mevcut*0.9, max_val=kriz_mevcut*1.1)
            durum = "KRİZ"
        else:
            sakin_yil += 1
            enf = normal(9.5, 2.8, min_val=5, max_val=18)
            durum = "sakin"
    else:
        gercek_dusus = normal(kriz_dusus_hizi, 5, min_val=18, max_val=45)
        kriz_mevcut = kriz_mevcut * (1 - gercek_dusus / 100)
        if kriz_mevcut <= 18:
            rejim = 0
            sakin_yil = 0
            enf = normal(14, 3, min_val=8, max_val=20)
            durum = "normalleşme"
            kriz_mevcut = None
        else:
            enf = normal(kriz_mevcut, 6,
                        min_val=kriz_mevcut*0.85, max_val=kriz_mevcut*1.15)
            durum = "kriz devam"
    return enf, rejim, sakin_yil, kriz_mevcut, kriz_dusus_hizi, durum

# ── DÖVİZ ─────────────────────────────────────────────────────
def doviz_sim(enflasyon, rejim):
    if rejim == 0:
        carpan = normal(2.0, 0.6, min_val=0.8, max_val=4.0)
    else:
        carpan = normal(1.5, 0.8, min_val=0.5, max_val=5.0)
    return round(enflasyon * carpan, 1), round(carpan, 2)

# ── ALTIN ─────────────────────────────────────────────────────
ALTIN_REJIMLER = {
    "durgun": {"getiri_ort": 0.02, "getiri_std": 0.08, "getiri_min": -0.05, "getiri_max": 0.12},
    "boga":   {"getiri_ort": 0.20, "getiri_std": 0.18, "getiri_min": 0.05,  "getiri_max": 0.50},
    "ayi":    {"getiri_ort": -0.12,"getiri_std": 0.12, "getiri_min": -0.35, "getiri_max": -0.001},
}
AYI_ESIGI = -0.35

def altin_sim(rejim, durgun_yil, boga_yil, zirve_fiyat, fiyat, enflasyon_rejim=0):
    if rejim == 0:
        boga_olasiligi = 1 - math.exp(-0.07 * durgun_yil)
        if enflasyon_rejim == 1:
            boga_olasiligi = min(boga_olasiligi + 0.15, 0.90)
        if random.random() < boga_olasiligi and durgun_yil >= 2:
            rejim, durgun_yil, boga_yil = 1, 0, 1
            zirve_fiyat = fiyat
            p = ALTIN_REJIMLER["boga"]
            getiri = normal(p["getiri_ort"], p["getiri_std"], min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = "BOĞA BAŞLADI"
        else:
            durgun_yil += 1
            p = ALTIN_REJIMLER["durgun"]
            getiri = normal(p["getiri_ort"], p["getiri_std"], min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = f"durgun ({durgun_yil}. yıl)"
    elif rejim == 1:
        boga_yil += 1
        ayi_olasiligi = 0.05 if boga_yil <= 8 else 0.05 + (boga_yil - 8) * 0.12
        if random.random() < ayi_olasiligi:
            rejim, boga_yil = 2, 0
            zirve_fiyat = fiyat
            p = ALTIN_REJIMLER["ayi"]
            getiri = normal(p["getiri_ort"], p["getiri_std"], min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = "AYI BAŞLADI"
        else:
            p = ALTIN_REJIMLER["boga"]
            getiri = normal(p["getiri_ort"], p["getiri_std"], min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = f"boğa ({boga_yil}. yıl)"
    else:
        p = ALTIN_REJIMLER["ayi"]
        getiri = normal(p["getiri_ort"], p["getiri_std"], min_val=p["getiri_min"], max_val=p["getiri_max"])
        tepe_dusus = (fiyat - zirve_fiyat) / zirve_fiyat
        if tepe_dusus <= AYI_ESIGI:
            rejim, durgun_yil = 0, 0
            durum = "durgun (ayıdan çıkış)"
        else:
            durum = f"ayı (tepeden %{round(tepe_dusus*100,1)})"
    yeni_fiyat = round(fiyat * (1 + getiri), 2)
    if rejim == 1:
        zirve_fiyat = max(zirve_fiyat, yeni_fiyat)
    return getiri, rejim, durgun_yil, boga_yil, zirve_fiyat, yeni_fiyat, durum

# ── BIST + FAİZ ───────────────────────────────────────────────
def faiz_uret(enflasyon, rejim, onceki_faiz, sapma_olasiligi=0.08):
    sapma = random.random() < sapma_olasiligi
    if sapma:
        hedef = enflasyon * normal(0.2, 0.08, min_val=0.1, max_val=0.4)
        mod = "SAPMA"
    elif rejim == 0:
        hedef = enflasyon * normal(0.95, 0.10, min_val=0.6, max_val=1.3)
        mod = "normal"
    else:
        hedef = enflasyon * normal(0.75, 0.15, min_val=0.45, max_val=1.1)
        mod = "kriz"
    max_degisim = onceki_faiz * (0.50 if rejim == 1 else 0.30)
    faiz = max(onceki_faiz - max_degisim, min(onceki_faiz + max_degisim, hedef))
    faiz = round(max(faiz, 2.0), 1)
    if faiz > onceki_faiz * 1.05:   yon = "up"
    elif faiz < onceki_faiz * 0.95: yon = "down"
    else:                            yon = "stable"
    return faiz, yon, mod

def bist_getiri_uret(faiz_yon, enflasyon, enf_rejim=0):
    if faiz_yon == "down":
        bias = normal(0.40, 0.15, min_val=0.0, max_val=0.90)
    elif faiz_yon == "up":
        bias = normal(0.15, 0.15, min_val=-0.30, max_val=0.50)
    else:
        bias = normal(0.25, 0.12, min_val=-0.10, max_val=0.50)
    if enf_rejim == 1:
        bias += normal(0.15, 0.10, min_val=0.0, max_val=0.35)
    sok = normal(0, 0.20, min_val=-0.40, max_val=0.40)
    getiri = (bias + sok) * 100
    return max(-55.0, min(100.0, getiri))

# ── MEVDUAT ───────────────────────────────────────────────────
def mevduat_faizi_uret(enflasyon, rejim):
    if rejim == 0:
        carpan = normal(0.95, 0.12, min_val=0.70, max_val=1.20)
    else:
        carpan = normal(0.65, 0.15, min_val=0.40, max_val=0.90)
    faiz = round(enflasyon * carpan, 1)
    return faiz, round(carpan, 2), round(faiz - enflasyon, 1)

# ── API ───────────────────────────────────────────────────────
@app.post("/yil-atla")
def yil_atla(state: dict):
    enf_rejim        = state.get("enf_rejim", 0)
    enf_sakin_yil    = state.get("enf_sakin_yil", 0)
    enf_kriz_mevcut  = state.get("enf_kriz_mevcut", None)
    enf_kriz_dusus   = state.get("enf_kriz_dusus", None)
    kur              = state.get("kur", 40.0)
    kur_ham          = state.get("kur_ham", 40.0)
    reden_sayaci     = state.get("reden_sayaci", 0)
    altin_usd        = state.get("altin_usd", 2600.0)
    altin_zirve      = state.get("altin_zirve", 2600.0)
    altin_rejim      = state.get("altin_rejim", 1)
    altin_durgun_yil = state.get("altin_durgun_yil", 0)
    altin_boga_yil   = state.get("altin_boga_yil", 7)
    faiz             = state.get("faiz", 12.0)
    bist             = state.get("bist", 100.0)
    mevduat_birikim  = state.get("mevduat_birikim", 100.0)

    # Hesaplamalar
    enf, enf_rejim, enf_sakin_yil, enf_kriz_mevcut, enf_kriz_dusus, enf_durum = \
        enflasyon_sim(enf_rejim, enf_sakin_yil, enf_kriz_mevcut, enf_kriz_dusus)

    doviz_degisim, doviz_carpan = doviz_sim(enf, enf_rejim)
    kur_ham = round(kur_ham * (1 + doviz_degisim / 100), 2)
    kur = round(kur * (1 + doviz_degisim / 100), 2)
    redenominasyon = None
    if kur >= 1000:
        kur = round(kur / 1000, 2)
        reden_sayaci += 1
        redenominasyon = f"YENİ TL #{reden_sayaci}"

    altin_getiri, altin_rejim, altin_durgun_yil, altin_boga_yil, \
    altin_zirve, altin_usd, altin_durum = \
        altin_sim(altin_rejim, altin_durgun_yil, altin_boga_yil,
                 altin_zirve, altin_usd, enf_rejim)
    altin_try_getiri = round(altin_getiri * 100 + doviz_degisim, 1)

    faiz, faiz_yon, faiz_mod = faiz_uret(enf, enf_rejim, faiz)
    bist_pct = bist_getiri_uret(faiz_yon, enf, enf_rejim)
    bist = round(bist * (1 + bist_pct / 100), 2)

    mev_faiz, mev_carpan, mev_reel = mevduat_faizi_uret(enf, enf_rejim)
    mevduat_birikim = round(mevduat_birikim * (1 + mev_faiz / 100), 2)

    return {
        # Yeni state
        "enf_rejim": enf_rejim,
        "enf_sakin_yil": enf_sakin_yil,
        "enf_kriz_mevcut": enf_kriz_mevcut,
        "enf_kriz_dusus": enf_kriz_dusus,
        "kur": kur,
        "kur_ham": kur_ham,
        "reden_sayaci": reden_sayaci,
        "altin_usd": altin_usd,
        "altin_zirve": altin_zirve,
        "altin_rejim": altin_rejim,
        "altin_durgun_yil": altin_durgun_yil,
        "altin_boga_yil": altin_boga_yil,
        "faiz": faiz,
        "bist": bist,
        "mevduat_birikim": mevduat_birikim,
        # Bu yılın çıktıları
        "yil_sonucu": {
            "enflasyon": round(enf, 1),
            "enf_durum": enf_durum,
            "doviz_degisim": round(doviz_degisim, 1),
            "kur_gosterim": kur,
            "redenominasyon": redenominasyon,
            "altin_try_getiri": altin_try_getiri,
            "altin_durum": altin_durum,
            "bist_pct": round(bist_pct, 1),
            "faiz_yon": faiz_yon,
            "mev_faiz": mev_faiz,
            "reel_bist": round(bist_pct - enf, 1),
            "reel_altin": round(altin_try_getiri - enf, 1),
            "reel_mevduat": round(mev_faiz - enf, 1),
            "reel_doviz": round(doviz_degisim - enf, 1),
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}