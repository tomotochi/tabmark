export interface Frontmatter {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface GridData {
  headers: string[];
  rows: string[][];
}

export interface ParsedMarkdown {
  frontmatter: Frontmatter | null;
  sheets: {
    [sheetName: string]: {
      type: 'hierarchical';
      rows: {
        [rowIndex: string]: string[]; // Changed to array to support duplicate column names
      };
      columnOrder: string[]; // Column names (required, may contain duplicates)
    };
  };
}

export interface ParserOptions {
  escapeHtml?: boolean; // Default: true (XSS prevention)
  escapeMarkdown?: boolean; // Default: false (preserve formatting)
}

export interface TabmarkValidationResult {
  isValid: boolean;
  errors: string[];
}
