import { createContext, useContext, useState } from "react"

const TutorialContext = createContext(null)

export function TutorialProvider({ children, adimlar }) {
  const [aktif, setAktif] = useState(false)
  const [adimIndex, setAdimIndex] = useState(0)
  const [adimTamamlandi, setAdimTamamlandi] = useState(false)

  const mevcutAdim = adimlar[adimIndex]

  function ileriGit() {
    setAdimTamamlandi(false)
    setAdimIndex(prev => Math.min(prev + 1, adimlar.length - 1))
  }

  function eylemiTamamla(eylem) {
    if (mevcutAdim?.beklenenEylem === eylem) {
      setAdimTamamlandi(true)
    }
  }

  function tutorialuBitir() {
    setAktif(false)
    setAdimTamamlandi(false)
    localStorage.setItem("finsim_tutorial_tamamlandi", "1")
  }

  return (
    <TutorialContext.Provider value={{ aktif, mevcutAdim, adimIndex, adimTamamlandi, ileriGit, eylemiTamamla, tutorialuBitir, setAktif }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  return useContext(TutorialContext)
}
