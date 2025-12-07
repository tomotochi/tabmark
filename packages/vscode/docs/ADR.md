# Architecture Decision Records (ADR)

## ADR-001: Svelte 5 + Vite for Webview

**Date**: 2025-11-22

**Status**: Accepted

**Context**:
VS Code拡張機能のWebview UIフレームワークとビルドツールの選択。

**Decision**:
Svelte 5とViteを採用。

**Rationale**:

- Svelte 5の新しいrunes API（`$state`, `$props`）を検証
- Viteの高速ビルドとHMR
- モダンなESMベースの開発環境

**Consequences**:

- ✅ 高速な開発体験
- ✅ 最新のSvelte機能を利用可能
- ⚠️ Svelte 4との互換性なし
- ⚠️ 初期セットアップで依存関係の調整が必要

---

## ADR-002: Pure JavaScript for Svelte Components

**Date**: 2025-11-22

**Status**: Accepted

**Context**:
Svelteコンポーネント内でTypeScriptを使用するかどうか。

**Decision**:
Svelteコンポーネント（`.svelte`ファイル）ではTypeScriptを使用せず、純粋なJavaScriptを使用。

**Rationale**:

- Svelte 5 + Viteのビルドエラーを回避
- `lang="ts"`を使用するとコンパイルエラーが発生
- 拡張機能本体（`src/`）ではTypeScriptを継続使用

**Consequences**:

- ✅ ビルドエラーの回避
- ✅ シンプルな設定
- ❌ Svelteコンポーネント内で型チェックなし

---

## ADR-003: ESM Module System

**Date**: 2025-11-22

**Status**: Accepted

**Context**:
プロジェクトのモジュールシステムの選択。

**Decision**:
`package.json`に`"type": "module"`を設定し、ESMを採用。

**Rationale**:

- Vite 5がESMを前提としている
- Svelte 5の推奨設定
- モダンなJavaScript標準に準拠

**Consequences**:

- ✅ Viteとの互換性
- ✅ 将来性のある選択
- ⚠️ CommonJSとの混在に注意が必要

---

## ADR-004: Svelte mount() API

**Date**: 2025-11-22

**Status**: Accepted

**Context**:
Svelte 5アプリケーションの初期化方法。

**Decision**:
`new App()`ではなく`mount(App, {...})`を使用。

**Rationale**:

- Svelte 5の推奨API
- `effect_orphan`エラーを回避
- runesの正しいコンテキスト初期化

**Consequences**:

- ✅ Svelte 5のベストプラクティスに準拠
- ✅ エラーの解消
- ⚠️ Svelte 4との互換性なし

---

## ADR-005: Dynamic HTML Generation for Webview

**Date**: 2025-11-22

**Status**: Accepted

**Context**:
Webview用HTMLの生成方法。

**Decision**:
HTMLファイルを読み込むのではなく、TypeScriptで動的に生成。

**Rationale**:

- Viteのライブラリモードでは`index.html`が出力されない
- CSPやnonceの動的挿入が必要
- ファイルI/Oを削減

**Consequences**:

- ✅ ビルド設定がシンプル
- ✅ セキュリティ設定の柔軟性
- ❌ HTMLがコード内に埋め込まれる

---

## ADR-006: Table Element for Data Grid

**Date**: 2025-11-23

**Status**: Accepted

**Context**:
データグリッドのDOM構造の選択。

**Decision**:
`<table>`要素を使用（`<div>` + CSS Gridではなく）。

**Rationale**:

- セマンティックHTML
- アクセシビリティの標準サポート
- 数百行程度のデータでは十分なパフォーマンス
- 実装がシンプル

**Consequences**:

- ✅ 保守性が高い
- ✅ アクセシビリティ確保
- ⚠️ 1000行以上では仮想スクロールが必要になる可能性

---

## ADR-007: Manual Frontmatter Parsing

**Date**: 2025-11-23

**Status**: Accepted

**Context**:
Markdown frontmatterのパース方法。

**Decision**:
`markdown-it-front-matter`プラグインを使用せず、手動でパース。

**Rationale**:

- シンプルなfrontmatter形式（`---`で囲まれたYAML）
- 依存関係の削減
- 既存実装が十分機能している

**Consequences**:

- ✅ 依存関係が少ない
- ✅ コードが理解しやすい
- ⚠️ 複雑なfrontmatterには対応困難

---

## ADR-008: Vite 5 (not 6)

