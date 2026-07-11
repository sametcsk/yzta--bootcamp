import { useState } from "react"
import { supabase } from "./supabaseClient"

export default function GirisSayfasi({ onGirisBasarili }) {
  const [mod, setMod] = useState("giris") // "giris" | "kayit"
  const [email, setEmail] = useState("")
  const [sifre, setSifre] = useState("")
  const [karakterAdi, setKarakterAdi] = useState("")
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState(null)
  const [bilgi, setBilgi] = useState(null)

  async function gonder(e) {
    e.preventDefault()
    setHata(null)
    setBilgi(null)
    setYukleniyor(true)

    try {
      if (mod === "kayit") {
        if (!karakterAdi.trim()) {
          setHata("Karakter adı boş olamaz.")
          setYukleniyor(false)
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password: sifre,
          options: { data: { display_name: karakterAdi.trim() } },
        })
        if (error) throw error

        if (data.session) {
          onGirisBasarili(data.session)
        } else {
          setBilgi("Kayıt oluşturuldu. E-postana gelen onay linkine tıklayıp tekrar giriş yap.")
          setMod("giris")
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre })
        if (error) throw error
        onGirisBasarili(data.session)
      }
    } catch (err) {
      setHata(err.message || "Bir hata oluştu.")
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop font-body-md">
      <div className="w-full max-w-md flex flex-col gap-stack-md">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">terminal</span>
          <h1 className="font-headline-lg text-headline-lg font-black text-primary uppercase tracking-tighter">
            FINSIM_OS
          </h1>
        </div>

        <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col gap-stack-sm">
          <div className="flex border-b border-outline-variant mb-2">
            <button
              type="button"
              onClick={() => { setMod("giris"); setHata(null); setBilgi(null) }}
              className={`flex-1 py-2 font-data-sm text-data-sm uppercase ${mod === "giris" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant"
                }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMod("kayit"); setHata(null); setBilgi(null) }}
              className={`flex-1 py-2 font-data-sm text-data-sm uppercase ${mod === "kayit" ? "text-primary border-b-2 border-primary font-bold" : "text-on-surface-variant"
                }`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={gonder} className="flex flex-col gap-3">
            {mod === "kayit" && (
              <div className="flex flex-col gap-1">
                <label className="font-data-sm text-data-sm uppercase text-on-surface-variant">
                  Karakter Adı
                </label>
                <input
                  type="text"
                  value={karakterAdi}
                  onChange={(e) => setKarakterAdi(e.target.value)}
                  required
                  className="bg-surface-container-low border border-outline p-2 text-on-surface font-body-md focus:border-primary outline-none"
                  placeholder="Leaderboard'da görünecek isim"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="font-data-sm text-data-sm uppercase text-on-surface-variant">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-surface-container-low border border-outline p-2 text-on-surface font-body-md focus:border-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-data-sm text-data-sm uppercase text-on-surface-variant">Şifre</label>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                required
                minLength={6}
                className="bg-surface-container-low border border-outline p-2 text-on-surface font-body-md focus:border-primary outline-none"
              />
            </div>

            {hata && (
              <div className="bg-error-container border border-error p-2 text-on-error-container font-data-sm text-data-sm">
                {hata}
              </div>
            )}
            {bilgi && (
              <div className="bg-surface-container-high border border-outline p-2 text-primary font-data-sm text-data-sm">
                {bilgi}
              </div>
            )}

            <button
              type="submit"
              disabled={yukleniyor}
              className="mt-2 bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 btn-shadow border border-outline font-bold disabled:opacity-50"
            >
              {yukleniyor ? "İŞLENİYOR..." : mod === "kayit" ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
