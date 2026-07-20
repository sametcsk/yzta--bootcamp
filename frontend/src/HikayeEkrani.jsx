import React from 'react';

export default function HikayeEkrani({ profil, onDevam }) {
  if (!profil) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-primary text-6xl animate-spin">
              sync
            </span>
            <h2 className="text-primary font-headline-md animate-pulse uppercase tracking-widest">
                Profil Oluşturuluyor...
            </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary rounded-full blur-[100px]" />
      </div>

      <div className="max-w-2xl w-full bg-surface-container border border-outline rounded-3xl p-8 md:p-12 text-center card-shadow relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <span className="material-symbols-outlined text-6xl text-primary mb-6 block">
          play_circle
        </span>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
          {profil.profile_name || "Yatırımcı Adayı"}
        </h2>
        <div className="font-data-md text-primary uppercase mb-8 tracking-widest border-b border-outline-variant pb-4 inline-block px-8">
          Simülasyon Başlıyor
        </div>
        
        <p className="text-on-surface-variant text-body-lg mb-10 leading-relaxed text-left text-[1.1rem]">
          {profil.intro_story || "18 yaşına kadar olan finansal hikayen oldukça sıradan geçti."}
        </p>
        
        <button
          onClick={onDevam}
          className="w-full bg-primary text-on-primary font-data-lg text-data-lg py-4 px-6 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-md uppercase"
        >
          Oyuna Başla
        </button>
      </div>
    </div>
  );
}
