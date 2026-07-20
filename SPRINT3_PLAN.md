# Finsim - Yaşam Simülasyonu Genişleme Planı (Sprint 3)

Bu doküman, oyunun basit bir yatırım simülasyonundan çıkıp derin, psikolojik ve zorlu bir **Yaşam ve Davranışsal Finans Simülasyonuna** dönüştürülmesini hedefleyen büyük güncelleme vizyonunun teknik yol haritasıdır.

**Hedef:** Oynanışı modüler aşamalar halinde (Faz Faz) oyuna entegre etmek ve oyuncunun gizli psikolojisini oyun motoru üzerinden analiz etmek.

> [!IMPORTANT]
> **Genel Geliştirme Prensibi (Workflow):** Geliştirme sürecinde hiçbir faz atlanmayacaktır. Her faz kodlanıp sistemi kurulduktan sonra DURULACAK ve "Bu faza özel (Örn: Eğitim, Kredi, Kariyer) hangi random eventler olmalı?" diye tartışılarak `events.json` dosyasına o faza ait eventler eklenecektir. İlgili eventler tamamlanmadan asla bir sonraki faza geçilmeyecektir.

---

## FAZ 0: Mevcut Eventlerin ve Raporların 5 Bias'a Uyarlanması
Yeni sistemin sağlıklı çalışabilmesi için kodlamaya başlamadan önce mevcut altyapının temizlenmesi gerekir:
- Mevcut `events.json` içerisindeki (şu an uyumsuz veya eski kalan) tüm eventlerin taranması, bazılarının silinmesi veya bu 5 Temel Bias'a (Loss Aversion, Anchoring, Disposition Effect, Mental Accounting, Present Bias) uyumlu hale getirilmesi.
- Klasik (AI harici) oyun sonu istatistik ekranının da bu 5 bias skoruyla doğrudan konuşacak şekilde (UI olarak) hazırlanması.
- Altyapı temizlendikten ve uyumlu hale geldikten sonra Faz 1'e geçiş yapılması.

---

## FAZ 1: Davranışsal Finans İntrosu ve AI Profilleme (18 Yaş)

Mevcut 10 soruluk uzun intro kaldırılacak. Yerine oyuncunun başlangıç zorluğunu ve psikolojik temelini atacak **Davranışsal Finans Odaklı 6 Soru** eklenecek.

### 1. Intro Soruları ve Başlangıç Vektörü
Oyun, oyuncunun psikolojisini 5 temel "Bias" (Bilişsel Önyargı) üzerinden 0-100 arası skorlayan bir Vektör (Örn: `[80, 20, 100, 50, 90]`) tutacak:
1. **Zorluk Sorusu:** Aile durumu (Zengin, Orta, Fakir) nakit başlangıcını belirler.
2. **Mental Accounting (Zihinsel Muhasebe):** Havadan gelen paraya (piyango vb.) verilen değer.
3. **Anchoring (Çıpalama Etkisi):** Alış fiyatına veya geçmiş verilere saplantılı kalma.
4. **Disposition Effect (Elden Çıkarma):** Kârda olanı erken satıp, zararda olana aşık olma.
5. **Loss Aversion (Kayıptan Kaçınma):** Düşüşlerde panik yapma ve kaybetme korkusu.
6. **Present Bias (Anlık Haz Eğilimi):** Geleceği ipotek edip borçla bugünü lüks yaşama isteği.

### 2. AI Tabanlı 18 Yaş Hikayesi (Oyun Başı)
- Yapay Zeka, bu 6 soruya verilen sayısal değerleri ve "Fakir/Zengin" zorluk seviyesini alarak; karakterin **0-18 yaş arasını anlatan, parayla ilişkisinin neden böyle şekillendiğini vurgulayan 2 paragraflık atmosferik bir geçmiş hikayesi** üretecek. 
- (Örn: "Yüksek Present Bias skoruna bakarak, çocukken eline geçen parayı hiç tutamadığını anlatan bir hikaye.")

---

