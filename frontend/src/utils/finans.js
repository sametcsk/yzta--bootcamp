const EMEKLI_MAAS_ORANI = 0.5

export function emekliMaasiHesapla(yillikGelir, asgariYillikYasamGideri) {
  const gelireBagliMaas = Math.round(Math.max(0, Number(yillikGelir) || 0) * EMEKLI_MAAS_ORANI)
  const asgariMaas = Math.round(Math.max(0, Number(asgariYillikYasamGideri) || 0))
  return Math.max(gelireBagliMaas, asgariMaas)
}

export function satilabilirVarlikVarMi({
  portfoy = {},
  sahipOlunanEvler = [],
  sahipOlunanAraclar = [],
}) {
  const yatirimAlanlari = [
    "mevduat_tl",
    "altin_gram",
    "dolar",
    "bist_adet",
    "bist_bankacilik_adet",
    "bist_teknoloji_adet",
    "bist_insaat_adet",
    "bist_saglik_adet",
    "bist_perakende_adet",
  ]
  const yatirimVar = yatirimAlanlari.some(alan => Number(portfoy[alan]) > 0)
  const degerliOpsiyonVar = (portfoy.opsiyonlar || []).some(
    opsiyon => Number(opsiyon.guncel_deger ?? opsiyon.premium_odenen) > 0
  )

  return (
    yatirimVar ||
    degerliOpsiyonVar ||
    sahipOlunanEvler.length > 0 ||
    sahipOlunanAraclar.length > 0
  )
}

export function iflaslaBitmeliMi({ beklenenNakit, nakit, satilabilirVarlikVar }) {
  return beklenenNakit < 0 && nakit <= 0 && !satilabilirVarlikVar
}
