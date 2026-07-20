import json
import random
import os


_EVENT_DOSYASI = os.path.join(os.path.dirname(__file__), "events.json")

with open(_EVENT_DOSYASI, "r", encoding="utf-8") as f:
    EVENT_HAVUZU = json.load(f)


def event_sec(mevcut_yil: int, mevcut_yas: int, event_gecmisi: dict, 
              enf_rejim: int = 0, tetiklenenler: list = None, portfoy=None,
              is_yeri: str = None, is_level: int = 1, makro_veriler: dict = None,
              nakit_usd: float = 0.0) -> dict:
    if tetiklenenler is None:
        tetiklenenler = []
    if portfoy is None:
        portfoy = {}

    # Zorunlu emeklilik — 60'a kadar hiç tetiklenmediyse kesin tetikle
    if mevcut_yas >= 65 and "ev_emeklilik" not in tetiklenenler:
        emeklilik_event = next((e for e in EVENT_HAVUZU if e["id"] == "ev_emeklilik"), None)
        if emeklilik_event:
            return emeklilik_event

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
        # Meslek kontrolü — meslek alanı yoksa herkese açık, varsa sadece o mesleğe
        gerekli_meslek = e.get("meslek")
        if gerekli_meslek and gerekli_meslek != is_yeri:
            continue
        # Level aralığı kontrolü — meslek bazlı event'ler için
        min_level = e.get("min_level")
        max_level = e.get("max_level")
        if min_level and is_level < min_level:
            continue
        if max_level and is_level > max_level:
            continue
        # Tetik tipi kontrolü
        tetik = e.get("tetik", "her_zaman")
        if tetik == "kriz" and enf_rejim != 1:
            continue
        if tetik == "sakin" and enf_rejim != 0:
            continue
            
        # Makro tetik kontrolü
        makro_tetik = e.get("makro_tetik")
        if makro_tetik and makro_veriler:
            if "bist_pct_max" in makro_tetik and makro_veriler.get("bist_pct", 0) > makro_tetik["bist_pct_max"]:
                continue
            if "bist_pct_min" in makro_tetik and makro_veriler.get("bist_pct", 0) < makro_tetik["bist_pct_min"]:
                continue
            if "doviz_degisim_min" in makro_tetik and makro_veriler.get("doviz_degisim", 0) < makro_tetik["doviz_degisim_min"]:
                continue
                
        # Varlık kontrolü — en sona, tek kez
        gerekli = e.get("gerekli_varlik")
        if gerekli == "bist" and portfoy.get("bist_adet", 0) <= 0:
            continue
        if gerekli and gerekli.startswith("bist_") and gerekli != "bist":
            adet_key = f"{gerekli}_adet"
            if portfoy.get(adet_key, 0) <= 0:
                continue
        if gerekli == "altin" and portfoy.get("altin_gram", 0) <= 0:
            continue
        if gerekli == "dolar" and portfoy.get("dolar", 0) <= 0:
            continue
        if gerekli == "mevduat" and portfoy.get("mevduat_tl", 0) <= 0:
            continue
        if gerekli == "kirada_ev_var" and not portfoy.get("kirada_ev_var", False):
            continue

        # Event Bazlı Nakit/Varlık Kilitleri (ör. Zenginlik eventi için)
        event_kilidi = e.get("event_kilidi")
        if event_kilidi:
            if event_kilidi.get("tur") == "nakit_usd":
                if nakit_usd < event_kilidi.get("min", 0):
                    continue

        # Yan eventler ana event havuzunda değerlendirilemez
        if e.get("kategori") == "yan_event":
            continue

        uygun.append(e)  # ← tek bir kez, tüm kontrollerden sonra

    if not uygun:
        uygun = [e for e in EVENT_HAVUZU 
                 if e.get("tetik", "her_zaman") == "her_zaman"
                 and e.get("gerekli_varlik") is None
                 and not (e.get("tek_seferlik", False) and e["id"] in tetiklenenler)
                 and (not e.get("meslek") or e.get("meslek") == is_yeri)]
    if not uygun:
        return None

    agirliklar = [e.get("agirlik", 1) for e in uygun]
    return random.choices(uygun, weights=agirliklar, k=1)[0]


def yan_event_sec(mevcut_yil: int, mevcut_yas: int, event_gecmisi: dict, tetiklenenler: list = None, is_yeri: str = None, universite_yili: int = 0) -> list:
    """
    Belirli ihtimallerle (ve cooldown kurallarıyla) ana event haricinde tetiklenen
    ekstra (side) eventleri döndürür.
    """
    if tetiklenenler is None:
        tetiklenenler = []
    
    secilen_yan_eventler = []
    yan_event_havuzu = [e for e in EVENT_HAVUZU if e.get("kategori") == "yan_event"]
    
    uni_adaylari = []
    is_adaylari = []
    diger_yan_eventler = []

    for e in yan_event_havuzu:
        # Tek seferlik kontrolü
        if e.get("tek_seferlik", False) and e["id"] in tetiklenenler:
            continue
        # Cooldown kontrolü
        son_tetik = event_gecmisi.get(e["id"], 0)
        if mevcut_yil - son_tetik < e.get("cooldown_yil", 0):
            continue
            
        if e.get("is_uni_event"):
            uni_adaylari.append(e)
        elif e.get("is_is_event"):
            is_adaylari.append(e)
        else:
            diger_yan_eventler.append(e)

    # OTV Zammı gibi diğer yan eventleri ekle
    for e in diger_yan_eventler:
        if e["id"] == "ev_otv_zammi":
            if random.random() < 0.07:
                secilen_yan_eventler.append(e)

    # Üniversite Eventleri (Yılda en fazla 1 adet)
    if universite_yili > 0 and uni_adaylari:
        if random.random() < 0.35: # %35 ihtimalle üniversite eventi
            secilen_yan_eventler.append(random.choice(uni_adaylari))

    # İş Eventleri (Yılda en fazla 1 adet)
    if is_yeri and is_yeri not in ["lise_mezunu", "emekli"] and is_adaylari:
        if random.random() < 0.25: # %25 ihtimalle o yıla meslek eventi düşer
            secilen_yan_eventler.append(random.choice(is_adaylari))

    return secilen_yan_eventler


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