## FAZ 2: Kariyer, Eğitim ve Gelişim Motoru (Career Engine)

### 1. Eğitim Mekaniği
- Intro'dan kaldırılan "Üniversite" seçeneği, oyun içi (18-22 yaş) bir mekanik olacak. 
- Oyuncu 18 yaşında ister vasıfsız işte çalışır, isterse 4 yıl boyunca borç (Kredi) alarak üniversite okur. Üniversite mezuniyeti özel mesleklere giriş kapısını açar.

### 2. İş Bulma ve Başvuru Mekaniği
- Her yıl sistem rastgele 5 adet iş ilanı üretecek (Backend'de havuzdan, yaklaşık 20 logolu iş tasarımı).
- Vasıfsız işlere kabul yüksekken, bölüm işlerine kabul eğitim seviyesiyle orantılı olacak.

### 3. Kariyer İlerlemesi (Terfi ve Mesai Mekaniği)
- **Çalışma Barı:** Her meslekte bir çalışma (tecrübe) barı olacak. Her yıl otomatik 1 puan artarken, "Sıkı Çalışma" butonu aktifse (sabır/mutluluk debuff'ı karşılığı) 2 puan artacak.
- **Terfi Eventleri:** Çalışma barı %100'e ulaştığında (Örn: 5 puanda) anında bir "Terfi Sınavı / İş Yeri Krizi" random eventi tetiklenecek (Mevcut `ev_bw`, `ev_mem` vb. eventler revize edilerek bu sisteme entegre edilecek).
  - Başarılı olunursa: Yeni title'a geçilir, maaş artar ve bar sıfırlanır.
  - Başarısız olunursa: Bar %70'e (Örn: 3 puana) düşer, terfi bir sonraki şansa kalır.
- İş ilanlarındaki logolar kod bazında yer tutucu (placeholder) olarak bırakılacak, sonradan sadece resim dosyaları klasöre eklenerek çalışacak şekilde tasarlanacak.
- **Emeklilik Revizyonu:** Emeklilik sistemi tamamen baştan ele alınacak; emekli maaşı, son çalışılan title'ın belli bir yüzdesine dinamik bağlanacak.

---

## FAZ 3: Kredi, Bankacılık ve İflas Sistemi

### 1. Kredi Şartları ve Dinamik Faiz
- **Kredi Limiti:** Portföy Değerinin **%50-%60'ı** kadar teminat limiti.
- **Enflasyon Endeksli Faiz + Banka Risk Primi:** Faiz o anki enflasyona bağlı olacak ancak banka arbitrajı engellemek için geleceği fiyatlayıp hep bir "Risk Primi" ekleyecek.

### 2. Zorunlu Borçlanma ve Haciz Mekaniği
- Nakit **-$2000** altına düşerse "Yıl Atla" butonu kilitlenir; oyuncu zorla kredi çekmeye veya varlık satmaya yönlendirilir.
- **Haciz:** Oyuncu batarsa, banka borcu tahsil etmek için oyuncunun evini/hisselerini %20 zararına (acımadan) otomatik satar.

---

## FAZ 4: Sosyal / Romantik Hayat ve Oyun İçi Psikolojik Veri Takibi

Oyun boyunca rastgele çıkan eventler HARİCİNDE, oyuncunun kendi hür iradesiyle yaptığı finansal eylemler arka planda **Bias Vektörünü anlık olarak** güncelleyecek:

### 1. Heuristic (Oynanıştan Çıkarım Yapan) Bias Takip Sistemi
- **Loss Aversion:** Bir varlık %20 düştüğünde oyuncu anında tüm portföyü satarsa skor artar. Düşüşe rağmen ekleme yaparsa skor azalır. Enflasyonda nakit istiflerse skor artar.
- **Anchoring:** Maliyetinin çok altına düşmüş ve yıllarca yatay kalan bir varlığı (batan gemiyi) zararı kabullenmeyip satmıyorsa skor artar. Zarar-kes yaparsa düşer.
- **Disposition Effect:** Bir varlık %40 fırladığında kârı erken kesip satarsa skor artar. Yükselen trenddeki varlığı yıllarca büyütürse düşer.
- **Present Bias:** Kredi çekip, o parayı yatırıma değil de "Lüks Yaşam Standardına" veya mutluluğa harcarsa skor fırlar. Eğitimi pas geçip hemen vasıfsız maaşa koşarsa artar.
- **Mental Accounting:** Piyango veya miras gibi ani devasa gelirlerde portföy dengesi yerine tamamen lükse ve yüksek riske (kripto vb.) kayarsa skor artar.

### 2. Matematiksel Ağırlık Motoru (0-100 Sınırı)
Oyuncu profili, tek bir eylemle bozulmaması ve **daima 0-100 arasında kalması** için Ağırlıklı Ortalama (Weighted Average) ile hesaplanacak:
- **Intro Karakterinin Sabit Ağırlığı:** %30
- **Oyun İçi Eylemlerin Ağırlığı:** %70 (Eylem sayısına göre dinamik artar).
- Eylemlere +20 veya -25 eklemek yerine, her eyleme 0 ile 100 arasında bir Data Point (Not) verilecek (Örn: Panik Satışı = 100).
- `Nihai Skor = [ (Intro_Skoru * 30) + (Oyun_Içi_Ortalama * Oyun_İçi_Ağırlık) ] / Toplam Ağırlık`
Bu sistem sayesinde 18 yaşındaki temel karakter ömür boyu %30 etkisini korurken, oyun içindeki hiçbir tekil karar profili 0'ın altına veya 100'ün üstüne taşıyamayacak.

### 3. Dinamik Sosyal Harcamalar (More Money, More Problems)
- Mutluluk ve Sabır barını yükseltmek için yapılan sosyalleşme etkinliklerinin maliyeti, oyuncunun **Gelir ve Title seviyesine** endekslenecek. CEO için 10$ kahve mutluluk getirmez, 5000$ Golf etkinliği şart olur. Aile ve çocuklar devasa masraflar getirir.

---

## FAZ 5: Oyun Sonu AI Davranışsal Finans Analizi (Klinik Rapor)

Oyun sonunda bir hikaye (masal) **olmayacak.** 
Sistem, oyuncunun 18 yaşındaki **Başlangıç Vektörünü** ve oynanış sırasındaki eylemlerle oluşan **Oyun Sonu (Final) Vektörünü** AI'a gönderecek.

**Yapay Zeka (Davranışsal Finans Analisti Rolünde):**
- İki vektör arasındaki değişimi (evrimi) veya takıntıları inceleyerek;
- *"18 yaşında anlık hazlara düşkündün ama bunu yendin, ancak çıpalamadan hiç kurtulamadın ve 2038 krizinde batan gemiye aşık oldun"* minvalinde, tamamen veriye dayalı **3 maddelik keskin ve klinik bir psikolojik/finansal teşhis raporu** sunacak.

> [!NOTE] 
> **Üzerine Düşünülecek / İleri Faz Fikirleri:** 
> - **Akademik Başarı (GPA):** Üniversite yıllarında part-time çalışma yorgunluğu ile not kasma dengesi. GPA'in kaliteli işlere kabul oranını belirlemesi.
> - **Sağlık Barı:** Sürekli "sıkı çalışma" butonuna basmak ve kredi stresinin sağlığı tüketmesi, tükenmişlik sendromu yaratması. Sağlığın özel sigorta giderleriyle satın alınması.
> - **Karakter Kartları ve Sosyal İlişki Barları (0-100):** Oyunun başından beri "İlişkiler" sekmesinde duran Anne/Baba figürleri ve iş yerindeki etkileşimlerle tanışılan iş arkadaşları. Bu kişilerle yapılan sosyal etkinlikler üzerinden tetiklenen "side random event"ler ve romantik ilişkiler. Her karakterin kendine ait bir barı olması ve oyuna dinamik bir The Sims katmanı eklemesi.
