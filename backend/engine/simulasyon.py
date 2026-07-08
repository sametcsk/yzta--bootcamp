from .enflasyon import enflasyon_sim
from .doviz import doviz_sim
from .altin import altin_sim
from .bist import faiz_uret, bist_getiri_uret
from .mevduat import mevduat_faizi_uret
from events.event_engine import event_sec

def yil_hesapla(state: dict, mevcut_yil: int = 2025, event_gecmisi: dict = None, tetiklenenler: list = None) -> dict:
    if event_gecmisi is None:
        event_gecmisi = {}
    if tetiklenenler is None:
        tetiklenenler = []

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
    mevcut_yas       = state.get("yas", 25)

    # 1. Enflasyon
    enf, enf_rejim, enf_sakin_yil, enf_kriz_mevcut, enf_kriz_dusus, enf_durum = \
        enflasyon_sim(enf_rejim, enf_sakin_yil, enf_kriz_mevcut, enf_kriz_dusus)

    # 2. Döviz
    doviz_degisim, doviz_carpan = doviz_sim(enf, enf_rejim)
    kur_ham = round(kur_ham * (1 + doviz_degisim / 100), 2)
    kur = round(kur * (1 + doviz_degisim / 100), 2)
    redenominasyon = None
    if kur >= 1000:
        kur = round(kur / 1000, 2)
        reden_sayaci += 1
        redenominasyon = f"YENİ TL #{reden_sayaci}"

    # 3. Altın
    altin_getiri, altin_rejim, altin_durgun_yil, altin_boga_yil, \
    altin_zirve, altin_usd, altin_durum = \
        altin_sim(altin_rejim, altin_durgun_yil, altin_boga_yil,
                 altin_zirve, altin_usd, enf_rejim)
    altin_try_getiri = round(altin_getiri * 100 + doviz_degisim, 1)

    # 4. BIST
    faiz, faiz_yon, faiz_mod = faiz_uret(enf, enf_rejim, faiz)
    bist_pct = bist_getiri_uret(faiz_yon, enf, enf_rejim)
    bist = round(bist * (1 + bist_pct / 100), 2)

    # 5. Mevduat
    mev_faiz, mev_carpan, mev_reel = mevduat_faizi_uret(enf, enf_rejim)
    mevduat_birikim = round(mevduat_birikim * (1 + mev_faiz / 100), 2)

    # 6. Event
    secilen_event = event_sec(
        mevcut_yil=mevcut_yil,
        mevcut_yas=mevcut_yas,
        event_gecmisi=event_gecmisi,
        enf_rejim=enf_rejim,
        tetiklenenler=tetiklenenler,
        portfoy=state.get("portfoy", {})
    )

    return {
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
            "fiyatlar": {
                "altin_try_gram": round((altin_usd / 31.1) * kur, 2),
                "bist_endeks": round(bist, 2),
                "dolar_try": round(kur, 2),
                "mev_faiz_oran": round(mev_faiz / 100, 4),
            },
            "event": {
                "id": secilen_event["id"],
                "baslik": secilen_event["baslik"],
                "metin": secilen_event["metin"],
                "bias_etiketi": secilen_event["bias_etiketi"],
                "tek_seferlik": secilen_event.get("tek_seferlik", False),
                "secenekler": secilen_event["secenekler"],
            } if secilen_event else None,
        }
    }