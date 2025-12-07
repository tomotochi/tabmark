# tabmark-core

他の言語で読む: [English](./README.md) | 日本語

Tabmark 用のコア Markdown パーサーです。階層構造のサポートと安全な HTML/Markdown エスケープ機能を提供します。

## 機能

- 📝 階層的 Markdown のパース (`# → ## → ###`)
- 🔄 Markdown とグリッドデータの相互変換
- 🛡️ HTML エスケープ (XSS 防止)
- 🔒 Markdown 構文のエスケープ (構造破壊の防止)
- 📦 コードフェンスの保持 (` ``` ` 内はエスケープしない)
- 🎯 YAML フロントマターのサポート

## インストール

```bash
npm install tabmark-core
```

## 使い方

### 基本的な例

```typescript
import { MarkdownParser } from 'tabmark-core';

const parser = new MarkdownParser();

// Markdown をパース
const markdown = `
# products
## 0
### name
Product A
### price
$99.99
`;

const parsed = parser.parseHierarchical(markdown);
const gridData = parser.toGridData(parsed);

console.log(gridData);
// {
//   headers: ['name', 'price'],
//   rows: [['Product A', '$99.99']]
// }

// Markdown に戻す
const newMarkdown = parser.fromGridData('products', gridData);
```

### デフォルトの挙動 (推奨)

```typescript
const parser = new MarkdownParser();
// デフォルト: escapeHtml=true, escapeMarkdown=false

const gridData = {
  headers: ['description'],
  rows: [['**重要**: [詳細](https://example.com)'], ['<script>alert("xss")</script>']],
};

const markdown = parser.fromGridData('products', gridData);
// HTML はエスケープされる: <script> → &lt;script&gt; ✅
// Markdown は保持される: **重要** → **重要** ✅
```

### 厳格なエスケープ (高セキュリティ)

```typescript
const parser = new MarkdownParser({
  escapeHtml: true,
  escapeMarkdown: true, // Markdown エスケープを有効化
});

const gridData = {
  headers: ['description'],
  rows: [['**bold** and # heading']],
};

const markdown = parser.fromGridData('products', gridData);
// Markdown がエスケープされる: **bold** → \*\*bold\*\*
// 見出しがエスケープされる: # → \#
```

## API

### `MarkdownParser`

#### コンストラクタ

```typescript
new MarkdownParser(options?: ParserOptions)
```

**オプション:**

- `escapeHtml` (boolean, デフォルト: `true`) - HTML 特殊文字をエスケープ (XSS 防止)
- `escapeMarkdown` (boolean, デフォルト: `false`) - Markdown 構文をエスケープ (フォーマット保持のため)

#### メソッド

##### `parseHierarchical(content: string): ParsedMarkdown`

階層的 Markdown 構造をパースします。

##### `toGridData(parsed: ParsedMarkdown): GridData`

パースされた Markdown をグリッド形式に変換します。

##### `fromGridData(sheetName: string, gridData: GridData, frontmatter?: Frontmatter): string`

グリッドデータを Markdown に変換します。

### エスケープ関数

````typescript
import { escapeHtml, escapeMarkdownSyntax } from 'tabmark-core';

escapeHtml('<script>alert("xss")</script>');
// → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

escapeMarkdownSyntax('# Heading');
// → '\# Heading'

// コードフェンスは保持されます
escapeMarkdownSyntax('```\n# Not escaped\n```');
// → '```\n# Not escaped\n```'
````

## 型定義

```typescript
interface GridData {
  headers: string[];
  rows: string[][];
}

interface ParsedMarkdown {
  frontmatter: Frontmatter | null;
  sheets: {
    [sheetName: string]: {
      type: 'hierarchical';
      rows: {
        [rowIndex: string]: {
          [columnName: string]: string;
        };
      };
    };
  };
}

interface ParserOptions {
  escapeHtml?: boolean;
  escapeMarkdown?: boolean;
}
```

## 複数行セル

セル内の改行は `<br>` タグに変換されます:

```typescript
const gridData = {
  headers: ['description'],
  rows: [['Line 1\nLine 2\nLine 3']],
};

const markdown = parser.fromGridData('sheet', gridData);
// ### description
// Line 1<br>Line 2<br>Line 3
```

## ライセンス

MIT
