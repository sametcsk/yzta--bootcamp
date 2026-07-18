import { YASAM_STANDARTLARI, yasamKalitesiEtkisi } from "./data/standartlar"
import { TutorialOdak } from "./TutorialComponents"

export default function YasamStandartlari({ secimler, onSecimDegis, portfoy, dolarKuru = 40, yasamGideri = 0, oturulanEvVarMi = false, sahipOlunanAraclar = [] }) {
  const aylikTl = Math.round(yasamGideri / 12)
  const kalite = yasamKalitesiEtkisi(secimler, YASAM_STANDARTLARI)
  const aracVarMi = sahipOlunanAraclar && sahipOlunanAraclar.length > 0;

  // En lüks araca göre çarpan bul
  let aracCarpan = 1.0;
  if (aracVarMi) {
    if (sahipOlunanAraclar.some(a => a.tip === "spor")) aracCarpan = 3.0;
    else if (sahipOlunanAraclar.some(a => a.tip === "orta")) aracCarpan = 1.8;
  }

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-stack-lg gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase">Psikolojik Profil</h1>
          <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Yaşam Tarzı ve Giderler</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-surface-container-high p-3 border border-outline card-shadow">
          <div className="flex gap-4 pr-4 border-r border-outline-variant">
            <div className="text-right">
              <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">Mutluluk Etkisi</div>
              <div className={`font-data-lg text-data-lg ${kalite.mutluluk >= 0 ? "text-primary" : "text-error"}`}>
                {kalite.mutluluk > 0 ? '+' : ''}{kalite.mutluluk}
              </div>
            </div>
            <div className="text-right">
              <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">Sabır Etkisi</div>
              <div className={`font-data-lg text-data-lg ${kalite.sabir >= 0 ? "text-primary" : "text-error"}`}>
                {kalite.sabir > 0 ? '+' : ''}{kalite.sabir}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">Yıllık Gider Hızı</div>
            <div className="font-data-lg text-data-lg text-error">₺{yasamGideri.toLocaleString("tr-TR")}</div>
            <div className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1 opacity-50">Aylık: ₺{aylikTl.toLocaleString("tr-TR")}</div>
          </div>
        </div>
      </div>

      <TutorialOdak hedefId="standartlar-kategoriler">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {Object.entries(YASAM_STANDARTLARI).map(([kategoriId, kategori]) => (
            <section className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col" key={kategoriId}>
              <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">{kategori.icon}</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase">{kategori.label}</h2>
                </div>
                <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">
                  ₺{Math.round((kategori.secenekler.find(s => s.id === secimler[kategoriId])?.aylik_usd || 0) * (kategoriId === "ulasim" && secimler[kategoriId] === "kendi_araci" ? aracCarpan : 1) * dolarKuru).toLocaleString("tr-TR")}/ay
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {kategori.secenekler.map(secenek => {
                  const secili = secimler[kategoriId] === secenek.id
                  const kendiEviSecenegi = secenek.kilit === "ev"
                  const kendiAraciSecenegi = secenek.kilit === "arac"
                  
                  let kilitli = false;
                  let kilitMesaji = "";
                  
                  if (kendiEviSecenegi && !oturulanEvVarMi) {
                    kilitli = true;
                    kilitMesaji = "GEREKSİNİM: BİR EVİNDE YAŞAMAYA BAŞLA";
                  } else if (kategoriId === "konut" && oturulanEvVarMi && !kendiEviSecenegi) {
                    kilitli = true;
                    kilitMesaji = "GEREKSİNİM: ÖNCE KENDİ EVİNDEN ÇIKIŞ YAP";
                  } else if (kendiAraciSecenegi && !aracVarMi) {
                    kilitli = true;
                    kilitMesaji = "GEREKSİNİM: BİR ARAÇ SATIN AL";
                  } else if (kategoriId === "ulasim" && aracVarMi && !kendiAraciSecenegi) {
                    kilitli = true;
                    kilitMesaji = "GEREKSİNİM: ÖNCE ARACINI SAT";
                  }
                  
                  const aylikMaliyetUsd = secenek.aylik_usd * (kendiAraciSecenegi ? aracCarpan : 1);

                  return (
                    <button
                      key={secenek.id}
                      disabled={kilitli}
                      onClick={() => !kilitli && onSecimDegis(kategoriId, secenek.id)}
                      className={`p-3 flex justify-between items-center border text-left transition-colors ${kilitli
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
                            {kilitMesaji}
                          </span>
                        )}
                        <div className="flex gap-2 mt-1">
                          {secenek.mutluluk_etki !== 0 && (
                            <span className={`text-[10px] px-1 font-bold uppercase ${secili && !kilitli ? "bg-background text-primary" : (secenek.mutluluk_etki > 0 ? "bg-[#34d399] text-black" : "bg-error text-background")}`}>
                              Mutluluk: {secenek.mutluluk_etki > 0 ? '+' : ''}{secenek.mutluluk_etki}
                            </span>
                          )}
                          {secenek.sabir_etki !== 0 && (
                            <span className={`text-[10px] px-1 font-bold uppercase ${secili && !kilitli ? "bg-background text-primary" : (secenek.sabir_etki > 0 ? "bg-[#34d399] text-black" : "bg-error text-background")}`}>
                              Sabır: {secenek.sabir_etki > 0 ? '+' : ''}{secenek.sabir_etki}
                            </span>
                          )}
                        </div>
                      </div>
                      <em className={`font-data-sm text-data-sm uppercase ${secili && !kilitli ? "text-background opacity-80" : "text-primary"}`}>
                        ₺{Math.round(aylikMaliyetUsd * dolarKuru).toLocaleString("tr-TR")}/ay
                      </em>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </TutorialOdak>
    </div>
  )
}
