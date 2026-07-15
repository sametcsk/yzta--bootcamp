export default function ProfilHikayesi({ profil, onDevam }) {
  const hikayeParagraflari = (profil.intro_story || "")
    .split(/\n\s*\n/)
    .filter(Boolean)

  return (
    <main className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md">
      <section className="w-full max-w-2xl border border-outline bg-surface-container-lowest card-shadow">
        <header className="border-b border-outline-variant p-stack-md md:p-stack-lg flex items-start justify-between gap-4">
          <div>
            <div className="font-data-sm text-data-sm text-primary mb-2">
              Profilin hazır
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface max-w-xl">
              25 Yaşına Gelirken
            </h1>
          </div>
          <span className="material-symbols-outlined text-primary text-3xl">auto_stories</span>
        </header>

        <div className="p-stack-md md:p-stack-lg flex flex-col gap-stack-md">
          <div className="font-data-sm text-data-sm text-primary">
            {profil.profile_name}
          </div>

          <div className="flex flex-col gap-5 border-l-2 border-primary pl-5 md:pl-7 py-1">
            {hikayeParagraflari.map((paragraf, index) => (
              <p
                key={index}
                className="text-body-md md:text-body-lg leading-7 text-on-surface-variant"
              >
                {paragraf}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter border-y border-outline-variant py-stack-sm">
            <ProfilBilgisi label="Güçlü Yön" value={profil.main_strength} />
            <ProfilBilgisi label="Gelişim Alanı" value={profil.growth_area} />
          </div>

          <p className="font-data-sm text-data-sm uppercase text-on-surface-variant opacity-60">
            {profil.disclaimer}
          </p>

          <button
            type="button"
            onClick={onDevam}
            className="self-start bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 px-8 btn-shadow border border-outline font-bold transition-transform hover:-translate-y-0.5"
          >
            25 Yaşından Devam Et
          </button>
        </div>
      </section>
    </main>
  )
}

function ProfilBilgisi({ label, value }) {
  return (
    <div>
      <div className="font-data-sm text-data-sm uppercase text-on-surface-variant mb-1">{label}</div>
      <div className="text-on-surface">{value}</div>
    </div>
  )
}
