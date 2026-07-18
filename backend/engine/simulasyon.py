from .enflasyon import enflasyon_sim
from .doviz import doviz_sim
from .altin import altin_sim
from .bist import faiz_uret, bist_getiri_uret, sektorleri_uret, SEKTOR_AGIRLIKLARI
from .mevduat import mevduat_faizi_uret
from .gayrimenkul import emlak_endeksi_usd_guncelle, piyasa_uret
from .arac import arac_piyasasi_uret, vergi_zammi_uygula
from events.event_engine import event_sec, yan_event_sec
from .fisilti import fisilti_uret
import random

def makro_zarlari_at(state):
    enf_rejim        = state.get("enf_rejim", 0)
    enf_sakin_yil    = state.get("enf_sakin_yil", 0)
    enf_kriz_mevcut  = state.get("enf_kriz_mevcut", None)
    enf_kriz_dusus   = state.get("enf_kriz_dusus", None)
    faiz             = state.get("faiz", 12.0)
    altin_usd        = state.get("altin_usd", 2600.0)
    altin_zirve      = state.get("altin_zirve", 2600.0)
    altin_rejim      = state.get("altin_rejim", 1)
    altin_durgun_yil = state.get("altin_durgun_yil", 0)
    altin_boga_yil   = state.get("altin_boga_yil", 7)
    
    # 1. Enflasyon
    enf, enf_rejim, enf_sakin_yil, enf_kriz_mevcut, enf_kriz_dusus, enf_durum = \
        enflasyon_sim(enf_rejim, enf_sakin_yil, enf_kriz_mevcut, enf_kriz_dusus)

    # 2. Döviz
    doviz_degisim, doviz_carpan = doviz_sim(enf, enf_rejim)

    # 3. Altın
    altin_getiri, altin_rejim, altin_durgun_yil, altin_boga_yil, \
    altin_zirve, altin_usd, altin_durum = \
        altin_sim(altin_rejim, altin_durgun_yil, altin_boga_yil,
                 altin_zirve, altin_usd, enf_rejim)

    # 4. BIST & Sektörler
    faiz, faiz_yon, faiz_mod = faiz_uret(enf, enf_rejim, faiz)
    bist_pct = bist_getiri_uret(faiz_yon, enf, enf_rejim)
    reel_bist = round(bist_pct - enf, 1)
    sektor_getirileri, sektor_std = sektorleri_uret(bist_pct, reel_bist, enf, faiz, faiz_yon, enf_rejim)

    # 5. Mevduat
    mev_faiz, mev_carpan, mev_reel = mevduat_faizi_uret(enf, enf_rejim)

    return {
        "enf": enf, "enf_rejim": enf_rejim, "enf_sakin_yil": enf_sakin_yil,
        "enf_kriz_mevcut": enf_kriz_mevcut, "enf_kriz_dusus": enf_kriz_dusus, "enf_durum": enf_durum,
        "doviz_degisim": doviz_degisim, "doviz_carpan": doviz_carpan,
        "altin_getiri": altin_getiri, "altin_rejim": altin_rejim, "altin_durgun_yil": altin_durgun_yil,
        "altin_boga_yil": altin_boga_yil, "altin_zirve": altin_zirve, "altin_usd": altin_usd, "altin_durum": altin_durum,
        "faiz": faiz, "faiz_yon": faiz_yon, "faiz_mod": faiz_mod,
        "bist_pct": bist_pct, "reel_bist": reel_bist,
        "sektor_getirileri": sektor_getirileri, "sektor_std": sektor_std,
        "mev_faiz": mev_faiz, "mev_carpan": mev_carpan, "mev_reel": mev_reel
    }


