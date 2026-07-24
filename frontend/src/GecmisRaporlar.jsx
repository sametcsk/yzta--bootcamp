import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import { money } from "./utils"

export default function GecmisRaporlar({ onGeri, oturum }) {
  const [raporlar, setRaporlar] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [seciliRapor, setSeciliRapor] = useState(null)

  useEffect(() => {
    async function raporlariCek() {
      if (!oturum) return
      try {
        const { data, error } = await supabase
          .from("runs")
          .select("*")
          .eq("user_id", oturum.user.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error
        setRaporlar(data || [])
      } catch (err) {
        console.error("Geçmiş raporlar çekilemedi:", err)
      } finally {
        setYukleniyor(false)
      }
    }
    raporlariCek()
  }, [oturum])

  const renderRaporDetay = (rapor) => {
    const finalRapor = rapor.full_report
    if (!finalRapor) {
      return (
        <div className="text-on-surface-variant font-body-md p-4 bg-surface-variant border border-outline">
          Bu oyun için yapay zeka profillemesi kaydedilmemiş (eski sürüm kaydı). Sadece skor: {money(rapor.net_worth)} - Yaş: {rapor.final_age}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
        <div className="flex justify-between items-start border-b border-outline-variant pb-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary uppercase">{finalRapor.title || "Finansal Profil Raporu"}</h2>
            <div className="font-data-sm text-data-sm uppercase text-on-surface-variant mt-1">
              Oyun Sonu Yaşı: {rapor.final_age} • Final Servet: {money(rapor.net_worth)}
            </div>
          </div>
          <button onClick={() => setSeciliRapor(null)} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        <div className="bg-surface-variant p-6 border border-outline text-body-lg text-on-surface leading-relaxed whitespace-pre-wrap">
          {finalRapor.rapor_metni}
        </div>

        {finalRapor.bias_scores && (
          <div className="mt-4 bg-surface-container p-6 border border-outline">
            <h3 className="font-headline-md text-headline-md uppercase text-on-surface mb-4 border-b border-outline-variant pb-2">Davranışsal Finans Eğilimleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'loss_aversion', label: 'Kayıptan Kaçınma' },
                { key: 'anchoring', label: 'Çıpalama (Fiyata Bağlılık)' },
                { key: 'disposition_effect', label: 'Elden Çıkarma (Kârı Erken Kesme)' },
                { key: 'mental_accounting', label: 'Zihinsel Muhasebe' },
                { key: 'present_bias', label: 'Anlık Haz Eğilimi' }
              ].map(bias => {
                const score = finalRapor.bias_scores[bias.key] || 0;
                return (
                  <div key={bias.key} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant uppercase">{bias.label}</span>
                      <span className="text-primary font-bold">%{score}</span>
                    </div>
                    <div className="h-2 bg-background border border-outline w-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${score}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col p-4 md:p-8 font-body-md overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
        
        {!seciliRapor && (
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <h1 className="font-headline-lg text-headline-lg text-primary uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-4xl">history</span>
              Geçmiş Oyun Raporları
            </h1>
            <button
              onClick={onGeri}
              className="bg-surface-variant text-on-surface font-data-md uppercase py-2 px-4 border border-outline btn-shadow hover:bg-primary-container hover:text-background transition-colors"
            >
              Ana Menüye Dön
            </button>
          </div>
        )}

        {yukleniyor && !seciliRapor && (
          <div className="text-primary font-headline-md uppercase animate-pulse py-10 text-center">Raporlar Aranıyor...</div>
        )}

        {!yukleniyor && raporlar.length === 0 && !seciliRapor && (
          <div className="bg-surface-container border border-outline p-8 text-center text-on-surface-variant font-data-lg uppercase">
            Henüz tamamlanmış bir oyunun (raporun) bulunmuyor.
          </div>
        )}

        {!yukleniyor && !seciliRapor && raporlar.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raporlar.map((rapor, index) => {
              const tarih = new Date(rapor.created_at).toLocaleDateString("tr-TR", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              return (
                <div 
                  key={rapor.id || index} 
                  onClick={() => setSeciliRapor(rapor)}
                  className="bg-surface-container border border-outline card-shadow p-6 flex flex-col gap-3 cursor-pointer hover:border-primary transition-colors group"
                >
                  <div className="font-data-sm text-data-sm uppercase text-on-surface-variant flex justify-between">
                    <span>Oyun {raporlar.length - index}</span>
                    <span>{tarih}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                    {rapor.profile_type || "Bilinmeyen Profil"}
                  </h3>
                  <div className="font-data-md text-data-md text-primary mt-auto pt-4 border-t border-outline-variant">
                    Servet: {money(rapor.net_worth)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {seciliRapor && (
          <div className="bg-surface-container border border-outline card-shadow p-6 md:p-10">
            {renderRaporDetay(seciliRapor)}
          </div>
        )}
      </div>
    </div>
  )
}
