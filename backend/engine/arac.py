import random
import uuid

ARAC_TABAN_FIYATLAR = {
    "kucuk": (300_000, 600_000),
    "orta":  (700_000, 1_500_000),
    "spor":  (2_000_000, 5_000_000),
}

YILLIK_AMORTISMAN_ORANI = 0.94

def arac_fiyati_uret(segment, enflasyon_endeksi, vergi_carpani):
    min_f, max_f = ARAC_TABAN_FIYATLAR[segment]
    olcek = enflasyon_endeksi / 100
    return round(random.uniform(min_f, max_f) * olcek * vergi_carpani, -3)

def arac_guncel_deger(alis_fiyati, sahiplik_yili):
    return round(alis_fiyati * (YILLIK_AMORTISMAN_ORANI ** sahiplik_yili))

def vergi_zammi_uygula(mevcut_carpan):
    zam_orani = random.uniform(1.30, 1.40)
    return round(mevcut_carpan * zam_orani, 2)

def arac_piyasasi_uret(enflasyon_endeksi, vergi_carpani):
    market = []
    segmentler = ["kucuk", "kucuk", "orta", "orta", "spor", "spor"]
    isimler = {
        "kucuk": ["Ekonomik Hatchback", "Şehir Aracı", "Kompakt Sedan", "Giriş Sınıfı"],
        "orta": ["C-SUV", "D-Sedan", "Premium Hatchback", "Aile Aracı"],
        "spor": ["Premium Coupe", "Performans SUV", "Lüks Sedan", "Spor Araba"]
    }
    
    for seg in segmentler:
        market.append({
            "id": str(uuid.uuid4())[:8],
            "isim": random.choice(isimler[seg]),
            "tip": seg,
            "fiyat": arac_fiyati_uret(seg, enflasyon_endeksi, vergi_carpani)
        })
    return market
