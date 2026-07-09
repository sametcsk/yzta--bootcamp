import { VARSAYILAN_STANDARTLAR, YASAM_STANDARTLARI, toplamAylikUsd } from "./data/standartlar"

export default function YasamStandartlari({ secimler, onSecimDegis, nakit, portfoy, dolarKuru = 40, yasamGideri = 0 }) {
  const aylikTl = Math.round(yasamGideri / 12)

  return (
    <div style={{ padding: "16px 0 80px" }}>

      {/* Özet */}
      <div style={{
        background: "#141720", border: "1px solid #2a2f42",
        borderRadius: 16, padding: 20, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Aylık Yaşam Gideri
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#f5c842" }}>
          ₺{aylikTl.toLocaleString("tr-TR")}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Yıllık: ₺{(aylikTl * 12).toLocaleString("tr-TR")}
        </div>
      </div>

      {/* Kategoriler */}
      {Object.entries(YASAM_STANDARTLARI).map(([kategoriId, kategori]) => (
        <div key={kategoriId} style={{
          background: "#141720", border: "1px solid #2a2f42",
          borderRadius: 16, padding: 20, marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>{kategori.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#e8eaf0" }}>{kategori.label}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
              ₺{Math.round((kategori.secenekler.find(s => s.id === secimler[kategoriId])?.aylik || 0)).toLocaleString("tr-TR")}/ay
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {kategori.secenekler.map(secenek => {
              const secili = secimler[kategoriId] === secenek.id
              const kilitli = secenek.kilit === "ev" && !(portfoy?.ev > 0)

              return (
                <button
                  key={secenek.id}
                  disabled={kilitli}
                  onClick={() => !kilitli && onSecimDegis(kategoriId, secenek.id)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", borderRadius: 10,
                    background: secili ? "#1a2a1a" : kilitli ? "#0d0f12" : "#1c2030",
                    border: `1px solid ${secili ? "#3a7a3a" : kilitli ? "#1c2030" : "#2a2f42"}`,
                    cursor: kilitli ? "not-allowed" : "pointer",
                    opacity: kilitli ? 0.5 : 1,
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: kilitli ? "#4b5563" : "#e8eaf0", fontWeight: secili ? 600 : 400 }}>
                      {kilitli ? "🔒 " : secili ? "✓ " : ""}{secenek.label}
                    </div>
                    {kilitli && (
                      <div style={{ fontSize: 11, color: "#4b5563", marginTop: 2 }}>
                        Gayrimenkul sahibi olunca açılır
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: secili ? "#86efac" : "#6b7280", fontWeight: 500 }}>
                    ₺{Math.round(secenek.aylik_usd * dolarKuru).toLocaleString("tr-TR")}/ay
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}