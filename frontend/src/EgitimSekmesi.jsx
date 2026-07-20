import { useState } from "react";
import { UNIVERSITE_BOLUMLERI } from "./data/bolumler";

export default function EgitimSekmesi({
  nakit, setNakit,
  sinavPuani, setSinavPuani,
  okunanBolum, setOkunanBolum,
  universiteYili, setUniversiteYili,
  mezunOlunanBolum,
  isYeri, setIsYeri,
  mezunaKalmaSayisi, setMezunaKalmaSayisi,
  buYilSinavaGirdiMi, setBuYilSinavaGirdiMi,
  maasEndeksi
}) {
  const [sinavAnimasyon, setSinavAnimasyon] = useState(false);

  const sinavaGir = () => {
    setSinavAnimasyon(true);
    setTimeout(() => {
      // Mezuna kalma sayısına göre minimum puanı belirle
      let minPuan = 37;
      if (mezunaKalmaSayisi === 1) minPuan = 60;
      if (mezunaKalmaSayisi >= 2) minPuan = 85;
      
      const puan = Math.floor(Math.random() * (100 - minPuan + 1)) + minPuan;
      setSinavPuani(puan);
      setBuYilSinavaGirdiMi(true);
      setSinavAnimasyon(false);
    }, 1500);
  };

  const bolumeKayitOl = (bolum) => {
    const guncelUcret = Math.round(bolum.ucret * (maasEndeksi || 1.0));
    if (nakit >= guncelUcret) {
      setNakit(prev => prev - guncelUcret);
      setOkunanBolum(bolum.id);
      setUniversiteYili(1);
      setSinavPuani(null); // Sınav puanını sıfırla ki seneye tekrar kullanılamasın
    } else {
      alert("Yetersiz Nakit!");
    }
  };

  const mezunaBirak = () => {
    setSinavPuani(null);
    setMezunaKalmaSayisi(prev => prev + 1);
  };

  // Zaten Mezun Olduysa
  if (mezunOlunanBolum) {
    const bitirilen = UNIVERSITE_BOLUMLERI.find(b => b.id === mezunOlunanBolum);
    return (
      <div className="bg-surface-container border border-outline p-12 flex flex-col items-center justify-center text-center card-shadow animate-in fade-in zoom-in">
        <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
          school
        </span>
        <h2 className="font-headline-lg text-primary uppercase mb-2">Mezuniyet Başarılı!</h2>
        <p className="text-on-surface-variant">
          {bitirilen?.ad || "Bir bölümden"} başarıyla mezun oldunuz. Artık beyaz yaka iş ilanlarına başvurabilirsiniz.
        </p>
      </div>
    );
  }

  // Şu an Okuyorsa
  if (okunanBolum) {
    const okunan = UNIVERSITE_BOLUMLERI.find(b => b.id === okunanBolum);
    return (
      <div className="bg-surface-container border border-outline p-8 flex flex-col gap-6 card-shadow animate-in fade-in zoom-in">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary">school</span>
          <div>
            <h2 className="font-headline-md text-on-surface uppercase">{okunan?.ad}</h2>
            <p className="text-on-surface-variant font-data-sm uppercase">Üniversite Eğitimi Devam Ediyor</p>
          </div>
        </div>

        <div className="w-full flex gap-2">
          {[1, 2, 3, 4].map((yil) => (
            <div 
              key={yil} 
              className={`flex-1 h-4 rounded-full ${yil <= universiteYili ? 'bg-primary' : 'bg-surface-variant'}`}
            ></div>
          ))}
        </div>
        <p className="text-center font-data-md uppercase text-on-surface-variant">
          Yıl {universiteYili} / 4
        </p>
      </div>
    );
  }

  // Bu yıl sınava girdi ve mezuna bıraktı
  if (buYilSinavaGirdiMi && !sinavPuani) {
    return (
      <div className="bg-surface-container border border-outline p-12 flex flex-col items-center justify-center text-center card-shadow">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6 block opacity-50">
          event_busy
        </span>
        <h2 className="font-headline-md text-on-surface mb-2">Sınav Hakkını Kullandın</h2>
        <p className="text-on-surface-variant max-w-md mx-auto mb-8">
          Bu yılki üniversite sınavı şansını değerlendirdin. Seneye yeni bir fırsat seni bekliyor.
        </p>
      </div>
    );
  }

  // Sınava Girmediyse veya henüz girme hakkı varsa
  if (!sinavPuani && !sinavAnimasyon) {
    return (
      <div className="bg-surface-container border border-outline p-12 flex flex-col items-center justify-center text-center card-shadow">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6 block opacity-50">
          menu_book
        </span>
        <h2 className="font-headline-md text-on-surface mb-2">Üniversite Eğitimi</h2>
        <p className="text-on-surface-variant max-w-md mx-auto mb-4">
          Kariyer basamaklarını daha hızlı tırmanmak ve prestijli işlere girmek için üniversite okumalısın. Sınava girerek şansını dene.
        </p>
        
        <div className="bg-surface-container-high rounded p-3 mb-6 inline-block border border-outline-variant">
          <span className="font-data-sm uppercase text-on-surface-variant block mb-1">
            Mevcut Tecrübeniz: {mezunaKalmaSayisi > 0 ? `${mezunaKalmaSayisi} Yıl Mezuna Kaldın` : 'İlk Girişin'}
          </span>
          <span className="font-bold text-primary">
            Beklenen Min. Puan: {mezunaKalmaSayisi >= 2 ? 85 : mezunaKalmaSayisi === 1 ? 60 : 37}
          </span>
        </div>

        <button
          onClick={sinavaGir}
          className="bg-primary text-on-primary font-data-lg text-data-lg py-4 px-8 uppercase btn-shadow font-bold hover:-translate-y-1 transition-transform"
        >
          Sınava Gir
        </button>
      </div>
    );
  }

  // Sınav Yükleniyor
  if (sinavAnimasyon) {
    return (
      <div className="bg-surface-container border border-outline p-12 flex flex-col items-center justify-center text-center card-shadow">
        <span className="material-symbols-outlined text-6xl text-primary animate-spin mb-6 block">
          sync
        </span>
        <h2 className="font-headline-md text-primary animate-pulse">Sınav Sonuçları Açıklanıyor...</h2>
      </div>
    );
  }

  // Sınav Sonucu ve Bölüm Seçimi
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface-container-high border-l-2 border-primary p-3 flex items-start gap-3 card-shadow animate-in fade-in">
        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
        <div>
          <div className="font-data-sm text-data-sm text-primary uppercase font-bold mb-1">Eğitim Sistemi Hakkında</div>
          <p className="text-on-surface-variant text-sm">
            Eğitiminiz 4 yıl sürer. Üniversite taban puanlarına ulaşmak için mezuna kalıp sınava tekrar girebilirsiniz, tekrar edilen yıllarda taban puanınız artar. Bir bölüme kaydolduğunuzda <strong>part-time olarak vasıfsız işlerde çalışmaya devam edebilirsiniz.</strong>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
      {/* Sol Taraf - Sonuç & Mezuna Bırak */}
      <div className="bg-surface-container border border-outline p-8 flex flex-col items-center text-center card-shadow">
        <h2 className="font-headline-md text-on-surface uppercase mb-2">Yerleştirme Puanın</h2>
        <div className={`font-data-xl text-6xl font-black my-6 ${sinavPuani >= 75 ? 'text-primary' : sinavPuani >= 50 ? 'text-tertiary' : 'text-error'}`}>
          {sinavPuani}
        </div>
        <p className="text-on-surface-variant mb-8 text-sm">
          Bu puanla yandaki bölümlerden taban puanı tutanlara yerleşebilirsin.
        </p>
        <button
          onClick={mezunaBirak}
          className="mt-auto bg-surface-variant text-on-surface border border-outline font-data-md uppercase py-3 px-6 hover:border-error hover:text-error transition-colors w-full"
        >
          Mezuna Bırak (Seneye Tekrar Gir)
        </button>
      </div>

      {/* Sağ Taraf - Bölümler */}
      <div className="flex flex-col gap-4">
        <h3 className="font-data-lg text-on-surface uppercase border-b border-outline-variant pb-2">Tercih Listesi</h3>
        <div className="flex flex-col gap-3">
          {UNIVERSITE_BOLUMLERI.map(bolum => {
            const isEligible = sinavPuani >= bolum.tabanPuani;
            const guncelUcret = Math.round(bolum.ucret * (maasEndeksi || 1.0));
            return (
              <div key={bolum.id} className="bg-surface border border-outline p-4 flex justify-between items-center">
                <div>
                  <div className="font-bold text-on-surface uppercase mb-1">{bolum.ad}</div>
                  <div className="text-on-surface-variant font-data-sm uppercase">Taban: {bolum.tabanPuani} Puan | Yıllık: ₺{guncelUcret.toLocaleString('tr-TR')}</div>
                </div>
                <button 
                  onClick={() => bolumeKayitOl(bolum)}
                  disabled={!isEligible}
                  className={`font-data-sm py-2 px-4 uppercase transition-colors ${
                    isEligible 
                      ? 'bg-primary text-on-primary hover:-translate-y-0.5' 
                      : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isEligible ? 'Kayıt Ol' : 'Puan Yetersiz'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
