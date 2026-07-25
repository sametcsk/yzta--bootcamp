import React, { useState } from 'react'
import { money } from './utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OpsiyonSayfasi({ 
  nakit, portfoy, yil, opsiyonZinciri, fiyatlar, 
  aktifOpsiyonlar, opsiyonGecmisi, opsiyonMetrikleri, 
  okunanBolum, mezunOlunanBolum,
  swingFirsatlari, swingTradeGecmisi, onSwingTradeBaslat,
  onOpsiyonAl, onOpsiyonKapat, onOpsiyonGuncelle 
}) {
  const [seciliVarlik, setSeciliVarlik] = useState('bist_endeks')
  const [seciliVade, setSeciliVade] = useState(1)
  const [infoAcik, setInfoAcik] = useState(false)
  const [adetler, setAdetler] = useState({})
  
  const [analizAcik, setAnalizAcik] = useState(false)
  const [analizSonucu, setAnalizSonucu] = useState(null)
  const [analizYukleniyor, setAnalizYukleniyor] = useState(false)
  
  const [aktifSekme, setAktifSekme] = useState('opsiyonlar') // 'opsiyonlar' | 'swing'

  const handleAnalizCikar = async () => {
    setAnalizAcik(true)
    setAnalizYukleniyor(true)
    try {
      const resp = await fetch('http://localhost:8000/opsiyon-bias-analizi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            opsiyon_gecmisi: opsiyonGecmisi,
            aktif_opsiyonlar: aktifOpsiyonlar,
            swing_trade_gecmisi: swingTradeGecmisi,
            net_servet: portfoy?.netWorth || nakit
        })
      });
      const data = await resp.json();
      setAnalizSonucu(data);
    } catch (err) {
      console.error(err);
      setAnalizSonucu({ yorum: "Analiz sırasında bir hata oluştu.", derece: "HATA", skorlar: {} });
    }
    setAnalizYukleniyor(false)
  }



  const varlikIsimleri = {
    bist_endeks: "BİST 100",
    bist_bankacilik: "Bankacılık Endeksi",
    bist_teknoloji: "Teknoloji Endeksi",
    bist_insaat: "İnşaat Endeksi",
    bist_saglik: "Sağlık Endeksi",
    bist_perakende: "Perakende Endeksi",
    altin_try_gram: "Altın (Gram)"
  }

  const swingTradeKar = (swingTradeGecmisi || []).reduce((acc, trade) => acc + (trade.netKarZarar || 0), 0);
  const swingTradeYatirim = (swingTradeGecmisi || []).reduce((acc, trade) => acc + (trade.islemHacmi || 0), 0);
  
  const toplamYatirim = opsiyonMetrikleri.toplam_yatirim + swingTradeYatirim;
  const toplamNetKar = opsiyonMetrikleri.toplam_net_kar + swingTradeKar;
  const roiYuzde = toplamYatirim > 0 ? (toplamNetKar / toplamYatirim) * 100 : 0;
  
  const handleAdetDegisimi = (optId, value) => {
    const v = parseInt(value, 10);
    setAdetler(prev => ({ ...prev, [optId]: isNaN(v) || v < 1 ? 1 : v }));
  }
  
  const getAdet = (optId) => adetler[optId] || 1;

  const handleAl = (tip, opt) => {
    const p = tip === 'call' 
      ? (seciliVade === 1 ? opt.call_premium_1y : opt.call_premium_2y) 
      : (seciliVade === 1 ? opt.put_premium_1y : opt.put_premium_2y);
      
    // 1 opsiyon = 100 pay
    const gercekPremium = p * 100;
    const adet = getAdet(opt.strike + tip);
      
    if (nakit < gercekPremium * adet) return;
    
    onOpsiyonAl({
        varlik: seciliVarlik,
        tip,
        strike: opt.strike,
        premium: gercekPremium * adet,
        adet: adet,
        vade: seciliVade,
        kalan_vade: seciliVade
    });
  }

  const mevcutZincir = opsiyonZinciri ? opsiyonZinciri[seciliVarlik] : [];

  // PnL History for Chart - Sadece Opsiyonlar (veya birleştirilebilir)
  const chartData = [...opsiyonGecmisi].reverse().reduce((acc, opt, idx) => {
    const oncekiPnl = idx === 0 ? 0 : acc[idx - 1].kümülatifPnL;
    acc.push({
        isim: `${idx+1}. ${opt.varlik}`,
        kümülatifPnL: oncekiPnl + (opt.net_kar || 0)
    });
    return acc;
  }, []);

  // Ortak İşlem Geçmişi (Opsiyonlar + Swing)
  const ortakGecmis = [
      ...opsiyonGecmisi.map(opt => ({
          type: 'KONTRAT',
          isim: `${varlikIsimleri[opt.varlik] || opt.varlik} ${opt.tip.toUpperCase()}`,
          detay: `Strike: ${money(opt.strike)} | Miktar: ${opt.adet} | Neden: ${opt.not || "Bilinmiyor"}`,
          net_kar: opt.net_kar,
          id: `opt_${opt.id || Math.random()}`,
          timestamp: opt.id // veya başka bir timestamp
      })),
      ...(swingTradeGecmisi || []).map(trade => ({
          type: 'TRADE',
          isim: trade.name,
          detay: `Alış: ${money(trade.gerceklesenAlisFiyati)} | İşlem Hacmi: ${money(trade.islemHacmi)} | Durum: ${trade.basarili ? "Hedefe Ulaştı" : (trade.kacirildi ? "Alış Fırsatı Kaçtı" : "Süre Doldu (Likide)")}`,
          net_kar: trade.netKarZarar || 0,
          id: trade.instanceId,
          timestamp: trade.instanceId
      }))
  ];
  // Tarihe göre sırala (En yeni en üstte)
  ortakGecmis.sort((a, b) => b.timestamp - a.timestamp);

  // Grafik verisini hesapla (Kronolojik sıra: En eski -> En yeni)
  const chartVerisi = [...ortakGecmis].reverse().reduce((acc, curr, index) => {
      const prevTotal = index > 0 ? acc[index - 1].kumulatifKar : 0;
      acc.push({
          isim: curr.isim,
          net_kar: curr.net_kar,
          kumulatifKar: prevTotal + curr.net_kar
      });
      return acc;
  }, []);
  return (
    <div className="flex flex-col gap-6 font-body-md animate-fade-in pb-12">
      
      {/* Finansal Durum & Ortak Metrikler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-surface-dim border border-outline card-shadow p-stack-md flex flex-col justify-between">
              <div className="text-on-surface-variant font-data-sm uppercase font-bold mb-2">Nakit</div>
              <div className="font-headline-sm font-black text-on-surface">{money(nakit)}</div>
          </div>
          <div className="bg-surface-dim border border-outline card-shadow p-stack-md flex flex-col justify-between">
              <div className="text-on-surface-variant font-data-sm uppercase font-bold mb-2">Net Servet</div>
              <div className="font-headline-sm font-black text-on-surface">{money(portfoy?.netWorth || nakit)}</div>
          </div>
          <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col justify-between">
              <div className="text-on-surface-variant font-data-sm uppercase font-bold mb-2">Toplam Riskli Hacim</div>
              <div className="font-headline-md font-black text-on-surface">{money(toplamYatirim)}</div>
          </div>
          <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col justify-between">
              <div className="text-on-surface-variant font-data-sm uppercase font-bold mb-2">Toplam Risk Kârı</div>
              <div className={`font-headline-md font-black ${toplamNetKar > 0 ? "text-primary" : (toplamNetKar < 0 ? "text-error" : "text-on-surface")}`}>
                  {toplamNetKar > 0 ? "+" : ""}{money(toplamNetKar)}
              </div>
          </div>
          <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col justify-between">
              <div className="text-on-surface-variant font-data-sm uppercase font-bold mb-2">Risk ROI</div>
              <div className={`font-headline-md font-black ${roiYuzde > 0 ? "text-primary" : (roiYuzde < 0 ? "text-error" : "text-on-surface")}`}>
                  {roiYuzde > 0 ? "+" : ""}{roiYuzde.toFixed(2)}%
              </div>
          </div>
      </div>

      {/* SEKMELER (Toggles) */}
      <div className="flex gap-4 border-b border-outline">
          <button 
              onClick={() => setAktifSekme('opsiyonlar')}
              className={`font-headline-sm font-black uppercase px-6 py-4 transition-colors ${aktifSekme === 'opsiyonlar' ? 'border-b-4 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
              Opsiyon Piyasası
          </button>
          <button 
              onClick={() => setAktifSekme('swing')}
              className={`font-headline-sm font-black uppercase px-6 py-4 transition-colors relative flex items-center gap-2 ${aktifSekme === 'swing' ? 'border-b-4 border-primary text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
              Swing Trade Fırsatları
              {(swingFirsatlari && swingFirsatlari.length > 0) && (
                  <span className="bg-primary text-background text-xs px-2 py-0.5 rounded-full">{swingFirsatlari.length}</span>
              )}
          </button>
      </div>

      {/* OPSIYONLAR SEKMESI */}
      {aktifSekme === 'opsiyonlar' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
              <div className="bg-error-container border border-error card-shadow p-stack-md text-on-error-container rounded-lg">
                  <div className="flex justify-between items-start">
                      <div>
                          <div className="font-headline-md font-black uppercase flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-3xl">warning</span>
                          Profesyoneller İçindir
                          </div>
                          <p className="font-data-sm opacity-90 max-w-3xl">
                          Burası yüksek riskli türev piyasasıdır. Zaman Erimesi veya terste kalma sonucu tüm yatırımı kaybedebilirsiniz. (1 Kontrat = 100 Hisse)
                          </p>
                      </div>
                      <button onClick={() => setInfoAcik(true)} className="flex items-center gap-1 bg-surface text-on-surface px-4 py-2 border border-outline btn-shadow font-bold uppercase text-sm hover:bg-surface-dim transition-colors">
                          <span className="material-symbols-outlined">help</span>
                          Nasıl Çalışır?
                      </button>
                  </div>
              </div>

              {/* Aktif Kontratlar */}
              <div className="bg-surface-container border border-outline card-shadow p-stack-md w-full">
                  <h3 className="font-headline-sm font-black uppercase text-on-surface mb-4 border-b border-outline pb-2 flex items-center justify-between">
                      Aktif Kontratlar
                      <span className="bg-primary text-on-primary text-xs px-2 py-1 rounded-full">{aktifOpsiyonlar.length}</span>
                  </h3>
                  {aktifOpsiyonlar.length === 0 ? (
                      <div className="text-on-surface-variant text-sm italic">Aktif opsiyonunuz bulunmuyor.</div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
                          {aktifOpsiyonlar.map(opt => (
                              <div key={opt.id} className="bg-background border border-outline p-4 rounded shadow-sm text-sm">
                                  <div className="flex justify-between font-black mb-1">
                                      <span className="uppercase text-on-surface">{varlikIsimleri[opt.varlik] || opt.varlik} {opt.tip.toUpperCase()}</span>
                                      {opt.vadesi_doldu ? (
                                        <span className={opt.brut_kar > 0 ? 'text-primary' : 'text-error'}>Vadesi Doldu</span>
                                      ) : (
                                        <span className="text-on-surface-variant">{opt.kalan_vade === opt.vade ? "Bekliyor (Yeni)" : opt.kalan_vade + " Yıl Kaldı"}</span>
                                      )}
                                  </div>
                                  <div className="flex justify-between text-on-surface-variant text-xs mb-3 border-b border-outline-variant pb-2">
                                      <span>Strike: {money(opt.strike)}</span>
                                      <span>Miktar: {opt.adet} Adet</span>
                                  </div>
                                  
                                  {opt.vadesi_doldu ? (
                                      <div className="bg-surface-dim p-3 rounded mb-3 border border-outline-variant">
                                          <div className="flex justify-between items-center">
                                              <span className="font-bold text-xs uppercase">Sonuç:</span>
                                              <span className={`font-black ${opt.net_kar > 0 ? 'text-primary' : (opt.brut_kar > 0 ? 'text-warning' : 'text-error')}`}>
                                                  {opt.net_kar > 0 ? `+%${((opt.net_kar/opt.premium_odenen)*100).toFixed(0)} Kâr` : (opt.brut_kar > 0 ? `%${((opt.net_kar/opt.premium_odenen)*100).toFixed(0)} Zarar` : "Sıfırlandı")}
                                              </span>
                                          </div>
                                          <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                                              <span>Maliyet: {money(opt.premium_odenen)}</span>
                                              <span className="font-bold text-xs">Net PnL: {money(opt.net_kar)}</span>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="bg-surface-dim p-3 rounded mb-3 border border-outline-variant">
                                          {opt.kalan_vade === opt.vade ? (
                                              <div className="text-xs text-on-surface-variant italic text-center">Yıl atlandıktan sonra değerlemesi başlayacaktır.</div>
                                          ) : (
                                              <>
                                                  <div className="flex justify-between items-center mb-1">
                                                      <span className="font-bold text-[10px] uppercase">Güncel Değer:</span>
                                                      <span className="font-black text-on-surface">{money(opt.guncel_deger)}</span>
                                                  </div>
                                                  <div className={`text-right text-sm font-black ${opt.guncel_kar_zarar >= 0 ? 'text-primary' : 'text-error'}`}>
                                                      {opt.guncel_kar_zarar >= 0 ? '+' : ''}{money(opt.guncel_kar_zarar)}
                                                  </div>
                                                  <div className="text-left text-[10px] text-on-surface-variant opacity-70">
                                                      (Maliyet: {money(opt.premium_odenen)})
                                                  </div>
                                              </>
                                          )}
                                      </div>
                                  )}
                                  
                                  <div className="flex gap-2">
                                      {opt.vadesi_doldu ? (
                                          <button onClick={() => onOpsiyonKapat(opt.id, false)} className="bg-primary text-on-primary px-3 py-2 rounded text-xs font-black uppercase w-full hover:bg-opacity-80 transition-opacity">Nakit'e Geçir</button>
                                      ) : (
                                          <>
                                              {opt.guncel_kar_zarar < 0 && opt.kalan_vade < opt.vade && (
                                                <button onClick={() => onOpsiyonGuncelle(opt.id)} disabled={nakit < opt.guncel_premium} className="bg-surface-variant text-on-surface-variant px-2 py-2 rounded text-xs font-black uppercase flex-1 hover:bg-surface-dim disabled:opacity-50 border border-outline">Ekle (Maliyet Düşür)</button>
                                              )}
                                              <button onClick={() => onOpsiyonKapat(opt.id, true)} className={`text-on-error px-2 py-2 rounded text-[10px] font-black uppercase flex-1 hover:bg-opacity-80 transition-opacity ${opt.kalan_vade === opt.vade ? 'bg-surface-variant text-on-surface' : 'bg-error'}`}>
                                                  {opt.kalan_vade === opt.vade ? "İptal Et" : "Şimdi Sat"}
                                              </button>
                                          </>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Opsiyon Zinciri */}
              <div className="bg-surface-container border border-outline card-shadow p-stack-md w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-outline pb-4 gap-4">
                      <h2 className="font-headline-md font-black uppercase text-on-surface">Opsiyon Zinciri (Option Chain)</h2>
                      <div className="flex flex-wrap gap-4">
                          <select 
                              value={seciliVade} 
                              onChange={(e) => setSeciliVade(Number(e.target.value))}
                              className="bg-background border border-outline text-on-surface px-4 py-2 font-data-md uppercase font-bold outline-none focus:border-primary"
                          >
                              <option value={1}>Vade: 1 YIL</option>
                              <option value={2}>Vade: 2 YIL</option>
                          </select>
                          <select 
                              value={seciliVarlik} 
                              onChange={(e) => setSeciliVarlik(e.target.value)}
                              className="bg-background border border-outline text-on-surface px-4 py-2 font-data-md uppercase font-bold outline-none focus:border-primary"
                          >
                              {Object.entries(varlikIsimleri).map(([key, ad]) => (
                                  <option key={key} value={key}>{ad}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4 bg-surface-dim p-4 border border-outline-variant rounded">
                      <div className="font-data-md text-on-surface-variant uppercase font-bold">Güncel {varlikIsimleri[seciliVarlik]} Fiyatı:</div>
                      <div className="font-headline-sm font-black text-primary">{money(fiyatlar[seciliVarlik] || 0)}</div>
                  </div>

                  {!mevcutZincir || mevcutZincir.length === 0 ? (
                      <div className="text-center p-8 text-on-surface-variant font-data-md animate-pulse">Zincir Yükleniyor...</div>
                  ) : (
                      <div className="overflow-x-auto w-full">
                          <table className="w-full text-left font-data-sm min-w-[800px]">
                              <thead className="bg-surface-variant text-on-surface-variant uppercase text-xs">
                                  <tr>
                                      <th className="p-3 text-center border-b border-outline w-5/12">CALL (Alım Hakkı - Long)</th>
                                      <th className="p-3 text-center border-b border-outline bg-surface w-2/12 text-on-surface font-black text-sm shadow-inner">STRIKE (Kullanım)</th>
                                      <th className="p-3 text-center border-b border-outline w-5/12">PUT (Satım Hakkı - Short)</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {mevcutZincir.map((opt, idx) => {
                                      const currPrice = fiyatlar[seciliVarlik];
                                      const isCallItm = opt.strike < currPrice;
                                      const isPutItm = opt.strike > currPrice;
                                      
                                      const cPrem = seciliVade === 1 ? opt.call_premium_1y : opt.call_premium_2y;
                                      const pPrem = seciliVade === 1 ? opt.put_premium_1y : opt.put_premium_2y;
                                      
                                      const cGercek = cPrem * 100;
                                      const pGercek = pPrem * 100;

                                      const callAdet = getAdet(opt.strike + 'call');
                                      const putAdet = getAdet(opt.strike + 'put');
                                      
                                      return (
                                          <tr key={idx} className="border-b border-outline-variant hover:bg-surface-dim transition-colors">
                                              <td className={`p-3 border-r border-outline-variant ${isCallItm ? 'bg-primary-container bg-opacity-10' : ''}`}>
                                                  <div className="flex justify-between items-center gap-4">
                                                      <div>
                                                          <div className="text-[10px] uppercase text-on-surface-variant opacity-70">{isCallItm ? 'ITM' : 'OTM'}</div>
                                                          <div className="font-bold text-primary">{money(cGercek)}</div>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                          <input type="number" min="1" value={callAdet} onChange={(e) => handleAdetDegisimi(opt.strike+'call', e.target.value)} className="w-16 bg-background border border-outline px-2 py-1 text-xs text-on-surface outline-none" />
                                                          <button onClick={() => handleAl('call', opt)} disabled={nakit < cGercek * callAdet} className="bg-primary text-on-primary px-4 py-2 rounded text-xs font-black uppercase hover:bg-opacity-80 transition-opacity disabled:opacity-50">Al</button>
                                                      </div>
                                                  </div>
                                              </td>
                                              
                                              <td className="p-3 text-center font-black text-lg bg-surface border-r border-outline-variant shadow-sm">
                                                  {money(opt.strike)}
                                              </td>
                                              
                                              <td className={`p-3 ${isPutItm ? 'bg-error-container bg-opacity-10' : ''}`}>
                                                  <div className="flex justify-between items-center gap-4">
                                                      <div className="flex items-center gap-2">
                                                          <button onClick={() => handleAl('put', opt)} disabled={nakit < pGercek * putAdet} className="bg-error text-on-error px-4 py-2 rounded text-xs font-black uppercase hover:bg-opacity-80 transition-opacity disabled:opacity-50">Al</button>
                                                          <input type="number" min="1" value={putAdet} onChange={(e) => handleAdetDegisimi(opt.strike+'put', e.target.value)} className="w-16 bg-background border border-outline px-2 py-1 text-xs text-on-surface outline-none" />
                                                      </div>
                                                      <div className="text-right">
                                                          <div className="text-[10px] uppercase text-on-surface-variant opacity-70">{isPutItm ? 'ITM' : 'OTM'}</div>
                                                          <div className="font-bold text-error">{money(pGercek)}</div>
                                                      </div>
                                                  </div>
                                              </td>
                                          </tr>
                                      )
                                  })}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* SWING TRADE SEKMESİ */}
      {aktifSekme === 'swing' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
              {swingFirsatlari && swingFirsatlari.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {swingFirsatlari.map((firsat) => (
                          <div key={firsat.instanceId} className="bg-surface-container border border-outline card-shadow p-6 flex flex-col justify-between hover:border-primary transition-colors cursor-pointer" onClick={() => onSwingTradeBaslat(firsat)}>
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h3 className={`font-headline-sm font-black uppercase ${firsat.tone}`}>{firsat.name}</h3>
                                      <div className="text-on-surface-variant text-sm mt-1">{firsat.sector} Sektörü</div>
                                  </div>
                                  <span className="material-symbols-outlined text-primary text-3xl">query_stats</span>
                              </div>
                              <div className="flex justify-between items-end border-t border-outline-variant pt-4">
                                  <div>
                                      <div className="text-[10px] text-on-surface-variant uppercase">Tahmini Başlangıç</div>
                                      <div className="font-bold text-lg text-on-surface">{money(firsat.basePrice)}</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-[10px] text-on-surface-variant uppercase">Oynaklık (Beta)</div>
                                      <div className={`font-bold text-lg ${firsat.beta > 1.5 ? 'text-error' : (firsat.beta < 1 ? 'text-primary' : 'text-warning')}`}>{firsat.beta.toFixed(1)}</div>
                                  </div>
                              </div>
                              <button className="mt-4 bg-primary text-background font-bold uppercase py-2 text-sm text-center">İncele ve Trade Et</button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="bg-surface-container border border-outline p-12 text-center flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">hourglass_empty</span>
                      <h3 className="text-headline-md font-black text-on-surface uppercase mb-2">Şu An Fırsat Yok</h3>
                      <p className="text-on-surface-variant">Piyasalarda belirgin bir swing fırsatı görünmüyor. Yıl sonlarında yeni şirketlerin fırsatları belirebilir.</p>
                  </div>
              )}
          </div>
      )}

      {/* Grafikler & Ortak Geçmiş (Alt Kısım) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
          <div className="bg-surface-container border border-outline card-shadow p-stack-md">
              <h3 className="font-headline-sm font-black uppercase text-on-surface mb-4 border-b border-outline pb-2">
                  Opsiyon PnL Grafiği
              </h3>
              {chartData.length < 2 ? (
                  <div className="flex items-center justify-center h-64 text-on-surface-variant italic font-data-md">
                      Yeterli işlem geçmişi yok. PnL grafiği en az 2 işlemden sonra oluşur.
                  </div>
              ) : (
                  <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" opacity={0.3} />
                              <XAxis dataKey="isim" stroke="#9CA3AF" fontSize={10} tick={{fill: '#9CA3AF'}} tickLine={false} axisLine={false} />
                              <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}₺`} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '4px', color: '#F3F4F6' }} formatter={(value) => [`${money(value)}`, 'Kümülatif Kâr/Zarar']} />
                              <Line type="monotone" dataKey="kümülatifPnL" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              )}
          </div>
          
          <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col h-full relative">
              <div className="flex justify-between items-center mb-4 border-b border-outline pb-2">
                  <h3 className="font-headline-sm font-black uppercase text-on-surface">
                      Ortak İşlem Geçmişi
                  </h3>
                  <button 
                      onClick={handleAnalizCikar} 
                      disabled={analizYukleniyor}
                      className="bg-primary text-on-primary font-bold uppercase text-xs px-4 py-2 rounded shadow-md hover:bg-opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                      {analizYukleniyor ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">psychology</span>}
                      Profilimi Çıkar
                  </button>
              </div>

              {analizAcik && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
                      <div className="bg-surface-container border border-outline card-shadow p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-start mb-6 border-b border-outline pb-4">
                              <div>
                                  <h2 className="font-headline-lg font-black text-primary uppercase flex items-center gap-2">
                                      <span className="material-symbols-outlined text-4xl">psychology</span>
                                      Davranışsal Finans Profilin
                                  </h2>
                                  {analizSonucu && (
                                      <div className={`mt-2 font-bold uppercase ${analizSonucu.derece?.includes('KIRMIZI') ? 'text-error' : analizSonucu.derece?.includes('RİSKLİ') ? 'text-warning' : 'text-primary'}`}>
                                          Seviye: {analizSonucu.derece}
                                      </div>
                                  )}
                              </div>
                              <button onClick={() => setAnalizAcik(false)} className="text-on-surface-variant hover:text-error mt-1">
                                  <span className="material-symbols-outlined text-3xl">close</span>
                              </button>
                          </div>
                          
                          {!analizSonucu ? (
                              <div className="flex items-center justify-center p-12 text-on-surface-variant flex-col gap-4">
                                  <span className="material-symbols-outlined text-5xl animate-spin">sync</span>
                                  <p>İşlem verilerin analiz ediliyor...</p>
                              </div>
                          ) : (
                              <div className="space-y-6">
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                      {Object.entries(analizSonucu.skorlar).map(([key, score]) => (
                                          <div key={key} className="bg-surface-dim p-3 border border-outline rounded flex flex-col items-center justify-center text-center">
                                              <div className="font-bold text-[10px] text-on-surface-variant uppercase mb-1">{key.replace('_', ' ')}</div>
                                              <div className={`font-black text-xl ${score > 70 ? 'text-error' : score > 40 ? 'text-warning' : 'text-primary'}`}>
                                                  %{score}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                                  
                                  <div className="bg-background border border-outline p-6 rounded prose prose-sm max-w-none text-on-surface">
                                      {analizSonucu.yorum.split('\n\n').map((para, i) => (
                                          <p key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {ortakGecmis.length === 0 ? (
                  <div className="text-on-surface-variant text-sm italic flex items-center justify-center h-full">Henüz kapanan işleminiz yok.</div>
              ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                      {ortakGecmis.map((islem, i) => (
                          <div key={i} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background border-l-4 border-t border-r border-b border-outline p-4 rounded-r shadow-sm text-sm ${islem.type === 'TRADE' ? 'border-l-warning' : 'border-l-primary'}`}>
                              <div className="mb-2 sm:mb-0">
                                  <div className="font-black text-lg text-on-surface uppercase flex items-center gap-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded text-background ${islem.type === 'TRADE' ? 'bg-warning' : 'bg-primary'}`}>{islem.type}</span>
                                      {islem.isim}
                                  </div>
                                  <div className="text-xs text-on-surface-variant mt-1">{islem.detay}</div>
                              </div>
                              <div className="text-right mt-2 sm:mt-0">
                                  <div className={`font-black text-xl ${islem.net_kar > 0 ? "text-primary" : (islem.net_kar < 0 ? "text-error" : "text-on-surface-variant")}`}>
                                      {islem.net_kar > 0 ? "+" : ""}{money(islem.net_kar)}
                                  </div>
                                  <div className="text-[10px] uppercase text-on-surface-variant opacity-70">Gerçekleşen Kâr/Zarar</div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* Kümülatif Kâr Grafiği */}
      {chartVerisi.length > 0 && (
          <div className="bg-surface-container border border-outline card-shadow p-stack-md flex flex-col">
              <div className="text-on-surface-variant font-data-sm uppercase font-bold mb-4">Kümülatif Risk Kârı Eğrisi</div>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartVerisi} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <XAxis dataKey="isim" hide />
                          <YAxis 
                              tickFormatter={(val) => money(val)} 
                              width={80} 
                              stroke="#6B7280" 
                              fontSize={12} 
                          />
                          <Tooltip 
                              formatter={(value) => [money(value), "Kümülatif Kâr"]} 
                              labelFormatter={(label) => `İşlem: ${label}`}
                              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                          />
                          <Line 
                              type="monotone" 
                              dataKey="kumulatifKar" 
                              stroke="#60A5FA" 
                              strokeWidth={3} 
                              dot={false}
                              activeDot={{ r: 6, fill: "#60A5FA", stroke: "#1F2937", strokeWidth: 2 }}
                          />
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      {/* Grid: Sol taraf form (Opsiyon Satın Al), Sağ taraf Aktif Pozisyonlar */}
      {infoAcik && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container border border-outline w-full max-w-2xl max-h-[90vh] overflow-y-auto card-shadow animate-in zoom-in duration-200">
                <div className="bg-surface p-4 border-b border-outline flex justify-between items-center sticky top-0">
                    <h3 className="font-headline-sm font-black uppercase text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined">school</span>
                        Opsiyon Sözleşmeleri Nasıl Çalışır?
                    </h3>
                    <button onClick={() => setInfoAcik(false)} className="text-on-surface hover:text-error transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 space-y-6 text-on-surface text-sm">
                    <div className="bg-surface p-4 rounded border-l-4 border-l-primary">
                        <h4 className="font-bold text-base mb-2 uppercase">Temel Kavramlar</h4>
                        <ul className="list-disc pl-5 space-y-2 opacity-90">
                            <li><strong>ALIM (Call) Opsiyonu:</strong> Dayanak varlığın fiyatının yükseleceğini düşünüyorsanız alırsınız. Varlık fiyatı "Kullanım Fiyatı"nı geçerse kâra geçersiniz.</li>
                            <li><strong>SATIM (Put) Opsiyonu:</strong> Dayanak varlığın fiyatının düşeceğini düşünüyorsanız alırsınız. Varlık fiyatı "Kullanım Fiyatı"nın altına inerse kâra geçersiniz.</li>
                            <li><strong>Kullanım Fiyatı (Strike):</strong> Opsiyonun vade sonunda dikkate alınacağı sınır fiyattır.</li>
                            <li><strong>Premium (Maliyet):</strong> Bu kontratı satın almak için ödediğiniz peşin ve iade edilmez ücrettir. Bütün riskiniz bu ödediğiniz tutarla sınırlıdır.</li>
                        </ul>
                    </div>

                    <div className="bg-surface p-4 rounded border-l-4 border-l-warning">
                        <h4 className="font-bold text-base mb-2 uppercase">Zaman Erimesi (Theta Decay)</h4>
                        <p className="opacity-90 leading-relaxed">
                            Opsiyonların bir son kullanma tarihi (vadesi) vardır. Vadeye yaklaşıldıkça, opsiyonun "Zaman Değeri" hızla erir. Eğer dayanak varlığın fiyatı sizin lehinize hareket etmezse, opsiyonunuzun güncel değeri her geçen yıl eriyecek ve sıfırlanacaktır.
                        </p>
                    </div>

                    <div className="bg-surface p-4 rounded border-l-4 border-l-error">
                        <h4 className="font-bold text-base mb-2 uppercase">Likidasyon ve Kâr/Zarar</h4>
                        <p className="opacity-90 leading-relaxed">
                            Aktif kontratlarınızı dilediğiniz yıl (vade dolmadan önce) "Bozdur" diyerek güncel değerinden satabilirsiniz. Vade dolduğunda ise otomatik olarak bozdurulur. Kontrat kârda ("In the Money") değilse güncel değeri sıfırlanır ve yatırdığınız Premium'un tamamını zarar yazarsınız.
                        </p>
                    </div>
                </div>
                <div className="p-4 border-t border-outline text-right bg-surface sticky bottom-0">
                    <button onClick={() => setInfoAcik(false)} className="bg-primary text-on-primary px-6 py-2 font-bold uppercase hover:-translate-y-1 transition-transform">
                        Anladım
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
