import { useState } from "react"
import { SORULAR, BASLANGIC } from "./data/sorular"

function kilitliMi(kilit, nakit, sabir, mutluluk) {
  if (!kilit) return false
  if (kilit.tur === "nakit")    return nakit < kilit.min
  if (kilit.tur === "sabir")    return sabir < kilit.min
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
  const ilerleme = ((soruIndex) / SORULAR.length) * 100

  function devamEt() {
    if (secim === null) return
    const s = soru.secenekler[secim]

    const yeniNakit  = Math.max(20000, nakit + s.nakit)
    const yeniSabir  = Math.min(80, Math.max(20, sabir + s.sabir))
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
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, fontFamily: "monospace", background: "#0d0f12", minHeight: "100vh", color: "#e8eaf0" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Hikayen Başlıyor · {soruIndex + 1} / {SORULAR.length}
        </div>
        <div style={{ height: 4, background: "#1c2030", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${ilerleme}%`, background: "#f5c842", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Anlık değerler */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Chip label="💰" value={`₺${(nakit/1000).toFixed(0)}k`} color="#f5c842" />
        <Chip label="🧘" value={`${sabir}`} color="#60a8f0" />
        <Chip label="😊" value={`${mutluluk}`} color="#f07080" />
      </div>

      {/* Kategori + Soru */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: "#f5c842", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          GEÇMİŞİN · {soru.kategori.toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4, color: "#e8eaf0" }}>
          {soru.soru}
        </div>
      </div>

      {/* Seçenekler */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {soru.secenekler.map((s, i) => {
          const kilitli = kilitliMi(s.kilit, nakit, sabir, mutluluk)
          const secili = secim === i

          return (
            <button
              key={i}
              onClick={() => !kilitli && setSecim(i)}
              disabled={kilitli}
              style={{
                background: secili ? "#1a2a1a" : kilitli ? "#111318" : "#141720",
                border: `1px solid ${secili ? "#3a7a3a" : kilitli ? "#1c2030" : "#2a2f42"}`,
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "left",
                cursor: kilitli ? "not-allowed" : "pointer",
                color: kilitli ? "#374151" : "#e8eaf0",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: s.gelir_aciklama ? 6 : 0 }}>
                {kilitli ? "🔒 " : ""}{s.metin}
              </div>

              {/* Gelir açıklaması */}
              {s.gelir_aciklama && !kilitli && (
                <div style={{ fontSize: 12, color: "#34d399" }}>
                  {s.gelir_aciklama} maaş
                </div>
              )}

              {/* Kilit sebebi */}
              {kilitli && s.kilit && (
                <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>
                  {s.kilit.tur === "nakit" && `₺${(s.kilit.min/1000).toFixed(0)}k nakit gerekiyor`}
                  {s.kilit.tur === "sabir" && `${s.kilit.min} sabır gerekiyor`}
                  {s.kilit.tur === "mutluluk" && `${s.kilit.min} mutluluk gerekiyor`}
                </div>
              )}

              {/* Seçilince etkileri göster */}
              {secili && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {s.nakit !== 0 && <Etiket label={`₺${s.nakit > 0 ? "+" : ""}${(s.nakit/1000).toFixed(0)}k`} pozitif={s.nakit > 0} />}
                  {s.sabir !== 0 && <Etiket label={`Sabır ${s.sabir > 0 ? "+" : ""}${s.sabir}`} pozitif={s.sabir > 0} />}
                  {s.mutluluk !== 0 && <Etiket label={`Mutluluk ${s.mutluluk > 0 ? "+" : ""}${s.mutluluk}`} pozitif={s.mutluluk > 0} />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* İleri butonu */}
      <button
        onClick={devamEt}
        disabled={secim === null}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12,
          background: secim !== null ? "#f5c842" : "#1c2030",
          color: secim !== null ? "#1a1200" : "#374151",
          fontWeight: 700, fontSize: 16, border: "none",
          cursor: secim !== null ? "pointer" : "not-allowed",
        }}
      >
        {soruIndex + 1 >= SORULAR.length ? "Oyunu Başlat →" : "İleri →"}
      </button>
    </div>
  )
}

function Chip({ label, value, color }) {
  return (
    <div style={{ background: "#141720", border: "1px solid #2a2f42", borderRadius: 8, padding: "6px 12px", fontSize: 13, color }}>
      {label} {value}
    </div>
  )
}

function Etiket({ label, pozitif }) {
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4,
      background: pozitif ? "#14532d" : "#7f1d1d",
      color: pozitif ? "#86efac" : "#fca5a5",
    }}>
      {label}
    </span>
  )
}