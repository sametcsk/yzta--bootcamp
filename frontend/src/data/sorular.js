export const BASLANGIC = {
  nakit: 0,
  sabir: 50,
  mutluluk: 50
};

export const SORULAR = [
  {
    id: 1,
    kategori: "Zorluk",
    soru: "Hayata atıldığın o ilk günlerde, ailenden sana kalan maddi destek nasıldı?",
    info_mesaji: "Dikkat: Buradaki seçiminiz, oyuna başlayacağınız nakit miktarını ve oyunun genel zorluk seviyesini doğrudan belirleyecektir.",
    secenekler: [
      { metin: "Güvence sağlayan bir yatırım hesabı, araba ve bolca nakit.", nakit: 200000, sabir: -5, mutluluk: 15, risk: 1, kilit: null, bias_skor: { zorluk: "Kolay" } },
      { metin: "Standart bir harçlık, kendi başımın çaresine bakabileceğim kadar ufak bir destek.", nakit: 50000, sabir: 5, mutluluk: 5, risk: 1, kilit: null, bias_skor: { zorluk: "Orta" } },
      { metin: "Sıfır. Cebimde sadece büyük hayallerim ve devasa öğrenim kredisi borcum var.", nakit: 5000, sabir: 15, mutluluk: -5, risk: 1, kilit: null, bias_skor: { zorluk: "Zor" } },
    ]
  },
  {
    id: 2,
    kategori: "Risk Tercihi",
    soru: "Bir yarışmadasın. Kesin olarak 50.000 TL kazanma şansın var. Ama istersen yazı-tura atabilirsin; bilirsen 120.000 TL kazanacaksın, bilemezsen hiçbir şey alamayacaksın. Ne yaparsın?",
    secenekler: [
      { metin: "Asla riske girmem, kesin olan 50.000 TL'yi alır çıkarım.", nakit: 0, sabir: 5, mutluluk: -5, risk: 1, kilit: null, bias_skor: { loss_aversion: 100 } },
      { metin: "Çok kararsız kalsam da sanırım 50.000 TL ile yetinirim.", nakit: 0, sabir: 0, mutluluk: 0, risk: 1, kilit: null, bias_skor: { loss_aversion: 50 } },
      { metin: "Yazı-tura atarım! 120.000 TL için o riske değer.", nakit: 0, sabir: -5, mutluluk: 5, risk: 1, kilit: null, bias_skor: { loss_aversion: 0 } },
    ]
  },
  {
    id: 3,
    kategori: "Zihinsel Muhasebe",
    soru: "Uzun zamandır almak istediğin o pahalı telefon var ama bütçen sıkışık. Yolda yürürken içinde tam da o telefonun parası kadar nakit olan sahipsiz bir zarf buldun (ve sahibini bulman imkansız). Parayı nasıl harcarsın?",
    secenekler: [
      { metin: "Havadan geldi! Hiç düşünmeden o parayla o telefonu alırım.", nakit: 0, sabir: -5, mutluluk: 10, risk: 1, kilit: null, bias_skor: { mental_accounting: 100 } },
      { metin: "Yarısıyla bir hevesimi alır, kalanını acil duruma veya birikime ayırırım.", nakit: 0, sabir: 0, mutluluk: 5, risk: 1, kilit: null, bias_skor: { mental_accounting: 50 } },
      { metin: "Bu parayı kendi alın terimmiş gibi düşünürüm. Lükse harcamaz, kenara atarım.", nakit: 0, sabir: 10, mutluluk: -5, risk: 1, kilit: null, bias_skor: { mental_accounting: 0 } },
    ]
  },
  {
    id: 4,
    kategori: "Zararına Satma Ikilemi",
    soru: "İki yıl önce büyük heveslerle 20.000 TL'ye aldığın bir eşya şu an ikinci elde sadece 4.000 TL ediyor. Ve senin acil 4.000 TL nakde ihtiyacın var. Eşyayı satar mısın?",
    secenekler: [
      { metin: "Hayatta satmam! Ben ona 20.000 TL verdim, 4 bine vereceğime evde çürüsün daha iyi.", nakit: 0, sabir: 10, mutluluk: -5, risk: 1, kilit: null, bias_skor: { anchoring: 100 } },
      { metin: "Çok üzülerek satarım ama aklım hep o 20.000 TL'de kalır, içim içimi yer.", nakit: 0, sabir: 0, mutluluk: -5, risk: 1, kilit: null, bias_skor: { anchoring: 50 } },
      { metin: "Geçmiş geçmişte kaldı. Şu anki piyasa değeri 4 bin TL ise ve paraya ihtiyacım varsa hemen satarım.", nakit: 0, sabir: -5, mutluluk: 5, risk: 1, kilit: null, bias_skor: { anchoring: 0 } },
    ]
  },
  {
    id: 5,
    kategori: "Elden Çıkarma Etkisi",
    soru: "Bir yatırım yaptın ve sadece 1 ay içinde %50 kâr ettin! Herkes trendin daha da yükseleceğini konuşuyor ama sen çoktan büyük bir kazanç sağladın. Ne yaparsın?",
    secenekler: [
      { metin: "Kâr cebe yakışır! Yükselecek bile olsa, düşme ihtimaline karşı hemen hepsini satıp kârı kilitlerim.", nakit: 0, sabir: -5, mutluluk: 10, risk: 1, kilit: null, bias_skor: { disposition_effect: 100 } },
      { metin: "Anaparayı veya kârın yarısını garantiye alır, kalanını içeride bırakırım.", nakit: 0, sabir: 5, mutluluk: 5, risk: 1, kilit: null, bias_skor: { disposition_effect: 50 } },
      { metin: "Trendin yönü yukarı! Potansiyeli bitene kadar dokunmam, kârın kendi kendini büyütmesine izin veririm.", nakit: 0, sabir: 15, mutluluk: -5, risk: 1, kilit: null, bias_skor: { disposition_effect: 0 } },
    ]
  },
  {
    id: 6,
    kategori: "Anlık Haz Eğilimi",
    soru: "Karşında sihirli bir buton var. Basarsan şu an anında hesabına 100.000 TL yatacak. Ama basmazsan tam 3 yıl sonra hesabına 300.000 TL yatacak. Hangisini seçersin?",
    secenekler: [
      { metin: "Hemen basarım! 3 yıl kim bekleyecek, bugün o 100.000 TL ile hayatımı yaşarım.", nakit: 0, sabir: -10, mutluluk: 15, risk: 1, kilit: null, bias_skor: { present_bias: 100 } },
      { metin: "Biraz düşünürüm ama gelecek belirsiz olduğu için muhtemelen hemen almayı seçerim.", nakit: 0, sabir: -5, mutluluk: 5, risk: 1, kilit: null, bias_skor: { present_bias: 50 } },
      { metin: "Kesinlikle beklerim. 3 yılda %200 net getiri harika bir oran, bugünkü haz için geleceğimi satmam.", nakit: 0, sabir: 15, mutluluk: -5, risk: 1, kilit: null, bias_skor: { present_bias: 0 } },
    ]
  }
];
