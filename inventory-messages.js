(function(root) {
  "use strict";
  const messages = Object.freeze({
    initial: "入力して「整形して表示」を押してください。",
    changed: "入力または形式が変わりました。もう一度整形してください。",
    cleared: "入力と結果を消しました。保存済みのファイルは消えません。",
    emptyInput: "テキストを入力してください。",
    inputLimit: "入力は500,000 UTF-16コード単位までです。入力を分割してください。結果は保存できません。",
    lineLimit: "入力は10,000行までです。入力を分割してください。結果は保存できません。",
    entryLimit: "結果が5,000件を超えています。入力を分割してください。一部だけの保存は行いません。",
    invalidInput: "入力が文字列ではありません。",
    invalidFormat: "入力形式を選び直してください。",
    exportLimit: "保存サイズが10 MiBを超えています。入力を分割してください。",
    exportFailed: "ファイルを保存できませんでした。ブラウザーのダウンロード設定を確認してください。",
    noEntries: "採用したデータはありません。保留理由と入力形式を確認してください。",
    summary: "形式: {format} ／ 入力{total}行（空行を除く）、採用{accepted}行→{entries}件、保留{held}行、除外{excluded}行、見出し等{ignored}行。",
    format_columns: "名前とバージョンの2列",
    format_winget: "winget",
    format_dpkg: "dpkg",
    format_brew: "Homebrew",
    format_mixed: "複数形式が混在（保留）",
    ambiguous: "列を確定できません。形式を選ぶか、名前とバージョンをTAB1個で区切ってください。",
    controlCharacter: "制御文字を含むため保留しました。原文では文字コード表記に置き換えて表示します。",
    truncated: "省略記号を含みます。省略されていない一覧を取得してください。",
    mixedFormats: "複数の形式が混在しています。形式ごとに分けて入力してください。",
    wingetHeader: "Name/Id/Version（名前/ID/バージョン）の見出しも貼り付けてください。",
    notInstalled: "現在状態がinstalledでない、またはエラー状態のため除外しました。",
    issues: "保留と除外の詳細（{count}行、保存対象外）",
    held: "保留",
    excluded: "除外",
    name: "ソフト名",
    version: "バージョン",
    sourceLine: "元の行",
    unknown: "（空欄）",
    caption: "採用したソフトウェア一覧（重複を含む）",
    inputCount: "入力: {count} / 500,000 UTF-16コード単位（絵文字などは2単位になる場合があります）"
  });
  if (typeof module === "object" && module.exports) module.exports = messages;
  else root.InventoryMessages = messages;
})(typeof globalThis === "object" ? globalThis : this);
