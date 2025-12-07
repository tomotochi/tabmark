# Tabmark

Read this in other languages: English | [日本語](./README.ja.md)

Tabmark is a suite of tools for handling hierarchical Markdown tables. It allows you to convert between CSV and Markdown, and edit Markdown tables as spreadsheets in VS Code.

## Packages

This monorepo contains the following packages:

- **[tabmark-core](./packages/core)**: The core logic for parsing and stringifying hierarchical Markdown tables.
- **[tabmark-cli](./packages/cli)**: A command-line interface for converting files.
- **[tabmark-vscode](./packages/vscode)**: A VS Code extension for editing `*.table.md` files.

## Development

### Prerequisites

- Node.js
- npm

### Setup

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

## License

MIT
