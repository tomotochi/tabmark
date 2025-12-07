# Tabmark CLI

Read this in other languages: English | [日本語](./README.ja.md)

Tabmark CLI is a command-line tool for converting between CSV files and hierarchical Markdown structures.

## Features

- **Convert CSV to Markdown**: Transform flat CSV data into structured Markdown.
- **Convert Markdown to CSV**: Extract data from hierarchical Markdown files into CSV format.
- **Robust Parsing**: Handles complex cell content including multi-line text and Markdown syntax.

## Installation

```bash
npm install -g tabmark-cli
```

## Usage

```bash
# Convert CSV to Markdown
tabmark input.csv -o output.md

# Convert Markdown to CSV
tabmark input.md -o output.csv
```

## Development

This project is a Node.js-based implementation of the Tabmark CLI.

To build locally:

```bash
npm install
npm run build
```
