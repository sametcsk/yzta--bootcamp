import { useTutorial } from "./TutorialContext"

export function TutorialOdak({ hedefId, children, disablePadding = false }) {
  const { aktif, mevcutAdim } = useTutorial()
  const karartilmis = aktif && mevcutAdim?.hedef !== hedefId

  return (
    <div className={`relative transition-all duration-300 ${karartilmis ? "opacity-20 pointer-events-none grayscale" : aktif && !karartilmis ? "z-50 relative ring-4 ring-primary ring-offset-4 ring-offset-background rounded-md " + (disablePadding ? "" : "bg-surface") : ""}`}>
      {children}
    </div>
  )
}

export function TutorialKutusu() {
  const { aktif, mevcutAdim, adimTamamlandi, ileriGit, tutorialuBitir } = useTutorial()
  if (!aktif || !mevcutAdim) return null

  const hizliAlSatAdimi = mevcutAdim.hedef === "hizli-al-sat"
  const konumSinifi = hizliAlSatAdimi
    ? "left-4 right-4 bottom-6 md:left-[17.5rem] md:right-auto"
    : "left-auto right-6 bottom-6"

  return (
    <div key={mevcutAdim.hedef} className={`fixed ${konumSinifi} z-[100] max-w-sm bg-surface-container border border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-stack-md animate-in slide-in-from-bottom-10 fade-in duration-300`}>
      <div className="flex items-center gap-2 text-primary font-headline-md text-headline-md font-black uppercase mb-2 border-b border-outline pb-2">
        <span className="material-symbols-outlined">lightbulb</span>
        Finsim Rehberi
      </div>
      <p className="text-on-surface text-body-md mb-4 font-bold">{mevcutAdim.metin}</p>
      {mevcutAdim.ilerlemeTipi === "buton" ? (
        <button onClick={mevcutAdim.hedef === "sonuc-enflasyon" ? tutorialuBitir : ileriGit} className="w-full bg-primary text-on-primary font-data-sm uppercase py-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-outline font-black hover:bg-primary-container hover:text-on-primary-container transition-colors">
          {mevcutAdim.hedef === "sonuc-enflasyon" ? "Bitti" : "Devam Et"}
        </button>
      ) : mevcutAdim.ilerlemeTipi === "gorev" ? (
        <button
          type="button"
          onClick={ileriGit}
          disabled={!adimTamamlandi}
          className="w-full bg-primary text-on-primary font-data-sm uppercase py-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border border-outline font-black transition-colors disabled:bg-surface-variant disabled:text-on-surface-variant disabled:shadow-none disabled:cursor-not-allowed"
        >
          {adimTamamlandi ? "Devam Et" : "Önce Bir Alım Yap"}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 p-3 bg-surface-variant border border-outline border-dashed text-on-surface-variant font-data-sm uppercase animate-pulse font-bold">
          <span className="material-symbols-outlined">touch_app</span>
          İşaretlenen yeri kullan
        </div>
      )}
      <button onClick={tutorialuBitir} className="w-full text-center text-on-surface-variant text-xs mt-3 hover:text-error transition-colors uppercase font-bold tracking-widest">
        Öğreticiyi Atla
      </button>
    </div>
  )
}
