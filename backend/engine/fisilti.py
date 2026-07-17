import random

def fisilti_uret(mevcut_makro, gelecek_makro):
    konular = ["faiz", "enf", "bist", "bankacilik", "teknoloji", "insaat", "saglik", "perakende"]
    random.shuffle(konular)
    
    gercek_yon = None
    secilen_konu = None
    
    for konu in konular:
        if konu == "faiz":
            yon = gelecek_makro["faiz_yon"]
            if yon in ["up", "down"]:
                gercek_yon = yon
                secilen_konu = konu
                break
        elif konu == "enf":
            fark = gelecek_makro["enf"] - mevcut_makro["enf"]
            if fark > 5: gercek_yon = "up"
            elif fark < -5: gercek_yon = "down"
            if gercek_yon:
                secilen_konu = konu
                break
        elif konu == "bist":
            pct = gelecek_makro["bist_pct"]
            if pct > 20: gercek_yon = "up"
            elif pct < -10: gercek_yon = "down"
            if gercek_yon:
                secilen_konu = konu
                break
        else:
            pct = gelecek_makro["sektor_getirileri"][konu]
            if pct > 25: gercek_yon = "up"
            elif pct < -10: gercek_yon = "down"
            if gercek_yon:
                secilen_konu = konu
                break
                
    if not secilen_konu:
        return None
        
    dogru_mu = random.choice([True, False])
    soylenen_yon = gercek_yon if dogru_mu else ("up" if gercek_yon == "down" else "down")
    
    metinler = {
        "faiz": {
            "up": [
                "Kahvehanedeki dayılara göre acı reçete yolda, faizleri patlatacaklar.",
                "İçeriden duyduğuma göre yabancı yatırımcı faiz artışı şart koşmuş, faizler uçacakmış."
            ],
            "down": [
                "Amcamın Merkez Bankası'ndaki tanıdığına göre faizler hızla ineceği bir döneme giriyoruz.",
                "Kulislerde konuşulanlara göre krediler ucuzlayacak, büyük bir faiz indirimi yolda."
            ]
        },
        "enf": {
            "up": [
                "Esnaf kan ağlıyor, önümüzdeki yıl her şeye dev zamlar gelecekmiş.",
                "Taksi şoförünün duyduğuna göre para basılacakmış, enflasyon çıldıracak diyorlar."
            ],
            "down": [
                "Hükümet kemer sıkma politikasına geçiyormuş, enflasyonun beli kırılacak diyorlar.",
                "Fiyatlar artık durulacakmış, önümüzdeki yıl enflasyon hızla düşüşe geçiyormuş."
            ]
        },
        "bist": {
            "up": [
                "Yabancı fonlar ülkeye devasa para sokacakmış, borsa seneye füze gibi fırlayacak diyorlar.",
                "Mahalledeki berber bile borsaya giriyormuş, önümüzdeki yıl tarihi bir borsa rallisi bekleniyor."
            ],
            "down": [
                "Büyük abiler borsadan çıkıyormuş, seneye fena bir borsa çöküşü kapıda.",
                "Borsa çok şişti, kulislere göre önümüzdeki yıl büyük bir düzeltme yaşanacak."
            ]
        },
        "bankacilik": {
            "up": [
                "Bankaların bu yıl rekor kâr açıklayacağı sızmış, bankacılık endeksi uçacak.",
                "Kredi muslukları açılıyor, banka hisseleri seneye altın devrini yaşayacak diyorlar."
            ],
            "down": [
                "Bankalara devasa bir regülasyon cezası yoldaymış, bankacılık hisseleri çakılacak.",
                "Banka kârları eriyormuş, söylentilere göre bankacılık sektörü önümüzdeki yıl çökecek."
            ]
        },
        "teknoloji": {
            "up": [
                "Silikon Vadisi'nden büyük bir fon yerli teknoloji şirketlerini toplayacakmış, ralli kapıda.",
                "Yeni bir yapay zeka furyası başlıyormuş, teknoloji hisseleri seneye çıldıracak."
            ],
            "down": [
                "Teknoloji balonunun patlayacağı konuşuluyor, sektörde sert düşüşler olacakmış.",
                "Çip krizi derinleşiyormuş, teknoloji hisseleri önümüzdeki yıl ağır darbe alacak."
            ]
        },
        "insaat": {
            "up": [
                "Hükümet dev bir konut kampanyası açıklayacakmış, inşaat sektörü uçuşa geçecek.",
                "Büyük müteahhitler arazi topluyormuş, inşaat hisselerinde mega ralli bekleniyor."
            ],
            "down": [
                "İnşaat maliyetleri kontrolden çıkmış, sektör seneye tamamen durma noktasına gelecekmiş.",
                "Konut satışları çakılacak, inşaat hisseleri için önümüzdeki yıl kabus gibi geçecek deniyor."
            ]
        },
        "saglik": {
            "up": [
                "Yeni bir salgın dedikodusu yayılıyor, sağlık ve ilaç hisseleri tavan serisi yapacakmış.",
                "Devlet sağlık harcamalarını artırıyormuş, sektör önümüzdeki yıl altın çağını yaşayacak."
            ],
            "down": [
                "İlaç fiyatlamalarındaki kriz çözülememiş, sağlık sektörü seneye ağır zarar yazacakmış.",
                "Hastanelere yeni vergiler geliyormuş, kulislere göre sağlık hisseleri seneye dipleri görecek."
            ]
        },
        "perakende": {
            "up": [
                "Tüketim çılgınlığı hız kesmiyor, marketler ve perakendeciler seneye rekor kıracakmış.",
                "Vatandaş harcamaya devam ediyor, perakende hisselerinde büyük bir ralli bekleniyor."
            ],
            "down": [
                "Tüketici harcamaları bıçak gibi kesilecek, perakende sektörü seneye kan ağlayacak.",
                "Marketlere tavan fiyat uygulaması geliyormuş, perakende hisseleri fena çökecek."
            ]
        }
    }
    
    metin = random.choice(metinler[secilen_konu][soylenen_yon])
    return metin
