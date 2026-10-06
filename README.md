<!--
---
id: day059
slug: asset-inventory-helper

title: "Asset Inventory Helper"

subtitle_ja: "ソフトウェア資産の棚卸し支援ツール"
subtitle_en: "Software Asset Inventory Support Tool"

description_ja: "ソフトウェア一覧をブラウザー内で整形し、判別できない行を確認してCSV/JSONで保存する棚卸し支援ツール。自動収集や適合性の判定は行いません。"
description_en: "A browser-based helper that organizes software lists, flags ambiguous lines, and exports CSV/JSON. It does not collect assets automatically or assess compliance."

category_ja:
  - セキュリティ管理
  - 資産管理
category_en:
  - Security Management
  - Asset Management

difficulty: 2

tags:
  - asset
  - inventory
  - software
  - cis-controls
  - security

repo_url: "https://github.com/ipusiron/asset-inventory-helper"
demo_url: "https://ipusiron.github.io/asset-inventory-helper/"

hub: true
---
-->

[English](README.en.md) · 日本語

# Asset Inventory Helper - ソフトウェア資産の棚卸し支援

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/asset-inventory-helper?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/asset-inventory-helper?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/asset-inventory-helper)
![GitHub license](https://img.shields.io/github/license/ipusiron/asset-inventory-helper)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/asset-inventory-helper/)

**Day059 - 生成AIで作るセキュリティツール100**

Asset Inventory Helperは、取得済みのソフトウェア一覧を整形するWebツールです。
名前とバージョンを確認し、判別できない行を保留して、採用したデータをCSV/JSONで保存できます。
端末やネットワークを自動調査する機能はありません。

画面とスクリーンショットは現在日本語です。英語の説明はREADME.en.mdに用意しています。

---

## 🌐 デモページ

👉 **[https://ipusiron.github.io/asset-inventory-helper/](https://ipusiron.github.io/asset-inventory-helper/)**

ブラウザーで直接お試しいただけます。

---

## 📸 スクリーンショット

>![ソフトウェア名とバージョンの一覧表示](assets/screenshot.png)
>
>*ソフトウェア名とバージョンの一覧表示*

---

## 🎯 背景と目的

各PCやサーバーのソフトウェアを確認するには、収集した一覧を読みやすく整理する作業が必要です。
本ツールはその整形を支援しますが、収集元の網羅性や、入力された名前と版の正しさを保証するものではありません。

## ✨ 主な機能

- 入力形式の自動判定と手動選択
- 名前と版の2列、winget、dpkg、Homebrewの解析
- 保留と除外の理由、原文、元の行番号の表示
- 件数の表示と上限超過時の全体停止
- 数式対策つきCSVと元の値を保持するJSONの保存
- 入力や形式の変更時に、古い結果と保存操作を無効化

### 📝 開発状況について

対応形式は下の表に限定しています。
検索、差分比較、重複の自動削除、未承認ソフトの検出は実装していません。

- [技術仕様書](TECHNICAL.md)：解析と出力の規則
- [コマンドリファレンス](COMMANDS.md)：取得方法と対応範囲
- [安全対策と限界](SECURITY.md)：CSP、CSV、保存データの注意
- [開発日誌](DEVLOG.md)：開発時の記録

## 💡 活用例

- 小規模組織の棚卸し：担当者が各端末から取得した一覧を整形し、端末名や管理者などを別の台帳で補う。名称と版だけでは管理台帳は完成しない。
- 教育と研修：見本の正常行と曖昧行を比べ、テキストを表へ変換するときの誤認識を学ぶ。
- PCの移行準備：家庭のPCに入れたアプリを記録し、買い替え後の再導入を検討する。ライセンスや設定の移行機能は含まない。
- 制作環境の記録：動画編集や開発で使ったソフトの版を保存し、作業メモに添付する。環境全体の再現を保証するものではない。
- 調査資料の整理：研究用端末の一覧をJSONで保存し、別の集計スクリプトへ渡す。データの比較は外部で行う。

## 🔐 セキュリティとの関連性

ソフトウェアの一覧は、更新や利用許可を検討するための資料になります。
本ツールは脆弱性情報や承認リストと比較しないため、危険な版や未承認ソフトを自動判定しません。
端末、所有者、取得日時、ライセンスなどは別途記録してください。

## 🚀 使い方（クイックスタート）

### 基本的な使用手順

1. ソフトウェア一覧の取得
   各OSのコマンドを実行して、インストール済みソフトの一覧を取得します（詳細は次セクション参照）

2. ツールへの貼り付け
   [デモページ](https://ipusiron.github.io/asset-inventory-helper/)を開き、取得したテキストを入力欄に貼り付けます

3. 整形と確認
   入力形式を選び、「整形して表示」を押して、採用結果と保留・除外の理由を確認します

4. エクスポート
   採用したデータをCSVまたはJSONで保存します。保留・除外の行と元の行番号は出力されません

### サンプルデータで試す

ツール画面の「サンプル: Windows/Linux/macOS」ボタンで、説明用の見本を読み込んで動作を確認できます。Windowsは名前と版の2列です。
Windowsは6件、Linuxは5件、macOSは5件が採用されます。見本の版は最新版を示すものではありません。

---

## 🖥️ ソフトウェア一覧の取得方法

### 基本コマンド

| 選ぶ形式 | 取得例 | 読み取りの条件 |
|---|---|---|
| 自動判定／winget | `winget list` | 英語または日本語の名前・ID・バージョン見出しを含む表。列間はTABまたは2個以上の半角空白 |
| 自動判定／dpkg | `dpkg -l` | 現在状態がinstalledでエラーなしの行を採用。rcなどは除外 |
| Homebrew | `brew list --versions` | 名前1語と版。複数版は別レコード |
| 名前とバージョンの2列 | `rpm -qa --qf '%{NAME}\t%{VERSION}-%{RELEASE}\n'` | TAB1個で2列に区切る |

Homebrewは手動選択するか、入力の先頭に実行したコマンド行を含めてください。
2列形式は2個以上の半角空白にも対応します。
単一空白では「名前1語＋数字から始まる版」だけを採用します。
名前に空白がある場合はTAB区切りを使ってください。
版が不明な場合は名前の後ろにTAB1個を置き、2列目を空欄にできます。
区切りの前後の空白は除去します。

通常の`rpm -qa`、`system_profiler`、Snap、CSV/JSONの入力は対象外です。
表示が省略された行や曖昧な行は保留します。
wingetのIDはドットやバックスラッシュを含む形、または12文字以上の英大文字と数字の形を読み取ります。それ以外は保留します。
詳しくは[コマンドリファレンス](COMMANDS.md)を参照してください。

### 読み取り例

表の`\t`はTAB1個を表します。

| 入力 | 形式 | 採用した名前 | 採用した版 | 状態 |
|---|---|---|---|---|
| `Node.js 22.6.0` | auto | Node.js | 22.6.0 | 採用 |
| `namebench 1.3.1` | auto | namebench | 1.3.1 | 採用 |
| `VLC media player\t3.0.21` | columns | VLC media player | 3.0.21 | 採用 |
| `VLC media player` | auto | — | — | 保留 |
| `bash-5.2.26-1.fc40.x86_64` | auto | — | — | 保留 |

## 🗂️ より広い視点での資産管理

本ツールはソフトウェア資産に焦点を当てていますが、完全なセキュリティ対策には以下の資産も管理が必要です：

- ハードウェア資産: PC、サーバー、ネットワーク機器
- クラウド資産: IaaS、PaaS、SaaS
- ポータブルソフトウェア: インストーラーを使わないアプリケーション

これらの詳細な管理方法については **[コマンドリファレンス（COMMANDS.md）](COMMANDS.md)** をご参照ください。

---

## 🔒 データプライバシーとセキュリティ

### データ処理について

- 入力の解析と出力はブラウザー内で実行し、アプリから入力を外部送信しない。
- 入力や結果をlocalStorage、Cookie、URLへ保存しない。画面とメモリには残るため、利用後は「入力と結果を消す」を使う。
- 公開ページの読込や外部リンクへの移動には通信が発生する。解析ツールや広告スクリプトは読み込まない。
- ダウンロードしたファイルは端末に残る。クリア操作では削除されない。

### CSVの数式対策

CSVはUTF-8 BOMつき、改行はCRLF、列名は`name,version`です。
各セルを引用符で囲み、内部の引用符を二重化します。
`= + - @`や全角の同等文字など、数式として解釈され得る開始文字にはアポストロフィーを付けます。
この保護は値を変更し、表計算ソフトや再保存の方法によっては維持されません。
文字列として読み込み、原値の保存にはJSONを使ってください。
JSONは採用した`name`と`version`だけを保持します。

CSVに万能な保護方式はありません。[OWASP CSV Injection](https://community.owasp.org/attacks/CSV_Injection)も参照してください。
共有するファイルに機密情報が含まれていないか確認してください。

## 🛠️ トラブルシューティング

### よくある問題と解決方法

- 整形できない場合：形式を選び、保留理由を確認する。複数形式は分けて入力し、曖昧な行はTAB区切りの2列へ整える。
- 保存ボタンがない場合：入力変更後、上限超過時、採用0件では保存できない。入力を確認して再度整形する。
- 文字化けする場合：入力の文字コードを確認する。CSVはUTF-8として読み込む。
- 版がない場合：2列形式で名前の後ろにTAB1個を置き、版を空欄にする。名前だけの行は保留される。

## 🧭 セキュリティフレームワークとの関連性

### 🛡️ CIS Controls

[CIS Control 2](https://www.cisecurity.org/controls/inventory-and-control-of-software-assets)はソフトウェア資産の管理を扱います。
本ツールはそのうち一覧の整理に使えますが、許可判定、実行制御、組織内の網羅的な収集は行いません。
Control 1のハードウェア資産管理を実装するものでもありません。

### 📘 ISO/IEC 27001

保存した一覧は資産管理の資料として利用できます。
本ツールには所有者や管理責任の設定、管理策の実施状況の評価機能はありません。

### 🏛️ NIST Cybersecurity Framework

[NIST CSF 2.0のID.AM-02](https://www.nist.gov/document/csf-20-implementations-pdf)はソフトウェア、サービス、システムの台帳維持を扱います。
本ツールは貼り付けたソフトウェアの名前と版を整理する範囲に限られます。

### 適用範囲

出力を作成しただけで各フレームワークへの適合を示すことはできません。
収集範囲や管理手順は利用する側で確認してください。

## ⚠️ 注意事項と制限

### 利用上の注意

- 本ツールはソフトウェア一覧の整理を支援するものであり、端末の自動調査や網羅性の検証は行わない。
- 保留と除外の行は保存対象に入らないため、件数と理由を確認する。
- データに含まれる名前、版、状態は収集元が示した値であり、その真偽を証明しない。

### 技術的な制限

| 項目 | 上限 |
|---|---|
| 入力 | 500,000 UTF-16コード単位 |
| 物理行数（空行を含む） | 10,000行 |
| 採用結果 | 5,000件 |
| 保存ファイル | 10 MiB（10,485,760バイト） |

上限超過は全体エラーとし、結果の一部だけを保存することはありません。
大量の貼り付け自体を事前に止めるものではなく、端末の負荷を完全に防ぐ保証もありません。
絵文字などは1文字でも2コード単位になる場合があります。
同じ名前と版の行も重複したまま保持し、並べ替えません。

## 🧪 テスト

Node.js 22以上で`npm test`を実行します。
依存のインストールは不要です。
解析例、境界値、CSV、JSON、HTML、READMEの表を検証します。
GitHub Actionsの設定はpushとpull_requestで同じテストを実行します。

## 📁 ディレクトリー構造

```
asset-inventory-helper/
├── index.html            # メインHTMLファイル
├── script.js             # 入力、表示、保存の操作
├── inventory-core.js     # 解析とCSV/JSON生成
├── inventory-messages.js # 動的メッセージ
├── package.json          # 依存なしのテスト設定
├── test/                 # Node標準テスト
│   ├── core.test.js       # 解析と出力の検証
│   ├── readme.test.js     # 文書とHTMLの検証
│   └── readme-en.test.js  # 日英READMEの整合性
├── .github/              # GitHub設定
│   └── workflows/        # 自動テスト
│       └── test.yml       # Node.js 22のテスト
├── style.css             # スタイルシート
├── assets/               # 画像・静的ファイル
│   └── screenshot.png    # スクリーンショット
├── README.md             # プロジェクト説明書
├── README.en.md          # 英語の説明
├── CLAUDE.md             # Claude Code向けガイド
├── AGENTS.md             # 開発ガイドライン
├── COMMANDS.md           # コマンド実行例
├── DEVLOG.md             # 開発ログ
├── SECURITY.md           # セキュリティガイド
├── TECHNICAL.md          # 技術仕様書
├── LICENSE               # ライセンスファイル
├── .gitignore            # Git除外設定
└── .nojekyll             # GitHub Pages設定
```

---

## 💻 動作環境

JavaScriptが有効なモダンブラウザーで利用できます。
ローカルでは`index.html`を直接開くか、プロジェクトルートで`python -m http.server 8000`を実行して`http://localhost:8000/`へアクセスしてください。
ビルド処理はありません。

## 📄 ライセンス

MIT License – 詳細は [LICENSE](LICENSE) を参照してください。

---

## 🛠️ このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。 
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。  

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
