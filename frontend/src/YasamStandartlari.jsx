import { YASAM_STANDARTLARI } from "./data/standartlar"

export default function YasamStandartlari({ secimler, onSecimDegis, portfoy, dolarKuru = 40, yasamGideri = 0 }) {
  const aylikTl = Math.round(yasamGideri / 12)

  return (
    <div className="subpage lifestyle-page">

      <section className="panel lifestyle-hero">
        <div className="panel-kicker">
          Aylık Yaşam Gideri
        </div>
        <strong>
          ₺{aylikTl.toLocaleString("tr-TR")}
        </strong>
        <span>
          Yıllık: ₺{(aylikTl * 12).toLocaleString("tr-TR")}
        </span>
      </section>

      {Object.entries(YASAM_STANDARTLARI).map(([kategoriId, kategori]) => (
        <section className="panel lifestyle-category" key={kategoriId}>
          <div className="lifestyle-head">
            <span>{kategori.icon}</span>
            <strong>{kategori.label}</strong>
            <small>
              ₺{Math.round((kategori.secenekler.find(s => s.id === secimler[kategoriId])?.aylik || 0)).toLocaleString("tr-TR")}/ay
            </small>
          </div>

          <div className="lifestyle-options">
            {kategori.secenekler.map(secenek => {
              const secili = secimler[kategoriId] === secenek.id
              const kilitli = secenek.kilit === "ev" && !(portfoy?.ev > 0)

              return (
                <button
                  key={secenek.id}
                  disabled={kilitli}
                  onClick={() => !kilitli && onSecimDegis(kategoriId, secenek.id)}
                  className={`${secili ? "selected" : ""} ${kilitli ? "locked" : ""}`}
                >
                  <div>
                    <strong>{kilitli ? "Kilitli" : secenek.label}</strong>
                    {kilitli && (
                      <span>
                        Gayrimenkul sahibi olunca açılır
                      </span>
                    )}
                  </div>
                  <em>
                    ₺{Math.round(secenek.aylik_usd * dolarKuru).toLocaleString("tr-TR")}/ay
                  </em>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
