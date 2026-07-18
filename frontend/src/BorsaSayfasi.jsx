import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"

const SEKTOR_CONFIG = {
  bankacilik: { ad: "Bankacılık Endeksi", icon: "account_balance", renk: "#60a8f0", key: "bist_bankacilik" },
  teknoloji:  { ad: "Teknoloji Endeksi", icon: "computer", renk: "#a78bfa", key: "bist_teknoloji" },
  insaat:     { ad: "İnşaat Endeksi", icon: "construction", renk: "#f5c842", key: "bist_insaat" },
  saglik:     { ad: "Sağlık Endeksi", icon: "medical_services", renk: "#ef4444", key: "bist_saglik" },
  perakende:  { ad: "Perakende Endeksi", icon: "storefront", renk: "#34d399", key: "bist_perakende" },
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

function BorsaKart({ 
  varlikKey, ad, icon, renk, fiyatGecmisi, fiyatlar, portfoy, sonuc, onAl, onSat, nakit, genis
}) {
  const gecmis = fiyatGecmisi[varlikKey] || []
  const sonFiyat = gecmis.length > 0 ? gecmis[gecmis.length - 1].fiyat : null

  const miktarKey = varlikKey === "bist" ? "bist_adet" : `${varlikKey}_adet`
  const portfoyMiktar = portfoy[miktarKey] || 0

  const anlikFiyat = fiyatlar[varlikKey === "bist" ? "bist_endeks" : varlikKey]
  const portfoyDeger = portfoyMiktar * anlikFiyat

  let getiri = null
  let reel = null
  if (sonuc) {
    if (varlikKey === "bist") {
      getiri = sonuc.bist_pct
      reel = sonuc.reel_bist
    } else if (sonuc.sektor_getirileri) {
      const sektorKisaAd = varlikKey.replace("bist_", "")
      getiri = sonuc.sektor_getirileri[sektorKisaAd]
      reel = getiri - sonuc.enflasyon
    }
  }

  const maxAlinabilir = Math.floor((nakit || 0) / (anlikFiyat || 1))

  return (
    <article className={`bg-surface-container border border-outline card-shadow p-stack-md flex flex-col ${genis ? "col-span-full" : ""}`}>
      <div className="flex justify-between items-start border-b border-outline-variant pb-2 mb-4">
        <div>
          <div className="font-headline-md text-headline-md text-on-surface uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{icon}</span>
            {ad}
          </div>
          <div className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">
            {varlikKey === "bist" ? "Ana Endeks" : "Sektörel Endeks"} · endeks
          </div>
        </div>
        {sonFiyat !== null && (
          <div className="text-right">
            <div className="font-data-lg text-data-lg text-primary">
              ₺{Math.round(sonFiyat).toLocaleString("tr-TR")}
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

      <div className={`flex-1 ${genis ? "min-h-[250px]" : "min-h-[120px]"} bg-surface-dim border border-outline-variant relative mb-4 p-2 flex items-center justify-center`}>
        {gecmis.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gecmis}>
              <XAxis dataKey="yil" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: "#110e06", border: "1px solid #4e4634", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 }}
                itemStyle={{ color: renk }}
                formatter={(v) => `₺${Math.round(v).toLocaleString("tr-TR")}`}
                labelStyle={{ display: 'none' }}
              />
              <Line
                type="step"
                dataKey="fiyat"
                stroke={renk}
                strokeWidth={genis ? 3 : 2}
                dot={false}
                activeDot={{ r: genis ? 6 : 4, fill: renk }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-on-surface-variant opacity-50 text-center p-4">
            <span className="material-symbols-outlined text-2xl mb-1">monitoring</span>
            <div className="font-data-sm text-data-sm uppercase">
              YETERSİZ VERİ
            </div>
            <div className="text-[10px] uppercase mt-1">
              (Grafikler 3. yıldan itibaren oluşur)
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {portfoyMiktar > 0 && (
          <>
            <Satir label="PORTFÖY" value={`${Math.round(portfoyMiktar)} adet`} />
            <Satir label="DEĞER" value={`₺${Math.round(portfoyDeger).toLocaleString("tr-TR")}`} color="#f5c842" />
          </>
        )}
        {portfoyMiktar === 0 && <Satir label="PORTFÖY" value="0.00" />}
        <div className="opacity-50 mt-1">
          <Satir label="ALINABİLİR" value={`${maxAlinabilir.toLocaleString("tr-TR")} adet`} color="inherit" />
        </div>
      </div>

      <AlSatPanel varlik={varlikKey} onAl={onAl} onSat={onSat} />
    </article>
  )
}

function OzetKart({ icon, label, value }) {
  return (
    <div className="bg-surface-container border border-outline card-shadow p-stack-sm flex items-center gap-3">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <div>
        <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">{label}</div>
        <div className="font-data-lg text-data-lg text-primary">{value}</div>
      </div>
    </div>
  )
}

export default function BorsaSayfasi({
  fiyatGecmisi, fiyatlar, portfoy, sonuc, varlikAl, varlikSat, nakit, toplamDeger, onGeri, onAcTutorial
}) {
  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="border-b border-outline-variant pb-stack-md flex justify-between items-center">
        <div>
          <button 
            onClick={onGeri} 
            className="flex items-center gap-2 font-data-sm text-data-sm uppercase text-on-surface-variant hover:text-primary transition-colors mb-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Piyasaya Geri Dön
          </button>
          <div className="flex items-center gap-4">
            <h1 className="font-headline-lg text-headline-lg text-primary uppercase flex items-center gap-2">
              Borsa İstanbul (BIST) & Sektörel Endeksler
            </h1>
            <button onClick={onAcTutorial} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">error</span>
            </button>
          </div>
          <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Genişletilmiş Borsa Ekranı</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <OzetKart icon="percent" label="Enflasyon Oranı" value={sonuc ? `%${sonuc.enflasyon.toFixed(1)}` : "—"} />
        <OzetKart icon="payments" label="Nakit" value={`₺${Math.round(nakit || 0).toLocaleString("tr-TR")}`} />
        <OzetKart icon="account_balance_wallet" label="Portföy Değeri" value={`₺${Math.round(toplamDeger || 0).toLocaleString("tr-TR")}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        <BorsaKart
          varlikKey="bist"
          ad="Borsa İstanbul (Genel)"
          icon="candlestick_chart"
          renk="#34d399"
          fiyatGecmisi={fiyatGecmisi}
          fiyatlar={fiyatlar}
          portfoy={portfoy}
          sonuc={sonuc}
          onAl={varlikAl}
          onSat={varlikSat}
          nakit={nakit}
          genis={true}
        />

        {Object.values(SEKTOR_CONFIG).map(cfg => (
          <BorsaKart
            key={cfg.key}
            varlikKey={cfg.key}
            ad={cfg.ad}
            icon={cfg.icon}
            renk={cfg.renk}
            fiyatGecmisi={fiyatGecmisi}
            fiyatlar={fiyatlar}
            portfoy={portfoy}
            sonuc={sonuc}
            onAl={varlikAl}
            onSat={varlikSat}
            nakit={nakit}
            genis={false}
          />
        ))}
      </div>
    </div>
  )
}
