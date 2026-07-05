import IntroEkrani from "./IntroEkrani"
import { YASAM_GIDERI } from "./data/sorular"
import { useState, useRef } from "react"


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
  const [portfoy, setPortfoy] = useState({
  altin_gram: 0,
  bist_adet: 0,
  dolar: 0,
  mevduat_tl: 0,
  })
const [fiyatlar, setFiyatlar] = useState({
  altin_try_gram: 2600 * 40 / 31.1,
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

      // Gelir ve gider enflasyonla güncelle
      const yeniGelir = Math.round(yillikGelir * (1 + data.yil_sonucu.enflasyon / 100))
      const yeniGider = Math.round(yasamGideri * (1 + data.yil_sonucu.enflasyon / 100))
      setYillikGelir(yeniGelir)
      setYasamGideri(yeniGider)

      // Nakit güncelle
      let yeniNakit = nakitRef.current + yeniGelir - yeniGider
      if (data.yil_sonucu.redenominasyon) {
        yeniNakit = Math.round(yeniNakit / 1000)
        setYillikGelir(Math.round(yeniGelir / 1000))
        setYasamGideri(Math.round(yeniGider / 1000))
      }
      nakitiGuncelle(yeniNakit)

      // Fiyatları güncelle
      if (data.yil_sonucu.fiyatlar) {
        setFiyatlar(data.yil_sonucu.fiyatlar)
      }

      // Mevduat faiz işle
      setPortfoy(prev => ({
        ...prev,
        mevduat_tl: Math.round(prev.mevduat_tl * (1 + data.yil_sonucu.mev_faiz / 100))
      }))

      // Redenominasyon — portföyü de etkile
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
  nakitiGuncelle(sonuc.nakit)  // setNakit yerine bunu kullan
  setYillikGelir(sonuc.yillikGelir)
  setIntroTamamlandi(true)
}

  function varlikAl(varlik, miktar) {
  const miktarSayi = parseFloat(miktar)
  if (!miktarSayi || miktarSayi <= 0) return

  let maliyet = 0
  if (varlik === "altin")   maliyet = miktarSayi * fiyatlar.altin_try_gram
  if (varlik === "bist")    maliyet = miktarSayi * fiyatlar.bist_endeks
  if (varlik === "dolar")   maliyet = miktarSayi * fiyatlar.dolar_try
  if (varlik === "mevduat") maliyet = miktarSayi

  if (maliyet > nakitRef.current) {
    alert("Yeterli nakit yok!")
    return
  }

  nakitiGuncelle(Math.round(nakitRef.current - maliyet))
  setPortfoy(prev => ({
    ...prev,
    altin_gram:  varlik === "altin"   ? prev.altin_gram + miktarSayi : prev.altin_gram,
    bist_adet:   varlik === "bist"    ? prev.bist_adet + miktarSayi  : prev.bist_adet,
    dolar:       varlik === "dolar"   ? prev.dolar + miktarSayi      : prev.dolar,
    mevduat_tl:  varlik === "mevduat" ? prev.mevduat_tl + miktarSayi : prev.mevduat_tl,
  }))
}

function varlikSat(varlik, miktar) {
  const miktarSayi = parseFloat(miktar)
  if (!miktarSayi || miktarSayi <= 0) return

  let gelir = 0
  if (varlik === "altin"   && portfoy.altin_gram >= miktarSayi)  gelir = miktarSayi * fiyatlar.altin_try_gram
  if (varlik === "bist"    && portfoy.bist_adet >= miktarSayi)   gelir = miktarSayi * fiyatlar.bist_endeks
  if (varlik === "dolar"   && portfoy.dolar >= miktarSayi)       gelir = miktarSayi * fiyatlar.dolar_try
  if (varlik === "mevduat" && portfoy.mevduat_tl >= miktarSayi)  gelir = miktarSayi

  if (gelir === 0) {
    alert("Yeterli varlık yok!")
    return
  }

  nakitiGuncelle(Math.round(nakitRef.current + gelir))
  setPortfoy(prev => ({
    ...prev,
    altin_gram:  varlik === "altin"   ? prev.altin_gram - miktarSayi : prev.altin_gram,
    bist_adet:   varlik === "bist"    ? prev.bist_adet - miktarSayi  : prev.bist_adet,
    dolar:       varlik === "dolar"   ? prev.dolar - miktarSayi      : prev.dolar,
    mevduat_tl:  varlik === "mevduat" ? prev.mevduat_tl - miktarSayi : prev.mevduat_tl,
  }))
}


  const portfoyDegeri = Math.round(
  portfoy.altin_gram * fiyatlar.altin_try_gram +
  portfoy.bist_adet * fiyatlar.bist_endeks +
  portfoy.dolar * fiyatlar.dolar_try +
  portfoy.mevduat_tl
  )
  const toplamDeger = nakit + portfoyDegeri



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
      <div style={{ fontSize: 14, color: "#e8eaf0" }}>₺{toplamDeger.toLocaleString("tr-TR")}</div>
      <div style={{ fontSize: 11, color: "#6b7280" }}></div>
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
      <Satir label="Kur" value={`${fiyatlar.dolar_try.toFixed(2)} ₺/$`} />
      
      <VarlikSatir
        label="🥇 Altın"
        fiyat={`₺${Math.round(fiyatlar.altin_try_gram).toLocaleString("tr-TR")}/gr`}
        miktar={`${portfoy.altin_gram.toFixed(2)} gr`}
        deger={Math.round(portfoy.altin_gram * fiyatlar.altin_try_gram)}
        getiri={sonuc ? sonuc.altin_try_getiri : null}
        varlik="altin"
        onAl={varlikAl}
        onSat={varlikSat}
      />
      
      <VarlikSatir
        label="📈 BIST"
        fiyat={`${Math.round(fiyatlar.bist_endeks).toLocaleString("tr-TR")} endeks`}
        miktar={`${portfoy.bist_adet.toFixed(0)} adet`}
        deger={Math.round(portfoy.bist_adet * fiyatlar.bist_endeks)}
        getiri={sonuc ? sonuc.bist_pct : null}
        varlik="bist"
        onAl={varlikAl}
        onSat={varlikSat}
      />

      <VarlikSatir
        label="💵 Dolar"
        fiyat={`₺${fiyatlar.dolar_try.toFixed(2)}/$`}
        miktar={`$${portfoy.dolar.toFixed(0)}`}
        deger={Math.round(portfoy.dolar * fiyatlar.dolar_try)}
        getiri={sonuc ? sonuc.doviz_degisim : null}
        varlik="dolar"
        onAl={varlikAl}
        onSat={varlikSat}
      />

      <VarlikSatir
        label="🏦 Mevduat"
        fiyat={`%${(fiyatlar.mev_faiz_oran * 100).toFixed(1)} faiz`}
        miktar={`₺${Math.round(portfoy.mevduat_tl).toLocaleString("tr-TR")}`}
        deger={portfoy.mevduat_tl}
        getiri={sonuc ? sonuc.mev_faiz : null}
        varlik="mevduat"
        onAl={varlikAl}
        onSat={varlikSat}
      />
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
function VarlikSatir({ label, fiyat, miktar, deger, getiri, varlik, onAl, onSat }) {
  const [acik, setAcik] = useState(false)
  const [girdi, setGirdi] = useState("")

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
    <div style={{ borderBottom: "1px solid #1c2030", paddingBottom: 8, marginBottom: 8 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
        onClick={() => setAcik(!acik)}
      >
        <div>
          <div style={{ fontSize: 13, color: "#e8eaf0", fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{fiyat} · {miktar}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {deger > 0 && <div style={{ fontSize: 13, color: "#e8eaf0" }}>₺{deger.toLocaleString("tr-TR")}</div>}
          {getiri !== null && (
            <div style={{ fontSize: 11, color: getiri >= 0 ? "#34d399" : "#f87171" }}>
              {getiri >= 0 ? "+" : ""}{getiri.toFixed(1)}%
            </div>
          )}
          <div style={{ fontSize: 10, color: "#4b5563" }}>{acik ? "▲" : "▼"}</div>
        </div>
      </div>

      {acik && (
        <div style={{ padding: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            value={girdi}
            onChange={e => setGirdi(e.target.value)}
            placeholder={varlik === "mevduat" ? "₺ miktar" : "miktar"}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              background: "#0d0f12", border: "1px solid #2a2f42",
              color: "#e8eaf0", fontSize: 13, fontFamily: "monospace"
            }}
          />
          <button onClick={al} style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: "#14532d", color: "#86efac", fontSize: 12,
            fontWeight: 600, cursor: "pointer"
          }}>AL</button>
          <button onClick={sat} style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: "#7f1d1d", color: "#fca5a5", fontSize: 12,
            fontWeight: 600, cursor: "pointer"
          }}>SAT</button>
        </div>
      )}
    </div>
  )
}

