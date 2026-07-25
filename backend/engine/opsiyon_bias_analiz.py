def analiz_et(opsiyon_gecmisi, aktif_opsiyonlar, net_servet, swing_trade_gecmisi=None):
    """
    Kullanıcının opsiyon işlem geçmişi, aktif kontratları ve swing trade geçmişine bakarak
    5 davranışsal finans biasının skorunu (0-100) ve metinsel bir rapor üretir.
    """
    if swing_trade_gecmisi is None:
        swing_trade_gecmisi = []

    skorlar = {
        "disposition_effect": 0,
        "loss_aversion": 0,
        "confirmation_bias": 0,
        "mental_accounting": 0,
        "overconfidence": 0,
        "risk_aversion": 0
    }
    
    tum_opsiyonlar = opsiyon_gecmisi + aktif_opsiyonlar
    tum_islemler = tum_opsiyonlar + swing_trade_gecmisi
    
    if not tum_islemler:
        return {
            "skorlar": skorlar,
            "derece": "YETERSİZ VERİ",
            "yorum": "Henüz yeterli opsiyon veya swing trade işleminiz yok. Piyasada biraz tecrübe kazanınca profilinizi çıkarabiliriz!"
        }
        
    toplam_islem = len(tum_islemler)
    
    # 1. Disposition Effect (Erken Kâr / Geç Zarar)
    erken_kar_sayisi = 0
    vade_sonu_zarar_sayisi = 0
    for opt in opsiyon_gecmisi:
        notlar = opt.get("not", "")
        # Erken kapanmış ve kârda olanlar
        if opt.get("kalan_vade", 1) > 0 and opt.get("net_kar", 0) > 0 and "Otomatik" not in notlar:
            erken_kar_sayisi += 1
        # Vade sonuna kadar beklenmiş ve sıfırlanmış (brüt kar 0) olanlar
        if opt.get("brut_kar", 0) == 0 and "Otomatik" in notlar:
            vade_sonu_zarar_sayisi += 1
            
    disp_oran = (erken_kar_sayisi + vade_sonu_zarar_sayisi) / max(1, len(opsiyon_gecmisi))
    skorlar["disposition_effect"] = min(100, int(disp_oran * 120))
    
    # 2. Loss Aversion (Zarara Ekleme / İnat)
    # Eğer aynı kontrata adet eklenmişse (Maliyet Düşür kullanılmışsa) adet yüksektir.
    ekleme_yapilan_sayisi = sum(1 for opt in tum_opsiyonlar if opt.get("adet", 1) > 10)
    loss_av_oran = ekleme_yapilan_sayisi / max(1, toplam_islem)
    skorlar["loss_aversion"] = min(100, int(loss_av_oran * 150))
    
    # 3. Confirmation Bias (Hep Aynı Yön / Varlık)
    call_sayisi = sum(1 for opt in tum_opsiyonlar if opt.get("tip") == "call")
    put_sayisi = sum(1 for opt in tum_opsiyonlar if opt.get("tip") == "put")
    yon_sapmasi = abs(call_sayisi - put_sayisi) / max(1, toplam_islem)
    skorlar["confirmation_bias"] = min(100, int(yon_sapmasi * 100))
    
    # 4. Mental Accounting (Büyük Kazanç Sonrası Büyük Risk)
    mental_risk_skoru = 0
    for i in range(1, len(opsiyon_gecmisi)):
        onceki = opsiyon_gecmisi[i] # array ters sırada geliyor olabilir ama fark etmez, bitişiğine bakıyoruz
        sonraki = opsiyon_gecmisi[i-1]
        
        # Eğer bir işlemde çok kâr edip hemen ardından devasa bir maliyetle işleme girdiyse
        if onceki.get("net_kar", 0) > 10000 and sonraki.get("premium_odenen", 0) > onceki.get("net_kar", 0):
            mental_risk_skoru += 35
            
    skorlar["mental_accounting"] = min(100, mental_risk_skoru)
    
    # 5. Overconfidence (Aşırı Özgüven - Portföyün çoğunu riskli varlığa yatırmak)
    toplam_acik_maliyet = sum(opt.get("premium_odenen", 0) for opt in aktif_opsiyonlar)
    # Swing tradelerde de %50'den fazla serveti bir kalemde girmek aşırı özgüvendir.
    max_swing_islem = max([t.get("islemHacmi", 0) for t in swing_trade_gecmisi] + [0])
    
    if net_servet > 0:
        opsiyon_orani = toplam_acik_maliyet / net_servet
        swing_orani = max_swing_islem / net_servet
        skorlar["overconfidence"] = min(100, int((opsiyon_orani * 400) + (swing_orani * 150)))
        
    # 6. Risk Aversion (Riskten Aşırı Kaçınma - Swing Trade Özel)
    # Eğer swing tradeleri hep "kacirildi: true" ise, dipten alacağım diye fırsatları kaçırıyordur.
    kacirilan_swing_sayisi = sum(1 for t in swing_trade_gecmisi if t.get("kacirildi") is True)
    if len(swing_trade_gecmisi) > 0:
        kacirma_orani = kacirilan_swing_sayisi / len(swing_trade_gecmisi)
        skorlar["risk_aversion"] = min(100, int(kacirma_orani * 100))
    
    # Rapor Metni Oluşturma
    analiz_metni = []
    
    if skorlar["disposition_effect"] > 60:
        analiz_metni.append("- **Erken Kâr / Geç Zarar (Disposition Effect):** Kâra geçen işlemleri hemen satıp cebine koymayı seviyorsun, ancak zarardaki işlemleri 'döner' umuduyla vade sonuna kadar tutup sıfırlatıyorsun. Kâr potansiyelini kesip zarar potansiyelini maksimize ediyorsun!")
    
    if skorlar["loss_aversion"] > 50:
        analiz_metni.append("- **Kayıptan Kaçınma (Loss Aversion):** Zarar etmeyi kabullenemiyorsun. Zarardaki kontratlarına inatla 'Maliyet Düşür' yaparak ekleme yapıyorsun. Batık maliyet sendromuna yakalanmışsın.")
        
    if skorlar["confirmation_bias"] > 70:
        analiz_metni.append("- **Onaylanma Yanılgısı (Confirmation Bias):** Piyasaya at gözlüğüyle bakıyorsun. Sürekli aynı yönde (hep Call veya hep Put) işlem yapıyorsun. Makro trendleri ve faizleri görmezden gelip sadece kendi inandığın senaryoya yatırım yapıyorsun.")
        
    if skorlar["mental_accounting"] > 50:
        analiz_metni.append("- **Zihinsel Muhasebe (Mental Accounting):** Büyük bir kazançtan hemen sonra, kazandığın parayı 'havadan gelmiş' gibi görüp çok daha riskli opsiyonlara saçıyorsun. Bu klasik bir kumarcı yanılgısıdır.")
        
    if skorlar["overconfidence"] > 70:
        analiz_metni.append("- **Aşırı Özgüven (Overconfidence):** Net servetine oranla riskli işlemlere (Opsiyon/Swing) ayırdığın miktar çok yüksek. Tüm varlığını yüksek volatiliteye sahip piyasalara emanet ediyorsun. Patlaman yakındır!")
        
    if skorlar.get("risk_aversion", 0) > 60:
        analiz_metni.append("- **Riskten Kaçınma / Fırsat Kaçırma (Risk Aversion):** Swing Trade işlemlerinde alım seviyelerini o kadar 'güvenli' (düşük) belirliyorsun ki işlemler hiç gerçekleşmeden ralli başlıyor. Sürekli dipten alma takıntın yüzünden büyük fırsatları kaçırıyorsun.")
        
    if not analiz_metni:
        analiz_metni.append("Mükemmel bir denge! Piyasalarda duygularına yenik düşmüyor, disiplinli ve rasyonel işlemler yapıyorsun. Çoğu amatörün aksine profesyonel bir zihin yapısına sahipsin.")
        
    # Genel Seviye
    ortalama_bias = sum(skorlar.values()) / 5
    if ortalama_bias > 70:
        derece = "KIRMIZI ALARM (Tam bir Kumarcı)"
    elif ortalama_bias > 40:
        derece = "RİSKLİ (Duygusal Kararlar Hakim)"
    else:
        derece = "SAĞLIKLI (Rasyonel ve Disiplinli)"
        
    return {
        "skorlar": skorlar,
        "derece": derece,
        "yorum": "\\n\\n".join(analiz_metni)
    }
