import { useState } from "react";
import EgitimSekmesi from "./EgitimSekmesi";
import IslerSekmesi from "./IslerSekmesi";

export default function KariyerSayfasi({
  nakit, setNakit,
  isYeri, setIsYeri,
  sinavPuani, setSinavPuani,
  okunanBolum, setOkunanBolum,
  universiteYili, setUniversiteYili,
  mezunOlunanBolum,
  calismaBari, setCalismaBari,
  isIlanlari, setIsIlanlari,
  bars, setBars,
  mezunaKalmaSayisi, setMezunaKalmaSayisi,
  buYilSinavaGirdiMi, setBuYilSinavaGirdiMi,
  sikiCalisAktif, setSikiCalisAktif,
  setTemelMaas, yillikGelir, setYillikGelir, isLevel, setIsLevel,
  yil, yas, cvGecmisi, setCvGecmisi, maasEndeksi
}) {
  const [aktifTab, setAktifTab] = useState("isler");

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-stack-lg gap-4 border-b border-outline-variant pb-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase">Kariyer ve Eğitim</h1>
          <p className="font-data-sm text-data-sm text-on-surface-variant uppercase mt-1">Geleceğini İnşa Et</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant mb-6">
        <button
          className={`flex-1 py-3 text-center font-data-md uppercase font-bold transition-colors ${aktifTab === "isler" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          onClick={() => setAktifTab("isler")}
        >
          İş İlanları
        </button>
        <button
          className={`flex-1 py-3 text-center font-data-md uppercase font-bold transition-colors ${aktifTab === "egitim" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          onClick={() => setAktifTab("egitim")}
        >
          Eğitim
        </button>
      </div>

      {/* Content */}
      <div className="mt-4">
        {aktifTab === "egitim" && (
          <EgitimSekmesi 
            nakit={nakit} setNakit={setNakit}
            sinavPuani={sinavPuani} setSinavPuani={setSinavPuani}
            okunanBolum={okunanBolum} setOkunanBolum={setOkunanBolum}
            universiteYili={universiteYili} setUniversiteYili={setUniversiteYili}
            mezunOlunanBolum={mezunOlunanBolum}
            isYeri={isYeri} setIsYeri={setIsYeri}
            mezunaKalmaSayisi={mezunaKalmaSayisi} setMezunaKalmaSayisi={setMezunaKalmaSayisi}
            buYilSinavaGirdiMi={buYilSinavaGirdiMi} setBuYilSinavaGirdiMi={setBuYilSinavaGirdiMi}
            maasEndeksi={maasEndeksi}
          />
        )}
        {aktifTab === "isler" && (
          <IslerSekmesi 
            nakit={nakit}
            isYeri={isYeri} setIsYeri={setIsYeri}
            calismaBari={calismaBari} setCalismaBari={setCalismaBari}
            isIlanlari={isIlanlari} setIsIlanlari={setIsIlanlari}
            mezunOlunanBolum={mezunOlunanBolum}
            bars={bars} setBars={setBars}
            sikiCalisAktif={sikiCalisAktif} setSikiCalisAktif={setSikiCalisAktif}
            setTemelMaas={setTemelMaas} yillikGelir={yillikGelir} setYillikGelir={setYillikGelir}
            isLevel={isLevel} setIsLevel={setIsLevel}
            yil={yil} yas={yas} cvGecmisi={cvGecmisi} setCvGecmisi={setCvGecmisi}
          />
        )}
      </div>
    </div>
  );
}
