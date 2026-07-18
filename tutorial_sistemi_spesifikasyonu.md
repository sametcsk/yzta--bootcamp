# Öğretici (Tutorial) Sistemi — Uygulama Spesifikasyonu

Bu doküman, FinSim OS oyununda intro bittikten hemen sonra çalışacak,
adım adım rehberli tanıtım (onboarding) sisteminin tam mimarisini ve
uygulama adımlarını içerir.

## 1. Amaç

Oyun başladığı anda, oyuncuya arayüzün her bölümünü sırayla tanıtan,
karartma efektiyle dikkat yönlendiren, bazı adımlarda gerçek kullanıcı
etkileşimi (sayfa tıklama, buton tıklama) bekleyen bir rehberli tur.

## 2. Genel Mimari

### 2.1 Karartma Yöntemi — Bölüm Bazlı (Seçildi)

Ekranın tamamının üstüne "spot ışığı" kesen tek bir overlay yerine,
her hedeflenebilir bölüm kendi karartma mantığını taşıyor. Bu, mevcut
component yapısına (zaten ayrı ayrı bölümler halinde kodlanmış) doğal
şekilde oturuyor ve koordinat hesaplama gerektirmiyor.

### 2.2 Merkezi Yönetim — React Context

Tutorial durumu, tüm component ağacına tek bir Context ile dağıtılıyor
— her sayfaya tek tek prop geçirmek yerine.

```jsx
const TutorialContext = createContext(null)

function TutorialProvider({ children, adimlar }) {
  const [aktif, setAktif] = useState(false)
  const [adimIndex, setAdimIndex] = useState(0)

  const mevcutAdim = adimlar[adimIndex]

  function ileriGit() {
    setAdimIndex(prev => Math.min(prev + 1, adimlar.length - 1))
  }

  function tutorialuBitir() {
    setAktif(false)
    localStorage.setItem("finsim_tutorial_tamamlandi", "1")
  }

  return (
    <TutorialContext.Provider value={{ aktif, mevcutAdim, adimIndex, ileriGit, tutorialuBitir, setAktif }}>
      {children}
    </TutorialContext.Provider>
  )
}

function useTutorial() {
  return useContext(TutorialContext)
}
```

`App.jsx`'in en tepesinde, tüm render ağacını `<TutorialProvider adimlar={TUTORIAL_ADIMLARI}>` ile sarmalamak yeterli.

### 2.3 Bölüm Bazlı Karartma Component'i

Her hedeflenebilir bölüm bu component ile sarmalanıyor:

```jsx
function TutorialOdak({ hedefId, children }) {
  const { aktif, mevcutAdim } = useTutorial()
  const karartilmis = aktif && mevcutAdim?.hedef !== hedefId

  return (
    <div className={`relative transition-opacity duration-300 ${karartilmis ? "opacity-20 pointer-events-none" : ""}`}>
      {children}
    </div>
  )
}
```

Kullanım örneği — mevcut JSX'in içeriğine dokunmadan sadece sarmalanıyor:

```jsx
<TutorialOdak hedefId="info-kartlari">
  {/* mevcut info kart kodları aynen kalıyor */}
</TutorialOdak>
```

### 2.4 Açıklama Kutusu — Sağ Alt, Global

`App.jsx`'in en dışında, en üst katmanda (`z-50`) tek sefer render edilir:

```jsx
function TutorialKutusu() {
  const { aktif, mevcutAdim, ileriGit, tutorialuBitir } = useTutorial()
  if (!aktif || !mevcutAdim) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-surface-container border border-primary card-shadow p-stack-md">
      <p className="text-on-surface text-body-md mb-3">{mevcutAdim.metin}</p>
      {mevcutAdim.ilerlemeTipi === "buton" ? (
        <button onClick={ileriGit} className="bg-primary-container text-background font-data-sm uppercase py-2 px-4 btn-shadow border border-outline font-bold">
          İleri
        </button>
      ) : (
        <p className="text-primary font-data-sm uppercase animate-pulse">
          Devam etmek için işaretlenen yeri kullan...
        </p>
      )}
      <button onClick={tutorialuBitir} className="text-on-surface-variant text-xs mt-2 underline block">
        Tutorial'ı Atla
      </button>
    </div>
  )
}
```

