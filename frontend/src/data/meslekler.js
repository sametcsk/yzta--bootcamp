// Meslek başına level bazlı pozisyon adları ve gelir çarpanları.
// Gelir = temelMaas * MESLEKLER[meslek].levelCarpani[level]
// temelMaas sadece enflasyonla büyür, level ayrı bir çarpan katmanıdır.

export const MESLEKLER = {
  // --- Emeklilik ---
  emekli: {
    ad: "Emekli",
    temelMaas: 100000,
    gereksinim: null,
    pozisyonAdi: {
      1: "Emekli",
      2: "Kıdemli Emekli",
      3: "Uzman Emekli",
      4: "Baş Emekli",
      5: "Gazi Emekli",
    },
    levelCarpani: { 1: 1.00, 2: 1.00, 3: 1.00, 4: 1.00, 5: 1.00 },
    sabir: 5, mutluluk: 5
  },

  // --- Vasıflı (Diplomalı) İşler ---
  muhendis: {
    ad: "Mühendis",
    temelMaas: 240000,
    gereksinim: "muhendislik",
    pozisyonAdi: {
      1: "Junior Mühendis",
      2: "Mid-Level Mühendis",
      3: "Senior Mühendis",
      4: "Proje Yöneticisi",
      5: "CTO / Direktör",
    },
    levelCarpani: { 1: 1.00, 2: 1.30, 3: 1.70, 4: 2.20, 5: 3.00 },
    sabir: -2, mutluluk: -1
  },
  doktor: {
    ad: "Doktor",
    temelMaas: 300000,
    gereksinim: "tip",
    pozisyonAdi: {
      1: "Asistan Hekim",
      2: "Uzman Hekim",
      3: "Başasistan",
      4: "Doçent",
      5: "Profesör / Başhekim",
    },
    levelCarpani: { 1: 1.00, 2: 1.50, 3: 2.00, 4: 2.60, 5: 3.50 },
    sabir: -4, mutluluk: -2
  },
  ekonomist: {
    ad: "Ekonomist / Bankacı",
    temelMaas: 220000,
    gereksinim: "finans",
    pozisyonAdi: {
      1: "Uzman Yardımcısı",
      2: "Uzman",
      3: "Yönetici",
      4: "Şube/Bölge Müdürü",
      5: "CEO / Genel Müdür",
    },
    levelCarpani: { 1: 1.00, 2: 1.25, 3: 1.60, 4: 2.10, 5: 3.20 },
    sabir: -1, mutluluk: -2
  },
  tasarimci: {
    ad: "Tasarımcı / Sanatçı",
    temelMaas: 200000,
    gereksinim: "guzel_sanatlar",
    pozisyonAdi: {
      1: "Asistan Tasarımcı",
      2: "Tasarımcı",
      3: "Kıdemli Tasarımcı",
      4: "Sanat Yönetmeni",
      5: "Kreatif Direktör",
    },
    levelCarpani: { 1: 1.00, 2: 1.20, 3: 1.50, 4: 1.90, 5: 2.50 },
    sabir: -1, mutluluk: +1
  },

  // --- Vasıfsız İşler ---
  garson: {
    ad: "Garson",
    temelMaas: 204000, // asgari ücrete yakın (17k * 12)
    gereksinim: null,
    pozisyonAdi: { 1: "Komi", 2: "Garson", 3: "Şef Garson", 4: "Müdür Yrd", 5: "Restoran Müdürü" },
    levelCarpani: { 1: 1.00, 2: 1.10, 3: 1.25, 4: 1.40, 5: 1.60 },
    sabir: -2, mutluluk: -1
  },
  kurye: {
    ad: "Kurye",
    temelMaas: 240000,
    gereksinim: null,
    pozisyonAdi: { 1: "Bisikletli Kurye", 2: "Moto Kurye", 3: "Bölge Sorumlusu", 4: "Operasyon Şefi", 5: "Lojistik Yöneticisi" },
    levelCarpani: { 1: 1.00, 2: 1.15, 3: 1.25, 4: 1.35, 5: 1.50 },
    sabir: -3, mutluluk: -1
  },
  kasiyer: {
    ad: "Kasiyer",
    temelMaas: 204000,
    gereksinim: null,
    pozisyonAdi: { 1: "Kasiyer", 2: "Kıdemli Kasiyer", 3: "Vardiya Amiri", 4: "Mağaza Müdür Yrd", 5: "Mağaza Müdürü" },
    levelCarpani: { 1: 1.00, 2: 1.05, 3: 1.15, 4: 1.30, 5: 1.50 },
    sabir: -1, mutluluk: -1
  },
  depo_iscisi: {
    ad: "Depo İşçisi",
    temelMaas: 204000,
    gereksinim: null,
    pozisyonAdi: { 1: "Depo Görevlisi", 2: "Forklift Operatörü", 3: "Takım Lideri", 4: "Depo Amiri", 5: "Depo Müdürü" },
    levelCarpani: { 1: 1.00, 2: 1.15, 3: 1.30, 4: 1.45, 5: 1.65 },
    sabir: -2, mutluluk: -2
  },
  sofor: {
    ad: "Şoför",
    temelMaas: 216000,
    gereksinim: null,
    pozisyonAdi: { 1: "Minibüs Şoförü", 2: "Taksi Şoförü", 3: "Özel Şoför", 4: "VIP Şoför", 5: "Filo Yöneticisi" },
    levelCarpani: { 1: 1.00, 2: 1.10, 3: 1.25, 4: 1.45, 5: 1.70 },
    sabir: -3, mutluluk: 0
  },
  guvenlik: {
    ad: "Güvenlik Görevlisi",
    temelMaas: 204000,
    gereksinim: null,
    pozisyonAdi: { 1: "Güvenlik Görevlisi", 2: "Kıdemli Güvenlik", 3: "Vardiya Şefi", 4: "Güvenlik Amiri", 5: "Güvenlik Müdürü" },
    levelCarpani: { 1: 1.00, 2: 1.05, 3: 1.15, 4: 1.30, 5: 1.50 },
    sabir: -2, mutluluk: -1
  },
  temizlik: {
    ad: "Temizlik Görevlisi",
    temelMaas: 204000,
    gereksinim: null,
    pozisyonAdi: { 1: "Temizlik Görevlisi", 2: "Kıdemli Temizlik", 3: "Kat Şefi", 4: "Temizlik Amiri", 5: "Hizmet Yöneticisi" },
    levelCarpani: { 1: 1.00, 2: 1.05, 3: 1.12, 4: 1.20, 5: 1.35 },
    sabir: -1, mutluluk: -2
  },
  // Özel Statü
  lise_mezunu: {
    ad: "Öğrenci / İşsiz",
    temelMaas: 0,
    gereksinim: null,
    pozisyonAdi: { 1: "Öğrenci / İşsiz" },
    levelCarpani: { 1: 1.00 }
  }
}

