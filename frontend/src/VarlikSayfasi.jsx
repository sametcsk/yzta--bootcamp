import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"
import ucuzevImg from "./assets/evler/ucuzev.png"
import ortaevImg from "./assets/evler/ortaev.png"
import pahalievImg from "./assets/evler/pahaliev.png"

const GORSEL_MAP = { ucuzev: ucuzevImg, ortaev: ortaevImg, pahaliev: pahalievImg }
const SEGMENT_BILGI = {
  ucuz:   { ad: "Müstakil Ev" },
  orta:   { ad: "Apartman Dairesi" },
  pahali: { ad: "Villa" },
}
const VARLIK_CONFIG = {
  altin: { ad: "Altın", icon: "Au", renk: "#f5c842", birim: "₺/gr", sinif: "Nadir Varlık", tone: "gold" },
  bist:  { ad: "Borsa",  icon: "BI", renk: "#34d399", birim: "endeks", sinif: "Riskli Varlık", tone: "green" },
  dolar: { ad: "Dolar", icon: "$",  renk: "#60a8f0", birim: "₺/$", sinif: "Döviz", tone: "blue" },
  mevduat: { ad: "Mevduat", icon: "%", renk: "#a78bfa", birim: "% faiz", sinif: "Güvenli Alan", tone: "violet" },
}

