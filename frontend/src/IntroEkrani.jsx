import { useEffect, useRef, useState } from "react"
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
  const cevaplarRef = useRef([])
  const ilerlemeKilitliRef = useRef(false)

  const soru = SORULAR[soruIndex]
  const seciliSecenek = secim !== null ? soru.secenekler[secim] : null

  useEffect(() => {
    ilerlemeKilitliRef.current = false
  }, [soruIndex])

  function devamEt() {
    if (secim === null || ilerlemeKilitliRef.current) return
    ilerlemeKilitliRef.current = true
    const s = soru.secenekler[secim]

    const yeniNakit = Math.max(20000, nakit + s.nakit)
    const yeniSabir = Math.min(80, Math.max(20, sabir + s.sabir))
    const yeniMutluluk = Math.min(80, Math.max(20, mutluluk + s.mutluluk))
    const yeniCevap = {
      question_id: soru.id,
      category: soru.kategori,
      selected_text: s.metin,
      effects: {
        nakit: s.nakit,
        sabir: s.sabir,
        mutluluk: s.mutluluk,
        risk: s.risk ?? 1,
      },
    }
    const yeniCevaplar = [...cevaplarRef.current, yeniCevap]
    cevaplarRef.current = yeniCevaplar

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
        answers: yeniCevaplar,
      })
    } else {
      setSoruIndex((oncekiIndex) => oncekiIndex + 1)
      setSecim(null)
    }
  }

  return (
    <>
      <button
        onClick={() => onBitis({
          nakit: 250000,
          sabir: 60,
          mutluluk: 60,
          yillikGelir: 300000,
          answers: [],
        })}
        className="dev-skip"
      >
        [geliştirme] introyu atla
      </button>

      <main className="intro-shell intro-command">
        <section className="intro-card mission-board">
          <aside className="mission-map-panel">
            <div className="mission-chapter">
              <strong>Bölüm {soruIndex + 1} / {SORULAR.length}</strong>
              <div className="quest-map" aria-label={`Bölüm ${soruIndex + 1}/${SORULAR.length}`}>
                {SORULAR.map((_, i) => (
                  <span key={i} className={i <= soruIndex ? "done" : ""} />
                ))}
              </div>
            </div>
            <div className="mission-nodes">
              {SORULAR.map((gorev, i) => (
                <button key={gorev.kategori} className={i === soruIndex ? "current" : i < soruIndex ? "done" : "locked"} type="button">
                  <i>{i < soruIndex ? "✓" : i === soruIndex ? "●" : "⌁"}</i>
                  <span>{gorev.kategori}</span>
                </button>
              ))}
            </div>
            <div className="active-quest">
              <span>Aktif Görev</span>
              <strong>{soru.soru}</strong>
            </div>
          </aside>

          <section className="mission-main">
            <div className="intro-stats">
              <Stat icon="TL" label="Nakit" value={`₺${(nakit / 1000).toFixed(0)}k`} />
              <Stat icon="SP" label="Sabır" value={sabir} />
              <Stat icon="HP" label="Mutluluk" value={mutluluk} />
            </div>

            <div className="question-block">
              <span>Görev</span>
              <h2>{soru.soru}</h2>
              <p>Seçimin karakterini ve geleceğini etkileyecek.</p>
            </div>

            <div className="choice-list">
              {soru.secenekler.map((s, i) => {
                const kilitli = kilitliMi(s.kilit, nakit, sabir, mutluluk)
                const secili = secim === i

                return (
                  <button
                    className={`choice choice-${i + 1} ${secili ? "selected" : ""}`}
                    key={i}
                    onClick={() => !kilitli && setSecim(i)}
                    disabled={kilitli}
                  >
                    <span className="choice-symbol">{kilitli ? "⌁" : ["₺", "▣", "◆"][i] || "◇"}</span>
                    <span className="choice-title">{kilitli ? "Kilitli Karar" : s.metin}</span>
                    {s.gelir_aciklama && !kilitli && <small>{s.gelir_aciklama} maaş</small>}
                    {kilitli && s.kilit && <small>{kilitMetni(s.kilit)}</small>}
                    <span className="effect-list">
                      {s.nakit !== 0 && <Effect value={`Nakit ${s.nakit > 0 ? "+" : "-"}`} positive={s.nakit > 0} />}
                      {s.sabir !== 0 && <Effect value={`Sabır ${s.sabir > 0 ? "+" : "-"}`} positive={s.sabir > 0} />}
                      {s.mutluluk !== 0 && <Effect value={`Mutluluk ${s.mutluluk > 0 ? "+" : "-"}`} positive={s.mutluluk > 0} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <aside className="choice-result">
            <div className="result-frame">
              <span>Seçimin Sonucu</span>
              <strong>{seciliSecenek ? seciliSecenek.metin : "Henüz seçim yok"}</strong>
              <p>{seciliSecenek ? "Karar onaylanınca karakter istatistiklerine işlenecek." : "Seçimin sonrası burada görünecek."}</p>
            </div>
            <button className="primary-action confirm-action" onClick={devamEt} disabled={secim === null}>
              {soruIndex + 1 >= SORULAR.length ? "Oyunu Başlat" : "Kararı Onayla"}
            </button>
          </aside>
        </section>
      </main>
    </>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div>
      <i>{icon}</i>
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
