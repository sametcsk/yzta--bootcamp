# Araç Sahipliği Sistemi — Uygulama Spesifikasyonu

Bu doküman, FinSim OS oyunundaki araç (küçük/orta/spor) sahipliği
sisteminin tam matematiğini ve mekaniğini içerir.

## 1. Amaç ve Bağlam

Oyunda yatırımların önüne geçen "dikkat dağıtıcı" gerçekçi harcama
kalemleri eksikti. Araç, klasik bir davranışsal finans tuzağını temsil
ediyor: özellikle orta/spor segment araçlar **yatırım değil, saf tüketim
ve amortisman**dır — ev gibi değer kazanmaz, tam tersine sürekli değer
kaybeder ve gider yaratır. Küçük araç ise gerçek bir fayda (ulaşım
maliyetini azaltma) sunar.

## 2. Segmentler ve Fiyatlandırma

3 segment: **Küçük, Orta, Spor** — doğrusal olmayan fiyat aralıkları.

Araba, gayrimenkulün aksine dolar bazlı değil, **saf enflasyon
endeksine bağlı TL cinsinden** bir tüketim kalemi (oyunda zaten var olan
`enflasyonEndeksi` state'i kullanılıyor — bu değer redenominasyonla
senkron sıfırlanıyor, kişisel harcama seçimlerinden bağımsız, saf bir
makro gösterge).

```python
ARAC_TABAN_FIYATLAR = {  # enflasyonEndeksi = 100 iken (oyunun başında)
    "kucuk": (300_000, 600_000),
    "orta":  (700_000, 1_500_000),
    "spor":  (2_000_000, 5_000_000),
}

def arac_fiyati_uret(segment, enflasyon_endeksi, vergi_carpani):
    min_f, max_f = ARAC_TABAN_FIYATLAR[segment]
    olcek = enflasyon_endeksi / 100
    return round(random.uniform(min_f, max_f) * olcek * vergi_carpani, -3)
```

`vergi_carpani`, ÖTV zammı event'leriyle büyüyen kümülatif bir çarpan
(bkz. Bölüm 5) — sadece **yeni alınacak** araçların fiyatına yansır,
zaten sahip olunan araçları etkilemez (onlar kendi amortisman eğrisinde
ilerler).

## 3. Amortisman (Değer Kaybı)

Araç, satın alındığı andan itibaren yıllık sabit oranla değer kaybeder.
Sıfıra inmez — gerçekçi olması için bir "hurda değeri" bölgesine
yaklaşır.

```python
YILLIK_AMORTISMAN_ORANI = 0.94  # yılda %6 değer kaybı

def arac_guncel_deger(alis_fiyati, sahiplik_yili):
    return round(alis_fiyati * (YILLIK_AMORTISMAN_ORANI ** sahiplik_yili))
```

Doğrulanmış eğri (1.000.000 TL'lik bir araç için):

| Yıl | Kalan Değer | Kalan % |
|---|---|---|
| 0 | 1.000.000 | %100 |
| 5 | 733.904 | %73.4 |
| 10 | 538.615 | %53.9 |
| 15 | 395.292 | %39.5 |
| **18** | **328.323** | **%32.8 ← hurda adayı bölgesine giriyor** |
| 25 | 212.910 | %21.3 |
| 30 | 156.256 | %15.6 |

## 4. Hurdaya Çıkma Mekaniği

Güncel değer, alış fiyatının **%35'inin altına** indiğinde (yukarıdaki
eğriye göre ~17-18. yıl civarı), her yıl **ana event sisteminden
bağımsız** bir "side-check" çalışır — tıpkı erken ölüm ihtimali
kontrolü gibi (age-based side-check, `event_engine.py`'den ayrı,
`yilAtla()` akışının içinde doğrudan kontrol edilir):

```javascript
function hurdayaCikmaKontrolEt(arac) {
  const guncelDeger = aracGuncelDeger(arac)
  const kalanYuzde = guncelDeger / arac.alis_fiyati
  if (kalanYuzde > 0.35) return false // henüz hurda adayı değil

  const olasilik = 0.10 // yılda %10 ihtimal, eşik altına girince her yıl kontrol edilir
  return Math.random() < olasilik
}
```

Tetiklenirse: araç oyuncunun envanterinden kaldırılır, ulaşım kategorisi
otomatik olarak "Toplu Taşıma"ya döner (kendi evinden çıkma mekaniğiyle
aynı desen — bkz. Bölüm 6).

