export const SORULAR = [
  {
    id: 1,
    kategori: "Aile",
    soru: "Çocukluğunda maddi durumunuz nasıldı?",
    secenekler: [
      { metin: "Rahattık, ihtiyacımız yoktu", nakit: 80000, sabir: 0, mutluluk: 10, risk: 1, kilit: null },
      { metin: "Orta halli, idare ettik", nakit: 0, sabir: 5, mutluluk: 5, risk: 1, kilit: null },
      { metin: "Zorlandık, kısıtlıydık", nakit: -30000, sabir: 15, mutluluk: -5, risk: 1, kilit: null },
    ]
  },
  {
    id: 2,
    kategori: "Okul",
    soru: "Lise hayatın nasıldı?",
    secenekler: [
      { metin: "Çok çalıştım, başarılıydım", nakit: 0, sabir: 15, mutluluk: 0, risk: 1, kilit: null },
      { metin: "Dengeli bir öğrenciydim", nakit: 0, sabir: 5, mutluluk: 10, risk: 1, kilit: null },
      { metin: "Okula pek önem vermedim", nakit: 0, sabir: -5, mutluluk: 10, risk: 1, kilit: null },
    ]
  },
  {
    id: 3,
    kategori: "İlk Para",
    soru: "İlk kez para kazandığında ne yaptın?",
    secenekler: [
      { metin: "Biriktirdim", nakit: 20000, sabir: 10, mutluluk: 0, risk: 0, kilit: null },
      { metin: "Bir şeyler aldım, harcadım", nakit: -10000, sabir: -5, mutluluk: 10, risk: 2, kilit: null },
      { metin: "Aileye verdim", nakit: -8000, sabir: 5, mutluluk: 15, risk: 1, kilit: { tur: "mutluluk", min: 10 } },
    ]
  },
  {
    id: 4,
    kategori: "Üniversite",
    soru: "Üniversiteye gittin mi?",
    secenekler: [
      { metin: "Gittim, burslu", nakit: 0, sabir: 15, mutluluk: 10, risk: 0, kilit: null },
      { metin: "Gittim, borçla", nakit: -60000, sabir: 10, mutluluk: 5, risk: 2, kilit: { tur: "nakit", min: 60000 } },
      { metin: "Gitmedim, erken çalıştım", nakit: 40000, sabir: -5, mutluluk: -5, risk: 1, kilit: null },
    ]
  },
  {
    id: 5,
    kategori: "Askerlik",
    soru: "Askerliğini nasıl yaptın?",
    secenekler: [
      { metin: "Bedelli yaptım", nakit: -100000, sabir: 5, mutluluk: 15, risk: 1, kilit: { tur: "nakit", min: 100000 } },
      { metin: "Normal yaptım", nakit: 0, sabir: 10, mutluluk: -10, risk: 1, kilit: null },
      { metin: "Tecil ettirdim / muaf oldum", nakit: 0, sabir: 0, mutluluk: 0, risk: 1, kilit: null },
    ]
  },
  {
    id: 6,
    kategori: "İlk İş",
    soru: "İlk işini nasıl buldun?",
    secenekler: [
      {
        metin: "Alanımda iyi bir iş buldum",
        meslek: "beyaz_yaka",
        nakit: 30000, sabir: 10, mutluluk: 10, risk: 0,
        gelir: 300000,
        gelir_aciklama: "Aylık ~25.000 ₺",
        kilit: { tur: "sabir", min: 20 }
      },
      {
        metin: "İstediğim değil ama çalıştım",
        meslek: "memur",
        nakit: 20000, sabir: 5, mutluluk: -5, risk: 1,
        gelir: 216000,
        gelir_aciklama: "Aylık ~18.000 ₺",
        kilit: null
      },
      {
        metin: "Uzun süre aradım, zor oldu",
        meslek: "mavi_yaka",
        nakit: -15000, sabir: 15, mutluluk: -10, risk: 1,
        gelir: 144000,
        gelir_aciklama: "Aylık ~12.000 ₺",
        kilit: null
      },
      {
        metin: "Emlakçılığa başladım",
        meslek: "emlakci",
        nakit: 0, sabir: 0, mutluluk: 0, risk: 1,
        gelir: 180000,
        gelir_aciklama: null,
        kilit: { tur: "gelistirilmemis", mesaj: "Gayrimenkul sistemi eklendiğinde açılacak" }
      },
      {
        metin: "Kendi işimi kurdum",
        meslek: "girisimci",
        nakit: 0, sabir: 0, mutluluk: 0, risk: 2,
        gelir: 180000,
        gelir_aciklama: null,
        kilit: { tur: "gelistirilmemis", mesaj: "Girişimcilik sistemi eklendiğinde açılacak" }
      },
    ]
  },
  {
    id: 7,
    kategori: "İlk Maaş",
    soru: "İlk maaşını ne yaptın?",
    secenekler: [
      { metin: "Kira + birikim planı yaptım", nakit: 15000, sabir: 10, mutluluk: 0, risk: 0, kilit: null },
      { metin: "Kendime bir şey aldım", nakit: -20000, sabir: -5, mutluluk: 15, risk: 1, kilit: { tur: "nakit", min: 20000 } },
      { metin: "Hepsini harcadım", nakit: -30000, sabir: -10, mutluluk: 10, risk: 2, kilit: { tur: "nakit", min: 30000 } },
    ]
  },
  {
    id: 8,
    kategori: "Aile Desteği",
    soru: "Hayata başlarken aileden destek var mıydı?",
    secenekler: [
      { metin: "Hem maddi hem manevi destek aldım", nakit: 60000, sabir: 0, mutluluk: 15, risk: 0, kilit: null },
      { metin: "Sadece manevi destek vardı", nakit: 0, sabir: 10, mutluluk: 10, risk: 1, kilit: null },
      { metin: "Kendi başımaydım", nakit: -20000, sabir: 20, mutluluk: -5, risk: 2, kilit: null },
    ]
  },
  {
    id: 9,
    kategori: "Risk",
    soru: "Hayatında büyük bir risk aldın mı?",
    secenekler: [
      { metin: "Evet, aldım ve işe yaradı", nakit: 80000, sabir: 5, mutluluk: 15, risk: 2, kilit: { tur: "sabir", min: 30 } },
      { metin: "Evet, aldım ama olmadı", nakit: -60000, sabir: 15, mutluluk: -10, risk: 2, kilit: { tur: "nakit", min: 60000 } },
      { metin: "Hayır, temkinli davrandım", nakit: 10000, sabir: 5, mutluluk: 5, risk: 0, kilit: null },
    ]
  },
  {
    id: 10,
    kategori: "Para Alışkanlığı",
    soru: "Parana genel olarak nasıl yaklaşırsın?",
    secenekler: [
      { metin: "Her ay birikim yaparım", nakit: 20000, sabir: 15, mutluluk: 0, risk: 0, kilit: null },
      { metin: "Gelirim yetiyorsa biriktiririm", nakit: 8000, sabir: 5, mutluluk: 5, risk: 1, kilit: null },
      { metin: "Anı yaşarım, birikim ikinci planda", nakit: -20000, sabir: -10, mutluluk: 15, risk: 2, kilit: { tur: "nakit", min: 20000 } },
    ]
  },
]

export const BASLANGIC = { nakit: 150000, sabir: 50, mutluluk: 50 }
export const YASAM_GIDERI = 120000  // yıllık, enflasyonla artacak