(function(root) {
  "use strict";

  const LIMITS = Object.freeze({ input: 500000, lines: 10000, entries: 5000, exportBytes: 10 * 1024 * 1024 });
  const FORMATS = Object.freeze(["auto", "columns", "winget", "dpkg", "brew"]);
  const VERSION = /^(?:v?\d)[^\s]*$/;
  const DPKG = /^([uihrp])([ncHUFWti])([ R]?)\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+.*)?$/;
  const HEADER = /^(?:Name|名前|名称)\s+(?:Id|ID|識別子)\s+(?:Version|バージョン)(?:\s+(?:Available|利用可能|使用可能))?(?:\s+(?:Source|ソース))?$/i;
  const PAIR_HEADER = /^(?:Name|名前|名称)\s+(?:Version|バージョン)$/i;

  function detectFormat(lines) {
    const hints = new Set();
    for (const raw of lines) {
      const line = raw.trim();
      if (HEADER.test(line) || /^winget list$/i.test(line)) hints.add("winget");
      if (/^(?:Desired=|\| Status=|\|\|\/|dpkg -l$)/.test(line)) hints.add("dpkg");
      if (/^brew list (?:--cask )?--versions$/.test(line)) hints.add("brew");
    }
    if (hints.size > 1) return "mixed";
    if (hints.size === 1) return [...hints][0];
    const data = lines.map(line => line.trim()).filter(Boolean);
    if (data.length && data.every(line => DPKG.test(line))) return "dpkg";
    return "columns";
  }

  function parseColumns(raw) {
    let fields;
    if (raw.includes("\t")) {
      fields = raw.trimStart().split("\t");
    } else if (/ {2,}/.test(raw.trim())) {
      fields = raw.trim().split(/ {2,}/);
    } else {
      const match = raw.trim().match(/^(\S+) ([^ ]+)$/);
      if (!match || !VERSION.test(match[2])) return null;
      fields = match.slice(1);
    }
    if (fields.length !== 2) return null;
    const [name, version] = fields.map(value => value.trim());
    if (!name || /\s/.test(version)) return null;
    return [{ name, version }];
  }

  function parseInventory(input, requested = "auto") {
    const result = { format: requested, entries: [], lines: [], error: null };
    const fail = code => ({ ...result, entries: [], error: code });
    if (typeof input !== "string") return fail("invalidInput");
    if (!FORMATS.includes(requested)) return fail("invalidFormat");
    if (input.length > LIMITS.input) return fail("inputLimit");
    const lines = input.replace(/\r\n?/g, "\n").split("\n");
    if (lines.length > LIMITS.lines) return fail("lineLimit");
    if (!input.trim()) return fail("emptyInput");
    result.format = requested === "auto" ? detectFormat(lines) : requested;
    let wingetHeader = false;
    let wingetColumns = 0;
    for (const [index, raw] of lines.entries()) {
      const line = raw.trim();
      if (!line) continue;
      const item = { line: index + 1, raw, status: "held", code: "ambiguous" };
      result.lines.push(item);
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(raw)) {
        item.code = "controlCharacter";
        continue;
      }
      if (result.format === "mixed") {
        item.code = "mixedFormats";
        continue;
      }
      if (/\u2026|\.{3}/.test(line)) {
        item.code = "truncated";
        continue;
      }
      let entries = null;
      let ignored = /^[-=]{3,}$/.test(line);
      if (result.format === "columns") {
        ignored ||= PAIR_HEADER.test(line);
        // Do not interpret an unselected multi-column/package-manager format as a pair.
        if (!ignored) entries = parseColumns(raw);
      } else if (result.format === "winget") {
        if (HEADER.test(line)) {
          wingetHeader = true;
          wingetColumns = line.split(/\s+/).length;
          ignored = true;
        }
        ignored ||= /^winget list$/i.test(line);
        if (!ignored && wingetHeader) {
          const fields = line.split(/\t+| {2,}/);
          const idLike = /^(?:[^\s]+[.\\][^\s]+|[A-Z0-9]{12,})$/;
          if (fields.length >= 3 && fields.length <= wingetColumns &&
              idLike.test(fields[1]) && (VERSION.test(fields[2]) || /^(?:Unknown|不明)$/i.test(fields[2])) &&
              fields.slice(3).every(value => /^\S+$/.test(value))) {
            entries = [{ name: fields[0], version: fields[2] }];
          }
        }
        if (!ignored && !wingetHeader) item.code = "wingetHeader";
      } else if (result.format === "dpkg") {
        ignored ||= /^(?:Desired=|\| Status=|\|\|\/|\|\/|\+\+\+-|dpkg -l$)/.test(line);
        const match = line.match(DPKG);
        if (!ignored && match) {
          if (match[2] === "i" && match[3] !== "R") {
            entries = [{ name: match[4], version: match[5] }];
          } else {
            item.status = "excluded";
            item.code = "notInstalled";
          }
        }
      } else if (result.format === "brew") {
        ignored ||= /^brew list (?:--cask )?--versions$/.test(line);
        const [name, ...versions] = line.split(/\s+/);
        if (!ignored && /^[A-Za-z0-9@+_.\/-]+$/.test(name) && versions.length && versions.every(v => VERSION.test(v))) {
          entries = versions.map(version => ({ name, version }));
        }
      }
      if (ignored) {
        item.status = "ignored";
        item.code = "header";
      } else if (entries) {
        if (result.entries.length + entries.length > LIMITS.entries) return fail("entryLimit");
        result.entries.push(...entries.map(entry => ({ ...entry, line: index + 1 })));
        item.status = "accepted";
        item.code = "accepted";
      }
    }
    return result;
  }

  function plainEntries(entries) {
    return entries.map(({ name, version }) => ({ name, version }));
  }

  function csvCell(value) {
    const text = String(value);
    const dangerous = /^[\s\u0000-\u001f]*[=+\-@＝＋－＠]/.test(text) || /^[\t\r\n]/.test(text);
    const safe = dangerous ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  }

  function toCsv(entries) {
    const rows = [["name", "version"], ...entries.map(item => [item.name, item.version])];
    return "\ufeff" + rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  }

  function toJson(entries) {
    return JSON.stringify(plainEntries(entries), null, 2) + "\n";
  }

  const api = Object.freeze({ LIMITS, FORMATS, parseInventory, toCsv, toJson, csvCell });
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.InventoryCore = api;
})(typeof globalThis === "object" ? globalThis : this);