### 2.5 Kullanıcı Eylemi Adımlarının Otomatik İlerlemesi

Mevcut state/fonksiyonlara hiç dokunmadan, sadece izleyerek otomatik
ilerletiliyor:

```jsx
useEffect(() => {
  if (!tutorialAktif) return
  const adim = TUTORIAL_ADIMLARI[tutorialAdimi]
  if (adim.ilerlemeTipi !== "eylem") return

  if (adim.beklenenEylem === "sayfa:varliklar" && aktifSayfa === "varliklar") ileriGit()
  if (adim.beklenenEylem === "sayfa:portfoy" && aktifSayfa === "portfoy") ileriGit()
  if (adim.beklenenEylem === "sayfa:standartlar" && aktifSayfa === "standartlar") ileriGit()
  if (adim.beklenenEylem === "yil_atla_tiklandi" && loading) ileriGit()
  if (adim.beklenenEylem === "event_secildi" && mevcutEvent === null && !!sonucKarti) ileriGit()
}, [tutorialAktif, tutorialAdimi, aktifSayfa, loading, mevcutEvent, sonucKarti])
```

### 2.6 Side Event'lerin Devre Dışı Bırakılması

Erken ölüm / araç hurdaya çıkma gibi ana event sisteminden bağımsız
kontrollerin başına tek satır guard eklenir:

```javascript
if (!tutorialAktif && Math.random() < erkenOlumOlasiligi(yeniYas)) {
  // ...
}
```

Bu, tutorial'ın ilk turunda beklenmedik/dikkat dağıtıcı side-event'lerin
çıkmasını engeller.

## 3. Tam Adım Listesi

| # | Hedef (`hedefId`) | İlerleme Tipi | Beklenen Eylem | Metin |
|---|---|---|---|---|
| T1 | `info-kartlari` | buton | — | "Burada anlık durumunu görüyorsun: nakit, sabır ve mutluluk. Bu üçü, kararlarının doğrudan sonucu." |
| T2 | `event-kutusu` | buton | — | "Her yıl karşına böyle bir olay çıkabilir. Bazıları garanti sonuçlu, bazıları olasılıklı — seçtiğin seçeneğin yanında risk seviyesini göreceksin." |
| T3 | `sidebar-varliklar` | eylem | `sayfa:varliklar` | "Şimdi sol menüden Varlıklar sayfasına gir." |
| T4 | `varlik-altin` | buton | — | "Altın, dolar bazında hareket eder — kurdan bağımsız kendi piyasası vardır." |
| T5 | `varlik-bist` | buton | — | "Borsa, faiz yönüne ve enflasyona bağlı değişir. Yüksek getiri potansiyeli, yüksek oynaklıkla gelir." |
| T6 | `varlik-dolar` | buton | — | "Dolar tutmak, TL'nin değer kaybına karşı korunma yoludur." |
| T7 | `varlik-mevduat` | buton | — | "Mevduat, düşük riskli ama genelde enflasyonun gerisinde kalan bir seçenektir." |
| T8 | `sidebar-portfoy` | eylem | `sayfa:portfoy` | "Şimdi Portföy sayfasına gir, orada dağılımını bir arada görebilirsin." |
| T9 | `portfoy-grafik` | buton | — | "Burada tüm varlıklarının toplam değerini ve dağılımını görüyorsun." |
| T10 | `sidebar-standartlar` | eylem | `sayfa:standartlar` | "Şimdi Yaşam Standartları'na gir." |
| T11 | `standartlar-kategoriler` | buton | — | "Her kategori senin harcama seçimini belirler — bu, hem mutluluğunu hem giderini etkiler." |
| T12 | `ana-sayfa` | otomatik | — | (Ana sayfaya otomatik dönülür, kullanıcı eylemi gerekmez) |
| T13 | `yil-calistir-butonu` | eylem | `yil_atla_tiklandi` | "Artık hazırsın. Yıl Çalıştır'a bas ve ilk yılını yaşa." |
| T14 | `event-kutusu` | eylem | `event_secildi` | "Karşına ilk olayın çıktı. Bir seçenek seç — sonucunu birlikte göreceğiz." |
| T15 | `sonuc-enflasyon` | buton (bitirir) | — | "İşte bu yılın enflasyonu ve sonucun. Artık kendi başınasın — iyi şanslar." |

