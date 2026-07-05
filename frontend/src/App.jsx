import { useState } from "react"
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

      // Gelir ve gider enflasyonla güncelle
      const yeniGelir = Math.round(yillikGelir * (1 + data.yil_sonucu.enflasyon / 100))
      const yeniGider = Math.round(yasamGideri * (1 + data.yil_sonucu.enflasyon / 100))
      setYillikGelir(yeniGelir)
      setYasamGideri(yeniGider)

      // Nakit güncelle
      let yeniNakit = nakit + yeniGelir - yeniGider
      if (data.yil_sonucu.redenominasyon) {
        yeniNakit = Math.round(yeniNakit / 1000)
        setYillikGelir(Math.round(yeniGelir / 1000))
        setYasamGideri(Math.round(yeniGider / 1000))
      }
      setNakit(yeniNakit)


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
  setNakit(sonuc.nakit)
  setYillikGelir(sonuc.yillikGelir)
  setIntroTamamlandi(true)
}  

  const krizMi = gameState.enf_rejim === 1
  if (!introTamamlandi) {
  return <IntroEkrani onBitis={introyuBitir} />
}
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, fontFamily: "monospace", background: "#0d0f12", minHeight: "100vh", color: "#e8eaf0" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{yas} yaş</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{yil} · FinSim</div>
        </div>
        <div style={{ 
          padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600,
          background: krizMi ? "#7f1d1d" : "#14532d",
          color: krizMi ? "#fca5a5" : "#86efac"
        }}>
          {krizMi ? "🔴 KRİZ" : "🟢 Sakin"}
        </div>
      </div>
      
        {/* Barlar */}
  <div style={{ background: "#141720", borderRadius: 12, padding: 16, marginBottom: 16 }}>
    <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Durum</div>
    
    <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "#60a8f0" }}>🧘 Sabır</span>
      <span style={{ color: "#6b7280" }}>{bars.sabir}/100</span>
    </div>
    <div style={{ height: 8, background: "#1c2030", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${bars.sabir}%`, background: "#2060c0", borderRadius: 4, transition: "width 0.3s" }} />
    </div>

    <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: "#f07080" }}>😊 Mutluluk</span>
      <span style={{ color: "#6b7280" }}>{bars.mutluluk}/100</span>
    </div>
    <div style={{ height: 8, background: "#1c2030", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${bars.mutluluk}%`, background: "#c03050", borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  </div>

  {/* Nakit */}
  <div style={{ background: "#141720", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div>
      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Nakit</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: "#f5c842" }}>₺{nakit.toLocaleString("tr-TR")}</div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Toplam Portföy</div>
      <div style={{ fontSize: 14, color: "#e8eaf0" }}>₺{nakit.toLocaleString("tr-TR")}</div>
      <div style={{ fontSize: 11, color: "#6b7280" }}>varlıklar yakında</div>
    </div>
  </div>

  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
  Yıllık gelir: ₺{yillikGelir.toLocaleString("tr-TR")}
  </div>
  <div style={{ fontSize: 11, color: "#6b7280" }}>
    Yaşam gideri: ₺{yasamGideri.toLocaleString("tr-TR")}
  </div>

      {/* Varlıklar */}
      <div style={{ background: "#141720", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Varlıklar</div>
        <Satir label="Enflasyon" value={sonuc ? `%${sonuc.enflasyon}` : "—"} color={krizMi ? "#f87171" : "#e8eaf0"} />
        <Satir label="Kur" value={`${gameState.kur} ₺/$`} />
        <Satir label="BIST" value={sonuc ? formatPct(sonuc.bist_pct) : "—"} color={sonuc ? pctColor(sonuc.bist_pct) : "#e8eaf0"} />
        <Satir label="Altın (TRY)" value={sonuc ? formatPct(sonuc.altin_try_getiri) : "—"} color={sonuc ? pctColor(sonuc.altin_try_getiri) : "#e8eaf0"} />
        <Satir label="Mevduat" value={sonuc ? `%${sonuc.mev_faiz}` : "—"} />
        <Satir label="Döviz" value={sonuc ? formatPct(sonuc.doviz_degisim) : "—"} color={sonuc ? pctColor(sonuc.doviz_degisim) : "#e8eaf0"} />
      </div>

      {/* Son olay */}
      {sonuc && (
        <div style={{ background: "#1c2030", borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: `3px solid ${krizMi ? "#ef4444" : "#22c55e"}` }}>
          <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Bu yılın özeti</div>
          <div style={{ fontSize: 13, color: "#c8d0e0", lineHeight: 1.6 }}>
            Enflasyon <b style={{ color: krizMi ? "#f87171" : "#86efac" }}>%{sonuc.enflasyon}</b> olarak gerçekleşti.
            Borsa bu yıl <b style={{ color: pctColor(sonuc.bist_pct) }}>{formatPct(sonuc.bist_pct)}</b> getiri sağladı
            {" "}(reel: <b style={{ color: pctColor(sonuc.reel_bist) }}>{formatPct(sonuc.reel_bist)}</b>).
            Altın <b style={{ color: pctColor(sonuc.altin_try_getiri) }}>{formatPct(sonuc.altin_try_getiri)}</b> değer {sonuc.altin_try_getiri >= 0 ? "kazandı" : "kaybetti"}.
          </div>
          {sonuc.redenominasyon && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#7c3aed22", border: "1px solid #7c3aed", borderRadius: 8, fontSize: 12, color: "#c4b5fd" }}>
              ⚡ {sonuc.redenominasyon} — Para birimi yenilendi!
            </div>
          )}
        </div>
      )}

      {/* Yıl atla butonu */}
      <button
        onClick={yilAtla}
        disabled={loading}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12,
          background: loading ? "#374151" : "#f5c842",
          color: loading ? "#9ca3af" : "#1a1200",
          fontWeight: 700, fontSize: 16, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 16,
        }}
      >
        {loading ? "Hesaplanıyor..." : `${yil + 1}'e atla →`}
      </button>

      {/* Geçmiş */}
      {gecmis.length > 0 && (
        <div style={{ background: "#141720", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Geçmiş</div>
          {[...gecmis].reverse().slice(0, 5).map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1c2030", fontSize: 12 }}>
              <span style={{ color: "#6b7280" }}>{g.yil} · {g.yas} yaş</span>
              <span>Enf <b style={{ color: "#f87171" }}>%{g.enflasyon}</b></span>
              <span>BIST <b style={{ color: pctColor(g.bist_pct) }}>{formatPct(g.bist_pct)}</b></span>
              <span>Altın <b style={{ color: pctColor(g.altin_try_getiri) }}>{formatPct(g.altin_try_getiri)}</b></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Satir({ label, value, color = "#e8eaf0" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1c2030", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ color, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function formatPct(val) {
  return val >= 0 ? `+%${Math.abs(val).toFixed(1)}` : `-%${Math.abs(val).toFixed(1)}`
}

function pctColor(val) {
  return val >= 0 ? "#34d399" : "#f87171"
}