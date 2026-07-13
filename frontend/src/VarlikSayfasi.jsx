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
    <article className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
      <div className="flex justify-between items-start border-b border-outline-variant pb-2 mb-4">
        <div>
          <div className="font-headline-md text-headline-md text-on-surface uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{varlik === "altin" ? "diamond" : varlik === "bist" ? "candlestick_chart" : varlik === "dolar" ? "attach_money" : "account_balance"}</span>
            {cfg.ad}
          </div>
          <div className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">
            {cfg.sinif} · {cfg.birim}
          </div>
        </div>
        {sonFiyat && (
          <div className="text-right">
            <div className="font-data-lg text-data-lg text-primary">
              {varlik === "mevduat" ? `%${sonFiyat.toFixed(1)}` : `₺${Math.round(sonFiyat).toLocaleString("tr-TR")}`}
            </div>
            {getiri !== null && (
              <div className={`font-data-sm text-data-sm uppercase mt-1 ${getiri >= 0 ? "text-[#34d399]" : "text-error"}`}>
                {getiri >= 0 ? "+" : ""}{getiri.toFixed(1)}%
                {reel !== null && <span className="ml-2 opacity-80">(REEL {reel >= 0 ? "+" : ""}{reel.toFixed(1)}%)</span>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[120px] bg-surface-dim border border-outline-variant relative mb-4 p-2 flex items-center justify-center">
        {gecmis.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gecmis}>
              <XAxis dataKey="yil" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: "#110e06", border: "1px solid #4e4634", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 }}
                itemStyle={{ color: cfg.renk }}
                formatter={(v) => varlik === "mevduat" ? `%${v.toFixed(1)}` : `₺${Math.round(v).toLocaleString("tr-TR")}`}
                labelStyle={{ display: 'none' }}
              />
              <Line
                type="step"
                dataKey="fiyat"
                stroke={cfg.renk}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: cfg.renk }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50">
            YETERSİZ VERİ
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {portfoyMiktar > 0 && (
          <>
            <Satir label="PORTFÖY" value={
              varlik === "altin" ? `${portfoyMiktar.toFixed(2)} gr` :
              varlik === "bist" ? `${Math.round(portfoyMiktar)} adet` :
              varlik === "dolar" ? `$${Math.round(portfoyMiktar).toLocaleString("tr-TR")}` :
              `₺${Math.round(portfoyMiktar).toLocaleString("tr-TR")}`
            } />
            <Satir label="DEĞER" value={`₺${Math.round(portfoyDeger).toLocaleString("tr-TR")}`} color="#f5c842" />
          </>
        )}
        {portfoyMiktar === 0 && <Satir label="PORTFÖY" value="0.00" />}
      </div>

      <AlSatPanel varlik={varlik} onAl={onAl} onSat={onSat} />
    </article>
  )
}

function Satir({ label, value, color }) {
  return (
    <div className="flex justify-between items-center font-data-sm text-data-sm uppercase border-b border-outline-variant pb-1">
      <span className="text-on-surface-variant">{label}</span>
      <span className={color ? "" : "text-on-surface"} style={color ? { color } : {}}>{value}</span>
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
    <div className="mt-auto pt-4 border-t border-outline-variant">
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        className="w-full bg-surface-variant text-on-surface font-data-sm text-data-sm uppercase py-2 border border-outline hover:border-primary transition-colors"
      >
        {acik ? "TERMİNALİ KAPAT" : "AL/SAT TERMİNALİ"}
      </button>
      {acik && (
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            value={girdi}
            onChange={e => setGirdi(e.target.value)}
            placeholder="MİKTAR"
            className="flex-1 bg-surface-container-lowest border border-outline text-on-surface font-data-sm p-2 focus:border-primary focus:outline-none placeholder-on-surface-variant"
          />
          <button type="button" className="bg-[#34d399] text-black font-data-sm px-4 font-bold disabled:opacity-50" disabled={!miktarGecerli} onClick={al}>AL</button>
          <button type="button" className="bg-error text-background font-data-sm px-4 font-bold disabled:opacity-50" disabled={!miktarGecerli} onClick={sat}>SAT</button>
        </div>
      )}
    </div>
  )
}

export default function VarlikSayfasi({ fiyatGecmisi, fiyatlar, portfoy, sonuc, varlikAl, varlikSat, nakit, toplamDeger, krizMi }) {
  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="border-b border-outline-variant pb-stack-md">
        <h1 className="font-headline-lg text-headline-lg text-primary uppercase">Piyasa Verileri</h1>
        <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Canlı Varlık Takip Sistemi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <BilgiKarti label="Portföy Değeri" value={money(toplamDeger)} hint="Net Servet" />
        <BilgiKarti label="Nakit Rezervi" value={money(nakit)} hint="Kullanılabilir Nakit" />
        <BilgiKarti
          label="Enflasyon"
          value={sonuc ? `%${sonuc.enflasyon}` : "—"}
          hint={sonuc ? sonuc.enf_durum : "SİSTEM_HAZIR"}
          alert={krizMi}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
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
    </div>
  )
}

function BilgiKarti({ label, value, hint, alert }) {
  return (
    <div className={`border card-shadow p-stack-md flex flex-col ${alert ? "bg-error-container border-error" : "bg-surface-container border-outline"}`}>
      <div className={`font-data-sm text-data-sm uppercase mb-1 ${alert ? "text-on-error-container" : "text-on-surface-variant"}`}>
        {label}
      </div>
      <div className={`font-data-lg text-data-lg mb-2 ${alert ? "text-error" : "text-primary"}`}>
        {value}
      </div>
      <div className={`font-data-sm text-data-sm uppercase mt-auto ${alert ? "text-on-error-container opacity-80" : "text-on-surface-variant opacity-50"}`}>
        {hint}
      </div>
    </div>
  )
}

function money(value) {
  if (value === undefined || value === null) return "₺0";
  return `₺${Number(value).toLocaleString("tr-TR")}`
}
