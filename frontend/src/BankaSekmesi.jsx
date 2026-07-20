import React, { useState } from "react";


function formatMoney(value) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
}

function MetricCard({ label, value, hint, alert }) {
  return (
    <div className={`p-4 border ${alert ? 'bg-error-container border-error text-on-error-container' : 'bg-surface-variant border-outline'}`}>
      <div className="text-xs uppercase opacity-70 font-data-sm tracking-wide mb-1">{label}</div>
      <div className="text-xl md:text-2xl font-bold font-data-lg">{value}</div>
      {hint && <div className="text-[10px] uppercase mt-1 opacity-60 font-data-sm">{hint}</div>}
    </div>
  );
}

export default function BankaSekmesi({
  fiyatlar,
  nakit,
  yillikGelir,
  sahipOlunanEvler,
  kredi,
  setKredi,
  krediNotu,
  setKrediNotu,
  nakitiGuncelle,
  universiteYili,
  zorluk,
  setBiasMetrics
}) {
  const evDegeriToplami = sahipOlunanEvler.reduce((acc, ev) => acc + (ev.fiyat_usd_taban * (fiyatlar.dolar_try || 40)), 0);
  const krediLimiti = Math.round((yillikGelir * 3) + (evDegeriToplami * 0.5));

  const merkezFaizi = fiyatlar.faiz || 15;
  const riskPrimi = Math.max(1, (1000 - krediNotu) / 50);
  const nihaiFaiz = (merkezFaizi + riskPrimi).toFixed(1);

  const [tutarStr, setTutarStr] = useState("");
  const tutar = parseInt(tutarStr.replace(/\D/g, "")) || 0;
  
  const [vade, setVade] = useState(3);

  const r = parseFloat(nihaiFaiz) / 100;
  const yillikTaksitHesabi = (tutar > 0 && r > 0) ? (tutar * r * Math.pow(1 + r, vade)) / (Math.pow(1 + r, vade) - 1) : 0;
  const yillikTaksit = Math.round(yillikTaksitHesabi);

  const handleKrediCek = () => {
    if (tutar <= 0 || tutar > krediLimiti) return;
    setKredi({
      anapara: tutar,
      borc: yillikTaksit * vade,
      yillikTaksit: yillikTaksit,
      kalanVade: vade,
      faizOrani: parseFloat(nihaiFaiz)
    });
    nakitiGuncelle(nakit + tutar);

    if (parseFloat(nihaiFaiz) >= 20) {
      setBiasMetrics(prev => ({ ...prev, ihtiyacDisiKrediSayisi: prev.ihtiyacDisiKrediSayisi + 1 }));
    }

    setTutarStr("");
  };

  const handleOgrenciKredisi = () => {
    const ogrTutar = 200000;
    const ogrVade = 3;
    const ogrTaksit = Math.round(ogrTutar / ogrVade); // Faizsiz
    
    setKredi({
      anapara: ogrTutar,
      borc: ogrTutar,
      yillikTaksit: ogrTaksit,
      kalanVade: ogrVade,
      faizOrani: 0
    });
    nakitiGuncelle(nakit + ogrTutar);
  };

  const handleErkenKapat = () => {
    if (!kredi) return;
    // Kalan anaparayı tam hesaplamak zordur, basitlik için:
    // Mevcut borcun %10'u kadar erken kapama indirimi uygulayalım.
    const kalanTamBorc = kredi.yillikTaksit * kredi.kalanVade;
    const indirimliBorc = Math.round(kalanTamBorc * 0.90);

    if (nakit >= indirimliBorc) {
      nakitiGuncelle(nakit - indirimliBorc);
      setKredi(null);
      setKrediNotu(prev => Math.min(1000, prev + 50));
    }
  };

  const riskGrubu = krediNotu >= 800 ? "Mükemmel (A+)" : krediNotu >= 600 ? "İyi (B)" : krediNotu >= 400 ? "Riskli (C)" : "Çok Riskli (D)";

  return (
    <div className="flex flex-col gap-gutter h-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-4">
        <MetricCard label="Kredi Notu" value={krediNotu} hint={riskGrubu} alert={krediNotu < 400} />
        <MetricCard label="Kredi Limiti" value={formatMoney(krediLimiti)} hint="Kullanılabilir" />
        <MetricCard label="Merkez Faizi" value={`%${merkezFaizi}`} hint="Makro" />
        <MetricCard label="Nihai Faiz" value={`%${nihaiFaiz}`} hint="Sana Özel" alert={nihaiFaiz > 50} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter flex-1">
        {/* Kredi Çekme Formu */}
        <div className={`bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full ${kredi ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Yeni Kredi Başvurusu</h2>
            <span className="material-symbols-outlined text-on-surface-variant">request_quote</span>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div>
              <label className="block text-data-sm font-data-sm text-on-surface-variant uppercase mb-1">İstenen Tutar (TL)</label>
              <input 
                type="text"
                value={tutarStr}
                onChange={(e) => setTutarStr(e.target.value)}
                placeholder="Örn: 500000"
                className="w-full bg-surface-variant border border-outline p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
              <div className="text-right text-[10px] uppercase mt-1 text-on-surface-variant">Maksimum: {formatMoney(krediLimiti)}</div>
            </div>

            <div>
              <label className="block text-data-sm font-data-sm text-on-surface-variant uppercase mb-1">Vade (Yıl)</label>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map(v => (
                  <button
                    key={v}
                    onClick={() => setVade(v)}
                    className={`flex-1 py-2 border font-bold ${vade === v ? 'bg-primary text-background border-primary' : 'bg-surface-variant text-on-surface-variant border-outline hover:border-primary'}`}
                  >
                    {v} Yıl
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-highest p-3 border border-outline-variant mt-auto">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-on-surface-variant">Yıllık Taksit:</span>
                <span className="font-bold text-error">{formatMoney(yillikTaksit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-on-surface-variant">Toplam Geri Ödeme:</span>
                <span className="font-bold text-on-surface">{formatMoney(yillikTaksit * vade)}</span>
              </div>
            </div>

            <button
              onClick={handleKrediCek}
              disabled={tutar <= 0 || tutar > krediLimiti}
              className="w-full bg-primary-container text-background font-data-lg text-data-lg uppercase py-3 btn-shadow border border-outline font-bold mt-2 hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Krediyi Onayla
            </button>
            
            {zorluk === "Zor" && (
              <button
                onClick={handleOgrenciKredisi}
                disabled={universiteYili === 0}
                className={`w-full mt-2 font-data-md text-data-md uppercase py-2 btn-shadow border font-bold transition-colors ${universiteYili > 0 ? "bg-[#34d399] text-black border-black hover:opacity-90" : "bg-surface-variant text-on-surface-variant border-outline opacity-50 cursor-not-allowed"}`}
                title={universiteYili === 0 ? "Sadece üniversite öğrencisiyken kullanılabilir." : "Faizsiz 3 Yıllık Kredi"}
              >
                Öğrenci Kredisi Çek (200.000 TL / Faizsiz)
                {universiteYili === 0 && <span className="block text-[10px] mt-1">Sadece Üniversitede Kullanılabilir</span>}
              </button>
            )}
          </div>
        </div>

        {/* Mevcut Kredi Durumu */}
        <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface uppercase">Aktif Kredi Borcu</h2>
            <span className="material-symbols-outlined text-on-surface-variant">account_balance_wallet</span>
          </div>

          {!kredi ? (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-50 p-8 text-center">
              <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
              <p className="font-data-sm text-data-sm uppercase">AKTİF BORCUNUZ BULUNMAMAKTADIR</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 flex-1">
              <div className="bg-error-container text-on-error-container p-4 border border-error">
                <div className="font-data-sm text-data-sm uppercase mb-1 opacity-80">KALAN TOPLAM BORÇ</div>
                <div className="text-3xl font-bold">{formatMoney(kredi.yillikTaksit * kredi.kalanVade)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-variant p-3 border border-outline">
                  <div className="text-xs uppercase text-on-surface-variant">Yıllık Taksit</div>
                  <div className="font-bold text-error">{formatMoney(kredi.yillikTaksit)}</div>
                </div>
                <div className="bg-surface-variant p-3 border border-outline">
                  <div className="text-xs uppercase text-on-surface-variant">Kalan Vade</div>
                  <div className="font-bold text-on-surface">{kredi.kalanVade} Yıl</div>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <p className="text-xs text-on-surface-variant mb-2">
                  * Borcu erken kapattığınızda banka faiz indiriminden ötürü toplam bakiyede <strong>%10 indirim</strong> uygular ve kredi notunuzu artırır.
                </p>
                <button
                  onClick={handleErkenKapat}
                  disabled={nakit < Math.round(kredi.yillikTaksit * kredi.kalanVade * 0.90)}
                  className="w-full bg-[#f5c842] text-black font-data-lg text-data-lg uppercase py-3 btn-shadow border border-outline font-bold hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ERKEN KAPAT ({formatMoney(Math.round(kredi.yillikTaksit * kredi.kalanVade * 0.90))})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
