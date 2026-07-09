import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"
const VARLIK_CONFIG = {
  altin: { ad: "Altın", icon: "Au", renk: "#f5c842", birim: "₺/gr", sinif: "Nadir Varlık", tone: "gold" },
  bist:  { ad: "BIST",  icon: "BI", renk: "#34d399", birim: "endeks", sinif: "Riskli Varlık", tone: "green" },
  dolar: { ad: "Dolar", icon: "$",  renk: "#60a8f0", birim: "₺/$", sinif: "Döviz", tone: "blue" },
  mevduat: { ad: "Mevduat", icon: "%", renk: "#a78bfa", birim: "% faiz", sinif: "Güvenli Alan", tone: "violet" },
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
    <article className={`vault-card ${cfg.tone}`}>
      <div className="vault-head">
        <div className="vault-title">
          <div className={`asset-icon ${cfg.tone}`}>{cfg.icon}</div>
          <div>
            <strong>{cfg.ad}</strong>
            <span>{cfg.sinif} · {cfg.birim}</span>
          </div>
        </div>
        {sonFiyat && (
          <div className="vault-price">
            <strong>
              {varlik === "mevduat" ? `%${sonFiyat.toFixed(1)}` : `₺${Math.round(sonFiyat).toLocaleString("tr-TR")}`}
            </strong>
            {getiri !== null && (
              <small className={getiri >= 0 ? "positive" : "negative"}>
                {getiri >= 0 ? "+" : ""}{getiri.toFixed(1)}%
                {reel !== null && (
                  <span>
                    reel {reel >= 0 ? "+" : ""}{reel.toFixed(1)}%
                  </span>
                )}
              </small>
            )}
          </div>
        )}
      </div>

      {gecmis.length > 1 ? (
        <div className="vault-chart">
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
        <div className="empty-chart">
          Grafik için yıl atla
        </div>
      )}

      <div className="vault-stats">
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

      <AlSatPanel varlik={varlik} onAl={onAl} onSat={onSat} />
    </article>
  )
}

function Satir({ label, value, color = "#b0b8cc" }) {
  return (
    <div className="vault-stat-row">
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  )
}

function AlSatPanel({ varlik, onAl, onSat }) {
  const [girdi, setGirdi] = useState("")
  const [acik, setAcik] = useState(false)
  const miktarGecerli = Number(girdi) > 0

  function al() {
    if (!miktarGecerli) return
    onAl(varlik, girdi)
    setGirdi("")
  }

  function sat() {
    if (!miktarGecerli) return
    onSat(varlik, girdi)
    setGirdi("")
  }

  return (
    <div className="trade-panel">
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        className="trade-toggle"
      >
        {acik ? "Kapat" : "Al / Sat"}
      </button>
      {acik && (
        <div className="trade-box vault-trade-box">
          <input
            type="number"
            min="0"
            step="any"
            value={girdi}
            onChange={e => setGirdi(e.target.value)}
            placeholder={varlik === "mevduat" ? "TL miktarı gir" : "Miktar gir"}
          />
          <button type="button" className="buy" disabled={!miktarGecerli} onClick={al}>AL</button>
          <button type="button" className="sell" disabled={!miktarGecerli} onClick={sat}>SAT</button>
        </div>
      )}
    </div>
  )
}

export default function VarlikSayfasi({ fiyatGecmisi, fiyatlar, portfoy, sonuc, varlikAl, varlikSat }) {
  return (
    <div className="subpage vault-grid">
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
