import { describe, it, expect } from 'vitest';
import { MarkdownParser } from 'tabmark-core';

// Mock VS Code API if needed, but for now we test logic that doesn't depend heavily on vscode module
// or we mock it. Since we are testing logic that uses tabmark-core, we can verify integration.

describe('Extension Logic', () => {
  it('should be able to instantiate parser', () => {
    const parser = new MarkdownParser();
    expect(parser).toBeDefined();
  });

  it('should parse simple markdown', () => {
    const parser = new MarkdownParser();
    const md = '# test\n## 0\n### col\nval';
    const parsed = parser.parseHierarchical(md);
    expect(parsed.sheets['test']).toBeDefined();
  });
});
