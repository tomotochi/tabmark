# Development Guide

## Prerequisites

- Node.js 18+
- npm 9+
- VS Code

## Setup

```bash
# Install dependencies
npm install

# Build the extension
npm run build
```

## Development Workflow

### Running the Extension

1. Open this directory in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open a `*.table.md` file to test the DataGrid editor

### Watch Mode

```bash
# Watch extension code
npm run watch

# Watch webview code (in a separate terminal)
npm run watch:webview
```

## Building

### Development Build

```bash
# Build extension with esbuild (development mode)
npm run compile

# Build webview
npm run build:webview

# Or build both
npm run build
```

### Production Build

```bash
# Build for production (minified)
npm run package
```

This creates:
- `out/extension.js` - Bundled extension code (~248 KB) with all dependencies
- `out/webview/assets/` - Built webview files

## Packaging

### Create VSIX Package

**Important:** Always use `--no-dependencies` flag or the npm script:

```bash
# Recommended: Use npm script
npm run vsce:package

# Or directly with vsce
vsce package --no-dependencies
```

**Why `--no-dependencies`?**
- The extension is bundled with esbuild, so all dependencies are included in `out/extension.js`
- Without this flag, `vsce` detects workspace-linked packages and causes duplicate file errors
- The bundled VSIX is ~127 KB with 12 files

### Install Locally

```bash
code --install-extension tabmark-vscode-0.1.0.vsix
```

## Project Structure

```
packages/vscode/
├── src/              # Extension source code
│   ├── extension.ts  # Main extension entry point
│   └── commands/     # Command implementations
├── webview/          # Svelte webview application
│   ├── src/          # Svelte components
│   └── index.html    # Webview HTML template
├── out/              # Compiled output
│   ├── extension.js  # Bundled extension (esbuild)
│   └── webview/      # Built webview (Vite)
├── esbuild.cjs       # esbuild bundler configuration
└── package.json      # Extension manifest
```

## Testing

```bash
npm test
```

## Documentation Updates

Before releasing a new version:

1. **Update CHANGELOG.md** - Document all changes, bug fixes, and new features
2. **Update README.md** - Reflect any new features or usage changes
3. **Update README.ja.md** - Keep Japanese documentation in sync with English version

## Tech Stack

- **Extension**: TypeScript, esbuild (bundler), VS Code Extension API
- **Webview**: Svelte 5, Vite
- **Parser**: tabmark-core (bundled dependency)
