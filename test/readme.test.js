const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const core = require("../inventory-core.js");
const messages = require("../inventory-messages.js");
const readme = read("README.md");
const html = read("index.html");
const script = read("script.js");

test("README examples are executed, with exactly five rows", () => {
  const section = readme.split("### 読み取り例")[1].split("\n## ")[0];
  const rows = [...section.matchAll(/^\| `(.+?)` \| (auto|columns) \| (.*?) \| (.*?) \| (採用|保留) \|$/gm)];
  assert.equal(rows.length, 5);
  for (const [, input, format, name, version, status] of rows) {
    const result = core.parseInventory(input.replaceAll("\\t", "\t"), format);
    assert.equal(result.error, null);
    if (status === "採用") {
      assert.deepEqual(result.entries, [{ name, version, line: 1 }]);
    } else {
      assert.equal(result.entries.length, 0);
      assert.equal(result.lines[0].status, "held");
    }
  }
});

test("README and UI publish actual limits and correct units", () => {
  for (const content of [readme, html]) {
    assert.ok(content.includes(core.LIMITS.input.toLocaleString("en-US")));
    assert.ok(content.includes(core.LIMITS.lines.toLocaleString("en-US")));
    assert.ok(content.includes(core.LIMITS.entries.toLocaleString("en-US")));
    assert.ok(content.includes("UTF-16"));
    assert.ok(content.includes("10 MiB"));
  }
  assert.ok(readme.includes(core.LIMITS.exportBytes.toLocaleString("en-US")));
});

