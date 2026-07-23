export function getRandomIliskiEvent(iliskiler, fiyatlar, yil) {
  const kur = fiyatlar?.dolar_try || 40;
  const olasiOlaylar = [];

  // Yardımcı fonksiyonlar
  const tlYap = (usd) => Math.floor(usd * kur / 100) * 100;
  
  // Eş olayları
  const esler = iliskiler.filter(k => k.tip === "es" && k.statu === "aktif");
  if (esler.length > 0) {
    const es = esler[Math.floor(Math.random() * esler.length)];
    
    // Evlilik Yıldönümü
    olasiOlaylar.push({
      baslik: "Evlilik Yıldönümü Krizi",
      mesaj: `İş güç derken ${es.isim} ile evlilik yıldönümünüzü son anda hatırladınız!`,
      kisiId: es.id,
      kisiIsim: es.isim,
      secenekler: [
        {
          metin: "Son Dakika Lüks Yemek",
          maliyetTl: tlYap(500),
          iliskiDegisimi: 15,
          sonucMesaji: "Durumu harika kurtardınız, eşiniz çok mutlu oldu!"
        },
        {
          metin: "Görmezden Gel",
          maliyetTl: 0,
          iliskiDegisimi: -40,
          sonucMesaji: "Eşiniz günlerce sizinle konuşmadı."
        }
      ]
    });

    // Akraba Düğünü
    olasiOlaylar.push({
      baslik: "Akraba Düğünü",
      mesaj: `${es.isim}'in çok yakın bir akrabası evleniyor. Kesin gitmeniz ve iyi bir takı takmanız lazım.`,
      kisiId: es.id,
      kisiIsim: es.isim,
      secenekler: [
        {
          metin: "Altın Tak",
          maliyetTl: tlYap(300),
          iliskiDegisimi: 10,
          sonucMesaji: "Eşiniz akrabalarının yanında gururlandı."
        },
        {
          metin: "Gitme / Bahaneler Uydur",
          maliyetTl: 0,
          iliskiDegisimi: -15,
          sonucMesaji: "Eşinizin ailesinde adınız kötüye çıktı."
        }
      ]
    });

    // Sürpriz Tatil
    olasiOlaylar.push({
      baslik: "Sürpriz Tatil İsteği",
      mesaj: `${es.isim} son zamanlarda çok bunaldığını ve baş başa bir tatile çıkmak istediğini söylüyor.`,
      kisiId: es.id,
      kisiIsim: es.isim,
      secenekler: [
        {
          metin: "Tatile Çık",
          maliyetTl: tlYap(2000),
          iliskiDegisimi: 40,
          sonucMesaji: "Harika bir tatil oldu, aşkınız tazelendi!"
        },
        {
          metin: "Şimdi Sırası Değil",
          maliyetTl: 0,
          iliskiDegisimi: -20,
          sonucMesaji: "Eşinizin hevesi çok kırıldı."
        }
      ]
    });
  }

  // Aile olayları
  const aileUyeleri = iliskiler.filter(k => k.tip === "aile" && k.statu === "aktif");
  if (aileUyeleri.length > 0) {
    const aile = aileUyeleri[Math.floor(Math.random() * aileUyeleri.length)];

    olasiOlaylar.push({
      baslik: "Kombi / Eşya Bozulması",
      mesaj: `${aile.id === "anne" ? "Annen" : "Baban"} sizi aradı, evdeki kombi bozulmuş ve masrafı karşılayamıyorlar.`,
      kisiId: aile.id,
      kisiIsim: aile.isim,
      secenekler: [
        {
          metin: "Yenisini Al",
          maliyetTl: tlYap(800),
          iliskiDegisimi: 30,
          sonucMesaji: "Aileniz size çok dua etti, yeni kombi harika çalışıyor."
        },
        {
          metin: "Tamirci Çağır",
          maliyetTl: tlYap(100),
          iliskiDegisimi: 5,
          sonucMesaji: "Sorun geçici olarak çözüldü."
        },
        {
          metin: "Durumum Yok De",
          maliyetTl: 0,
          iliskiDegisimi: -20,
          sonucMesaji: "Aileniz duruma çok kırıldı, soğukta oturdular."
        }
      ]
    });

    olasiOlaylar.push({
      baslik: "Sağlık Kontrolü",
      mesaj: `${aile.id === "anne" ? "Annen" : "Baban"} kendini iyi hissetmediğini söyledi, detaylı bir check-up lazım.`,
      kisiId: aile.id,
      kisiIsim: aile.isim,
      secenekler: [
        {
          metin: "Özel Hastaneye Götür",
          maliyetTl: tlYap(500),
          iliskiDegisimi: 40,
          sonucMesaji: "Her şeyine baktırdınız, bağlarınız inanılmaz güçlendi."
        },
        {
          metin: "Devlet Hastanesinden Randevu Al",
          maliyetTl: 0,
          iliskiDegisimi: -5,
          sonucMesaji: "Aylarca randevu beklediler, biraz kırıldılar."
        }
      ]
    });
  }

  // Çocuk Olayları
  const cocuklar = iliskiler.filter(k => k.tip === "cocuk" && k.statu === "aktif");
  if (cocuklar.length > 0) {
    const cocuk = cocuklar[Math.floor(Math.random() * cocuklar.length)];
    
    if (cocuk.yas >= 0 && cocuk.yas <= 3) {
      olasiOlaylar.push({
        baslik: "Gece Yarısı Ateşi",
        mesaj: `Bebeğiniz ${cocuk.isim} gece yarısı ateşlendi ve durmadan ağlıyor.`,
        kisiId: cocuk.id,
        kisiIsim: cocuk.isim,
        secenekler: [
          {
            metin: "Hemen Özel Acile Git",
            maliyetTl: tlYap(100),
            iliskiDegisimi: 15,
            sonucMesaji: "Bebeğiniz sağlığına kavuştu, eşiniz de size destek olduğunuz için çok mutlu."
          },
          {
            metin: "Sabahı Bekle",
            maliyetTl: 0,
            iliskiDegisimi: -15,
            sonucMesaji: "Bebek sabaha kadar ağladı, eşin senin ilgisizliğine çok kızdı."
          }
        ]
      });
    }

    if (cocuk.yas >= 4 && cocuk.yas <= 7) {
      olasiOlaylar.push({
        baslik: "Kreş Masrafı",
        mesaj: `Çocuğunuz ${cocuk.isim}'in gelişimi için iyi bir kreşe gitmesi tavsiye ediliyor.`,
        kisiId: cocuk.id,
        kisiIsim: cocuk.isim,
        secenekler: [
          {
            metin: "İyi Bir Kreşe Gönder",
            maliyetTl: tlYap(1000),
            iliskiDegisimi: 20,
            sonucMesaji: `Çocuğunuz kreşte harika vakit geçiriyor.`
          },
          {
            metin: "Evde Bakılsın",
            maliyetTl: 0,
            iliskiDegisimi: -20,
            sonucMesaji: "Eşiniz çocuğun gelişimi geri kalacak diye size çok bozuldu."
          }
        ]
      });
    }

    if (cocuk.yas >= 8 && cocuk.yas <= 14) {
      olasiOlaylar.push({
        baslik: "Sınıf Gezisi",
        mesaj: `${cocuk.isim} okuldaki arkadaşlarıyla şehir dışı kamp gezisine gitmek için para istiyor.`,
        kisiId: cocuk.id,
        kisiIsim: cocuk.isim,
        secenekler: [
          {
            metin: "Parayı Ver",
            maliyetTl: tlYap(300),
            iliskiDegisimi: 25,
            sonucMesaji: `Çocuğunuz ${cocuk.isim} gezide çok eğlendi ve size teşekkür etti.`
          },
          {
            metin: "İzin Verme",
            maliyetTl: 0,
            iliskiDegisimi: -25,
            sonucMesaji: `Çocuğunuz size çok küstü ve odasına kapandı.`
          }
        ]
      });
    }

    if (cocuk.yas >= 15 && cocuk.yas <= 18) {
      olasiOlaylar.push({
        baslik: "Yeni Telefon Krizi",
        mesaj: `Ergenlik çağındaki çocuğunuz ${cocuk.isim}, tüm arkadaşlarında olan son model telefondan istiyor.`,
        kisiId: cocuk.id,
        kisiIsim: cocuk.isim,
        secenekler: [
          {
            metin: "Son Model Satın Al",
            maliyetTl: tlYap(1500),
            iliskiDegisimi: 30,
            sonucMesaji: `Çocuğunuz sevinçten havalara uçtu, gözüne girdiniz!`
          },
          {
            metin: "Eski Telefonu Ver",
            maliyetTl: 0,
            iliskiDegisimi: -30,
            sonucMesaji: "Sen beni hiç anlamıyorsun! diyerek kapıyı çarpıp çıktı."
          }
        ]
      });
    }
    
    if (cocuk.yas >= 19) {
      olasiOlaylar.push({
        baslik: "Üniversite / Evden Ayrılma",
        mesaj: `${cocuk.isim} artık büyüdü, kendi düzenini kurmak veya eğitimine destek olmak için yüklü miktarda paraya ihtiyacı var.`,
        kisiId: cocuk.id,
        kisiIsim: cocuk.isim,
        secenekler: [
          {
            metin: "Tam Destek Ol",
            maliyetTl: tlYap(3000),
            iliskiDegisimi: 50,
            sonucMesaji: `Çocuğunuz hayata 1-0 önde başladı. Sizinle bağları ömür boyu kopmayacak.`
          },
          {
            metin: "Başının Çaresine Baksın",
            maliyetTl: 0,
            iliskiDegisimi: -40,
            sonucMesaji: `Aranızda kalıcı bir soğukluk oluştu.`
          }
        ]
      });
    }
  }

  if (olasiOlaylar.length === 0) return null;

  // Rastgele bir event seçimi
  return olasiOlaylar[Math.floor(Math.random() * olasiOlaylar.length)];
}