**Date**: 2025-11-22

**Status**: Accepted

**Context**:
Viteのバージョン選択。

**Decision**:
Vite 6ではなくVite 5を使用。

**Rationale**:

- `@sveltejs/vite-plugin-svelte@^4.0.0`がVite 5を要求
- Vite 6との互換性がない

**Consequences**:

- ✅ Svelteプラグインとの互換性
- ⚠️ Vite 6の新機能は使用不可
- ⚠️ 将来的にアップグレードが必要

---

## ADR-009: Overlay for Edit Mode Exit

**Date**: 2025-11-30

**Status**: Accepted

**Context**:
セル編集モードにおいて、テキスト選択ドラッグでセル外に出た際、`blur`イベントやドキュメント全体のクリックイベントが発火し、意図せず編集モードが終了してしまう問題があった。

**Decision**:
編集モード中は画面全体を透明なオーバーレイ（`z-index: 100`）で覆い、編集中のセル（`z-index: 101`）のみを前面に表示する。
編集終了のトリガーは、オーバーレイに対する`onmousedown`イベントのみとする。

**Rationale**:

- **ドラッグ操作の保護**: セル内でマウスダウンし、セル外（オーバーレイ上）でマウスアップしても、オーバーレイの`onmousedown`は発火しないため、編集モードが維持される。
- **確実な終了操作**: セル外をクリック（マウスダウン）すると即座に検知できる。
- **複雑性の排除**: ブラウザやOSに依存する`blur`イベントや`relatedTarget`の複雑な制御が不要になる。

**Consequences**:

- ✅ ドラッグ選択時の挙動が安定
- ✅ コードがシンプルで堅牢になる
- ⚠️ `z-index`の管理が必要

---

## ADR-010: Trailing Newline Removal in Cells

**Date**: 2025-12-03

**Status**: Accepted

**Context**:
セル内のテキストをMarkdownに変換する際、末尾に複数の改行が含まれる場合がある。これらをそのまま保存すると、Markdownファイル内に不要な空行が増え、可読性が低下する。

**Decision**:
セル内容のMarkdown変換時に、末尾の改行（`\n+$`）をすべて削除する。
「入力された通りの整形（改行数）」よりも「Markdownとしての構造的な美しさ」を優先する。

**Rationale**:

- **可読性**: 不要な空行を排除し、Markdownファイルをコンパクトに保つ。
- **構造重視**: Markdownは構造化テキストであり、末尾の空白は意味を持たないことが多い。
- **一貫性**: ユーザーが誤って入力した余分な改行を自動的にクリーンアップする。

**Consequences**:

- ✅ 生成されるMarkdownがきれいになる
- ⚠️ 意図的に末尾に改行を入れたい場合（稀）でも削除される

---

## ADR-011: Duplicate Column Name Support

**Date**: 2025-12-03

**Status**: Accepted

**Context**:
Markdownの表形式データにおいて、異なる列で同じヘッダー名（例: 複数の `name` 列など）を使用したい場合がある。従来のパーサー実装では、列名をキーとしていたため、重複する列が上書きされて消失していた。

**Decision**:
内部データ構造を「列名キーのオブジェクト」から「配列（インデックスベース）」に変更し、重複する列名を完全に許容する。
また、行ごとのヘッダー名の不一致（例: 1行目が `name` で、ある行だけ `name1`）も許容し、出現順序に基づいて値をマッピングする。

**Rationale**:

- **柔軟性**: ユーザーが自由に列名を付けられるようにする。
- **ロバスト性**: 手書きMarkdownの表記ゆれや、意図的な重複（例: 複数の同名フィールド）に対応する。
- **データ保全**: パース時に勝手に列を削除したりリネームしたりせず、入力されたデータを最大限保持する。

**Consequences**:

- ✅ 重複列名が使用可能になる
- ✅ 表記ゆれに対して強くなる
- ⚠️ 行ごとのヘッダー名が異なっていても警告が出ない（仕様）

---

## Summary

このプロジェクトは、Svelte 5とViteを使用したモダンなVS Code拡張機能として設計されています。主な技術的決定は、最新のWeb標準（ESM）とSvelte 5の新機能（runes）を活用しつつ、実装のシンプルさと保守性を優先しています。また、Markdownのパースにおいては、厳密なバリデーションよりもユーザーの入力意図とデータの保全、そしてMarkdownとしての可読性を重視する方針をとっています。
