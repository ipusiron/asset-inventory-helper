(function() {
  "use strict";
  const core = globalThis.InventoryCore;
  // 現在の言語の辞書を引く（i18n.js が言語を持つ。無ければ日本語）。
  const getDict = () => {
    const m = globalThis.InventoryMessages || {};
    const lang = (globalThis.I18N && globalThis.I18N.lang) || "ja";
    return m[lang] || m.ja || {};
  };
  const t = (key, values = {}) => String((getDict()[key] != null) ? getDict()[key] : key)
    .replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
  let currentResult = null;

  // ===== サンプル入力 =====
  const sampleWindows = `Name                           Version
  --------------------------------------
  7-Zip                          24.06
  GoogleChrome                   127.0.6533.121
  MicrosoftEdge                  127.0.2651.86
  Notepad++                      8.7.5
  Python                         3.12.5
  VLC                            3.0.21`;

  const sampleLinux = `Desired=Unknown/Install/Remove/Purge/Hold
  | Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
  ||/ Name                 Version           Architecture Description
  ii  bash                 5.2.21-2ubuntu4   amd64        GNU Bourne Again SHell
  ii  coreutils            9.1-1ubuntu2.1    amd64        GNU core utilities
  ii  curl                 8.5.0-2ubuntu10   amd64        command line tool for transferring data
  ii  git                  1:2.43.0-1ubuntu  amd64        fast, scalable, distributed revision control system
  ii  openssl              3.0.13-0ubuntu3   amd64        Secure Sockets Layer toolkit`;

  const sampleMac = `brew list --versions
  git 2.46.0
  node 22.6.0
  python@3.12 3.12.5
  wget 1.24.5
  ffmpeg 7.0.2`;

  // ===== DOM要素 =====
  const rawInput = document.getElementById("rawInput");
  const processBtn = document.getElementById("processBtn");
  const outputArea = document.getElementById("outputArea");
  const exportBtns = document.getElementById("exportBtns");
  const exportCsvBtn = document.getElementById("exportCsv");
  const exportJsonBtn = document.getElementById("exportJson");

  const loadSampleWinBtn = document.getElementById("loadSampleWin");
  const loadSampleLinuxBtn = document.getElementById("loadSampleLinux");
  const loadSampleMacBtn = document.getElementById("loadSampleMac");
  const tabFormatBtn = document.getElementById("tabFormatBtn");
  const tabTipsBtn = document.getElementById("tabTipsBtn");
  const tabFormat = document.getElementById("tab-format");
  const tabTips = document.getElementById("tab-tips");
  const inputFormat = document.getElementById("inputFormat");
  const resultStatus = document.getElementById("resultStatus");
  const issueArea = document.getElementById("issueArea");
  const inputCount = document.getElementById("inputCount");

  function invalidate(key = "changed") {
    currentResult = null;
    outputArea.replaceChildren();
    issueArea.replaceChildren();
    exportBtns.classList.add("hidden");
    exportCsvBtn.disabled = true;
    exportJsonBtn.disabled = true;
    resultStatus.textContent = t(key);
    resultStatus.classList.remove("warning");
    inputCount.textContent = t("inputCount", { count: rawInput.value.length });
  }
  rawInput.addEventListener("input", () => invalidate());
  inputFormat.addEventListener("change", () => invalidate());
  document.getElementById("clearBtn").addEventListener("click", () => {
    rawInput.value = "";
    invalidate("cleared");
    rawInput.focus();
  });

  // ===== サンプル読込イベント =====
  loadSampleWinBtn.addEventListener("click", () => {
    rawInput.value = sampleWindows;
    inputFormat.value = "columns";
    invalidate();
  });

  loadSampleLinuxBtn.addEventListener("click", () => {
    rawInput.value = sampleLinux;
    inputFormat.value = "dpkg";
    invalidate();
  });

  loadSampleMacBtn.addEventListener("click", () => {
    rawInput.value = sampleMac;
    inputFormat.value = "brew";
    invalidate();
  });

  // ===== 整形処理 =====
  processBtn.addEventListener("click", () => {
    invalidate();
    const result = core.parseInventory(rawInput.value, inputFormat.value);
    if (result.error) {
      resultStatus.textContent = t(result.error);
      resultStatus.classList.add("warning");
      return;
    }
    currentResult = result;
    const count = status => result.lines.filter(line => line.status === status).length;
    resultStatus.textContent = t("summary", {
      format: t("format_" + result.format), total: result.lines.length, entries: result.entries.length,
      accepted: count("accepted"), held: count("held"), excluded: count("excluded"), ignored: count("ignored")
    });
    resultStatus.classList.toggle("warning", count("held") + count("excluded") > 0);
    renderTable(result.entries);
    renderIssues(result.lines.filter(line => line.status === "held" || line.status === "excluded"));
    if (result.entries.length) {
      exportBtns.classList.remove("hidden");
      exportCsvBtn.disabled = false;
      exportJsonBtn.disabled = false;
    }
  });

  // ===== タブ切り替え =====
  function activateTab(which) {
    const isFormat = which === "format";
    tabFormatBtn.classList.toggle("active", isFormat);
    tabTipsBtn.classList.toggle("active", !isFormat);
    tabFormat.classList.toggle("hidden", !isFormat);
    tabTips.classList.toggle("hidden", isFormat);
    tabFormatBtn.setAttribute("aria-selected", String(isFormat));
    tabTipsBtn.setAttribute("aria-selected", String(!isFormat));
    tabFormat.setAttribute("aria-hidden", String(!isFormat));
    tabTips.setAttribute("aria-hidden", String(isFormat));
    tabFormatBtn.tabIndex = isFormat ? 0 : -1;
    tabTipsBtn.tabIndex = isFormat ? -1 : 0;
  }

  tabFormatBtn?.addEventListener("click", () => activateTab("format"));
  tabTipsBtn?.addEventListener("click", () => activateTab("tips"));
  const tabs = [tabFormatBtn, tabTipsBtn];
  tabs.forEach((tab, index) => tab.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
    activateTab(next === 0 ? "format" : "tips");
    tabs[next].focus();
  }));

  // ===== テーブル描画 =====
  function renderTable(data) {
    if (!data.length) {
      outputArea.textContent = t("noEntries");
      return;
    }
    const table = document.createElement("table");
    table.createCaption().textContent = t("caption");
    const head = table.createTHead().insertRow();
    ["name", "version", "sourceLine"].forEach(key => {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = t(key);
      head.append(cell);
    });
    const body = table.createTBody();
    data.forEach(item => {
      const row = body.insertRow();
      [item.name, item.version || t("unknown"), item.line].forEach(value => {
        row.insertCell().textContent = String(value);
      });
    });
    outputArea.replaceChildren(table);
  }

  function renderIssues(issues) {
    if (!issues.length) return;
    const details = document.createElement("details");
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = t("issues", { count: issues.length });
    details.append(summary);
    const list = document.createElement("ol");
    issues.forEach(issue => {
      const item = document.createElement("li");
      item.value = issue.line;
      const reason = document.createElement("p");
      reason.textContent = t(issue.status) + ": " + t(issue.code);
      const source = document.createElement("pre");
      source.textContent = issue.raw.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,
        char => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0"));
      item.append(reason, source);
      list.append(item);
    });
    details.append(list);
    issueArea.replaceChildren(details);
  }

  // ===== エクスポート =====
  exportCsvBtn.addEventListener("click", () => {
    if (!currentResult?.entries.length) return;
    downloadFile("inventory.csv", core.toCsv(currentResult.entries), "text/csv;charset=utf-8");
  });

  exportJsonBtn.addEventListener("click", () => {
    if (!currentResult?.entries.length) return;
    downloadFile("inventory.json", core.toJson(currentResult.entries), "application/json;charset=utf-8");
  });

  // ===== ユーティリティ =====
  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    if (blob.size > core.LIMITS.exportBytes) {
      resultStatus.textContent = t("exportLimit");
      resultStatus.classList.add("warning");
      return;
    }
    let url;
    const link = document.createElement("a");
    try {
      url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
    } catch {
      resultStatus.textContent = t("exportFailed");
      resultStatus.classList.add("warning");
    } finally {
      link.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  invalidate("initial");

  // 言語が変わったら、結果が出ていれば作り直して動的な文言も新しい言語にする。
  if (globalThis.I18N && typeof globalThis.I18N.onChange === "function") {
    globalThis.I18N.onChange(() => {
      inputCount.textContent = t("inputCount", { count: rawInput.value.length });
      if (currentResult) processBtn.click();
    });
  }
})();