## 5. ÖTV Zammı Event'leri (Vergi Çarpanı)

Gerçekçi bir vergi dilim sistemi kurulmuyor — sadece rastgele, dönemsel
"vergi zammı" haberleri, 60 yılda 2-3 kez tetikleniyor, her seferinde
kümülatif olarak fiyatı artırıyor:

```python
def vergi_zammi_uygula(mevcut_carpan):
    zam_orani = normal(1.35, 0.05, min_val=1.30, max_val=1.40)
    return round(mevcut_carpan * zam_orani, 2)
```

Bu, normal event havuzuna (`events.json`) eklenen, düşük ağırlıklı,
`tek_seferlik: false` (ama `cooldown_yil` yüksek, örn. 15-20) bir event
olarak kurulabilir — "ÖTV artışı bekleniyor, şimdi mi alsan?" hissi
yaratıp araç alma isteğini tetiklemesi amaçlanıyor.

## 6. Ulaşım Kategorisi — Kilit Mantığı

`YasamStandartlari.jsx`'teki mevcut "kendi evinde oturma" desenini
(`oturulanEvVarMi` prop'u, karşılıklı dışlayan kilit) burada da
kullanıyoruz, **tek farkla:** Toplu Taşıma seçeneği **asla
kilitlenemez/kapatılamaz** — her zaman seçilebilir bir "temel" (base)
seçenek olarak kalır.

- **Toplu Taşıma:** Varsayılan, sabit aylık gider, her zaman seçilebilir.
- **Kendi Araban Var mı:** Araç sahibi olunmadan kilitli. Araç satın
  alınınca otomatik seçili hale gelir VE bu kategori için diğer
  seçenek (Toplu Taşıma) **geçici olarak** kilitlenir (araç
  hurdaya çıkana/satılana kadar).

```javascript
// YasamStandartlari.jsx içinde, ulaşım kategorisi için
const kilitli = kendiAracSecenegi
  ? !aracVarMi
  : (kategoriId === "ulasim" && aracVarMi) // toplu taşıma, araç varken kilitlenir
```

`aracVarMi` App.jsx'te basit bir boolean (`!!sahipOlunanArac`) —
gayrimenkuldeki `oturulanEvVarMi` ile birebir aynı örüntü.

## 7. Segment Bazlı Etkiler

| Segment | Mutluluk Etkisi | Aylık Gider Çarpanı (toplu taşımaya göre) |
|---|---|---|
| Küçük | +3 | ~1.0× (toplu taşımaya benzer/hafif düşük) |
| Orta | +4 | ~1.8× |
| Spor | +5 | ~3.0× |

Mutluluk farkları **kasıtlı olarak küçük** tutuldu — segment farkını
hissettiriyor ama "spor araba = çok daha mutlu hayat" gibi abartılı bir
anlatı yaratmıyor. Asıl fark **maliyette** — orta/spor segment,
"yatırım sanrısı"nın gerçek bedelini gider çarpanında ödüyor.

## 8. Önemli Tasarım Prensibi — Araba Asla Yatırım Değildir

Gayrimenkulün aksine:
- Araç değeri **hiçbir zaman artmaz**, sadece amortisman ile azalır
- `toplamDeger` (net servet) hesabına dahil edilebilir (gerçekçilik
  için, "elindeki varlık" olarak sayılır) ama bu değer sürekli erir
- Hiçbir event, aracın değerini artıran bir "yatırım getirisi" içermez
  — sadece gider, mutluluk ve nadiren hurdaya çıkma riski taşır

## 9. Uygulama Sırası (Öneri)

1. Backend: `engine/arac.py` — `arac_fiyati_uret`, `arac_guncel_deger`,
   `vergi_zammi_uygula` fonksiyonları
2. `events.json`'a ÖTV zammı event'i eklenmesi
3. `simulasyon.py`'ye araç vergi çarpanı state'inin eklenmesi
4. Frontend: `sahipOlunanArac` state'i, satın alma/hurda mantığı,
   `hurdayaCikmaKontrolEt` side-check'inin `yilAtla()` içine
   entegrasyonu (erken ölüm kontrolüyle aynı yere)
5. `YasamStandartlari.jsx`'e ulaşım kategorisi kilit güncellemesi
6. Araç piyasası/satın alma UI'ı (gayrimenkul piyasası ile benzer
   kart yapısı, `VarlikSayfasi.jsx` ya da ayrı bir sayfa)
