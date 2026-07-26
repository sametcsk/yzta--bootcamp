export const TERFI_SINAVI_EVENT_ID = "ev_terfi_sinavi"
export const EMEKLILIK_EVENT_ID = "ev_emeklilik"

export function terfiSinavinaUygunMu({ calismaBari, isYeri, isLevel, eventler = [] }) {
  const aktifKariyerVar = Boolean(
    isYeri &&
    isYeri !== "lise_mezunu" &&
    isYeri !== "emekli"
  )
  const emeklilikEventiTetiklendi = eventler.some(event => event.id === EMEKLILIK_EVENT_ID)

  return (
    calismaBari >= 10 &&
    aktifKariyerVar &&
    isLevel < 5 &&
    !emeklilikEventiTetiklendi
  )
}

export function emeklilikteTerfiEventleriniTemizle(eventler, isYeri) {
  if (isYeri !== "emekli") return eventler
  return eventler.filter(event => event.id !== TERFI_SINAVI_EVENT_ID)
}
