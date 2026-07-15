export const YASAM_STANDARTLARI = {
  yemek: {
    label: "Yemek",
    icon: "🍽",
    secenekler: [
      { id: "dusuk", label: "Ev yemeği / ekonomik", aylik_usd: 15, mutluluk_etki: -1, sabir_etki: 0 },
      { id: "orta", label: "Karma, ara sıra dışarıda", aylik_usd: 25, mutluluk_etki: 1, sabir_etki: 1 },
      { id: "yuksek", label: "Sağlıklı / sık dışarıda", aylik_usd: 45, mutluluk_etki: 3, sabir_etki: 2 },
    ]
  },
  ulasim: {
    label: "Ulaşım",
    icon: "🚌",
    secenekler: [
      { id: "dusuk", label: "Toplu taşıma", aylik_usd: 10, mutluluk_etki: -1, sabir_etki: -1 },
      { id: "orta", label: "İkinci el araç", aylik_usd: 40, mutluluk_etki: 1, sabir_etki: 1 },
      { id: "yuksek", label: "Sıfır araç", aylik_usd: 80, mutluluk_etki: 3, sabir_etki: 2 },
    ]
  },
  konut: {
    label: "Konut",
    icon: "🏠",
    secenekler: [
      { id: "dusuk", label: "Paylaşım / küçük kira", aylik_usd: 50, mutluluk_etki: -2, sabir_etki: -1 },
      { id: "orta", label: "Tek kira", aylik_usd: 100, mutluluk_etki: 1, sabir_etki: 1 },
      { id: "yuksek", label: "Büyük kira", aylik_usd: 200, mutluluk_etki: 3, sabir_etki: 2 },
      { id: "kendi_ev", label: "Kendi evin", aylik_usd: 25, mutluluk_etki: 5, sabir_etki: 3, kilit: "ev" },
    ]
  },
  saglik: {
    label: "Sağlık",
    icon: "🏥",
    secenekler: [
      { id: "dusuk", label: "Devlet hastanesi", aylik_usd: 5, mutluluk_etki: -1, sabir_etki: -1 },
      { id: "orta", label: "Özel + devlet karma", aylik_usd: 15, mutluluk_etki: 1, sabir_etki: 1 },
      { id: "yuksek", label: "Tam özel", aylik_usd: 35, mutluluk_etki: 3, sabir_etki: 2 },
    ]
  },
}

export const VARSAYILAN_STANDARTLAR = {
  yemek: "dusuk",
  ulasim: "dusuk",
  konut: "orta",
  saglik: "dusuk",
}

export function toplamAylikUsd(secimler, standartlar) {
  return Object.entries(standartlar).reduce((toplam, [kategori, veri]) => {
    const secim = secimler[kategori]
    const secenek = veri.secenekler.find(s => s.id === secim)
    return toplam + (secenek ? secenek.aylik_usd : 0)
  }, 0)
}

export function yasamKalitesiEtkisi(secimler, standartlar) {
  return Object.entries(standartlar).reduce((toplam, [kategori, veri]) => {
    const secim = secimler[kategori]
    const secenek = veri.secenekler.find(s => s.id === secim)
    return {
      mutluluk: toplam.mutluluk + (secenek ? secenek.mutluluk_etki : 0),
      sabir: toplam.sabir + (secenek ? secenek.sabir_etki : 0),
    }
  }, { mutluluk: 0, sabir: 0 })
}