# Tabmark CLI

他の言語で読む: [English](./README.md) | 日本語

Tabmark CLI は、CSV ファイルと階層的 Markdown 構造を相互変換するためのコマンドラインツールです。

## 機能

- **CSV から Markdown への変換**: フラットな CSV データを構造化された Markdown に変換します。
- **Markdown から CSV への変換**: 階層的 Markdown ファイルからデータを抽出して CSV 形式にします。
- **堅牢なパース**: 複数行テキストや Markdown 構文を含む複雑なセル内容を処理します。

## インストール

```bash
npm install -g tabmark-cli
```

## 使い方

```bash
# CSV から Markdown への変換
tabmark input.csv -o output.md

# Markdown から CSV への変換
tabmark input.md -o output.csv
```

## 開発

このプロジェクトは Node.js ベースの Tabmark CLI 実装です。

ローカルでビルドするには:

```bash
npm install
npm run build
```