**Özel kurallar:**
- T13-T15 arasında side event'ler (`erkenOlumOlasiligi`, araç hurdaya
  çıkma vb.) devre dışı.
- T3, T8, T10, T13, T14 dışındaki tüm adımlar "İleri" butonuyla,
  pasif izleme şeklinde ilerliyor.
- Her adımda "Tutorial'ı Atla" linki her zaman görünür ve erişilebilir.

## 4. Intro'da Aç/Kapat Kontrolü

Tutorial'ın gösterilip gösterilmeyeceği, intro ekranında bir checkbox
ile kullanıcının kontrolüne bırakılıyor.

### 4.1 `IntroEkrani.jsx` — State ve UI

```jsx
const [tutorialGoster, setTutorialGoster] = useState(
  !localStorage.getItem("finsim_tutorial_tamamlandi")
)
```

Varsayılan davranış: daha önce tutorial'ı bitirmiş/atlamış bir tarayıcıda
varsayılan kapalı; ilk kez oynayan biri için varsayılan açık.

```jsx
<label className="fixed top-4 right-4 flex items-center gap-2 bg-surface-container border border-outline px-3 py-2 z-50 cursor-pointer">
  <input
    type="checkbox"
    checked={tutorialGoster}
    onChange={(e) => setTutorialGoster(e.target.checked)}
  />
  <span className="font-data-sm text-data-sm uppercase text-on-surface-variant">
    Öğreticiyi Göster
  </span>
</label>
```

### 4.2 `onBitis` Çağrılarına Ekleme

Ana `devamEt()` fonksiyonundaki `onBitis` çağrısına ve geliştirici atla
butonuna `tutorialGoster` alanı eklenir:

```jsx
onBitis({
  nakit: yeniNakit,
  sabir: yeniSabir,
  mutluluk: yeniMutluluk,
  yillikGelir: s.gelir || gelir || 216000,
  answers: yeniCevaplar,
  meslek: meslekRef.current,
  tutorialGoster,
})
```

### 4.3 `App.jsx` — `introyuBitir` İçinde Kullanım

```jsx
async function introyuBitir(sonuc) {
  setBars({ sabir: sonuc.sabir, mutluluk: sonuc.mutluluk })
  nakitiGuncelle(sonuc.nakit)
  setYillikGelir(sonuc.yillikGelir)
  setTemelMaas(sonuc.yillikGelir)
  setIsYeri(sonuc.meslek || null)
  setTutorialAktif(!!sonuc.tutorialGoster)
  // ...mevcut kodun geri kalanı
}
```

`localStorage` kontrolü artık doğrudan burada yapılmıyor — karar zaten
intro'da checkbox ile netleşti. `localStorage`, sadece checkbox'ın
varsayılan değerini belirlemek için okunuyor; `TutorialProvider`
içindeki `tutorialuBitir()` fonksiyonu, tamamlanınca/atlanınca aynı
flag'i yazmaya devam ediyor — böylece bir sonraki oyunda checkbox yine
doğru varsayılanla açılır.

## 5. Önerilen Uygulama Sırası

1. **İskelet:** `TutorialContext`, `TutorialProvider`, `TutorialOdak`,
   `TutorialKutusu` — boş/test adımlarla temel mekanizmanın çalıştığını
   doğrulamak
2. **T1-T2:** İnfo kartları ve event kutusu etrafına `TutorialOdak`
   sarmalayıcıları
3. **T3-T11:** Sayfa geçişi adımları — sidebar linkleri, varlık
   kartları, portföy, yaşam standartları
4. **T12-T15:** Ana sayfaya dönüş, yıl çalıştırma, event seçimi, sonuç
   gösterimi, side event guard'ları
5. **Intro entegrasyonu:** Checkbox, `onBitis` güncellemesi,
   `introyuBitir` güncellemesi
