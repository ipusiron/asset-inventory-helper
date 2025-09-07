# セキュリティ改善履歴

## 2024年9月7日 - GitHub Pages公開前のセキュリティ強化

### 背景

GitHub Pagesでの公開に先立ち、セキュリティ監査を実施し、以下の改善を行いました。
静的サイトとはいえ、ユーザーが入力するデータを扱うツールであるため、適切なセキュリティ対策が必要でした。

### 実施したセキュリティ対策

#### 1. Content Security Policy (CSP) の実装

**追加内容:**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data:; 
  font-src 'self'; 
  connect-src 'none'; 
  frame-src 'none'; 
  object-src 'none'; 
  base-uri 'self'; 
  form-action 'none';
">
```

**効果:**
- XSS（クロスサイトスクリプティング）攻撃の防止
- 外部リソースの不正読み込み防止
- インラインスクリプトの実行禁止（'unsafe-inline'はスタイルのみ許可）

#### 2. セキュリティヘッダーの追加

**追加したヘッダー:**
- `X-Content-Type-Options: nosniff` - MIMEタイプのスニッフィング防止
- `X-Frame-Options: DENY` - クリックジャッキング攻撃防止
- `Referrer-Policy: no-referrer` - リファラー情報の漏洩防止

#### 3. 入力データのサイズ制限

**実装内容:**
```javascript
// HTMLレベルでの制限
<textarea maxlength="500000">

// JavaScriptレベルでの検証
if (rawText.length > 500000) {
  alert("入力データが大きすぎます。500,000文字以内にしてください。");
  return;
}
```

**効果:**
- DoS（サービス拒否）攻撃の防止
- ブラウザのメモリ枯渇防止
- 処理パフォーマンスの保証

#### 4. 処理エントリ数の制限

**実装内容:**
```javascript
const MAX_ENTRIES = 5000; // 最大エントリ数制限

filtered.forEach((line, index) => {
  if (parsed.length >= MAX_ENTRIES) {
    console.warn(`Entry limit reached (${MAX_ENTRIES}). Skipping remaining entries.`);
    return;
  }
  // 処理続行
});
```

**効果:**
- 大量データによるブラウザフリーズ防止
- メモリ使用量の制限
- 予測可能なパフォーマンス

#### 5. エクスポートファイルサイズ制限

**実装内容:**
```javascript
function downloadFile(filename, content, mime) {
  // ファイルサイズチェック（10MB制限）
  if (content.length > 10 * 1024 * 1024) {
    alert("エクスポートファイルが大きすぎます（10MB制限）。");
    return;
  }
  // ダウンロード処理
}
```

**効果:**
- 巨大ファイル生成によるメモリ枯渇防止
- ダウンロード処理の安定化

#### 6. 外部リンクのセキュリティ強化

**実装内容:**
```html
<a href="https://github.com/..." target="_blank" rel="noopener noreferrer">
```

**効果:**
- `noopener` - 新しいウィンドウから元のページへのアクセス防止
- `noreferrer` - リファラー情報の送信防止
- タブナビング攻撃の防止

#### 7. XSS対策の強化

**既存の対策（維持）:**
```javascript
function escapeHtml(str) {
  if (str == null) return "";  // null/undefinedチェック追加
  
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
```

**効果:**
- HTMLインジェクション完全防止
- null/undefined入力への対応
- すべての特殊文字を適切にエスケープ

#### 8. ユーザビリティとセキュリティの両立

**実装内容:**
```css
/* コマンドを選択しやすくする */
code.user-select-all {
  user-select: all;
  cursor: pointer;
}

/* テキストエリアのリサイズ制限 */
textarea {
  resize: vertical;
  max-height: 600px;
}
```

**効果:**
- コマンドのコピーを容易にし、手入力ミスを防ぐ
- UIの破壊を防ぎつつ、適切な操作性を維持

### セキュリティ設計の原則

本ツールは以下の原則に基づいて設計されています：

1. **最小権限の原則** - 必要最小限の機能のみを実装
2. **ゼロトラスト** - すべての入力を信頼せず検証
3. **深層防護** - 複数層のセキュリティ対策を実装
4. **フェイルセーフ** - エラー時は安全側に倒れる設計

### 残存リスクと対策

#### 認識している制限事項

1. **クライアントサイドの制限**
   - すべての処理がブラウザで実行されるため、悪意のあるユーザーが制限を回避する可能性
   - 対策：重要なデータを扱わない、教育目的での使用を推奨

2. **CSPの'unsafe-inline'**
   - スタイルに'unsafe-inline'を許可（インラインスタイルのため）
   - 対策：将来的に外部CSSファイルへの完全移行を検討

3. **正規表現のパフォーマンス**
   - 複雑な入力でReDoS（正規表現DoS）の可能性
   - 対策：入力サイズ制限で影響を最小化

### プライバシーへの配慮

- **データ収集なし** - Google Analyticsなどの追跡ツール未使用
- **外部通信なし** - すべての処理をローカルで実行
- **データ保存なし** - ブラウザをリロードするとすべて消去
- **Cookie未使用** - トラッキングクッキーなし

### セキュリティ報告

セキュリティ上の問題を発見した場合は、以下の方法で報告してください：

1. GitHubのIssueで報告（機密性が低い場合）
2. 詳細な脆弱性報告は、READMEに記載の連絡先へ

### 今後の改善予定

- [ ] CSPの'unsafe-inline'を除去（すべてのスタイルを外部化）
- [ ] Web Workerを使用した処理の分離
- [ ] SubResource Integrity (SRI) の実装（CDN使用時）
- [ ] より高度な入力検証ロジック
- [ ] セキュリティテストの自動化

### 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [GitHub Pages セキュリティベストプラクティス](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#limits-on-use-of-github-pages)

---

*最終更新: 2024年9月7日*