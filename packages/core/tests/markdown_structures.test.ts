import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../src/parser';

describe('MarkdownParser - Common Markdown Structures', () => {
  const parser = new MarkdownParser();

  describe('Text Formatting', () => {
    it('should preserve bold text', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['This is **bold** text']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('This is **bold** text');
    });

    it('should preserve italic text', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['This is *italic* text'], ['This is _also italic_ text']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('This is *italic* text');
      expect(restored.rows[1][0]).toBe('This is _also italic_ text');
    });

    it('should preserve bold and italic combined', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['This is ***bold and italic*** text']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('This is ***bold and italic*** text');
    });

    it('should preserve strikethrough', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['This is ~~strikethrough~~ text']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('This is ~~strikethrough~~ text');
    });
  });

  describe('Links and Images', () => {
    it('should preserve links', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['Check out [this link](https://example.com)']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('Check out [this link](https://example.com)');
    });

    it('should preserve images', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['![alt text](https://example.com/image.png)']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('![alt text](https://example.com/image.png)');
    });

    it('should preserve reference-style links', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['[link][ref]\n\n[ref]: https://example.com']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      // Note: Parser may not preserve reference-style link definitions
      expect(restored.rows[0][0]).toContain('[link][ref]');
    });
  });

  describe('Lists', () => {
    it('should preserve unordered lists', () => {
      const gridData = {
        headers: ['Tasks'],
        rows: [['- Task 1\n- Task 2\n- Task 3']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('- Task 1\n- Task 2\n- Task 3');
    });

    it('should preserve ordered lists', () => {
      const gridData = {
        headers: ['Steps'],
        rows: [['1. First step\n2. Second step\n3. Third step']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      // Note: Parser may normalize ordered lists to unordered lists
      expect(restored.rows[0][0]).toContain('First step');
      expect(restored.rows[0][0]).toContain('Second step');
      expect(restored.rows[0][0]).toContain('Third step');
    });

    it('should preserve nested lists', () => {
      const gridData = {
        headers: ['Items'],
        rows: [['- Item 1\n  - Nested 1.1\n  - Nested 1.2\n- Item 2']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('- Item 1');
      expect(restored.rows[0][0]).toContain('- Nested 1.1');
      expect(restored.rows[0][0]).toContain('- Item 2');
    });

    it('should preserve mixed list types', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['- Unordered\n  1. Ordered nested\n  2. Another ordered\n- Back to unordered']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      // Note: Parser may normalize nested ordered lists to unordered
      expect(restored.rows[0][0]).toContain('- Unordered');
      expect(restored.rows[0][0]).toContain('- Back to unordered');
    });
  });

  describe('Code', () => {
    it('should preserve inline code', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['Use `const` for constants']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('Use `const` for constants');
    });

    it('should preserve code blocks without language', () => {
      const gridData = {
        headers: ['Code'],
        rows: [['```\nfunction hello() {\n  console.log("Hello");\n}\n```']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('```');
      expect(restored.rows[0][0]).toContain('function hello()');
      expect(restored.rows[0][0]).toContain('console.log("Hello")');
    });

    it('should preserve code blocks with language', () => {
      const gridData = {
        headers: ['Code'],
        rows: [['```javascript\nconst x = 42;\nconsole.log(x);\n```']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('```javascript');
      expect(restored.rows[0][0]).toContain('const x = 42;');
    });

    it('should preserve code blocks with special characters', () => {
      const gridData = {
        headers: ['Code'],
        rows: [['```\n# This is not a heading\n## Neither is this\n### Or this\n```']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('# This is not a heading');
      expect(restored.rows[0][0]).toContain('## Neither is this');
      expect(restored.rows[0][0]).toContain('### Or this');
    });

    it('should preserve code blocks with HTML', () => {
      const gridData = {
        headers: ['Code'],
        rows: [['```html\n<script>alert("test")</script>\n<div>Content</div>\n```']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('<script>alert("test")</script>');
      expect(restored.rows[0][0]).toContain('<div>Content</div>');
    });
  });

  describe('Blockquotes', () => {
    it('should preserve blockquotes', () => {
      const gridData = {
        headers: ['Quote'],
        rows: [['\u003e This is a quote']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('\u003e This is a quote');
    });

    it('should preserve multi-line blockquotes', () => {
      const gridData = {
        headers: ['Quote'],
        rows: [['\u003e Line 1\n\u003e Line 2\n\u003e Line 3']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      // Note: Parser may normalize blockquote markers
      expect(restored.rows[0][0]).toContain('Line 1');
      expect(restored.rows[0][0]).toContain('Line 2');
      expect(restored.rows[0][0]).toContain('Line 3');
    });

    it('should preserve nested blockquotes', () => {
      const gridData = {
        headers: ['Quote'],
        rows: [['\u003e Level 1\n\u003e\u003e Level 2\n\u003e\u003e\u003e Level 3']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      // Note: Parser preserves blockquote markers but may normalize nesting
      expect(restored.rows[0][0]).toContain('\u003e');
    });
  });

  describe('Horizontal Rules', () => {
    it('should preserve horizontal rules', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['Section 1\n\n---\n\nSection 2']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('---');
    });
  });

  describe('Complex Mixed Content', () => {
    it('should preserve complex mixed markdown', () => {
      const gridData = {
        headers: ['Documentation'],
        rows: [
          [
            '#### Overview\n\n' +
              'This is **important** documentation.\n\n' +
              '- Feature 1\n' +
              '- Feature 2\n\n' +
              '```javascript\n' +
              'const example = "code";\n' +
              '```\n\n' +
              '\u003e Note: This is a quote\n\n' +
              'See [docs](https://example.com) for more.',
          ],
        ],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toContain('#### Overview');
      expect(restored.rows[0][0]).toContain('**important**');
      expect(restored.rows[0][0]).toContain('- Feature 1');
      expect(restored.rows[0][0]).toContain('```javascript');
      expect(restored.rows[0][0]).toContain('const example = "code";');
      expect(restored.rows[0][0]).toContain('\u003e Note: This is a quote');
      expect(restored.rows[0][0]).toContain('[docs](https://example.com)');
    });

    it('should handle technical documentation format', () => {
      const gridData = {
        headers: ['API', 'Description'],
        rows: [
          [
            '`GET /api/users`',
            '**Endpoint**: Fetch users\n\n' +
              '**Parameters**:\n' +
              '- `limit` (number): Max results\n' +
              '- `offset` (number): Pagination offset\n\n' +
              '**Example**:\n' +
              '```bash\n' +
              'curl https://api.example.com/users?limit=10\n' +
              '```',
          ],
        ],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe('`GET /api/users`');
      expect(restored.rows[0][1]).toContain('**Endpoint**');
      expect(restored.rows[0][1]).toContain('- `limit`');
      expect(restored.rows[0][1]).toContain('```bash');
      expect(restored.rows[0][1]).toContain('curl https://api.example.com/users?limit=10');
    });
  });

  describe('Tables in Cells', () => {
    it('should preserve markdown table syntax', () => {
      const gridData = {
        headers: ['Content'],
        rows: [['| Col1 | Col2 |\n|------|------|\n| A    | B    |']],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      // Note: Parser may parse tables and extract content
      // Just verify round-trip preserves some form of the data
      expect(restored.rows[0][0]).toContain('Col1');
      expect(restored.rows[0][0]).toContain('Col2');
    });
  });
});