def yil_hesapla(state: dict, mevcut_yil: int = 2025, event_gecmisi: dict = None, tetiklenenler: list = None) -> dict:
    if event_gecmisi is None:
        event_gecmisi = {}
    if tetiklenenler is None:
        tetiklenenler = []

    mevcut_yas = state.get("yas", 25)
    is_yeri = state.get("is_yeri")
    is_level = state.get("is_level", 1)
    reden_sayaci = state.get("reden_sayaci", 0)

    # Makroekonomik Zarlar (Eğer bir önceki yıldan fısıltı olarak hesaplanmışsa onu kullan)
    gelecek_makro = state.get("gelecek_makro")
    if gelecek_makro:
        m = gelecek_makro
    else:
        m = makro_zarlari_at(state)
        
    enf = m["enf"]
    enf_rejim = m["enf_rejim"]
    enf_sakin_yil = m["enf_sakin_yil"]
    enf_kriz_mevcut = m["enf_kriz_mevcut"]
    enf_kriz_dusus = m["enf_kriz_dusus"]
    enf_durum = m["enf_durum"]
    
    doviz_degisim = m["doviz_degisim"]
    
    altin_getiri = m["altin_getiri"]
    altin_rejim = m["altin_rejim"]
    altin_durgun_yil = m["altin_durgun_yil"]
    altin_boga_yil = m["altin_boga_yil"]
    altin_zirve = m["altin_zirve"]
    altin_usd = m["altin_usd"]
    altin_durum = m["altin_durum"]
    
    faiz = m["faiz"]
    faiz_yon = m["faiz_yon"]
    
    bist_pct = m["bist_pct"]
    reel_bist = m["reel_bist"]
    sektor_getirileri = m["sektor_getirileri"]
    
    mev_faiz = m["mev_faiz"]

    # Fiyatların ve Birikimlerin Güncellenmesi
    kur_ham = round(state.get("kur_ham", 40.0) * (1 + doviz_degisim / 100), 2)
    kur = round(state.get("kur", 40.0) * (1 + doviz_degisim / 100), 2)
    
    sektor_ekstra = state.get("sektor_ekstra_getiri")
    if sektor_ekstra and isinstance(sektor_ekstra, dict):
        s_isim = sektor_ekstra.get("sektor")
        s_getiri = sektor_ekstra.get("getiri", 0)
        if s_isim in sektor_getirileri:
            sektor_getirileri[s_isim] += s_getiri
    
    bist = round(state.get("bist", 100.0) * (1 + bist_pct / 100), 2)
    bist_bankacilik = round(state.get("bist_bankacilik", 100.0) * (1 + sektor_getirileri["bankacilik"] / 100), 2)
    bist_teknoloji  = round(state.get("bist_teknoloji", 100.0) * (1 + sektor_getirileri["teknoloji"] / 100), 2)
    bist_insaat     = round(state.get("bist_insaat", 100.0) * (1 + sektor_getirileri["insaat"] / 100), 2)
    bist_saglik     = round(state.get("bist_saglik", 100.0) * (1 + sektor_getirileri["saglik"] / 100), 2)
    bist_perakende  = round(state.get("bist_perakende", 100.0) * (1 + sektor_getirileri["perakende"] / 100), 2)

    redenominasyon = None
    if kur >= 1000:
        kur = round(kur / 1000, 2)
        bist = round(bist / 1000, 2)
        bist_bankacilik = round(bist_bankacilik / 1000, 2)
        bist_teknoloji = round(bist_teknoloji / 1000, 2)
        bist_insaat = round(bist_insaat / 1000, 2)
        bist_saglik = round(bist_saglik / 1000, 2)
        bist_perakende = round(bist_perakende / 1000, 2)
        reden_sayaci += 1
        redenominasyon = f"YENİ TL #{reden_sayaci}"
    
    mevduat_birikim = round(state.get("mevduat_birikim", 100.0) * (1 + mev_faiz / 100), 2)
    
    altin_try_getiri = round(altin_getiri * 100 + doviz_degisim, 1)
    
    emlak_endeksi_usd = state.get("emlak_endeksi_usd", 100.0)
    emlak_endeks_getiri, emlak_endeksi_usd = emlak_endeksi_usd_guncelle(emlak_endeksi_usd)
    emlak_try_getiri = round(emlak_endeks_getiri + doviz_degisim, 1)
    emlak_piyasasi = piyasa_uret(mevcut_yil, kur, emlak_endeksi_usd)

    arac_vergi_carpani = state.get("arac_vergi_carpani", 1.0)
    if state.get("arac_vergi_zammi"):
        arac_vergi_carpani = vergi_zammi_uygula(arac_vergi_carpani)
        
    arac_piyasasi = arac_piyasasi_uret(state.get("enflasyonEndeksi", 100.0), arac_vergi_carpani)

    # 7. Event
    secilen_event = event_sec(
        mevcut_yil=mevcut_yil,
        mevcut_yas=mevcut_yas,
        event_gecmisi=event_gecmisi,
        enf_rejim=enf_rejim,
        tetiklenenler=tetiklenenler,
        portfoy=state.get("portfoy", {}),
        is_yeri=is_yeri,
        is_level=is_level
    )

    # Fısıltı Mantığı (Gelecek Yıl Tahmini)
    secilen_yan_eventler = yan_event_sec(
        mevcut_yil=mevcut_yil,
        mevcut_yas=mevcut_yas,
        event_gecmisi=event_gecmisi,
        tetiklenenler=tetiklenenler
    )

    fisilti_sayaci = state.get("fisilti_sayaci", 0)
    fisilti_metni = None
    yeni_gelecek_makro = None

    # Olasılık: İlk yıl 0, her yıl %4 artar. (yaklaşık 5-6 yılda bir tetiklenir)
    if random.random() < fisilti_sayaci * 0.04:
        # Gelecek yılın zarlarını at
        mevcut_makro_state = {
            "enf_rejim": enf_rejim, "enf_sakin_yil": enf_sakin_yil, 
            "enf_kriz_mevcut": enf_kriz_mevcut, "enf_kriz_dusus": enf_kriz_dusus,
            "faiz": faiz, "altin_usd": altin_usd, "altin_zirve": altin_zirve,
            "altin_rejim": altin_rejim, "altin_durgun_yil": altin_durgun_yil,
            "altin_boga_yil": altin_boga_yil
        }
        yeni_gelecek_makro = makro_zarlari_at(mevcut_makro_state)
        
        fisilti_metni = fisilti_uret(m, yeni_gelecek_makro) # m is the current year macro dict
        
        if fisilti_metni:
            fisilti_sayaci = 0 # Sıfırla
        else:
            fisilti_sayaci += 1 # Konu bulunamadıysa artırmaya devam et
            yeni_gelecek_makro = None
    else:
        fisilti_sayaci += 1

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
        "bist_bankacilik": bist_bankacilik,
        "bist_teknoloji": bist_teknoloji,
        "bist_insaat": bist_insaat,
        "bist_saglik": bist_saglik,
        "bist_perakende": bist_perakende,
        "mevduat_birikim": mevduat_birikim,
        "emlak_endeksi_usd": emlak_endeksi_usd,
        "fisilti_sayaci": fisilti_sayaci,
        "gelecek_makro": yeni_gelecek_makro,
        "arac_vergi_carpani": arac_vergi_carpani,
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
            "reel_bist": reel_bist,
            "reel_altin": round(altin_try_getiri - enf, 1),
            "reel_mevduat": round(mev_faiz - enf, 1),
            "reel_doviz": round(doviz_degisim - enf, 1),
            "emlak_try_getiri": emlak_try_getiri,
            "reel_emlak": round(emlak_try_getiri - enf, 1),
            "emlak_piyasasi": emlak_piyasasi,
            "arac_piyasasi": arac_piyasasi,
            "sektor_getirileri": sektor_getirileri,
            "fiyatlar": {
                "altin_try_gram": round((altin_usd / 31.1) * kur, 2),
                "bist_endeks": round(bist, 2),
                "bist_bankacilik": round(bist_bankacilik, 2),
                "bist_teknoloji": round(bist_teknoloji, 2),
                "bist_insaat": round(bist_insaat, 2),
                "bist_saglik": round(bist_saglik, 2),
                "bist_perakende": round(bist_perakende, 2),
                "dolar_try": round(kur, 2),
                "mev_faiz_oran": round(mev_faiz / 100, 4),
            },
            "event": {
                "id": secilen_event["id"],
                "baslik": secilen_event["baslik"],
                "metin": secilen_event["metin"],
                "bias_etiketi": secilen_event.get("bias_etiketi", "none"),
                "tek_seferlik": secilen_event.get("tek_seferlik", False),
                "secenekler": secilen_event["secenekler"],
            } if secilen_event else None,
            "yan_eventler": secilen_yan_eventler,
            "fisilti": fisilti_metni,
        }
    }