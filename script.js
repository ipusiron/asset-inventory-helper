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

// ===== サンプル読込イベント =====
loadSampleWinBtn.addEventListener("click", () => {
  rawInput.value = sampleWindows;
  outputArea.innerHTML = "";
  exportBtns.classList.add("hidden");
});

loadSampleLinuxBtn.addEventListener("click", () => {
  rawInput.value = sampleLinux;
  outputArea.innerHTML = "";
  exportBtns.classList.add("hidden");
});

loadSampleMacBtn.addEventListener("click", () => {
  rawInput.value = sampleMac;
  outputArea.innerHTML = "";
  exportBtns.classList.add("hidden");
});

// ===== 整形処理 =====
processBtn.addEventListener("click", () => {
  const rawText = rawInput.value.trim();
  if (!rawText) {
    alert("テキストを入力してください。");
    return;
  }

  // 入力サイズチェック（500KB制限）
  if (rawText.length > 500000) {
    alert("入力データが大きすぎます。500,000文字以内にしてください。");
    return;
  }

  const lines = rawText.split("\n").filter(line => line.trim() !== "");

  // 先頭の説明行や区切り線などを簡易スキップ（dpkg -l 等のヘッダを想定）
  const filtered = lines.filter(line => {
    const l = line.trim();
    return !(
      l.startsWith("Desired=") ||
      l.startsWith("| Status=") ||
      l.startsWith("||/") ||
      /^[-=]{3,}$/.test(l) ||
      l.toLowerCase().startsWith("name") || // Windows winget listの見出し行
      l.toLowerCase().startsWith("winget list") || // 余計なコマンド行
      l.toLowerCase().startsWith("brew list") // brewの見出し/説明行
    );
  });

  const parsed = [];
  const MAX_ENTRIES = 5000; // 最大エントリ数制限

  // フォーマットが色々あるため、いくつかの簡易パターンで抽出
  filtered.forEach((line, index) => {
    // エントリ数制限
    if (parsed.length >= MAX_ENTRIES) {
      console.warn(`Entry limit reached (${MAX_ENTRIES}). Skipping remaining entries.`);
      return;
    }
    const l = line.trim();

    // dpkg -l 形式: "ii  name  version  arch  desc..."
    if (/^[a-z][a-z]\s+/.test(l)) {
      const parts = l.split(/\s+/);
      if (parts.length >= 3) {
        parsed.push({ name: parts[1], version: parts[2] });
        return;
      }
    }

    // 汎用: 末尾（右側）にある「数字を含むトークン」をバージョンとみなす。
    // 例) "ABC EDF 1.2.3" -> name: "ABC EDF", version: "1.2.3"
    const parts = l.split(/\s+/);
    if (parts.length >= 2) {
      let versionIndex = -1;
      for (let i = parts.length - 1; i >= 1; i--) {
        if (/\d/.test(parts[i])) { // 数字を含むトークンを候補に
          versionIndex = i;
          break;
        }
      }
      if (versionIndex > 0) {
        let nameTokens = parts.slice(0, versionIndex);
        // 中間列（Id/Pathなど）を除外: バックスラッシュ/スラッシュ/コロンや vendor.id っぽいトークンを検出したら以降を切り落とす
        const isIdLike = (tok) => /[\\/,:]/.test(tok) || /[A-Za-z]\.[A-Za-z]/.test(tok);
        const cutAt = nameTokens.findIndex(isIdLike);
        if (cutAt !== -1) {
          nameTokens = nameTokens.slice(0, cutAt);
        }
        const name = nameTokens.join(" ").trim();
        const version = parts[versionIndex];
        parsed.push({ name, version });
        return;
      }
      // フォールバック: 先頭2トークンを name/version として扱う（brewなど）
      parsed.push({ name: parts[0], version: parts[1] || "" });
      return;
    }

    // それ以外は名前のみ扱い
    parsed.push({ name: l, version: "" });
  });

  renderTable(parsed);
  exportBtns.classList.remove("hidden");
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
}

tabFormatBtn?.addEventListener("click", () => activateTab("format"));
tabTipsBtn?.addEventListener("click", () => activateTab("tips"));

// ===== テーブル描画 =====
function renderTable(data) {
  if (!data.length) {
    outputArea.innerHTML = "<p>有効なデータが見つかりませんでした。</p>";
    return;
  }
  let html = "<table><thead><tr><th>ソフト名</th><th>バージョン</th></tr></thead><tbody>";
  data.forEach(item => {
    html += `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.version)}</td></tr>`;
  });
  html += "</tbody></table>";
  outputArea.innerHTML = html;
}

// ===== エクスポート =====
exportCsvBtn.addEventListener("click", () => {
  const rows = Array.from(document.querySelectorAll("table tr")).map(tr =>
    Array.from(tr.querySelectorAll("th,td")).map(td =>
      // CSV基本エスケープ
      `"${td.innerText.replace(/"/g, '""')}"`
    ).join(",")
  );
  const csvContent = rows.join("\n");
  downloadFile("inventory.csv", csvContent, "text/csv");
});

exportJsonBtn.addEventListener("click", () => {
  const rows = Array.from(document.querySelectorAll("table tbody tr")).map(tr => {
    const cells = tr.querySelectorAll("td");
    return {
      name: cells[0]?.innerText ?? "",
      version: cells[1]?.innerText ?? ""
    };
  });
  const jsonContent = JSON.stringify(rows, null, 2);
  downloadFile("inventory.json", jsonContent, "application/json");
});

// ===== ユーティリティ =====
function downloadFile(filename, content, mime) {
  // ファイルサイズチェック（10MB制限）
  if (content.length > 10 * 1024 * 1024) {
    alert("エクスポートファイルが大きすぎます（10MB制限）。");
    return;
  }
  
  const blob = new Blob([content], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  // null/undefinedチェック
  if (str == null) return "";
  
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ===== セキュリティ: DOMContentLoaded後の初期化 =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Asset Inventory Helper initialized');
  });
} else {
  console.log('Asset Inventory Helper initialized');
}
