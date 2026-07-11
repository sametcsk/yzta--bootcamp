import { YASAM_STANDARTLARI } from "./data/standartlar"

export default function YasamStandartlari({ secimler, onSecimDegis, portfoy, dolarKuru = 40, yasamGideri = 0 }) {
  const aylikTl = Math.round(yasamGideri / 12)

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-stack-lg gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase">Psikolojik Profil</h1>
          <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Yaşam Tarzı ve Giderler</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-high p-3 border border-outline card-shadow">
          <div className="text-right">
            <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">Aylık Gider Hızı</div>
            <div className="font-data-lg text-data-lg text-error">₺{aylikTl.toLocaleString("tr-TR")}</div>
            <div className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1 opacity-50">Yıllık: ₺{(aylikTl * 12).toLocaleString("tr-TR")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {Object.entries(YASAM_STANDARTLARI).map(([kategoriId, kategori]) => (
          <section className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col" key={kategoriId}>
            <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{kategori.icon}</span>
                <h2 className="font-headline-md text-headline-md text-on-surface uppercase">{kategori.label}</h2>
              </div>
              <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">
                ₺{Math.round((kategori.secenekler.find(s => s.id === secimler[kategoriId])?.aylik || 0)).toLocaleString("tr-TR")}/ay
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {kategori.secenekler.map(secenek => {
                const secili = secimler[kategoriId] === secenek.id
                const kilitli = secenek.kilit === "ev" && !(portfoy?.ev > 0)

                return (
                  <button
                    key={secenek.id}
                    disabled={kilitli}
                    onClick={() => !kilitli && onSecimDegis(kategoriId, secenek.id)}
                    className={`p-3 flex justify-between items-center border text-left transition-colors ${
                      kilitli 
                        ? "bg-surface-container-highest border-outline-variant opacity-50 cursor-not-allowed" 
                        : secili 
                          ? "bg-primary text-background border-primary card-shadow font-bold" 
                          : "bg-surface-variant border-outline hover:border-primary text-on-surface"
                    }`}
                  >
                    <div className="flex flex-col">
                      <strong className={`font-data-sm text-data-sm uppercase ${secili && !kilitli ? "text-background" : "text-on-surface"}`}>
                        {kilitli ? "KİLİTLİ" : secenek.label}
                      </strong>
                      {kilitli && (
                        <span className="text-error font-data-sm text-data-sm uppercase mt-1">
                          GEREKSİNİM: GAYRİMENKUL SAHİBİ OLMAK
                        </span>
                      )}
                    </div>
                    <em className={`font-data-sm text-data-sm uppercase ${secili && !kilitli ? "text-background opacity-80" : "text-primary"}`}>
                      ₺{Math.round(secenek.aylik_usd * dolarKuru).toLocaleString("tr-TR")}/ay
                    </em>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
