import { useEffect, useRef, useState } from "react"
import { BASLANGIC, SORULAR } from "./data/sorular"

function kilitliMi(kilit, nakit, sabir, mutluluk) {
  if (!kilit) return false
  if (kilit.tur === "nakit") return nakit < kilit.min
  if (kilit.tur === "sabir") return sabir < kilit.min
  if (kilit.tur === "mutluluk") return mutluluk < kilit.min
  if (kilit.tur === "gelistirilmemis") return true
  return false
}

export default function IntroEkrani({ onBitis }) {
  const [soruIndex, setSoruIndex] = useState(0)
  const [secim, setSecim] = useState(null)
  const [nakit, setNakit] = useState(BASLANGIC.nakit)
  const [sabir, setSabir] = useState(BASLANGIC.sabir)
  const [mutluluk, setMutluluk] = useState(BASLANGIC.mutluluk)
  const [gelir, setGelir] = useState(0)
  const [universiteGitti, setUniversiteGitti] = useState(true)
  const cevaplarRef = useRef([])
  const ilerlemeKilitliRef = useRef(false)
  const meslekRef = useRef(null)

  const soru = SORULAR[soruIndex]
  const seciliSecenek = secim !== null ? soru.secenekler[secim] : null

  useEffect(() => {
    ilerlemeKilitliRef.current = false
  }, [soruIndex])

  function devamEt() {
    if (secim === null || ilerlemeKilitliRef.current) return
    ilerlemeKilitliRef.current = true
    const s = soru.secenekler[secim]

    if (soru.id === 4 && secim === 2) {
      setUniversiteGitti(false)
    }
    if (soru.id === 6 && s.meslek) {
      meslekRef.current = s.meslek
    }

    const yeniNakit = Math.max(20000, nakit + s.nakit)
    const yeniSabir = Math.min(80, Math.max(20, sabir + s.sabir))
    const yeniMutluluk = Math.min(80, Math.max(20, mutluluk + s.mutluluk))
    const yeniCevap = {
      question_id: soru.id,
      category: soru.kategori,
      selected_text: s.metin,
      effects: {
        nakit: s.nakit,
        sabir: s.sabir,
        mutluluk: s.mutluluk,
        risk: s.risk ?? 1,
      },
    }
    const yeniCevaplar = [...cevaplarRef.current, yeniCevap]
    cevaplarRef.current = yeniCevaplar

    setNakit(yeniNakit)
    setSabir(yeniSabir)
    setMutluluk(yeniMutluluk)

    if (s.gelir) setGelir(s.gelir)

    if (soruIndex + 1 >= SORULAR.length) {
      onBitis({
        nakit: yeniNakit,
        sabir: yeniSabir,
        mutluluk: yeniMutluluk,
        yillikGelir: s.gelir || gelir || 216000,
        answers: yeniCevaplar,
        meslek: meslekRef.current,
      })
    } else {
      setSoruIndex((oncekiIndex) => oncekiIndex + 1)
      setSecim(null)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md relative">
      <button
        onClick={() => onBitis({
          nakit: 250000,
          sabir: 60,
          mutluluk: 60,
          yillikGelir: 300000,
          answers: [],
          meslek: "beyaz_yaka",
        })}
        className="absolute top-4 right-4 text-data-sm font-data-sm opacity-30 hover:opacity-100 hover:text-primary uppercase"
      >
        [GELİŞTİRİCİ_ATLA]
      </button>

      <div className="w-full max-w-4xl border border-outline bg-surface-container card-shadow flex flex-col md:flex-row">
        {/* Left Side: Mission Path */}
        <aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-outline-variant p-stack-md flex flex-col bg-surface-container-low">
          <div className="font-headline-lg text-headline-lg text-primary uppercase tracking-tighter mb-4">
            BAŞLANGIÇ_DİZİSİ
          </div>
          <div className="font-data-sm text-data-sm uppercase text-on-surface-variant mb-6 border-b border-outline-variant pb-2">
            AŞAMA {soruIndex + 1} / {SORULAR.length}
          </div>

          <div className="flex flex-col gap-3 flex-grow">
            {SORULAR.map((gorev, i) => (
              <div
                key={gorev.kategori}
                className={`flex items-center gap-3 font-data-sm text-data-sm uppercase ${i === soruIndex ? "text-primary font-bold" :
                  i < soruIndex ? "text-on-surface opacity-60" : "text-on-surface-variant opacity-30"
                  }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {i < soruIndex ? "check_circle" : i === soruIndex ? "radio_button_checked" : "radio_button_unchecked"}
                </span>
                <span>{gorev.kategori}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-outline-variant pt-4">
            <div className="font-data-sm text-data-sm uppercase text-on-surface-variant mb-2">Anlık Durum</div>
            <div className="flex flex-col gap-1">
              <Stat label="NAKİT" value={`₺${(nakit / 1000).toFixed(0)}k`} />
              <Stat label="SABIR" value={sabir} />
              <Stat label="MUTLULUK" value={mutluluk} />
            </div>
          </div>
        </aside>

        {/* Right Side: Main Question */}
        <div className="w-full md:w-2/3 p-stack-lg flex flex-col">
          <div className="font-data-sm text-data-sm text-primary uppercase mb-2">
            GİRDİ_BEKLENİYOR
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">
            {soru.soru}
          </h2>

          <div className="flex flex-col gap-3 flex-grow mb-stack-lg">
            {soru.secenekler.map((s, i) => {
              const kilitli = kilitliMi(s.kilit, nakit, sabir, mutluluk) || (soru.id === 6 && i === 0 && !universiteGitti)
              const secili = secim === i

              return (
                <button
                  key={i}
                  onClick={() => !kilitli && setSecim(i)}
                  disabled={kilitli}
                  className={`flex flex-col p-4 text-left border transition-colors ${kilitli
                    ? "bg-surface-container-highest border-outline-variant opacity-50 cursor-not-allowed"
                    : secili
                      ? "bg-primary-container border-primary text-background card-shadow font-bold"
                      : "bg-surface-variant border-outline hover:border-primary hover:bg-surface-container-high text-on-surface"
                    }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-data-sm text-data-sm uppercase mb-1">
                      {kilitli ? "KİLİTLİ" : `SEÇ_0${i + 1}`}
                    </span>
                    <span className="flex gap-2">
                      {s.nakit !== 0 && <Effect value={s.nakit > 0 ? "NAKİT+" : "NAKİT-"} positive={s.nakit > 0} />}
                      {s.sabir !== 0 && <Effect value={s.sabir > 0 ? "SABIR+" : "SABIR-"} positive={s.sabir > 0} />}
                      {s.mutluluk !== 0 && <Effect value={s.mutluluk > 0 ? "MUTLULUK+" : "MUTLULUK-"} positive={s.mutluluk > 0} />}
                    </span>
                  </div>
                  <div className="text-lg">
                    {kilitli ? "Gizli" : s.metin}
                  </div>
                  {s.gelir_aciklama && !kilitli && (
                    <div className="text-sm opacity-80 mt-1 font-data-sm uppercase">GELİR: {s.gelir_aciklama}</div>
                  )}
                  {kilitli && soru.id === 6 && i === 0 && !universiteGitti && (
                    <div className="text-error font-data-sm text-data-sm mt-2 uppercase">
                      GEREKSİNİM: ÜNİVERSİTE EĞİTİMİ
                    </div>
                  )}
                  {kilitli && s.kilit && !(soru.id === 6 && i === 0 && !universiteGitti) && (
                    <div className="text-error font-data-sm text-data-sm mt-2 uppercase">
                      GEREKSİNİM: {kilitMetni(s.kilit)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex justify-between items-center border-t border-outline-variant pt-4 mt-auto">
            <div className="text-on-surface-variant text-sm flex-1 mr-4">
              {seciliSecenek ? "Onay bekleniyor..." : "Devam etmek için bir seçenek belirleyin."}
            </div>
            <button
              className={`bg-primary text-background font-data-lg text-data-lg uppercase py-3 px-8 font-bold border border-outline transition-transform ${secim === null ? "opacity-50 cursor-not-allowed" : "btn-shadow hover:bg-primary-fixed"
                }`}
              onClick={devamEt}
              disabled={secim === null}
            >
              {soruIndex + 1 >= SORULAR.length ? "SİSTEMİ BAŞLAT" : "ONAYLA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex justify-between font-data-sm text-data-sm uppercase">
      <span className="text-on-surface-variant">{label}</span>
      <strong className="text-primary">{value}</strong>
    </div>
  )
}

function Effect({ value, positive }) {
  return (
    <span className={`text-[10px] px-1 font-bold ${positive ? "bg-[#34d399] text-black" : "bg-error text-background"}`}>
      {value}
    </span>
  )
}

function kilitMetni(kilit) {
  if (kilit.tur === "nakit") return `₺${(kilit.min / 1000).toFixed(0)}k NAKİT`
  if (kilit.tur === "sabir") return `${kilit.min} SABIR`
  if (kilit.tur === "mutluluk") return `${kilit.min} MUTLULUK`
  if (kilit.tur === "gelistirilmemis") return kilit.mesaj?.toUpperCase() || "YAKINDA"
  return "KİLİTLİ"
}

