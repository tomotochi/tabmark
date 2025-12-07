import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../src/parser';

describe('MarkdownParser.validateTabmarkStructure', () => {
  const parser = new MarkdownParser();

  it('should validate a valid tabmark structure', () => {
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
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when H1 is missing', () => {
    const markdown = `## 1
### Name
Alice
`;
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('No H1 heading found. At least one sheet name is required.');
  });

  it('should fail when H2 is missing', () => {
    const markdown = `# Sheet1
### Name
Alice
`;
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('No H2 headings found'))).toBe(true);
  });

  it('should fail when H2 is not numeric', () => {
    const markdown = `# Sheet1
## Row One
### Name
Alice
`;
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('No numeric H2 headings found'))).toBe(true);
  });

  it('should fail when H3 is missing', () => {
    const markdown = `# Sheet1
## 1
Alice
`;
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('No H3 headings found'))).toBe(true);
  });

  it('should fail when document is empty', () => {
    const markdown = '';
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('No H1 heading found. At least one sheet name is required.');
  });

  it('should accept numeric H2 with gaps', () => {
    const markdown = `# Sheet1
## 1
### Name
Alice
## 5
### Name
Bob
## 100
### Name
Charlie
`;
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate multiple sheets', () => {
    const markdown = `# Sheet1
## 1
### Name
Alice

# Sheet2
## 1
### Product
Widget
`;
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should report errors for each invalid sheet', () => {
    const markdown = `# Sheet1
## 1
### Name
Alice

# Sheet2
## NotNumeric
### Product
Widget
`;
    const parsed = parser.parseHierarchical(markdown);
    const result = parser.validateTabmarkStructure(parsed);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Sheet2') && e.includes('No numeric H2'))).toBe(
      true,
    );
  });
});
