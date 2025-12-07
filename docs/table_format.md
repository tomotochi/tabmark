# Tabmark Table Format (`.table.md`)

Tabmark uses a hierarchical Markdown format to represent table data. This allows tables to be human-readable and git-friendly.

## Structure

The structure maps Markdown headings to table components:

- **H1 (`#`)**: Sheet / Table Name
- **H2 (`##`)**: Row Identifier (ID or Index)
- **H3 (`###`)**: Column Header
- **Content**: Cell Value

## Example

```markdown
# Products

## 1

### Name

Apple

### Price

$1.00

## 2

### Name

Banana

### Price

$0.50
```

## Rules

1. **Hierarchy**: The nesting order `#` > `##` > `###` must be preserved.
2. **Multi-line Content**: Cell values can span multiple lines.
3. **Markdown Support**: Cell values can contain standard Markdown (bold, links, etc.).
4. **Frontmatter**: Optional YAML frontmatter at the top of the file is supported.
