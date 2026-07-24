import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

export default function AnaMenu({ onYeniOyun, onDevamEt, onGecmisRaporlar, oturum }) {
  const [saveBulundu, setSaveBulundu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function checkSave() {
      if (!oturum) return
      try {
        const { data, error } = await supabase
          .from("game_saves")
          .select("updated_at")
          .eq("user_id", oturum.user.id)
          .maybeSingle()

        if (error && error.code !== "PGRST116") throw error
        setSaveBulundu(!!data)
      } catch (err) {
        console.error("Save kontrol hatası:", err)
        setError("Kayıt verisi kontrol edilemedi.")
      } finally {
        setLoading(false)
      }
    }
    checkSave()
  }, [oturum])

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-4">
        <div className="font-headline-md uppercase animate-pulse">Menü Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-body-md">
      {/* Arka plan süslemesi */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-surface to-background"></div>
      </div>

      <div className="z-10 bg-surface-container border border-outline card-shadow max-w-lg w-full p-8 flex flex-col gap-6 text-center">
        <h1 className="font-headline-lg text-headline-lg text-primary uppercase border-b border-outline-variant pb-4 mb-2">
          FINSIM_OS v1.0
        </h1>
        
        {error && (
          <div className="text-error font-data-sm text-data-sm uppercase bg-error-container p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-4">
          <button
            onClick={onYeniOyun}
            className="bg-primary-container text-background font-headline-md text-headline-md uppercase py-4 px-6 btn-shadow border border-outline font-bold transition-transform hover:-translate-y-1"
          >
            Yeni Oyun Başlat
          </button>
          
          {saveBulundu && (
            <button
              onClick={onDevamEt}
              className="bg-surface-variant text-on-surface font-headline-md text-headline-md uppercase py-4 px-6 btn-shadow border border-outline font-bold transition-transform hover:-translate-y-1"
            >
              Kaldığın Yerden Devam Et
            </button>
          )}

          <button
            onClick={onGecmisRaporlar}
            className="bg-background text-primary font-headline-sm text-headline-sm uppercase py-3 px-6 btn-shadow border border-outline font-bold transition-transform hover:-translate-y-1 mt-4"
          >
            Geçmiş Raporlarım
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-outline-variant font-data-sm text-data-sm text-on-surface-variant opacity-70">
          Kullanıcı: {oturum?.user?.user_metadata?.display_name || oturum?.user?.email}
        </div>
      </div>
    </div>
  )
}
