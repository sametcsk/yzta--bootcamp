import random
from .utils import normal

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

SEKTOR_AGIRLIKLARI = {
    "bankacilik": 0.30,
    "teknoloji":  0.20,
    "insaat":     0.20,
    "saglik":     0.15,
    "perakende":  0.15,
}

def sektor_dispersiyon_std(reel_bist):
    """
    Endeks reel olarak yatay seyrediyorsa (rotasyon yılı) dağılım geniş,
    endeks güçlü bir yöne gidiyorsa (birlikte hareket) dağılım dar olur.
    """
    baz_std = 22
    yatay_carpan = max(0.5, 1.7 - abs(reel_bist) / 25)
    return baz_std * yatay_carpan

def sektorleri_uret(bist_pct, reel_bist, enf, faiz, faiz_yon, enf_rejim):
    """
    Her sektör için: endeks getirisi + kendi bağımsız gürültüsü + makroekonomik eğilim (alpha).
    """
    std = sektor_dispersiyon_std(reel_bist)
    sonuc = {}
    for sektor in SEKTOR_AGIRLIKLARI:
        gurultu = normal(0, std, min_val=-70, max_val=90)
        
        alpha = 0
        if sektor == "bankacilik":
            if faiz_yon == "up": alpha += 10
            elif faiz_yon == "down": alpha -= 10
            if faiz > 40: alpha += 5
            
        elif sektor == "teknoloji":
            if faiz_yon == "down": alpha += 15
            elif faiz_yon == "up": alpha -= 15
            
        elif sektor == "insaat":
            if faiz_yon == "down": alpha += 12
            if faiz > 40: alpha -= 15
            
        elif sektor == "saglik":
            if enf_rejim == 1: alpha += 15
            if bist_pct < 0: alpha += abs(bist_pct) * 0.3
            if bist_pct > 30: alpha -= 10
            
        elif sektor == "perakende":
            if enf > 40: alpha += 12
            elif enf < 20: alpha -= 5
            
        # Rastgelelik ile alpha'yı uygula
        alpha_gercek = alpha * normal(1, 0.2, min_val=0.5, max_val=1.5)
        
        sonuc[sektor] = round(bist_pct + gurultu + alpha_gercek, 1)
        
    return sonuc, std