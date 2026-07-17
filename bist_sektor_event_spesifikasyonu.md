# BIST Sektör Event Sistemi — Uygulama Spesifikasyonu

Bu doküman, FinSim OS oyunundaki BIST sektör bazlı ETF sistemi için event
mekaniğinin tam algoritmasını ve 10 hazır event JSON'unu içerir.

## 1. Ön Koşul — Sektör Portföy/Fiyat Altyapısı

Bu event sistemi çalışmadan önce şu veri yapılarının (frontend state)
mevcut olması gerekiyor:

```javascript
// Her sektörün kendi pay adedi ve güncel fiyatı
const [sektorPortfoyu, setSektorPortfoyu] = useState({
  bankacilik: { adet: 0 },
  teknoloji:  { adet: 0 },
  insaat:     { adet: 0 },
  saglik:     { adet: 0 },
  perakende:  { adet: 0 },
})

const [sektorFiyatlari, setSektorFiyatlari] = useState({
  bankacilik: 100,
  teknoloji:  100,
  insaat:     100,
  saglik:     100,
  perakende:  100,
})
```

Backend her yıl her sektör için bir getiri yüzdesi üretir
(`sektor_getirileri: { bankacilik: 12.4, teknoloji: -3.1, ... }`),
frontend bu yüzdeyle `sektorFiyatlari`'nı günceller — tıpkı `bist_endeks`
gibi ama sektör başına ayrı ayrı.

## 2. Event Şeması — Yeni Alanlar

