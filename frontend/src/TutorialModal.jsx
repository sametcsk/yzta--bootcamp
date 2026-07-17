import React from 'react'

export default function TutorialModal({ isOpen, onClose, page }) {
  if (!isOpen) return null

  let baslik = ""
  let icerik = null

  if (page === "ana") {
    baslik = "ANA DEFTER (KOKPİT)"
    icerik = (
      <div className="flex flex-col gap-4 text-on-surface-variant">
        <p className="italic mb-2">Bu sayfa senin genel finansal ve psikolojik durumunu takip ettiğin ana kokpittir.</p>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Yıllık Gelir & Gider</strong>
          Maaş ve kira gelirlerinden oluşan toplam nakit akışını ve yaşam standartlarından kaynaklanan zorunlu giderlerini gösterir. Net Akışının her yıl pozitif kalması servetini büyütmek için kritik!
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Sabır & Mutluluk</strong>
          Psikolojik dayanıklılığını temsil eder. Finansal krizler, geçim sıkıntısı ve düşük yaşam standartları bu barları hızla eritir. Sürdürülebilir bir yaşam için psikolojini korumak zorundasın.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Yapay Zeka Analiz Kaydı</strong>
          Aldığın kararlarındaki davranışsal finans hatalarını (bias) anlık olarak tespit eder ve sana geri bildirim verir.
        </div>
        <div>
          <strong className="text-[#f5c842] uppercase text-sm block mb-1">Fısıltı Haberler</strong>
          Bazen olay panelinde sana piyasalar hakkında kulaktan dolma duyumlar (fısıltılar) gelir. Bu fısıltıların doğru çıkma ihtimali tam olarak %50'dir. Gelecek yıla dair karar alırken onlara körü körüne güvenmek veya tamamen yok saymak senin elinde!
        </div>
      </div>
    )
  } else if (page === "varliklar") {
    baslik = "PİYASA VERİLERİ (VARLIKLAR)"
    icerik = (
      <div className="flex flex-col gap-4 text-on-surface-variant">
        <p className="italic mb-2">Makroekonomik dalgalanmalarda paranı korumak ve büyütmek için alıp satabileceğin 4 temel enstrüman:</p>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Mevduat (Vadeli Hesap)</strong>
          Paranı bankaya faize koymaktır. En güvenli yoldur ama genelde enflasyonun sadece bir tık altında veya üstünde kazandırır. Risksizdir, düzenli artar ama seni zengin etmez.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Döviz (Dolar)</strong>
          Yerel paran değer kaybettiğinde (enflasyon arttığında) paranı korumanın basit yoludur. Ancak Dolar'ın kendi enflasyonu da olduğu için uzun vadede sadece dolarda beklemek de reel olarak (alım gücü bazında) zarar ettirebilir.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Altın</strong>
          Binlerce yıllık güvenli liman. Kriz anlarında (savaş, ekonomik kargaşa) herkesin kaçtığı yer olduğu için fırlar. Sakin dönemlerde ise pek kazandırmaz, yerinde sayar.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Borsa (Hisse Senetleri)</strong>
          Şirketlere ortak olmaktır. Ekonominin büyüdüğü ve işlerin yolunda olduğu dönemlerde en yüksek kazancı sağlar. Ancak krizlerde çok sert düşer. En yüksek risk ve en yüksek potansiyel kazanç buradadır.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Gayrimenkul Piyasası</strong>
          Yüksek sermaye gerektirir ama sana hem enflasyona karşı güçlü koruma hem de düzenli pasif kira geliri sağlar. Kendin oturmak için veya kiraya vermek için alabilirsin.
        </div>
      </div>
    )
  } else if (page === "portfoy") {
    baslik = "PORTFÖY ANALİZİ"
    icerik = (
      <div className="flex flex-col gap-4 text-on-surface-variant">
        <p className="italic mb-2">Yatırımlarının makroekonomik şartlara karşı ne kadar başarılı olduğunu test ettiğin analiz ekranı.</p>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Portföy vs Enflasyon Grafiği</strong>
          Varlıklarının toplam büyüme hızı ile ülkedeki enflasyon endeksini kıyaslar. Eğer portföy çizgin enflasyon çizgisinin altında kalıyorsa, paran değer kazanıyor gibi görünse de aslında <strong className="text-error">alım gücünü</strong> kaybediyorsun demektir.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Varlık Performansı (Reel)</strong>
          Sahip olduğun her bir varlığın, ilk aldığın andan bugüne kadar enflasyondan tamamen arındırılmış net (reel) getirisini gösterir. Gerçekten kazanıp kazanmadığını buradan görebilirsin.
        </div>
      </div>
    )
  } else if (page === "borsa") {
    baslik = "SEKTÖREL ENDEKSLER (BORSA)"
    icerik = (
      <div className="flex flex-col gap-4 text-on-surface-variant">
        <p className="italic mb-2">Borsa İstanbul içerisindeki şirketlerin faaliyet alanlarına göre gruplanmış halidir.</p>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Bankacılık Endeksi</strong>
          Faiz oranlarının yüksek olduğu dönemlerde bankaların kârlılığı artar. Enflasyonun ve faizlerin seyri bu sektörü doğrudan etkiler.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Teknoloji Endeksi</strong>
          Faizlerin düşük olduğu, büyümenin ön planda olduğu dönemlerde en hızlı yükselen ve en riskli olan gruptur.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">İnşaat Endeksi</strong>
          Kredi faizlerinin düştüğü dönemlerde canlanan konut piyasasından doğrudan olumlu etkilenir.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Sağlık & İlaç Endeksi</strong>
          Kriz veya pandemi gibi sağlık risklerinin olduğu dönemlerde güvenli liman (defansif) hisse grubu olarak öne çıkar.
        </div>
        <div>
          <strong className="text-primary uppercase text-sm block mb-1">Perakende Endeksi</strong>
          Enflasyonun yüksek olduğu dönemlerde satış fiyatlarını hızla artırabildikleri için enflasyonist dönemlerin yıldızlarıdır.
        </div>
      </div>
    )
  } else {
    baslik = "BİLGİ"
    icerik = <p className="text-on-surface-variant">Bu sayfa hakkında ek bilgi bulunmuyor.</p>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60" onClick={onClose}>
      <div 
        className="bg-surface-container border border-outline card-shadow p-6 md:p-8 max-w-2xl w-full flex flex-col gap-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-outline-variant pb-4">
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            {baslik}
          </h2>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="text-body-md leading-relaxed">
          {icerik}
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-primary-container text-background font-data-md uppercase py-2 px-6 btn-shadow font-bold hover:bg-primary transition-colors"
          >
            ANLADIM
          </button>
        </div>
      </div>
    </div>
  )
}