function VarlikKart({ varlik, fiyatGecmisi, fiyatlar, portfoy, sonuc, onAl, onSat, nakit }) {
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

  const maxAlinabilir = Math.floor((nakit || 0) / (varlik === "altin" ? fiyatlar.altin_try_gram : varlik === "bist" ? fiyatlar.bist_endeks : varlik === "dolar" ? fiyatlar.dolar_try : 1))

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
        <div className="opacity-50 mt-1">
          <Satir label="ALINABİLİR" value={
            varlik === "altin" ? `${maxAlinabilir.toLocaleString("tr-TR")} gr` :
            varlik === "bist" ? `${maxAlinabilir.toLocaleString("tr-TR")} adet` :
            varlik === "dolar" ? `$${maxAlinabilir.toLocaleString("tr-TR")}` :
            `₺${maxAlinabilir.toLocaleString("tr-TR")}`
          } color="inherit" />
        </div>
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

function EmlakPiyasasiKart({ ev, nakit, onSatinAl }) {
  const alinabilir = nakit >= ev.fiyat_tl
  const bilgi = SEGMENT_BILGI[ev.segment]
  return (
    <article className="bg-surface-container border border-outline card-shadow flex flex-col overflow-hidden">
      <img src={GORSEL_MAP[ev.gorsel]} alt={bilgi.ad} className="w-full h-40 object-cover border-b border-outline-variant" />
      <div className="p-stack-sm flex flex-col gap-2 flex-1">
        <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">{bilgi.ad}</div>
        <div className="font-data-lg text-data-lg text-primary">₺{Math.round(ev.fiyat_tl).toLocaleString("tr-TR")}</div>
        <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">
          Tahmini Kira Getirisi: %{(ev.kira_orani * 100).toFixed(1)}
        </div>
        <button
          onClick={() => onSatinAl(ev)}
          disabled={!alinabilir}
          className="mt-auto bg-primary-container text-background font-data-sm text-data-sm uppercase py-2 border border-outline btn-shadow font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {alinabilir ? "Satın Al" : "Yetersiz Nakit"}
        </button>
      </div>
    </article>
  )
}

function SahipOlunanEvKart({ ev, guncelDeger, oturuluyorMu, onTikla }) {
  const bilgi = SEGMENT_BILGI[ev.segment]
  return (
    <button
      onClick={() => onTikla(ev)}
      className="bg-surface-container border border-outline card-shadow flex flex-col overflow-hidden text-left hover:border-primary transition-colors"
    >
      <img src={GORSEL_MAP[ev.gorsel]} alt={bilgi.ad} className="w-full h-32 object-cover border-b border-outline-variant" />
      <div className="p-stack-sm flex flex-col gap-1">
        <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">{bilgi.ad}</div>
        <div className="font-data-lg text-data-lg text-primary">₺{Math.round(guncelDeger).toLocaleString("tr-TR")}</div>
        <div className={`font-data-sm text-data-sm uppercase ${oturuluyorMu ? "text-[#60a8f0]" : ev.kirada ? "text-[#34d399]" : "text-on-surface-variant"}`}>
          {oturuluyorMu ? "OTURULUYOR" : ev.kirada ? "KİRADA" : "BOŞ"}
        </div>
      </div>
    </button>
  )
}

function EvIslemKutusu({ ev, guncelDeger, oturuluyorMu, onKapat, onKiraDegistir, onSat, onYasamayaBasla, onCik }) {
  const bilgi = SEGMENT_BILGI[ev.segment]
  const yillikKiraTutari = Math.round(ev.kira_orani * guncelDeger)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onKapat}>
      <div
        className="bg-surface-container border border-outline card-shadow max-w-md w-full p-stack-md flex flex-col gap-stack-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">{bilgi.ad}</h2>
          <button onClick={onKapat} className="material-symbols-outlined text-on-surface-variant">close</button>
        </div>

        <img src={GORSEL_MAP[ev.gorsel]} alt={bilgi.ad} className="w-full h-40 object-cover border border-outline-variant" />

        <div className="flex flex-col gap-2">
          <Satir label="GÜNCEL DEĞER" value={`₺${Math.round(guncelDeger).toLocaleString("tr-TR")}`} color="#f5c842" />
          <Satir label="ALIŞ FİYATI" value={`₺${Math.round(ev.alis_fiyati).toLocaleString("tr-TR")}`} />
          <Satir label="ALIŞ YILI" value={ev.alis_yili} />
          <Satir label="KİRA ORANI" value={`%${(ev.kira_orani * 100).toFixed(1)}`} />
          <Satir
            label="DURUM"
            value={oturuluyorMu ? "OTURULUYOR" : ev.kirada ? "KİRADA" : "BOŞ"}
            color={oturuluyorMu ? "#60a8f0" : ev.kirada ? "#34d399" : undefined}
          />
          {ev.kirada && <Satir label="YILLIK KİRA GELİRİ" value={`₺${yillikKiraTutari.toLocaleString("tr-TR")}`} color="#34d399" />}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => oturuluyorMu ? onCik() : onYasamayaBasla(ev.id)}
            className="bg-surface-variant text-on-surface font-data-sm text-data-sm uppercase py-2 border border-outline hover:border-primary transition-colors"
          >
            {oturuluyorMu ? "Çıkış Yap" : "Burada Yaşa"}
          </button>
          <button
            onClick={() => onKiraDegistir(ev.id)}
            disabled={oturuluyorMu}
            className="bg-surface-variant text-on-surface font-data-sm text-data-sm uppercase py-2 border border-outline hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ev.kirada ? "Kiracıyı Çıkart" : "Kiraya Ver"}
          </button>
          <button
            onClick={() => onSat(ev.id)}
            className="bg-error text-background font-data-sm text-data-sm uppercase py-2 border border-outline font-bold"
          >
            Evi Sat
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VarlikSayfasi({
  fiyatGecmisi, fiyatlar, portfoy, sonuc, varlikAl, varlikSat, nakit, toplamDeger,
  emlakPiyasasi, sahipOlunanEvler, evSatinAl, evKiraDurumunuDegistir, evSat, evGuncelDegerHesapla,
  oturulanEvId, evdeYasamayaBasla, evdenCik, emlakEndeksiGecmisi, onAcTutorial
}) {
  const [seciliEv, setSeciliEv] = useState(null)
  const [emlakGrafikAcik, setEmlakGrafikAcik] = useState(false)

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="border-b border-outline-variant pb-stack-md">
        <h1 className="font-headline-lg text-headline-lg text-primary uppercase flex items-center gap-2">
          Piyasa Verileri
          <button onClick={onAcTutorial} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">help</span>
          </button>
        </h1>
        <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Canlı Varlık Takip Sistemi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <OzetKart icon="percent" label="Enflasyon Oranı" value={sonuc ? `%${sonuc.enflasyon.toFixed(1)}` : "—"} />
        <OzetKart icon="payments" label="Nakit" value={`₺${Math.round(nakit || 0).toLocaleString("tr-TR")}`} />
        <OzetKart icon="account_balance_wallet" label="Portföy Değeri" value={`₺${Math.round(toplamDeger || 0).toLocaleString("tr-TR")}`} />
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
            nakit={nakit}
          />
        ))}
      </div>

      {emlakPiyasasi && emlakPiyasasi.length > 0 && (
        <div className="flex flex-col gap-stack-md">
          <div className="border-b border-outline-variant pb-2 flex items-center gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Emlak Piyasası</h2>
            <button
              onClick={() => setEmlakGrafikAcik(prev => !prev)}
              className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-lg"
              title="Piyasa hareketini göster"
            >
              info
            </button>
          </div>

          {emlakGrafikAcik && (
            <div className="bg-surface-container border border-outline card-shadow p-stack-md relative">
              <button
                onClick={() => setEmlakGrafikAcik(false)}
                className="absolute top-2 right-2 material-symbols-outlined text-on-surface-variant hover:text-error"
              >
                close
              </button>
              <div className="font-data-sm text-data-sm uppercase text-on-surface-variant mb-2">
                Gayrimenkul Piyasa Endeksi (Dolar Bazında)
              </div>
              <p className="text-on-surface-variant text-sm mb-3">
                Bu endeks, gayrimenkul piyasasının dolar bazındaki gücünü gösterir — kur hareketinden
                bağımsızdır, kendi arz/talep dinamiğiyle yükselip alçalır.
              </p>
              <div className="h-40">
                {emlakEndeksiGecmisi && emlakEndeksiGecmisi.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emlakEndeksiGecmisi}>
                      <XAxis dataKey="yil" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: "#110e06", border: "1px solid #4e4634", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 }}
                        itemStyle={{ color: "#f5c842" }}
                        formatter={(v) => v.toFixed(1)}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line
                        type="step"
                        dataKey="deger"
                        stroke="#f5c842"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#f5c842" }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50 flex items-center justify-center h-full">
                    YETERSİZ VERİ
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {emlakPiyasasi.map(ev => (
              <EmlakPiyasasiKart key={ev.id} ev={ev} nakit={nakit} onSatinAl={evSatinAl} />
            ))}
          </div>
        </div>
      )}

      {sahipOlunanEvler && sahipOlunanEvler.length > 0 && (
        <div className="flex flex-col gap-stack-md">
          <div className="border-b border-outline-variant pb-2">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Evlerim</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {sahipOlunanEvler.map(ev => (
              <SahipOlunanEvKart
                key={ev.id}
                ev={ev}
                guncelDeger={evGuncelDegerHesapla(ev)}
                oturuluyorMu={ev.id === oturulanEvId}
                onTikla={setSeciliEv}
              />
            ))}
          </div>
        </div>
      )}

      {seciliEv && (
        <EvIslemKutusu
          ev={seciliEv}
          guncelDeger={evGuncelDegerHesapla(seciliEv)}
          oturuluyorMu={seciliEv.id === oturulanEvId}
          onKapat={() => setSeciliEv(null)}
          onKiraDegistir={(id) => {
            evKiraDurumunuDegistir(id)
            setSeciliEv(prev => prev ? { ...prev, kirada: !prev.kirada } : prev)
          }}
          onSat={(id) => {
            evSat(id)
            setSeciliEv(null)
          }}
          onYasamayaBasla={(id) => {
            evdeYasamayaBasla(id)
            setSeciliEv(prev => prev ? { ...prev, kirada: false } : prev)
          }}
          onCik={() => {
            evdenCik()
          }}
        />
      )}
    </div>
  )
}
