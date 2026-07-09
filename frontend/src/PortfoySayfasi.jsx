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

export default function PortfoySayfasi({ portfoyGecmisi, enflasyonGecmisi, portfoy, fiyatlar, varlikKatsayilari, nakit }) {
  const [aralik, setAralik] = useState("tum")

  // Grafik 1 — Varlık katsayılarından kümülatif % değişim geçmişi
  // Bu grafiği artık katsayılardan değil geçmişten çizemeyiz
  // varlikKatsayilari anlık değer, geçmişi ayrı tutmamız lazım
  // Şimdilik portfoy vs enflasyon grafiğini gösterelim

  // Grafik 2 — Portföy vs Enflasyon
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

  // Grafik 1 — Varlık performansı (katsayıdan)
  const varlikSatir = Object.entries(varlikKatsayilari)
    .filter(([, v]) => v !== null)
    .map(([varlik, katsayi]) => ({
      varlik,
      yuzde: Math.round((katsayi - 1) * 100),
      renk: VARLIK_RENK[varlik],
      ad: VARLIK_AD[varlik],
    }))

  // Pie chart verisi
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
    contentStyle: { background: "#101725", border: "1px solid rgba(96, 165, 250, 0.35)", borderRadius: 8, fontSize: 11 },
    labelStyle: { color: "#93a4b8" },
  }

  return (
    <div className="subpage portfolio-page">

      <div className="segment-control">
        {ARALIKLAR.map(a => (
          <button
            key={a.id}
            onClick={() => setAralik(a.id)}
            className={aralik === a.id ? "active" : ""}
          >
            {a.label}
          </button>
        ))}
      </div>

      <section className="panel chart-panel">
        <div className="panel-kicker">
          Varlık Performansı
        </div>
        <div className="panel-subtitle">
          Satın alındığından bu yana kümülatif % değişim
        </div>

        {varlikSatir.length > 0 ? (
          <div className="performance-list">
            {varlikSatir.map(v => (
              <div className="performance-row" key={v.varlik}>
                <div>
                  <span>{v.ad}</span>
                  <strong className={v.yuzde >= 0 ? "positive" : "negative"}>
                    {v.yuzde >= 0 ? "+" : ""}{v.yuzde}%
                  </strong>
                </div>
                <div className="mini-track">
                  <div style={{
                    width: `${Math.min(100, Math.abs(v.yuzde))}%`,
                    background: v.yuzde >= 0 ? v.renk : "#f87171",
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-chart">
            Varlık satın alınca görünür
          </div>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="panel-kicker">
          Portföy vs Enflasyon
        </div>
        <div className="panel-subtitle">
          Başlangıç = 100 endeks
        </div>

        {dilim2.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dilim2}>
              <XAxis dataKey="yil" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v, name) => [v, name === "portfoy" ? "Portföy" : "Enflasyon"]} />
              <Legend formatter={v => v === "portfoy" ? "Portföy" : "Enflasyon"} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="portfoy" stroke="#f5c842" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="enflasyon" stroke="#f87171" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart tall">
            Grafik için yıl atla
          </div>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="panel-kicker with-gap">
          Portföy Dağılımı
        </div>

        <div className="allocation-grid">
          <PieChart width={140} height={140}>
            <Pie
              data={pieData}
              cx={65} cy={65}
              innerRadius={40}
              outerRadius={65}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((d, i) => (
                <Cell key={i} fill={d.renk} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1c2030", border: "1px solid #2a2f42", borderRadius: 8, fontSize: 11 }}
              formatter={(v, name) => [`₺${Math.round(v).toLocaleString("tr-TR")}`, name]}
            />
          </PieChart>

          <div className="allocation-list">
            {pieData.map(d => (
              <div key={d.name}>
                <div>
                  <i style={{ background: d.renk }} />
                  <span>{d.name}</span>
                </div>
                <strong>
                  %{Math.round(d.value / toplamDeger * 100)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
