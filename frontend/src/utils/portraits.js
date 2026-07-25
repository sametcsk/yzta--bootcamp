export function getPortraitPath(kisi, mevcutYas) {
  // Eğer kişi ana karakterse (kisi prop'u "main" tipindeyse veya string ise)
  if (!kisi) return "/portraits/main/wc/3.png"; // Fallback

  if (kisi.tip === "main") {
    const isOld = mevcutYas >= 40;
    const folder = kisi.cinsiyet === "erkek" ? "mc" : "wc";
    return `/portraits/main/${folder}/${isOld ? 4 : 3}.png`;
  }

  // Anne / Baba
  if (kisi.tip === "aile") {
    if (kisi.id === "anne") return "/portraits/parents/3.png";
    if (kisi.id === "baba") return "/portraits/parents/4.png";
  }

  // Çocuklar (4 Aşama)
  if (kisi.tip === "cocuk") {
    let stage = 1;
    if (kisi.yas >= 40) stage = 4;
    else if (kisi.yas >= 18) stage = 3;
    else if (kisi.yas >= 4) stage = 2;
    
    // Fallback: eğer portraitId yoksa rastgele ata ama olmalı
    const pId = kisi.portraitId || (kisi.cinsiyet === "erkek" ? "m1" : "w1");
    return `/portraits/kids/${pId}/${stage}.png`;
  }

  // Eş, Date, Arkadaş (Yetişkin - 2 Aşama)
  if (["es", "eski_es", "date", "arkadas"].includes(kisi.tip)) {
    const isOld = kisi.yas >= 40;
    const pId = kisi.portraitId || (kisi.cinsiyet === "erkek" ? "m1" : "w1");
    return `/portraits/adults/${pId}/${isOld ? 4 : 3}.png`;
  }

  // Bilinmeyen bir tip gelirse
  return "/portraits/adults/w1/3.png";
}

export function siradakiPortreyiAl(cinsiyet, tip, mevcutSiralar) {
  // tip: "cocuk" veya "yetiskin"
  let newSira = { ...mevcutSiralar };
  let secilenId = "";

  if (tip === "cocuk") {
    if (cinsiyet === "erkek") {
      const idx = (newSira.kids_m % 2) + 1; // m1, m2 (2 seçenek var)
      secilenId = `m${idx}`;
      newSira.kids_m += 1;
    } else {
      const idx = (newSira.kids_w % 2) + 1; // w1, w2 (2 seçenek var)
      secilenId = `w${idx}`;
      newSira.kids_w += 1;
    }
  } else {
    // yetiskin (adults)
    if (cinsiyet === "erkek") {
      const idx = (newSira.adults_m % 3) + 1; // m1, m2, m3 (3 seçenek var)
      secilenId = `m${idx}`;
      newSira.adults_m += 1;
    } else {
      const idx = (newSira.adults_w % 4) + 1; // w1, w2, w3, w4 (4 seçenek var)
      secilenId = `w${idx}`;
      newSira.adults_w += 1;
    }
  }

  return { secilenId, newSira };
}
