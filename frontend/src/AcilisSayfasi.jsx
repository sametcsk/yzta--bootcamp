import { useEffect, useState } from "react"

const BOOT_SATIRLARI = [
  "FINSIM_OS v1.0 başlatılıyor...",
  "60 yıllık ekonomik veri seti yükleniyor... TAMAM",
  "Enflasyon / kur / BIST / altın modülleri bağlandı... TAMAM",
  "Davranışsal analiz katmanı (AI Agents) hazır",
  "KARAKTER OLUŞTURMA MODÜLÜ BEKLEMEDE",
]

export default function AcilisSayfasi({ onBaslat, fiyatlar }) {
  const [gorunenSatir, setGorunenSatir] = useState(0)
  const [ctaGoster, setCtaGoster] = useState(false)

  useEffect(() => {
    if (gorunenSatir < BOOT_SATIRLARI.length) {
      const t = setTimeout(() => setGorunenSatir((n) => n + 1), 380)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCtaGoster(true), 300)
    return () => clearTimeout(t)
  }, [gorunenSatir])

  const dolar = fiyatlar?.dolar_try ? fiyatlar.dolar_try.toFixed(2) : "40.00"
  const bist = fiyatlar?.bist_endeks ? fiyatlar.bist_endeks.toFixed(0) : "100"

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md relative overflow-hidden">
      {/* Ticker bar — üst bilgi şeridi */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant overflow-hidden">
        <div className="flex gap-8 py-2 px-margin-mobile md:px-margin-desktop font-data-sm text-data-sm uppercase text-on-surface-variant whitespace-nowrap">
          <span>USD/TRY <span className="text-primary">{dolar}</span></span>
          <span className="opacity-40">|</span>
          <span>BIST100 <span className="text-primary">{bist}</span></span>
          <span className="opacity-40">|</span>
          <span>SİSTEM <span className="text-primary">ÇEVRİMİÇİ</span></span>
        </div>
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-stack-lg gap-stack-lg">
        <div className="w-full max-w-2xl flex flex-col gap-stack-md">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">terminal</span>
            <h1 className="font-headline-lg text-headline-lg font-black text-primary uppercase tracking-tighter">
              FINSIM_OS
            </h1>
          </div>

          {/* Boot log — imza öğe */}
          <div className="bg-surface-container-lowest border border-outline-variant card-shadow p-stack-md font-data-sm text-data-sm">
            {BOOT_SATIRLARI.slice(0, gorunenSatir).map((satir, i) => (
              <div key={i} className="text-on-surface-variant mb-1">
                <span className="text-primary">{">"}</span> {satir}
              </div>
            ))}
            {gorunenSatir >= BOOT_SATIRLARI.length && (
              <div className="text-primary font-bold uppercase mt-2 flex items-center gap-2">
                <span>{">"}</span> SİSTEM HAZIR
                <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-on-surface-variant text-body-lg mt-2">
            25 yaşında başla. 60 yıllık bir ömür boyunca gerçekçi Türkiye ekonomisinde
            finansal kararlar al. Her seçim karakterini şekillendirir — oyun sonunda
            kararlarının davranışsal izini gör.
          </p>

          {/* Üç bar önizlemesi */}
          <div className="grid grid-cols-3 gap-gutter mt-2">
            <StatOnizleme icon="payments" label="Nakit" hint="Finansal güç" />
            <StatOnizleme icon="hourglass_top" label="Sabır" hint="Risk toleransı" />
            <StatOnizleme icon="mood" label="Mutluluk" hint="Yaşam kalitesi" />
          </div>

          {ctaGoster && (
            <button
              onClick={onBaslat}
              className="mt-stack-md w-full md:w-auto self-start bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 px-8 btn-shadow border border-outline font-bold transition-transform hover:-translate-y-0.5"
            >
              Simülasyonu Başlat
            </button>
          )}
        </div>
      </div>

      <footer className="w-full border-t border-outline-variant px-margin-mobile md:px-margin-desktop py-stack-sm">
        <p className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50">
          Simülasyon amaçlıdır, yatırım tavsiyesi değildir.
        </p>
      </footer>
    </div>
  )
}

function StatOnizleme({ icon, label, hint }) {
  return (
    <div className="bg-surface-container border border-outline card-shadow p-stack-sm flex flex-col items-start gap-1">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <div className="font-data-sm text-data-sm uppercase text-on-surface">{label}</div>
      <div className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50">{hint}</div>
    </div>
  )
}
