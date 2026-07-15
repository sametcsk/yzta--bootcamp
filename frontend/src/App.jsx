import IntroEkrani from "./IntroEkrani"
import VarlikSayfasi from "./VarlikSayfasi"
import YasamStandartlari from "./YasamStandartlari"
import { VARSAYILAN_STANDARTLAR, YASAM_STANDARTLARI, toplamAylikUsd, yasamKalitesiEtkisi } from "./data/standartlar"
import PortfoySayfasi from "./PortfoySayfasi"
import AcilisSayfasi from "./AcilisSayfasi"
import { useEffect, useRef, useState } from "react"
import BitisSayfasi from "./BitisSayfasi"
import GirisSayfasi from "./GirisSayfasi"
import { supabase, supabaseAktif } from "./supabaseClient"
import { pozisyonAdiGetir, levelCarpaniGetir } from "./data/meslekler"


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")

const INITIAL_STATE = {
  enf_rejim: 0,
  enf_sakin_yil: 0,
  enf_kriz_mevcut: null,
  enf_kriz_dusus: null,
  kur: 40.0,
  kur_ham: 40.0,
  reden_sayaci: 0,
  altin_usd: 2600.0,
  altin_zirve: 2600.0,
  altin_rejim: 1,
  altin_durgun_yil: 0,
  altin_boga_yil: 7,
  faiz: 12.0,
  bist: 100.0,
  mevduat_birikim: 100.0,
  emlak_endeksi_usd: 100.0,
}

