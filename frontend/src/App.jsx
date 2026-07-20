import IntroEkrani from "./IntroEkrani"
import VarlikSayfasi from "./VarlikSayfasi"
import YasamStandartlari from "./YasamStandartlari"
import { VARSAYILAN_STANDARTLAR, YASAM_STANDARTLARI, toplamAylikUsd, yasamKalitesiEtkisi, luksPuaniHesapla } from "./data/standartlar"
import PortfoySayfasi from "./PortfoySayfasi"
import AcilisSayfasi from "./AcilisSayfasi"
import HikayeEkrani from "./HikayeEkrani"
import KariyerSayfasi from "./KariyerSayfasi"
import BankaSekmesi from "./BankaSekmesi"
import TutorialModal from "./TutorialModal"
import { TutorialProvider, useTutorial } from "./TutorialContext"
import { TUTORIAL_ADIMLARI } from "./TutorialAdimlari"
import { TutorialOdak, TutorialKutusu } from "./TutorialComponents"
import { MESLEKLER, pozisyonAdiGetir, levelCarpaniGetir, yeniIlanlarUret } from "./data/meslekler"
import erkekImg from "./assets/erkek.png"
import kadinImg from "./assets/kadin.png"
import { useEffect, useRef, useState } from "react"
import BitisSayfasi from "./BitisSayfasi"
import GirisSayfasi from "./GirisSayfasi"
import { supabase, supabaseAktif } from "./supabaseClient"
import BorsaSayfasi from "./BorsaSayfasi"
import { formatAssetPrice } from "./utils"

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
  bist_bankacilik: 100.0,
  bist_teknoloji: 100.0,
  bist_insaat: 100.0,
  bist_saglik: 100.0,
  bist_perakende: 100.0,
  mevduat_birikim: 0.0,
  emlak_endeksi_usd: 100.0,
  fisilti_sayaci: 0,
  gelecek_makro: null,
}

const VARLIK_META = {
  altin: { icon: "Au", ad: "Altın", type: "Nadir Varlık", risk: "Orta", tone: "gold", score: 2 },
  bist: { icon: "BI", ad: "Borsa", type: "Riskli Varlık", risk: "Yüksek", tone: "green", score: 3 },
  dolar: { icon: "$", ad: "Dolar", type: "Döviz", risk: "Orta", tone: "blue", score: 2 },
  mevduat: { icon: "%", ad: "Mevduat", type: "Güvenli Alan", risk: "Düşük", tone: "violet", score: 1 },
}

