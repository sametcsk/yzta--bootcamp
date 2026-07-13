import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

function money(value) {
  return `₺${Number(value || 0).toLocaleString("tr-TR")}`
}

export default function LiderlikModal({ onClose }) {
  const [liderlik, setLiderlik] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    async function liderlikCek() {
      try {
        const { data, error } = await supabase
          .from("runs")
          .select("display_name, net_worth, final_age, profile_type")
          .order("net_worth", { ascending: false })
          .limit(20)
        
        if (error) throw error
        setLiderlik(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setYukleniyor(false)
      }
    }
    liderlikCek()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-margin-mobile md:p-margin-desktop backdrop-blur-sm">
      <div className="bg-surface-container border border-outline card-shadow max-w-2xl w-full p-stack-lg flex flex-col gap-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase">🏆 Leaderboard (Dev)</h2>
        </div>

        {yukleniyor ? (
          <div className="text-primary font-data-sm text-data-sm uppercase animate-pulse py-10 text-center">
            Yükleniyor...
          </div>
        ) : liderlik.length > 0 ? (
          <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-2">
            {liderlik.map((satir, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-2 font-data-sm text-data-sm uppercase bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30"
              >
                <span>
                  #{i + 1} {satir.display_name} <span className="opacity-50 text-[10px] ml-2">({satir.profile_type || "Belirsiz"})</span>
                </span>
                <span className="text-primary">{money(satir.net_worth)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-on-surface-variant font-data-sm text-data-sm uppercase opacity-50 py-10 text-center">
            Henüz kayıt yok.
          </div>
        )}
      </div>
    </div>
  )
}
