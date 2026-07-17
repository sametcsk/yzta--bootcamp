import random
from .utils import normal

# Gayrimenkul, dolar bazında kendi bağımsız driftiyle ilerler (altın gibi
# ayrı bir varlık sınıfı, ama boğa/ayı gibi sert rejimleri yok — tek,
# düşük oynaklıklı bir dağılım yeterli).
EMLAK_GETIRI_ORT = 0
EMLAK_GETIRI_STD = 0.05
EMLAK_GETIRI_MIN = -0.10
EMLAK_GETIRI_MAX = 0.10

FIYAT_USD_ARALIKLARI = {
    "ucuz":   (10_000, 25_000),
    "orta":   (30_000, 70_000),
    "pahali": (80_000, 250_000),
}

KIRA_GETIRI_ARALIKLARI = {
    "ucuz":   (0.05, 0.08),
    "orta":   (0.04, 0.06),
    "pahali": (0.03, 0.05),
}

SEGMENT_GORSEL = {
    "ucuz": "ucuzev",
    "orta": "ortaev",
    "pahali": "pahaliev",
}

EV_SAYISI_PER_SEGMENT = 2


def emlak_endeksi_usd_guncelle(endeks_usd):
    """
    Gayrimenkulün dolar bazındaki bağımsız piyasa hareketi. Kur'dan ayrık.
    Artık hem yüzdesel getiriyi hem yeni endeksi döndürüyor (reel_emlak
    hesabı için gerekli).
    """
    yillik_getiri = normal(EMLAK_GETIRI_ORT, EMLAK_GETIRI_STD,
                            min_val=EMLAK_GETIRI_MIN, max_val=EMLAK_GETIRI_MAX)
    yeni_endeks = round(endeks_usd * (1 + yillik_getiri), 2)
    return round(yillik_getiri * 100, 1), yeni_endeks


def ev_fiyati_hesapla(fiyat_usd_taban, dolar_try, emlak_endeksi_usd):
    """
    fiyat_usd_taban: evin piyasaya çıktığı andaki sabit USD taban değeri.
    Hem alışta hem satışta (güncel endeks/kur ile) bu taban kullanılır,
    böylece bir evin değeri zaman içinde tutarlı şekilde güncellenir.
    """
    return round(fiyat_usd_taban * (emlak_endeksi_usd / 100) * dolar_try, -3)


def kira_orani_uret(segment):
    """Bir evin kira getiri oranı — üretildiği anda sabitlenir, hep aynı kalır."""
    min_o, max_o = KIRA_GETIRI_ARALIKLARI[segment]
    oran = normal((min_o + max_o) / 2, (max_o - min_o) / 4, min_val=min_o, max_val=max_o)
    return round(oran, 4)


def piyasa_uret(yil, dolar_try, emlak_endeksi_usd):
    """
    O yılın satılık ev listesini üretir — her segmentten EV_SAYISI_PER_SEGMENT
    adet, toplam 6. Önceki yılın satılmamış evleri tamamen silinir, pazar
    her yıl baştan üretilir.
    """
    evler = []
    for segment, (min_usd, max_usd) in FIYAT_USD_ARALIKLARI.items():
        for i in range(EV_SAYISI_PER_SEGMENT):
            fiyat_usd_taban = round(random.uniform(min_usd, max_usd))
            evler.append({
                "id": f"ev_{yil}_{segment}_{i + 1}",
                "segment": segment,
                "gorsel": SEGMENT_GORSEL[segment],
                "fiyat_usd_taban": fiyat_usd_taban,
                "fiyat_tl": ev_fiyati_hesapla(fiyat_usd_taban, dolar_try, emlak_endeksi_usd),
                "kira_orani": kira_orani_uret(segment),
            })
    return evler
