import random
import math
from .utils import normal

ALTIN_REJIMLER = {
    "durgun": {"getiri_ort": 0.02, "getiri_std": 0.08, "getiri_min": -0.05, "getiri_max": 0.12},
    "boga":   {"getiri_ort": 0.15, "getiri_std": 0.15, "getiri_min": 0.05,  "getiri_max": 0.40},
    "ayi":    {"getiri_ort": -0.10,"getiri_std": 0.10, "getiri_min": -0.25, "getiri_max": -0.01},
}
AYI_ESIGI = -0.30

def altin_sim(rejim, durgun_yil, boga_yil, zirve_fiyat, fiyat, enflasyon_rejim=0):
    if rejim == 0:
        boga_olasiligi = 1 - math.exp(-0.07 * durgun_yil)
        if enflasyon_rejim == 1:
            boga_olasiligi = min(boga_olasiligi + 0.15, 0.90)
        if random.random() < boga_olasiligi and durgun_yil >= 2:
            rejim, durgun_yil, boga_yil = 1, 0, 1
            zirve_fiyat = fiyat
            p = ALTIN_REJIMLER["boga"]
            getiri = normal(p["getiri_ort"], p["getiri_std"],
                           min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = "BOĞA BAŞLADI"
        else:
            durgun_yil += 1
            p = ALTIN_REJIMLER["durgun"]
            getiri = normal(p["getiri_ort"], p["getiri_std"],
                           min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = f"durgun ({durgun_yil}. yıl)"
    elif rejim == 1:
        boga_yil += 1
        ayi_olasiligi = 0.05 if boga_yil <= 5 else 0.05 + (boga_yil - 5) * 0.15
        if random.random() < ayi_olasiligi:
            rejim, boga_yil = 2, 0
            zirve_fiyat = fiyat
            p = ALTIN_REJIMLER["ayi"]
            getiri = normal(p["getiri_ort"], p["getiri_std"],
                           min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = "AYI BAŞLADI"
        else:
            p = ALTIN_REJIMLER["boga"]
            getiri = normal(p["getiri_ort"], p["getiri_std"],
                           min_val=p["getiri_min"], max_val=p["getiri_max"])
            durum = f"boğa ({boga_yil}. yıl)"
    else:
        p = ALTIN_REJIMLER["ayi"]
        getiri = normal(p["getiri_ort"], p["getiri_std"],
                       min_val=p["getiri_min"], max_val=p["getiri_max"])
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