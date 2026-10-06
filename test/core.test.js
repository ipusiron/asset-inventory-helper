const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../inventory-core.js");
const parse = (text, format) => core.parseInventory(text, format);
const pairs = result => result.entries.map(({ name, version }) => [name, version]);

const accepted = [
  ["Node.js 22.6.0", [["Node.js", "22.6.0"]]],
  ["namebench 1.3.1", [["namebench", "1.3.1"]]],
  ["VLC media player\t3.0.21", [["VLC media player", "3.0.21"]]],
  ["VLC media player\t", [["VLC media player", ""]]],
  ["Name  Version\nMy App  1.0", [["My App", "1.0"]]],
  ["ソフト名\t1.0\r\nNode.js\t22.6.0", [["ソフト名", "1.0"], ["Node.js", "22.6.0"]]],
  ["git 2.46.0\ngit 2.46.0", [["git", "2.46.0"], ["git", "2.46.0"]]],
  ["=1+1\t1.0", [["=1+1", "1.0"]]],
  ["<script>alert(1)</script>\t1.0", [["<script>alert(1)</script>", "1.0"]]]
];
for (const [input, expected] of accepted) {
  test("pair: " + JSON.stringify(input), () => assert.deepEqual(pairs(parse(input)), expected));
}
for (const input of ["VLC media player", "bash-5.2.26-1.fc40.x86_64", "git 2.45.0 2.46.0", "App\t1\t2", "go 1.2 extra"]) {
  test("hold ambiguous: " + input, () => {
    const result = parse(input);
    assert.equal(result.entries.length, 0);
    assert.equal(result.lines[0].raw, input);
    assert.equal(result.lines[0].status, "held");
  });
}
for (const header of ["Name  Id  Version  Available  Source", "名前  ID  バージョン  利用可能  ソース"]) {
  test("winget installed not available: " + header, () => {
    assert.deepEqual(pairs(parse(header + "\nGit  Git.Git  2.46.0  2.47.0  winget")), [["Git", "2.46.0"]]);
  });
}
test("winget missing optional columns and unknown versions", () => {
  assert.deepEqual(pairs(parse("Name  Id  Version\nNode.js  OpenJS.NodeJS  22.6.0\nApp  Some.App  Unknown")),
    [["Node.js", "22.6.0"], ["App", "Unknown"]]);
});
test("winget without header is held", () => assert.equal(parse("Git  Git.Git  1.0", "winget").lines[0].code, "wingetHeader"));
test("winget ambiguous name columns and extra columns are held", () => {
  for (const line of ["Visual  Studio  2022  Microsoft.VS  17.0", "Git  Git.Git  1.0  extra"]) {
    assert.equal(parse("Name  Id  Version\n" + line).entries.length, 0);
  }
});
test("winget Store and ARP identifiers", () => {
  assert.deepEqual(pairs(parse("Name  Id  Version\nStore App  9NBLGGH4NNS1  1.0\nLocal App  ARP\\Machine\\X64\\App  2.0")),
    [["Store App", "1.0"], ["Local App", "2.0"]]);
});
test("truncated winget name is held", () => assert.equal(parse("Name  Id  Version\nSome…  Some.App  1").lines[1].code, "truncated"));
test("dpkg includes held installed, excludes removed and error", () => {
  const result = parse("ii  bash  5.2  amd64  shell\nhi  git  2.46  amd64  git\nrc  old  1  all  old\niiR broken  1  all  broken");
  assert.equal(result.format, "dpkg");
  assert.deepEqual(pairs(result), [["bash", "5.2"], ["git", "2.46"]]);
  assert.equal(result.lines.filter(item => item.status === "excluded").length, 2);
});
test("brew multiple versions keep source line", () => {
  const result = parse("brew list --versions\ngit 2.45.0 2.46.0");
  assert.deepEqual(pairs(result), [["git", "2.45.0"], ["git", "2.46.0"]]);
  assert.deepEqual(result.entries.map(item => item.line), [2, 2]);
});
test("brew explicit format", () => assert.equal(parse("git 2.45.0 2.46.0", "brew").entries.length, 2));
test("mixed formats are held rather than guessed", () => {
  const result = parse("Name  Id  Version\nbrew list --versions\ngit 1.0");
  assert.equal(result.entries.length, 0);
  assert.ok(result.lines.every(item => item.code === "mixedFormats"));
});
test("control characters held with original intact", () => {
  const input = "ab\u202ecd\t1";
  assert.equal(parse(input).lines[0].raw, input);
  assert.equal(parse(input).lines[0].code, "controlCharacter");
});
test("input UTF16 limit including surrogate pairs", () => {
  assert.equal(parse("a".repeat(core.LIMITS.input)).error, null);
  assert.equal(parse("😀".repeat(250001)).error, "inputLimit");
});
test("5000 entries accepted, 5001 fails without partial output", () => {
  const input = Array.from({ length: 5000 }, (_, i) => "pkg" + i + " 1.0").join("\n");
  assert.equal(parse(input).entries.length, 5000);
  const result = parse(input + "\npkg5000 1.0");
  assert.equal(result.error, "entryLimit");
  assert.equal(result.entries.length, 0);
});
test("line limit and empty/type/format validation", () => {
  assert.equal(parse("\n".repeat(10000)).error, "lineLimit");
  assert.equal(parse(" \n").error, "emptyInput");
  assert.equal(parse(null).error, "invalidInput");
  assert.equal(parse("git 1", "other").error, "invalidFormat");
});
for (const prefix of ["=", "+", "-", "@", "＝", "＋", "－", "＠", "\t", "\r", "\n", "  ="]) {
  test("CSV protects " + JSON.stringify(prefix), () => assert.ok(core.csvCell(prefix + "1+1").startsWith('"\'')));
}
test("CSV quotes commas and quotes, includes BOM and CRLF", () => {
  assert.equal(core.toCsv([{ name: 'a,"b', version: "1" }]), '\ufeff"name","version"\r\n"a,""b","1"\r\n');
});
test("JSON keeps original values without source metadata or CSV prefix", () => {
  const entries = [{ name: "=1+1", version: "@v", line: 5 }];
  assert.deepEqual(JSON.parse(core.toJson(entries)), [{ name: "=1+1", version: "@v" }]);
  assert.equal(entries[0].name, "=1+1");
});
