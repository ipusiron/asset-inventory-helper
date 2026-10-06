const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const ja = read("README.md").replace(/<!--[\s\S]*?-->/g, "");
const en = read("README.en.md");
const core = require("../inventory-core.js");
function headings(text) {
  let fence = null;
  return text.split(/\r?\n/).flatMap(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      return [];
    }
    return !fence && /^#{1,6} /.test(line) ? [line.match(/^#+/)[0]] : [];
  });
}
const links = text => [...text.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]);
const commands = text => [...text.matchAll(/```(?:sh|bash)\r?\n([\s\S]*?)```/g)]
  .map(match => match[1].replace(/\r\n/g, "\n").trim());
const tableNumbers = text => text.split(/\r?\n/).filter(line => /^\|/.test(line))
  .map(line => line.match(/\d[\d,.]*/g) || []).filter(row => row.length);

test("English README has reciprocal links and the complete Japanese heading hierarchy", () => {
  assert.match(ja, /\[English\]\(README\.en\.md\)/);
  assert.match(en, /\[日本語\]\(README\.md\)/);
  assert.deepEqual(headings(en), headings(ja));
  assert.ok(headings(en).length >= 20);
  assert.match(en, /interface.*Japanese/i);
  assert.match(en, /Japanese interface/i);
});

test("English README preserves source links and every local target exists", () => {
  const comparable = text => links(text).filter(target => !/^README(?:\.en)?\.md$/.test(target)).sort();
  assert.deepEqual(comparable(en), comparable(ja));
  for (const target of links(en)) {
    if (/^(?:https?:|#)/.test(target)) continue;
    assert.ok(fs.existsSync(path.join(root, target.split("#")[0])), target);
  }
});

test("English README preserves runnable commands and numerical table values", () => {
  assert.deepEqual(commands(en), commands(ja));
  assert.deepEqual(tableNumbers(en), tableNumbers(ja));
  assert.match(en, /npm test/);
});

test("all five English parsing examples execute with the documented result", () => {
  const section = en.split("### Parsing examples")[1].split("\n## ")[0];
  const rows = [...section.matchAll(/^\| `(.+?)` \| (auto|columns) \| (.*?) \| (.*?) \| (Accepted|Held) \|$/gm)];
  assert.equal(rows.length, 5);
  for (const [, input, format, name, version, status] of rows) {
    const result = core.parseInventory(input.replaceAll("\\t", "\t"), format);
    assert.equal(result.error, null);
    if (status === "Accepted") assert.deepEqual(result.entries, [{ name, version, line: 1 }]);
    else {
      assert.equal(result.entries.length, 0);
      assert.equal(result.lines[0].status, "held");
    }
  }
});

test("English README states actual limits and does not promise comprehensive protection", () => {
  for (const value of Object.values(core.LIMITS)) assert.ok(en.includes(value.toLocaleString("en-US")));
  for (const phrase of ["UTF-16", "10 MiB", "CRLF", "BOM", "name,version", "JSON", "does not"]) {
    assert.ok(en.includes(phrase), phrase);
  }
  assert.match(en, /no universal/i);
  assert.match(en, /compliance/i);
});
