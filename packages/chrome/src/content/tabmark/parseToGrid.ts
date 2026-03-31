import { MarkdownParser } from 'tabmark-core';
import type { GridData, ParsedMarkdown } from 'tabmark-core';

export interface TabmarkGridViewData {
  sheetName: string;
  headers: string[];
  rows: string[][];
  rowIds: string[];
}

function sortRowIds(rowsObj: Record<string, unknown>): string[] {
  return Object.keys(rowsObj).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return 0;
  });
}

export function parseTabmarkMarkdownToGrid(markdown: string): TabmarkGridViewData {
  const parser = new MarkdownParser({ escapeHtml: false });
  const parsed = parser.parseHierarchical(markdown);
  const validation = parser.validateTabmarkStructure(parsed);
  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'));
  }

  const sheetNames = Object.keys(parsed.sheets);
  if (sheetNames.length === 0) {
    return { sheetName: '', headers: [], rows: [], rowIds: [] };
  }

  // For GitHub rendering we start with the first sheet only.
  const firstSheetName = sheetNames[0];
  const sheetParsed: ParsedMarkdown = {
    frontmatter: parsed.frontmatter,
    sheets: { [firstSheetName]: parsed.sheets[firstSheetName] },
  };
  const grid: GridData = parser.toGridData(sheetParsed);
  const rowIds = sortRowIds(parsed.sheets[firstSheetName].rows);
  return { sheetName: firstSheetName, headers: grid.headers, rows: grid.rows, rowIds };
}
