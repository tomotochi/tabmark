/**
 * Markdown parsing utilities with hierarchical structure support.
 * TypeScript port of the Python markdown_parser.py
 */

import MarkdownIt from 'markdown-it';
import * as yaml from 'js-yaml';
import Papa from 'papaparse';
import {
  Frontmatter,
  GridData,
  ParsedMarkdown,
  ParserOptions,
  TabmarkValidationResult,
} from './types';
import {
  escapeMarkdownSyntax,
  unescapeHtml,
  unescapeMarkdownSyntax,
  escapeHtmlSafe,
} from './escaper';

export class MarkdownParser {
  private md: MarkdownIt;
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.md = new MarkdownIt();
    this.options = {
      escapeHtml: options.escapeHtml ?? false, // HTML escaping OFF by default
      escapeMarkdown: options.escapeMarkdown ?? false, // Markdown escaping OFF
    };
  }

  /**
   * Parse frontmatter from markdown content
   */
  parseFrontmatter(content: string): { frontmatter: Frontmatter | null; content: string } {
    if (content.startsWith('---\n')) {
      const parts = content.split('\n---\n', 2);
      if (parts.length === 2) {
        try {
          const yamlContent = parts[0].substring(4); // Remove leading '---\n'
          if (yamlContent.length < 1) {
            return { frontmatter: null, content };
          }
          const frontmatter = yaml.load(yamlContent) as Frontmatter;
          return { frontmatter, content: parts[1].trim() };
        } catch (e) {
          console.warn('Failed to parse YAML frontmatter:', e);
        }
      }
    }
    return { frontmatter: null, content };
  }

  /**
   * Parse hierarchical markdown structure (# -> ## -> ###)
   */
  parseHierarchical(content: string): ParsedMarkdown {
    const { frontmatter, content: mdContent } = this.parseFrontmatter(content);

    const tokens = this.md.parse(mdContent, {});

    const result: ParsedMarkdown = {
      frontmatter,
      sheets: {},
    };

    let currentSheet: string | null = null;
    let currentContent: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let inH1Heading = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'heading_open' && token.tag === 'h1') {
        // Save previous sheet if exists
        if (currentSheet) {
          const sheetContent = this.tokensToContent(currentContent);
          result.sheets[currentSheet] = this.processSheetContent(sheetContent);
        }

        // Reset for new sheet
        currentContent = [];
        inH1Heading = true;
      } else if (token.type === 'heading_close' && token.tag === 'h1') {
        inH1Heading = false;
      } else if (token.type === 'inline' && inH1Heading) {
        // This is the h1 heading text - set as current sheet name
        currentSheet = token.content.trim();
      } else if (!inH1Heading) {
        // Collect all other tokens for current sheet (excluding h1 content)
        currentContent.push(token);
      }
    }

    // Process the last sheet
    if (currentSheet) {
      const sheetContent = this.tokensToContent(currentContent);
      result.sheets[currentSheet] = this.processSheetContent(sheetContent);
    }

    return result;
  }

  /**
   * Convert markdown-it tokens back to text content
   */
  private tokensToContent(tokens: any[]): string {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const contentParts: string[] = [];
    let listLevel = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'paragraph_open') {
        continue;
      } else if (token.type === 'paragraph_close') {
        // Check if next token is a heading to avoid excessive spacing
        const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;
        const nextIsHeading = nextToken && nextToken.type === 'heading_open';

        // If token is hidden (e.g. inside tight list), use single newline
        // If next is heading, use single newline to avoid gaps
        // Otherwise use double newline to separate paragraphs
        if (token.hidden || nextIsHeading) {
          contentParts.push('\n');
        } else {
          contentParts.push('\n\n');
        }
      } else if (token.type === 'inline') {
        contentParts.push(token.content);
      } else if (token.type === 'heading_open') {
        const level = parseInt(token.tag.substring(1));
        contentParts.push('#'.repeat(level) + ' ');
      } else if (token.type === 'heading_close') {
        // Headings are block elements but don't strictly require double newline after
        // Using single newline preserves compactness
        contentParts.push('\n');
      } else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
        listLevel++;
      } else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
        listLevel--;
        if (listLevel === 0) contentParts.push('\n');
      } else if (token.type === 'list_item_open') {
        // Simple indentation for nested lists
        const indent = '  '.repeat(Math.max(0, listLevel - 1));
        // Check if ordered list to use numbers, but simpler to use '-' for now or check parent
        // For robustness in reconstruction, we default to '-' for unordered
        // Ideally we should track list type, but for now let's use '-'
        contentParts.push(indent + '- ');
      } else if (token.type === 'list_item_close') {
        // contentParts.push('\n'); // Paragraph close inside list item usually handles this
      } else if (token.type === 'fence') {
        contentParts.push(token.markup + token.info + '\n' + token.content + token.markup + '\n\n');
      } else if (token.type === 'code_block') {
        contentParts.push(token.content + '\n\n');
      } else if (token.type === 'html_block') {
        contentParts.push(token.content);
      } else if (token.type === 'hr') {
        contentParts.push('---\n\n');
      } else if (token.type === 'blockquote_open') {
        contentParts.push('> ');
      } else if (token.type === 'blockquote_close') {
        contentParts.push('\n\n');
      } else if (token.content && !token.type.endsWith('_open') && !token.type.endsWith('_close')) {
        contentParts.push(token.content);
      }
    }

    // Clean up excessive newlines
    return contentParts
      .join('')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Process sheet content as hierarchical structure
   */
  private processSheetContent(content: string): {
    type: 'hierarchical';
    rows: { [rowIndex: string]: string[] };
    columnOrder: string[];
  } {
    const tokens = this.md.parse(content.trim(), {});
    return this.parseHierarchicalRowsFromTokens(tokens);
  }

  /**
   * Parse hierarchical structure using markdown-it tokens directly
   */
  private parseHierarchicalRowsFromTokens(tokens: any[]): {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    type: 'hierarchical';
    rows: { [rowIndex: string]: string[] };
    columnOrder: string[];
  } {
    const rows: { [rowIndex: string]: string[] } = {};
    const columnOrder: string[] = [];
    let currentRow: string | null = null;
    let currentColIndex: number = -1;
    let currentContent: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === 'heading_open') {
        const level = parseInt(token.tag.substring(1));

        if (level === 2) {
          // Row Header (H2)
          // Save previous column content if exists
          if (currentRow && currentColIndex >= 0) {
            const contentText = this.extractContentFromTokens(currentContent);
            rows[currentRow][currentColIndex] = contentText;
          }

          // Get row name from next inline token
          if (i + 1 < tokens.length && tokens[i + 1].type === 'inline') {
            const rowName = tokens[i + 1].content.trim();
            currentRow = rowName;
            rows[rowName] = [];
            currentColIndex = -1;
            currentContent = [];
          }
        } else if (level === 3) {
          // Column Header (H3)
          // Save previous column content if exists
          if (currentRow && currentColIndex >= 0) {
            const contentText = this.extractContentFromTokens(currentContent);
            rows[currentRow][currentColIndex] = contentText;
          }

          // Get column name from next inline token
          if (i + 1 < tokens.length && tokens[i + 1].type === 'inline') {
            let colName = tokens[i + 1].content.trim();
            // Handle <br> tags in headers
            colName = this.markdownValueToGrid(colName);

            // Add to columnOrder if this is the first row
            if (currentRow) {
              // Check if we are processing the first row
              if (Object.keys(rows).length === 1) {
                columnOrder.push(colName);
              }

              // Set current column index
              currentColIndex = rows[currentRow].length;
            }
            currentContent = [];
          }
        } else {
          // Content headings (H1, H4-H6) - include in content
          if (currentColIndex >= 0) {
            currentContent.push(token);
          }
        }
      } else if (token.type === 'heading_close') {
        const level = parseInt(token.tag.substring(1));
        // Only include close tags for content headings
        if (level !== 2 && level !== 3) {
          if (currentColIndex >= 0) {
            currentContent.push(token);
          }
        }
      } else if (currentColIndex >= 0) {
        // Other tokens (inline, paragraph, list, etc.)
        // Exclude inline tokens that are part of H2/H3 headers
        const isStructureHeaderContent =
          token.type === 'inline' &&
          i > 0 &&
          tokens[i - 1].type === 'heading_open' &&
          (tokens[i - 1].tag === 'h2' || tokens[i - 1].tag === 'h3');

        if (!isStructureHeaderContent) {
          currentContent.push(token);
        }
      }

      i++;
    }

    // Handle last column
    if (currentRow && currentColIndex >= 0) {
      const contentText = this.extractContentFromTokens(currentContent);
      rows[currentRow][currentColIndex] = contentText;
    }

    return { type: 'hierarchical', rows, columnOrder };
  }

  /**
   * Extract text content from a list of tokens, preserving structure
   */
  private extractContentFromTokens(tokens: any[]): string {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!tokens || tokens.length === 0) {
      return '';
    }

    return this.tokensToContent(tokens);
  }

  /**
   * Generate hierarchical markdown from tabular data
   */
  generateHierarchical(
    sheetName: string,
    headers: string[],
    rows: string[][],
    frontmatter?: Frontmatter,
  ): string {
    const result: string[] = [];

    // Add frontmatter if provided
    if (frontmatter) {
      result.push('---');
      result.push(yaml.dump(frontmatter).trim());
      result.push('---');
      result.push('');
    }

    // Add sheet header
    result.push(`# ${sheetName}`);

    // Add hierarchical structure
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      result.push(`## ${rowIdx + 1}`);

      const row = rows[rowIdx];
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const header = headers[colIdx];
        let value = row[colIdx] ?? '';

        // Convert newlines to <br> for multi-line cells
        // Pass isHeader=false to allow raw newlines and H4+ in cells
        value = this.gridValueToMarkdown(value, false);

        // Also sanitize header to handle newlines
        // Pass isHeader=true to force <br> conversion
        const sanitizedHeader = this.gridValueToMarkdown(header, true);
        result.push(`### ${sanitizedHeader}`);
        result.push(value);
      }
    }

    return result.join('\n');
  }

  /**
   * Convert grid cell value to markdown format
   * Applies HTML and Markdown escaping if enabled
   * Replaces newlines with <br> tags ONLY for headers
   * For cells, preserves newlines but escapes H1-H3 to protect structure
   */
  private gridValueToMarkdown(value: string, isHeader: boolean = false): string {
    if (!value) return '';

    let result = value;

    // Apply escaping if enabled
    if (this.options.escapeHtml) {
      result = escapeHtmlSafe(result);
    }
    if (this.options.escapeMarkdown) {
      result = escapeMarkdownSyntax(result);
    }

    if (isHeader) {
      // Headers MUST be single line, so convert newlines to <br>
      result = result.replace(/\n/g, '<br>');
    } else {
      // Remove trailing newlines from cells to preserve Markdown structure
      result = result.replace(/\n+$/, '');

      // Cells can have newlines, but we must protect the structure (H1-H3)
      // Escape lines starting with #, ##, ### but preserve code fences
      result = this.escapeHeadingsOutsideCodeFences(result);
    }

    return result;
  }

  /**
   * Escape H1-H3 headings outside of code fences using markdown-it tokens
   */
  private escapeHeadingsOutsideCodeFences(text: string): string {
    if (!text) return '';

    // Parse the text to get token tree
    const tokens = this.md.parse(text, {});

    // Build a map of code fence ranges (start line -> end line)
    const codeFenceRanges: Array<{ start: number; end: number }> = [];
    const inlineCodeRanges: Array<{
      start: number;
      end: number;
      startCol: number;
      endCol: number;
    }> = [];

    // Identify code fence tokens
    for (const token of tokens) {
      if (token.type === 'fence' || token.type === 'code_block') {
        if (token.map) {
          codeFenceRanges.push({
            start: token.map[0],
            end: token.map[1],
          });
        }
      }
    }

    // Identify inline code within inline tokens
    this.findInlineCodeRanges(tokens, text, inlineCodeRanges);

    // Split text into lines
    const lines = text.split('\n');

    // Process each line
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];

      // Check if this line is inside a code fence
      const isInCodeFence = codeFenceRanges.some(
        (range) => lineIdx >= range.start && lineIdx < range.end,
      );

      if (isInCodeFence) {
        continue; // Skip lines inside code fences
      }

      // Check for H1-H3 headings at start of line
      const match = line.match(/^(#{1,3})\s/);
      if (match) {
        // Check if this heading is inside inline code
        const headingStart = 0;
        const isInInlineCode = inlineCodeRanges.some(
          (range) =>
            range.start === lineIdx &&
            headingStart >= range.startCol &&
            headingStart < range.endCol,
        );

        if (!isInInlineCode) {
          // Escape the heading
          lines[lineIdx] = line.replace(/^(#)(#{0,2}\s)/, '\\$1$2');
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Find inline code ranges in the token tree
   */
  private findInlineCodeRanges(
    tokens: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    text: string,
    ranges: Array<{ start: number; end: number; startCol: number; endCol: number }>,
  ): void {
    for (const token of tokens) {
      if (token.type === 'inline' && token.children) {
        // Track position within the line
        let currentPos = 0;
        const lineIdx = token.map ? token.map[0] : 0;

        for (const child of token.children) {
          if (child.type === 'code_inline') {
            const codeLength = child.content.length + 2; // +2 for backticks
            ranges.push({
              start: lineIdx,
              end: lineIdx,
              startCol: currentPos,
              endCol: currentPos + codeLength,
            });
          }
          // Update position (approximate)
          if (child.content) {
            currentPos += child.content.length;
          }
        }
      }

      // Recursively process children
      if (token.children) {
        this.findInlineCodeRanges(token.children, text, ranges);
      }
    }
  }

  /**
   * Convert markdown cell value to grid format
   * Replaces <br> tags with newlines
   * Unescapes HTML entities and Markdown syntax
   */
  private markdownValueToGrid(value: string): string {
    if (!value) return '';
    let result = value.replace(/<br\s*\/?>/gi, '\n');

    // Unescape headings that were escaped in gridValueToMarkdown
    // \### -> ###
    // We look for backslash followed by 1-3 hashes at start of line
    result = result.replace(/^\\(#{1,3})(?=\s)/gm, '$1');

    // Unescape HTML entities if escaping was enabled
    if (this.options.escapeHtml) {
      result = unescapeHtml(result);
    }

    // Unescape Markdown syntax if escaping was enabled
    if (this.options.escapeMarkdown) {
      result = unescapeMarkdownSyntax(result);
    }

    return result;
  }

  /**
   * Convert parsed hierarchical data to grid format
   */
  toGridData(parsed: ParsedMarkdown): GridData {
    // Get the first sheet
    const sheetNames = Object.keys(parsed.sheets);
    if (sheetNames.length === 0) {
      return { headers: [], rows: [] };
    }

    const sheetName = sheetNames[0];
    const sheet = parsed.sheets[sheetName];
    const rowsData = sheet.rows;

    // Use columnOrder from sheet (now required)
    const headers = sheet.columnOrder;

    const rowIndices = Object.keys(rowsData).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return 0;
    });

    // Convert to tabular format
    const rows: string[][] = [];

    for (const rowIdx of rowIndices) {
      const row: string[] = [];
      const rowData = rowsData[rowIdx];

      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        let value = rowData[colIndex] || '';
        // Convert <br> tags to newlines for grid display
        value = this.markdownValueToGrid(value);
        row.push(value);
      }
      rows.push(row);
    }

    return { headers, rows };
  }

  /**
   * Convert grid data to markdown
   */
  fromGridData(sheetName: string, gridData: GridData, frontmatter?: Frontmatter): string {
    return this.generateHierarchical(sheetName, gridData.headers, gridData.rows, frontmatter);
  }

  /**
   * Convert CSV string to GridData
   * Supports duplicate headers by using header: false option
   */
  fromCSV(csvContent: string): GridData {
    const result = Papa.parse(csvContent, {
      header: false, // Treat as arrays to support duplicate headers
      skipEmptyLines: false,
    });

    // Ignore delimiter detection warnings (type: 'Delimiter')
    const criticalErrors = result.errors.filter((e) => e.type !== 'Delimiter');
    if (criticalErrors.length > 0) {
      throw new Error(criticalErrors[0].message);
    }

    const data = result.data as string[][];
    if (data.length === 0 || (data.length === 1 && data[0].length === 1 && data[0][0] === '')) {
      return { headers: [], rows: [] };
    }

    const headers = data[0];
    const rows = data.slice(1);

    return { headers, rows };
  }

  /**
   * Convert GridData to CSV string
   */
  toCSV(gridData: GridData): string {
    const data = [gridData.headers, ...gridData.rows];
    return Papa.unparse(data);
  }

  /**
   * Validate if parsed markdown has valid Tabmark structure
   * Checks:
   * 1. At least one H1 heading exists (sheet name)
   * 2. At least one H2 heading exists with numeric content (row number)
   * 3. At least one H3 heading exists (column name)
   */
  validateTabmarkStructure(parsed: ParsedMarkdown): TabmarkValidationResult {
    const errors: string[] = [];

    // Check if at least one sheet (H1) exists
    const sheetNames = Object.keys(parsed.sheets);
    if (sheetNames.length === 0) {
      errors.push('No H1 heading found. At least one sheet name is required.');
      return { isValid: false, errors };
    }

    // Check each sheet for valid structure
    for (const sheetName of sheetNames) {
      const sheet = parsed.sheets[sheetName];

      // Check if at least one row (H2) exists
      const rowKeys = Object.keys(sheet.rows);
      if (rowKeys.length === 0) {
        errors.push(
          `Sheet "${sheetName}": No H2 headings found. At least one row number is required.`,
        );
        continue;
      }

      // Check if at least one H2 is numeric
      const hasNumericRow = rowKeys.some((key) => /^\d+$/.test(key.trim()));
      if (!hasNumericRow) {
        errors.push(
          `Sheet "${sheetName}": No numeric H2 headings found. Row numbers must be numeric.`,
        );
      }

      // Check if at least one column (H3) exists
      if (sheet.columnOrder.length === 0) {
        errors.push(
          `Sheet "${sheetName}": No H3 headings found. At least one column name is required.`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