function AppInner() {
  const { aktif: tutorialAktif, mevcutAdim: tutorialMevcutAdim, adimIndex: tutorialAdimi, ileriGit: tutorialIleriGit, setAktif: setTutorialAktif } = useTutorial()

  const [gameState, setGameState] = useState(INITIAL_STATE)
  const [yil, setYil] = useState(2025)
  const [yas, setYas] = useState(18)
  const [sonuc, setSonuc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isLevel, setIsLevel] = useState(1)
  
  // Kariyer ve Eğitim State'leri
  const [sinavPuani, setSinavPuani] = useState(null)
  const [okunanBolum, setOkunanBolum] = useState(null)
  const [universiteYili, setUniversiteYili] = useState(0)
  const [mezunOlunanBolum, setMezunOlunanBolum] = useState(null)
  const [calismaBari, setCalismaBari] = useState(0)
  const [isIlanlari, setIsIlanlari] = useState([])
  const [mezunaKalmaSayisi, setMezunaKalmaSayisi] = useState(0)
  const [buYilSinavaGirdiMi, setBuYilSinavaGirdiMi] = useState(false)
  const [zorluk, setZorluk] = useState("Orta")
  const [sikiCalisAktif, setSikiCalisAktif] = useState(false)
  const [cvGecmisi, setCvGecmisi] = useState([])
  const [maasEndeksi, setMaasEndeksi] = useState(1.0)

  // Banka State'leri
  const [kredi, setKredi] = useState(null)
  const [krediNotu, setKrediNotu] = useState(500)
  const [iflasSayisi, setIflasSayisi] = useState(0)
  const [hacizUyarisiAcik, setHacizUyarisiAcik] = useState(false)
  
  // Bias Heuristics Metrikleri
  const [biasMetrics, setBiasMetrics] = useState({
    luksYasamPuani: 0,
    ihtiyacDisiKrediSayisi: 0,
    panikSatisSayisi: 0,
    dusenBicakAlimSayisi: 0,
    borcluykenYatirimSayisi: 0,
    erkenKarSatisSayisi: 0,
    toplamYil: 0,
    eventSkorlari: {
      present_bias: 0,
      loss_aversion: 0,
      anchoring: 0,
      mental_accounting: 0,
      disposition_effect: 0
    },
    eventSayilari: {
      present_bias: 0,
      loss_aversion: 0,
      anchoring: 0,
      mental_accounting: 0,
      disposition_effect: 0
    }
  })
  const [bars, setBars] = useState({ sabir: 50, mutluluk: 50 })
  const [nakit, setNakit] = useState(25000)
  const [introTamamlandi, setIntroTamamlandi] = useState(false)
  const [hikayeGoruldu, setHikayeGoruldu] = useState(false)
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
    bist_bankacilik_adet: 0,
    bist_teknoloji_adet: 0,
    bist_insaat_adet: 0,
    bist_saglik_adet: 0,
    bist_perakende_adet: 0,
    dolar: 0,
    mevduat_tl: 0,
  })
  const [fiyatlar, setFiyatlar] = useState({
    altin_try_gram: (2600 * 40) / 31.1,
    bist_endeks: 100,
    bist_bankacilik: 100,
    bist_teknoloji: 100,
    bist_insaat: 100,
    bist_saglik: 100,
    bist_perakende: 100,
    dolar_try: 40,
    mev_faiz_oran: 0.12,
  })
  const [standartlar, setStandartlar] = useState(VARSAYILAN_STANDARTLAR)
  const [finalRaporHata, setFinalRaporHata] = useState(false)
  const [isYeri, setIsYeri] = useState(null)
  const [cinsiyet, setCinsiyet] = useState(null)
  const [temelMaas, setTemelMaas] = useState(0)
  const [emlakPiyasasi, setEmlakPiyasasi] = useState([])
  const [sahipOlunanEvler, setSahipOlunanEvler] = useState([])
  const [aracPiyasasi, setAracPiyasasi] = useState([])
  const [sahipOlunanAraclar, setSahipOlunanAraclar] = useState([])
  const [oturulanEvId, setOturulanEvId] = useState(null)
  const [kiraGeliriYillik, setKiraGeliriYillik] = useState(0)

  const nakitRef = useRef(nakit)
  const bekleyenSektorEkstraGetiriRef = useRef(null)
  const [nakitGerekenEventSayisi, setNakitGerekenEventSayisi] = useState(0)
  const [nakitYetersizKalanEventSayisi, setNakitYetersizKalanEventSayisi] = useState(0)

  const nakitiGuncelle = (yeniNakit) => {
    nakitRef.current = yeniNakit
    setNakit(yeniNakit)
  }
  const [mevcutEvent, setMevcutEvent] = useState(null)
  const [eventGecmisi, setEventGecmisi] = useState({})
  const [tetiklenenler, setTetiklenenler] = useState([])
  const [eventKuyrugu, setEventKuyrugu] = useState([])
  const [eventKayitlari, setEventKayitlari] = useState([])
  const [coachYorumu, setCoachYorumu] = useState(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [finalRapor, setFinalRapor] = useState(null)
  const [finalRaporLoading, setFinalRaporLoading] = useState(false)
  const [fiyatGecmisi, setFiyatGecmisi] = useState({
    altin: [],
    bist: [],
    bist_bankacilik: [],
    bist_teknoloji: [],
    bist_insaat: [],
    bist_saglik: [],
    bist_perakende: [],
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
    bist_bankacilik: null,
    bist_teknoloji: null,
    bist_insaat: null,
    bist_saglik: null,
    bist_perakende: null,
    dolar: null,
    mevduat: null,
  })
  const [oyunBitti, setOyunBitti] = useState(false)
  const [bitisSebebi, setBitisSebebi] = useState(null) // "yas_siniri" | "erken_olum"
  const [oturum, setOturum] = useState(null)
  const [sonEventEtkisi, setSonEventEtkisi] = useState({ sabir: 0, mutluluk: 0 })
  const [sonucKarti, setSonucKarti] = useState(null) // { baslik, metin } | null
  const [redenominasyonKarti, setRedenominasyonKarti] = useState(null)
  const [tutorialAcik, setTutorialAcik] = useState(false)
  const bekleyenEventKaydiRef = useRef(null)
  const [firsatMaliyetiGecmisi, setFirsatMaliyetiGecmisi] = useState([])

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


  useEffect(() => {
    if (oyunBitti && !finalRapor && !finalRaporLoading) {
      finalRaporuOlustur()
    }
  }, [oyunBitti])

  useEffect(() => {
    if (mevcutEvent && mevcutEvent.secenekler) {
      let nakitSartiVar = false
      let seceneklerinHepsineNakitYetersiz = true
      
      mevcutEvent.secenekler.forEach(s => {
        if (!s.kilit) return
        
        let kilitli = false
        if (s.kilit.tur === "nakit") {
          nakitSartiVar = true
          if (nakitRef.current < s.kilit.min) kilitli = true
        } else if (s.kilit.tur === "nakit_usd") {
          nakitSartiVar = true
          if (nakitRef.current < s.kilit.min * (fiyatlar.dolar_try || 40)) kilitli = true
        } else if (s.kilit.tur === "sektor_pozisyon_yuzdesi") {
          nakitSartiVar = true
          const adetKey = `bist_${s.kilit.sektor}_adet`
          const fiyatKey = `bist_${s.kilit.sektor}`
          const pozisyonDegeri = (portfoy[adetKey] || 0) * (fiyatlar[fiyatKey] || 100)
          if (nakitRef.current < pozisyonDegeri * s.kilit.oran) kilitli = true
        }
        
        if (!kilitli && ["nakit", "nakit_usd", "sektor_pozisyon_yuzdesi"].includes(s.kilit.tur)) {
            seceneklerinHepsineNakitYetersiz = false
        }
      })
      
      if (nakitSartiVar) {
        setNakitGerekenEventSayisi(prev => prev + 1)
        if (seceneklerinHepsineNakitYetersiz) {
            setNakitYetersizKalanEventSayisi(prev => prev + 1)
        }
      }
    }
  }, [mevcutEvent?.id])

  useEffect(() => {
    if (!supabaseAktif) return
    supabase.auth.getSession().then(({ data }) => setOturum(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setOturum(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])


  const handleYilAtlaTikla = () => {
    // Gelecek yılı kestirmeye çalış
    const beklenenKira = sahipOlunanEvler.filter(ev => ev.kirada).reduce((acc, ev) => acc + (ev.fiyat_usd_taban * (fiyatlar.dolar_try || 40) * ev.kira_orani), 0)
    const beklenenTaksit = kredi ? kredi.yillikTaksit : 0
    const beklenenNakit = nakit + yillikGelir - yasamGideri + beklenenKira - beklenenTaksit

    if (beklenenNakit < 0) {
      setHacizUyarisiAcik(true)
    } else {
      yilAtla()
    }
  }

  async function yilAtla() {
    setHacizUyarisiAcik(false)
    setAktifSayfa("ana")
    setLoading(true)

    const nakit0 = nakitRef.current
    const mevduat0 = portfoy.mevduat_tl
    const altinTL0 = portfoy.altin_gram * fiyatlar.altin_try_gram
    const bistTL0 = portfoy.bist_adet * fiyatlar.bist_endeks
    const bistBankacilikTL0 = (portfoy.bist_bankacilik_adet || 0) * (fiyatlar.bist_bankacilik || 100)
    const bistTeknolojiTL0 = (portfoy.bist_teknoloji_adet || 0) * (fiyatlar.bist_teknoloji || 100)
    const bistInsaatTL0 = (portfoy.bist_insaat_adet || 0) * (fiyatlar.bist_insaat || 100)
    const bistSaglikTL0 = (portfoy.bist_saglik_adet || 0) * (fiyatlar.bist_saglik || 100)
    const bistPerakendeTL0 = (portfoy.bist_perakende_adet || 0) * (fiyatlar.bist_perakende || 100)
    const dolarTL0 = portfoy.dolar * fiyatlar.dolar_try
    const emlakTL0 = sahipOlunanEvler.reduce((t, ev) => t + evGuncelDegerHesapla(ev), 0)
    const toplam0 = nakit0 + mevduat0 + altinTL0 + bistTL0 + bistBankacilikTL0 + bistTeknolojiTL0 + bistInsaatTL0 + bistSaglikTL0 + bistPerakendeTL0 + dolarTL0 + emlakTL0

    // Eğitim ve Kariyer İlerletme Mantığı
    let yeniUniversiteYili = universiteYili
    let yeniMezunOlunanBolum = mezunOlunanBolum
    let yeniOkunanBolum = okunanBolum
    
    if (universiteYili > 0 && universiteYili < 4) {
      yeniUniversiteYili += 1
      if (yeniUniversiteYili === 4) {
        // Mezuniyeti hemen ver ki aynı yıl iş ilanlarına başvurabilsin
        yeniMezunOlunanBolum = okunanBolum
        yeniOkunanBolum = null
        yeniUniversiteYili = 0
      }
    }
    
    // Çalışma Barı Artışı
    let yeniCalismaBari = calismaBari
    if (isYeri && isYeri !== "lise_mezunu") {
       const isVasifsiz = MESLEKLER[isYeri] && !MESLEKLER[isYeri].gereksinim;
       if (isVasifsiz) {
         yeniCalismaBari += sikiCalisAktif ? 3 : 2
       } else {
         yeniCalismaBari += sikiCalisAktif ? 2 : 1
       }
    }
    
    // Otomatik Mezuna Kalma ve Sınav Hakkı Yenileme
    if (sinavPuani !== null && !yeniOkunanBolum) {
      setMezunaKalmaSayisi(prev => prev + 1)
      setSinavPuani(null)
    }
    setBuYilSinavaGirdiMi(false)

    setUniversiteYili(yeniUniversiteYili)
    setMezunOlunanBolum(yeniMezunOlunanBolum)
    setOkunanBolum(yeniOkunanBolum)
    setCalismaBari(yeniCalismaBari)

    setBiasMetrics(prev => ({
      ...prev,
      luksYasamPuani: prev.luksYasamPuani + luksPuaniHesapla(standartlar, sahipOlunanEvler),
      toplamYil: prev.toplamYil + 1
    }));

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
          portfoy: {
            ...portfoy,
            kirada_ev_var: sahipOlunanEvler.some(ev => ev.kirada)
          },
          is_yeri: isYeri,
          is_level: isLevel,
          sektor_ekstra_getiri: bekleyenSektorEkstraGetiriRef.current,
          universite_yili: yeniUniversiteYili,
        }),
      })
      bekleyenSektorEkstraGetiriRef.current = null;
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
        bist_bankacilik: data.bist_bankacilik,
        bist_teknoloji: data.bist_teknoloji,
        bist_insaat: data.bist_insaat,
        bist_saglik: data.bist_saglik,
        bist_perakende: data.bist_perakende,
        mevduat_birikim: data.mevduat_birikim,
        emlak_endeksi_usd: data.emlak_endeksi_usd,
        fisilti_sayaci: data.fisilti_sayaci,
        gelecek_makro: data.gelecek_makro,
      })

      const yeniTemelMaas = Math.round(temelMaas * (1 + data.yil_sonucu.enflasyon / 100))
      const yeniGelir = Math.round(yeniTemelMaas * levelCarpaniGetir(isYeri, isLevel))
      const yeniGider = Math.round(yasamGideri * (1 + data.yil_sonucu.enflasyon / 100))
      setTemelMaas(yeniTemelMaas)
      setYasamGideri(yeniGider)
      
      const yeniMaasEndeksi = maasEndeksi * (1 + data.yil_sonucu.enflasyon / 100)
      setMaasEndeksi(yeniMaasEndeksi)
      
      // İş ilanlarını yenile
      setIsIlanlari(yeniIlanlarUret(yeniMaasEndeksi))

      const yeniDolarKuru = data.yil_sonucu.fiyatlar.dolar_try
      setYasamGideri(Math.round(toplamAylikUsd(standartlar, YASAM_STANDARTLARI) * yeniDolarKuru * 12))

      // Portföy Getirisi Hesaplama (Sıfır Atma Durumunu Göze Alarak)
      let w_start_gercek = nakitRef.current + Math.round(
        portfoy.altin_gram * fiyatlar.altin_try_gram +
        portfoy.bist_adet * fiyatlar.bist_endeks +
        (portfoy.bist_bankacilik_adet || 0) * (fiyatlar.bist_bankacilik || 100) +
        (portfoy.bist_teknoloji_adet || 0) * (fiyatlar.bist_teknoloji || 100) +
        (portfoy.bist_insaat_adet || 0) * (fiyatlar.bist_insaat || 100) +
        (portfoy.bist_saglik_adet || 0) * (fiyatlar.bist_saglik || 100) +
        (portfoy.bist_perakende_adet || 0) * (fiyatlar.bist_perakende || 100) +
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
        (portfoy.bist_bankacilik_adet || 0) * data.yil_sonucu.fiyatlar.bist_bankacilik +
        (portfoy.bist_teknoloji_adet || 0) * data.yil_sonucu.fiyatlar.bist_teknoloji +
        (portfoy.bist_insaat_adet || 0) * data.yil_sonucu.fiyatlar.bist_insaat +
        (portfoy.bist_saglik_adet || 0) * data.yil_sonucu.fiyatlar.bist_saglik +
        (portfoy.bist_perakende_adet || 0) * data.yil_sonucu.fiyatlar.bist_perakende +
        portfoy.dolar * data.yil_sonucu.fiyatlar.dolar_try +
        mevduatReel * (1 + data.yil_sonucu.mev_faiz / 100)
      )

      const getiriOrani = w_start_gercek > 0 ? (w_appreciated - w_start_gercek) / w_start_gercek : 0
      const yeniPortfoyEndeksi = portfoyEndeksi * (1 + getiriOrani)
      setPortfoyEndeksi(yeniPortfoyEndeksi)
      setPortfoyGecmisi(prev => [...prev, { yil: yil + 1, deger: Math.round(yeniPortfoyEndeksi) }])

      const yeniEmlakEndeksiUsd = data.emlak_endeksi_usd
      setEmlakPiyasasi(data.yil_sonucu.emlak_piyasasi || [])
      setAracPiyasasi(data.yil_sonucu.arac_piyasasi || [])
      const kiraGeliriToplam = sahipOlunanEvler
        .filter(ev => ev.kirada)
        .reduce((toplam, ev) => {
          const guncelDeger = Math.round(ev.fiyat_usd_taban * (yeniEmlakEndeksiUsd / 100) * yeniDolarKuru)
          return toplam + Math.round(ev.kira_orani * guncelDeger)
        }, 0)
      setKiraGeliriYillik(kiraGeliriToplam)

      let yeniNakit = nakitRef.current + yeniGelir - yeniGider + kiraGeliriToplam
      if (kredi) {
        yeniNakit -= kredi.yillikTaksit
      }

      // HACİZ VE İFLAS LİGİĞİ
      if (yeniNakit < 0) {
        // Sırasıyla tasfiye
        // 1. Mevduat
        if (yeniNakit < 0 && portfoy.mevduat_tl > 0) {
          yeniNakit += portfoy.mevduat_tl
          setPortfoy(p => ({ ...p, mevduat_tl: 0 }))
        }
        // 2. Altın ve Döviz
        if (yeniNakit < 0 && portfoy.altin_gram > 0) {
          yeniNakit += Math.round(portfoy.altin_gram * data.yil_sonucu.fiyatlar.altin_try_gram)
          setPortfoy(p => ({ ...p, altin_gram: 0 }))
        }
        if (yeniNakit < 0 && portfoy.dolar > 0) {
          yeniNakit += Math.round(portfoy.dolar * data.yil_sonucu.fiyatlar.dolar_try)
          setPortfoy(p => ({ ...p, dolar: 0 }))
        }
        // 3. Hisseler
        const hisseler = ["bist_adet", "bist_bankacilik_adet", "bist_teknoloji_adet", "bist_insaat_adet", "bist_saglik_adet", "bist_perakende_adet"]
        const hisseFiyat = ["bist_endeks", "bist_bankacilik", "bist_teknoloji", "bist_insaat", "bist_saglik", "bist_perakende"]
        for (let i = 0; i < hisseler.length; i++) {
          if (yeniNakit < 0 && portfoy[hisseler[i]] > 0) {
            yeniNakit += Math.round(portfoy[hisseler[i]] * data.yil_sonucu.fiyatlar[hisseFiyat[i]])
            setPortfoy(p => ({ ...p, [hisseler[i]]: 0 }))
          }
        }
        // 4. Araçlar
        if (yeniNakit < 0 && sahipOlunanAraclar.length > 0) {
          sahipOlunanAraclar.forEach(arac => {
            if (yeniNakit < 0) {
              const deg = Math.round(arac.alis_fiyati_usd * Math.pow(1 - arac.amortisman_orani, yeniYil - arac.alinma_yili) * data.yil_sonucu.fiyatlar.dolar_try)
              yeniNakit += deg
              setSahipOlunanAraclar(prev => prev.filter(a => a.id !== arac.id))
            }
          })
        }
        // 5. Evler
        if (yeniNakit < 0 && sahipOlunanEvler.length > 0) {
          sahipOlunanEvler.forEach(ev => {
            if (yeniNakit < 0) {
              const deg = Math.round(ev.fiyat_usd_taban * (data.emlak_endeksi_usd / 100) * data.yil_sonucu.fiyatlar.dolar_try)
              yeniNakit += deg
              setSahipOlunanEvler(prev => prev.filter(e => e.id !== ev.id))
              if (ev.id === oturulanEvId) setOturulanEvId(null)
            }
          })
        }

        // 6. Hala negatifse: İFLAS
        if (yeniNakit < 0) {
          yeniNakit = 0
          setIflasSayisi(prev => prev + 1)
          setKredi(null)
          setKrediNotu(0)
          setBars({ sabir: 0, mutluluk: 0 })
          setMevcutEvent({
            baslik: "İFLAS ETTİNİZ!",
            metin: "Borçlarınızı karşılayacak hiçbir varlığınız kalmadı. Kredi borcunuz sıfırlandı ancak kredi notunuz dibi gördü ve tüm birikiminizi kaybettiniz. Ağır bir depresyon yaşıyorsunuz...",
            secenekler: [{ metin: "Her şeye sıfırdan başla.", nakit_etki_usd: 0, sabir_etki: 0, mutluluk_etki: 0 }]
          })
        }
      }

      if (kredi && yeniNakit >= 0) {
        if (kredi.kalanVade <= 1) {
          setKredi(null)
          setKrediNotu(prev => Math.min(1000, prev + 25))
        } else {
          setKredi(prev => ({ ...prev, kalanVade: prev.kalanVade - 1, borc: prev.borc - prev.yillikTaksit }))
        }
      }

      if (data.yil_sonucu.redenominasyon) {
        yeniNakit = Math.round(yeniNakit / 1000)
        setYillikGelir(Math.round(yeniGelir / 1000))
        setYasamGideri(Math.round(yeniGider / 1000))
        setTemelMaas(Math.round(yeniTemelMaas / 1000))
        if (kredi) {
           setKredi(prev => prev ? ({
             ...prev,
             anapara: Math.round(prev.anapara / 1000),
             borc: Math.round(prev.borc / 1000),
             yillikTaksit: Math.round(prev.yillikTaksit / 1000)
           }) : null)
        }
      } else {
        setYillikGelir(yeniGelir)
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
        // Geçmiş fiyatları böl ki grafiklerde kopma olmasın
        setFiyatGecmisi(prev => ({
          altin: prev.altin.map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
          bist: prev.bist.map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
          bist_bankacilik: (prev.bist_bankacilik && prev.bist_bankacilik.length > 0 ? prev.bist_bankacilik : prev.bist).map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
          bist_teknoloji: (prev.bist_teknoloji && prev.bist_teknoloji.length > 0 ? prev.bist_teknoloji : prev.bist).map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
          bist_insaat: (prev.bist_insaat && prev.bist_insaat.length > 0 ? prev.bist_insaat : prev.bist).map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
          bist_saglik: (prev.bist_saglik && prev.bist_saglik.length > 0 ? prev.bist_saglik : prev.bist).map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
          bist_perakende: (prev.bist_perakende && prev.bist_perakende.length > 0 ? prev.bist_perakende : prev.bist).map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
          dolar: prev.dolar.map(p => ({ ...p, fiyat: formatAssetPrice(p.fiyat / 1000) })),
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

      // Sıkı Çalış Debuff
      let sikiCalisDebuff = { mutluluk: 0, sabir: 0 }
      if (sikiCalisAktif && isYeri && isYeri !== "lise_mezunu") {
        sikiCalisDebuff = { mutluluk: -7, sabir: 3 }
      }

      // Barları güncelle
      setBars(prev => ({
        sabir: Math.min(100, Math.max(20, prev.sabir + kalite.sabir + finansalDebuff.sabir + sikiCalisDebuff.sabir)),
        mutluluk: Math.min(100, Math.max(20, prev.mutluluk + kalite.mutluluk + finansalDebuff.mutluluk + sikiCalisDebuff.mutluluk)),
      }))

      setSonuc(data.yil_sonucu)
      setFiyatGecmisi(prev => ({
        altin: [...prev.altin, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.altin_try_gram }],
        bist: [...prev.bist, { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_endeks }],
        bist_bankacilik: [...(prev.bist_bankacilik && prev.bist_bankacilik.length > 0 ? prev.bist_bankacilik : prev.bist), { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_bankacilik }],
        bist_teknoloji: [...(prev.bist_teknoloji && prev.bist_teknoloji.length > 0 ? prev.bist_teknoloji : prev.bist), { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_teknoloji }],
        bist_insaat: [...(prev.bist_insaat && prev.bist_insaat.length > 0 ? prev.bist_insaat : prev.bist), { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_insaat }],
        bist_saglik: [...(prev.bist_saglik && prev.bist_saglik.length > 0 ? prev.bist_saglik : prev.bist), { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_saglik }],
        bist_perakende: [...(prev.bist_perakende && prev.bist_perakende.length > 0 ? prev.bist_perakende : prev.bist), { yil: yil + 1, fiyat: data.yil_sonucu.fiyatlar.bist_perakende }],
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
          bist_bankacilik: prev.bist_bankacilik !== null ? prev.bist_bankacilik * (1 + (data.yil_sonucu.sektor_getirileri.bankacilik - data.yil_sonucu.enflasyon)/100) : null,
          bist_teknoloji: prev.bist_teknoloji !== null ? prev.bist_teknoloji * (1 + (data.yil_sonucu.sektor_getirileri.teknoloji - data.yil_sonucu.enflasyon)/100) : null,
          bist_insaat: prev.bist_insaat !== null ? prev.bist_insaat * (1 + (data.yil_sonucu.sektor_getirileri.insaat - data.yil_sonucu.enflasyon)/100) : null,
          bist_saglik: prev.bist_saglik !== null ? prev.bist_saglik * (1 + (data.yil_sonucu.sektor_getirileri.saglik - data.yil_sonucu.enflasyon)/100) : null,
          bist_perakende: prev.bist_perakende !== null ? prev.bist_perakende * (1 + (data.yil_sonucu.sektor_getirileri.perakende - data.yil_sonucu.enflasyon)/100) : null,
          dolar: prev.dolar !== null ? prev.dolar * (1 + getiriler.dolar) : null,
          mevduat: prev.mevduat !== null ? prev.mevduat * (1 + getiriler.mevduat) : null,
        }
      })


      // Event Kuyruğu
      const yeniEventler = [];
      if (data.yil_sonucu.event) {
        yeniEventler.push(data.yil_sonucu.event);
      }
      if (data.yil_sonucu.yan_eventler && data.yil_sonucu.yan_eventler.length > 0) {
        yeniEventler.push(...data.yil_sonucu.yan_eventler);
      }
      // Terfi Eventi Intercept (Side Event Olarak Kuyruğa Ekle)
      if (yeniCalismaBari >= 10 && isYeri && isYeri !== "lise_mezunu" && isLevel < 5) {
        // %70 başarı şansı arka planda hesaplanacak
        const basariliMi = Math.random() < 0.70;
        yeniEventler.push({
          id: "ev_terfi_sinavi",
          tek_seferlik: false,
          tip: "kariyer",
          baslik: "Kariyer Sınavı",
          metin: "Uzun süredir aynı pozisyonda çalışıyorsun. Tecrübe barın doldu ve artık terfi etme zamanın geldi. Üst yönetim yeteneklerini değerlendiriyor...",
          secenekler: [
            {
               id: "degerlendirmeye_gir",
               metin: "Terfi Değerlendirmesine Gir",
               olasilik_sonuclari: [
                 {
                   agirlik: 100,
                   sonuc_metin: basariliMi ? "Harika! Yönetim performansından çok memnun, terfi aldın ve maaş katsayın arttı." : "Maalesef terfi alamadın. Yönetim daha fazlasını bekliyor. Bar 6'ya düştü.",
                   terfi_sonucu: basariliMi ? "kabul" : "red",
                   mutluluk_etki: basariliMi ? 5 : -5,
                   sabir_etki: basariliMi ? 5 : 0
                 }
               ]
            }
          ]
        })
      }

      if (yeniEventler.length > 0) {
        setMevcutEvent(yeniEventler[0])
        setEventKuyrugu(yeniEventler.slice(1))
        
        yeniEventler.forEach(ev => {
           setEventGecmisi(prev => ({ ...prev, [ev.id]: yil + 1 }))
           if (ev.tek_seferlik) setTetiklenenler(prev => [...prev, ev.id])
        })
        setCoachYorumu(null)
      }
      
      if (data.yil_sonucu.oyun_bitti) {
        setOyunBitti({
          netWorth: w_appreciated,
          sonYas: yeniYas,
          nakitGerekenEventSayisi: nakitGerekenEventSayisi,
          nakitYetersizKalanEventSayisi: nakitYetersizKalanEventSayisi
        })
      }

      // Enflasyon endeksi güncelle
      const yeniEnflasyonEndeksi = enflasyonEndeksi * (1 + data.yil_sonucu.enflasyon / 100)
      setEnflasyonEndeksi(yeniEnflasyonEndeksi)
      setEnflasyonGecmisi(prev => [...prev, { yil: yil + 1, deger: Math.round(yeniEnflasyonEndeksi) }])
      setEmlakEndeksiGecmisi(prev => [...prev, { yil: yil + 1, deger: yeniEmlakEndeksiUsd }])

      // Fırsat maliyeti hesabı
      const enf = data.yil_sonucu.enflasyon
      const reelNakit = -enf
      const adaylar = {
        mevduat: data.yil_sonucu.reel_mevduat,
        altin: data.yil_sonucu.reel_altin,
        bist: data.yil_sonucu.reel_bist,
        bist_bankacilik: data.yil_sonucu.sektor_getirileri.bankacilik - data.yil_sonucu.enflasyon,
        bist_teknoloji: data.yil_sonucu.sektor_getirileri.teknoloji - data.yil_sonucu.enflasyon,
        bist_insaat: data.yil_sonucu.sektor_getirileri.insaat - data.yil_sonucu.enflasyon,
        bist_saglik: data.yil_sonucu.sektor_getirileri.saglik - data.yil_sonucu.enflasyon,
        bist_perakende: data.yil_sonucu.sektor_getirileri.perakende - data.yil_sonucu.enflasyon,
        dolar: data.yil_sonucu.reel_doviz,
        emlak: data.yil_sonucu.reel_emlak,
      }

      let enIyiVarlik = null
      let enIyiGetiri = -Infinity
      for (const [varlik, getiri] of Object.entries(adaylar)) {
        if (getiri > enIyiGetiri) {
          enIyiGetiri = getiri
          enIyiVarlik = varlik
        }
      }

      const agirlikliReelGetiri = toplam0 > 0
        ? (nakit0 / toplam0) * reelNakit +
        (mevduat0 / toplam0) * adaylar.mevduat +
        (altinTL0 / toplam0) * adaylar.altin +
        (bistTL0 / toplam0) * adaylar.bist +
        (bistBankacilikTL0 / toplam0) * adaylar.bist_bankacilik +
        (bistTeknolojiTL0 / toplam0) * adaylar.bist_teknoloji +
        (bistInsaatTL0 / toplam0) * adaylar.bist_insaat +
        (bistSaglikTL0 / toplam0) * adaylar.bist_saglik +
        (bistPerakendeTL0 / toplam0) * adaylar.bist_perakende +
        (dolarTL0 / toplam0) * adaylar.dolar +
        (emlakTL0 / toplam0) * adaylar.emlak
        : 0

      setFirsatMaliyetiGecmisi(prev => [
        ...prev,
        {
          yil: yil + 1,
          gercekGetiri: Math.round(agirlikliReelGetiri * 10) / 10,
          enIyiGetiri: Math.round(enIyiGetiri * 10) / 10,
          enIyiVarlik,
        },
      ])

      if (yeniYas >= 95) {
        setOyunBitti(true)
        setBitisSebebi("yas_siniri")
      } else if (yeniYas >= 80) {
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
    setTutorialAktif(!!sonuc.tutorialGoster)
    if (sonuc.cinsiyet) setCinsiyet(sonuc.cinsiyet)

    if (sonuc.nakit >= 200000) {
      setSahipOlunanAraclar([{
        id: "arac_" + Date.now(),
        tip: "kucuk",
        isim: "İkinci El Ucuz Araç",
        alisYili: 0,
        alisFiyati: 8000 * (fiyatlar.dolar_try || 40),
        alis_fiyati_usd: 8000,
        alinma_yili: 0,
        amortisman_orani: 0.15,
        bakim_masrafi_orani: 0.05
      }])
    }

    setIntroTamamlandi(true) // Render HikayeEkrani with loading state immediately
    
    if (sonuc.nakit === 5000) setZorluk("Zor")
    else if (sonuc.nakit === 200000) setZorluk("Kolay")
    else setZorluk("Orta")
    
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
    
    if (eventKuyrugu.length > 0) {
      setMevcutEvent(eventKuyrugu[0])
      setEventKuyrugu(prev => prev.slice(1))
    } else if (bekleyenEventKaydiRef.current) {
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
      sabir: Math.min(100, Math.max(20, prev.sabir + (secenek.sabir_etki || 0))),
      mutluluk: Math.min(100, Math.max(20, prev.mutluluk + (secenek.mutluluk_etki || 0))),
    }))

    if (secenek.bias_etki) {
      setBiasMetrics(prev => {
        let yeniSkorlari = { ...prev.eventSkorlari }
        let yeniSayilari = { ...prev.eventSayilari }
        for (const [key, value] of Object.entries(secenek.bias_etki)) {
          if (yeniSkorlari[key] !== undefined) {
             yeniSkorlari[key] += value
             yeniSayilari[key] += 1
          }
        }
        return {
          ...prev,
          eventSkorlari: yeniSkorlari,
          eventSayilari: yeniSayilari
        }
      })
    }

    if (secenek.nakit_etki_usd && secenek.nakit_etki_usd !== 0) {
      const guncelDolarKuru = fiyatlar?.dolar_try || 40;
      const tlEtkisi = Math.round(secenek.nakit_etki_usd * guncelDolarKuru)
      
      setNakit(prevNakit => {
        const currentNakit = isNaN(prevNakit) ? 20000 : prevNakit;
        const yeniNakit = Math.max(20000, currentNakit + tlEtkisi);
        nakitRef.current = yeniNakit;
        return yeniNakit;
      })
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

    if (secenek.aksiyon) {
      const { tip, sektor, oran, yeni_is } = secenek.aksiyon
      
      if (tip === "is_degistir" && yeni_is) {
        setIsYeri(yeni_is)
        setIsLevel(1)
        setCalismaBari(0)
      } else {
        const adetKey = `bist_${sektor}_adet`
        const fiyatKey = `bist_${sektor}`
        const mevcutPay = portfoy[adetKey] || 0
        const guncelFiyat = fiyatlar[fiyatKey] || 100
        const mevcutDeger = mevcutPay * guncelFiyat

        if (tip === "sektor_al") {
        const alinacakTutar = mevcutDeger * oran
        if (nakitRef.current >= alinacakTutar) {
          const alinacakPay = alinacakTutar / guncelFiyat
          setNakit(prevNakit => {
            const currentNakit = isNaN(prevNakit) ? 20000 : prevNakit
            const yeniNakit = Math.round(currentNakit - alinacakTutar)
            nakitRef.current = yeniNakit
            return yeniNakit
          })
          setPortfoy(prev => ({
            ...prev,
            [adetKey]: (prev[adetKey] || 0) + alinacakPay
          }))
        }
      } else if (tip === "sektor_sat") {
        const satilacakPay = mevcutPay * oran
        const gelir = satilacakPay * guncelFiyat
        setNakit(prevNakit => {
            const currentNakit = isNaN(prevNakit) ? 20000 : prevNakit
            const yeniNakit = Math.round(currentNakit + gelir)
            nakitRef.current = yeniNakit
            return yeniNakit
        })
        setPortfoy(prev => ({
          ...prev,
          [adetKey]: (prev[adetKey] || 0) - satilacakPay
        }))
      }
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

      if (cikanDal.sektor_ekstra_getiri && secilenEvent.sektor) {
        bekleyenSektorEkstraGetiriRef.current = {
          sektor: secilenEvent.sektor,
          getiri: cikanDal.sektor_ekstra_getiri
        }
      }
      
      if (cikanDal.portfoy_etki && cikanDal.portfoy_etki.dinamik_hisse_adet) {
        const adet = cikanDal.portfoy_etki.dinamik_hisse_adet
        let sektorKey = "bist_perakende_adet"
        if (isYeri === "muhendis") sektorKey = "bist_teknoloji_adet"
        else if (isYeri === "doktor") sektorKey = "bist_saglik_adet"
        else if (isYeri === "ekonomist") sektorKey = "bist_bankacilik_adet"
        else if (isYeri === "insaat_iscisi") sektorKey = "bist_insaat_adet"
        
        setPortfoy(prev => ({
          ...prev,
          [sektorKey]: (prev[sektorKey] || 0) + adet
        }))
      }
      
      if (cikanDal.terfi_sonucu) {
        if (cikanDal.terfi_sonucu === "kabul") {
          setIsLevel(prev => {
            const newLevel = Math.min(prev + 1, 5)
            setCvGecmisi(oldCv => [{ yil: yil+1, yas: yas+1, unvan: pozisyonAdiGetir(isYeri, newLevel), isYeri: MESLEKLER[isYeri]?.ad }, ...oldCv])
            return newLevel
          })
          setCalismaBari(0)
        } else {
          setCalismaBari(6) // 10 üzerinden 6'ya düşüyor
        }
      }

      if (cikanDal.mutluluk_etki || cikanDal.sabir_etki) {
         setBars(prev => ({
            sabir: Math.min(100, Math.max(20, prev.sabir + (cikanDal.sabir_etki || 0))),
            mutluluk: Math.min(100, Math.max(20, prev.mutluluk + (cikanDal.mutluluk_etki || 0))),
         }))
      }

      bekleyenEventKaydiRef.current = eventKaydi
      setSonucKarti({ baslik: secilenEvent.baslik, metin: cikanDal.sonuc_metin })
    } else {
      if (eventKuyrugu.length > 0) {
        setMevcutEvent(eventKuyrugu[0])
        setEventKuyrugu(prev => prev.slice(1))
      } else {
        kocYorumunuGetir(eventKaydi)
      }
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
          final_state: { 
            year: yil, 
            age: yas, 
            cash: nakit, 
            net_worth: toplamDeger, 
            bankruptcy_count: iflasSayisi,
            bias_metrics: biasMetrics
          },
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
    const mSayi = parseFloat(miktar)
    if (!mSayi || mSayi <= 0) return

    let maliyet = 0
    if (varlik === "altin") maliyet = mSayi * fiyatlar.altin_try_gram
    if (varlik === "bist") maliyet = mSayi * fiyatlar.bist_endeks
    if (varlik === "bist_bankacilik") maliyet = mSayi * fiyatlar.bist_bankacilik
    if (varlik === "bist_teknoloji") maliyet = mSayi * fiyatlar.bist_teknoloji
    if (varlik === "bist_insaat") maliyet = mSayi * fiyatlar.bist_insaat
    if (varlik === "bist_saglik") maliyet = mSayi * fiyatlar.bist_saglik
    if (varlik === "bist_perakende") maliyet = mSayi * fiyatlar.bist_perakende
    if (varlik === "dolar") maliyet = mSayi * fiyatlar.dolar_try
    if (varlik === "mevduat") maliyet = mSayi

    if (maliyet > nakitRef.current) {
      alert("Yeterli nakit yok!")
      return
    }

    nakitiGuncelle(Math.round(nakitRef.current - maliyet))
    // Bias Metrik: Borçluyken yatırım yapmak (Mental Accounting)
    if (kredi !== null && varlik !== "mevduat" && varlik !== "dolar") {
      setBiasMetrics(prev => ({ ...prev, borcluykenYatirimSayisi: prev.borcluykenYatirimSayisi + 1 }))
    }

    // Bias Metrik: Düşen Bıçağı Tutmak (Anchoring) - krizdeyken hisse vs. almak
    if (varlik.startsWith("bist") && gameState.enf_kriz_mevcut) {
      setBiasMetrics(prev => ({ ...prev, dusenBicakAlimSayisi: prev.dusenBicakAlimSayisi + 1 }))
    }

    // Katsayıyı başlat — null ise 1.0'dan başla, değilse devam et
    setVarlikKatsayilari(prev => ({
      ...prev,
      [varlik]: prev[varlik] === null ? 1.0 : prev[varlik]
    }))
    setPortfoy(prev => ({
      ...prev,
      altin_gram: varlik === "altin" ? prev.altin_gram + mSayi : prev.altin_gram,
      bist_adet: varlik === "bist" ? prev.bist_adet + mSayi : prev.bist_adet,
      bist_bankacilik_adet: varlik === "bist_bankacilik" ? (prev.bist_bankacilik_adet || 0) + mSayi : (prev.bist_bankacilik_adet || 0),
      bist_teknoloji_adet: varlik === "bist_teknoloji" ? (prev.bist_teknoloji_adet || 0) + mSayi : (prev.bist_teknoloji_adet || 0),
      bist_insaat_adet: varlik === "bist_insaat" ? (prev.bist_insaat_adet || 0) + mSayi : (prev.bist_insaat_adet || 0),
      bist_saglik_adet: varlik === "bist_saglik" ? (prev.bist_saglik_adet || 0) + mSayi : (prev.bist_saglik_adet || 0),
      bist_perakende_adet: varlik === "bist_perakende" ? (prev.bist_perakende_adet || 0) + mSayi : (prev.bist_perakende_adet || 0),
      dolar: varlik === "dolar" ? prev.dolar + mSayi : prev.dolar,
      mevduat_tl: varlik === "mevduat" ? prev.mevduat_tl + mSayi : prev.mevduat_tl,
    }))
  }

  function varlikSat(varlik, miktar) {
    const mSayi = parseFloat(miktar)
    if (!mSayi || mSayi <= 0) return

    let gelir = 0
    if (varlik === "altin" && portfoy.altin_gram >= mSayi) gelir = mSayi * fiyatlar.altin_try_gram
    if (varlik === "bist" && portfoy.bist_adet >= mSayi) gelir = mSayi * fiyatlar.bist_endeks
    if (varlik === "bist_bankacilik" && (portfoy.bist_bankacilik_adet || 0) >= mSayi) gelir = mSayi * fiyatlar.bist_bankacilik
    if (varlik === "bist_teknoloji" && (portfoy.bist_teknoloji_adet || 0) >= mSayi) gelir = mSayi * fiyatlar.bist_teknoloji
    if (varlik === "bist_insaat" && (portfoy.bist_insaat_adet || 0) >= mSayi) gelir = mSayi * fiyatlar.bist_insaat
    if (varlik === "bist_saglik" && (portfoy.bist_saglik_adet || 0) >= mSayi) gelir = mSayi * fiyatlar.bist_saglik
    if (varlik === "bist_perakende" && (portfoy.bist_perakende_adet || 0) >= mSayi) gelir = mSayi * fiyatlar.bist_perakende
    if (varlik === "dolar" && portfoy.dolar >= mSayi) gelir = mSayi * fiyatlar.dolar_try
    if (varlik === "mevduat" && portfoy.mevduat_tl >= mSayi) gelir = mSayi

    if (gelir === 0) {
      alert("Yeterli varlık yok!")
      return
    }

    // Bias Metrik: Panik Satışı (Kriz zamanı satmak)
    if (varlik.startsWith("bist") && gameState.enf_kriz_mevcut) {
      setBiasMetrics(prev => ({ ...prev, panikSatisSayisi: prev.panikSatisSayisi + 1 }))
    }
    
    // Bias Metrik: Kârı Erken Kesme (Boğa piyasasında satmak)
    if (varlik.startsWith("bist") && gameState.bist > 200 && !gameState.enf_kriz_mevcut) {
      setBiasMetrics(prev => ({ ...prev, erkenKarSatisSayisi: prev.erkenKarSatisSayisi + 1 }))
    }

    nakitiGuncelle(Math.round(nakitRef.current + gelir))
    setPortfoy(prev => ({
      ...prev,
      altin_gram: varlik === "altin" ? prev.altin_gram - mSayi : prev.altin_gram,
      bist_adet: varlik === "bist" ? prev.bist_adet - mSayi : prev.bist_adet,
      bist_bankacilik_adet: varlik === "bist_bankacilik" ? (prev.bist_bankacilik_adet || 0) - mSayi : (prev.bist_bankacilik_adet || 0),
      bist_teknoloji_adet: varlik === "bist_teknoloji" ? (prev.bist_teknoloji_adet || 0) - mSayi : (prev.bist_teknoloji_adet || 0),
      bist_insaat_adet: varlik === "bist_insaat" ? (prev.bist_insaat_adet || 0) - mSayi : (prev.bist_insaat_adet || 0),
      bist_saglik_adet: varlik === "bist_saglik" ? (prev.bist_saglik_adet || 0) - mSayi : (prev.bist_saglik_adet || 0),
      bist_perakende_adet: varlik === "bist_perakende" ? (prev.bist_perakende_adet || 0) - mSayi : (prev.bist_perakende_adet || 0),
      dolar: varlik === "dolar" ? prev.dolar - mSayi : prev.dolar,
      mevduat_tl: varlik === "mevduat" ? prev.mevduat_tl - mSayi : prev.mevduat_tl,
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

  function aracGuncelDegerHesapla(arac) {
    const sahiplikYili = Math.max(0, yil - arac.alisYili)
    return Math.round(arac.alisFiyati * Math.pow(0.94, sahiplikYili))
  }

  function aracSatinAl(arac) {
    if (nakitRef.current < arac.fiyat) {
      alert("Yeterli nakit yok!")
      return
    }
    nakitiGuncelle(Math.round(nakitRef.current - arac.fiyat))
    setSahipOlunanAraclar(prev => [...prev, {
      id: arac.id,
      isim: arac.isim,
      tip: arac.tip,
      alisFiyati: arac.fiyat,
      alisYili: yil,
    }])
    setAracPiyasasi(prev => prev.filter(a => a.id !== arac.id))
  }

  function aracSat(aracId) {
    const arac = sahipOlunanAraclar.find(a => a.id === aracId)
    if (!arac) return
    const guncelDeger = aracGuncelDegerHesapla(arac)
    nakitiGuncelle(Math.round(nakitRef.current + guncelDeger))
    setSahipOlunanAraclar(prev => prev.filter(a => a.id !== aracId))
  }

  function portfoyDegeriHesapla() {
    const yatirimDegeri = Math.round(
      portfoy.altin_gram * fiyatlar.altin_try_gram +
      portfoy.bist_adet * fiyatlar.bist_endeks +
      (portfoy.bist_bankacilik_adet || 0) * (fiyatlar.bist_bankacilik || 100) +
      (portfoy.bist_teknoloji_adet || 0) * (fiyatlar.bist_teknoloji || 100) +
      (portfoy.bist_insaat_adet || 0) * (fiyatlar.bist_insaat || 100) +
      (portfoy.bist_saglik_adet || 0) * (fiyatlar.bist_saglik || 100) +
      (portfoy.bist_perakende_adet || 0) * (fiyatlar.bist_perakende || 100) +
      portfoy.dolar * fiyatlar.dolar_try
    )
    const mevduatDegeri = portfoy.mevduat_tl || 0
    let evDegeri = 0
    sahipOlunanEvler.forEach(ev => {
      evDegeri += evGuncelDegerHesapla(ev)
    })
    let aracDegeri = 0
    sahipOlunanAraclar.forEach(arac => {
      aracDegeri += aracGuncelDegerHesapla(arac)
    })
    return yatirimDegeri + mevduatDegeri + evDegeri + aracDegeri
  }

  const portfoyDegeri = Math.round(
    portfoy.altin_gram * fiyatlar.altin_try_gram +
    portfoy.bist_adet * fiyatlar.bist_endeks +
    (portfoy.bist_bankacilik_adet || 0) * (fiyatlar.bist_bankacilik || 100) +
    (portfoy.bist_teknoloji_adet || 0) * (fiyatlar.bist_teknoloji || 100) +
    (portfoy.bist_insaat_adet || 0) * (fiyatlar.bist_insaat || 100) +
    (portfoy.bist_saglik_adet || 0) * (fiyatlar.bist_saglik || 100) +
    (portfoy.bist_perakende_adet || 0) * (fiyatlar.bist_perakende || 100) +
    portfoy.dolar * fiyatlar.dolar_try +
    portfoy.mevduat_tl
  )
  const emlakToplamDeger = sahipOlunanEvler.reduce((toplam, ev) => toplam + evGuncelDegerHesapla(ev), 0)
  const toplamDeger = nakit + portfoyDegeri + emlakToplamDeger
  const krediTaksitYillik = kredi ? kredi.yillikTaksit : 0
  const netAkis = yillikGelir + kiraGeliriYillik - yasamGideri - krediTaksitYillik
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
      <div>Yaşam Gideri: <span className="text-error">-{money(yasamGideri)}</span> / yıl</div>
      {krediTaksitYillik > 0 && <div>Kredi Ödemesi: <span className="text-error">-{money(krediTaksitYillik)}</span> / yıl</div>}
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
  if (!hikayeGoruldu) {
    return <HikayeEkrani profil={karakterProfili} onDevam={() => setHikayeGoruldu(true)} />
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
        oturum={oturum}
        onTekrarDene={finalRaporuOlustur}
        onTekrarOyna={tekrarOyna}
        firsatMaliyetiGecmisi={firsatMaliyetiGecmisi}
        nakitGerekenEventSayisi={oyunBitti.nakitGerekenEventSayisi}
        nakitYetersizKalanEventSayisi={oyunBitti.nakitYetersizKalanEventSayisi}
        iflasSayisi={iflasSayisi}
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
          <button onClick={() => setAktifSayfa("kariyer")}>
            <span className={`material-symbols-outlined ${aktifSayfa === "kariyer" ? "text-primary" : "text-on-surface-variant"}`}>work</span>
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
            <div className="w-10 h-10 bg-surface-variant rounded flex items-center justify-center border border-outline overflow-hidden">
              {cinsiyet === "kadin" ? (
                <img src={kadinImg} alt="Avatar" className="w-full h-full object-cover" />
              ) : cinsiyet === "erkek" ? (
                <img src={erkekImg} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              )}
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
            { id: "banka", label: "Banka & Krediler", icon: "account_balance" },
            { id: "kariyer", label: "Kariyer & Eğitim", icon: "work" },
            { id: "portfoy", label: "Varlık Portföyü", icon: "pie_chart" },
            { id: "standartlar", label: "Psikolojik Profil", icon: "psychology" },
          ].map((item) => (
            <TutorialOdak key={item.id} hedefId={"sidebar-" + item.id} disablePadding>
              <button
                onClick={() => setAktifSayfa(item.id)}
                disabled={!!mevcutEvent}
                className={`w-full flex items-center p-stack-md mb-stack-sm font-data-sm text-data-sm uppercase transition-colors ${
                  !!mevcutEvent ? "opacity-50 cursor-not-allowed " : ""
                }${aktifSayfa === item.id
                  ? "bg-primary text-on-primary font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                  }`}
              >
                <span className="material-symbols-outlined mr-3">{item.icon}</span>
                {item.label}
              </button>
            </TutorialOdak>
          ))}
        </div>
        <div className="mt-auto">
          <TutorialOdak hedefId="yil-calistir-butonu">
            <button
              className="w-full bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 btn-shadow border border-outline transition-transform font-bold mb-6 disabled:opacity-50"
              onClick={handleYilAtlaTikla}
              disabled={loading || coachLoading || finalRaporLoading || !!mevcutEvent || !!sonucKarti || !!redenominasyonKarti || oyunBitti}
            >
              {loading ? "SİSTEM_MEŞGUL" : `YIL_${yil + 1} ÇALIŞTIR`}
            </button>
          </TutorialOdak>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto">
        {oyunBitti && (
          <div className="bg-primary-container border border-outline card-shadow p-stack-md text-background mb-stack-lg">
            <div className="font-headline-md text-headline-md font-black uppercase">Oyun Sona Erdi</div>
            <p className="font-data-sm text-data-sm uppercase mt-1 mb-4">
              {bitisSebebi === "yas_siniri" ? "95 yaşına ulaştın." : "Beklenmedik bir şekilde hayatın sona erdi."}
            </p>
            <button
              onClick={tekrarOyna}
              className="bg-background text-primary px-4 py-2 font-bold uppercase border border-outline btn-shadow transition-transform hover:bg-surface-container"
            >
              YENİDEN BAŞLA
            </button>
          </div>
        )}
        
        {hacizUyarisiAcik && (
          <div className="bg-error-container border border-error card-shadow p-stack-md text-on-error-container mb-stack-lg">
            <div className="font-headline-md text-headline-md font-black uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-4xl">warning</span>
              KRİTİK UYARI: HACİZ RİSKİ
            </div>
            <p className="font-data-sm text-data-sm mt-4 mb-2 opacity-90 leading-relaxed">
              Mevcut nakitiniz, önümüzdeki yılın tahmini giderleri ve kredi taksitlerinizi karşılamaya yetmiyor (Eksi bakiye). Eğer yılı ilerletirseniz <strong>HACİZ</strong> memurları kapınıza dayanacak.
            </p>
            <ul className="list-disc ml-6 text-sm mb-4 opacity-90 space-y-1">
              <li><strong>Haciz Nedir?</strong> Banka borçlarınızı karşılamak için elinizdeki Mevduat, Altın, Borsa, Araç ve Evlerinizi sırasıyla zorla satar.</li>
              <li><strong>İflas Nedir?</strong> Tüm mal varlığınız satılmasına rağmen borcunuz kapanmazsa iflas edersiniz. Borcunuz silinir ancak her şeyinizi kaybeder ve ağır psikolojik bunalıma girersiniz.</li>
            </ul>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setHacizUyarisiAcik(false)}
                className="bg-background text-error px-6 py-3 font-bold uppercase border border-error btn-shadow transition-transform hover:bg-surface-container"
              >
                İPTAL ET (VARLIK SATACAĞIM)
              </button>
              <button
                onClick={yilAtla}
                className="bg-error text-on-error px-6 py-3 font-bold uppercase border border-outline btn-shadow transition-transform hover:bg-opacity-80"
              >
                YİNE DE YIL ATLA (RİSKİ ALIYORUM)
              </button>
            </div>
          </div>
        )}

        {aktifSayfa === "ana" && (
          <div className="flex flex-col gap-stack-lg">
            {/* TEST BUTONU - GEÇİCİ */}
            <button
              onClick={() => { setYas(60); setYil(2062); nakitiGuncelle(nakitRef.current + 5000000); }}
              className="mt-4 bg-error-container text-on-error-container font-data-sm text-data-sm py-1 px-3 uppercase border border-error btn-shadow"
            >
              [DEV TEST] 60 YAŞINA ATLA VE PARA EKLE
            </button>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant pb-stack-md">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary uppercase flex items-center gap-2">
                  Ana Defter
                  <button onClick={() => setTutorialAcik(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">help</span>
                  </button>
                </h1>
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
                  label="Enflasyon"
                  value={sonuc ? `%${sonuc.enflasyon}` : "—"}
                  hint={sonuc ? sonuc.enf_durum : "SİSTEM_HAZIR"}
                  alert={krizMi}
                />
              </TutorialOdak>
            </div>

            {/* Event Panel or Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              {/* Event Section */}
              <TutorialOdak hedefId="event-kutusu">
                <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">
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
                          (s.kilit.tur === "nakit_usd" && nakit < s.kilit.min * fiyatlar.dolar_try) ||
                          (s.kilit.tur === "sektor_pozisyon_yuzdesi" && nakit < (portfoy[`bist_${s.kilit.sektor}_adet`] || 0) * (fiyatlar[`bist_${s.kilit.sektor}`] || 100) * s.kilit.oran)
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
                              {s.aksiyon && s.aksiyon.tip === "sektor_al" && (
                                <span className="text-[10px] px-1 font-bold uppercase bg-error text-background">
                                  Nakit -₺{Math.round((portfoy[`bist_${s.aksiyon.sektor}_adet`] || 0) * (fiyatlar[`bist_${s.aksiyon.sektor}`] || 100) * s.aksiyon.oran).toLocaleString("tr-TR")}
                                </span>
                              )}
                              {s.aksiyon && s.aksiyon.tip === "sektor_sat" && (
                                <span className="text-[10px] px-1 font-bold uppercase bg-[#34d399] text-black">
                                  Nakit +₺{Math.round((portfoy[`bist_${s.aksiyon.sektor}_adet`] || 0) * (fiyatlar[`bist_${s.aksiyon.sektor}`] || 100) * s.aksiyon.oran).toLocaleString("tr-TR")}
                                </span>
                              )}
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
                
                {sonuc?.fisilti && (
                  <div className="mt-4 pt-4 border-t border-outline flex flex-col gap-2 bg-surface-container-high p-3 rounded">
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] px-1 font-bold uppercase bg-[#f5c842] text-black">
                        Fısıltı Haber
                      </span>
                    </div>
                    <p className="text-sm font-data-sm italic text-on-surface-variant">
                      "{sonuc.fisilti}"
                    </p>
                  </div>
                )}
              </div>
              </TutorialOdak>

              {/* AI Coach Panel */}
              <TutorialOdak hedefId="yapay-zeka">
                <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">
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
              </TutorialOdak>
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
                  Borsa reel getiri: <strong className={sonuc.reel_bist >= 0 ? "text-primary" : "text-error"}>{formatPct(sonuc.reel_bist)}</strong>,
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
            aracPiyasasi={aracPiyasasi}
            sahipOlunanAraclar={sahipOlunanAraclar.map(arac => ({
              ...arac,
              guncelDeger: aracGuncelDegerHesapla(arac)
            }))}
            aracSatinAl={aracSatinAl}
            aracSat={aracSat}
            onAcTutorial={() => setTutorialAcik(true)}
            onBorsaDetay={() => setAktifSayfa("borsa")}
          />
        )}

        {aktifSayfa === "banka" && (
          <BankaSekmesi
            fiyatlar={fiyatlar}
            nakit={nakit}
            yillikGelir={yillikGelir}
            sahipOlunanEvler={sahipOlunanEvler}
            kredi={kredi}
            setKredi={setKredi}
            krediNotu={krediNotu}
            setKrediNotu={setKrediNotu}
            nakitiGuncelle={nakitiGuncelle}
            universiteYili={universiteYili}
            zorluk={zorluk}
            setBiasMetrics={setBiasMetrics}
          />
        )}

        {aktifSayfa === "borsa" && (
          <BorsaSayfasi
            fiyatGecmisi={fiyatGecmisi}
            fiyatlar={fiyatlar}
            portfoy={portfoy}
            sonuc={sonuc}
            varlikAl={varlikAl}
            varlikSat={varlikSat}
            nakit={nakit}
            toplamDeger={toplamDeger}
            onGeri={() => setAktifSayfa("varliklar")}
            onAcTutorial={() => setTutorialAcik(true)}
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
            yillikGelir={yillikGelir}
            oturulanEvVarMi={!!oturulanEvId}
          />
        )}
        
        {aktifSayfa === "kariyer" && (
          <KariyerSayfasi
            nakit={nakit}
            setNakit={setNakit}
            isYeri={isYeri}
            setIsYeri={setIsYeri}
            sinavPuani={sinavPuani}
            setSinavPuani={setSinavPuani}
            okunanBolum={okunanBolum}
            setOkunanBolum={setOkunanBolum}
            universiteYili={universiteYili}
            setUniversiteYili={setUniversiteYili}
            mezunOlunanBolum={mezunOlunanBolum}
            calismaBari={calismaBari}
            setCalismaBari={setCalismaBari}
            isIlanlari={isIlanlari}
            setIsIlanlari={setIsIlanlari}
            bars={bars}
            setBars={setBars}
            mezunaKalmaSayisi={mezunaKalmaSayisi}
            setMezunaKalmaSayisi={setMezunaKalmaSayisi}
            buYilSinavaGirdiMi={buYilSinavaGirdiMi}
            setBuYilSinavaGirdiMi={setBuYilSinavaGirdiMi}
            sikiCalisAktif={sikiCalisAktif}
            setSikiCalisAktif={setSikiCalisAktif}
            setTemelMaas={setTemelMaas}
            setYillikGelir={setYillikGelir}
            setIsLevel={setIsLevel}
            yil={yil}
            yas={yas}
            cvGecmisi={cvGecmisi}
            setCvGecmisi={setCvGecmisi}
            maasEndeksi={maasEndeksi}
            isLevel={isLevel}
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
            onAcTutorial={() => setTutorialAcik(true)}
          />
        )}

        <TutorialModal isOpen={tutorialAcik} onClose={() => setTutorialAcik(false)} page={aktifSayfa} />
        <TutorialKutusu />
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
  const minYas = 80
  const maxYas = 94
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

export default function App() {
  return (
    <TutorialProvider adimlar={TUTORIAL_ADIMLARI}>
      <AppInner />
    </TutorialProvider>
  )
}
