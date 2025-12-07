# tabmark-core

Read this in other languages: English | [日本語](./README.ja.md)

Core Markdown parser for Tabmark with hierarchical structure support and safe HTML/Markdown escaping.

## Features

- 📝 Parse hierarchical Markdown (`# → ## → ###`)
- 🔄 Convert between Markdown and grid data
- 🛡️ HTML escaping (prevent XSS)
- 🔒 Markdown syntax escaping (prevent structure breaking)
- 📦 Preserve code fences (no escaping inside ` ``` `)
- 🎯 YAML frontmatter support

## Installation

```bash
npm install tabmark-core
```

## Usage

### Basic Example

```typescript
import { MarkdownParser } from 'tabmark-core';

const parser = new MarkdownParser();

// Parse Markdown
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

// Convert back to Markdown
const newMarkdown = parser.fromGridData('products', gridData);
```

### Default Behavior (Recommended)

```typescript
const parser = new MarkdownParser();
// Default: escapeHtml=true, escapeMarkdown=false

const gridData = {
  headers: ['description'],
  rows: [['**Important**: [Details](https://example.com)'], ['<script>alert("xss")</script>']],
};

const markdown = parser.fromGridData('products', gridData);
// HTML escaped: <script> → &lt;script&gt; ✅
// Markdown preserved: **Important** → **Important** ✅
```

### Strict Escaping (High Security)

```typescript
const parser = new MarkdownParser({
  escapeHtml: true,
  escapeMarkdown: true, // Enable Markdown escaping
});

const gridData = {
  headers: ['description'],
  rows: [['**bold** and # heading']],
};

const markdown = parser.fromGridData('products', gridData);
// Markdown escaped: **bold** → \*\*bold\*\*
// Heading escaped: # → \#
```

## API

### `MarkdownParser`

#### Constructor

```typescript
new MarkdownParser(options?: ParserOptions)
```

**Options:**

- `escapeHtml` (boolean, default: `true`) - Escape HTML special characters (XSS prevention)
- `escapeMarkdown` (boolean, default: `false`) - Escape Markdown syntax (preserve formatting)

#### Methods

##### `parseHierarchical(content: string): ParsedMarkdown`

Parse hierarchical Markdown structure.

##### `toGridData(parsed: ParsedMarkdown): GridData`

Convert parsed Markdown to grid format.

##### `fromGridData(sheetName: string, gridData: GridData, frontmatter?: Frontmatter): string`

Convert grid data to Markdown.

### Escaping Functions

````typescript
import { escapeHtml, escapeMarkdownSyntax } from 'tabmark-core';

escapeHtml('<script>alert("xss")</script>');
// → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

escapeMarkdownSyntax('# Heading');
// → '\# Heading'

// Code fences are preserved
escapeMarkdownSyntax('```\n# Not escaped\n```');
// → '```\n# Not escaped\n```'
````

## Types

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

## Multi-line Cells

Newlines in cell values are converted to `<br>` tags:

```typescript
const gridData = {
  headers: ['description'],
  rows: [['Line 1\nLine 2\nLine 3']],
};

const markdown = parser.fromGridData('sheet', gridData);
// ### description
// Line 1<br>Line 2<br>Line 3
```

## License

MIT
