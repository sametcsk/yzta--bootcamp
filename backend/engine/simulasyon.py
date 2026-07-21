from .enflasyon import enflasyon_sim
from .doviz import doviz_sim
from .altin import altin_sim
from .bist import faiz_uret, bist_getiri_uret, sektorleri_uret, SEKTOR_AGIRLIKLARI
from .mevduat import mevduat_faizi_uret
from .gayrimenkul import emlak_endeksi_usd_guncelle, piyasa_uret
from .arac import arac_piyasasi_uret, vergi_zammi_uygula
from events.event_engine import event_sec, yan_event_sec
from .fisilti import fisilti_uret
from .opsiyon import black_scholes, generate_option_chain
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
    universite_yili = state.get("universite_yili", 0)
    reden_sayaci = state.get("reden_sayaci", 0)
    cinsiyet = state.get("cinsiyet", "erkek")

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
        
    arac_piyasasi = arac_piyasasi_uret(kur, arac_vergi_carpani)

    makro_veriler = {
        "bist_pct": bist_pct,
        "doviz_degisim": doviz_degisim,
        "enf_durum": enf_durum
    }

    nakit_usd = state.get("nakit", 0) / kur if kur > 0 else 0

    # Opsiyon Değerlendirmesi
    aktif_opsiyonlar = state.get("aktif_opsiyonlar", [])
    islenen_opsiyonlar = []
    opsiyon_karlari = 0
    opsiyon_erken_bozdurma_eventi = None

    # Redenominasyon varsa strike fiyatlarını güncelle
    # 1000'e böldüğümüzü varsayarak her redenominasyon sayacı artışında (bunu yukarıda redenominasyon_carpan olarak tutalım)
    redenom_carpan = 1.0
    if redenominasyon:
        redenom_carpan = 1000.0

    for opt in aktif_opsiyonlar:
        v = opt["varlik"]
        if redenom_carpan > 1.0:
            opt["strike"] = round(opt["strike"] / redenom_carpan, 2)
            opt["premium_odenen"] = round(opt["premium_odenen"] / redenom_carpan, 2)
            
        K = opt["strike"]
        tip = opt["tip"]
        adet = opt["adet"]
        premium = opt["premium_odenen"]
        vade = opt.get("vade", 1)
        kalan_vade = opt.get("kalan_vade", vade)
        
        # 1 yıl atladık
        kalan_vade -= 1
        opt["kalan_vade"] = kalan_vade
        
        fiyat_key_map = {
            "bist_endeks": bist,
            "bist_bankacilik": bist_bankacilik,
            "bist_teknoloji": bist_teknoloji,
            "bist_insaat": bist_insaat,
            "bist_saglik": bist_saglik,
            "bist_perakende": bist_perakende,
            "altin_try_gram": (altin_usd / 31.1) * kur
        }
        
        S_son = fiyat_key_map.get(v, K)
        
        # Volatiliteyi varlığa göre dinamik al
        varlik_volatiliteleri = {
            "bist_endeks": 0.35,
            "bist_bankacilik": 0.45,
            "bist_teknoloji": 0.50,
            "bist_insaat": 0.40,
            "bist_saglik": 0.30,
            "bist_perakende": 0.35,
            "altin_try_gram": 0.20
        }
        volatilite = varlik_volatiliteleri.get(v, 0.35)
        
        r = mev_faiz / 100 # Sabit r yerine güncel mevduat faizini kullan
        
        if kalan_vade <= 0:
            # Opsiyon vadesi doldu
            brut_kar = 0
            if tip == "call" and S_son > K:
                brut_kar = (S_son - K) * adet * 100
            elif tip == "put" and S_son < K:
                brut_kar = (K - S_son) * adet * 100
                
            net_kar = brut_kar - premium
            
            islenen_opsiyonlar.append({
                **opt,
                "vadesi_doldu": True,
                "kapanis_fiyati": round(S_son, 2),
                "brut_kar": round(brut_kar, 2),
                "net_kar": round(net_kar, 2),
                "durum": "ITM" if brut_kar > 0 else "OTM"
            })
        else:
            # Opsiyon vadesi devam ediyor (örn: 2 yıllıktı, 1 yılı kaldı)
            # Güncel piyasa değerini hesapla
            guncel_premium = black_scholes(S_son, K, float(kalan_vade), r, volatilite, tip) * 100
            guncel_deger = guncel_premium * adet
            guncel_kar_zarar = guncel_deger - premium
            
            islenen_opsiyonlar.append({
                **opt,
                "vadesi_doldu": False,
                "guncel_premium": round(guncel_premium, 2),
                "guncel_deger": round(guncel_deger, 2),
                "guncel_kar_zarar": round(guncel_kar_zarar, 2)
            })



    # 7. Event
    
    # Dinamik Opsiyon Eventleri Üretimi
    dinamik_opsiyon_eventleri = []
    
    for opt in islenen_opsiyonlar:
        if opt["vadesi_doldu"]: continue
        
        K = opt["strike"]
        v = opt["varlik"]
        guncel_deger = opt["guncel_deger"]
        zarar = opt["guncel_kar_zarar"]
        maliyet = opt["premium_odenen"]
        
        # 1. Tatil Bütçesi İçin Erken Kâr Kesimi (disposition_effect)
        if zarar > 200:
            dinamik_opsiyon_eventleri.append({
                "id": f"ev_opt_1_{opt['id']}",
                "baslik": "Opsiyon Fırsatı: Erken Kâr Kesimi",
                "metin": f"{v} için aldığın opsiyon kâra geçti! Tatile gitmek için +{zarar} TL kârla bozmak ister misin?",
                "bias_etiketi": "disposition_effect",
                "tek_seferlik": True,
                "secenekler": [
                    {"id": "opt1_a", "metin": f"Evet, +{zarar} TL ile kapat (Erken Sat)", "nakit_etki": 0, "sabir_etki": -5, "mutluluk_etki": 10, "opsiyon_aksiyon": {"id": opt["id"], "aksiyon": "bozdur"}},
                    {"id": "opt1_b", "metin": "Hayır, vade sonunu bekle", "nakit_etki": 0, "sabir_etki": 5, "mutluluk_etki": 0}
                ]
            })
            
        # 2. Taşıma Maliyeti Bunalımı (disposition_effect)
        if zarar < -300:
            dinamik_opsiyon_eventleri.append({
                "id": f"ev_opt_2_{opt['id']}",
                "baslik": "Opsiyon Kâbusu: Zaman Erimesi",
                "metin": f"{v} opsiyonun eriyor! Zararı kesip ({zarar} TL) kalan {guncel_deger} TL'ni kurtarmak ister misin?",
                "bias_etiketi": "disposition_effect",
                "tek_seferlik": True,
                "secenekler": [
                    {"id": "opt2_a", "metin": f"Evet, kalan {guncel_deger} TL'yi kurtar", "nakit_etki": 0, "sabir_etki": -5, "mutluluk_etki": -5, "opsiyon_aksiyon": {"id": opt["id"], "aksiyon": "bozdur"}},
                    {"id": "opt2_b", "metin": "Hayır, sonuna kadar bekle!", "nakit_etki": 0, "sabir_etki": 10, "mutluluk_etki": -2}
                ]
            })
            
        # 3. Büyük Çöküş Dedikodusu (loss_aversion)
        if opt["tip"] == "call" and zarar < 0:
            dinamik_opsiyon_eventleri.append({
                "id": f"ev_opt_3_{opt['id']}",
                "baslik": "Büyük Çöküş Dedikodusu",
                "metin": f"Piyasada {v} için çok kötü dedikodular var. Zarardasın ({zarar} TL), tamamen sıfırlanmadan satmak ister misin?",
                "bias_etiketi": "loss_aversion",
                "tek_seferlik": True,
                "secenekler": [
                    {"id": "opt3_a", "metin": f"Hemen Sat! Kalan {guncel_deger} TL'yi kurtar", "nakit_etki": 0, "sabir_etki": -10, "mutluluk_etki": -5, "opsiyon_aksiyon": {"id": opt["id"], "aksiyon": "bozdur"}},
                    {"id": "opt3_b", "metin": "Dedikodulara kulak asma", "nakit_etki": 0, "sabir_etki": 10, "mutluluk_etki": 0}
                ]
            })

        # 4. Stop-Loss Reddi (loss_aversion)
        if guncel_deger < (maliyet * 0.20):
            dinamik_opsiyon_eventleri.append({
                "id": f"ev_opt_4_{opt['id']}",
                "baslik": "Stop-Loss Reddi",
                "metin": f"Opsiyonun %80 erimiş durumda. Kalan son {guncel_deger} TL'ni kurtarabilirsin.",
                "bias_etiketi": "loss_aversion",
                "tek_seferlik": True,
                "secenekler": [
                    {"id": "opt4_a", "metin": f"Lanet olsun, sat ({guncel_deger} TL al)", "nakit_etki": 0, "sabir_etki": 0, "mutluluk_etki": -10, "opsiyon_aksiyon": {"id": opt["id"], "aksiyon": "bozdur"}},
                    {"id": "opt4_b", "metin": "Belki döner, sonuna kadar devam!", "nakit_etki": 0, "sabir_etki": 5, "mutluluk_etki": 5}
                ]
            })
            
        # 6. Eski Zirve Yanılgısı (confirmation_bias)
        if zarar < -500:
            dinamik_opsiyon_eventleri.append({
                "id": f"ev_opt_6_{opt['id']}",
                "baslik": "Eski Zirve Yanılgısı",
                "metin": f"{v} eskiden çok daha yüksekti! Maliyet düşürmek için güncel fiyattan ek alım yapmak ister misin? (Maliyet: {opt['guncel_premium']} TL)",
                "bias_etiketi": "confirmation_bias",
                "tek_seferlik": True,
                "secenekler": [
                    {"id": "opt6_a", "metin": f"Evet, ekleme yap (-{opt['guncel_premium']} TL)", "nakit_etki": 0, "sabir_etki": 5, "mutluluk_etki": 5, "opsiyon_aksiyon": {"id": opt["id"], "aksiyon": "ekle", "premium": opt['guncel_premium']}},
                    {"id": "opt6_b", "metin": "Hayır, riski artırma", "nakit_etki": 0, "sabir_etki": 5, "mutluluk_etki": 0}
                ]
            })

        # 8. Volatilite Şoku (disposition_effect)
        if zarar < -800 and guncel_deger > 0:
            dinamik_opsiyon_eventleri.append({
                "id": f"ev_opt_8_{opt['id']}",
                "baslik": "Volatilite Şoku",
                "metin": f"Korkunç zarardasın ama ufak bir yükseliş oldu. Daha düşmeden {guncel_deger} TL ile satıp kurtulmak ister misin?",
                "bias_etiketi": "disposition_effect",
                "tek_seferlik": True,
                "secenekler": [
                    {"id": "opt8_a", "metin": f"Hemen kaç! ({guncel_deger} TL)", "nakit_etki": 0, "sabir_etki": -5, "mutluluk_etki": 0, "opsiyon_aksiyon": {"id": opt["id"], "aksiyon": "bozdur"}},
                    {"id": "opt8_b", "metin": "Bekle", "nakit_etki": 0, "sabir_etki": 5, "mutluluk_etki": 0}
                ]
            })

    # Genel Opsiyon Eventleri
    if len(islenen_opsiyonlar) > 0:
        # 7. Kumarcının Cesareti (mental_accounting)
        dinamik_opsiyon_eventleri.append({
            "id": "ev_opt_7",
            "baslik": "Kumarcının Cesareti",
            "metin": "Geçmişte opsiyonlardan kâr ettiğin için çok özgüvenlisin. Hızlıca ucuz ve çok riskli (OTM) bir opsiyona 500 TL yatırmak ister misin?",
            "bias_etiketi": "mental_accounting",
            "tek_seferlik": True,
            "secenekler": [
                {"id": "opt7_a", "metin": "Evet, şansımı deneyeyim (-500 TL)", "nakit_etki": -500, "sabir_etki": -10, "mutluluk_etki": 10},
                {"id": "opt7_b", "metin": "Hayır, kârımı koruyayım", "nakit_etki": 0, "sabir_etki": 10, "mutluluk_etki": -2}
            ]
        })
        
        # 9. Broker Promosyonu (mental_accounting)
        dinamik_opsiyon_eventleri.append({
            "id": "ev_opt_9",
            "baslik": "Broker Promosyonu",
            "metin": "Brokerın sana bedava 200 TL işlem kredisi verdi! Bununla çok riskli bir bahis mi almak istersin, yoksa güvenli bir opsiyon mu?",
            "bias_etiketi": "mental_accounting",
            "tek_seferlik": True,
            "secenekler": [
                {"id": "opt9_a", "metin": "Çok riskli! (Ya hep ya hiç)", "nakit_etki": 0, "sabir_etki": -5, "mutluluk_etki": 10},
                {"id": "opt9_b", "metin": "Güvenli yatırım", "nakit_etki": 0, "sabir_etki": 5, "mutluluk_etki": 0}
            ]
        })

    # Event Seçimi (Eğer normal event yoksa veya %20 şansla dinamik opsiyon eventi seçilsin)
    import random
    ev_data = None
    
    if dinamik_opsiyon_eventleri and random.random() < 0.30:
        ev_data = random.choice(dinamik_opsiyon_eventleri)
    else:
        ev_data = event_sec(
            mevcut_yil=mevcut_yil,
            mevcut_yas=mevcut_yas,
            event_gecmisi=event_gecmisi,
            enf_rejim=enf_rejim,
            tetiklenenler=tetiklenenler,
            portfoy=state.get("portfoy", {}),
            is_yeri=is_yeri,
            is_level=is_level,
            makro_veriler=makro_veriler,
            nakit_usd=nakit_usd,
            cinsiyet=cinsiyet
        )
    
    secilen_event = ev_data
    
    # Eğer opsiyon fırsatı varsa normal eventi ezer (Makro fırsat çok önemlidir)
    if opsiyon_erken_bozdurma_eventi:
        secilen_event = opsiyon_erken_bozdurma_eventi

    # Fısıltı Mantığı (Gelecek Yıl Tahmini) ve Yan Eventler
    secilen_yan_eventler = yan_event_sec(
        mevcut_yil=mevcut_yil,
        mevcut_yas=mevcut_yas,
        event_gecmisi=event_gecmisi,
        tetiklenenler=tetiklenenler,
        is_yeri=is_yeri,
        universite_yili=universite_yili,
        cinsiyet=cinsiyet
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
            "opsiyon_zinciri": {
                "bist_endeks": generate_option_chain(round(bist, 2), round(mev_faiz/100, 4), 0.35),
                "bist_bankacilik": generate_option_chain(round(bist_bankacilik, 2), round(mev_faiz/100, 4), 0.45),
                "bist_teknoloji": generate_option_chain(round(bist_teknoloji, 2), round(mev_faiz/100, 4), 0.50),
                "bist_insaat": generate_option_chain(round(bist_insaat, 2), round(mev_faiz/100, 4), 0.40),
                "bist_saglik": generate_option_chain(round(bist_saglik, 2), round(mev_faiz/100, 4), 0.30),
                "bist_perakende": generate_option_chain(round(bist_perakende, 2), round(mev_faiz/100, 4), 0.35),
                "altin_try_gram": generate_option_chain(round((altin_usd / 31.1) * kur, 2), round(mev_faiz/100, 4), 0.20)
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
            "aktif_opsiyonlar": islenen_opsiyonlar
        }
    }