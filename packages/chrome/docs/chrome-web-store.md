# Chrome Web Store 公開手順（人手作業）

このドキュメントは **人間が実施すべき操作** をまとめたチェックリストです。  
実作業はこの手順に沿って進めてください。

---

## 1. Developerアカウント準備

- Chrome Web Store Developer Console にログイン
- 初回のみ登録手続き（支払い/本人確認など）を完了

## 2. 必須アセット準備

### アイコン
- 128x128 (必須)
- 16x16 / 48x48 (推奨)
- 配置例: `packages/chrome/icons/`

### スクリーンショット
- GitHubの `*.table.md` ファイル表示画面で **Gridボタンが出ている状態**
- Grid表示のスクリーンショットを追加

### プライバシーポリシー
- 収集しないことを明記
- 例: 「ユーザーデータは収集せず、GitHub上の表示をクライアント側で変換するのみ」

---

## 3. ビルド

```bash
cd packages/chrome
npm run build
```

---

## 4. ローカルでの動作確認

- Chromeの拡張機能を開く `chrome://extensions`
- デベロッパー モードをONにする
- 「パッケージ化されていない拡張機能を読み込む」を押す
- `packages/chrome` ディレクトリを指定する

---

## 5. ZIP作成

ZIPに含めるもの:
- `manifest.json`
- `dist/content.js`
- `icons/*`（必須アセットがある場合）

ZIP作成例:
```bash
cd packages/chrome
zip -r tabmark-chrome.zip manifest.json dist assets
```

---

## 6. Chrome Web Storeへのアップロード

- Developer Consoleで新規アイテムを作成
- `tabmark-chrome.zip` をアップロード
- `manifest.json` の内容が反映されていることを確認

---

## 7. ストア情報入力

- 拡張機能の概要・詳細説明
- 対象URL（`https://github.com/*`）
- スクリーンショット
- カテゴリ / 言語
- プライバシーポリシーURL

---

## 8. 公開前チェック

- `host_permissions` の説明
  - GitHub / raw取得が必要な理由を明記
- データ利用に関する説明
  - ユーザーデータは収集しない
- 実機動作確認
  - GitHub上の `*.table.md` を開いて **Gridが表示できること**

---

## 9. 提出・審査

- 提出して審査待ち
- 指摘が来た場合:
  - 修正 → 再ビルド → 再アップロード

---

## 付記: manifestの更新が必要な場合

- `manifest.json` の `version` を更新
- `icons` のパスを `manifest.json` に追加

