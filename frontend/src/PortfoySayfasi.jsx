import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts"

const ARALIKLAR = [
  { id: "5", label: "5Y" },
  { id: "10", label: "10Y" },
  { id: "20", label: "20Y" },
  { id: "tum", label: "Tümü" },
]

function veriDilimle(gecmis, aralik) {
  if (aralik === "tum" || gecmis.length === 0) return gecmis
  const n = parseInt(aralik)
  return gecmis.slice(-n)
}

const VARLIK_RENK = {
  altin: "#f5c842",
  bist: "#34d399",
  dolar: "#60a8f0",
  mevduat: "#a78bfa",
}

const VARLIK_AD = {
  altin: "Altın",
  bist: "BIST",
  dolar: "Dolar",
  mevduat: "Mevduat",
}

function PortfoySayfasi({ portfoyGecmisi, enflasyonGecmisi, portfoy, fiyatlar, varlikKatsayilari, nakit }) {
  const [aralik, setAralik] = useState("tum")

  const portfoyGrafigi = (() => {
    if (portfoyGecmisi.length === 0) return []
    const ilkPortfoy = portfoyGecmisi[0]?.deger || 1
    const ilkEnf = enflasyonGecmisi[0]?.deger || 100

    return portfoyGecmisi.map((p, i) => ({
      yil: p.yil,
      portfoy: Math.round((p.deger / ilkPortfoy) * 100),
      enflasyon: enflasyonGecmisi[i] ? Math.round((enflasyonGecmisi[i].deger / ilkEnf) * 100) : null,
    }))
  })()

  const dilim2 = veriDilimle(portfoyGrafigi, aralik)

  const varlikSatir = Object.entries(varlikKatsayilari)
    .filter(([, v]) => v !== null)
    .map(([varlik, katsayi]) => ({
      varlik,
      yuzde: Math.round((katsayi - 1) * 100),
      renk: VARLIK_RENK[varlik],
      ad: VARLIK_AD[varlik],
    }))

  const altinDeger = Math.round(portfoy.altin_gram * fiyatlar.altin_try_gram)
  const bistDeger = Math.round(portfoy.bist_adet * fiyatlar.bist_endeks)
  const dolarDeger = Math.round(portfoy.dolar * fiyatlar.dolar_try)
  const mevduatDeger = portfoy.mevduat_tl
  const toplamDeger = nakit + altinDeger + bistDeger + dolarDeger + mevduatDeger

  const pieData = [
    { name: "Nakit", value: nakit, renk: "#e8eaf0" },
    { name: "Altın", value: altinDeger, renk: "#f5c842" },
    { name: "BIST", value: bistDeger, renk: "#34d399" },
    { name: "Dolar", value: dolarDeger, renk: "#60a8f0" },
    { name: "Mevduat", value: mevduatDeger, renk: "#a78bfa" },
  ].filter(d => d.value > 0)

  const tooltipStyle = {
    contentStyle: { background: "#110e06", border: "1px solid #4e4634", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 },
    labelStyle: { color: "#d1c5ae" },
  }

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-stack-lg gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase">PORTFÖY ANALİZİ</h1>
          <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Son Güncelleme: YIL {dilim2[dilim2.length - 1]?.yil || "—"} | SİSTEM_HAZIR</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-high p-3 border border-outline card-shadow">
          <div className="text-right">
            <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">Toplam Değer</div>
            <div className="font-data-lg text-data-lg text-primary">₺{toplamDeger.toLocaleString("tr-TR")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Asset Performance */}
        <div className="col-span-1 lg:col-span-2 bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Varlık Performansı</h2>
            <span className="material-symbols-outlined text-on-surface-variant">bar_chart</span>
          </div>
          
          <div className="flex-1 flex flex-col pt-4 gap-4">
            {varlikSatir.length > 0 ? (
              varlikSatir.map(v => (
                <div className="flex flex-col gap-1" key={v.varlik}>
                  <div className="flex justify-between font-data-sm text-data-sm uppercase">
                    <span className="text-on-surface">{v.ad}</span>
                    <strong className={v.yuzde >= 0 ? "text-[#34d399]" : "text-error"}>
                      {v.yuzde >= 0 ? "+" : ""}{v.yuzde}%
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-surface-dim border border-outline-variant">
                    <div style={{
                      width: `${Math.min(100, Math.abs(v.yuzde))}%`,
                      background: v.yuzde >= 0 ? v.renk : "#ffb4ab",
                      height: "100%"
                    }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50">
                VARLIK VERİSİ YOK
              </div>
            )}
          </div>
        </div>

        {/* Portföy Dağılımı */}
        <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Portföy Dağılımı</h2>
            <span className="material-symbols-outlined text-on-surface-variant">pie_chart</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            {pieData.length > 0 ? (
              <PieChart width={200} height={200}>
                <Pie
                  data={pieData}
                  cx={100} cy={100}
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#16130b"
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.renk} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v, name) => [`₺${Math.round(v).toLocaleString("tr-TR")}`, name]} />
              </PieChart>
            ) : (
              <div className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50">
                VERİ YOK
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map(d => (
              <div className="flex justify-between items-center font-data-sm text-data-sm" key={d.name}>
                <div className="flex items-center">
                  <div className="w-3 h-3 mr-2" style={{ background: d.renk }}></div>
                  <span className="text-on-surface uppercase">{d.name}</span>
                </div>
                <span className="text-on-surface">%{Math.round(d.value / toplamDeger * 100)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio vs Inflation */}
        <div className="col-span-1 lg:col-span-3 bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Portföy vs Enflasyon</h2>
            <div className="flex gap-2">
              {ARALIKLAR.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAralik(a.id)}
                  className={`font-data-sm text-data-sm uppercase px-2 py-1 border ${aralik === a.id ? "bg-primary text-background border-primary font-bold" : "bg-surface-variant text-on-surface border-outline hover:border-primary"}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full h-64 relative bg-surface-dim border border-outline-variant flex items-end p-2 mt-2">
             {dilim2.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dilim2}>
                  <XAxis dataKey="yil" tick={{ fontSize: 10, fill: "#d1c5ae", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#d1c5ae", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v, name) => [v, name === "portfoy" ? "PORTFÖY" : "ENFLASYON"]} />
                  <Legend formatter={v => v === "portfoy" ? "PORTFÖY" : "ENFLASYON (TAHMİNİ)"} wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono", marginTop: '10px' }} />
                  <Line type="step" dataKey="portfoy" stroke="#f5c842" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="step" dataKey="enflasyon" stroke="#ffb4ab" strokeWidth={1} dot={false} strokeDasharray="4 4" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50">
                YIL_SONU KAYITLARI BEKLENİYOR
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfoySayfasi
