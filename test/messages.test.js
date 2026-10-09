const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../inventory-messages.js");

test("日本語と英語の辞書がある", () => {
  assert.ok(M.ja && typeof M.ja === "object");
  assert.ok(M.en && typeof M.en === "object");
});

test("日英でキーが完全に一致する", () => {
  const ja = Object.keys(M.ja).sort();
  const en = Object.keys(M.en).sort();
  assert.deepEqual(ja.filter(k => !(k in M.en)), [], "英語に無いキー");
  assert.deepEqual(en.filter(k => !(k in M.ja)), [], "日本語に無いキー");
});

test("値が空でない", () => {
  for (const lang of ["ja", "en"]) {
    for (const [k, v] of Object.entries(M[lang])) {
      assert.ok(typeof v === "string" && v.length > 0, `${lang}.${k} が空`);
    }
  }
});

test("プレースホルダー {name} が日英で一致する", () => {
  const ph = str => (str.match(/\{\w+\}/g) || []).sort();
  for (const k of Object.keys(M.ja)) {
    assert.deepEqual(ph(M.ja[k]), ph(M.en[k]), `${k} のプレースホルダーが日英で違う`);
  }
});
