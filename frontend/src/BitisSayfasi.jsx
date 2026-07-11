import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

function money(value) {
  return `₺${Number(value || 0).toLocaleString("tr-TR")}`
}

export default function BitisSayfasi({
  bitisSebebi,
  finalRapor,
  finalRaporLoading,
  finalRaporHata,
  yas,
  yil,
  toplamDeger,
  nakit,
  oturum,
  onTekrarDene,
  onTekrarOyna,
}) {
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [kaydedildi, setKaydedildi] = useState(false)
  const [kayitHatasi, setKayitHatasi] = useState(null)
  const [liderlik, setLiderlik] = useState([])
  const [liderlikYukleniyor, setLiderlikYukleniyor] = useState(false)

  const sebepMetni =
    bitisSebebi === "yas_siniri"
      ? "85 yaşına ulaştın. Uzun bir hayat sürdün."
      : "Beklenmedik bir şekilde hayatın sona erdi."

  // Final rapor hazır olunca run'ı bir kez kaydet
  useEffect(() => {
    if (!finalRapor || finalRaporLoading || kaydedildi || kaydediliyor || !oturum) return

    async function kaydet() {
      setKaydediliyor(true)
      setKayitHatasi(null)
      try {
        const displayName = oturum.user.user_metadata?.display_name || "İsimsiz Oyuncu"
        const { error } = await supabase.from("runs").insert({
          user_id: oturum.user.id,
          display_name: displayName,
          net_worth: toplamDeger,
          final_age: yas,
          final_year: yil,
          profile_type: finalRapor.profile_type,
          dominant_bias: finalRapor.dominant_bias,
        })
        if (error) throw error
        setKaydedildi(true)
      } catch (err) {
        console.error(err)
        setKayitHatasi(err.message || "Run kaydedilemedi.")
      } finally {
        setKaydediliyor(false)
      }
    }
    kaydet()
  }, [finalRapor, finalRaporLoading, oturum])

  // Kayıt başarılı olunca leaderboard'u çek
  useEffect(() => {
    if (!kaydedildi) return

    async function liderlikCek() {
      setLiderlikYukleniyor(true)
      try {
        const { data, error } = await supabase
          .from("runs")
          .select("display_name, net_worth, final_age, profile_type")
          .order("net_worth", { ascending: false })
          .limit(20)
        if (error) throw error
        setLiderlik(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLiderlikYukleniyor(false)
      }
    }
    liderlikCek()
  }, [kaydedildi])

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md">
      <div className="flex-1 flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-stack-lg">
        <div className="w-full max-w-2xl flex flex-col gap-stack-md">
          {/* Başlık */}
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">terminal</span>
            <h1 className="font-headline-lg text-headline-lg font-black text-primary uppercase tracking-tighter">
              FINSIM_OS — OTURUM KAPANDI
            </h1>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant card-shadow p-stack-md font-data-sm text-data-sm">
            <div className="text-on-surface-variant mb-1">
              <span className="text-primary">{">"}</span> {sebepMetni}
            </div>
            <div className="text-on-surface-variant mb-1">
              <span className="text-primary">{">"}</span> Son yıl: {yil} · Yaş: {yas}
            </div>
            {kaydedildi && (
              <div className="text-primary font-bold uppercase mt-2">
                <span>{">"}</span> RUN LİDERLİK TABLOSUNA KAYDEDİLDİ
              </div>
            )}
            {kayitHatasi && (
              <div className="text-error font-bold uppercase mt-2">
                <span>{">"}</span> RUN KAYDEDİLEMEDİ: {kayitHatasi}
              </div>
            )}
          </div>

          {/* Final durum özeti */}
          <div className="grid grid-cols-2 gap-gutter">
            <div className="bg-surface-container border border-outline card-shadow p-stack-sm">
              <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">Net Servet</div>
              <div className="font-data-lg text-data-lg text-primary">{money(toplamDeger)}</div>
            </div>
            <div className="bg-surface-container border border-outline card-shadow p-stack-sm">
              <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">Nakit Rezervi</div>
              <div className="font-data-lg text-data-lg text-primary">{money(nakit)}</div>
            </div>
          </div>

          {/* Final rapor durumları */}
          {finalRaporLoading && (
            <div className="bg-surface-container border border-outline card-shadow p-stack-md flex items-center gap-2 text-primary font-data-sm animate-pulse">
              <span className="material-symbols-outlined">sync</span>
              DAVRANIŞSAL RAPOR OLUŞTURULUYOR...
            </div>
          )}

          {!finalRaporLoading && finalRaporHata && (
            <div className="bg-error-container border border-error card-shadow p-stack-md flex flex-col gap-3">
              <div className="font-headline-md text-headline-md text-on-error-container uppercase">
                Rapor Oluşturulamadı
              </div>
              <p className="text-on-error-container text-body-md">
                Final rapor alınırken bir sorun oluştu. Tekrar deneyebilirsin.
              </p>
              <button
                onClick={onTekrarDene}
                className="self-start bg-primary-container text-background font-data-lg text-data-lg uppercase py-2 px-6 btn-shadow border border-outline font-bold"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {!finalRaporLoading && finalRapor && (
            <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col gap-stack-sm">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h2 className="font-headline-md text-headline-md text-on-surface uppercase">
                  {finalRapor.title}
                </h2>
                <span className="material-symbols-outlined text-on-surface-variant">insights</span>
              </div>

              <div className="font-data-sm text-data-sm uppercase text-primary">
                {finalRapor.profile_name} · {finalRapor.decision_count} KARAR
              </div>

              {finalRapor.dominant_bias_name_tr && (
                <div className="bg-surface-container-high p-2 border-l-2 border-primary font-data-sm text-primary">
                  BASKIN EĞİLİM: {finalRapor.dominant_bias_name_tr}
                </div>
              )}

              <p className="text-on-surface-variant text-body-md">{finalRapor.summary}</p>

              {finalRapor.strengths?.length > 0 && (
                <div>
                  <div className="font-data-sm text-data-sm uppercase text-on-surface mb-1">Güçlü Yönler</div>
                  <ul className="list-disc list-inside text-on-surface-variant text-body-md">
                    {finalRapor.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {finalRapor.growth_areas?.length > 0 && (
                <div>
                  <div className="font-data-sm text-data-sm uppercase text-on-surface mb-1">Gelişim Alanları</div>
                  <ul className="list-disc list-inside text-on-surface-variant text-body-md">
                    {finalRapor.growth_areas.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {finalRapor.next_reflection && (
                <blockquote className="italic border-l border-outline-variant pl-4 text-on-surface opacity-80">
                  {finalRapor.next_reflection}
                </blockquote>
              )}

              <p className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50 mt-2">
                {finalRapor.disclaimer}
              </p>
            </div>
          )}

          {/* Leaderboard */}
          {kaydedildi && (
            <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col gap-stack-sm">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Liderlik Tablosu</h2>
                <span className="material-symbols-outlined text-on-surface-variant">leaderboard</span>
              </div>

              {liderlikYukleniyor && (
                <div className="text-primary font-data-sm text-data-sm uppercase animate-pulse">Yükleniyor...</div>
              )}

              {!liderlikYukleniyor && liderlik.length > 0 && (
                <div className="flex flex-col gap-1">
                  {liderlik.map((satir, i) => {
                    const buSensin =
                      satir.display_name === oturum?.user?.user_metadata?.display_name &&
                      satir.net_worth === toplamDeger
                    return (
                      <div
                        key={i}
                        className={`flex justify-between items-center p-2 font-data-sm text-data-sm uppercase ${buSensin
                          ? "bg-primary-container text-background font-bold"
                          : "bg-surface-container-low text-on-surface-variant"
                          }`}
                      >
                        <span>
                          #{i + 1} {satir.display_name}
                        </span>
                        <span>{money(satir.net_worth)}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {!liderlikYukleniyor && liderlik.length === 0 && (
                <div className="text-on-surface-variant font-data-sm text-data-sm uppercase opacity-50">
                  Henüz kayıt yok.
                </div>
              )}
            </div>
          )}

          <button
            onClick={onTekrarOyna}
            className="mt-stack-md w-full md:w-auto self-start bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 px-8 btn-shadow border border-outline font-bold transition-transform hover:-translate-y-0.5"
          >
            Tekrar Oyna
          </button>
        </div>
      </div>
    </div>
  )
}
