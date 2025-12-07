import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../src/parser';

describe('MarkdownParser - Security & XSS Prevention', () => {
  const parser = new MarkdownParser({ escapeHtml: true }); // Enable escaping for security tests

  it('should escape HTML script tags in cell content when enabled', () => {
    const gridData = {
      headers: ['Name', 'Code'],
      rows: [['Alice', '<script>alert(1)</script>']],
    };

    const markdown = parser.fromGridData('test', gridData);
    expect(markdown).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(markdown).not.toContain('<script>');
  });

  it('should restore original content after round-trip', () => {
    const gridData = {
      headers: ['Name', 'Code'],
      rows: [['Alice', '<script>alert(1)</script>']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][1]).toBe('<script>alert(1)</script>');
  });

  it('should escape other HTML tags when enabled', () => {
    const gridData = {
      headers: ['Content'],
      rows: [
        ['<img src=x onerror=alert(1)>'],
        ['<iframe src="evil.com"></iframe>'],
        ['<a href="javascript:alert(1)">click</a>'],
      ],
    };

    const markdown = parser.fromGridData('test', gridData);
    expect(markdown).toContain('&lt;img');
    expect(markdown).toContain('&lt;iframe');
    expect(markdown).toContain('&lt;a href');
  });

  it('should preserve code fences when HTML escaping is enabled', () => {
    const gridData = {
      headers: ['Code'],
      rows: [['```html\n<script>alert("test")</script>\n<div>Content</div>\n```']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    // Code fence content should be preserved
    expect(restored.rows[0][0]).toContain('<script>alert("test")</script>');
    expect(restored.rows[0][0]).toContain('<div>Content</div>');
  });
});

describe('MarkdownParser - Data Fidelity (Round-Trip)', () => {
  const parser = new MarkdownParser();

  it('should preserve special characters', () => {
    const testCases = [
      'foo & bar',
      'less < than',
      'greater > than',
      'quote " marks',
      "single ' quotes",
    ];

    testCases.forEach((testValue) => {
      const gridData = {
        headers: ['Value'],
        rows: [[testValue]],
      };

      const markdown = parser.fromGridData('test', gridData);
      const parsed = parser.parseHierarchical(markdown);
      const restored = parser.toGridData(parsed);

      expect(restored.rows[0][0]).toBe(testValue);
    });
  });

  it('should preserve newlines in cells', () => {
    const gridData = {
      headers: ['Description'],
      rows: [['Line 1\nLine 2\nLine 3']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should handle empty cells', () => {
    const gridData = {
      headers: ['A', 'B', 'C'],
      rows: [
        ['', 'value', ''],
        ['value', '', 'value'],
      ],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toBe('');
    expect(restored.rows[0][1]).toBe('value');
    expect(restored.rows[0][2]).toBe('');
  });

  it('should preserve Markdown syntax in cells when escaping is enabled', () => {
    const parser = new MarkdownParser({ escapeMarkdown: true });
    const gridData = {
      headers: ['Content'],
      rows: [['**bold** text'], ['_italic_ text'], ['[link](url)']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toBe('**bold** text');
    expect(restored.rows[1][0]).toBe('_italic_ text');
    expect(restored.rows[2][0]).toBe('[link](url)');
  });
});

describe('MarkdownParser - Header Edge Cases', () => {
  const parser = new MarkdownParser();

  it('should handle headers with newlines', () => {
    const gridData = {
      headers: ['Name\nAlias'],
      rows: [['Alice']],
    };

    const markdown = parser.fromGridData('test', gridData);
    expect(markdown).toContain('<br>');

    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.headers[0]).toBe('Name\nAlias');
  });

  it('should handle headers starting with #', () => {
    const parser = new MarkdownParser({ escapeMarkdown: true });
    const gridData = {
      headers: ['# ID', '## Code'],
      rows: [['1', 'A']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.headers[0]).toBe('# ID');
    expect(restored.headers[1]).toBe('## Code');
  });

  it('should handle headers with Markdown syntax', () => {
    const parser = new MarkdownParser({ escapeMarkdown: true });
    const gridData = {
      headers: ['*Important*', '_Note_'],
      rows: [['value1', 'value2']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.headers[0]).toBe('*Important*');
    expect(restored.headers[1]).toBe('_Note_');
  });
});

describe('MarkdownParser - Content Headings (H4+)', () => {
  const parser = new MarkdownParser();

  it('should preserve H4 headings in cells', () => {
    const gridData = {
      headers: ['Content'],
      rows: [['#### Section\nSome text']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toContain('#### Section');
  });

  it('should preserve multiple headings in one cell', () => {
    const gridData = {
      headers: ['Content'],
      rows: [['#### First\nText\n##### Second\nMore text']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toContain('#### First');
    expect(restored.rows[0][0]).toContain('##### Second');
  });

  it('should handle escaped H1-H3 in cells', () => {
    const gridData = {
      headers: ['Content'],
      rows: [['### foo\n#### bar']],
    };

    const markdown = parser.fromGridData('test', gridData);
    // H3 should be escaped
    expect(markdown).toContain('\\###');
    // H4 should not be escaped
    expect(markdown).toContain('#### bar');

    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toBe('### foo\n#### bar');
  });
});

describe('MarkdownParser - List Handling', () => {
  const parser = new MarkdownParser();

  it('should preserve tight lists', () => {
    const gridData = {
      headers: ['Items'],
      rows: [['- item1\n- item2\n- item3']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toBe('- item1\n- item2\n- item3');
  });

  it('should preserve lists with headings', () => {
    const gridData = {
      headers: ['Content'],
      rows: [['#### Section\n- item1\n- item2']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toContain('#### Section');
    expect(restored.rows[0][0]).toContain('- item1');
    expect(restored.rows[0][0]).toContain('- item2');
  });

  it('should handle nested lists', () => {
    const gridData = {
      headers: ['Items'],
      rows: [['- item1\n  - nested1\n  - nested2\n- item2']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows[0][0]).toContain('- item1');
    expect(restored.rows[0][0]).toContain('- item2');
  });
});

describe('MarkdownParser - Structure Preservation', () => {
  const parser = new MarkdownParser();

  it('should handle multiple rows', () => {
    const gridData = {
      headers: ['Name', 'Age'],
      rows: [
        ['Alice', '30'],
        ['Bob', '25'],
        ['Charlie', '35'],
      ],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.rows.length).toBe(3);
    expect(restored.rows[0]).toEqual(['Alice', '30']);
    expect(restored.rows[1]).toEqual(['Bob', '25']);
    expect(restored.rows[2]).toEqual(['Charlie', '35']);
  });

  it('should preserve column order', () => {
    const gridData = {
      headers: ['Z', 'A', 'M'],
      rows: [['z1', 'a1', 'm1']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.headers).toEqual(['Z', 'A', 'M']);
  });

  it('should preserve duplicate column names', () => {
    const gridData = {
      headers: ['Name', 'Age', 'Name'],
      rows: [['Alice', '30', 'Bob']],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.headers).toEqual(['Name', 'Age', 'Name']);
    expect(restored.rows[0]).toEqual(['Alice', '30', 'Bob']);
  });

  it('should handle empty sheets', () => {
    const gridData = {
      headers: [],
      rows: [],
    };

    const markdown = parser.fromGridData('test', gridData);
    const parsed = parser.parseHierarchical(markdown);
    const restored = parser.toGridData(parsed);

    expect(restored.headers).toEqual([]);
    expect(restored.rows).toEqual([]);
  });

  it('should handle frontmatter', () => {
    const gridData = {
      headers: ['Name'],
      rows: [['Alice']],
    };
    const frontmatter = { title: 'Test Sheet', version: 1 };

    const markdown = parser.fromGridData('test', gridData, frontmatter);
    expect(markdown).toContain('---');
    expect(markdown).toContain('title: Test Sheet');

    const parsed = parser.parseHierarchical(markdown);
    expect(parsed.frontmatter).toEqual(frontmatter);
  });
});
