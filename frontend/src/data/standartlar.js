export const YASAM_STANDARTLARI = {
  yemek: {
    label: "Yemek",
    icon: "🍽",
    secenekler: [
      { id: "dusuk", label: "Ev yemeği / ekonomik", aylik_usd: 100, mutluluk_etki: -2, sabir_etki: -1 },
      { id: "orta", label: "Karma, ara sıra dışarıda", aylik_usd: 200, mutluluk_etki: 1, sabir_etki: 1 },
      { id: "yuksek", label: "Sağlıklı / sık dışarıda", aylik_usd: 400, mutluluk_etki: 3, sabir_etki: 2 },
    ]
  },
  ulasim: {
    label: "Ulaşım",
    icon: "🚌",
    secenekler: [
      { id: "dusuk", label: "Toplu taşıma", aylik_usd: 30, mutluluk_etki: -2, sabir_etki: -2 },
      { id: "kendi_araci", label: "Kendi Aracın", aylik_usd: 80, mutluluk_etki: 3, sabir_etki: 2, kilit: "arac" },
    ]
  },
  konut: {
    label: "Konut",
    icon: "🏠",
    secenekler: [
      { id: "dusuk", label: "Paylaşım / küçük kira", aylik_usd: 150, mutluluk_etki: -3, sabir_etki: -2 },
      { id: "orta", label: "Tek kira", aylik_usd: 300, mutluluk_etki: 1, sabir_etki: 1 },
      { id: "yuksek", label: "Büyük kira", aylik_usd: 600, mutluluk_etki: 3, sabir_etki: 2 },
      { id: "kendi_ev", label: "Kendi evin", aylik_usd: 50, mutluluk_etki: 5, sabir_etki: 3, kilit: "ev" },
    ]
  },
  saglik: {
    label: "Sağlık",
    icon: "🏥",
    secenekler: [
      { id: "dusuk", label: "Devlet hastanesi", aylik_usd: 10, mutluluk_etki: -2, sabir_etki: -2 },
      { id: "orta", label: "Özel + devlet karma", aylik_usd: 40, mutluluk_etki: 1, sabir_etki: 1 },
      { id: "yuksek", label: "Tam özel", aylik_usd: 100, mutluluk_etki: 3, sabir_etki: 2 },
    ]
  },
}

export const VARSAYILAN_STANDARTLAR = {
  yemek: "dusuk",
  ulasim: "dusuk",
  konut: "dusuk",
  saglik: "dusuk",
}

export function toplamAylikUsd(secimler, standartlar) {
  return Object.entries(standartlar).reduce((toplam, [kategori, veri]) => {
    const secim = secimler[kategori] || "dusuk";
    const secenek = veri.secenekler.find(s => s.id === secim);
    return toplam + (secenek ? secenek.aylik_usd : 0);
  }, 0);
}

export function yasamKalitesiEtkisi(secimler, standartlar) {
  return Object.entries(standartlar).reduce((toplam, [kategori, veri]) => {
    const secim = secimler[kategori] || "dusuk";
    const secenek = veri.secenekler.find(s => s.id === secim);
    return {
      mutluluk: toplam.mutluluk + (secenek ? secenek.mutluluk_etki : 0),
      sabir: toplam.sabir + (secenek ? secenek.sabir_etki : 0),
    };
  }, { mutluluk: 0, sabir: 0 });
}

export function luksPuaniHesapla(secimler, sahipOlunanEvler = [], iliskiler = []) {
  let puan = 0;
  
  // Yemek
  if (secimler.yemek === "orta") puan += 1;
  else if (secimler.yemek === "yuksek") puan += 2;
  
  // Ulaşım
  if (secimler.ulasim === "kendi_araci") puan += 2;
  
  // Sosyal/Sağlık (using saglik as a proxy for extra spending right now, or just limit to what we have)
  if (secimler.saglik === "orta") puan += 1;
  else if (secimler.saglik === "yuksek") puan += 2;
  
  // Konut
  if (secimler.konut === "orta") puan += 1;
  else if (secimler.konut === "yuksek") puan += 2;
  else if (secimler.konut === "kendi_ev") {
    // If they own a house, check the most expensive house they live in
    // Assuming the player lives in their most expensive house.
    // If no house is owned (shouldn't happen with kendi_ev, but just in case), score 2
    let evPuani = 2;
    if (sahipOlunanEvler.length > 0) {
      const maxFiyat = Math.max(...sahipOlunanEvler.map(e => e.fiyat_usd_taban));
      if (maxFiyat >= 300000) evPuani = 4; // Pahalı ev
      else if (maxFiyat >= 100000) evPuani = 3; // Orta ev
    }
    puan += evPuani;
  }
  
  // Çocuk Harcamaları
  iliskiler.filter(k => k.tip === "cocuk").forEach(cocuk => {
    const secim = secimler[`cocuk_${cocuk.id}`] || "dusuk";
    if (secim === "orta") puan += 1;
    if (secim === "yuksek") puan += 3;
  });
  
  return puan;
}

export function getDinamikStandartlar(iliskiler = []) {
  const dinamik = {};
  
  iliskiler.filter(k => k.tip === "cocuk").forEach(cocuk => {
    if (cocuk.yas >= 0 && cocuk.yas <= 3) {
      dinamik[`cocuk_${cocuk.id}`] = {
        label: `${cocuk.isim} (Bebek)`,
        icon: "🍼",
        secenekler: [
          { id: "dusuk", label: "Temel Bakım", aylik_usd: 100, mutluluk_etki: -1, sabir_etki: -1 },
          { id: "orta", label: "İyi Bakım", aylik_usd: 250, mutluluk_etki: 2, sabir_etki: 1 },
          { id: "yuksek", label: "Premium Bakım", aylik_usd: 500, mutluluk_etki: 4, sabir_etki: 2 },
        ]
      };
    } else if (cocuk.yas >= 4 && cocuk.yas <= 20) {
      dinamik[`cocuk_${cocuk.id}`] = {
        label: `${cocuk.isim} (Eğitim)`,
        icon: "🎒",
        secenekler: [
          { id: "dusuk", label: "Devlet Okulu", aylik_usd: 50, mutluluk_etki: -2, sabir_etki: -1 },
          { id: "orta", label: "Özel Okul & Kurs", aylik_usd: 400, mutluluk_etki: 3, sabir_etki: 2 },
          { id: "yuksek", label: "Elit Kolej", aylik_usd: 1000, mutluluk_etki: 6, sabir_etki: 3 },
        ]
      };
    }
  });

  iliskiler.filter(k => k.nafaka).forEach(eskiEs => {
    dinamik[`nafaka_${eskiEs.id}`] = {
      label: `Nafaka (${eskiEs.isim})`,
      icon: "💔",
      secenekler: [
        { id: "dusuk", label: "Mahkeme Kararı", aylik_usd: 500, mutluluk_etki: 0, sabir_etki: 0 }
      ]
    };
  });
  
  return dinamik;
}