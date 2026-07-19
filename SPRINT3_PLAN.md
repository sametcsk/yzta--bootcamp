# Finsim - Yaşam Simülasyonu Genişleme Planı (Sprint 3)

Bu doküman, oyunun basit bir yatırım simülasyonundan çıkıp çok daha derin ve zorlu bir **Yaşam ve Finans Simülasyonuna** dönüştürülmesini hedefleyen büyük güncelleme vizyonunun teknik ve mantıksal yol haritasıdır.

**Hedef:** Oynanışı "tek seferde" değil, modüler aşamalar halinde (Faz Faz) oyuna entegre ederek dengeleri bozmadan derinliği artırmak.

---

## FAZ 1: Zorluk Seviyeleri ve Erken Gençlik (18-22 Yaş)

Bu fazda oyunun mevcut 10 soruluk uzun introsu çöpe atılacak ve yerine hızlı, tematik bir zorluk seçimi getirilecek.

### 1. Zorluk Modları (Intro Revizyonu)
- **Kolay (Zengin Aile):** Yüksek başlangıç sermayesi, üniversite yıllarında yüksek aile harçlığı, krizlerde belki aileden kurtarma destekleri.
- **Orta (Standart):** Ortalama bir aile, 18-22 yaş arası sadece barınma/beslenmeye yetecek kadar mütevazı bir harçlık (22 yaşında kesilir).
- **Zor (Sıfırdan Zirveye):** Çulsuz bir öğrenci. Aile desteği sıfır. Başlangıçta düşük faizli **Devlet Öğrenim Kredisi (KYK)** alma zorunluluğu/seçeneği eklenebilir.

### 2. Yeni Başlangıç Dinamikleri
- **Başlangıç Yaşı:** 25 yerine **18** olarak güncellenecek.
- **Üniversite Dönemi (18-22):** 
  - Oyuncu başlangıçta 5-10 örnek bölümden (Örn: Mühendislik, Tıp, İşletme, İletişim, Sanat) birini seçecek.
  - Bu dönemde sadece part-time/vasıfsız işlere girilebilecek.
  - 22 Yaşında mezuniyet eventi tetiklenecek ve aile harçlıkları (varsa) kesilecek.

> [!NOTE] 
> **Üzerine Düşünülecek / İleri Faz Fikri:** Üniversite yıllarına **Akademik Başarı (GPA) / Kendini Geliştirme** mekaniği eklenebilir. Fakir zorlukta part-time çalışmaktan derslere odaklanılamazken, zengin zorlukta not kasmak daha rahat olabilir. Mezuniyet anındaki GPA, kaliteli bir işe kabul edilme oranını doğrudan belirleyecek.

---

## FAZ 2: Kariyer ve Eğitim Motoru (Career Engine)

Mevcut sabit gelir yapısı, dinamik ve etkileşimli bir kariyer sistemine dönüşecek.

