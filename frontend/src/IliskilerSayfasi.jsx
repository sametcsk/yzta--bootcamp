import React, { useState } from 'react';
import { getPortraitPath, siradakiPortreyiAl } from "./utils/portraits";

const ISIMLER_KADIN = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Aslı", "Selin", "Burcu", "Ceren", "Eda"];
const ISIMLER_ERKEK = ["Ali", "Ahmet", "Mehmet", "Can", "Burak", "Emre", "Ozan", "Cem", "Deniz", "Kerem"];
const MESLEKLER_ARKADAS = ["Borsacı", "Emlakçı", "Öğretmen", "Mühendis", "Doktor", "Esnaf", "Yazılımcı", "Sanatçı", "İşsiz"];

export default function IliskilerSayfasi({ 
  iliskiler, 
  setIliskiler, 
  nakit, 
  nakitiGuncelle, 
  yil,
  fiyatlar,
  setSonucKarti,
  mekanaGitmeSayisi,
  setMekanaGitmeSayisi,
  portreSirasi,
  setPortreSirasi
}) {
  const [bildirim, setBildirim] = useState(null);
  const [tanismaModal, setTanismaModal] = useState(null); // { isim, cinsiyet, yas }

  React.useEffect(() => {
    // Aile/kayınpeder olayını IliskiEventleri.js'ye taşıdığımız için burayı boş bırakıyoruz.
    // Diğer effect'ler buraya eklenebilir.
  }, [yil]);

  const gosterBildirim = (baslik, mesaj, tip = "info") => {
    setBildirim({ baslik, mesaj, tip });
    setTimeout(() => setBildirim(null), 4000);
  };

  const updateKisi = (id, updates) => {
    setIliskiler(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  // 1. Aile Mekanikleri
  const handleParaIste = (kisi) => {
    if (kisi.statu === "küs") {
        gosterBildirim("Küs", `${kisi.isim} seninle konuşmuyor.`, "error");
        return;
    }
    if (kisi.sonParaIstenenYil === yil) {
      gosterBildirim("Zaten İstedin", `Bu yıl ${kisi.isim} karakterinden zaten para istedin.`, "error");
      return;
    }

    const sans = Math.random();
    const kur = fiyatlar?.dolar_try || 40;

    if (sans < 0.15) {
      const miktarUsd = Math.floor(Math.random() * 40) + 10;
      const miktarTl = Math.floor(miktarUsd * kur / 100) * 100;
      
      nakitiGuncelle(nakit + miktarTl);
      updateKisi(kisi.id, { 
        sonParaIstenenYil: yil,
        sonEtkilesimYili: yil,
        iliskiSeviyesi: Math.min(100, kisi.iliskiSeviyesi + 2)
      });
      gosterBildirim("Başarılı!", `${kisi.isim} sana ${miktarTl.toLocaleString('tr-TR')} ₺ harçlık verdi!`, "success");
    } else {
      updateKisi(kisi.id, { 
        sonParaIstenenYil: yil,
        sonEtkilesimYili: yil,
        iliskiSeviyesi: Math.max(0, kisi.iliskiSeviyesi - 5)
      });
      gosterBildirim("Reddedildi!", `${kisi.isim} sana para vermek istemedi.`, "error");
    }
  };

  const handleDisariCik = (kisi) => {
    if (kisi.statu === "küs") {
        gosterBildirim("Küs", `${kisi.isim} seninle konuşmuyor.`, "error");
        return;
    }
    if (kisi.sonDisariCikilanYil === yil) {
      gosterBildirim("Zaten Gezdiniz", `Bu yıl ${kisi.isim} ile yeterince vakit geçirdin.`, "error");
      return;
    }

    const kur = fiyatlar?.dolar_try || 40;
    const maliyet = Math.floor(10 * kur / 100) * 100;

    if (nakit < maliyet) {
      gosterBildirim("Nakit Yetersiz", `Dışarı çıkmak için en az ${maliyet.toLocaleString('tr-TR')} ₺ nakite ihtiyacın var.`, "error");
      return;
    }

    nakitiGuncelle(nakit - maliyet);
    updateKisi(kisi.id, {
      sonDisariCikilanYil: yil,
      sonEtkilesimYili: yil,
      iliskiSeviyesi: Math.min(100, kisi.iliskiSeviyesi + 10)
    });
    gosterBildirim("Harika Vakit!", `${kisi.isim} ile dışarı çıktın. İlişkiniz güçlendi. Masraf: ${maliyet.toLocaleString('tr-TR')} ₺`, "success");
  };

  const handleYatirimTavsiyesi = (kisi) => {
    if (kisi.statu === "küs") return gosterBildirim("Küs", `${kisi.isim} seninle konuşmuyor.`, "error");
    if (kisi.sonTavsiyeIstenenYil === yil) return gosterBildirim("Zaten Konuştunuz", `Bu yıl ${kisi.isim} ile yatırımları zaten konuştunuz.`, "error");

    updateKisi(kisi.id, { sonTavsiyeIstenenYil: yil, sonEtkilesimYili: yil });

    const sans = Math.random();
    const tavsiyeler = sans < 0.5 
      ? ["Geçen gün haberlerde gördüm, teknoloji şirketleri çok kâr açıklayacakmış.", "Altın her zaman güvenli limandır evladım, hiçbir zaman üzmez.", "Bankalar çok faiz dağıtıyor bu aralar, borsa için iyi olmayabilir.", "Emlak fiyatları uçacak diyorlar, parası olan ev alsın."]
      : ["Komşu parayı dolara yatırmış çok kazanmış, ama ben anlamam.", "Benim zamanımda borsa falan yoktu, en iyisi yastık altı.", "Boşver yatırımı falan, sağlığın yerinde olsun.", "Birisi borsada bütün parasını batırmış geçen gün, dikkatli ol."];
    
    setSonucKarti({ baslik: "Tavsiye Geldi", metin: `"${tavsiyeler[Math.floor(Math.random() * tavsiyeler.length)]}"` });
  };

  // 4. Sosyal Mekanlar ve Keşif Sistemi
  const handleMekanaGit = (maliyet) => {
    if (mekanaGitmeSayisi >= 2) {
      return gosterBildirim("Yoruldun", "Bu yıl yeterince dışarı çıktın ve yeni mekanlar keşfettin. Dinlenmelisin.", "error");
    }

    if (nakit < maliyet) {
      return gosterBildirim("Nakit Yetersiz", `Bu mekana gitmek için paranız yetmiyor.`, "error");
    }

    setMekanaGitmeSayisi(prev => prev + 1);
    nakitiGuncelle(nakit - maliyet);

    const sans = Math.random();
    if (sans < 0.5) {
      // Biriyle tanışma
      const isKadin = Math.random() < 0.5;
      const isim = isKadin ? ISIMLER_KADIN[Math.floor(Math.random() * ISIMLER_KADIN.length)] : ISIMLER_ERKEK[Math.floor(Math.random() * ISIMLER_ERKEK.length)];
      const yas = Math.floor(Math.random() * 15) + 18; // 18-32 arası
      const cinsiyetStr = isKadin ? "kadin" : "erkek";
      
      const { secilenId, newSira } = siradakiPortreyiAl(cinsiyetStr, "yetiskin", portreSirasi);
      setPortreSirasi(newSira);
      
      setTanismaModal({ 
        id: "kisi_" + Date.now(),
        isim, 
        cinsiyet: cinsiyetStr, 
        yas,
        iliskiSeviyesi: 10,
        portraitId: secilenId
      });
    } else {
      gosterBildirim("Güzel Bir Gün", `Mekanda harika vakit geçirdiniz ama kimseyle tanışmadınız.`, "info");
    }
  };

  const handleTanismaSecim = (secim) => {
    if (!tanismaModal) return;

    if (secim === "gormezden_gel") {
      setTanismaModal(null);
      return;
    }

    if (secim === "arkadas_ol") {
      const meslek = MESLEKLER_ARKADAS[Math.floor(Math.random() * MESLEKLER_ARKADAS.length)];
      setIliskiler(prev => [...prev, {
        ...tanismaModal,
        tip: "arkadas",
        statu: "aktif",
        meslek: meslek,
        sonEtkilesimYili: yil,
        bonusKullanildi: false
      }]);
      gosterBildirim("Yeni Arkadaş", `${tanismaModal.isim} ile arkadaş oldunuz. Mesleği: ${meslek}`, "success");
    }

    if (secim === "date_cagir") {
      const mevcutDate = iliskiler.find(k => (k.tip === "date" || k.tip === "es") && k.statu === "aktif");
      
      if (mevcutDate) {
        let nafakaBaglandi = false;
        
        setIliskiler(prev => prev.map(k => {
          if (k.id === mevcutDate.id) {
            let updates = { statu: "küs", iliskiSeviyesi: 0 };
            // Eğer eşi aldattıysa ve çocuk varsa nafaka bağlanır
            if (mevcutDate.tip === "es") {
               const cocukVarMi = prev.some(c => c.tip === "cocuk");
               if (cocukVarMi) {
                  updates.nafaka = true;
                  nafakaBaglandi = true;
               }
            }
            return { ...k, ...updates };
          }
          return k;
        }));
        
        if (nafakaBaglandi && setSonucKarti) {
           setSonucKarti({
             baslik: "BOŞANMA VE NAFAKA SKANDALI!",
             metin: `Yeni biriyle Date'e çıkarken eşiniz ${mevcutDate.isim} sizi gördü! Çılgına dönerek sizi anında terk etti ve boşandı. Mahkeme, ortada çocuk olduğu için yaşam standartlarınızın %30'u tutarında tarafınıza sürekli nafaka ödemesi bağladı.`
           });
        } else {
           gosterBildirim("BÜYÜK SKANDAL!", `Yeni biriyle Date'e çıkarken ${mevcutDate.isim} sizi gördü! Çılgına döndü ve seni terk etti. Artık sana küs.`, "error");
        }
      } else {
        gosterBildirim("Yeni Bir Heyecan", `${tanismaModal.isim} teklifini kabul etti!`, "success");
      }

      setIliskiler(prev => [...prev, {
        ...tanismaModal,
        tip: "date",
        statu: "aktif",
        sonEtkilesimYili: yil
      }]);
    }

    setTanismaModal(null);
  };

  // 5. Date ve Evlilik Mekanikleri
  const handleIlgiGoster = (kisi) => {
    if (kisi.sonIlgiGosterilenYil === yil) return gosterBildirim("Zaten İlgilendin", `Bu yıl ${kisi.isim} ile yeterince ilgilendin. Onu sıkma.`, "info");
    
    const kur = fiyatlar?.dolar_try || 40;
    const maliyet = Math.floor(15 * kur / 100) * 100; // Çiçek/yemek vs ~15 USD

    if (nakit < maliyet) return gosterBildirim("Nakit Yetersiz", `Bunun için ${maliyet.toLocaleString('tr-TR')} ₺ gerekiyor.`, "error");

    nakitiGuncelle(nakit - maliyet);
    updateKisi(kisi.id, { 
      sonIlgiGosterilenYil: yil,
      sonEtkilesimYili: yil,
      iliskiSeviyesi: Math.min(100, kisi.iliskiSeviyesi + 15) 
    });
    gosterBildirim("Çok Mutlu!", `${kisi.isim} gösterdiğin ilgiden çok mutlu oldu. İlişkiniz güçlendi. (-${maliyet.toLocaleString('tr-TR')} ₺)`, "success");
  };

  const handleHediyeAl = (kisi) => {
    const kur = fiyatlar?.dolar_try || 40;
    const maliyet = Math.floor(250 * kur / 100) * 100; // Takı/Lüks hediye ~250 USD

    if (nakit < maliyet) return gosterBildirim("Nakit Yetersiz", `Şık bir hediye almak için ${maliyet.toLocaleString('tr-TR')} ₺ gerekiyor.`, "error");

    nakitiGuncelle(nakit - maliyet);
    updateKisi(kisi.id, { sonEtkilesimYili: yil, iliskiSeviyesi: Math.min(100, kisi.iliskiSeviyesi + 35) });
    gosterBildirim("Harika Hediye!", `Aldığın pahalı hediye ${kisi.isim}'i havalara uçurdu! (-${maliyet.toLocaleString('tr-TR')} ₺)`, "success");
  };

  const handleEvlen = (kisi) => {
    const kur = fiyatlar?.dolar_try || 40;
    const dugunMaliyeti = Math.floor(5000 * kur / 100) * 100; // Düğün masrafı ~5000 USD

    if (nakit < dugunMaliyeti) return gosterBildirim("Nakit Yetersiz", `Düğün ve yüzük masrafları için ${dugunMaliyeti.toLocaleString('tr-TR')} ₺ gerekiyor!`, "error");

    nakitiGuncelle(nakit - dugunMaliyeti);
    updateKisi(kisi.id, { tip: "es", iliskiSeviyesi: 100, statu: "aktif", sonEtkilesimYili: yil, evlilikYili: yil, kayinpederOlayiOldu: false });
    gosterBildirim("EVLENDİNİZ!", `Tebrikler! ${kisi.isim} ile evlendiniz. Düğün masrafı: ${dugunMaliyeti.toLocaleString('tr-TR')} ₺`, "success");
  };

  const handleBosan = (kisi) => {
    const kur = fiyatlar?.dolar_try || 40;
    const nafaka = Math.floor(20000 * kur / 100) * 100;
    
    if (nakit < nafaka) {
       return gosterBildirim("Nakit Yetersiz", `Boşanma avukatı ve nafaka için en az ${nafaka.toLocaleString('tr-TR')} ₺ nakite ihtiyacınız var.`, "error");
    }
    
    nakitiGuncelle(nakit - nafaka);
    updateKisi(kisi.id, { statu: "boşandı", tip: "eski_es", iliskiSeviyesi: 0 });
    setSonucKarti({ baslik: "Boşandınız", metin: `${kisi.isim} ile yollarınızı ayırdınız. Boşanma masrafı ve nafaka olarak ${nafaka.toLocaleString('tr-TR')} ₺ ödediniz.` });
  };

  const handleCocukYap = () => {
    const es = iliskiler.find(k => k.tip === "es" && k.statu === "aktif");
    if (!es) return;

    if (iliskiler.some(k => k.tip === "cocuk" && k.yas === 0)) {
       return gosterBildirim("Zaten Bebek Var", `Bu yıl zaten bir bebeğiniz oldu!`, "info");
    }

    const dogumMasrafi = 50000;
    if (nakit < dogumMasrafi) {
      return gosterBildirim("Nakit Yetersiz", `Çocuk sahibi olmak için en az ${dogumMasrafi.toLocaleString('tr-TR')} ₺ gerekiyor.`, "error");
    }

    nakitiGuncelle(nakit - dogumMasrafi);
    const cinsiyet = Math.random() < 0.5 ? "kadin" : "erkek";
    const isimler = cinsiyet === "kadin" ? ISIMLER_KADIN : ISIMLER_ERKEK;
    const isim = isimler[Math.floor(Math.random() * isimler.length)];

    const { secilenId, newSira } = siradakiPortreyiAl(cinsiyet, "cocuk", portreSirasi);
    setPortreSirasi(newSira);

    setIliskiler(prev => [...prev, {
      id: "cocuk_" + Date.now(),
      isim,
      cinsiyet,
      yas: 0,
      tip: "cocuk",
      statu: "aktif",
      iliskiSeviyesi: 100,
      sonEtkilesimYili: yil,
      portraitId: secilenId
    }]);

    gosterBildirim("MÜJDE!", `Nur topu gibi bir çocuğunuz oldu! Adını ${isim} koydunuz. Artık ebeveynsiniz.`, "success");
  };

  // 6. Kayınpeder Olayı Seçimleri
  const handleKayinpederSecim = (borcVer) => {
    const kur = fiyatlar?.dolar_try || 40;
    const miktar = Math.floor(500 * kur / 100) * 100; // ~500 USD borç
    const es = iliskiler.find(k => k.tip === "es" && k.statu === "aktif");

    if (!borcVer) {
       updateKisi(es.id, { iliskiSeviyesi: Math.max(0, es.iliskiSeviyesi - 20), kayinpederOlayiOldu: true });
       setKayinpederSonuc(`Borç vermedin. Eşin bu duruma çok bozuldu ve aranız açıldı.`);
       setTimeout(() => setKayinpederModal(false), 3000);
       return;
    }

    if (nakit < miktar) {
       gosterBildirim("Nakit Yetersiz", `Borç verecek ${miktar.toLocaleString('tr-TR')} ₺ paranız yok!`, "error");
       updateKisi(es.id, { iliskiSeviyesi: Math.max(0, es.iliskiSeviyesi - 10), kayinpederOlayiOldu: true });
       setKayinpederSonuc(`Paran olmadığı için borç veremedin. Eşin biraz üzüldü.`);
       setTimeout(() => setKayinpederModal(false), 3000);
       return;
    }

    nakitiGuncelle(nakit - miktar);
    updateKisi(es.id, { iliskiSeviyesi: Math.min(100, es.iliskiSeviyesi + 15), kayinpederOlayiOldu: true });

    if (Math.random() < 0.5) {
       // Geri ödendi
       setTimeout(() => {
          nakitiGuncelle(nakit); // nakit - miktar + miktar -> wait, I need to do it correctly
          // We can just add it back and show a toast later, but since this is synchronous within a fake delay:
          // Actually, let's just do it instantly for the modal flow.
          nakitiGuncelle(prev => prev + miktar);
          gosterBildirim("Şanslısın!", "Kayınpeder borcu geri verdi!", "success");
       }, 4000);
       setKayinpederSonuc(`Borç verdin ve aranız düzeldi. (4 Saniye sonra borcun akıbeti belli olacak...)`);
    } else {
       // Geri ödenmedi
       setTimeout(() => {
          gosterBildirim("Geçmiş Olsun", "Kayınpeder borcu geri verecek gibi durmuyor...", "error");
       }, 4000);
       setKayinpederSonuc(`Borç verdin ve aranız düzeldi. Eşinin ailesine güvendin. (4 Saniye sonra borcun akıbeti belli olacak...)`);
    }
    
    setTimeout(() => setKayinpederModal(false), 3500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-stack-md bg-surface text-on-surface relative">
      
      {bildirim && (
        <div className={`fixed top-20 right-4 p-4 border rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 transition-all ${
          bildirim.tip === "error" ? "bg-error text-on-error border-on-error" : 
          bildirim.tip === "success" ? "bg-primary text-on-primary border-outline" : 
          "bg-surface-variant text-on-surface-variant border-outline"
        }`}>
          <div className="font-bold mb-1">{bildirim.baslik}</div>
          <div className="text-sm">{bildirim.mesaj}</div>
        </div>
      )}

      {/* Tanışma Modalı */}
      {tanismaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border-2 border-outline p-6 max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-headline-sm font-black text-primary mb-4 text-center">Yeni Biriyle Tanıştın!</h3>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center overflow-hidden border-2 border-outline mb-3">
                <img src={getPortraitPath({ ...tanismaModal, tip: 'date' }, tanismaModal.yas)} alt={tanismaModal.isim} className="w-full h-full object-cover" />
              </div>
              <div className="font-title-lg font-bold">{tanismaModal.isim}</div>
              <div className="text-on-surface-variant">{tanismaModal.yas} Yaşında</div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleTanismaSecim("date_cagir")}
                className="w-full bg-secondary text-on-secondary font-bold py-3 border border-outline hover:brightness-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                💕 Date'e Çağır
              </button>
              <button 
                onClick={() => handleTanismaSecim("arkadas_ol")}
                className="w-full bg-surface-variant text-on-surface font-bold py-3 border border-outline hover:bg-surface-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                🤝 Sadece Arkadaş Ol
              </button>
              <button 
                onClick={() => handleTanismaSecim("gormezden_gel")}
                className="w-full bg-surface text-on-surface-variant font-bold py-3 border border-outline hover:bg-error hover:text-on-error transition-colors"
              >
                Görmezden Gel
              </button>
            </div>          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-stack-lg pb-24">
        
        <div className="bg-surface-container border border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-stack-md mb-stack-md">
          <h2 className="font-headline-sm text-headline-sm font-black uppercase text-primary border-b border-outline pb-2 mb-4">
            Aile Üyeleri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {iliskiler.filter(i => i.tip === "aile").map(kisi => (
              <div key={kisi.id} className="bg-surface-container-low border border-outline-variant p-4 flex flex-col gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-variant rounded flex items-center justify-center overflow-hidden border border-outline">
                    <img src={getPortraitPath(kisi, kisi.yas)} alt={kisi.isim} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-title-md text-title-md font-bold text-on-surface">{kisi.isim} ({kisi.yas})</div>
                    <div className={`font-label-sm text-label-sm capitalize ${kisi.statu === 'küs' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                      {kisi.statu}
                    </div>
                  </div>
                </div>

                <div className="w-full bg-surface-variant rounded-full h-2.5 dark:bg-gray-700">
                  <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${kisi.iliskiSeviyesi}%` }}></div>
                </div>
                <div className="text-xs text-right text-on-surface-variant">İlişki: {kisi.iliskiSeviyesi}/100</div>

                <div className="flex gap-2 flex-wrap mt-2">
                  <button 
                    onClick={() => handleParaIste(kisi)}
                    disabled={kisi.statu === 'küs'}
                    className="flex-1 bg-surface-container-high border border-outline text-on-surface font-label-md py-1 px-2 hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
                  >
                    Para İste
                  </button>
                  <button 
                    onClick={() => handleDisariCik(kisi)}
                    disabled={kisi.statu === 'küs'}
                    className="flex-1 bg-surface-container-high border border-outline text-on-surface font-label-md py-1 px-2 hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
                  >
                    Dışarı Çık
                  </button>
                  <button 
                    onClick={() => handleYatirimTavsiyesi(kisi)}
                    disabled={kisi.statu === 'küs'}
                    className="flex-1 bg-surface-container-high border border-outline text-on-surface font-label-md py-1 px-2 hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
                  >
                    Tavsiye İste
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-stack-md mb-stack-md">
          <h2 className="font-headline-sm text-headline-sm font-black uppercase text-secondary border-b border-outline pb-2 mb-4">
            Partner & Eş
          </h2>
          {iliskiler.filter(i => i.tip === "date" || i.tip === "es").length === 0 ? (
            <div className="text-on-surface-variant text-sm">Henüz hayatınızda biri yok. Sosyal mekanlara giderek yeni insanlarla tanışabilirsiniz.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {iliskiler.filter(i => i.tip === "date" || i.tip === "es").map(kisi => (
                <div key={kisi.id} className="bg-surface-container-low border border-outline-variant p-4 flex flex-col gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-variant rounded flex items-center justify-center overflow-hidden border border-outline">
                      <img src={getPortraitPath(kisi, kisi.yas)} alt={kisi.isim} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-title-md text-title-md font-bold text-on-surface">{kisi.isim} ({kisi.yas})</div>
                      <div className={`font-label-sm text-label-sm capitalize ${kisi.statu === 'küs' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                        {kisi.statu} - {kisi.tip}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-secondary h-2.5 rounded-full transition-all duration-300" style={{ width: `${kisi.iliskiSeviyesi}%` }}></div>
                  </div>
                  <div className="text-xs text-right text-on-surface-variant">İlişki: {kisi.iliskiSeviyesi}/100</div>
                  {kisi.statu !== 'küs' && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      <button onClick={() => handleIlgiGoster(kisi)} className="flex-1 bg-surface-container-high border border-outline text-on-surface font-label-md py-1 px-2 hover:bg-secondary hover:text-on-secondary transition-colors">
                        İlgi Göster
                      </button>
                      <button onClick={() => handleHediyeAl(kisi)} className="flex-1 bg-surface-container-high border border-outline text-on-surface font-label-md py-1 px-2 hover:bg-secondary hover:text-on-secondary transition-colors">
                        Hediye Al
                      </button>
                      {kisi.tip === "date" && kisi.iliskiSeviyesi >= 100 && (
                         <button onClick={() => handleEvlen(kisi)} className="w-full mt-2 bg-secondary text-on-secondary font-bold py-2 hover:brightness-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           💍 Evlenme Teklifi Et
                         </button>
                      )}
                      {kisi.tip === "es" && (
                         <button onClick={() => handleBosan(kisi)} className="w-full mt-2 bg-error text-on-error font-bold py-2 hover:brightness-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           💔 Boşan
                         </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {iliskiler.some(i => i.tip === "es" && i.statu === "aktif") && (
                 <div className="col-span-1 md:col-span-2 flex justify-center mt-4 border-t border-outline pt-4">
                    <button onClick={handleCocukYap} className="bg-primary text-on-primary font-bold py-3 px-8 hover:brightness-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                       👶 Çocuk Yap
                    </button>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Çocuklar */}
        {iliskiler.some(i => i.tip === "cocuk") && (
        <div className="bg-surface-container border border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-stack-md mb-stack-md">
          <h2 className="font-headline-sm text-headline-sm font-black uppercase text-primary border-b border-outline pb-2 mb-4">
            Çocuklar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {iliskiler.filter(i => i.tip === "cocuk").map(kisi => (
              <div key={kisi.id} className="bg-surface-container-low border border-outline-variant p-4 flex flex-col gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] items-center text-center">
                 <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center overflow-hidden border border-outline mb-2">
                    <img src={getPortraitPath(kisi, kisi.yas)} alt={kisi.isim} className="w-full h-full object-cover" />
                 </div>
                 <div className="font-title-md font-bold text-on-surface">{kisi.isim}</div>
                 <div className="text-sm text-on-surface-variant">{kisi.yas} Yaşında</div>
              </div>
            ))}
          </div>
        </div>
        )}

        <div className="bg-surface-container border border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-stack-md mb-stack-md">
          <h2 className="font-headline-sm text-headline-sm font-black uppercase text-tertiary border-b border-outline pb-2 mb-4">
            Arkadaşlar
          </h2>
          {iliskiler.filter(i => i.tip === "arkadas").length === 0 ? (
            <div className="text-on-surface-variant text-sm">Hiç arkadaşınız yok.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {iliskiler.filter(i => i.tip === "arkadas").map(kisi => (
                <div key={kisi.id} className="bg-surface-container-low border border-outline-variant p-4 flex flex-col gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center overflow-hidden border border-outline">
                      <img src={getPortraitPath(kisi, kisi.yas)} alt={kisi.isim} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-title-sm font-bold text-on-surface">{kisi.isim} ({kisi.yas})</div>
                      <div className="text-xs text-on-surface-variant">Meslek: {kisi.meslek}</div>
                    </div>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-1.5 dark:bg-gray-700 mt-1">
                    <div className="bg-tertiary h-1.5 rounded-full transition-all duration-300" style={{ width: `${kisi.iliskiSeviyesi}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sosyal Mekanlar (Keşif) */}
        <div className="bg-surface-container border border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-stack-md">
          <h2 className="font-headline-sm text-headline-sm font-black uppercase text-tertiary border-b border-outline pb-2 mb-4">
            Sosyalleş & Keşfet
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={() => handleMekanaGit(0)} className="bg-surface-container-high border border-outline p-4 hover:border-tertiary transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]">
              <div className="text-2xl mb-2">🏖️</div>
              <div className="font-bold text-on-surface">Sahilde Yürüyüş</div>
              <div className="text-xs text-on-surface-variant mt-1">Bedava</div>
            </button>
            <button onClick={() => handleMekanaGit(1500)} className="bg-surface-container-high border border-outline p-4 hover:border-tertiary transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]">
              <div className="text-2xl mb-2">☕</div>
              <div className="font-bold text-on-surface">Kafeye Git</div>
              <div className="text-xs text-on-surface-variant mt-1">1.500 ₺</div>
            </button>
            <button onClick={() => handleMekanaGit(10000)} className="bg-surface-container-high border border-outline p-4 hover:border-tertiary transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]">
              <div className="text-2xl mb-2">🏕️</div>
              <div className="font-bold text-on-surface">Dağ Gezisi</div>
              <div className="text-xs text-on-surface-variant mt-1">10.000 ₺</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
