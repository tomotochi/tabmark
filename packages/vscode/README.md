# Tabmark for VS Code

Read this in other languages: English | [日本語](./README.ja.md)

Tabmark is a VS Code extension that reinterprets **hierarchical Markdown structure** (headings like `#`, `##`, `###`) as a spreadsheet-like datagrid. This is **not** a traditional Markdown table (`|---|---|`) editor.

## What is Tabmark?

Tabmark uses Markdown's heading hierarchy to represent tabular data:
- `#` (H1) = Sheet name
- `##` (H2) = Row number
- `###` (H3) = Column name
- Content below = Cell value

**Why `.table.md`?** While the content is plain Markdown, we use the `.table.md` file extension (suffix) to indicate that the file follows Tabmark's structural conventions and should be opened with the DataGrid editor.

## Why This Approach?

This design was created to combine two goals:
- **AI-Friendly**: Markdown is highly readable by LLMs, making it ideal for AI-assisted workflows
- **Human-Friendly**: DataGrid interface provides the convenience of spreadsheet editing

By leveraging Markdown's hierarchical structure, we get data that's both machine-readable and editable as a visual grid.

## Features

- **DataGrid Interface**: Edit hierarchical Markdown as a familiar spreadsheet
- **Rich Cell Content**: Cells can contain complex Markdown (lists, code blocks, multiple paragraphs)
- **CSV Integration**: Import from and export to CSV files
- **Modern Tech Stack**: Built with Svelte 5 and Vite for high performance

## Usage

1. Open a `*.table.md` file in VS Code
2. The file will automatically open in the Tabmark DataGrid editor
3. Use "Export to CSV" or "Import from CSV" commands from the command palette to convert data

## Development

See [docs/development.md](./docs/development.md) for setup, build, and packaging instructions.
