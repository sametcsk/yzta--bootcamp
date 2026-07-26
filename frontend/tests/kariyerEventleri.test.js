import test from "node:test"
import assert from "node:assert/strict"

import {
  EMEKLILIK_EVENT_ID,
  TERFI_SINAVI_EVENT_ID,
  emeklilikteTerfiEventleriniTemizle,
  terfiSinavinaUygunMu,
} from "../src/utils/kariyerEventleri.js"

test("aktif çalışan gerekli bara ulaştığında terfi sınavına uygundur", () => {
  assert.equal(terfiSinavinaUygunMu({
    calismaBari: 10,
    isYeri: "muhendis",
    isLevel: 4,
    eventler: [],
  }), true)
})

test("emekli profil için terfi sınavı üretilmez", () => {
  assert.equal(terfiSinavinaUygunMu({
    calismaBari: 10,
    isYeri: "emekli",
    isLevel: 1,
    eventler: [],
  }), false)
})

test("emeklilik eventinin geldiği turda terfi sınavı kuyruğa eklenmez", () => {
  assert.equal(terfiSinavinaUygunMu({
    calismaBari: 10,
    isYeri: "muhendis",
    isLevel: 4,
    eventler: [{ id: EMEKLILIK_EVENT_ID }],
  }), false)
})

test("emekli kaydındaki bekleyen terfi sınavları kuyruktan temizlenir", () => {
  const eventler = [
    { id: "normal_event" },
    { id: TERFI_SINAVI_EVENT_ID },
  ]

  assert.deepEqual(emeklilikteTerfiEventleriniTemizle(eventler, "emekli"), [
    { id: "normal_event" },
  ])
})