const VARLIK_META = {
  altin: { icon: "Au", ad: "Altın", type: "Nadir Varlık", risk: "Orta", tone: "gold", score: 2 },
  bist: { icon: "BI", ad: "BIST", type: "Riskli Varlık", risk: "Yüksek", tone: "green", score: 3 },
  dolar: { icon: "$", ad: "Dolar", type: "Döviz", risk: "Orta", tone: "blue", score: 2 },
  mevduat: { icon: "%", ad: "Mevduat", type: "Güvenli Alan", risk: "Düşük", tone: "violet", score: 1 },
}

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE)
  const [yil, setYil] = useState(2025)
  const [yas, setYas] = useState(25)
  const [sonuc, setSonuc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [gecmis, setGecmis] = useState([])
  const [bars, setBars] = useState({ sabir: 50, mutluluk: 50 })
  const [nakit, setNakit] = useState(25000)
  const [introTamamlandi, setIntroTamamlandi] = useState(false)
  const [acilisGecildi, setAcilisGecildi] = useState(false)
  const [karakterProfili, setKarakterProfili] = useState(null)
  const [aktifSayfa, setAktifSayfa] = useState("ana")
  const [yillikGelir, setYillikGelir] = useState(0)
  const [yasamGideri, setYasamGideri] = useState(
    toplamAylikUsd(VARSAYILAN_STANDARTLAR, YASAM_STANDARTLARI) * 40 * 12
  )
  const [portfoy, setPortfoy] = useState({
    altin_gram: 0,
    bist_adet: 0,
    dolar: 0,
    mevduat_tl: 0,
  })
  const [fiyatlar, setFiyatlar] = useState({
    altin_try_gram: (2600 * 40) / 31.1,
    bist_endeks: 100,
    dolar_try: 40,
    mev_faiz_oran: 0.12,
  })
  const [standartlar, setStandartlar] = useState(VARSAYILAN_STANDARTLAR)
  const [finalRaporHata, setFinalRaporHata] = useState(false)
  const [isYeri, setIsYeri] = useState(null)
  const [isLevel, setIsLevel] = useState(1)
  const [temelMaas, setTemelMaas] = useState(0)
  const [emlakPiyasasi, setEmlakPiyasasi] = useState([])
  const [sahipOlunanEvler, setSahipOlunanEvler] = useState([])
  const [oturulanEvId, setOturulanEvId] = useState(null)
  const [kiraGeliriYillik, setKiraGeliriYillik] = useState(0)

  const nakitRef = useRef(nakit)

  const nakitiGuncelle = (yeniNakit) => {
    nakitRef.current = yeniNakit
    setNakit(yeniNakit)
  }
  const [mevcutEvent, setMevcutEvent] = useState(null)
  const [eventGecmisi, setEventGecmisi] = useState({})
  const [tetiklenenler, setTetiklenenler] = useState([])
  const [eventKayitlari, setEventKayitlari] = useState([])
  const [coachYorumu, setCoachYorumu] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [finalRapor, setFinalRapor] = useState(null)
  const [finalRaporLoading, setFinalRaporLoading] = useState(false)
  const [fiyatGecmisi, setFiyatGecmisi] = useState({
    altin: [],
    bist: [],
    dolar: [],
    mevduat: []
  })
  const [portfoyGecmisi, setPortfoyGecmisi] = useState([])
  const [portfoyEndeksi, setPortfoyEndeksi] = useState(100)
  const [enflasyonEndeksi, setEnflasyonEndeksi] = useState(100)
  const [enflasyonGecmisi, setEnflasyonGecmisi] = useState([])
  const [emlakEndeksiGecmisi, setEmlakEndeksiGecmisi] = useState([])
  const [varlikKatsayilari, setVarlikKatsayilari] = useState({
    altin: null,   // null = hiç alınmadı
    bist: null,
    dolar: null,
    mevduat: null,
  })
  const [oyunBitti, setOyunBitti] = useState(false)
  const [bitisSebebi, setBitisSebebi] = useState(null) // "yas_siniri" | "erken_olum"
  const [oturum, setOturum] = useState(null)
  const [sonEventEtkisi, setSonEventEtkisi] = useState({ sabir: 0, mutluluk: 0 })
  const [sonucKarti, setSonucKarti] = useState(null) // { baslik, metin } | null
  const [redenominasyonKarti, setRedenominasyonKarti] = useState(null)
  const bekleyenEventKaydiRef = useRef(null)


  useEffect(() => {
    if (oyunBitti && !finalRapor && !finalRaporLoading) {
      finalRaporuOlustur()
    }
  }, [oyunBitti])

  useEffect(() => {
    if (!supabaseAktif) return
    supabase.auth.getSession().then(({ data }) => setOturum(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setOturum(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])


  async function yilAtla() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/yil-atla`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...gameState,
          yil: yil,
          yas: yas,
          event_gecmisi: eventGecmisi,
          tetiklenenler: tetiklenenler,
          portfoy: portfoy,
          is_yeri: isYeri,
          is_level: isLevel,
        }),
      })
      const data = await res.json()

      setGameState({
        enf_rejim: data.enf_rejim,
        enf_sakin_yil: data.enf_sakin_yil,
        enf_kriz_mevcut: data.enf_kriz_mevcut,
        enf_kriz_dusus: data.enf_kriz_dusus,
        kur: data.kur,
        kur_ham: data.kur_ham,
        reden_sayaci: data.reden_sayaci,
        altin_usd: data.altin_usd,
        altin_zirve: data.altin_zirve,
        altin_rejim: data.altin_rejim,
        altin_durgun_yil: data.altin_durgun_yil,
        altin_boga_yil: data.altin_boga_yil,
        faiz: data.faiz,
        bist: data.bist,
        mevduat_birikim: data.mevduat_birikim,
        emlak_endeksi_usd: data.emlak_endeksi_usd,
      })

      const yeniTemelMaas = Math.round(temelMaas * (1 + data.yil_sonucu.enflasyon / 100))
      const yeniGelir = Math.round(yeniTemelMaas * levelCarpaniGetir(isYeri, isLevel))
      const yeniGider = Math.round(yasamGideri * (1 + data.yil_sonucu.enflasyon / 100))
      setTemelMaas(yeniTemelMaas)
      setYillikGelir(yeniGelir)

      const yeniDolarKuru = data.yil_sonucu.fiyatlar.dolar_try
      setYasamGideri(Math.round(toplamAylikUsd(standartlar, YASAM_STANDARTLARI) * yeniDolarKuru * 12))

      // Portföy Getirisi Hesaplama (Sıfır Atma Durumunu Göze Alarak)
      let w_start_gercek = nakitRef.current + Math.round(
        portfoy.altin_gram * fiyatlar.altin_try_gram +
        portfoy.bist_adet * fiyatlar.bist_endeks +
        portfoy.dolar * fiyatlar.dolar_try +
        portfoy.mevduat_tl
      )

      if (data.yil_sonucu.redenominasyon) {
        w_start_gercek = w_start_gercek / 1000
      }

      const nakitReel = data.yil_sonucu.redenominasyon ? nakitRef.current / 1000 : nakitRef.current
      const mevduatReel = data.yil_sonucu.redenominasyon ? portfoy.mevduat_tl / 1000 : portfoy.mevduat_tl

      const w_appreciated = nakitReel + Math.round(
        portfoy.altin_gram * data.yil_sonucu.fiyatlar.altin_try_gram +
        portfoy.bist_adet * data.yil_sonucu.fiyatlar.bist_endeks +
        portfoy.dolar * data.yil_sonucu.fiyatlar.dolar_try +
        mevduatReel * (1 + data.yil_sonucu.mev_faiz / 100)
      )

      const getiriOrani = w_start_gercek > 0 ? (w_appreciated - w_start_gercek) / w_start_gercek : 0
      const yeniPortfoyEndeksi = portfoyEndeksi * (1 + getiriOrani)
      setPortfoyEndeksi(yeniPortfoyEndeksi)

      const yeniEmlakEndeksiUsd = data.emlak_endeksi_usd
      setEmlakPiyasasi(data.yil_sonucu.emlak_piyasasi || [])
      const kiraGeliriToplam = sahipOlunanEvler
        .filter(ev => ev.kirada)
        .reduce((toplam, ev) => {
          const guncelDeger = Math.round(ev.fiyat_usd_taban * (yeniEmlakEndeksiUsd / 100) * yeniDolarKuru)
          return toplam + Math.round(ev.kira_orani * guncelDeger)
        }, 0)
      setKiraGeliriYillik(kiraGeliriToplam)

      let yeniNakit = nakitRef.current + yeniGelir - yeniGider + kiraGeliriToplam
      if (data.yil_sonucu.redenominasyon) {
        yeniNakit = Math.round(yeniNakit / 1000)
        setYillikGelir(Math.round(yeniGelir / 1000))
        setYasamGideri(Math.round(yeniGider / 1000))
        setTemelMaas(Math.round(yeniTemelMaas / 1000))
      }
      nakitiGuncelle(yeniNakit)

      if (data.yil_sonucu.fiyatlar) {
        setFiyatlar(data.yil_sonucu.fiyatlar)
      }

      setPortfoy(prev => ({
        ...prev,
        mevduat_tl: Math.round(prev.mevduat_tl * (1 + data.yil_sonucu.mev_faiz / 100)),
      }))

      if (data.yil_sonucu.redenominasyon) {
        // ENFLASYON VE PORTFÖY ENDEKSLERİ 1000'E BÖLÜNMEZ (Onlar kümülatif performanstır)
        setPortfoy(prev => ({
          ...prev,
          mevduat_tl: Math.round(prev.mevduat_tl / 1000),
        }))
        setFiyatlar(prev => ({
          altin_try_gram: Math.round(prev.altin_try_gram / 1000),
          bist_endeks: Math.round(prev.bist_endeks / 1000),
          dolar_try: Math.round(prev.dolar_try / 1000),
          mev_faiz_oran: prev.mev_faiz_oran,
        }))
        // Geçmiş fiyatları böl ki grafiklerde kopma olmasın
        setFiyatGecmisi(prev => ({
          altin: prev.altin.map(p => ({ ...p, fiyat: Math.round(p.fiyat / 1000) })),
          bist: prev.bist.map(p => ({ ...p, fiyat: Math.round(p.fiyat / 1000) })),
          dolar: prev.dolar.map(p => ({ ...p, fiyat: p.fiyat / 1000 })),
          mevduat: prev.mevduat,
        }))
        // Varlık katsayıları kümülatif performans olduğu için 1000'e BÖLÜNMEZ.

        setRedenominasyonKarti({
          baslik: "SİSTEM MÜDAHALESİ: PARA BİRİMİ REFORMU",
          metin: "Aşırı enflasyonist baskı ve sürdürülemez fiyatlama davranışları neticesinde Merkez Bankası 'Redenominasyon' (Para biriminden sıfır atılması) kararı almıştır. Tüm varlık fiyatlamaları, maaşlar ve piyasa endekslerinden 3 sıfır atıldı. Makroekonomik parametreler sıfırlanmasa da defter değerleriniz yeni sisteme göre revize edildi."
        })
      }

      const yeniYil = yil + 1
      const yeniYas = yas + 1
      setYil(yeniYil)
      setYas(yeniYas)



      // Yaşam kalitesi debuff
      const kalite = yasamKalitesiEtkisi(standartlar, YASAM_STANDARTLARI)

      // Finansal debuff
      let finansalDebuff = { mutluluk: 0, sabir: 0 }
      if (yeniGelir < yeniGider) {
        finansalDebuff = { mutluluk: -8, sabir: -5 }
      } else if (yeniGelir < yeniGider * 1.2) {
        finansalDebuff = { mutluluk: -3, sabir: -2 }
      }

      // Barları güncelle
      setBars(prev => ({
        sabir: Math.min(80, Math.max(20, prev.sabir + kalite.sabir + finansalDebuff.sabir)),
        mutluluk: Math.min(80, Math.max(20, prev.mutluluk + kalite.mutluluk + finansalDebuff.mutluluk)),
      }))

      setSonuc(data.yil_sonucu)
      setFiyatGecmisi(prev => ({
        altin: [...prev.altin, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.altin_try_gram }],
        bist: [...prev.bist, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_endeks }],
        dolar: [...prev.dolar, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.dolar_try }],
        mevduat: [...prev.mevduat, { yil: yil + 1, fiyat: data.yil_sonucu.mev_faiz }],
      }))
      // Varlık katsayılarını güncelle
      setVarlikKatsayilari(prev => {
        const getiriler = {
          altin: data.yil_sonucu.reel_altin / 100,
          bist: data.yil_sonucu.reel_bist / 100,
          dolar: data.yil_sonucu.reel_doviz / 100,
          mevduat: data.yil_sonucu.reel_mevduat / 100,
        }
        return {
          altin: prev.altin !== null ? prev.altin * (1 + getiriler.altin) : null,
          bist: prev.bist !== null ? prev.bist * (1 + getiriler.bist) : null,
          dolar: prev.dolar !== null ? prev.dolar * (1 + getiriler.dolar) : null,
          mevduat: prev.mevduat !== null ? prev.mevduat * (1 + getiriler.mevduat) : null,
        }
      })


      if (data.yil_sonucu.event) {
        setCoachYorumu(null)
        setMevcutEvent(data.yil_sonucu.event)
        setEventGecmisi(prev => ({
          ...prev,
          [data.yil_sonucu.event.id]: yil + 1
        }))
        if (data.yil_sonucu.event.tek_seferlik) {
          setTetiklenenler(prev => [...prev, data.yil_sonucu.event.id])
        }
      }
      setGecmis(prev => [...prev, { yil: yeniYil, yas: yeniYas, ...data.yil_sonucu }])
      // Enflasyon endeksi güncelle
      const yeniEnflasyonEndeksi = enflasyonEndeksi * (1 + data.yil_sonucu.enflasyon / 100)
      setEnflasyonEndeksi(yeniEnflasyonEndeksi)
      setEnflasyonGecmisi(prev => [...prev, { yil: yil + 1, deger: Math.round(yeniEnflasyonEndeksi) }])
      setEmlakEndeksiGecmisi(prev => [...prev, { yil: yil + 1, deger: yeniEmlakEndeksiUsd }])

      // Portföy endeksi geçmişi (Maaş etkisi arındırılmış yatırım performansı)
      setPortfoyGecmisi(prev => [...prev, { yil: yil + 1, deger: yeniPortfoyEndeksi }])

      if (yeniYas >= 85) {
        setOyunBitti(true)
        setBitisSebebi("yas_siniri")
      } else if (yeniYas >= 75) {
        if (Math.random() < erkenOlumOlasiligi(yeniYas)) {
          setOyunBitti(true)
          setBitisSebebi("erken_olum")
        }
      }

    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function introyuBitir(sonuc) {
    setBars({ sabir: sonuc.sabir, mutluluk: sonuc.mutluluk })
    nakitiGuncelle(sonuc.nakit)
    setYillikGelir(sonuc.yillikGelir)
    setTemelMaas(sonuc.yillikGelir)
    setIsYeri(sonuc.meslek || null)

    try {
      const res = await fetch(`${API_BASE_URL}/ajanlar/profil`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: sonuc.answers || sonuc.cevaplar || [],
          cevaplar: sonuc.cevaplar || sonuc.answers || [],
          nakit: sonuc.nakit,
          sabir: sonuc.sabir,
          mutluluk: sonuc.mutluluk,
          yillik_gelir: sonuc.yillikGelir,
        }),
      })

      if (res.ok) {
        setKarakterProfili(await res.json())
      } else {
        setKarakterProfili(null)
      }
    } catch (error) {
      console.error(error)
      setKarakterProfili(null)
    }

    setIntroTamamlandi(true)
  }

  function tekrarOyna() {
    window.location.reload()
  }

  function standartDegis(kategori, secimId) {
    const yeniSecimler = { ...standartlar, [kategori]: secimId }
    setStandartlar(yeniSecimler)
    setYasamGideri(Math.round(toplamAylikUsd(yeniSecimler, YASAM_STANDARTLARI) * fiyatlar.dolar_try * 12))
  }

  function agirlikliSecim(dallar) {
    const rastgele = Math.random()
    let toplam = 0
    for (const dal of dallar) {
      toplam += dal.ihtimal
      if (rastgele <= toplam) return dal
    }
    return dallar[dallar.length - 1]
  }

  function levelDegistir(delta) {
    if (!delta) return
    setIsLevel(prev => Math.min(5, Math.max(1, prev + delta)))
  }

  async function kocYorumunuGetir(eventKaydi) {
    setCoachYorumu(null)
    setCoachLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/ajanlar/koc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventKaydi),
      })
      if (!res.ok) throw new Error("AI koç yorumu alınamadı.")
      setCoachYorumu(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setCoachLoading(false)
    }
  }

  function sonucKartiniKapat() {
    setSonucKarti(null)
    if (bekleyenEventKaydiRef.current) {
      kocYorumunuGetir(bekleyenEventKaydiRef.current)
      bekleyenEventKaydiRef.current = null
    }
  }

  async function eventSeceneginiSec(secenek) {
    if (!mevcutEvent) return

    const secilenEvent = mevcutEvent

    setSonEventEtkisi({
      sabir: secenek.sabir_etki || 0,
      mutluluk: secenek.mutluluk_etki || 0
    })

    setBars(prev => ({
      sabir: Math.min(80, Math.max(20, prev.sabir + (secenek.sabir_etki || 0))),
      mutluluk: Math.min(80, Math.max(20, prev.mutluluk + (secenek.mutluluk_etki || 0))),
    }))

    if (secenek.nakit_etki_usd && secenek.nakit_etki_usd !== 0) {
      const tlEtkisi = Math.round(secenek.nakit_etki_usd * fiyatlar.dolar_try)
      nakitiGuncelle(Math.max(20000, nakitRef.current + tlEtkisi))
    }

    if (secenek.yillik_gelir_usd) {
      setYillikGelir(Math.round(secenek.yillik_gelir_usd * fiyatlar.dolar_try * 12))
    }

    if (secenek.gelir_degisim) {
      const { tip, min, max, oran } = secenek.gelir_degisim
      if (tip === "randomize") {
        const carpan = rastgeleGelirCarpani(min, max)
        setYillikGelir(prev => Math.round(prev * carpan))
      } else if (tip === "sabit_oran") {
        setYillikGelir(prev => Math.round(prev * oran))
      }
    }

    const eventKaydi = {
      year: yil,
      event_id: secilenEvent.id,
      event_title: secilenEvent.baslik,
      selected_option: secenek.metin,
      bias_label: secilenEvent.bias_etiketi,
      profile_type: karakterProfili?.profile_type || null,
      yil,
      event_baslik: secilenEvent.baslik,
      bias: secilenEvent.bias_etiketi,
      secim_id: secenek.id,
      secim_metin: secenek.metin,
    }

    setEventKayitlari(prev => [...prev, eventKaydi])
    setFinalRapor(null)
    setMevcutEvent(null)

    if (secenek.olasilik_sonuclari && secenek.olasilik_sonuclari.length > 0) {
      const cikanDal = agirlikliSecim(secenek.olasilik_sonuclari)
      levelDegistir(cikanDal.level_etki)
      bekleyenEventKaydiRef.current = eventKaydi
      setSonucKarti({ baslik: secilenEvent.baslik, metin: cikanDal.sonuc_metin })
    } else {
      kocYorumunuGetir(eventKaydi)
    }
  }

  async function finalRaporuOlustur() {
    setFinalRaporLoading(true)
    setFinalRaporHata(false)
    try {
      const res = await fetch(`${API_BASE_URL}/ajanlar/final-rapor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: karakterProfili,
          event_history: eventKayitlari,
          final_state: { year: yil, age: yas, cash: nakit, net_worth: toplamDeger },
        }),
      })
      if (!res.ok) throw new Error("Final raporu oluşturulamadı.")
      setFinalRapor(await res.json())
    } catch (error) {
      console.error(error)
      setFinalRaporHata(true)
    } finally {
      setFinalRaporLoading(false)
    }
  }

  function varlikAl(varlik, miktar) {
    const miktarSayi = parseFloat(miktar)
    if (!miktarSayi || miktarSayi <= 0) return

    let maliyet = 0
    if (varlik === "altin") maliyet = miktarSayi * fiyatlar.altin_try_gram
    if (varlik === "bist") maliyet = miktarSayi * fiyatlar.bist_endeks
    if (varlik === "dolar") maliyet = miktarSayi * fiyatlar.dolar_try
    if (varlik === "mevduat") maliyet = miktarSayi

    if (maliyet > nakitRef.current) {
      alert("Yeterli nakit yok!")
      return
    }

    nakitiGuncelle(Math.round(nakitRef.current - maliyet))
    // Katsayıyı başlat — null ise 1.0'dan başla, değilse devam et
    setVarlikKatsayilari(prev => ({
      ...prev,
      [varlik]: prev[varlik] === null ? 1.0 : prev[varlik]
    }))
    setPortfoy(prev => ({
      ...prev,
      altin_gram: varlik === "altin" ? prev.altin_gram + miktarSayi : prev.altin_gram,
      bist_adet: varlik === "bist" ? prev.bist_adet + miktarSayi : prev.bist_adet,
      dolar: varlik === "dolar" ? prev.dolar + miktarSayi : prev.dolar,
      mevduat_tl: varlik === "mevduat" ? prev.mevduat_tl + miktarSayi : prev.mevduat_tl,
    }))
  }

  function varlikSat(varlik, miktar) {
    const miktarSayi = parseFloat(miktar)
    if (!miktarSayi || miktarSayi <= 0) return

    let gelir = 0
    if (varlik === "altin" && portfoy.altin_gram >= miktarSayi) gelir = miktarSayi * fiyatlar.altin_try_gram
    if (varlik === "bist" && portfoy.bist_adet >= miktarSayi) gelir = miktarSayi * fiyatlar.bist_endeks
    if (varlik === "dolar" && portfoy.dolar >= miktarSayi) gelir = miktarSayi * fiyatlar.dolar_try
    if (varlik === "mevduat" && portfoy.mevduat_tl >= miktarSayi) gelir = miktarSayi

    if (gelir === 0) {
      alert("Yeterli varlık yok!")
      return
    }

    nakitiGuncelle(Math.round(nakitRef.current + gelir))
    setPortfoy(prev => ({
      ...prev,
      altin_gram: varlik === "altin" ? prev.altin_gram - miktarSayi : prev.altin_gram,
      bist_adet: varlik === "bist" ? prev.bist_adet - miktarSayi : prev.bist_adet,
      dolar: varlik === "dolar" ? prev.dolar - miktarSayi : prev.dolar,
      mevduat_tl: varlik === "mevduat" ? prev.mevduat_tl - miktarSayi : prev.mevduat_tl,
    }))
  }

  function evGuncelDegerHesapla(ev) {
    return Math.round(ev.fiyat_usd_taban * (gameState.emlak_endeksi_usd / 100) * fiyatlar.dolar_try)
  }

  function evdeYasamayaBasla(evId) {
    setSahipOlunanEvler(prev => prev.map(e => e.id === evId ? { ...e, kirada: false } : e))
    setOturulanEvId(evId)
    standartDegis("konut", "kendi_ev")
  }

  function evdenCik() {
    setOturulanEvId(null)
    standartDegis("konut", "orta")
  }

  function evSatinAl(ev) {
    if (nakitRef.current < ev.fiyat_tl) {
      alert("Yeterli nakit yok!")
      return
    }
    nakitiGuncelle(Math.round(nakitRef.current - ev.fiyat_tl))
    setSahipOlunanEvler(prev => [...prev, {
      id: ev.id,
      segment: ev.segment,
      gorsel: ev.gorsel,
      fiyat_usd_taban: ev.fiyat_usd_taban,
      kira_orani: ev.kira_orani,
      kirada: false,
      alis_fiyati: ev.fiyat_tl,
      alis_yili: yil,
    }])
    setEmlakPiyasasi(prev => prev.filter(e => e.id !== ev.id))
  }

  function evKiraDurumunuDegistir(evId) {
    if (evId === oturulanEvId) return // oturulan evi kiraya veremezsin
    setSahipOlunanEvler(prev => prev.map(e => e.id === evId ? { ...e, kirada: !e.kirada } : e))
  }

  function evSat(evId) {
    const ev = sahipOlunanEvler.find(e => e.id === evId)
    if (!ev) return
    if (evId === oturulanEvId) evdenCik()
    const guncelDeger = evGuncelDegerHesapla(ev)
    nakitiGuncelle(Math.round(nakitRef.current + guncelDeger))
    setSahipOlunanEvler(prev => prev.filter(e => e.id !== evId))
  }

  const portfoyDegeri = Math.round(
    portfoy.altin_gram * fiyatlar.altin_try_gram +
    portfoy.bist_adet * fiyatlar.bist_endeks +
    portfoy.dolar * fiyatlar.dolar_try +
    portfoy.mevduat_tl
  )
  const emlakToplamDeger = sahipOlunanEvler.reduce((toplam, ev) => toplam + evGuncelDegerHesapla(ev), 0)
  const toplamDeger = nakit + portfoyDegeri + emlakToplamDeger
  const netAkis = yillikGelir + kiraGeliriYillik - yasamGideri
  const krizMi = gameState.enf_rejim === 1
  const riskProfili = karakterProfili?.risk_level
    ? riskEtiketi(karakterProfili.risk_level)
    : "Belirleniyor"
  const profilAdi = karakterProfili?.profile_name || "Profil Hazırlanıyor"
  const seviye = Math.max(1, yas - 24)

  const guncelKalite = yasamKalitesiEtkisi(standartlar, YASAM_STANDARTLARI)
  let guncelFinansalDebuff = { mutluluk: 0, sabir: 0 }
  if (yillikGelir < yasamGideri) {
    guncelFinansalDebuff = { mutluluk: -8, sabir: -5 }
  } else if (yillikGelir < yasamGideri * 1.2) {
    guncelFinansalDebuff = { mutluluk: -3, sabir: -2 }
  }

  const sabirTooltip = (
    <div className="text-xs flex flex-col gap-1 text-on-surface-variant font-bold">
      <div>Yaşam Giderleri: <span className={guncelKalite.sabir >= 0 ? "text-[#34d399]" : "text-error"}>{guncelKalite.sabir > 0 ? '+' : ''}{guncelKalite.sabir}</span> / yıl</div>
      {guncelFinansalDebuff.sabir !== 0 && <div>Finansal Durum: <span className="text-error">{guncelFinansalDebuff.sabir}</span> / yıl</div>}
      {sonEventEtkisi.sabir !== 0 && <div>Son Random Event: <span className={sonEventEtkisi.sabir > 0 ? "text-[#34d399]" : "text-error"}>{sonEventEtkisi.sabir > 0 ? '+' : ''}{sonEventEtkisi.sabir}</span></div>}
    </div>
  )

  const mutlulukTooltip = (
    <div className="text-xs flex flex-col gap-1 text-on-surface-variant font-bold">
      <div>Yaşam Giderleri: <span className={guncelKalite.mutluluk >= 0 ? "text-[#34d399]" : "text-error"}>{guncelKalite.mutluluk > 0 ? '+' : ''}{guncelKalite.mutluluk}</span> / yıl</div>
      {guncelFinansalDebuff.mutluluk !== 0 && <div>Finansal Durum: <span className="text-error">{guncelFinansalDebuff.mutluluk}</span> / yıl</div>}
      {sonEventEtkisi.mutluluk !== 0 && <div>Son Random Event: <span className={sonEventEtkisi.mutluluk > 0 ? "text-[#34d399]" : "text-error"}>{sonEventEtkisi.mutluluk > 0 ? '+' : ''}{sonEventEtkisi.mutluluk}</span></div>}
    </div>
  )

  const gelirTooltip = (
    <div className="text-xs flex flex-col gap-1 text-on-surface-variant font-bold">
      <div>Maaş Geliri: <span className="text-[#34d399]">{money(yillikGelir)}</span> / yıl</div>
      {kiraGeliriYillik > 0 && <div>Kira Geliri: <span className="text-[#34d399]">{money(kiraGeliriYillik)}</span> / yıl</div>}
    </div>
  )


  if (!acilisGecildi) {
    return <AcilisSayfasi onBaslat={() => setAcilisGecildi(true)} fiyatlar={fiyatlar} />
  }
  if (supabaseAktif && !oturum) {
    return <GirisSayfasi onGirisBasarili={(session) => setOturum(session)} />
  }
  if (!introTamamlandi) {
    return <IntroEkrani onBitis={introyuBitir} />
  }
  if (oyunBitti) {
    return (
      <BitisSayfasi
        bitisSebebi={bitisSebebi}
        finalRapor={finalRapor}
        finalRaporLoading={finalRaporLoading}
        finalRaporHata={finalRaporHata}
        yas={yas}
        yil={yil}
        toplamDeger={toplamDeger}
        nakit={nakit}
        onTekrarDene={finalRaporuOlustur}
        onTekrarOyna={tekrarOyna}
        oturum={oturum}
      />
    )
  }
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col md:flex-row relative font-body-md">
      {/* Mobile Top Nav */}
      <header className="md:hidden flex justify-between items-center px-margin-mobile py-stack-sm w-full bg-surface border-b border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-50">
        <div className="font-headline-lg text-headline-lg font-black text-primary uppercase tracking-tighter">
          FINSIM_OS
        </div>
        <div className="flex gap-4">
          <button onClick={() => setAktifSayfa("ana")}>
            <span className={`material-symbols-outlined ${aktifSayfa === "ana" ? "text-primary" : "text-on-surface-variant"}`}>terminal</span>
          </button>
          <button onClick={() => setAktifSayfa("varliklar")}>
            <span className={`material-symbols-outlined ${aktifSayfa === "varliklar" ? "text-primary" : "text-on-surface-variant"}`}>trending_up</span>
          </button>
          <button onClick={() => setAktifSayfa("portfoy")}>
            <span className={`material-symbols-outlined ${aktifSayfa === "portfoy" ? "text-primary" : "text-on-surface-variant"}`}>account_balance</span>
          </button>
          <button onClick={() => setAktifSayfa("standartlar")}>
            <span className={`material-symbols-outlined ${aktifSayfa === "standartlar" ? "text-primary" : "text-on-surface-variant"}`}>psychology</span>
          </button>
        </div>
      </header>

      {/* Desktop Side Nav */}
      <nav className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low border-r border-outline-variant p-stack-md overflow-y-auto sticky top-0 z-40">
        <div className="mb-stack-lg">
          <div className="font-headline-md text-headline-md text-primary font-black uppercase tracking-tighter mb-2">FINSIM_OS</div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 bg-surface-variant rounded flex items-center justify-center border border-outline">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
            <div>
              <div className="font-data-sm text-data-sm uppercase text-on-surface">{profilAdi}</div>
              <div className="font-data-sm text-data-sm uppercase text-primary">{pozisyonAdiGetir(isYeri, isLevel) || "Pozisyon Belirsiz"}</div>
              <div className="font-data-sm text-data-sm uppercase text-error">Yaş: {yas} | Lvl: {seviye}</div>
            </div>
          </div>
        </div>
        <div className="flex-grow">
          {[
            { id: "ana", label: "Ana Defter", icon: "terminal" },
            { id: "varliklar", label: "Piyasa Verileri", icon: "trending_up" },
            { id: "portfoy", label: "Varlık Portföyü", icon: "account_balance" },
            { id: "standartlar", label: "Psikolojik Profil", icon: "psychology" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAktifSayfa(item.id)}
              className={`w-full flex items-center p-stack-md mb-stack-sm font-data-sm text-data-sm uppercase transition-colors ${aktifSayfa === item.id
                ? "bg-primary text-on-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                }`}
            >
              <span className="material-symbols-outlined mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <button
            className="w-full bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 btn-shadow border border-outline transition-transform font-bold mb-6 disabled:opacity-50"
            onClick={yilAtla}
            disabled={loading || coachLoading || finalRaporLoading || !!mevcutEvent || !!sonucKarti || !!redenominasyonKarti || oyunBitti}
          >
            {loading ? "SİSTEM_MEŞGUL" : `YIL_${yil + 1} ÇALIŞTIR`}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto">
        {oyunBitti && (
          <div className="bg-primary-container border border-outline card-shadow p-stack-md text-background mb-stack-lg">
            <div className="font-headline-md text-headline-md font-black uppercase">Oyun Sona Erdi</div>
            <p className="font-data-sm text-data-sm uppercase mt-1 mb-4">
              {bitisSebebi === "yas_siniri" ? "85 yaşına ulaştın." : "Beklenmedik bir şekilde hayatın sona erdi."}
            </p>
            <button
              onClick={tekrarOyna}
              className="bg-background text-primary px-4 py-2 font-bold uppercase border border-outline btn-shadow transition-transform hover:bg-surface-container"
            >
              YENİDEN BAŞLA
            </button>
          </div>
        )}
        {aktifSayfa === "ana" && (
          <div className="flex flex-col gap-stack-lg">
            {/* TEST BUTONU - GEÇİCİ */}
            <button
              onClick={() => { setYas(54); setYil(2056); }}
              className="bg-error text-on-error p-2 text-xs font-bold w-fit border border-outline btn-shadow"
            >
              [DEV TEST] 54 YAŞINA ATLA
            </button>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant pb-stack-md">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary uppercase">Ana Defter</h1>
                <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Yıl: {yil} | {riskProfili}</p>
              </div>
              <div className="flex items-center gap-4 bg-surface-container-high p-3 border border-outline card-shadow">
                <div className="text-right">
                  <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">Net Servet</div>
                  <div className="font-data-lg text-data-lg text-primary">{money(toplamDeger)}</div>
                </div>
                <div className="h-8 w-px bg-outline-variant mx-2"></div>
                <div className="text-right">
                  <div className="font-data-sm text-data-sm text-on-surface-variant uppercase">Nakit Rezervi</div>
                  <div className="font-data-lg text-data-lg text-primary">{money(nakit)}</div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <MetricCard
                label="Yıllık Gelir"
                value={money(yillikGelir + kiraGeliriYillik)}
                hint={`Net akış: ${money(netAkis)}`}
                tooltipNodes={gelirTooltip}
              />
              <MetricCard label="Sabır" value={`${bars.sabir}/100`} hint="Psikolojik" tooltipNodes={sabirTooltip} />
              <MetricCard label="Mutluluk" value={`${bars.mutluluk}/100`} hint="Psikolojik" tooltipNodes={mutlulukTooltip} />
              <MetricCard
                label="Enflasyon"
                value={sonuc ? `%${sonuc.enflasyon}` : "—"}
                hint={sonuc ? sonuc.enf_durum : "SİSTEM_HAZIR"}
                alert={krizMi}
              />
            </div>

            {/* Event Panel or Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              {/* Event Section */}
              <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Sistem Olayı</h2>
                  <span className="material-symbols-outlined text-on-surface-variant">warning</span>
                </div>
                {sonucKarti ? (
                  <div className="flex flex-col gap-4">
                    <div className="font-data-sm text-data-sm text-primary uppercase">SONUÇ_{yil}</div>
                    <h3 className="font-headline-md text-headline-md text-error">{sonucKarti.baslik}</h3>
                    <p className="text-on-surface-variant text-body-md">{sonucKarti.metin}</p>
                    <button
                      onClick={sonucKartiniKapat}
                      className="self-start bg-primary-container text-background font-data-lg text-data-lg uppercase py-2 px-6 btn-shadow border border-outline font-bold mt-2"
                    >
                      Devam Et
                    </button>
                  </div>
                ) : redenominasyonKarti ? (
                  <div className="flex flex-col gap-4">
                    <div className="font-data-sm text-data-sm text-error uppercase font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined">warning</span>
                      ZORUNLU GÜNCELLEME_{yil}
                    </div>
                    <h3 className="font-headline-md text-headline-md text-error">{redenominasyonKarti.baslik}</h3>
                    <p className="text-on-surface-variant text-body-md leading-relaxed">{redenominasyonKarti.metin}</p>
                    <button
                      onClick={() => setRedenominasyonKarti(null)}
                      className="self-start bg-primary-container text-background font-data-lg text-data-lg uppercase py-2 px-6 btn-shadow border border-outline font-bold mt-2 hover:bg-primary transition-colors"
                    >
                      Anlaşıldı, Devam Et
                    </button>
                  </div>
                ) : mevcutEvent ? (
                  <div className="flex flex-col gap-4">
                    <div className="font-data-sm text-data-sm text-primary uppercase">UYARI_{yil}</div>
                    <h3 className="font-headline-md text-headline-md text-error">{mevcutEvent.baslik}</h3>
                    <p className="text-on-surface-variant text-body-md">{mevcutEvent.metin}</p>
                    <div className="flex flex-col gap-2 mt-4">
                      {mevcutEvent.secenekler.map((s, i) => {
                        const kilitli = s.kilit && (
                          (s.kilit.tur === "sabir" && bars.sabir < s.kilit.min) ||
                          (s.kilit.tur === "mutluluk" && bars.mutluluk < s.kilit.min) ||
                          (s.kilit.tur === "nakit" && nakit < s.kilit.min) ||
                          (s.kilit.tur === "nakit_usd" && nakit < s.kilit.min * fiyatlar.dolar_try)
                        )
                        const olumluDal = s.olasilik_sonuclari?.find(d => d.level_etki > 0)
                        return (
                          <button
                            key={i}
                            disabled={kilitli}
                            onClick={() => !kilitli && eventSeceneginiSec(s)}
                            className={`p-3 text-left border ${kilitli
                              ? "bg-surface-container-highest border-outline-variant text-on-surface-variant opacity-50 cursor-not-allowed"
                              : "bg-surface-variant border-outline hover:border-primary hover:bg-surface-container-high transition-colors text-on-surface btn-shadow"
                              }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="font-data-sm text-data-sm uppercase mb-1">{kilitli ? "KİLİTLİ" : `SEÇ_0${i + 1}`}</div>
                              {s.risk_seviyesi && s.risk_seviyesi !== "risksiz" && (
                                <span className={`text-[10px] px-1 font-bold uppercase ${s.risk_seviyesi === "yüksek" ? "bg-error text-background" :
                                    s.risk_seviyesi === "orta" ? "bg-[#f5c842] text-black" :
                                      "bg-[#34d399] text-black"
                                  }`}>
                                  {s.risk_seviyesi} risk
                                </span>
                              )}
                            </div>
                            <div className="font-bold">{s.metin}</div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {s.mutluluk_etki !== undefined && s.mutluluk_etki !== 0 && (
                                <span className={`text-[10px] px-1 font-bold uppercase ${s.mutluluk_etki > 0 ? "bg-[#34d399] text-black" : "bg-error text-background"}`}>
                                  Mutluluk {s.mutluluk_etki > 0 ? '+' : ''}{s.mutluluk_etki}
                                </span>
                              )}
                              {s.sabir_etki !== undefined && s.sabir_etki !== 0 && (
                                <span className={`text-[10px] px-1 font-bold uppercase ${s.sabir_etki > 0 ? "bg-[#34d399] text-black" : "bg-error text-background"}`}>
                                  Sabır {s.sabir_etki > 0 ? '+' : ''}{s.sabir_etki}
                                </span>
                              )}
                              {s.nakit_etki_usd !== undefined && s.nakit_etki_usd !== 0 && (
                                <span className={`text-[10px] px-1 font-bold uppercase ${s.nakit_etki_usd > 0 ? "bg-[#34d399] text-black" : "bg-error text-background"}`}>
                                  Nakit {s.nakit_etki_usd > 0 ? '+' : ''}{s.nakit_etki_usd}$
                                </span>
                              )}
                            </div>
                            {olumluDal && !kilitli && (
                              <div className="text-primary font-data-sm text-data-sm mt-1">
                                İHTİMAL: %{Math.round(olumluDal.ihtimal * 100)} olumlu sonuç
                              </div>
                            )}
                            {kilitli && s.kilit && (
                              <div className="text-error font-data-sm text-data-sm mt-2">
                                GEREKSİNİM: {s.kilit.tur} {s.kilit.min}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-50 p-8 text-center">
                    <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                    <p className="font-data-sm text-data-sm uppercase">BEKLEYEN OLAY YOK</p>
                  </div>
                )}
              </div>

              {/* AI Coach Panel */}
              <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
                  <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Yapay Zeka Analiz Kaydı</h2>
                  <span className="material-symbols-outlined text-on-surface-variant">smart_toy</span>
                </div>
                {coachLoading && (
                  <div className="flex items-center gap-2 text-primary font-data-sm animate-pulse">
                    <span className="material-symbols-outlined">sync</span>
                    DAVRANIŞSAL VERİLER İŞLENİYOR...
                  </div>
                )}
                {coachYorumu && (
                  <div className="flex flex-col gap-3">
                    <div className="font-data-sm text-data-sm text-primary uppercase">KAYIT_{yil}</div>
                    <h3 className="font-bold text-lg text-on-surface">{coachYorumu.coach_title}</h3>
                    <div className="bg-surface-container-high p-2 border-l-2 border-primary font-data-sm text-primary">
                      TESPİT EDİLEN EĞİLİM: {coachYorumu.bias_name_tr}
                    </div>
                    <p className="text-on-surface-variant text-sm">{coachYorumu.coach_comment}</p>
                    <blockquote className="italic border-l border-outline-variant pl-4 text-on-surface opacity-80 mt-2">
                      {coachYorumu.reflection_question}
                    </blockquote>
                  </div>
                )}
                {!coachLoading && !coachYorumu && (
                  <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-50 p-8 text-center">
                    <span className="material-symbols-outlined text-4xl mb-2">history</span>
                    <p className="font-data-sm text-data-sm uppercase">KARAR KAYITLARI BEKLENİYOR</p>
                  </div>
                )}
              </div>
            </div>

            {/* Year Summary */}
            {sonuc && (
              <div className={`border card-shadow p-stack-md flex flex-col ${krizMi ? "bg-error-container border-error" : "bg-surface-container border-outline"}`}>
                <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-2">
                  <h2 className={`font-headline-md text-headline-md uppercase ${krizMi ? "text-on-error-container" : "text-on-surface"}`}>Yıl Özeti</h2>
                  <span className="font-data-sm text-data-sm uppercase">{sonuc.enf_durum}</span>
                </div>
                <p className={krizMi ? "text-on-error-container" : "text-on-surface-variant"}>
                  Enflasyon: <strong>%{sonuc.enflasyon}</strong>.
                  BIST reel getiri: <strong className={sonuc.reel_bist >= 0 ? "text-primary" : "text-error"}>{formatPct(sonuc.reel_bist)}</strong>,
                  Altın reel getiri: <strong className={sonuc.reel_altin >= 0 ? "text-primary" : "text-error"}>{formatPct(sonuc.reel_altin)}</strong>.
                </p>
                {sonuc.redenominasyon && (
                  <div className="mt-2 text-primary font-bold uppercase text-sm border border-primary p-2 inline-block">
                    {sonuc.redenominasyon}: Para birimi yenilendi.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {aktifSayfa === "varliklar" && (
          <VarlikSayfasi
            fiyatGecmisi={fiyatGecmisi}
            fiyatlar={fiyatlar}
            portfoy={portfoy}
            sonuc={sonuc}
            varlikAl={varlikAl}
            varlikSat={varlikSat}
            nakit={nakit}
            toplamDeger={toplamDeger}
            krizMi={krizMi}
            emlakPiyasasi={emlakPiyasasi}
            sahipOlunanEvler={sahipOlunanEvler}
            evSatinAl={evSatinAl}
            evKiraDurumunuDegistir={evKiraDurumunuDegistir}
            evSat={evSat}
            evGuncelDegerHesapla={evGuncelDegerHesapla}
            oturulanEvId={oturulanEvId}
            evdeYasamayaBasla={evdeYasamayaBasla}
            evdenCik={evdenCik}
            emlakEndeksiGecmisi={emlakEndeksiGecmisi}
          />
        )}

        {aktifSayfa === "standartlar" && (
          <YasamStandartlari
            secimler={standartlar}
            onSecimDegis={standartDegis}
            nakit={nakit}
            portfoy={portfoy}
            dolarKuru={fiyatlar.dolar_try}
            yasamGideri={yasamGideri}
            oturulanEvVarMi={!!oturulanEvId}
          />
        )}

        {aktifSayfa === "portfoy" && (
          <PortfoySayfasi
            fiyatGecmisi={fiyatGecmisi}
            portfoyGecmisi={portfoyGecmisi}
            enflasyonGecmisi={enflasyonGecmisi}
            portfoy={portfoy}
            fiyatlar={fiyatlar}
            nakit={nakit}
            varlikKatsayilari={varlikKatsayilari}
          />
        )}
      </main>
    </div>
  )
}

function MetricCard({ label, value, hint, alert, tooltipNodes }) {
  return (
    <div className={`relative group border card-shadow p-stack-md flex flex-col ${alert ? "bg-error-container border-error" : "bg-surface-container border-outline"}`}>
      <div className={`font-data-sm text-data-sm uppercase mb-1 ${alert ? "text-on-error-container" : "text-on-surface-variant"}`}>
        {label}
      </div>
      <div className={`font-headline-md text-headline-md mb-2 ${alert ? "text-on-error-container" : "text-on-surface"}`}>
        {value}
      </div>
      <div className={`font-data-sm text-data-sm uppercase mt-auto ${alert ? "text-on-error-container opacity-80" : "text-on-surface-variant opacity-50"}`}>
        {hint}
      </div>
      {tooltipNodes && (
        <div className="absolute hidden group-hover:flex flex-col bottom-full left-0 mb-2 w-max bg-surface-container-highest border border-outline p-3 shadow-lg z-50">
          {tooltipNodes}
        </div>
      )}
    </div>
  )
}

function money(value) {
  return `₺${Number(value).toLocaleString("tr-TR")}`
}

function formatPct(val) {
  return val >= 0 ? `+%${Math.abs(val).toFixed(1)}` : `-%${Math.abs(val).toFixed(1)}`
}

function pctClass(val) {
  return val >= 0 ? "positive" : "negative"
}

function erkenOlumOlasiligi(yas) {
  const minYas = 75
  const maxYas = 84
  const minOlasilik = 0.03
  const maxOlasilik = 0.65
  if (yas <= minYas) return minOlasilik
  if (yas >= maxYas) return maxOlasilik
  const oran = (yas - minYas) / (maxYas - minYas)
  return minOlasilik + oran * (maxOlasilik - minOlasilik)
}

function riskEtiketi(riskLevel) {
  if (riskLevel === "dusuk") return "Düşük"
  if (riskLevel === "yuksek") return "Yüksek"
  return "Orta"
}

function rastgeleGelirCarpani(min, max) {
  return 1 + (Math.random() * (max - min) + min)
}
