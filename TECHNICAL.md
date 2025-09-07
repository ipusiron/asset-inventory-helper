# 技術仕様書 - Asset Inventory Helper

## 概要

本ドキュメントは、Asset Inventory Helperのコアアルゴリズム、プログラミングテクニック、技術的な設計判断について解説します。

---

## 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [コアアルゴリズム](#コアアルゴリズム)
3. [パース処理の詳細](#パース処理の詳細)
4. [プログラミングテクニック](#プログラミングテクニック)
5. [データフロー](#データフロー)
6. [パフォーマンス最適化](#パフォーマンス最適化)
7. [エラーハンドリング](#エラーハンドリング)

---

## アーキテクチャ概要

### 設計思想

```
[入力] → [前処理] → [パース] → [正規化] → [表示] → [エクスポート]
   ↑                                              ↓
   └──────────── ユーザーインタラクション ──────────┘
```

**クライアントサイド完結型アーキテクチャ**
- サーバー不要の静的サイト
- すべての処理をブラウザ内で実行
- 外部依存なし（ライブラリ未使用）

---

## コアアルゴリズム

### 1. 汎用パーサーアルゴリズム

```javascript
// 基本的なパース戦略
function parseStrategy(line) {
  // Step 1: 既知のフォーマットを検出
  if (isDpkgFormat(line)) return parseDpkg(line);
  if (isWingetFormat(line)) return parseWinget(line);
  
  // Step 2: 汎用ヒューリスティック
  return parseGeneric(line);
}
```

#### アルゴリズムの核心

```javascript
// フォーマットが色々あるため、いくつかの簡易パターンで抽出
filtered.forEach((line, index) => {
  const l = line.trim();
  
  // パターン1: dpkg -l 形式の検出
  // "ii  package-name  1.2.3  arch  description"
  if (/^[a-z][a-z]\s+/.test(l)) {
    const parts = l.split(/\s+/);
    if (parts.length >= 3) {
      parsed.push({ 
        name: parts[1],      // 2番目の要素が名前
        version: parts[2]    // 3番目の要素がバージョン
      });
      return;
    }
  }
  
  // パターン2: 汎用バージョン検出
  // 右側から数字を含むトークンを探す
  const parts = l.split(/\s+/);
  if (parts.length >= 2) {
    let versionIndex = -1;
    // 逆順探索で最初の数字含有トークンを見つける
    for (let i = parts.length - 1; i >= 1; i--) {
      if (/\d/.test(parts[i])) {
        versionIndex = i;
        break;
      }
    }
    // バージョンが見つかった場合の処理
    if (versionIndex > 0) {
      // 名前部分の抽出（IDっぽいトークンを除外）
      let nameTokens = parts.slice(0, versionIndex);
      const isIdLike = (tok) => /[\\/,:]/.test(tok) || /[A-Za-z]\.[A-Za-z]/.test(tok);
      const cutAt = nameTokens.findIndex(isIdLike);
      if (cutAt !== -1) {
        nameTokens = nameTokens.slice(0, cutAt);
      }
      parsed.push({
        name: nameTokens.join(" ").trim(),
        version: parts[versionIndex]
      });
    }
  }
});
```

### 2. ヒューリスティックによるバージョン検出

**設計判断：なぜ右側から探索するのか？**

```javascript
// 多くのパッケージマネージャーの出力形式を分析した結果：
// name [id] [path] version [arch] [description]
//                     ↑ ここが通常バージョン

// 実装
for (let i = parts.length - 1; i >= 1; i--) {
  if (/\d/.test(parts[i])) {  // 数字を含む = バージョンの可能性
    versionIndex = i;
    break;
  }
}
```

このアプローチにより、以下の形式すべてに対応：
- `git 2.46.0` (brew形式)
- `Git Git.Git 2.46.0` (winget形式 - IDカラムあり)
- `bash 5.2.21-2ubuntu4 amd64` (dpkg形式)

### 3. ノイズ除去アルゴリズム

```javascript
// ヘッダー行や区切り線の自動除去
const filtered = lines.filter(line => {
  const l = line.trim();
  return !(
    l.startsWith("Desired=") ||      // dpkgヘッダー
    l.startsWith("| Status=") ||     // dpkgヘッダー
    l.startsWith("||/") ||            // dpkgヘッダー
    /^[-=]{3,}$/.test(l) ||          // 区切り線
    l.toLowerCase().startsWith("name") ||  // カラムヘッダー
    l.toLowerCase().startsWith("winget list") ||  // コマンド自体
    l.toLowerCase().startsWith("brew list")       // コマンド自体
  );
});
```

---

## パース処理の詳細

### 段階的フィルタリング戦略

```
入力テキスト
    ↓
[Stage 1: 行分割]
    ↓
[Stage 2: 空行除去]
    ↓
[Stage 3: ヘッダー除去]
    ↓
[Stage 4: フォーマット別パース]
    ↓
[Stage 5: データ正規化]
    ↓
構造化データ
```

### 各OSフォーマットへの対応

#### Windows (winget)
```
Name                Id                     Version
----------------------------------------
7-Zip               7zip.7zip              24.06
```

#### Linux (dpkg)
```
ii  bash  5.2.21-2ubuntu4  amd64  GNU Bourne Again SHell
```

#### macOS (brew)
```
git 2.46.0
node 22.6.0
```

---

## プログラミングテクニック

### 1. 正規表現の効率的使用

```javascript
// コンパイル済み正規表現を使わず、シンプルなテストを優先
if (/^[a-z][a-z]\s+/.test(l)) {  // dpkg形式の高速判定
  // 詳細なパースは必要な場合のみ
}

// 複雑な正規表現を避ける
// NG: /^([a-z]{2})\s+(\S+)\s+([\d\.\-\w]+)\s+(\w+)\s+(.*)$/
// OK: シンプルなsplit()とindexOf()の組み合わせ
```

### 2. 防御的プログラミング

```javascript
// Null安全なアクセス
const cells = tr.querySelectorAll("td");
return {
  name: cells[0]?.innerText ?? "",     // Optional chaining + Nullish coalescing
  version: cells[1]?.innerText ?? ""
};

// エスケープ関数の堅牢性
function escapeHtml(str) {
  if (str == null) return "";  // null/undefined対策
  return String(str)           // 強制文字列変換
    .replaceAll("&", "&amp;")  // 順序重要：&を最初に
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
```

### 3. メモリ効率を考慮した実装

```javascript
// ストリーミング的な処理（一度に全データを保持しない）
filtered.forEach((line, index) => {
  if (parsed.length >= MAX_ENTRIES) {
    return;  // 早期終了でメモリ節約
  }
  // 処理
});

// DOM操作の最小化
let html = "<table>";  // 文字列連結でDOM構築
data.forEach(item => {
  html += `<tr>...`;
});
outputArea.innerHTML = html;  // DOM操作は1回のみ
```

### 4. イベントハンドリングのベストプラクティス

```javascript
// グローバル汚染を避ける
(function() {
  // すべてのコードをIIFEで包む（実際のコードでは省略）
  const rawInput = document.getElementById("rawInput");
  // ...
})();

// イベントリスナーの適切な設定
tabFormatBtn?.addEventListener("click", () => activateTab("format"));
//          ↑ Optional chainingで要素の存在確認
```

### 5. データ変換の最適化

```javascript
// CSV生成の効率化
const rows = Array.from(document.querySelectorAll("table tr"))
  .map(tr => 
    Array.from(tr.querySelectorAll("th,td"))
      .map(td => `"${td.innerText.replace(/"/g, '""')}"`)
      .join(",")
  );
// 一度の変換で完了、中間配列を最小化
```

---

## データフロー

### 入力から出力までの変換

```javascript
// 1. 生テキスト
"ii  bash  5.2.21-2ubuntu4  amd64  GNU Bourne Again SHell"
    ↓
// 2. トークン配列
["ii", "bash", "5.2.21-2ubuntu4", "amd64", "GNU", "Bourne", "Again", "SHell"]
    ↓
// 3. 構造化オブジェクト
{ name: "bash", version: "5.2.21-2ubuntu4" }
    ↓
// 4. HTMLテーブル
"<tr><td>bash</td><td>5.2.21-2ubuntu4</td></tr>"
    ↓
// 5. エクスポート形式
CSV: "bash","5.2.21-2ubuntu4"
JSON: {"name":"bash","version":"5.2.21-2ubuntu4"}
```

---

## パフォーマンス最適化

### 1. 遅延評価

```javascript
// 必要になるまで処理しない
if (!rawText) {
  alert("テキストを入力してください。");
  return;  // 早期リターン
}
```

### 2. 処理の分割

```javascript
// 巨大データセットの処理制限
const MAX_ENTRIES = 5000;
// 一度に処理する量を制限してUIのフリーズを防ぐ
```

### 3. DOM操作の最適化

```javascript
// NG: 個別にDOM操作
data.forEach(item => {
  const tr = document.createElement('tr');
  outputArea.appendChild(tr);  // 毎回リフロー発生
});

// OK: バッチ処理
let html = '';
data.forEach(item => {
  html += `<tr>...`;
});
outputArea.innerHTML = html;  // リフローは1回のみ
```

---

## エラーハンドリング

### 段階的なエラー処理

```javascript
// Level 1: 入力検証
if (!rawText) {
  alert("テキストを入力してください。");
  return;
}

// Level 2: サイズ検証
if (rawText.length > 500000) {
  alert("入力データが大きすぎます。");
  return;
}

// Level 3: パース中のエラー
if (parsed.length >= MAX_ENTRIES) {
  console.warn(`Entry limit reached`);  // 警告のみ、処理は継続
}

// Level 4: エクスポート時のエラー
if (content.length > 10 * 1024 * 1024) {
  alert("ファイルが大きすぎます。");
  return;
}
```

---

## 技術的な選択と理由

### なぜVanilla JavaScriptなのか？

1. **依存関係ゼロ** - セキュリティリスクの最小化
2. **高速起動** - ライブラリのロード時間なし
3. **教育的価値** - 基礎技術の理解促進
4. **保守性** - 将来的な互換性問題なし

### なぜ正規表現を最小限にするのか？

1. **ReDoS回避** - 正規表現DoS攻撃のリスク軽減
2. **可読性** - シンプルな文字列操作の方が理解しやすい
3. **パフォーマンス** - 単純な文字列操作の方が高速な場合が多い

### なぜサーバーサイド処理を使わないのか？

1. **プライバシー** - データが外部に送信されない
2. **可用性** - サーバーダウンの影響を受けない
3. **コスト** - サーバー運用コストゼロ
4. **レスポンス** - ネットワーク遅延なし

---

## 改善の余地

### アルゴリズムの改善案

```javascript
// 将来的な実装案：パーサーファクトリーパターン
class ParserFactory {
  static create(format) {
    switch(format) {
      case 'dpkg': return new DpkgParser();
      case 'winget': return new WingetParser();
      case 'brew': return new BrewParser();
      default: return new GenericParser();
    }
  }
}

// 形式の自動検出
function detectFormat(text) {
  if (text.includes('Desired=')) return 'dpkg';
  if (text.includes('winget')) return 'winget';
  if (text.includes('brew')) return 'brew';
  return 'generic';
}
```

### パフォーマンスの改善案

```javascript
// Web Worker活用案
const worker = new Worker('parser-worker.js');
worker.postMessage({ command: 'parse', data: rawText });
worker.onmessage = (e) => {
  renderTable(e.data);
};
```

---

## まとめ

Asset Inventory Helperは、シンプルながら実用的なツールとして、以下の技術的特徴を持ちます：

1. **汎用的なパースアルゴリズム** - 複数のフォーマットに対応
2. **防御的プログラミング** - エラーに強い実装
3. **パフォーマンス重視** - 効率的なDOM操作とメモリ管理
4. **セキュリティファースト** - XSS対策とCSP実装
5. **教育的価値** - 読みやすく理解しやすいコード

これらの技術的選択により、安全で高速、かつ保守しやすいツールを実現しています。

---

*最終更新: 2024年9月7日*