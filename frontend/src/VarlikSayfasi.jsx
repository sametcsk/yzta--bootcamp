import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"
const VARLIK_CONFIG = {
  altin: { ad: "Altın", icon: "Au", renk: "#f5c842", birim: "₺/gr" },
  bist:  { ad: "BIST",  icon: "BI", renk: "#34d399", birim: "endeks" },
  dolar: { ad: "Dolar", icon: "$",  renk: "#60a8f0", birim: "₺/$" },
  mevduat: { ad: "Mevduat", icon: "%", renk: "#a78bfa", birim: "% faiz" },
}

function VarlikKart({ varlik, fiyatGecmisi, fiyatlar, portfoy, sonuc, onAl, onSat }) {
  const cfg = VARLIK_CONFIG[varlik]
  const gecmis = fiyatGecmisi[varlik] || []
  const sonFiyat = gecmis.length > 0 ? gecmis[gecmis.length - 1].fiyat : null

  const portfoyMiktar = {
    altin: portfoy.altin_gram,
    bist: portfoy.bist_adet,
    dolar: portfoy.dolar,
    mevduat: portfoy.mevduat_tl,
  }[varlik]

  const portfoyDeger = {
    altin: portfoy.altin_gram * fiyatlar.altin_try_gram,
    bist: portfoy.bist_adet * fiyatlar.bist_endeks,
    dolar: portfoy.dolar * fiyatlar.dolar_try,
    mevduat: portfoy.mevduat_tl,
  }[varlik]

  const getiri = sonuc ? {
    altin: sonuc.altin_try_getiri,
    bist: sonuc.bist_pct,
    dolar: sonuc.doviz_degisim,
    mevduat: sonuc.mev_faiz,
  }[varlik] : null

  const reel = sonuc ? {
    altin: sonuc.reel_altin,
    bist: sonuc.reel_bist,
    dolar: sonuc.reel_doviz,
    mevduat: sonuc.reel_mevduat,
  }[varlik] : null

  return (
    <div style={{
      background: "#141720",
      border: "1px solid #2a2f42",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    }}>
      {/* Başlık */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: cfg.renk + "22",
            border: `1px solid ${cfg.renk}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: cfg.renk,
          }}>
            {cfg.icon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#e8eaf0" }}>{cfg.ad}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{cfg.birim}</div>
          </div>
        </div>
        {sonFiyat && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#e8eaf0" }}>
              {varlik === "mevduat" ? `%${sonFiyat.toFixed(1)}` : `₺${Math.round(sonFiyat).toLocaleString("tr-TR")}`}
            </div>
            {getiri !== null && (
              <div style={{ fontSize: 12, color: getiri >= 0 ? "#34d399" : "#f87171" }}>
                {getiri >= 0 ? "+" : ""}{getiri.toFixed(1)}%
                {reel !== null && (
                  <span style={{ color: "#6b7280", marginLeft: 6 }}>
                    reel {reel >= 0 ? "+" : ""}{reel.toFixed(1)}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grafik */}
      {gecmis.length > 1 ? (
        <div style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={gecmis}>
              <XAxis
                dataKey="yil"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#1c2030", border: "1px solid #2a2f42", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#6b7280" }}
                itemStyle={{ color: cfg.renk }}
                formatter={(v) => varlik === "mevduat" ? `%${v.toFixed(1)}` : `₺${Math.round(v).toLocaleString("tr-TR")}`}
              />
              <Line
                type="monotone"
                dataKey="fiyat"
                stroke={cfg.renk}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: cfg.renk }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 13, marginBottom: 16 }}>
          Grafik için yıl atla
        </div>
      )}

      {/* Tablo */}
      <div style={{ borderTop: "1px solid #1c2030", paddingTop: 12 }}>
        {portfoyMiktar > 0 && (
          <>
            <Satir label="Portföyde" value={
              varlik === "altin" ? `${portfoyMiktar.toFixed(2)} gr` :
              varlik === "bist" ? `${Math.round(portfoyMiktar)} adet` :
              varlik === "dolar" ? `$${Math.round(portfoyMiktar).toLocaleString("tr-TR")}` :
              `₺${Math.round(portfoyMiktar).toLocaleString("tr-TR")}`
            } />
            <Satir label="Değer" value={`₺${Math.round(portfoyDeger).toLocaleString("tr-TR")}`} color="#f5c842" />
          </>
        )}
        {getiri !== null && <Satir label="Bu yıl getiri" value={`${getiri >= 0 ? "+" : ""}${getiri.toFixed(1)}%`} color={getiri >= 0 ? "#34d399" : "#f87171"} />}
        {reel !== null && <Satir label="Reel getiri" value={`${reel >= 0 ? "+" : ""}${reel.toFixed(1)}%`} color={reel >= 0 ? "#34d399" : "#f87171"} />}
      </div>

      {/* Al/Sat */}
      <AlSatPanel varlik={varlik} onAl={onAl} onSat={onSat} />
    </div>
  )
}

function Satir({ label, value, color = "#b0b8cc" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ color, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function AlSatPanel({ varlik, onAl, onSat }) {
  const [girdi, setGirdi] = useState("")
  const [acik, setAcik] = useState(false)

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setAcik(!acik)}
        style={{
          width: "100%", padding: "8px 0", borderRadius: 8,
          background: "transparent", border: "1px solid #2a2f42",
          color: "#6b7280", fontSize: 12, cursor: "pointer",
        }}
      >
        {acik ? "Kapat" : "Al / Sat"}
      </button>
      {acik && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="number"
            value={girdi}
            onChange={e => setGirdi(e.target.value)}
            placeholder="miktar"
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              background: "#0d0f12", border: "1px solid #2a2f42",
              color: "#e8eaf0", fontSize: 13,
            }}
          />
          <button onClick={() => { onAl(varlik, girdi); setGirdi("") }} style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: "#14532d", color: "#86efac", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>AL</button>
          <button onClick={() => { onSat(varlik, girdi); setGirdi("") }} style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: "#7f1d1d", color: "#fca5a5", fontSize: 12, fontWeight: 600, cursor: "pointer"
          }}>SAT</button>
        </div>
      )}
    </div>
  )
}

export default function VarlikSayfasi({ fiyatGecmisi, fiyatlar, portfoy, sonuc, varlikAl, varlikSat }) {
  return (
    <div style={{ padding: "0 0 80px" }}>
      {["altin", "bist", "dolar", "mevduat"].map(varlik => (
        <VarlikKart
          key={varlik}
          varlik={varlik}
          fiyatGecmisi={fiyatGecmisi}
          fiyatlar={fiyatlar}
          portfoy={portfoy}
          sonuc={sonuc}
          onAl={varlikAl}
          onSat={varlikSat}
        />
      ))}
    </div>
  )
}