### 1. İş Bulma ve Başvuru Mekaniği
- Her yıl (veya oyuncu işsizken) sistem **rastgele 5 adet iş ilanı** üretecek (Backend'de havuzdan çekilecek).
- **İş Tipleri:** 
  - *Vasıfsız İşler:* Kabul edilme ihtimali yüksek, düşük maaşlı.
  - *Bölüm İşleri:* Seçilen üniversite bölümüyle eşleşen, kariyer basamakları olan, kabul edilme ihtimali eğitim seviyesiyle orantılı işler.
- İş logoları (yaklaşık 20 adet) frontend'e eklenecek ve iş ilanlarında rastgele gösterilecek.

### 2. Kariyer İlerlemesi (Terfi ve Mesai)
- **Sıkı Çalışma Butonu:** Sabır ve mutluluktan eksi (-) yiyerek terfi (title) atlama ihtimalini hızlandıran aktif bir buton eklenecek.
- **Aşırı Yükseliş (C-Level Eventi):** Yeterince terfi edildiğinde, düşük bir ihtimalle (%10 vb.) "CEO/CFO" olma eventi tetiklenecek. Çok yüksek maaş ama devasa stres (psikolojik debuff) veya reddedip "fakir ama gururlu" kalma seçeneği sunulacak.
- **Emeklilik Revizyonu:** Emekli maaşı artık sabit 500$ değil, son çalışılan title'ın ve maaşın belli bir yüzdesine (Örn: %40-60) denk gelecek şekilde dinamik hesaplanacak.

---

## FAZ 3: Kredi ve Bankacılık Sistemi

Ekonomik krizleri atlatmak ve nakit akışını yönetmek için zorunlu (veya stratejik) bir borçlanma sistemi eklenecek.

### 1. Kredi Alma Şartları
- **Kredi Limiti:** Oyuncunun Toplam Portföy Değerinin **%50-%60'ı** kadar bir teminat limiti olacak. (Portföyü olmayanlar veya batanlar için sadece oyunu kitlememek adına sabit 1000-2000$ civarı ufak bir "kurtarma" limiti varsayılacak).
- **Dinamik Faiz ve Banka Risk Primi:** Çekilen kredinin faiz oranı o anki enflasyona bağlı olacak ancak banka daima üzerine bir "Risk Primi" ekleyecek. Kriz öncesi düşük faizden devasa borçlanıp zenginleşme arbitrajını önlemek adına banka geleceği fiyatlayacak.
- Kredi hesaplamaları (Ana para, taksit tutarı, faiz) anlık olarak banka arayüzünde görüntülenecek.

### 2. Zorunlu Borçlanma ve Haciz Sistemi
- Eğer oyuncunun nakit rezervi **-$2000**'in altına düşerse, sistem "Yıl Atla" butonunu kilitleyecek ve oyuncu kredi çekmeye veya varlık satmaya zorlanacak.
- Kredi taksitleri yıllık net akışı doğrudan baskılayacak. 
- **Haciz Mekaniği:** Eğer krediler iyi yönetilmez ve oyuncu batarsa, banka oyuncunun varlıklarına (ev, hisse) el koyup zararına (%20 indirimle) zorla satarak borcunu tahsil edecek.

---

## FAZ 4: Sosyal ve Romantik Hayat (The Sims Yaklaşımı)

Oyunun finansal mekaniklerine psikolojik (ve sonrasında finansal) devasa bir katman eklenecek.

### 1. İlişki Yönetimi ve Dinamik Harcamalar
- İş arkadaşlarıyla ilişki barları (0-100) tutulacak. İşe girildiğinde rastgele seviyelerden başlayacak.
- Yılda bir kez yapılabilecek eylemlerle yeni insanlarla tanışma veya sevgili bulma eventleri tetiklenebilecek.
- **"More Money, More Problems" Mekaniği:** Sosyalleşme ve romantik buluşmaların maliyeti **yaşam standardına (title ve gelir seviyesine)** endekslenmeli. Fakirken 10$ lık kahveyle sosyalleşip mutlu olunurken, CEO olunca Golf kulübü üyelikleri (5000$) zorunlu olacak. (Zenginlerin mutluluğu bedava olmamalı!)

### 2. Evlilik ve Çocuklar
- Romantik ilişkiler evliliğe ve sonrasında çocuk sahibi olmaya uzanacak.
- **Finansal Yük:** Evlilik ve çocuklar, yaşam standartlarının (giderlerin) üzerine yepyeni "random event" masrafları (okul taksiti, sağlık masrafı vb.) bindirecek.
- Kariyer stresi ve aile harcamaları arasında denge kurmak oyunun asıl zorluğu haline gelecek.

> [!NOTE] 
> **Üzerine Düşünülecek / İleri Faz Fikri:** Oyuna Mutluluk ve Sabır dışında yeni bir **"Sağlık / Yorgunluk"** barı eklenebilir. Sıkı çalış butonuna çok basmak veya devasa kredi stresi sağlığı düşürecek. Sağlığı düzeltmek için özel sağlık sigortası (gider kalemi) gibi finansal çıkışlar eklenecek. Aksi takdirde "Tükenmişlik Sendromu" veya "Erken Kalp Krizi" gibi ciddi hayati riskler doğacak.
