import { useState } from "react"
import { BASLANGIC, SORULAR } from "./data/sorular"

function kilitliMi(kilit, nakit, sabir, mutluluk) {
  if (!kilit) return false
  if (kilit.tur === "nakit") return nakit < kilit.min
  if (kilit.tur === "sabir") return sabir < kilit.min
  if (kilit.tur === "mutluluk") return mutluluk < kilit.min
  return false
}

export default function IntroEkrani({ onBitis }) {
  const [soruIndex, setSoruIndex] = useState(0)
  const [secim, setSecim] = useState(null)
  const [nakit, setNakit] = useState(BASLANGIC.nakit)
  const [sabir, setSabir] = useState(BASLANGIC.sabir)
  const [mutluluk, setMutluluk] = useState(BASLANGIC.mutluluk)
  const [gelir, setGelir] = useState(0)

  const soru = SORULAR[soruIndex]
  const ilerleme = ((soruIndex + 1) / SORULAR.length) * 100

  function devamEt() {
    if (secim === null) return
    const s = soru.secenekler[secim]

    const yeniNakit = Math.max(20000, nakit + s.nakit)
    const yeniSabir = Math.min(80, Math.max(20, sabir + s.sabir))
    const yeniMutluluk = Math.min(80, Math.max(20, mutluluk + s.mutluluk))

    setNakit(yeniNakit)
    setSabir(yeniSabir)
    setMutluluk(yeniMutluluk)

    if (s.gelir) setGelir(s.gelir)

    if (soruIndex + 1 >= SORULAR.length) {
      onBitis({
        nakit: yeniNakit,
        sabir: yeniSabir,
        mutluluk: yeniMutluluk,
        yillikGelir: s.gelir || gelir || 216000,
      })
    } else {
      setSoruIndex(soruIndex + 1)
      setSecim(null)
    }
  }

  return (
    <main className="intro-shell">
      <section className="intro-card">
        <div className="intro-top">
          <div>
            <div className="eyebrow">FinSim / Karakter</div>
            <h1>Finansal hikayeni kur</h1>
          </div>
          <span>{soruIndex + 1}/{SORULAR.length}</span>
        </div>

        <div className="intro-progress">
          <span style={{ width: `${ilerleme}%` }} />
        </div>

        <div className="intro-stats">
          <Stat label="Nakit" value={`₺${(nakit / 1000).toFixed(0)}k`} />
          <Stat label="Sabır" value={sabir} />
          <Stat label="Mutluluk" value={mutluluk} />
        </div>

        <div className="question-block">
          <span>{soru.kategori}</span>
          <h2>{soru.soru}</h2>
        </div>

        <div className="choice-list">
          {soru.secenekler.map((s, i) => {
            const kilitli = kilitliMi(s.kilit, nakit, sabir, mutluluk)
            const secili = secim === i

            return (
              <button
                className={`choice ${secili ? "selected" : ""}`}
                key={i}
                onClick={() => !kilitli && setSecim(i)}
                disabled={kilitli}
              >
                <span className="choice-title">{kilitli ? "Kilitli" : s.metin}</span>
                {s.gelir_aciklama && !kilitli && <small>{s.gelir_aciklama} maaş</small>}
                {kilitli && s.kilit && <small>{kilitMetni(s.kilit)}</small>}
                {secili && (
                  <span className="effect-list">
                    {s.nakit !== 0 && <Effect value={`₺${s.nakit > 0 ? "+" : ""}${(s.nakit / 1000).toFixed(0)}k`} positive={s.nakit > 0} />}
                    {s.sabir !== 0 && <Effect value={`Sabır ${s.sabir > 0 ? "+" : ""}${s.sabir}`} positive={s.sabir > 0} />}
                    {s.mutluluk !== 0 && <Effect value={`Mutluluk ${s.mutluluk > 0 ? "+" : ""}${s.mutluluk}`} positive={s.mutluluk > 0} />}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button className="primary-action" onClick={devamEt} disabled={secim === null}>
          {soruIndex + 1 >= SORULAR.length ? "Oyunu Başlat" : "Devam Et"}
        </button>
      </section>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Effect({ value, positive }) {
  return <em className={positive ? "positive-chip" : "negative-chip"}>{value}</em>
}

function kilitMetni(kilit) {
  if (kilit.tur === "nakit") return `₺${(kilit.min / 1000).toFixed(0)}k nakit gerekiyor`
  if (kilit.tur === "sabir") return `${kilit.min} sabır gerekiyor`
  if (kilit.tur === "mutluluk") return `${kilit.min} mutluluk gerekiyor`
  return "Kilitli"
}
