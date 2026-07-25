import React, { useState, useEffect, useRef } from 'react';
import { money } from './utils';

export default function SwingTradeEkrani({ 
  tradeData, nakit, onKapat, onTradeSonucu, 
  tutorialTamamlandi, setTutorialTamamlandi 
}) {
  const [bakiye, setBakiye] = useState(nakit);
  const [islemHacmi, setIslemHacmi] = useState(0);
  const [alisCizgisi, setAlisCizgisi] = useState(tradeData.basePrice * 0.95);
  const [satisCizgisi, setSatisCizgisi] = useState(tradeData.basePrice * 1.15);
  const [simulasyonDurumu, setSimulasyonDurumu] = useState('BEKLIYOR'); // 'BEKLIYOR', 'CALISIYOR', 'BITTI'
  const [aktifDurum, setAktifDurum] = useState('NAKİTTE'); // 'NAKİTTE', 'HİSSEDE'
  const [sonFiyat, setSonFiyat] = useState(tradeData.basePrice);
  const [mumlar, setMumlar] = useState([]);
  const [gecmisMumlar, setGecmisMumlar] = useState([]);
  const [hedefMumlar, setHedefMumlar] = useState([]);
  const [bitisMesaji, setBitisMesaji] = useState(null);
  
  // Destek ve Direnç State'leri
  const [direncSeviyesi, setDirencSeviyesi] = useState(null);
  const [destekSeviyesi, setDestekSeviyesi] = useState(null);
  
  // Y-Ekseni Sınırları (Dinamik)
  const [yMin, setYMin] = useState(tradeData.basePrice * 0.5);
  const [yMax, setYMax] = useState(tradeData.basePrice * 1.5);
  
  // Sürükleme State'leri
  const [draggingLine, setDraggingLine] = useState(null); // 'buy' | 'sell' | null
  
  const containerRef = useRef(null);
  const chartAreaRef = useRef(null);
  const frameRef = useRef(null);
  
  const [grafikHeight, setGrafikHeight] = useState(400);

  useEffect(() => {
      const updateHeight = () => {
          if (chartAreaRef.current) {
              setGrafikHeight(chartAreaRef.current.clientHeight);
          }
      };
      // Timeout ensures flex layout has settled before measuring
      setTimeout(updateHeight, 100);
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  // Matematiksel Sabitler
  const Y_SCALE = grafikHeight / (yMax - yMin);
  
  const priceToY = (price) => Math.max(0, Math.min(grafikHeight, grafikHeight - ((price - yMin) * Y_SCALE)));
  const yToPrice = (y) => yMin + ((grafikHeight - Math.max(0, Math.min(grafikHeight, y))) / Y_SCALE);

  // Tutorial State
  const [tutorialAdim, setTutorialAdim] = useState(tutorialTamamlandi ? -1 : 0);
  const [infoAcik, setInfoAcik] = useState(false);

  useEffect(() => {
    let globalMin = tradeData.basePrice;
    let globalMax = tradeData.basePrice;
    let pastMin = Number.MAX_VALUE;
    let pastMax = Number.MIN_VALUE;

    // Geçmiş 37 Mum Üret (Geriye doğru üret ki son fiyat basePrice'a tam otursun, devasa mum oluşmasın)
    const past = new Array(37);
    let currentClose = tradeData.basePrice;
    
    for(let i=36; i>=0; i--) {
        const getiri = (Math.random() - 0.48) * 0.05 * tradeData.beta;
        const currentOpen = currentClose / (1 + getiri);
        
        const maxB = Math.max(currentOpen, currentClose);
        const minB = Math.min(currentOpen, currentClose);
        const high = maxB * (1 + Math.random() * 0.02 * tradeData.beta);
        const low = minB * (1 - Math.random() * 0.02 * tradeData.beta);
        
        past[i] = { open: currentOpen, close: currentClose, high, low };
        
        // Bir önceki mumun kapanışı bu mumun açılışı olacak (Geriye doğru)
        currentClose = currentOpen;
        
        globalMin = Math.min(globalMin, low);
        globalMax = Math.max(globalMax, high);
        
        // Destek/Direnç hesaplamasına sadece geçmiş 30 mumu dahil et (Son 7 mum güncel trenddir)
        if (i < 30) {
            pastMin = Math.min(pastMin, low);
            pastMax = Math.max(pastMax, high);
        }
    }
    setGecmisMumlar(past);
    
    // Destek ve Direnç Seviyelerini Kaydet
    let direnc = pastMax;
    let destek = pastMin;
    setDirencSeviyesi(direnc);
    setDestekSeviyesi(destek);
    
    // Gelecek 15 Mumu Üret (Psikolojik Destek/Direnç Motoru)
    const future = [];
    let currentPrice = tradeData.basePrice;
    
    for(let i=0; i<15; i++) {
        // Normal volatilite
        let volatilite = 0.08 * tradeData.beta;
        let egilim = 0.50; // 0.50 = nötr
        
        // Destek/Direnç'e yakınlık kontrolü (%3 bandı)
        // Polarite İlkesi: Kırılan direnç desteğe, kırılan destek dirence dönüşür.
        const direncFarki = (direnc - currentPrice) / currentPrice;
        const destekFarki = (currentPrice - destek) / currentPrice;
        
        if (Math.abs(direncFarki) < 0.03) {
            // Sarı Çizgiye (Direnç) Yakın
            const kirilim = Math.random() > 0.5; // %50 ihtimal
            
            if (direncFarki > 0) {
                // Aşağıdan Geliyor (Klasik Direnç)
                if(kirilim) {
                    egilim = 0.9; // Breakout (Yukarı kırdı)
                    volatilite *= 2;
                } else {
                    egilim = 0.1; // Bounce (Dirençten ret yedi)
                }
            } else {
                // Yukarıdan Geliyor (Kırılmış Direnç artık Destek oldu)
                if(kirilim) {
                    egilim = 0.1; // Breakdown (Desteği aşağı kırdı)
                    volatilite *= 2;
                } else {
                    egilim = 0.9; // Bounce (Destekten yukarı sekti)
                }
            }
        } 
        else if (Math.abs(destekFarki) < 0.03) {
            // Mavi Çizgiye (Destek) Yakın
            const kirilim = Math.random() > 0.5; // %50 ihtimal
            
            if (destekFarki > 0) {
                // Yukarıdan Geliyor (Klasik Destek)
                if(kirilim) {
                    egilim = 0.1; // Breakdown (Aşağı kırdı)
                    volatilite *= 2;
                } else {
                    egilim = 0.9; // Bounce (Destekten sekti)
                }
            } else {
                // Aşağıdan Geliyor (Kırılmış Destek artık Direnç oldu)
                if(kirilim) {
                    egilim = 0.9; // Breakout (Direnci yukarı kırdı)
                    volatilite *= 2;
                } else {
                    egilim = 0.1; // Bounce (Dirençten ret yedi)
                }
            }
        }
        
        const getiri = (Math.random() - (1 - egilim)) * volatilite; 
        
        const close = currentPrice * (1 + getiri);
        const maxB = Math.max(currentPrice, close);
        const minB = Math.min(currentPrice, close);
        
        // Fitiller
        const high = maxB * (1 + Math.random() * 0.03 * tradeData.beta);
        const low = minB * (1 - Math.random() * 0.03 * tradeData.beta);
        
        future.push({ open: currentPrice, close, high, low, maxTick: 30 });
        currentPrice = close;
        globalMin = Math.min(globalMin, low);
        globalMax = Math.max(globalMax, high);
    }
    setHedefMumlar(future);

    // Y Ekseni Sınırlarını Dinamik Ayarla (Alttan ve üstten %25 boşluk - Emir koyma alanı için genişletildi)
    const padding = (globalMax - globalMin) * 0.25;
    setYMax(globalMax + padding);
    setYMin(Math.max(0.1, globalMin - padding));

  }, [tradeData]);

  const handleMiktarChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if(isNaN(val)) setIslemHacmi(0);
    else if(val > bakiye) setIslemHacmi(bakiye);
    else setIslemHacmi(val);
  };

  const tradeBitir = (mesaj, pnl, basarili, kacirildi) => {
      setSimulasyonDurumu('BITTI');
      setBitisMesaji({ mesaj, pnl, basarili, kacirildi });
      if(frameRef.current) cancelAnimationFrame(frameRef.current);
      
      // 2.5 saniye bekle, sonra onTradeSonucu çağır
      setTimeout(() => {
          onTradeSonucu({
              netKarZarar: pnl,
              islemHacmi,
              basarili,
              kacirildi,
              gerceklesenAlisFiyati: kacirildi ? 0 : alisCizgisi
          });
      }, 2500);
  };

  const baslat = () => {
    if(islemHacmi <= 0) return alert("İşlem hacmi giriniz.");
    if(tutorialAdim >= 0) {
        setTutorialAdim(-1);
        setTutorialTamamlandi(true);
    }
    setSimulasyonDurumu('CALISIYOR');
    
    let aktifMumIndex = 0;
    let tickCount = 0;
    let currentAnlikFiyat = tradeData.basePrice;
    let currentMum = { open: currentAnlikFiyat, close: currentAnlikFiyat, high: currentAnlikFiyat, low: currentAnlikFiyat };
    const cizilenMumlar = [];
    
    // State'lere bağımlı kalmamak için let ile track ediyoruz
    let eldeHisseVar = false;
    let alinanAdet = 0;
    
    // Alış noktası şu anki fiyatın üstündeyse Stop-Buy (kırılım alımı), altındaysa Limit-Buy (dipten alma)
    const isStopBuy = alisCizgisi > tradeData.basePrice;

    const animate = () => {
        if(aktifMumIndex >= 15) {
            // Yıl sonu likidasyonu
            if (eldeHisseVar) {
                const karZarar = (alinanAdet * currentAnlikFiyat) - islemHacmi;
                setAktifDurum('LİKİDE EDİLDİ');
                tradeBitir("Yıl Bitti, Kapanış Fiyatından Satıldı", karZarar, karZarar > 0, false);
            } else {
                tradeBitir("Fırsat Kaçtı, Alım Gerçekleşmedi", 0, false, true);
            }
            return;
        }

        const hedef = hedefMumlar[aktifMumIndex];
        tickCount++;
        
        // Random Walk Interpolation
        // Fiyatı açık'tan kapanışa doğru it, ama araya random noise (fitiller) at.
        const progress = tickCount / hedef.maxTick; // 0 to 1
        
        // Hedefe doğru lineer hareket + rastgele gürültü
        const trendFiyat = hedef.open + ((hedef.close - hedef.open) * progress);
        const noise = (Math.random() - 0.5) * (hedef.high - hedef.low) * 0.5;
        currentAnlikFiyat = trendFiyat + noise;
        
        // Sınırları (High/Low) hedef mumun sınırlarına kelepçele (clamp)
        currentAnlikFiyat = Math.max(hedef.low, Math.min(hedef.high, currentAnlikFiyat));
        
        // Eğer tick sonunda isek tam close'a eşitle
        if(tickCount === hedef.maxTick) currentAnlikFiyat = hedef.close;

        // Geçerli mumu güncelle
        currentMum.close = currentAnlikFiyat;
        currentMum.high = Math.max(currentMum.high, currentAnlikFiyat);
        currentMum.low = Math.min(currentMum.low, currentAnlikFiyat);
        
        setSonFiyat(currentAnlikFiyat);
        setMumlar([...cizilenMumlar, { ...currentMum }]);

        // Çarpışma Kontrolü (Trigger Logic)
        if (!eldeHisseVar) {
            const alimSartiSaglandi = isStopBuy 
                ? (currentAnlikFiyat >= alisCizgisi) // Yukarı kırılım bekliyor
                : (currentAnlikFiyat <= alisCizgisi); // Düşüş bekliyor

            if (alimSartiSaglandi) {
                eldeHisseVar = true;
                alinanAdet = islemHacmi / alisCizgisi;
                setBakiye(prev => prev - islemHacmi);
                setAktifDurum('HİSSEDE');
            }
        }
        
        if (eldeHisseVar && currentAnlikFiyat >= satisCizgisi) {
            // SATILDI Kâr Alındı
            const satisGeliri = alinanAdet * satisCizgisi;
            const pnl = satisGeliri - islemHacmi;
            setAktifDurum('KÂR ALINDI');
            tradeBitir("Hedefe Ulaşıldı! (Take Profit)", pnl, true, false);
            return; // Animasyonu kes
        }

        if (tickCount >= hedef.maxTick) {
            cizilenMumlar.push({ ...currentMum });
            aktifMumIndex++;
            tickCount = 0;
            if(aktifMumIndex < 15) {
                currentMum = { open: currentAnlikFiyat, close: currentAnlikFiyat, high: currentAnlikFiyat, low: currentAnlikFiyat };
            }
        }

        // Çok hızlı gitmesin diye ufak bir timeout atabiliriz veya direkt rAF kullanırız.
        // rAF saniyede 60 frame çalışır. 30 tick = 0.5 saniye / mum yapar.
        // Biraz yavaşlatmak için:
        setTimeout(() => {
            frameRef.current = requestAnimationFrame(animate);
        }, 30);
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  // Drag logic
  const handleMouseMove = (e) => {
      if(!draggingLine || !chartAreaRef.current) return;
      const rect = chartAreaRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = Math.round(yToPrice(y) * 10) / 10;
      
      if(draggingLine === 'buy') {
          if(price < satisCizgisi) setAlisCizgisi(price);
      } else if(draggingLine === 'sell') {
          if(price > alisCizgisi) setSatisCizgisi(price);
      }
  };

  const handleMouseUp = () => setDraggingLine(null);

  useEffect(() => {
      if(draggingLine) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      } else {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      }
  }, [draggingLine, alisCizgisi, satisCizgisi]);


  // Çizim Yardımcısı
  const renderMum = (m, index, isFuture = false) => {
      // Toplam 52 mum var (37 geçmiş + 15 gelecek). %5 ile %95 arasına dağıtıyoruz. (Aralık 90 birim, 51 boşluk var)
      const pct = 5 + (index * (90 / 51));
      
      const openY = priceToY(m.open);
      const closeY = priceToY(m.close);
      const highY = priceToY(m.high);
      const lowY = priceToY(m.low);
      const isGreen = m.close >= m.open;
      const color = isGreen ? '#10B981' : '#EF4444'; // Tailwind text-primary / text-error

      return (
          <g key={isFuture ? `f_${index}` : `p_${index}`}>
              {/* Fitil */}
              <line x1={`${pct}%`} y1={highY} x2={`${pct}%`} y2={lowY} stroke={color} strokeWidth={2} />
              {/* Gövde */}
              <rect 
                  x={`${pct}%`}
                  y={Math.min(openY, closeY)} 
                  width={20} 
                  height={Math.max(2, Math.abs(openY - closeY))} 
                  fill={color}
                  transform="translate(-10, 0)"
              />
          </g>
      );
  };

  const tutorialMetinleri = [
      "Swing Trade Ekrani'na hoş geldin! Burada piyasa dalgalanmalarından faydalanarak kâr edebilirsin.",
      "Sağda gördüğün YEŞİL çizgi senin 'Alış Limit' emir çizgin. Fiyat bu çizgiye düştüğünde hisseyi otomatik alırsın. Tutup aşağı/yukarı sürükleyebilirsin.",
      "KIRMIZI çizgi ise 'Satış (Take Profit)' çizgin. Fiyat buraya çıktığında hisseyi satar ve kârı cebe koyarsın.",
      "İşlem hacmini belirle ve 'Trade'i Başlat' butonuna bas. Yıl sonuna kadar çizgilerinden birine değmesini bekle!"
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col font-body-md animate-in fade-in">
        
        {/* Tutorial Overlay */}
        {tutorialAdim >= 0 && tutorialAdim < tutorialMetinleri.length && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 p-8 text-center">
                <div className="bg-surface-container border-2 border-primary card-shadow p-8 max-w-lg rounded-xl animate-in zoom-in">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">school</span>
                    <h2 className="font-headline-md font-black text-on-surface uppercase mb-4">Swing Trade Eğitimi {tutorialAdim+1}/{tutorialMetinleri.length}</h2>
                    <p className="font-data-md text-on-surface-variant mb-8">{tutorialMetinleri[tutorialAdim]}</p>
                    <div className="flex gap-4 w-full">
                        {tutorialAdim > 0 && <button onClick={() => setTutorialAdim(prev => prev-1)} className="bg-surface-dim border border-outline text-on-surface px-4 py-2 font-bold uppercase flex-1">Geri</button>}
                        <button onClick={() => setTutorialAdim(prev => prev+1)} className="bg-primary text-background font-black uppercase px-4 py-2 flex-1 shadow-lg hover:bg-opacity-90">{tutorialAdim === tutorialMetinleri.length - 1 ? 'Başla!' : 'İleri'}</button>
                    </div>
                </div>
            </div>
        )}

        {/* Bitiş Animasyonu Overlay */}
        {simulasyonDurumu === 'BITTI' && bitisMesaji && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-surface-container border border-outline p-12 text-center rounded-2xl shadow-2xl animate-in zoom-in duration-300">
                    <h2 className={`font-headline-lg font-black uppercase mb-4 ${bitisMesaji.pnl > 0 ? 'text-primary' : (bitisMesaji.pnl < 0 ? 'text-error' : 'text-warning')}`}>
                        {bitisMesaji.mesaj}
                    </h2>
                    {bitisMesaji.pnl !== 0 && (
                        <div className={`text-5xl font-black ${bitisMesaji.pnl > 0 ? 'text-primary' : 'text-error'}`}>
                            {bitisMesaji.pnl > 0 ? '+' : ''}{money(bitisMesaji.pnl)}
                        </div>
                    )}
                    <div className="text-on-surface-variant uppercase text-sm mt-4 tracking-widest animate-pulse">Menüye dönülüyor...</div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center bg-surface-container border-b border-outline p-4 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button onClick={onKapat} disabled={simulasyonDurumu === 'CALISIYOR'} className="text-on-surface-variant hover:text-error transition-colors disabled:opacity-50">
                    <span className="material-symbols-outlined text-3xl">close</span>
                </button>
                <div>
                    <h1 className={`font-headline-md font-black uppercase ${tradeData.tone}`}>{tradeData.name} ({tradeData.id})</h1>
                    <div className="text-xs text-on-surface-variant uppercase font-bold">{tradeData.sector} • Beta: {tradeData.beta.toFixed(1)}</div>
                </div>
            </div>
            
            <div className="flex gap-6 items-center">
                <button onClick={() => setInfoAcik(true)} className="flex items-center gap-1 bg-surface text-on-surface px-4 py-2 border border-outline btn-shadow font-bold uppercase text-sm hover:bg-surface-dim transition-colors mr-2">
                    <span className="material-symbols-outlined">help</span>
                    Nasıl Çalışır?
                </button>
                <div className="text-right">
                    <div className="text-[10px] uppercase text-on-surface-variant font-bold">Durum</div>
                    <div className={`font-black text-sm uppercase ${aktifDurum === 'HİSSEDE' ? 'text-warning' : (aktifDurum === 'KÂR ALINDI' ? 'text-primary' : 'text-on-surface')}`}>{aktifDurum}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase text-on-surface-variant font-bold">Boşta Nakit</div>
                    <div className="font-black text-lg text-on-surface">{money(bakiye)}</div>
                </div>
            </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* Chart Area */}
            <div className="flex-1 bg-surface-dim relative border-r border-outline p-4 flex flex-col select-none" ref={containerRef}>
                <div className="flex justify-between items-center mb-4 z-10">
                    <div className="font-data-md text-on-surface-variant uppercase">
                        Anlık Fiyat: <span className={`font-black text-2xl ${sonFiyat > tradeData.basePrice ? 'text-primary' : 'text-error'}`}>{money(sonFiyat)}</span>
                    </div>
                </div>

                <div className="flex-1 w-full h-full relative cursor-crosshair" ref={chartAreaRef}>
                    <svg width="100%" height={grafikHeight} className="absolute inset-0 pointer-events-none" style={{overflow: 'visible'}}>
                        {/* Grid Lines */}
                        <line x1="0" y1={grafikHeight/4} x2="100%" y2={grafikHeight/4} stroke="#374151" strokeDasharray="4 4" />
                        <line x1="0" y1={grafikHeight/2} x2="100%" y2={grafikHeight/2} stroke="#374151" strokeDasharray="4 4" />
                        <line x1="0" y1={(grafikHeight/4)*3} x2="100%" y2={(grafikHeight/4)*3} stroke="#374151" strokeDasharray="4 4" />

                        {/* Fiyat Eksen Etiketleri */}
                        <text x="10" y={grafikHeight/4 - 5} fill="#9CA3AF" fontSize="16" fontWeight="bold">{money(yToPrice(grafikHeight/4))}</text>
                        <text x="10" y={grafikHeight/2 - 5} fill="#9CA3AF" fontSize="16" fontWeight="bold">{money(yToPrice(grafikHeight/2))}</text>
                        <text x="10" y={(grafikHeight/4)*3 - 5} fill="#9CA3AF" fontSize="16" fontWeight="bold">{money(yToPrice((grafikHeight/4)*3))}</text>
                        
                        {/* Destek ve Direnç Çizgileri */}
                        {direncSeviyesi && (
                            <>
                                <line x1="0" y1={priceToY(direncSeviyesi)} x2="100%" y2={priceToY(direncSeviyesi)} stroke="#FBBF24" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
                                <text x="10" y={priceToY(direncSeviyesi) - 5} fill="#FBBF24" fontSize="14" fontWeight="bold" opacity={0.8}>DİRENÇ ({money(direncSeviyesi)})</text>
                            </>
                        )}
                        {destekSeviyesi && (
                            <>
                                <line x1="0" y1={priceToY(destekSeviyesi)} x2="100%" y2={priceToY(destekSeviyesi)} stroke="#60A5FA" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
                                <text x="10" y={priceToY(destekSeviyesi) - 5} fill="#60A5FA" fontSize="14" fontWeight="bold" opacity={0.8}>DESTEK ({money(destekSeviyesi)})</text>
                            </>
                        )}

                        {/* Geçmiş Mumlar */}
                        {gecmisMumlar.map((m, i) => renderMum(m, i, false))}
                        
                        {/* Ayrım Çizgisi (Index 36.5) */}
                        <line x1={`${5 + (36.5 * (90 / 51))}%`} y1="0" x2={`${5 + (36.5 * (90 / 51))}%`} y2={grafikHeight} stroke="#6B7280" strokeDasharray="2 2" strokeWidth={2} />
                        <text x={`${5 + (33 * (90 / 51))}%`} y={grafikHeight + 20} fill="#9CA3AF" fontSize="14" fontWeight="bold">Geçmiş</text>
                        <text x={`${5 + (38 * (90 / 51))}%`} y={grafikHeight + 20} fill="#9CA3AF" fontSize="14" fontWeight="bold">Simülasyon (15 Ay)</text>

                        {/* Simüle Edilen Mumlar */}
                        {mumlar.map((m, i) => renderMum(m, i + 37, true))}
                    </svg>

                    {/* Satis (Take Profit) Cizgisi */}
                    <div 
                        className="absolute w-full border-t border-dashed border-error flex items-center z-20"
                        style={{ top: `${priceToY(satisCizgisi)}px`, left: 0 }}
                    >
                        <div 
                            className="bg-error text-on-error px-2 py-1 text-xs font-black uppercase cursor-ns-resize shadow-md flex items-center gap-1 rounded-r-md -mt-3 pointer-events-auto"
                            onMouseDown={() => simulasyonDurumu === 'BEKLIYOR' && setDraggingLine('sell')}
                        >
                            <span className="material-symbols-outlined text-sm">drag_handle</span>
                            SAT: {money(satisCizgisi)}
                        </div>
                    </div>

                    {/* Alis (Limit Buy) Cizgisi */}
                    <div 
                        className="absolute w-full border-t border-dashed border-primary flex items-center z-20"
                        style={{ top: `${priceToY(alisCizgisi)}px`, left: 0 }}
                    >
                        <div 
                            className="bg-primary text-on-primary px-2 py-1 text-xs font-black uppercase cursor-ns-resize shadow-md flex items-center gap-1 rounded-r-md -mt-3 pointer-events-auto"
                            onMouseDown={() => simulasyonDurumu === 'BEKLIYOR' && setDraggingLine('buy')}
                        >
                            <span className="material-symbols-outlined text-sm">drag_handle</span>
                            AL: {money(alisCizgisi)}
                        </div>
                    </div>

                </div>
            </div>

            {/* Sidebar (Controls) */}
            <div className="w-full md:w-80 bg-surface-container p-6 flex flex-col justify-between z-10">
                <div>
                    <h3 className="font-headline-sm font-black text-on-surface uppercase mb-6 border-b border-outline pb-2">Emir Paneli</h3>
                    
                    <div className="mb-6">
                        <label className="block text-xs uppercase font-bold text-on-surface-variant mb-2">İşlem Hacmi (₺)</label>
                        <input 
                            type="number" 
                            value={islemHacmi}
                            onChange={handleMiktarChange}
                            disabled={simulasyonDurumu !== 'BEKLIYOR'}
                            className="w-full bg-background border border-outline px-4 py-3 text-lg font-black text-on-surface outline-none focus:border-primary disabled:opacity-50"
                        />
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setIslemHacmi(bakiye * 0.25)} disabled={simulasyonDurumu !== 'BEKLIYOR'} className="bg-surface text-on-surface border border-outline flex-1 text-xs py-1 font-bold disabled:opacity-50 hover:bg-surface-dim">%25</button>
                            <button onClick={() => setIslemHacmi(bakiye * 0.50)} disabled={simulasyonDurumu !== 'BEKLIYOR'} className="bg-surface text-on-surface border border-outline flex-1 text-xs py-1 font-bold disabled:opacity-50 hover:bg-surface-dim">%50</button>
                            <button onClick={() => setIslemHacmi(bakiye)} disabled={simulasyonDurumu !== 'BEKLIYOR'} className="bg-surface text-on-surface border border-outline flex-1 text-xs py-1 font-bold disabled:opacity-50 hover:bg-surface-dim">MAX</button>
                        </div>
                    </div>

                    <div className="bg-surface-dim p-4 border border-outline rounded text-sm text-on-surface-variant mb-6">
                        <div className="flex justify-between mb-2">
                            <span>Alış Hedefi:</span>
                            <span className="font-bold text-on-surface">{money(alisCizgisi)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>Satış Hedefi:</span>
                            <span className="font-bold text-on-surface">{money(satisCizgisi)}</span>
                        </div>
                        <div className="flex justify-between border-t border-outline pt-2 mt-2">
                            <span>Hedef Kâr Marjı:</span>
                            <span className="font-black text-primary">% {(((satisCizgisi - alisCizgisi) / alisCizgisi) * 100).toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={baslat}
                    disabled={simulasyonDurumu !== 'BEKLIYOR'}
                    className="w-full bg-primary text-on-primary py-4 text-lg font-black uppercase shadow-lg hover:bg-opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {simulasyonDurumu === 'BEKLIYOR' ? (
                        <>
                            <span className="material-symbols-outlined">play_arrow</span>
                            Trade'i Başlat
                        </>
                    ) : simulasyonDurumu === 'CALISIYOR' ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">sync</span>
                            İzleniyor...
                        </>
                    ) : (
                        "Tamamlandı"
                    )}
                </button>
            </div>
        </div>
        
        {/* Swing Info Modal */}
        {infoAcik && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container border border-outline w-full max-w-2xl max-h-[90vh] overflow-y-auto card-shadow animate-in zoom-in duration-200">
                  <div className="bg-surface p-4 border-b border-outline flex justify-between items-center sticky top-0">
                      <h3 className="font-headline-sm font-black uppercase text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined">school</span>
                          Swing Trade Nasıl Çalışır?
                      </h3>
                      <button onClick={() => setInfoAcik(false)} className="text-on-surface hover:text-error transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <div className="p-6 space-y-6 text-on-surface text-sm">
                      <div className="bg-surface p-4 rounded border-l-4 border-l-primary">
                          <h4 className="font-bold text-base mb-2 uppercase">Akıllı Emir Sistemi</h4>
                          <p className="opacity-90 leading-relaxed">
                              Grafikte <strong>YEŞİL</strong> çizgiyi sürükleyerek "Alış", <strong>KIRMIZI</strong> çizgiyi sürükleyerek "Satış" noktanızı belirlersiniz.
                              <br/><br/>
                              📉 <strong>Limit Alım:</strong> Yeşil çizgiyi şu anki fiyatın <i>altına</i> koyarsanız sistem, fiyatın oraya kadar <strong>düşmesini</strong> bekler.<br/>
                              📈 <strong>Stop Alım (Breakout):</strong> Yeşil çizgiyi fiyatın <i>üstüne</i> koyarsanız sistem, fiyatın yükselip o direnci <strong>kırmasını</strong> bekler.
                              <br/><br/>
                              Eğer fiyat yeşil çizginize çarparsa alım gerçekleşir. Sonrasında kırmızı çizginize (Kâr Al) çarparsa işlem başarıyla kapanır!
                          </p>
                      </div>

                      <div className="bg-surface p-4 rounded border-l-4 border-l-warning">
                          <h4 className="font-bold text-base mb-2 uppercase flex items-center gap-2">
                              Destek ve Direnç <span className="text-xs bg-warning text-background px-2 py-0.5 rounded">ÖNEMLİ</span>
                          </h4>
                          <p className="opacity-90 leading-relaxed mb-2">
                              Geçmiş fiyat hareketlerine göre grafikte iki önemli nokta oluşur:
                          </p>
                          <ul className="list-disc pl-5 space-y-2 opacity-90">
                              <li><strong>DİRENÇ (Sarı Kesik Çizgi):</strong> Geçmişin zirvesi. Fiyat aşağıdan buraya çarparsa ret yer (Bounce) veya yukarı kırar (Breakout). Yukarı kırdıktan sonra fiyat düşüp tekrar bu çizgiye gelirse, artık burası bir <strong>Destek</strong> noktası olarak çalışır!</li>
                              <li><strong>DESTEK (Mavi Kesik Çizgi):</strong> Geçmişin dibi. Fiyat yukarıdan buraya çarparsa genelde seker. Ancak aşağı kırarsa sert düşüş başlar. Eğer düştükten sonra fiyat tekrar bu çizgiye tırmanırsa, artık bu çizgi bir <strong>Direnç</strong> görevi görür.</li>
                          </ul>
                      </div>

                      <div className="bg-surface p-4 rounded border-l-4 border-l-error">
                          <h4 className="font-bold text-base mb-2 uppercase">Likidasyon Kuralları</h4>
                          <p className="opacity-90 leading-relaxed">
                              Simülasyon 15 mumluk bir süreçtir (1.5 yıl). Fiyat alış çizginize çarparsa işlemi başlatırsınız. Daha sonra satış (kâr al) çizginize çarpmasını beklersiniz. Eğer vade sonunda satılmamış (veya zararda) bir hisseniz varsa, 15. mumun kapanışından zorunlu olarak likide edilirsiniz.
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
  );
}
