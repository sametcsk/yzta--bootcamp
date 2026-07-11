import { useRef, useState } from "react"
import IntroEkrani from "./IntroEkrani"
import VarlikSayfasi from "./VarlikSayfasi"
import YasamStandartlari from "./YasamStandartlari"
import { VARSAYILAN_STANDARTLAR, YASAM_STANDARTLARI, toplamAylikUsd, yasamKalitesiEtkisi } from "./data/standartlar"
import PortfoySayfasi from "./PortfoySayfasi"
import characterAvatar from "./assets/character-avatar.png"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")

const INITIAL_STATE = {
  enf_rejim: 0,
  enf_sakin_yil: 0,
  enf_kriz_mevcut: null,
  enf_kriz_dusus: null,
  kur: 40.0,
  kur_ham: 40.0,
  reden_sayaci: 0,
  altin_usd: 2600.0,
  altin_zirve: 2600.0,
  altin_rejim: 1,
  altin_durgun_yil: 0,
  altin_boga_yil: 7,
  faiz: 12.0,
  bist: 100.0,
  mevduat_birikim: 100.0,
}

const VARLIK_META = {
  altin: { icon: "Au", ad: "Altın", type: "Nadir Varlık", risk: "Orta", tone: "gold", score: 2 },
  bist: { icon: "BI", ad: "BIST", type: "Riskli Varlık", risk: "Yüksek", tone: "green", score: 3 },
  dolar: { icon: "$", ad: "Dolar", type: "Döviz", risk: "Orta", tone: "blue", score: 2 },
  mevduat: { icon: "%", ad: "Mevduat", type: "Güvenli Alan", risk: "Düşük", tone: "violet", score: 1 },
}

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE)
  const [yil, setYil] = useState(2025)
  const [yas, setYas] = useState(25)
  const [sonuc, setSonuc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [gecmis, setGecmis] = useState([])
  const [bars, setBars] = useState({ sabir: 50, mutluluk: 50 })
  const [nakit, setNakit] = useState(25000)
  const [introTamamlandi, setIntroTamamlandi] = useState(false)
  const [karakterProfili, setKarakterProfili] = useState(null)
  const [aktifSayfa, setAktifSayfa] = useState("ana")
  const [yillikGelir, setYillikGelir] = useState(0)
  const [yasamGideri, setYasamGideri] = useState(
  toplamAylikUsd(VARSAYILAN_STANDARTLAR, YASAM_STANDARTLARI) * 40 * 12
)
  const [portfoy, setPortfoy] = useState({
    altin_gram: 0,
    bist_adet: 0,
    dolar: 0,
    mevduat_tl: 0,
  })
  const [fiyatlar, setFiyatlar] = useState({
    altin_try_gram: (2600 * 40) / 31.1,
    bist_endeks: 100,
    dolar_try: 40,
    mev_faiz_oran: 0.12,
  })
  const [standartlar, setStandartlar] = useState(VARSAYILAN_STANDARTLAR)

  const nakitRef = useRef(nakit)

  const nakitiGuncelle = (yeniNakit) => {
    nakitRef.current = yeniNakit
    setNakit(yeniNakit)
  }
  const [mevcutEvent, setMevcutEvent] = useState(null)
  const [eventGecmisi, setEventGecmisi] = useState({})
  const [tetiklenenler, setTetiklenenler] = useState([])
  const [eventKayitlari, setEventKayitlari] = useState([])
  const [coachYorumu, setCoachYorumu] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [finalRapor, setFinalRapor] = useState(null)
  const [finalRaporLoading, setFinalRaporLoading] = useState(false)
  const [fiyatGecmisi, setFiyatGecmisi] = useState({
  altin: [],
  bist: [],
  dolar: [],
  mevduat: []
})
const [portfoyGecmisi, setPortfoyGecmisi] = useState([])
const [enflasyonEndeksi, setEnflasyonEndeksi] = useState(100)
const [enflasyonGecmisi, setEnflasyonGecmisi] = useState([])
const [varlikKatsayilari, setVarlikKatsayilari] = useState({
  altin: null,   // null = hiç alınmadı
  bist: null,
  dolar: null,
  mevduat: null,
})

  
  async function yilAtla() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/yil-atla`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...gameState,
          yil: yil,
          yas: yas,
          event_gecmisi: eventGecmisi,
          tetiklenenler: tetiklenenler,
          portfoy: portfoy,
        }),
      })
      const data = await res.json()

      setGameState({
        enf_rejim: data.enf_rejim,
        enf_sakin_yil: data.enf_sakin_yil,
        enf_kriz_mevcut: data.enf_kriz_mevcut,
        enf_kriz_dusus: data.enf_kriz_dusus,
        kur: data.kur,
        kur_ham: data.kur_ham,
        reden_sayaci: data.reden_sayaci,
        altin_usd: data.altin_usd,
        altin_zirve: data.altin_zirve,
        altin_rejim: data.altin_rejim,
        altin_durgun_yil: data.altin_durgun_yil,
        altin_boga_yil: data.altin_boga_yil,
        faiz: data.faiz,
        bist: data.bist,
        mevduat_birikim: data.mevduat_birikim,
      })

      const yeniGelir = Math.round(yillikGelir * (1 + data.yil_sonucu.enflasyon / 100))
      const yeniGider = Math.round(yasamGideri * (1 + data.yil_sonucu.enflasyon / 100))
      setYillikGelir(yeniGelir)
      
      const yeniDolarKuru = data.yil_sonucu.fiyatlar.dolar_try
      setYasamGideri(Math.round(toplamAylikUsd(standartlar, YASAM_STANDARTLARI) * yeniDolarKuru * 12))

      let yeniNakit = nakitRef.current + yeniGelir - yeniGider
      if (data.yil_sonucu.redenominasyon) {
        yeniNakit = Math.round(yeniNakit / 1000)
        setYillikGelir(Math.round(yeniGelir / 1000))
        setYasamGideri(Math.round(yeniGider / 1000))
      }
      nakitiGuncelle(yeniNakit)

      if (data.yil_sonucu.fiyatlar) {
        setFiyatlar(data.yil_sonucu.fiyatlar)
      }

      setPortfoy(prev => ({
        ...prev,
        mevduat_tl: Math.round(prev.mevduat_tl * (1 + data.yil_sonucu.mev_faiz / 100)),
      }))

      if (data.yil_sonucu.redenominasyon) {
        setEnflasyonEndeksi(prev => prev / 1000)
        setEnflasyonGecmisi(prev => prev.map(p => ({ ...p, deger: Math.round(p.deger / 1000) })))
        setPortfoyGecmisi(prev => prev.map(p => ({ ...p, deger: Math.round(p.deger / 1000) })))
          setPortfoy(prev => ({
            ...prev,
            mevduat_tl: Math.round(prev.mevduat_tl / 1000),
          }))
          setFiyatlar(prev => ({
            altin_try_gram: Math.round(prev.altin_try_gram / 1000),
            bist_endeks: Math.round(prev.bist_endeks / 1000),
            dolar_try: Math.round(prev.dolar_try / 1000),
            mev_faiz_oran: prev.mev_faiz_oran,
          }))
          // Geçmiş fiyatları da böl
          setFiyatGecmisi(prev => ({
          altin: prev.altin.map(p => ({ ...p, fiyat: Math.round(p.fiyat / 1000) })),
          bist: prev.bist.map(p => ({ ...p, fiyat: Math.round(p.fiyat / 1000) })),
          dolar: prev.dolar.map(p => ({ ...p, fiyat: p.fiyat / 1000 })),
          mevduat: prev.mevduat,
        }))
          setVarlikKatsayilari(prev => ({
          altin:   prev.altin   !== null ? prev.altin   / 1000 : null,
          bist:    prev.bist,
          dolar:   prev.dolar   !== null ? prev.dolar   / 1000 : null,
          mevduat: prev.mevduat !== null ? prev.mevduat / 1000 : null,
        }))
        }

      const yeniYil = yil + 1
      const yeniYas = yas + 1
      setYil(yeniYil)
      setYas(yeniYas)

      // Yaşam kalitesi debuff
      const kalite = yasamKalitesiEtkisi(standartlar, YASAM_STANDARTLARI)

      // Finansal debuff
      let finansalDebuff = { mutluluk: 0, sabir: 0 }
      if (yeniGelir < yeniGider) {
        finansalDebuff = { mutluluk: -8, sabir: -5 }
      } else if (yeniGelir < yeniGider * 1.2) {
        finansalDebuff = { mutluluk: -3, sabir: -2 }
      }

      // Barları güncelle
      setBars(prev => ({
        sabir: Math.min(80, Math.max(20, prev.sabir + kalite.sabir + finansalDebuff.sabir)),
        mutluluk: Math.min(80, Math.max(20, prev.mutluluk + kalite.mutluluk + finansalDebuff.mutluluk)),
      }))
      
      setSonuc(data.yil_sonucu)
      setFiyatGecmisi(prev => ({
        altin: [...prev.altin, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.altin_try_gram }],
        bist: [...prev.bist, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_endeks }],
        dolar: [...prev.dolar, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.dolar_try }],
        mevduat: [...prev.mevduat, { yil: yil + 1, fiyat: data.yil_sonucu.mev_faiz }],
      }))
      // Varlık katsayılarını güncelle
      setVarlikKatsayilari(prev => {
        const getiriler = {
          altin: data.yil_sonucu.altin_try_getiri / 100,
          bist: data.yil_sonucu.bist_pct / 100,
          dolar: data.yil_sonucu.doviz_degisim / 100,
          mevduat: data.yil_sonucu.mev_faiz / 100,
        }
        return {
          altin:   prev.altin   !== null ? prev.altin   * (1 + getiriler.altin)   : null,
          bist:    prev.bist    !== null ? prev.bist    * (1 + getiriler.bist)    : null,
          dolar:   prev.dolar   !== null ? prev.dolar   * (1 + getiriler.dolar)   : null,
          mevduat: prev.mevduat !== null ? prev.mevduat * (1 + getiriler.mevduat) : null,
        }
      })
      

      if (data.yil_sonucu.event) {
       setCoachYorumu(null)
       setMevcutEvent(data.yil_sonucu.event)
       setEventGecmisi(prev => ({
          ...prev,
         [data.yil_sonucu.event.id]: yil + 1
       }))
        if (data.yil_sonucu.event.tek_seferlik) {
          setTetiklenenler(prev => [...prev, data.yil_sonucu.event.id])
       }
      }
      setGecmis(prev => [...prev, { yil: yeniYil, yas: yeniYas, ...data.yil_sonucu }])
      // Enflasyon endeksi güncelle
      const yeniEnflasyonEndeksi = enflasyonEndeksi * (1 + data.yil_sonucu.enflasyon / 100)
      setEnflasyonEndeksi(yeniEnflasyonEndeksi)
      setEnflasyonGecmisi(prev => [...prev, { yil: yil + 1, deger: Math.round(yeniEnflasyonEndeksi) }])

      // Portföy toplam değeri geçmişi
      const yeniPortfoyDegeri = nakitRef.current + Math.round(
        portfoy.altin_gram * data.yil_sonucu.fiyatlar.altin_try_gram +
        portfoy.bist_adet * data.yil_sonucu.fiyatlar.bist_endeks +
        portfoy.dolar * data.yil_sonucu.fiyatlar.dolar_try +
        portfoy.mevduat_tl
      )
      setPortfoyGecmisi(prev => [...prev, { yil: yil + 1, deger: yeniPortfoyDegeri }])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function introyuBitir(sonuc) {
    setBars({ sabir: sonuc.sabir, mutluluk: sonuc.mutluluk })
    nakitiGuncelle(sonuc.nakit)
    setYillikGelir(sonuc.yillikGelir)

    try {
      const res = await fetch(`${API_BASE_URL}/ajanlar/profil`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: sonuc.answers || sonuc.cevaplar || [],
          cevaplar: sonuc.cevaplar || sonuc.answers || [],
          nakit: sonuc.nakit,
          sabir: sonuc.sabir,
          mutluluk: sonuc.mutluluk,
          yillik_gelir: sonuc.yillikGelir,
        }),
      })

      if (res.ok) {
        setKarakterProfili(await res.json())
      } else {
        setKarakterProfili(null)
      }
    } catch (error) {
      console.error(error)
      setKarakterProfili(null)
    }

    setIntroTamamlandi(true)
  }

  function standartDegis(kategori, secimId) {
  const yeniSecimler = { ...standartlar, [kategori]: secimId }
  setStandartlar(yeniSecimler)
  setYasamGideri(Math.round(toplamAylikUsd(yeniSecimler, YASAM_STANDARTLARI) * fiyatlar.dolar_try * 12))
}

  async function eventSeceneginiSec(secenek) {
    if (!mevcutEvent) return

    const secilenEvent = mevcutEvent

    setBars(prev => ({
      sabir: Math.min(80, Math.max(20, prev.sabir + (secenek.sabir_etki || 0))),
      mutluluk: Math.min(80, Math.max(20, prev.mutluluk + (secenek.mutluluk_etki || 0))),
    }))

    if (secenek.nakit_etki_usd && secenek.nakit_etki_usd !== 0) {
      const tlEtkisi = Math.round(secenek.nakit_etki_usd * fiyatlar.dolar_try)
      nakitiGuncelle(Math.max(20000, nakitRef.current + tlEtkisi))
    }

    if (secenek.gelir_degisim) {
      const { tip, min, max, oran } = secenek.gelir_degisim
      if (tip === "randomize") {
        const carpan = rastgeleGelirCarpani(min, max)
        setYillikGelir(prev => Math.round(prev * carpan))
      } else if (tip === "sabit_oran") {
        setYillikGelir(prev => Math.round(prev * oran))
      }
    }

    const eventKaydi = {
      year: yil,
      event_id: secilenEvent.id,
      event_title: secilenEvent.baslik,
      selected_option: secenek.metin,
      bias_label: secilenEvent.bias_etiketi,
      profile_type: karakterProfili?.profile_type || null,
      yil,
      event_baslik: secilenEvent.baslik,
      bias: secilenEvent.bias_etiketi,
      secim_id: secenek.id,
      secim_metin: secenek.metin,
    }

    setEventKayitlari(prev => [...prev, eventKaydi])
    setFinalRapor(null)
    setMevcutEvent(null)
    setCoachYorumu(null)
    setCoachLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/ajanlar/koc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventKaydi),
      })

      if (!res.ok) throw new Error("AI koç yorumu alınamadı.")
      setCoachYorumu(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setCoachLoading(false)
    }
  }

  async function finalRaporuOlustur() {
    setFinalRaporLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/ajanlar/final-rapor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: karakterProfili,
          event_history: eventKayitlari,
          final_state: {
            year: yil,
            age: yas,
            cash: nakit,
            net_worth: toplamDeger,
          },
        }),
      })

      if (!res.ok) throw new Error("Final raporu oluşturulamadı.")
      setFinalRapor(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setFinalRaporLoading(false)
    }
  }

  function varlikAl(varlik, miktar) {
    const miktarSayi = parseFloat(miktar)
    if (!miktarSayi || miktarSayi <= 0) return

    let maliyet = 0
    if (varlik === "altin") maliyet = miktarSayi * fiyatlar.altin_try_gram
    if (varlik === "bist") maliyet = miktarSayi * fiyatlar.bist_endeks
    if (varlik === "dolar") maliyet = miktarSayi * fiyatlar.dolar_try
    if (varlik === "mevduat") maliyet = miktarSayi

    if (maliyet > nakitRef.current) {
      alert("Yeterli nakit yok!")
      return
    }

    nakitiGuncelle(Math.round(nakitRef.current - maliyet))
    // Katsayıyı başlat — null ise 1.0'dan başla, değilse devam et
    setVarlikKatsayilari(prev => ({
      ...prev,
      [varlik]: prev[varlik] === null ? 1.0 : prev[varlik]
    }))
    setPortfoy(prev => ({
      ...prev,
      altin_gram: varlik === "altin" ? prev.altin_gram + miktarSayi : prev.altin_gram,
      bist_adet: varlik === "bist" ? prev.bist_adet + miktarSayi : prev.bist_adet,
      dolar: varlik === "dolar" ? prev.dolar + miktarSayi : prev.dolar,
      mevduat_tl: varlik === "mevduat" ? prev.mevduat_tl + miktarSayi : prev.mevduat_tl,
    }))
  }

  function varlikSat(varlik, miktar) {
    const miktarSayi = parseFloat(miktar)
    if (!miktarSayi || miktarSayi <= 0) return

    let gelir = 0
    if (varlik === "altin" && portfoy.altin_gram >= miktarSayi) gelir = miktarSayi * fiyatlar.altin_try_gram
    if (varlik === "bist" && portfoy.bist_adet >= miktarSayi) gelir = miktarSayi * fiyatlar.bist_endeks
    if (varlik === "dolar" && portfoy.dolar >= miktarSayi) gelir = miktarSayi * fiyatlar.dolar_try
    if (varlik === "mevduat" && portfoy.mevduat_tl >= miktarSayi) gelir = miktarSayi

    if (gelir === 0) {
      alert("Yeterli varlık yok!")
      return
    }

    nakitiGuncelle(Math.round(nakitRef.current + gelir))
    setPortfoy(prev => ({
      ...prev,
      altin_gram: varlik === "altin" ? prev.altin_gram - miktarSayi : prev.altin_gram,
      bist_adet: varlik === "bist" ? prev.bist_adet - miktarSayi : prev.bist_adet,
      dolar: varlik === "dolar" ? prev.dolar - miktarSayi : prev.dolar,
      mevduat_tl: varlik === "mevduat" ? prev.mevduat_tl - miktarSayi : prev.mevduat_tl,
    }))
  }

  const portfoyDegeri = Math.round(
    portfoy.altin_gram * fiyatlar.altin_try_gram +
    portfoy.bist_adet * fiyatlar.bist_endeks +
    portfoy.dolar * fiyatlar.dolar_try +
    portfoy.mevduat_tl
  )
  const toplamDeger = nakit + portfoyDegeri
  const netAkis = yillikGelir - yasamGideri
  const krizMi = gameState.enf_rejim === 1
  const riskProfili = karakterProfili?.risk_level
    ? riskEtiketi(karakterProfili.risk_level)
    : "Belirleniyor"
  const profilAdi = karakterProfili?.profile_name || "Profil Hazırlanıyor"
  const seviye = Math.max(1, yas - 24)


  if (!introTamamlandi) {
    return <IntroEkrani onBitis={introyuBitir} />
  }

  return (
    <main className="app-shell">
    <nav className="game-nav">
      <div className="nav-brand">
        <strong>FinSim</strong>
        <span>{yil}</span>
      </div>
      <div className="nav-links">
        {[
          { id: "ana", label: "Ana Sayfa", icon: "HQ" },
          { id: "varliklar", label: "Varlıklar", icon: "IV" },
          { id: "portfoy", label: "Portföy", icon: "CH" },
          { id: "standartlar", label: "Yaşam", icon: "LS" },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setAktifSayfa(s.id)}
            className={aktifSayfa === s.id ? "active" : ""}
          >
            <strong>{s.icon}</strong>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <div className="nav-year">
        <span>Yıl</span>
        <strong>{yil}</strong>
        <button onClick={yilAtla} disabled={loading || coachLoading || finalRaporLoading || !!mevcutEvent}>
          {loading ? "..." : `${yil + 1}'e Atla`}
        </button>
      </div>
    </nav>

    <section className="game-stage">
     {aktifSayfa === "ana" && (
      <>
      <section className="command-top">
        <CharacterCard yas={yas} seviye={seviye} riskProfili={riskProfili} profilAdi={profilAdi} />
        <section className="hero-panel">
          <div>
            <div className="eyebrow">{yas} yaşında</div>
            <h1>Finansal Yolculuk</h1>
            <p className="hero-copy">Portföyünü yönet, doğru kararlar al ve finansal geleceğini şekillendir.</p>
          </div>
          <div className="hero-status">
            <div className="chapter-block">
              <span>Bölüm 3 / 10</span>
              <i><b /><b /><b /><b /><b /><b /><b /><b /><b /><b /></i>
            </div>
            <div className="hero-badges">
              <span className="good">Başlangıç</span>
              <span>{riskProfili}</span>
            </div>
          </div>
        </section>
      </section>
      
      <section className="summary-grid">
        <MetricCard icon="₺" label="Servet" value={money(toplamDeger)} hint="Portföy Değeri" tone="gold" />
        <MetricCard icon="₺" label="Kalan Nakit" value={money(nakit)} hint="Harcanabilir bakiye" tone="cash" />
        <MetricCard icon="⚡" label="Aylık Gelir" value={money(yillikGelir)} hint={`Net akış: ${money(netAkis)}`} tone="green" />
        <MetricCard
          icon="%"
          label="Enflasyon Oranı"
          value={sonuc ? `%${sonuc.enflasyon}` : "—"}
          hint={sonuc ? `Durum: ${sonuc.enf_durum}` : "Sakin"}
          tone={krizMi ? "rose" : "primary"}
        />
      </section>

      <div className="command-grid">
        <section className="panel character-panel">
          <PanelHeader title="Karakter Durumu" action="120 / 250 XP" />
          <ProgressRow icon="AB" label="Sabır" value={bars.sabir} tone="blue" />
          <ProgressRow icon="☺" label="Mutluluk" value={bars.mutluluk} tone="gold" />


          {mevcutEvent ? (
  <div className="event-panel">
    <div className="event-kicker">
      {yil} Olayı
    </div>
    <div className="event-title">
      {mevcutEvent.baslik}
    </div>
    <div className="event-copy">
      {mevcutEvent.metin}
    </div>
    <div className="event-choice-list">
      {mevcutEvent.secenekler.map((s, i) => {
        const kilitli = s.kilit && (
          (s.kilit.tur === "sabir" && bars.sabir < s.kilit.min) ||
          (s.kilit.tur === "mutluluk" && bars.mutluluk < s.kilit.min) ||
          (s.kilit.tur === "nakit" && nakit < s.kilit.min) ||
          (s.kilit.tur === "nakit_usd" && nakit < s.kilit.min * fiyatlar.dolar_try)
        )
        return (
          <button
            key={i}
            disabled={kilitli}
            onClick={() => !kilitli && eventSeceneginiSec(s)}
            className={`event-choice ${kilitli ? "locked" : ""}`}
          >
            <span>{kilitli ? "Kilitli" : `Seçenek ${i + 1}`}</span>
            <strong>{s.metin}</strong>
            {kilitli && s.kilit && (
              <small>
                {s.kilit.tur === "sabir" && `${s.kilit.min} sabır gerekiyor`}
                {s.kilit.tur === "mutluluk" && `${s.kilit.min} mutluluk gerekiyor`}
                {s.kilit.tur === "nakit" && `₺${(s.kilit.min/1000).toFixed(0)}k gerekiyor`}
                {s.kilit.tur === "nakit_usd" && `$${s.kilit.min} (₺${Math.round(s.kilit.min * fiyatlar.dolar_try).toLocaleString("tr-TR")}) gerekiyor`}
              </small>
            )}
          </button>
        )
      })}
    </div>
  </div>
) : (
  <button
    className="primary-action year-jump"
    onClick={yilAtla}
    disabled={loading || coachLoading || finalRaporLoading || !!mevcutEvent}
  >
    {loading ? "Hesaplanıyor..." : `${yil + 1}'e atla`}
  </button>
)}

          {coachLoading && (
            <div className="agent-loading">AI koç seçimini değerlendiriyor...</div>
          )}

          {coachYorumu && (
            <section className="coach-panel" aria-live="polite">
              <div className="agent-kicker">AI Koç Yorumu</div>
              <h3>{coachYorumu.coach_title}</h3>
              <strong>{coachYorumu.bias_name_tr}</strong>
              <p>{coachYorumu.coach_comment}</p>
              <blockquote>{coachYorumu.reflection_question}</blockquote>
              <small>{coachYorumu.disclaimer}</small>
            </section>
          )}

        </section>

        <section className="panel asset-panel">
          <PanelHeader title="Varlıklar" action="Envanter" />
          <div className="asset-list">
            <VarlikSatir
              fiyat={money(Math.round(fiyatlar.altin_try_gram)) + "/gr"}
              miktar={`${portfoy.altin_gram.toFixed(2)} gr`}
              deger={Math.round(portfoy.altin_gram * fiyatlar.altin_try_gram)}
              getiri={sonuc ? sonuc.altin_try_getiri : null}
              varlik="altin"
              onAl={varlikAl}
              onSat={varlikSat}
            />
            <VarlikSatir
              fiyat={`${Math.round(fiyatlar.bist_endeks).toLocaleString("tr-TR")} endeks`}
              miktar={`${portfoy.bist_adet.toFixed(0)} adet`}
              deger={Math.round(portfoy.bist_adet * fiyatlar.bist_endeks)}
              getiri={sonuc ? sonuc.bist_pct : null}
              varlik="bist"
              onAl={varlikAl}
              onSat={varlikSat}
            />
            <VarlikSatir
              fiyat={`${fiyatlar.dolar_try.toFixed(2)} TL/$`}
              miktar={`$${portfoy.dolar.toFixed(0)}`}
              deger={Math.round(portfoy.dolar * fiyatlar.dolar_try)}
              getiri={sonuc ? sonuc.doviz_degisim : null}
              varlik="dolar"
              onAl={varlikAl}
              onSat={varlikSat}
            />
            <VarlikSatir
              fiyat={`%${(fiyatlar.mev_faiz_oran * 100).toFixed(1)} faiz`}
              miktar={money(Math.round(portfoy.mevduat_tl))}
              deger={portfoy.mevduat_tl}
              getiri={sonuc ? sonuc.mev_faiz : null}
              varlik="mevduat"
              onAl={varlikAl}
              onSat={varlikSat}
            />
          </div>
        </section>


      </div>

      <section className="panel final-report-section">
        <div className="final-report-heading">
          <div>
            <div className="agent-kicker">AI Analizi</div>
            <h2>Finansal Davranış Raporu</h2>
            <p>{eventKayitlari.length} event kararı rapora hazır.</p>
          </div>
          <button
            className="report-action"
            onClick={finalRaporuOlustur}
            disabled={finalRaporLoading || !!mevcutEvent || coachLoading}
          >
            {finalRaporLoading ? "Rapor hazırlanıyor..." : "Final Raporu Oluştur"}
          </button>
        </div>

        {finalRapor && (
          <div className="final-report" aria-live="polite">
            <div className="final-report-summary">
              <span>{finalRapor.title}</span>
              <h3>{finalRapor.profile_name}</h3>
              <p>{finalRapor.summary}</p>
            </div>
            <div className="report-stat">
              <span>Karar Sayısı</span>
              <strong>{finalRapor.decision_count}</strong>
            </div>
            <div className="report-stat">
              <span>Baskın Eğilim</span>
              <strong>{finalRapor.dominant_bias_name_tr || "Henüz belirlenmedi"}</strong>
            </div>
            <div className="report-list">
              <h4>Güçlü Yönler</h4>
              <ul>
                {finalRapor.strengths?.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div className="report-list">
              <h4>Gelişim Alanları</h4>
              <ul>
                {finalRapor.growth_areas?.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <small className="report-disclaimer">{finalRapor.disclaimer}</small>
          </div>
        )}
      </section>

      {sonuc && (
        <section className={`panel year-card ${krizMi ? "danger" : "calm"}`}>
          <PanelHeader title="Bu Yılın Özeti" action={sonuc.enf_durum} />
          <p>
            Enflasyon <strong>%{sonuc.enflasyon}</strong> oldu. BIST reel olarak{" "}
            <strong className={pctClass(sonuc.reel_bist)}>{formatPct(sonuc.reel_bist)}</strong>, altın reel olarak{" "}
            <strong className={pctClass(sonuc.reel_altin)}>{formatPct(sonuc.reel_altin)}</strong> performans gösterdi.
          </p>
          {sonuc.redenominasyon && <div className="notice">{sonuc.redenominasyon}: Para birimi yenilendi.</div>}
        </section>
      )}

      {gecmis.length > 0 && (
        <section className="panel">
          <PanelHeader title="Geçmiş" action="Son 5 yıl" />
          <div className="history-list">
            {[...gecmis].reverse().slice(0, 5).map((g, i) => (
              <div className="history-row" key={i}>
                <span>{g.yil} / {g.yas} yaş</span>
                <strong>%{g.enflasyon}</strong>
                <span className={pctClass(g.bist_pct)}>BIST {formatPct(g.bist_pct)}</span>
                <span className={pctClass(g.altin_try_getiri)}>Altın {formatPct(g.altin_try_getiri)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
    )}

    {aktifSayfa === "varliklar" && (
      <VarlikSayfasi
        fiyatGecmisi={fiyatGecmisi}
        fiyatlar={fiyatlar}
        portfoy={portfoy}
        sonuc={sonuc}
        varlikAl={varlikAl}
        varlikSat={varlikSat}
      />
    )}

    {aktifSayfa === "standartlar" && (
      <YasamStandartlari
        secimler={standartlar}
        onSecimDegis={standartDegis}
        nakit={nakit}
        portfoy={portfoy}
        dolarKuru={fiyatlar.dolar_try}
        yasamGideri={yasamGideri}

      />
    )}

    {aktifSayfa === "portfoy" && (
    <div className="page-pad">
        <PortfoySayfasi
          fiyatGecmisi={fiyatGecmisi}
          portfoyGecmisi={portfoyGecmisi}
          enflasyonGecmisi={enflasyonGecmisi}
          portfoy={portfoy}
          fiyatlar={fiyatlar}
          nakit={nakit}
          varlikKatsayilari={varlikKatsayilari}


        />
      </div>
    )}
    </section>
    </main>
  )
}

function CharacterCard({ yas, seviye, riskProfili, profilAdi }) {
  return (
    <section className="character-card">
      <div className="panel-kicker">Karakterin</div>
      <div className="avatar-card">
        <div className="avatar">
          <img src={characterAvatar} alt="FinSim karakter portresi" />
        </div>
        <div className="character-meta">
          <small>Yaş</small>
          <strong>{yas}</strong>
          <small>Sınıf</small>
          <b>{profilAdi}</b>
          <small>Risk Profili</small>
          <em>{riskProfili}</em>
        </div>
        <div className="level-badge">
          <span>Seviye</span>
          <strong>{seviye}</strong>
        </div>
      </div>
      <div className="xp-line">
        <span />
        <small>120 / 250 XP</small>
      </div>
    </section>
  )
}

function MetricCard({ icon, label, value, hint, tone = "" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-top">
        <i>{icon}</i>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

function PanelHeader({ title, action }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      <span>{action}</span>
    </div>
  )
}

function ProgressRow({ icon, label, value, tone }) {
  return (
    <div className="progress-row">
      <i>{icon}</i>
      <div>
        <span>{label}</span>
        <div className="progress-track">
          <span className={tone} style={{ width: `${value}%` }} />
        </div>
      </div>
      <strong>{value} / 100</strong>
    </div>
  )
}


function VarlikSatir({ fiyat, miktar, deger, getiri, varlik, onAl, onSat }) {
  const [acik, setAcik] = useState(false)
  const [girdi, setGirdi] = useState("")
  const meta = VARLIK_META[varlik]
  const miktarGecerli = Number(girdi) > 0

  function al() {
    if (!miktarGecerli) return
    onAl(varlik, girdi)
    setGirdi("")
    setAcik(false)
  }

  function sat() {
    if (!miktarGecerli) return
    onSat(varlik, girdi)
    setGirdi("")
    setAcik(false)
  }

  return (
    <article className={`asset-row ${acik ? "open" : ""}`}>
      <button className="asset-main" onClick={() => setAcik(!acik)}>
        <span className={`asset-icon ${meta.tone}`}>{meta.icon}</span>
        <span className="asset-copy">
          <strong>{meta.ad}</strong>
          <small>{meta.type} · Risk: {meta.risk}</small>
          <em>{fiyat} · {miktar}</em>
          <span className="risk-dots">
            {[1, 2, 3].map((dot) => <b key={dot} className={dot <= meta.score ? "on" : ""} />)}
          </span>
        </span>
        <span className="asset-value">
          <strong>{deger > 0 ? money(Math.round(deger)) : "-"}</strong>
          {getiri !== null && <small className={pctClass(getiri)}>{formatPct(getiri)}</small>}
        </span>
      </button>

      {acik && (
        <div className="trade-box inventory-trade-box">
          <input
            type="number"
            min="0"
            step="any"
            value={girdi}
            onChange={e => setGirdi(e.target.value)}
            placeholder={varlik === "mevduat" ? "TL miktarı gir" : "Miktar gir"}
          />
          <button className="buy" disabled={!miktarGecerli} onClick={al}>Al</button>
          <button className="sell" disabled={!miktarGecerli} onClick={sat}>Sat</button>
        </div>
      )}
    </article>
  )
}

function money(value) {
  return `₺${Number(value).toLocaleString("tr-TR")}`
}

function formatPct(val) {
  return val >= 0 ? `+%${Math.abs(val).toFixed(1)}` : `-%${Math.abs(val).toFixed(1)}`
}

function pctClass(val) {
  return val >= 0 ? "positive" : "negative"
}

function riskEtiketi(riskLevel) {
  if (riskLevel === "dusuk") return "Düşük"
  if (riskLevel === "yuksek") return "Yüksek"
  return "Orta"
}

function rastgeleGelirCarpani(min, max) {
  return 1 + (Math.random() * (max - min) + min)
}
