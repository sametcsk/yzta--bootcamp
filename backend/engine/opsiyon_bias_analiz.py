def analiz_et(opsiyon_gecmisi, aktif_opsiyonlar, net_servet):
    """
    Kullanıcının opsiyon işlem geçmişi ve mevcut aktif kontratlarına bakarak
    5 davranışsal finans biasının skorunu (0-100) ve metinsel bir rapor üretir.
    """
    skorlar = {
        "disposition_effect": 0,
        "loss_aversion": 0,
        "confirmation_bias": 0,
        "mental_accounting": 0,
        "overconfidence": 0
    }
    
    tum_opsiyonlar = opsiyon_gecmisi + aktif_opsiyonlar
    
    if not tum_opsiyonlar:
        return {
            "skorlar": skorlar,
            "yorum": "Henüz yeterli opsiyon işleminiz yok. Piyasada biraz tecrübe kazanınca profilinizi çıkarabiliriz!"
        }
        
    toplam_islem = len(tum_opsiyonlar)
    
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
    
    # 5. Overconfidence (Aşırı Özgüven - Portföyün çoğunu opsiyona yatırmak)
    toplam_acik_maliyet = sum(opt.get("premium_odenen", 0) for opt in aktif_opsiyonlar)
    if net_servet > 0:
        opsiyon_orani = toplam_acik_maliyet / net_servet
        skorlar["overconfidence"] = min(100, int(opsiyon_orani * 400)) # %25 yatırırsa skor 100 olur
    
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
        analiz_metni.append("- **Aşırı Özgüven (Overconfidence):** Net servetine oranla opsiyonlara ayırdığın miktar korkunç seviyelerde. Tüm varlığını yüksek kaldıraçlı bir türev piyasasına emanet ediyorsun. Patlaman yakındır!")
        
    if not analiz_metni:
        analiz_metni.append("Mükemmel bir denge! Opsiyon piyasasında duygularına yenik düşmüyor, disiplinli ve rasyonel işlemler yapıyorsun. Çoğu amatörün aksine profesyonel bir zihin yapısına sahipsin.")
        
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
