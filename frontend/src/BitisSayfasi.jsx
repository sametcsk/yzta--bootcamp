import { useEffect, useRef, useState } from "react"
import { supabase } from "./supabaseClient"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"


function money(value) {
  return `₺${Number(value || 0).toLocaleString("tr-TR")}`
}

function FirsatMaliyetiGrafigi({ veri }) {
  const [kumulatif, setKumulatif] = useState(true)

  if (!veri || veri.length < 2) return null

  const grafikVerisi = (() => {
    if (kumulatif) {
      let gercek = 100
      let enIyi = 100
      return veri.map(satir => {
        gercek *= (1 + satir.gercekGetiri / 100)
        enIyi *= (1 + satir.enIyiGetiri / 100)
        return { yil: satir.yil, "Gerçek": Math.round(gercek), "Fırsat Maliyeti": Math.round(enIyi) }
      })
    }
    return veri.map(satir => ({
      yil: satir.yil,
      "Gerçek": satir.gercekGetiri,
      "Fırsat Maliyeti": satir.enIyiGetiri,
    }))
  })()

  return (
    <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col gap-stack-sm">
      <div className="flex justify-between items-center border-b border-outline-variant pb-2">
        <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Fırsat Maliyeti</h2>
        <button
          onClick={() => setKumulatif(prev => !prev)}
          className="font-data-sm text-data-sm uppercase border border-outline px-3 py-1 hover:border-primary transition-colors"
        >
          {kumulatif ? "Yıllık Göster" : "Kümülatif Göster"}
        </button>
      </div>

      <p className="text-on-surface-variant text-body-md">
        Üstteki çizgi, her yıl elindeki sermayeyi o yılın en iyi performans gösteren
        varlığına yatırmış olsaydın ulaşacağın noktayı gösteriyor. Alttaki çizgi,
        gerçekte aldığın sonuç. Aradaki fark bir eleştiri değil — sadece hangi
        kararların ne kadara mal olduğunu görebilmen için.
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={grafikVerisi}>
            <XAxis dataKey="yil" tick={{ fontSize: 11, fill: "#8a8168" }} />
            <YAxis tick={{ fontSize: 11, fill: "#8a8168" }} />
            <Tooltip
              contentStyle={{ background: "#110e06", border: "1px solid #4e4634", borderRadius: 0, fontFamily: "JetBrains Mono", fontSize: 12 }}
            />
            <Line type="monotone" dataKey="Fırsat Maliyeti" stroke="#f87171" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Gerçek" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
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
  firsatMaliyetiGecmisi,
  nakitGerekenEventSayisi = 0,
  nakitYetersizKalanEventSayisi = 0,
  iflasSayisi = 0,
}) {
  const [kaydedildi, setKaydedildi] = useState(false)
  const [kayitHatasi, setKayitHatasi] = useState(null)
  const [liderlik, setLiderlik] = useState([])
  const [liderlikYukleniyor, setLiderlikYukleniyor] = useState(false)
  const kayitBaslatildiRef = useRef(false)

  const sebepMetni =
    bitisSebebi === "yas_siniri"
      ? "85 yaşına ulaştın. Uzun bir hayat sürdün."
      : "Beklenmedik bir şekilde hayatın sona erdi."

  // Final rapor hazır olunca run'ı bir kez kaydet
  useEffect(() => {
    if (!finalRapor || finalRaporLoading || kayitBaslatildiRef.current || !oturum) return
    kayitBaslatildiRef.current = true

    async function kaydet() {
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
      }
    }
    kaydet()
  }, [finalRapor, finalRaporLoading, oturum, toplamDeger, yas, yil])


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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            <div className="bg-surface-container border border-outline card-shadow p-stack-sm">
              <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">Net Servet</div>
              <div className="font-data-lg text-data-lg text-primary">{money(toplamDeger)}</div>
            </div>
            <div className="bg-surface-container border border-outline card-shadow p-stack-sm">
              <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">Nakit Rezervi</div>
              <div className="font-data-lg text-data-lg text-primary">{money(nakit)}</div>
            </div>
            <div className="bg-surface-container border border-outline card-shadow p-stack-sm">
              <div className="font-data-sm text-data-sm uppercase text-on-surface-variant">Kaçırılan Fırsatlar</div>
              <div className="font-data-lg text-data-lg text-primary">{nakitYetersizKalanEventSayisi} <span className="text-data-sm text-on-surface-variant">/ {nakitGerekenEventSayisi}</span></div>
            </div>
            <div className="bg-error-container border border-error card-shadow p-stack-sm">
              <div className="font-data-sm text-data-sm uppercase text-on-error-container opacity-80">İflas Sayısı</div>
              <div className="font-data-lg text-data-lg text-on-error-container">{iflasSayisi}</div>
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

              {/* Psikolojik Profil Barları */}
              {finalRapor.bias_scores && (
                <div className="mt-4 mb-2 bg-surface-variant p-4 border border-outline">
                  <div className="font-data-sm text-data-sm uppercase text-on-surface mb-3 font-bold border-b border-outline-variant pb-2">Davranışsal Finans Eğilimleri (0-100)</div>
                  <div className="flex flex-col gap-3">
                    {[
                      { key: 'loss_aversion', label: 'Kayıptan Kaçınma' },
                      { key: 'anchoring', label: 'Çıpalama (Fiyata Bağlılık)' },
                      { key: 'disposition_effect', label: 'Elden Çıkarma (Kârı Erken Kesme)' },
                      { key: 'mental_accounting', label: 'Zihinsel Muhasebe (Havadan Gelen Parayı Harcama)' },
                      { key: 'present_bias', label: 'Anlık Haz Eğilimi (Borçla Lüks)' }
                    ].map(bias => {
                      const score = finalRapor.bias_scores[bias.key] || 0;
                      return (
                        <div key={bias.key} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-on-surface-variant">
                            <span>{bias.label}</span>
                            <span className={score > 70 ? 'text-error' : score > 40 ? 'text-[#f5c842]' : 'text-[#34d399]'}>{score}/100</span>
                          </div>
                          <div className="w-full bg-surface-container-highest h-2 overflow-hidden border border-outline-variant">
                            <div 
                              className={`h-full ${score > 70 ? 'bg-error' : score > 40 ? 'bg-[#f5c842]' : 'bg-[#34d399]'}`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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

              {finalRapor.llm_prompt_payload && (
                <div className="mt-4">
                  <div className="font-data-sm text-data-sm uppercase text-on-surface mb-2">LLM'e Gönderilecek Teşhis Promptu (Simüle Edilmiş)</div>
                  <pre className="bg-[#110e06] p-4 text-[#8a8168] text-xs whitespace-pre-wrap overflow-x-auto border border-[#4e4634] font-mono">
                    {finalRapor.llm_prompt_payload}
                  </pre>
                </div>
              )}

              <p className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-50 mt-4">
                {finalRapor.disclaimer}
              </p>
            </div>
          )}

          {/* Fırsat Maliyeti Grafiği */}
          {!finalRaporLoading && finalRapor && (
            <FirsatMaliyetiGrafigi veri={firsatMaliyetiGecmisi} />
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
