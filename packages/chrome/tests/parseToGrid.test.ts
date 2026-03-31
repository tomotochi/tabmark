import { describe, it, expect } from 'vitest';
import { parseTabmarkMarkdownToGrid } from '../src/content/tabmark/parseToGrid';

describe('parseTabmarkMarkdownToGrid', () => {
  it('parses valid tabmark markdown into grid view data (first sheet)', () => {
    const markdown = `# Sheet1
## 1
### Name
Alice
### Age
30
## 2
### Name
Bob
### Age
25
`;

    const view = parseTabmarkMarkdownToGrid(markdown);
    expect(view.sheetName).toBe('Sheet1');
    expect(view.headers).toEqual(['Name', 'Age']);
    expect(view.rowIds).toEqual(['1', '2']);
    expect(view.rows).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ]);
  });
});
