import json
import random
import os


_EVENT_DOSYASI = os.path.join(os.path.dirname(__file__), "events.json")

with open(_EVENT_DOSYASI, "r", encoding="utf-8") as f:
    EVENT_HAVUZU = json.load(f)


def event_sec(mevcut_yil: int, mevcut_yas: int, event_gecmisi: dict, 
              enf_rejim: int = 0, tetiklenenler: list = None,portfoy=None) -> dict:
    """
    mevcut_yas: kullanıcının yaşı
    event_gecmisi: {"ev_001": 2031} — son tetiklenme yılları
    enf_rejim: 0=sakin, 1=kriz
    tetiklenenler: tek_seferlik eventlerin id listesi
    """
    if tetiklenenler is None:
        tetiklenenler = []
    if portfoy is None:
        portfoy = {}


    uygun = []
    for e in EVENT_HAVUZU:
        # Tek seferlik kontrolü
        if e.get("tek_seferlik", False) and e["id"] in tetiklenenler:
            continue

        # Cooldown kontrolü
        son_tetik = event_gecmisi.get(e["id"], 0)
        if mevcut_yil - son_tetik < e.get("cooldown_yil", 0):
            continue

        # Yaş aralığı kontrolü
        min_yas = e.get("min_yas")
        max_yas = e.get("max_yas")
        if min_yas and mevcut_yas < min_yas:
            continue
        if max_yas and mevcut_yas > max_yas:
            continue

        # Tetik tipi kontrolü
        tetik = e.get("tetik", "her_zaman")
        if tetik == "kriz" and enf_rejim != 1:
            continue
        if tetik == "sakin" and enf_rejim != 0:
            continue

        uygun.append(e)

    # Varlık kontrolü
        gerekli = e.get("gerekli_varlik")
        if gerekli == "bist" and portfoy.get("bist_adet", 0) <= 0:
            continue
        if gerekli == "altin" and portfoy.get("altin_gram", 0) <= 0:
            continue
        if gerekli == "dolar" and portfoy.get("dolar", 0) <= 0:
            continue
        if gerekli == "mevduat" and portfoy.get("mevduat_tl", 0) <= 0:
            continue

        uygun.append(e)# Varlık kontrolü
        gerekli = e.get("gerekli_varlik")
        if gerekli == "bist" and portfoy.get("bist_adet", 0) <= 0:
            continue
        if gerekli == "altin" and portfoy.get("altin_gram", 0) <= 0:
            continue
        if gerekli == "dolar" and portfoy.get("dolar", 0) <= 0:
            continue
        if gerekli == "mevduat" and portfoy.get("mevduat_tl", 0) <= 0:
            continue

        uygun.append(e)

    # Uygun event yoksa her_zaman olanlardan seç
    if not uygun:
        uygun = [e for e in EVENT_HAVUZU 
                 if e.get("tetik", "her_zaman") == "her_zaman"
                 and e.get("gerekli_varlik") is None]

    if not uygun:
        return None

    agirliklar = [e.get("agirlik", 1) for e in uygun]
    return random.choices(uygun, weights=agirliklar, k=1)[0]


def detayli_bias_raporu(event_kayitlari: list) -> dict:
    rapor = {}
    for kayit in event_kayitlari:
        bias = kayit.get("bias", "bilinmiyor")
        if bias not in rapor:
            rapor[bias] = {"sayi": 0, "yuzde": 0, "kararlar": []}
        rapor[bias]["sayi"] += 1
        rapor[bias]["kararlar"].append({
            "yil": kayit.get("yil"),
            "event": kayit.get("event_baslik"),
            "secim": kayit.get("secim_metin"),
        })

    toplam = sum(v["sayi"] for v in rapor.values())
    for bias in rapor:
        rapor[bias]["yuzde"] = round(rapor[bias]["sayi"] / toplam * 100, 1) if toplam > 0 else 0

    return {
        "bias_raporu": rapor,
        "toplam_event": toplam,
        "en_belirgin_bias": max(rapor, key=lambda b: rapor[b]["sayi"]) if rapor else None
    }