export function pozisyonAdiGetir(meslek, level) {
  if (meslek === "lise_mezunu") return "Öğrenci / İşsiz"
  return MESLEKLER[meslek]?.pozisyonAdi[level] || MESLEKLER[meslek]?.ad || null
}

export function levelCarpaniGetir(meslek, level) {
  return MESLEKLER[meslek]?.levelCarpani[level] || 1.00
}

export function yeniIlanlarUret(maasEndeksi = 1.0) {
  const vasifliIsler = ["muhendis", "doktor", "ekonomist", "tasarimci"];
  const vasifsizIsler = ["garson", "kurye", "kasiyer", "depo_iscisi", "sofor", "guvenlik", "temizlik"];
  
  // Listeleri karıştır
  const karisikVasifli = vasifliIsler.sort(() => 0.5 - Math.random());
  const karisikVasifsiz = vasifsizIsler.sort(() => 0.5 - Math.random());
  
  // 2-3 vasıflı, 3-4 vasıfsız toplam 6 ilan al
  const vasifliSayisi = Math.floor(Math.random() * 2) + 2; // 2 veya 3
  const secilenIsler = [
    ...karisikVasifli.slice(0, vasifliSayisi),
    ...karisikVasifsiz.slice(0, 6 - vasifliSayisi)
  ];
  
  // İlan objelerini oluştur
  const yeniIlanlar = secilenIsler.map((isKey, i) => {
    const meslek = MESLEKLER[isKey];
    return {
      id: `ilan_${Date.now()}_${i}`,
      isKey: isKey,
      ad: meslek.ad,
      maas: Math.round(meslek.temelMaas * maasEndeksi),
      sabirEtkisi: meslek.sabir || 0,
      mutlulukEtkisi: meslek.mutluluk || 0,
      gereksinim: meslek.gereksinim
    };
  });
  
  // Son bir kez karıştırıp dön
  return yeniIlanlar.sort(() => 0.5 - Math.random());
}