Mevcut event şemasına (meslek event'leriyle aynı temel yapı) şu yeni
alanlar eklendi:

| Alan | Anlamı |
|---|---|
| `sektor` | Event'in hangi sektör ETF'i altında tetikleneceği |
| `gerekli_varlik` | `"bist_<sektor>"` formatında — oyuncunun o sektörden payı olmalı |
| `kilit.tur: "sektor_pozisyon_yuzdesi"` | Seçeneğin açılması için gereken minimum nakit — mevcut sektör pozisyon değerinin `oran` katı kadar boşta nakit gerekir |
| `secenek.aksiyon` | **Garantili** bir alım/satım işlemi — olasılığa bakılmaksızın her zaman uygulanır |
| `olasilik_sonuclari[].sektor_ekstra_getiri` | O yılın sektör getirisine eklenen/çıkarılan tek seferlik ekstra puan — bu olasılıklı |

## 3. Algoritma — Aksiyon ve Olasılık Ayrımı

**Kritik prensip:** `aksiyon` (gerçek alım/satım) ile `olasilik_sonuclari`
(o yılın getirisine hikaye/etki katmak) birbirinden tamamen bağımsız
çalışır. Aksiyon her zaman gerçekleşir, olasılıklı sonuç sadece o yılın
getirisini renklendirir.

### Adım adım akış

1. Oyuncu event seçeneğini seçer (`eventSeceneginiSec(secenek)` çağrılır)
2. **Garanti etkiler** uygulanır (`sabir_etki`, `mutluluk_etki`, mevcut sistemle aynı)
3. **Eğer `secenek.aksiyon` varsa** → aşağıdaki alım/satım işlemi **anında**,
   **o anki güncel sektör fiyatıyla** (bir önceki yılın kapanış fiyatı,
   `yilAtla()` çağrılmadan önce) gerçekleştirilir:

```javascript
function sektorAksiyonuUygula(aksiyon) {
  const { tip, sektor, oran } = aksiyon
  const mevcutPay = sektorPortfoyu[sektor].adet
  const guncelFiyat = sektorFiyatlari[sektor]
  const mevcutDeger = mevcutPay * guncelFiyat

  if (tip === "sektor_al") {
    const alinacakTutar = mevcutDeger * oran
    if (nakitRef.current < alinacakTutar) return // güvenlik kontrolü
    const alinacakPay = alinacakTutar / guncelFiyat
    nakitiGuncelle(nakitRef.current - alinacakTutar)
    setSektorPortfoyu(prev => ({
      ...prev,
      [sektor]: { adet: prev[sektor].adet + alinacakPay },
    }))
  } else if (tip === "sektor_sat") {
    const satilacakPay = mevcutPay * oran
    const gelir = satilacakPay * guncelFiyat
    nakitiGuncelle(nakitRef.current + gelir)
    setSektorPortfoyu(prev => ({
      ...prev,
      [sektor]: { adet: prev[sektor].adet - satilacakPay },
    }))
  }
}
```

4. **Eğer `secenek.olasilik_sonuclari` varsa** → ağırlıklı rastgele bir dal
   seçilir (mevcut `agirlikliSecim` fonksiyonu), seçilen dalın
   `sektor_ekstra_getiri` değeri saklanır (örn. `bekleyenSektorEkstraGetiri`
   state/ref'inde) ve **Sonuç Kartı** gösterilir (mevcut mekanizma).
5. **Bir sonraki `yilAtla()` çağrısında**, backend'den gelen o sektörün
   normal getirisine, bekleyen `sektor_ekstra_getiri` eklenir:

```javascript
const gercekSektorGetirisi = data.yil_sonucu.sektor_getirileri[sektor] + (bekleyenSektorEkstraGetiri[sektor] || 0)
```

   Sonra bekleyen değer sıfırlanır (tek seferlik, bir sonraki yıla taşınmaz).

### Neden bu sıralama önemli

- `aksiyon` her zaman (olasılığa bakılmaksızın) gerçekleşir → oyuncu
  gerçekten "üstüne ekledi" ya da "yarısını sattı", bu bir temsili anlatı
  değil, gerçek bir portföy değişikliği.
- `olasilik_sonuclari` ise sadece **o pozisyonun bir sonraki yıl nasıl
  performans gösterdiğini** renklendiriyor — yani oyuncu önce aksiyonu
  alıyor, SONRA piyasa (kısmen rastgele) ona hak veriyor ya da vermiyor.
  Bu, gerçek yatırımcı deneyimini doğru simüle ediyor: karar ile sonucu
  ayrı iki an.

## 4. Satış Oranı Notu

`sektor_sat` aksiyonlarında oran **`0.5`** (mevcut pozisyonun yarısı)
kullanılıyor — "panikle tamamen çıkma" değil, "panikle yarısını elden
çıkarma" senaryosu. `sektor_al` aksiyonlarında oran **`0.10`** (mevcut
sektör pozisyon değerinin %10'u kadar ek alım).

## 5. Kilit Mekanizması

`kilit.tur === "sektor_pozisyon_yuzdesi"` seçenekleri, sadece oyuncunun
**mevcut nakdi**, o sektördeki **mevcut pozisyon değerinin** `oran`
katından büyük veya eşitse açılır:

```javascript
function kilitliMi(kilit, nakit, sektorPortfoyu, sektorFiyatlari) {
  if (kilit.tur === "sektor_pozisyon_yuzdesi") {
    const pozisyonDegeri = sektorPortfoyu[kilit.sektor].adet * sektorFiyatlari[kilit.sektor]
    return nakit < pozisyonDegeri * kilit.oran
  }
  // ...diğer kilit tipleri (mevcut sistemle aynı)
}
```

---

## 6. Hazır Event JSON'ları (10 adet — sektör başına 1 pozitif + 1 negatif)

```json
[
  {
    "id": "ev_sektor_bank_poz",
    "sektor": "bankacilik",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "suru_davranisi",
    "baslik": "Kredi Notu Yükseltildi",
    "metin": "Uluslararası bir kredi derecelendirme kuruluşu ülkenin notunu yükseltti. Bankacılık hisseleri hızla yükseliyor, herkes konudan bahsediyor.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_bankacilik",
    "secenekler": [
      {
        "id": "ev_sektor_bank_poz_a",
        "metin": "Herkes alıyor, sen de üstüne ekle",
        "sabir_etki": -3,
        "mutluluk_etki": 5,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "yüksek",
        "kilit": { "tur": "sektor_pozisyon_yuzdesi", "sektor": "bankacilik", "oran": 0.10 },
        "aksiyon": { "tip": "sektor_al", "sektor": "bankacilik", "oran": 0.10 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.45, "sektor_ekstra_getiri": 12, "sonuc_metin": "Yükseliş devam etti, zamanlaman iyiydi." },
          { "ihtimal": 0.55, "sektor_ekstra_getiri": -8, "sonuc_metin": "Haber zaten fiyatlanmıştı — geri çekilme yaşandı." }
        ],
        "gelir_degisim": null
      },
      {
        "id": "ev_sektor_bank_poz_b",
        "metin": "Mevcut pozisyonunu koru, izle",
        "sabir_etki": 0,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_bank_neg",
    "sektor": "bankacilik",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "kayiptan_kacinma",
    "baslik": "Kredi Kartı Borç Krizi Haberleri",
    "metin": "Hane halkı borçluluğunun rekor seviyede olduğu haberleri manşetlerde. Bankacılık hisseleri baskı altında.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_bankacilik",
    "secenekler": [
      {
        "id": "ev_sektor_bank_neg_a",
        "metin": "Panikle, yarısını sat",
        "sabir_etki": -5,
        "mutluluk_etki": -3,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "orta",
        "aksiyon": { "tip": "sektor_sat", "sektor": "bankacilik", "oran": 0.5 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.55, "sektor_ekstra_getiri": -6, "sonuc_metin": "Satmakta haklıydın, düşüş devam etti." },
          { "ihtimal": 0.45, "sektor_ekstra_getiri": 10, "sonuc_metin": "Panik yersizmiş, hisse hızla toparladı — sen çoktan satmıştın." }
        ],
        "gelir_degisim": null,
        "kilit": null
      },
      {
        "id": "ev_sektor_bank_neg_b",
        "metin": "Sakin kal, pozisyonunu koru",
        "sabir_etki": 5,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_tekno_poz",
    "sektor": "teknoloji",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "asiri_ozguven",
    "baslik": "Yapay Zeka Yatırımı Duyurusu",
    "metin": "Sektördeki büyük bir şirket dev bir yapay zeka yatırımı açıkladı. Teknoloji hisseleri coşkuyla yükseliyor.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_teknoloji",
    "secenekler": [
      {
        "id": "ev_sektor_tekno_poz_a",
        "metin": "Trene atla, üstüne ekle",
        "sabir_etki": -3,
        "mutluluk_etki": 5,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "yüksek",
        "kilit": { "tur": "sektor_pozisyon_yuzdesi", "sektor": "teknoloji", "oran": 0.10 },
        "aksiyon": { "tip": "sektor_al", "sektor": "teknoloji", "oran": 0.10 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.4, "sektor_ekstra_getiri": 18, "sonuc_metin": "Coşku haklı çıktı, sert yükseliş devam etti." },
          { "ihtimal": 0.6, "sektor_ekstra_getiri": -14, "sonuc_metin": "Balon şişmişti — kısa süre sonra sert bir düzeltme geldi." }
        ],
        "gelir_degisim": null
      },
      {
        "id": "ev_sektor_tekno_poz_b",
        "metin": "Heyecana kapılma, bekle",
        "sabir_etki": 0,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_tekno_neg",
    "sektor": "teknoloji",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "kayiptan_kacinma",
    "baslik": "Siber Saldırı Haberi",
    "metin": "Sektördeki bir şirket büyük bir veri ihlali yaşadı. Teknoloji hisseleri satış baskısı altında.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_teknoloji",
    "secenekler": [
      {
        "id": "ev_sektor_tekno_neg_a",
        "metin": "Riskten kaç, yarısını sat",
        "sabir_etki": -5,
        "mutluluk_etki": -3,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "orta",
        "aksiyon": { "tip": "sektor_sat", "sektor": "teknoloji", "oran": 0.5 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.5, "sektor_ekstra_getiri": -10, "sonuc_metin": "Haber büyüdü, düşüş derinleşti — satmak isabetliydi." },
          { "ihtimal": 0.5, "sektor_ekstra_getiri": 9, "sonuc_metin": "Tepki abartılıydı, hisse hızla toparladı." }
        ],
        "gelir_degisim": null,
        "kilit": null
      },
      {
        "id": "ev_sektor_tekno_neg_b",
        "metin": "Uzun vadeli düşün, kalsın",
        "sabir_etki": 5,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_insaat_poz",
    "sektor": "insaat",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "asiri_ozguven",
    "baslik": "Dev Altyapı Projesi İhalesi",
    "metin": "Büyük bir kamu altyapı projesinin ihalesi sektöre gitti. İnşaat hisseleri sert yükseliyor.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_insaat",
    "secenekler": [
      {
        "id": "ev_sektor_insaat_poz_a",
        "metin": "Fırsatı büyüt, üstüne ekle",
        "sabir_etki": -3,
        "mutluluk_etki": 5,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "yüksek",
        "kilit": { "tur": "sektor_pozisyon_yuzdesi", "sektor": "insaat", "oran": 0.10 },
        "aksiyon": { "tip": "sektor_al", "sektor": "insaat", "oran": 0.10 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.5, "sektor_ekstra_getiri": 14, "sonuc_metin": "Proje gerçekten büyüktü, yükseliş kalıcı oldu." },
          { "ihtimal": 0.5, "sektor_ekstra_getiri": -9, "sonuc_metin": "İhale haberi zaten fiyatlanmıştı, kâr satışı geldi." }
        ],
        "gelir_degisim": null
      },
      {
        "id": "ev_sektor_insaat_poz_b",
        "metin": "Mevcut pozisyonda kal",
        "sabir_etki": 0,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_insaat_neg",
    "sektor": "insaat",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "son_donem_onyargisi",
    "baslik": "Konut Satışlarında Rekor Düşüş",
    "metin": "Aylık konut satış verisi beklentilerin çok altında geldi. İnşaat hisseleri geriliyor.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_insaat",
    "secenekler": [
      {
        "id": "ev_sektor_insaat_neg_a",
        "metin": "Kötü veri kalıcıdır, yarısını sat",
        "sabir_etki": -5,
        "mutluluk_etki": -3,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "orta",
        "aksiyon": { "tip": "sektor_sat", "sektor": "insaat", "oran": 0.5 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.45, "sektor_ekstra_getiri": -7, "sonuc_metin": "Zayıflık sürdü, satış doğru karardı." },
          { "ihtimal": 0.55, "sektor_ekstra_getiri": 8, "sonuc_metin": "Tek aylık bir veriydi, sektör hızla toparladı." }
        ],
        "gelir_degisim": null,
        "kilit": null
      },
      {
        "id": "ev_sektor_insaat_neg_b",
        "metin": "Tek bir veri, sabret",
        "sabir_etki": 5,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_saglik_poz",
    "sektor": "saglik",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "capalama",
    "baslik": "Yerli İlaç Onayı",
    "metin": "Bir ilaç şirketinin geliştirdiği ürün ruhsat aldı. Sağlık hisseleri yükseliyor.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_saglik",
    "secenekler": [
      {
        "id": "ev_sektor_saglik_poz_a",
        "metin": "Habere güven, üstüne ekle",
        "sabir_etki": -3,
        "mutluluk_etki": 5,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "yüksek",
        "kilit": { "tur": "sektor_pozisyon_yuzdesi", "sektor": "saglik", "oran": 0.10 },
        "aksiyon": { "tip": "sektor_al", "sektor": "saglik", "oran": 0.10 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.5, "sektor_ekstra_getiri": 13, "sonuc_metin": "Onay satışlara yansıdı, yükseliş kalıcı oldu." },
          { "ihtimal": 0.5, "sektor_ekstra_getiri": -8, "sonuc_metin": "Piyasa haberi zaten fiyatlamıştı, geri çekilme yaşandı." }
        ],
        "gelir_degisim": null
      },
      {
        "id": "ev_sektor_saglik_poz_b",
        "metin": "Pozisyonunu koru",
        "sabir_etki": 0,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_saglik_neg",
    "sektor": "saglik",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "kayiptan_kacinma",
    "baslik": "İlaç Geri Çağırma",
    "metin": "Bir ürünle ilgili güvenlik sorunu tespit edildi, geri çağırma süreci başladı. Sağlık hisseleri düşüyor.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_saglik",
    "secenekler": [
      {
        "id": "ev_sektor_saglik_neg_a",
        "metin": "Güven sarsıldı, yarısını sat",
        "sabir_etki": -5,
        "mutluluk_etki": -3,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "orta",
        "aksiyon": { "tip": "sektor_sat", "sektor": "saglik", "oran": 0.5 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.5, "sektor_ekstra_getiri": -9, "sonuc_metin": "Sorun büyüdü, düşüş devam etti." },
          { "ihtimal": 0.5, "sektor_ekstra_getiri": 7, "sonuc_metin": "Sorun küçüktü, hisse hızla toparladı." }
        ],
        "gelir_degisim": null,
        "kilit": null
      },
      {
        "id": "ev_sektor_saglik_neg_b",
        "metin": "Detayları bekle, kalsın",
        "sabir_etki": 5,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_perakende_poz",
    "sektor": "perakende",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "capalama",
    "baslik": "Yerli Marka Küresel Başarı",
    "metin": "Bir Türk perakende markası yurt dışında büyük bir başarı yakaladı. Perakende hisseleri yükseliyor.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_perakende",
    "secenekler": [
      {
        "id": "ev_sektor_perakende_poz_a",
        "metin": "Başarıya ortak ol, üstüne ekle",
        "sabir_etki": -3,
        "mutluluk_etki": 5,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "yüksek",
        "kilit": { "tur": "sektor_pozisyon_yuzdesi", "sektor": "perakende", "oran": 0.10 },
        "aksiyon": { "tip": "sektor_al", "sektor": "perakende", "oran": 0.10 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.45, "sektor_ekstra_getiri": 11, "sonuc_metin": "Büyüme hikayesi gerçekti, yükseliş sürdü." },
          { "ihtimal": 0.55, "sektor_ekstra_getiri": -7, "sonuc_metin": "Haber zaten fiyatlanmıştı, kâr satışı geldi." }
        ],
        "gelir_degisim": null
      },
      {
        "id": "ev_sektor_perakende_poz_b",
        "metin": "Pozisyonunu koru",
        "sabir_etki": 0,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  },
  {
    "id": "ev_sektor_perakende_neg",
    "sektor": "perakende",
    "kategori": "piyasa_haberi",
    "bias_etiketi": "kayiptan_kacinma",
    "baslik": "Mağaza Kapanış Dalgası",
    "metin": "Büyük bir zincir çok sayıda mağazasını kapattığını duyurdu. Perakende hisseleri satış baskısında.",
    "agirlik": 3,
    "cooldown_yil": 3,
    "tek_seferlik": false,
    "tetik": "her_zaman",
    "min_yas": null,
    "max_yas": null,
    "gerekli_varlik": "bist_perakende",
    "secenekler": [
      {
        "id": "ev_sektor_perakende_neg_a",
        "metin": "Kötü gidişat, yarısını sat",
        "sabir_etki": -5,
        "mutluluk_etki": -3,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "orta",
        "aksiyon": { "tip": "sektor_sat", "sektor": "perakende", "oran": 0.5 },
        "olasilik_sonuclari": [
          { "ihtimal": 0.5, "sektor_ekstra_getiri": -8, "sonuc_metin": "Kapanışlar devam etti, düşüş kalıcı oldu." },
          { "ihtimal": 0.5, "sektor_ekstra_getiri": 8, "sonuc_metin": "Sektör geneli değil tek şirket sorunuymuş, toparlandı." }
        ],
        "gelir_degisim": null,
        "kilit": null
      },
      {
        "id": "ev_sektor_perakende_neg_b",
        "metin": "Sektör genelini yansıtmaz, kalsın",
        "sabir_etki": 5,
        "mutluluk_etki": 0,
        "nakit_etki_usd": 0,
        "risk_seviyesi": "risksiz",
        "gelir_degisim": null,
        "aksiyon": null,
        "kilit": null
      }
    ]
  }
]
```

## 7. Uygulama Sırası (Öneri)

1. Sektör portföy/fiyat state yapısını kur (`sektorPortfoyu`, `sektorFiyatlari`)
2. Backend'de `sektor_getirileri` üretimini `yil_sonucu`'na ekle
3. `kilitliMi` fonksiyonuna `sektor_pozisyon_yuzdesi` tipini ekle
4. `eventSeceneginiSec` fonksiyonuna `secenek.aksiyon` işleme mantığını ekle
5. Olasılıklı sonuçtaki `sektor_ekstra_getiri`'yi bir sonraki `yilAtla()`'da o sektörün getirisine ekleyecek bekleme mekanizmasını kur
6. Yukarıdaki 10 event'i `events.json`'a ekle