test("all three sample strings parse to the documented exact records", () => {
  const samples = [...script.matchAll(/const sample(Windows|Linux|Mac) = `([^`]+)`;/g)];
  assert.equal(samples.length, 3);
  const expected = {
    Windows: [["7-Zip", "24.06"], ["GoogleChrome", "127.0.6533.121"], ["MicrosoftEdge", "127.0.2651.86"],
      ["Notepad++", "8.7.5"], ["Python", "3.12.5"], ["VLC", "3.0.21"]],
    Linux: [["bash", "5.2.21-2ubuntu4"], ["coreutils", "9.1-1ubuntu2.1"], ["curl", "8.5.0-2ubuntu10"],
      ["git", "1:2.43.0-1ubuntu"], ["openssl", "3.0.13-0ubuntu3"]],
    Mac: [["git", "2.46.0"], ["node", "22.6.0"], ["python@3.12", "3.12.5"], ["wget", "1.24.5"], ["ffmpeg", "7.0.2"]]
  };
  for (const [, name, input] of samples) {
    assert.deepEqual(core.parseInventory(input).entries.map(({ name, version }) => [name, version]), expected[name]);
  }
  assert.match(readme, /Windowsは6件、Linuxは5件、macOSは5件/);
});

test("metadata identity and block lists are preserved", () => {
  for (const [key, value] of Object.entries({ id: "day059", slug: "asset-inventory-helper", hub: "true" })) {
    assert.match(readme, new RegExp("^" + key + ": " + value + "$", "m"));
  }
  assert.match(readme, /^<!--\r?\n---/);
  for (const key of ["category_ja", "category_en", "tags"]) assert.match(readme, new RegExp(key + ":\\r?\\n  - "));
  assert.match(readme, /repo_url: "https:\/\/github.com\/ipusiron\/asset-inventory-helper"/);
  assert.match(readme, /demo_url: "https:\/\/ipusiron.github.io\/asset-inventory-helper\/"/);
});

test("local document links and image links exist", () => {
  let count = 0;
  for (const file of ["README.md", "COMMANDS.md", "SECURITY.md", "TECHNICAL.md"]) {
    for (const [, target] of read(file).matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(target)) continue;
      assert.ok(fs.existsSync(path.join(root, target.split("#")[0])), target);
      count++;
    }
  }
  assert.ok(count >= 5);
  for (const file of fs.readdirSync(path.join(root, "assets"))) {
    if (file.endsWith(".png")) assert.ok(readme.includes("assets/" + file));
  }
});

test("HTML security, labels and tab relationships", () => {
  assert.match(html, /Content-Security-Policy/);
  for (const forbidden of [/unsafe-inline/, /unsafe-eval/, /http-equiv="X-/, /frame-ancestors/, /\son\w+=/i, /\sstyle=/i]) {
    assert.doesNotMatch(html, forbidden);
  }
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /<noscript/);
  assert.match(html, /<label for="rawInput"/);
  assert.match(html, /<label for="inputFormat"/);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 2);
  assert.equal((html.match(/role="tab"/g) || []).length, 2);
  assert.doesNotMatch(html, /maxlength=/);
  assert.match(html, /id="resultStatus"[^>]+role="status"/);
  const sources = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(sources, ["inventory-core.js", "inventory-messages.js", "i18n.js", "script.js"]);
  sources.forEach(file => assert.ok(fs.existsSync(path.join(root, file))));
});

test("core loads as a classic script without a module loader", () => {
  const context = vm.createContext({});
  vm.runInContext(read("inventory-core.js"), context);
  assert.equal(context.InventoryCore.parseInventory("git 1").entries[0].name, "git");
});

test("dynamic messages and DOM safety remain centralized", () => {
  for (const [, key] of script.matchAll(/\bt\("([A-Za-z]+)"/g)) assert.ok(messages.ja[key], key);
  assert.doesNotMatch(script, /\.innerHTML|\.outerHTML|document\.write|localStorage|fetch\(/);
  assert.doesNotMatch(script.replace(/\/\/[^\n]*/g, ""), /[\u3040-\u30ff\u4e00-\u9fff]/);
  for (const event of ["input", "change"]) assert.match(script, new RegExp('addEventListener\\("' + event + '"'));
});

test("no installed dependencies and CI runs the same test command", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.test, "node --test");
  assert.equal(Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length, 0);
  const workflow = read(".github/workflows/test.yml");
  assert.match(workflow, /on: \[push, pull_request\]/);
  assert.match(workflow, /node-version: 22/);
  assert.match(workflow, /run: npm test/);
});

test("primary button normal and hover colors have text contrast >= 4.5", () => {
  const luminance = color => {
    const values = color.match(/../g).map(hex => parseInt(hex, 16) / 255)
      .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
  };
  const css = read("style.css");
  for (const selector of ["button", "button:hover", ".tab-btn.active"]) {
    const block = css.slice(css.indexOf(selector + " {"));
    const color = block.slice(0, block.indexOf("}")).match(/background: #([0-9a-f]{6})/)[1];
    assert.ok(1.05 / (luminance(color) + .05) >= 4.5, selector);
  }
});

test("ユースケースの「このツールならではの使い方」の件数と保留コードを計算部で再計算（日英）", () => {
  const en = read("README.en.md");
  const win = ["Name                           Version", "--------------------------------------",
    "7-Zip                          24.06", "GoogleChrome                   127.0.6533.121",
    "MicrosoftEdge                  127.0.2651.86", "Notepad++                      8.7.5",
    "Python                         3.12.5", "VLC                            3.0.21"].join("\n");
  assert.equal(core.parseInventory(win, "columns").entries.length, 6);
  const lin = ["||/ Name                 Version           Architecture Description",
    "ii  bash                 5.2.21-2ubuntu4   amd64        GNU Bourne Again SHell",
    "ii  coreutils            9.1-1ubuntu2.1    amd64        GNU core utilities",
    "ii  curl                 8.5.0-2ubuntu10   amd64        command line tool",
    "ii  git                  1:2.43.0-1ubuntu  amd64        revision control",
    "ii  openssl              3.0.13-0ubuntu3   amd64        SSL toolkit"].join("\n");
  assert.equal(core.parseInventory(lin, "dpkg").entries.length, 5);
  const mac = ["git 2.46.0", "node 22.6.0", "python@3.12 3.12.5", "wget 1.24.5", "ffmpeg 7.0.2"].join("\n");
  assert.equal(core.parseInventory(mac, "brew").entries.length, 5);
  const held = core.parseInventory("Google Chrome    120.0\nTruncApp\u2026\nBad\u202EApp    1.0", "columns");
  assert.deepEqual(held.lines.map(l => l.code), ["accepted", "truncated", "controlCharacter"]);
  assert.equal(held.entries.length, 1);
  for (const md of [readme, en]) assert.ok(md.includes("6") && md.includes("5"));
});
