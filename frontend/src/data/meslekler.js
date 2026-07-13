// Meslek başına level bazlı pozisyon adları ve gelir çarpanları.
// Gelir = temelMaas * MESLEKLER[meslek].levelCarpani[level]
// temelMaas sadece enflasyonla büyür, level ayrı bir çarpan katmanıdır.

export const MESLEKLER = {
  beyaz_yaka: {
    ad: "Beyaz Yaka",
    temelMaas: 300000,
    pozisyonAdi: {
      1: "Uzman Yardımcısı",
      2: "Uzman",
      3: "Kıdemli Uzman",
      4: "Departman Yöneticisi",
      5: "Genel Müdür Yardımcısı",
    },
    levelCarpani: {
      1: 1.00,
      2: 1.15,
      3: 1.35,
      4: 1.60,
      5: 2.00,
    },
  },
  memur: {
    ad: "Memur",
    temelMaas: 216000,
    pozisyonAdi: {
      1: "Memur Adayı",
      2: "Memur",
      3: "Kıdemli Memur",
      4: "Şef",
      5: "Şube Müdürü",
    },
    levelCarpani: {
      1: 1.00,
      2: 1.10,
      3: 1.20,
      4: 1.32,
      5: 1.45,
    },
  },
  mavi_yaka: {
    ad: "Mavi Yaka",
    temelMaas: 144000,
    pozisyonAdi: {
      1: "Çırak",
      2: "Kalfa",
      3: "Usta",
      4: "Baş Usta",
      5: "Atölye/Vardiya Şefi",
    },
    levelCarpani: {
      1: 1.00,
      2: 1.12,
      3: 1.28,
      4: 1.48,
      5: 1.70,
    },
  },
}

export function pozisyonAdiGetir(meslek, level) {
  return MESLEKLER[meslek]?.pozisyonAdi[level] || null
}

export function levelCarpaniGetir(meslek, level) {
  return MESLEKLER[meslek]?.levelCarpani[level] || 1.00
}
