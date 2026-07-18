import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Imports
imports = """
import TutorialModal from "./TutorialModal"
import { TutorialProvider, useTutorial } from "./TutorialContext"
import { TUTORIAL_ADIMLARI } from "./TutorialAdimlari"
import { TutorialOdak, TutorialKutusu } from "./TutorialComponents"
"""
code = code.replace('import erkekImg from "./assets/erkek.png"', imports.strip() + '\nimport erkekImg from "./assets/erkek.png"')

# 2. Rename App to AppInner
code = code.replace("export default function App() {", "function AppInner() {")

# 3. Add hooks for tutorial inside AppInner
hooks = """
  const [tutorialAcik, setTutorialAcik] = useState(false)
  const { aktif: tutorialAktif, mevcutAdim: tutorialMevcutAdim, adimIndex: tutorialAdimi, ileriGit: tutorialIleriGit, setAktif: setTutorialAktif } = useTutorial()

  useEffect(() => {
    if (!tutorialAktif) return
    const adim = TUTORIAL_ADIMLARI[tutorialAdimi]
    if (!adim || adim.ilerlemeTipi !== "eylem") return

    if (adim.beklenenEylem === "sayfa:varliklar" && aktifSayfa === "varliklar") tutorialIleriGit()
    if (adim.beklenenEylem === "sayfa:portfoy" && aktifSayfa === "portfoy") tutorialIleriGit()
    if (adim.beklenenEylem === "sayfa:standartlar" && aktifSayfa === "standartlar") tutorialIleriGit()
    if (adim.beklenenEylem === "sayfa:ana" && aktifSayfa === "ana") tutorialIleriGit()
    if (adim.beklenenEylem === "yil_atla_tiklandi" && loading) tutorialIleriGit()
    if (adim.beklenenEylem === "event_secildi" && mevcutEvent === null && !!sonucKarti) tutorialIleriGit()
  }, [tutorialAktif, tutorialAdimi, aktifSayfa, loading, mevcutEvent, sonucKarti])
"""
code = code.replace("const [oyunBitti, setOyunBitti] = useState(null)", "const [oyunBitti, setOyunBitti] = useState(null)\n" + hooks)

# 4. introyuBitir
code = code.replace("setYillikGelir(sonuc.yillikGelir)", "setYillikGelir(sonuc.yillikGelir)\n    setTutorialAktif(!!sonuc.tutorialGoster)")

# 5. IntroEkrani onBitis
# Already passing introyuBitir directly, handled in IntroEkrani

# 6. Wrappers
code = code.replace('<button onClick={() => setAktifSayfa("ana")}', '<TutorialOdak hedefId="sidebar-ana" disablePadding>\n            <button onClick={() => setAktifSayfa("ana")}')
code = code.replace('</button>\n          {[', '</button>\n          </TutorialOdak>\n          {[')

code = code.replace('].map((item) => (\n            <button', '].map((item) => (\n            <TutorialOdak key={item.id} hedefId={"sidebar-" + item.id} disablePadding>\n              <button')
code = code.replace('{item.label}\n            </button>\n          ))', '{item.label}\n              </button>\n            </TutorialOdak>\n          ))')

code = code.replace('<div className="mt-auto">\n          <button\n            className="w-full', '<div className="mt-auto">\n          <TutorialOdak hedefId="yil-calistir-butonu">\n            <button\n              className="w-full')
code = code.replace('{loading ? "SİSTEM_MEŞGUL" : `YIL_${yil + 1} ÇALIŞTIR`}\n          </button>\n        </div>', '{loading ? "SİSTEM_MEŞGUL" : `YIL_${yil + 1} ÇALIŞTIR`}\n            </button>\n          </TutorialOdak>\n        </div>')

code = code.replace(' {/* Metrics */}\n            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">', ' {/* Metrics */}\n            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">\n              <TutorialOdak hedefId="info-kartlari">')

# Wrap metric cards manually
# Find MetricCard sections... it's a bit tricky with string replacement. Let's do it exactly:
code = code.replace('<MetricCard\n                  label="Yıllık Gelir"', '<TutorialOdak hedefId="info-kartlari">\n                <MetricCard\n                  label="Yıllık Gelir"')
code = code.replace('tooltipNodes={gelirTooltip}\n                />', 'tooltipNodes={gelirTooltip}\n                />\n              </TutorialOdak>')
code = code.replace('<MetricCard label="Sabır"', '<TutorialOdak hedefId="info-kartlari">\n                <MetricCard label="Sabır"')
code = code.replace('tooltipNodes={sabirTooltip} />', 'tooltipNodes={sabirTooltip} />\n              </TutorialOdak>')
code = code.replace('<MetricCard label="Mutluluk"', '<TutorialOdak hedefId="info-kartlari">\n                <MetricCard label="Mutluluk"')
code = code.replace('tooltipNodes={mutlulukTooltip} />', 'tooltipNodes={mutlulukTooltip} />\n              </TutorialOdak>')
code = code.replace('<MetricCard\n                  icon="percent"', '<TutorialOdak hedefId="sonuc-enflasyon">\n                <MetricCard\n                  icon="percent"')
code = code.replace('alert={krizMi}\n                />', 'alert={krizMi}\n                />\n              </TutorialOdak>')

code = code.replace('<div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">\n                  <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">\n                    <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Sistem Olayı</h2>', '<TutorialOdak hedefId="event-kutusu">\n                  <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">\n                    <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">\n                      <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Sistem Olayı</h2>')

code = code.replace('              </div>\n\n              {/* AI Coach Panel */}', '                  </TutorialOdak>\n                </div>\n\n                {/* AI Coach Panel */}')

code = code.replace('<div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">\n                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">\n                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Yapay Zeka Analiz Kaydı</h2>', '<TutorialOdak hedefId="yapay-zeka">\n                <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">\n                  <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">\n                    <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Yapay Zeka Analiz Kaydı</h2>')

code = code.replace('KARAR KAYITLARI BEKLENİYOR</p>\n                  </div>\n                )}\n              </div>\n            </div>', 'KARAR KAYITLARI BEKLENİYOR</p>\n                  </div>\n                )}\n              </div>\n              </TutorialOdak>\n            </div>')

code = code.replace('</main>\n    </div>\n  )', '<TutorialModal isOpen={tutorialAcik} onClose={() => setTutorialAcik(false)} page={aktifSayfa} />\n        <TutorialKutusu />\n      </main>\n    </div>\n  )\n}\n\nexport default function App() {\n  return (\n    <TutorialProvider adimlar={TUTORIAL_ADIMLARI}>\n      <AppInner />\n    </TutorialProvider>\n  )\n}')

code = code.replace('Piyasa Verileri\n        </h1>', 'Piyasa Verileri\n          <button onClick={() => setTutorialAcik(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">\n            <span className="material-symbols-outlined text-xl">help</span>\n          </button>\n        </h1>')

code = code.replace('Varlık Portföyü\n        </h1>', 'Varlık Portföyü\n          <button onClick={() => setTutorialAcik(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">\n            <span className="material-symbols-outlined text-xl">help</span>\n          </button>\n        </h1>')

code = code.replace('Psikolojik Profil\n        </h1>', 'Psikolojik Profil\n          <button onClick={() => setTutorialAcik(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">\n            <span className="material-symbols-outlined text-xl">help</span>\n          </button>\n        </h1>')

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(code)

print("App.jsx patched!")
