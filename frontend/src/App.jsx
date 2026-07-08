import { useRef, useState } from "react"
import IntroEkrani from "./IntroEkrani"
import { YASAM_GIDERI } from "./data/sorular"

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
  altin: { icon: "Au", ad: "Altın", tone: "gold" },
  bist: { icon: "BI", ad: "BIST", tone: "green" },
  dolar: { icon: "$", ad: "Dolar", tone: "blue" },
  mevduat: { icon: "%", ad: "Mevduat", tone: "violet" },
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
  const [yillikGelir, setYillikGelir] = useState(0)
  const [yasamGideri, setYasamGideri] = useState(YASAM_GIDERI)
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

  const nakitRef = useRef(nakit)

  const nakitiGuncelle = (yeniNakit) => {
    nakitRef.current = yeniNakit
    setNakit(yeniNakit)
  }

  async function yilAtla() {
    setLoading(true)
    try {
      const res = await fetch("http://127.0.0.1:8000/yil-atla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameState),
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
      setYasamGideri(yeniGider)

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
      }

      const yeniYil = yil + 1
      const yeniYas = yas + 1
      setYil(yeniYil)
      setYas(yeniYas)
      setSonuc(data.yil_sonucu)
      setGecmis(prev => [...prev, { yil: yeniYil, yas: yeniYas, ...data.yil_sonucu }])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function introyuBitir(sonuc) {
    setBars({ sabir: sonuc.sabir, mutluluk: sonuc.mutluluk })
    nakitiGuncelle(sonuc.nakit)
    setYillikGelir(sonuc.yillikGelir)
    setIntroTamamlandi(true)
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

  if (!introTamamlandi) {
    return <IntroEkrani onBitis={introyuBitir} />
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <div className="eyebrow">FinSim / {yil}</div>
          <h1>{yas} yaşında finansal yolculuk</h1>
          <p className="hero-copy">Portföyünü yönet, piyasa şartlarını oku ve bir sonraki yılın kararını ver.</p>
        </div>
        <div className={`market-badge ${krizMi ? "danger" : "calm"}`}>
          <span>{krizMi ? "KRİZ" : "SAKİN"}</span>
          <strong>{sonuc ? `%${sonuc.enflasyon}` : "Başlangıç"}</strong>
        </div>
      </section>

      <section className="summary-grid">
        <MetricCard label="Toplam Değer" value={money(toplamDeger)} hint={`Portföy: ${money(portfoyDegeri)}`} tone="primary" />
        <MetricCard label="Nakit" value={money(nakit)} hint={`Yıllık akış: ${money(netAkis)}`} tone="gold" />
        <MetricCard label="Gelir" value={money(yillikGelir)} hint={`Gider: ${money(yasamGideri)}`} />
        <MetricCard label="Dolar Kuru" value={`${fiyatlar.dolar_try.toFixed(2)} TL`} hint={sonuc ? `Yıllık ${formatPct(sonuc.doviz_degisim)}` : "İlk fiyat"} />
      </section>

      <div className="content-grid">
        <section className="panel">
          <PanelHeader title="Durum" action={`${yil + 1}'e hazırlan`} />
          <ProgressRow label="Sabır" value={bars.sabir} tone="blue" />
          <ProgressRow label="Mutluluk" value={bars.mutluluk} tone="rose" />
          <button className="primary-action" onClick={yilAtla} disabled={loading}>
            {loading ? "Hesaplanıyor..." : `${yil + 1}'e atla`}
          </button>
        </section>

        <section className="panel">
          <PanelHeader title="Piyasa" action={krizMi ? "Volatil" : "Dengeli"} />
          <DataRow label="Enflasyon" value={sonuc ? `%${sonuc.enflasyon}` : "-"} valueClass={krizMi ? "negative" : ""} />
          <DataRow label="BIST" value={sonuc ? formatPct(sonuc.bist_pct) : "-"} valueClass={sonuc ? pctClass(sonuc.bist_pct) : ""} />
          <DataRow label="Altın" value={sonuc ? formatPct(sonuc.altin_try_getiri) : "-"} valueClass={sonuc ? pctClass(sonuc.altin_try_getiri) : ""} />
          <DataRow label="Mevduat" value={`%${(fiyatlar.mev_faiz_oran * 100).toFixed(1)}`} />
        </section>
      </div>

      <section className="panel asset-panel">
        <PanelHeader title="Varlıklar" action={`${money(portfoyDegeri)} yatırım`} />
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
    </main>
  )
}

function MetricCard({ label, value, hint, tone = "" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
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

function ProgressRow({ label, value, tone }) {
  return (
    <div className="progress-row">
      <div>
        <span>{label}</span>
        <strong>{value}/100</strong>
      </div>
      <div className="progress-track">
        <span className={tone} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function DataRow({ label, value, valueClass = "" }) {
  return (
    <div className="data-row">
      <span>{label}</span>
      <strong className={valueClass}>{value}</strong>
    </div>
  )
}

function VarlikSatir({ fiyat, miktar, deger, getiri, varlik, onAl, onSat }) {
  const [acik, setAcik] = useState(false)
  const [girdi, setGirdi] = useState("")
  const meta = VARLIK_META[varlik]

  function al() {
    onAl(varlik, girdi)
    setGirdi("")
    setAcik(false)
  }

  function sat() {
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
          <small>{fiyat} · {miktar}</small>
        </span>
        <span className="asset-value">
          <strong>{deger > 0 ? money(Math.round(deger)) : "-"}</strong>
          {getiri !== null && <small className={pctClass(getiri)}>{formatPct(getiri)}</small>}
        </span>
      </button>

      {acik && (
        <div className="trade-box">
          <input
            type="number"
            value={girdi}
            onChange={e => setGirdi(e.target.value)}
            placeholder={varlik === "mevduat" ? "TL miktarı" : "Miktar"}
          />
          <button className="buy" onClick={al}>Al</button>
          <button className="sell" onClick={sat}>Sat</button>
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
