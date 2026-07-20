import { useState, useEffect } from "react";
import { MESLEKLER, pozisyonAdiGetir, yeniIlanlarUret } from "./data/meslekler";

export default function IslerSekmesi({
  nakit,
  isYeri, setIsYeri,
  calismaBari, setCalismaBari,
  isIlanlari, setIsIlanlari,
  mezunOlunanBolum,
  bars, setBars,
  sikiCalisAktif, setSikiCalisAktif,
  setTemelMaas, yillikGelir, setYillikGelir, isLevel, setIsLevel,
  yil, yas, cvGecmisi, setCvGecmisi
}) {

  // Sadece ilk montajda ilan yoksa ilan üret
  useEffect(() => {
    if (!isIlanlari || isIlanlari.length === 0) {
      setIsIlanlari(yeniIlanlarUret());
    }
  }, []);


  const iseBasvur = (ilan) => {
    if (ilan.gereksinim && ilan.gereksinim !== mezunOlunanBolum) {
      alert("Bu iş için ilgili bölümden mezun olmanız gerekiyor!");
      return;
    }
    
    setIsYeri(ilan.isKey);
    setIsLevel(1);
    setCalismaBari(0); // İşe yeni başlayınca bar sıfırlanır
    setTemelMaas(ilan.maas);
    setYillikGelir(ilan.maas); // Seviye 1 olduğu için çarpan 1.00
    setSikiCalisAktif(false);
    
    // CV'ye ekle
    setCvGecmisi(prev => [{
      yil,
      yas,
      isYeri: MESLEKLER[ilan.isKey]?.ad || ilan.ad,
      unvan: pozisyonAdiGetir(ilan.isKey, 1)
    }, ...prev]);
  };

  const sikiCalisToggle = () => {
    setSikiCalisAktif(!sikiCalisAktif);
  };

  const ayril = () => {
    setIsYeri("lise_mezunu");
    setCalismaBari(0);
    setSikiCalisAktif(false);
  }

  const isMevcutIs = isYeri && isYeri !== "lise_mezunu";

  return (
    <div className="flex flex-col gap-stack-lg">
      
      <div className="bg-surface-container-high border-l-2 border-primary p-3 flex items-start gap-3 card-shadow animate-in fade-in">
        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
        <div>
          <div className="font-data-sm text-data-sm text-primary uppercase font-bold mb-1">Kariyer Gelişimi Hakkında</div>
          <p className="text-on-surface-variant text-sm">
            Çalışma Barı (Tecrübe) 10'a ulaştığında <strong>Terfi Etkinliği</strong> başlar. Vasıfsız işlerde her yıl +2 (sıkı çalışırsanız +3) tecrübe puanı kazanırken, üniversite gerektiren vasıflı işlerde bu oran +1 (sıkı çalışırsanız +2) şeklindedir.
          </p>
        </div>
      </div>

      {/* Mevcut İş Kartı */}
      <div className="bg-surface-container-high border border-outline p-6 card-shadow">
        <h2 className="font-headline-md text-on-surface uppercase border-b border-outline-variant pb-2 mb-4">
          {isYeri === "emekli" ? "Emeklilik Durumu" : "Mevcut Kariyer Durumu"}
        </h2>
        
        {isYeri === "emekli" ? (
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1">
              <div className="font-data-lg text-primary uppercase text-2xl font-bold mb-1">
                Emekli Sınıfı
              </div>
              <div className="text-on-surface-variant font-data-sm uppercase opacity-70">
                Yıllarca çalıştın, şimdi dinlenme vakti. | Yıllık Emekli Maaşı: ₺{yillikGelir?.toLocaleString('tr-TR')}
              </div>
            </div>
            
            <div className="flex-1 w-full bg-surface-container-highest p-4 border border-outline-variant text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-2">deck</span>
              <div className="font-data-md text-on-surface uppercase mb-1">Emekliliğin Tadını Çıkar</div>
              <div className="text-xs text-on-surface-variant">Faturalarını karşılamak için emekli maaşını ve birikimlerini akıllıca kullanmaya devam etmelisin. Artık terfi stresi veya sıkı çalışma yok!</div>
            </div>
          </div>
        ) : isMevcutIs ? (
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="flex-1">
              <div className="font-data-lg text-primary uppercase text-2xl font-bold mb-1">
                {pozisyonAdiGetir(isYeri, isLevel)}
              </div>
              <div className="text-on-surface-variant font-data-sm uppercase opacity-70">
                Seviye: {isLevel} / {isYeri === "lise_mezunu" ? 1 : (MESLEKLER[isYeri]?.pozisyonAdi[5] ? 5 : Object.keys(MESLEKLER[isYeri]?.pozisyonAdi || {}).length)} | Yıllık Maaş: ₺{yillikGelir?.toLocaleString('tr-TR')}
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex justify-between font-data-sm uppercase text-on-surface-variant mb-2">
                <span>Çalışma Barı (Tecrübe)</span>
                <span>{calismaBari} / 10</span>
              </div>
              <div className="w-full flex gap-[2px] mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(b => (
                  <div key={b} className={`flex-1 h-3 rounded-sm ${b <= calismaBari ? 'bg-primary' : 'bg-surface-variant'}`}></div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={sikiCalisToggle}
                  className={`flex-1 font-data-sm uppercase py-2 px-4 transition-colors ${
                    sikiCalisAktif 
                      ? 'bg-tertiary text-on-tertiary' 
                      : 'bg-surface-variant text-on-surface-variant border border-outline hover:bg-surface-container-highest'
                  }`}
                >
                  {sikiCalisAktif ? "Sıkı Çalış: AÇIK" : "Sıkı Çalış: KAPALI"}
                </button>
                <button 
                  onClick={ayril}
                  className="bg-error text-background font-data-sm uppercase py-2 px-4 hover:opacity-90"
                >
                  İşten Ayrıl
                </button>
              </div>
              <div className="text-[10px] uppercase text-on-surface-variant mt-1 text-center">
                Sıkı Çalışmak yıl atlarken ekstra +1 Tecrübe kazandırır ancak -7 Mutluluk ve +3 Sabır etkisine sahiptir.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-on-surface-variant italic py-4">Şu an çalışmıyorsun. Faturalarını ödemek için part-time veya tam zamanlı bir iş bulmalısın.</div>
        )}
      </div>

      {/* İş İlanları */}
      <div>
        <div className="flex justify-between items-end border-b border-outline-variant pb-2 mb-4">
          <h2 className="font-headline-md text-on-surface uppercase">Açık İş İlanları</h2>
          <span className="font-data-sm text-on-surface-variant uppercase opacity-50">İlanlar her yıl yenilenir</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isIlanlari?.map(ilan => {
            const isKilitli = ilan.gereksinim && ilan.gereksinim !== mezunOlunanBolum;
            return (
              <div key={ilan.id} className="bg-surface-container border border-outline p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-on-surface uppercase text-lg">{ilan.ad}</div>
                    <div className={`font-data-sm mt-1 uppercase ${ilan.gereksinim ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {ilan.gereksinim ? `${ilan.gereksinim.toUpperCase()} MEZUNU` : 'VASIFSIZ İŞ'}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-surface-variant border border-outline flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">apartment</span>
                  </div>
                </div>

                <div className="bg-surface-container-highest p-3 border border-outline-variant flex flex-col gap-1 text-sm mt-2">
                  <div className="flex justify-between text-on-surface">
                    <span className="font-data-sm opacity-70">Başlangıç:</span>
                    <span className="font-bold text-primary">₺{ilan.maas.toLocaleString('tr-TR')} / Yıl</span>
                  </div>
                  <div className="flex justify-between text-on-surface">
                    <span className="font-data-sm opacity-70">Tavan Maaş:</span>
                    <span className="font-bold text-tertiary">
                      ₺{Math.round(ilan.maas * MESLEKLER[ilan.isKey]?.levelCarpani[5]).toLocaleString('tr-TR')} / Yıl
                    </span>
                  </div>
                  <div className="flex justify-between text-on-surface">
                    <span className="font-data-sm opacity-70">En Üst Pozisyon:</span>
                    <span className="font-bold text-on-surface-variant uppercase text-xs">
                      {MESLEKLER[ilan.isKey]?.pozisyonAdi[5] || ilan.ad}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm mt-1 border-t border-outline-variant pt-2">
                  <div className="flex gap-4 font-data-sm text-on-surface-variant">
                    <span className={ilan.mutlulukEtkisi < 0 ? "text-error" : ilan.mutlulukEtkisi > 0 ? "text-primary" : "text-on-surface"}>
                      MUT: {ilan.mutlulukEtkisi > 0 ? `+${ilan.mutlulukEtkisi}` : ilan.mutlulukEtkisi}
                    </span>
                    <span className={ilan.sabirEtkisi < 0 ? "text-error" : ilan.sabirEtkisi > 0 ? "text-primary" : "text-on-surface"}>
                      SAB: {ilan.sabirEtkisi > 0 ? `+${ilan.sabirEtkisi}` : ilan.sabirEtkisi}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => iseBasvur(ilan)}
                  disabled={isKilitli || isYeri === ilan.isKey || isYeri === "emekli"}
                  className={`mt-2 py-3 font-data-md uppercase transition-colors ${
                    isKilitli 
                      ? 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
                      : isYeri === "emekli"
                        ? 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
                      : isYeri === ilan.isKey
                        ? 'bg-primary text-on-primary cursor-default'
                        : 'border border-primary text-primary hover:bg-primary hover:text-background'
                  }`}
                >
                  {isYeri === "emekli" ? 'EMEKLİ OLDUĞUN İÇİN ÇALIŞAMAZSIN' : isKilitli ? `KİLİTLİ: ${ilan.gereksinim.toUpperCase()} BÖLÜMÜ` : isYeri === ilan.isKey ? 'Mevcut İşiniz' : 'Başvur'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Özgeçmiş (CV) Kartı */}
      <div className="bg-surface-container-high border border-outline p-6 card-shadow mt-4">
        <h2 className="font-headline-md text-on-surface uppercase border-b border-outline-variant pb-2 mb-4">Özgeçmiş (CV)</h2>
        
        <div className="mb-4">
          <div className="font-data-md text-on-surface-variant uppercase">Eğitim Durumu</div>
          <div className="font-bold text-on-surface text-lg uppercase">
            {mezunOlunanBolum ? "Üniversite Mezunu" : "Lise Mezunu"}
          </div>
        </div>

        <div>
          <div className="font-data-md text-on-surface-variant uppercase mb-2">İş Deneyimi</div>
          {cvGecmisi && cvGecmisi.length > 0 ? (
            <div className="flex flex-col gap-3">
              {cvGecmisi.map((cvItem, index) => (
                <div key={index} className="flex gap-4 items-start relative pl-4 border-l-2 border-primary">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 border-2 border-background"></div>
                  <div>
                    <div className="font-bold text-on-surface uppercase">{cvItem.unvan}</div>
                    <div className="text-on-surface-variant font-data-sm uppercase">
                      {cvItem.isYeri} • Yıl: {cvItem.yil} (Yaş: {cvItem.yas})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-on-surface-variant italic py-2 text-sm">Henüz bir iş deneyiminiz bulunmuyor.</div>
          )}
        </div>
      </div>
    </div>
  );
}
