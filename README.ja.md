# Tabmark

他の言語で読む: [English](./README.md) | 日本語

Tabmark は、階層的な Markdown テーブルを扱うためのツールスイートです。CSV と Markdown の相互変換や、VS Code 上で Markdown テーブルをスプレッドシートとして編集することを可能にします。

## パッケージ

このモノレポには以下のパッケージが含まれています:

- **[tabmark-core](./packages/core)**: 階層的 Markdown テーブルのパースと文字列化を行うコアロジック。
- **[tabmark-cli](./packages/cli)**: ファイル変換のためのコマンドラインインターフェース。
- **[tabmark-vscode](./packages/vscode)**: `*.table.md` ファイルを編集するための VS Code 拡張機能。

## 開発

### 前提条件

- Node.js
- npm

### セットアップ

```bash
npm install
npm run build
```

### テスト

```bash
npm test
```

## ライセンス

MIT
