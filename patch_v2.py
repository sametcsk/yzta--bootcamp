import re

with open("frontend/src/App_old.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

def replace_between(start_str, end_str, new_str, multiple=False):
    global lines
    text = "".join(lines)
    if multiple:
        parts = text.split(start_str)
        text = parts[0]
        for p in parts[1:]:
            end_idx = p.find(end_str)
            if end_idx == -1:
                text += start_str + p
            else:
                text += new_str + p[end_idx + len(end_str):]
    else:
        start_idx = text.find(start_str)
        if start_idx != -1:
            end_idx = text.find(end_str, start_idx)
            if end_idx != -1:
                text = text[:start_idx] + new_str + text[end_idx + len(end_str):]
    lines = [line + '\n' for line in text.split('\n')]
    if lines[-1] == '\n': lines = lines[:-1]

text = "".join(lines)

# 1. Imports
imports = """import TutorialModal from "./TutorialModal"
import { TutorialProvider, useTutorial } from "./TutorialContext"
import { TUTORIAL_ADIMLARI } from "./TutorialAdimlari"
import { TutorialOdak, TutorialKutusu } from "./TutorialComponents"
"""
text = text.replace('import erkekImg from "./assets/erkek.png"', imports + 'import erkekImg from "./assets/erkek.png"')

# 2. Rename App to AppInner
text = text.replace('export default function App() {', 'function AppInner() {')

# 3. Add hooks
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
text = text.replace('const [oyunBitti, setOyunBitti] = useState(null)', 'const [oyunBitti, setOyunBitti] = useState(null)\n' + hooks)

# 4. introyuBitir
text = text.replace('setYillikGelir(sonuc.yillikGelir)', 'setYillikGelir(sonuc.yillikGelir)\n    setTutorialAktif(!!sonuc.tutorialGoster)')

# 6. Wrappers
# Sidebar Ana Defter
ana_btn_old = """          <button
            onClick={() => setAktifSayfa("ana")}"""
ana_btn_new = """          <TutorialOdak hedefId="sidebar-ana" disablePadding>
            <button
              onClick={() => setAktifSayfa("ana")}"""
text = text.replace(ana_btn_old, ana_btn_new)
text = text.replace('Ana Defter\n          </button>\n          {[', 'Ana Defter\n            </button>\n          </TutorialOdak>\n          {[')

# Sidebar other links
map_btn_old = """          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAktifSayfa(item.id)}"""
map_btn_new = """          ].map((item) => (
            <TutorialOdak key={item.id} hedefId={"sidebar-" + item.id} disablePadding>
              <button
                onClick={() => setAktifSayfa(item.id)}"""
text = text.replace(map_btn_old, map_btn_new)
text = text.replace('{item.label}\n            </button>\n          ))', '{item.label}\n              </button>\n            </TutorialOdak>\n          ))')

# Yil Calistir
yil_btn_old = """        <div className="mt-auto">
          <button
            className="w-full bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 btn-shadow border border-outline transition-transform font-bold mb-6 disabled:opacity-50"
            onClick={yilAtla}"""
yil_btn_new = """        <div className="mt-auto">
          <TutorialOdak hedefId="yil-calistir-butonu">
            <button
              className="w-full bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 btn-shadow border border-outline transition-transform font-bold mb-6 disabled:opacity-50"
              onClick={yilAtla}"""
text = text.replace(yil_btn_old, yil_btn_new)
text = text.replace('{loading ? "SİSTEM_MEŞGUL" : `YIL_${yil + 1} ÇALIŞTIR`}\n          </button>\n        </div>', '{loading ? "SİSTEM_MEŞGUL" : `YIL_${yil + 1} ÇALIŞTIR`}\n            </button>\n          </TutorialOdak>\n        </div>')

# Metric Cards
metric_old = """            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <MetricCard
                label="Yıllık Gelir"
                value={money(yillikGelir + kiraGeliriYillik)}
                hint={`Net akış: ${money(netAkis)}`}
                tooltipNodes={gelirTooltip}
              />
              <MetricCard label="Sabır" value={`${bars.sabir}/100`} hint="Psikolojik" tooltipNodes={sabirTooltip} />
              <MetricCard label="Mutluluk" value={`${bars.mutluluk}/100`} hint="Psikolojik" tooltipNodes={mutlulukTooltip} />
              <MetricCard
                icon="percent"
                title="Enflasyon"
                value={sonuc ? `%${sonuc.enflasyon}` : "—"}
                hint={sonuc ? sonuc.enf_durum : "SİSTEM_HAZIR"}
                alert={krizMi}
              />
            </div>"""

metric_new = """            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <TutorialOdak hedefId="info-kartlari">
                <MetricCard
                  label="Yıllık Gelir"
                  value={money(yillikGelir + kiraGeliriYillik)}
                  hint={`Net akış: ${money(netAkis)}`}
                  tooltipNodes={gelirTooltip}
                />
              </TutorialOdak>
              <TutorialOdak hedefId="info-kartlari">
                <MetricCard label="Sabır" value={`${bars.sabir}/100`} hint="Psikolojik" tooltipNodes={sabirTooltip} />
              </TutorialOdak>
              <TutorialOdak hedefId="info-kartlari">
                <MetricCard label="Mutluluk" value={`${bars.mutluluk}/100`} hint="Psikolojik" tooltipNodes={mutlulukTooltip} />
              </TutorialOdak>
              <TutorialOdak hedefId="sonuc-enflasyon">
                <MetricCard
                  icon="percent"
                  title="Enflasyon"
                  value={sonuc ? `%${sonuc.enflasyon}` : "—"}
                  hint={sonuc ? sonuc.enf_durum : "SİSTEM_HAZIR"}
                  alert={krizMi}
                />
              </TutorialOdak>
            </div>"""
text = text.replace(metric_old, metric_new)

# Event Box
event_old = """              <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Sistem Olayı</h2>"""
event_new = """              <TutorialOdak hedefId="event-kutusu">
                <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
                    <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Sistem Olayı</h2>"""
text = text.replace(event_old, event_new)

text = text.replace('              {/* AI Coach Panel */}', '                </div>\n              </TutorialOdak>\n\n              {/* AI Coach Panel */}')

# Yapay Zeka Motoru
ai_old = """              <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Yapay Zeka Analiz Kaydı</h2>"""
ai_new = """              <TutorialOdak hedefId="yapay-zeka">
                <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
                    <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Yapay Zeka Analiz Kaydı</h2>"""
text = text.replace(ai_old, ai_new)

text = text.replace('KARAR KAYITLARI BEKLENİYOR</p>\n                  </div>\n                )}\n              </div>\n            </div>', 'KARAR KAYITLARI BEKLENİYOR</p>\n                  </div>\n                )}\n              </div>\n              </TutorialOdak>\n            </div>')

# End
end_old = """        )}

      </main>
    </div>
  )
}
"""
end_new = """        )}

        <TutorialModal isOpen={tutorialAcik} onClose={() => setTutorialAcik(false)} page={aktifSayfa} />
        <TutorialKutusu />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <TutorialProvider adimlar={TUTORIAL_ADIMLARI}>
      <AppInner />
    </TutorialProvider>
  )
}
"""
text = text.replace(end_old, end_new)

# Info buttons
text = text.replace('Piyasa Verileri\n        </h1>', 'Piyasa Verileri\n          <button onClick={() => setTutorialAcik(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">\n            <span className="material-symbols-outlined text-xl">help</span>\n          </button>\n        </h1>')
text = text.replace('Varlık Portföyü\n        </h1>', 'Varlık Portföyü\n          <button onClick={() => setTutorialAcik(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">\n            <span className="material-symbols-outlined text-xl">help</span>\n          </button>\n        </h1>')
text = text.replace('Psikolojik Profil\n        </h1>', 'Psikolojik Profil\n          <button onClick={() => setTutorialAcik(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">\n            <span className="material-symbols-outlined text-xl">help</span>\n          </button>\n        </h1>')

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Patch applied successfully!")
