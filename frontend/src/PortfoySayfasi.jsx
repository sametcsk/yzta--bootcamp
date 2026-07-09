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
    .filter(([_, v]) => v !== null)
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
    contentStyle: { background: "#1c2030", border: "1px solid #2a2f42", borderRadius: 8, fontSize: 11 },
    labelStyle: { color: "#6b7280" },
  }

  return (
    <div style={{ padding: "16px 0 80px" }}>

      {/* Zaman aralığı */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {ARALIKLAR.map(a => (
          <button
            key={a.id}
            onClick={() => setAralik(a.id)}
            style={{
              flex: 1, padding: "6px 0", borderRadius: 8, border: "none",
              background: aralik === a.id ? "#f5c842" : "#141720",
              color: aralik === a.id ? "#1a1200" : "#6b7280",
              fontSize: 12, fontWeight: aralik === a.id ? 700 : 400,
              cursor: "pointer",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Grafik 1 — Varlık Performansı */}
      <div style={{ background: "#141720", border: "1px solid #2a2f42", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          Varlık Performansı
        </div>
        <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 16 }}>
          Satın alındığından bu yana kümülatif % değişim
        </div>

        {varlikSatir.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {varlikSatir.map(v => (
              <div key={v.varlik}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#b0b8cc" }}>{v.ad}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: v.yuzde >= 0 ? "#34d399" : "#f87171" }}>
                    {v.yuzde >= 0 ? "+" : ""}{v.yuzde}%
                  </span>
                </div>
                <div style={{ height: 6, background: "#1c2030", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, Math.abs(v.yuzde))}%`,
                    background: v.yuzde >= 0 ? v.renk : "#f87171",
                    borderRadius: 3,
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 13 }}>
            Varlık satın alınca görünür
          </div>
        )}
      </div>

      {/* Grafik 2 — Portföy vs Enflasyon */}
      <div style={{ background: "#141720", border: "1px solid #2a2f42", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          Portföy vs Enflasyon
        </div>
        <div style={{ fontSize: 11, color: "#4b5563", marginBottom: 16 }}>
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
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#374151", fontSize: 13 }}>
            Grafik için yıl atla
          </div>
        )}
      </div>

      {/* Pie Chart — Dağılım */}
      <div style={{ background: "#141720", border: "1px solid #2a2f42", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
          Portföy Dağılımı
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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

          <div style={{ flex: 1 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.renk }} />
                  <span style={{ color: "#b0b8cc" }}>{d.name}</span>
                </div>
                <span style={{ color: "#e8eaf0" }}>
                  %{Math.round(d.value / toplamDeger * 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}