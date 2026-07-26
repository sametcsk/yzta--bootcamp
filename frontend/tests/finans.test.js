import test from "node:test"
import assert from "node:assert/strict"

import {
  emekliMaasiHesapla,
  iflaslaBitmeliMi,
  satilabilirVarlikVarMi,
} from "../src/utils/finans.js"

test("emekli maaşı önceki yıllık gelirin yarısı olarak kalıcılaştırılır", () => {
  assert.equal(emekliMaasiHesapla(600_000, 200_000), 300_000)
})

test("düşük gelirli emeklinin maaşı asgari yaşam giderinin altına düşmez", () => {
  assert.equal(emekliMaasiHesapla(200_000, 150_000), 150_000)
})

test("portföy, ev ve araç boşken satılabilir varlık bulunmaz", () => {
  assert.equal(satilabilirVarlikVarMi({
    portfoy: { mevduat_tl: 0, altin_gram: 0, opsiyonlar: [] },
    sahipOlunanEvler: [],
    sahipOlunanAraclar: [],
  }), false)
})

test("değeri bulunan bir yatırım satılabilir varlık kabul edilir", () => {
  assert.equal(satilabilirVarlikVarMi({
    portfoy: { mevduat_tl: 1, opsiyonlar: [] },
  }), true)
})

test("nakit tükenmiş, bütçe açıkta ve varlık yoksa oyun iflasla biter", () => {
  assert.equal(iflaslaBitmeliMi({
    beklenenNakit: -10_000,
    nakit: 0,
    satilabilirVarlikVar: false,
  }), true)
})

test("satılabilir varlık varken otomatik iflas uygulanmaz", () => {
  assert.equal(iflaslaBitmeliMi({
    beklenenNakit: -10_000,
    nakit: 0,
    satilabilirVarlikVar: true,
  }), false)
})
