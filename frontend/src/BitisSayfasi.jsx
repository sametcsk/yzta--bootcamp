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
  onTekrarDene,
  onTekrarOyna,
}) {
  const sebepMetni =
    bitisSebebi === "yas_siniri"
      ? "85 yaşına ulaştın. Uzun bir hayat sürdün."
      : "Beklenmedik bir şekilde hayatın sona erdi."

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
            <div className="text-primary font-bold uppercase mt-2">
              <span>{">"}</span> RAPOR HAZIRLANIYOR
            </div>
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
