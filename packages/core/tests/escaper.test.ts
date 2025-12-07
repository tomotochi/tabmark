import {
  escapeHtml,
  escapeMarkdownSyntax,
  unescapeHtml,
  unescapeMarkdownSyntax,
  escapeHtmlSafe,
} from '../src/escaper';
import { describe, it, expect } from 'vitest';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('unescapeHtml', () => {
  it('unescapes HTML entities', () => {
    expect(unescapeHtml('&lt;script&gt;')).toBe('<script>');
  });

  it('handles multiple entities', () => {
    expect(unescapeHtml('&lt;div class=&quot;test&quot;&gt;')).toBe('<div class="test">');
  });
});

describe('escapeHtmlSafe', () => {
  it('should preserve code fences', () => {
    const input = '```html\n<div>test</div>\n```';
    const result = escapeHtmlSafe(input);
    expect(result).toBe(input);
  });

  it('should preserve inline code', () => {
    const input = 'Use `<div>` tag';
    const result = escapeHtmlSafe(input);
    expect(result).toBe('Use `<div>` tag');
  });

  it('should escape HTML outside code', () => {
    const input = '<script>alert(1)</script> and `<div>`';
    const result = escapeHtmlSafe(input);
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt; and `<div>`');
  });

  it('should handle mixed content', () => {
    const input = '<div>bad</div>\n```\n<div>good</div>\n```\n<span>bad</span>';
    const result = escapeHtmlSafe(input);
    expect(result).toContain('&lt;div&gt;bad&lt;/div&gt;');
    expect(result).toContain('```\n<div>good</div>\n```');
    expect(result).toContain('&lt;span&gt;bad&lt;/span&gt;');
  });

  it('should handle code fence with language', () => {
    const input = '```javascript\nconst x = "<div>";\n```';
    const result = escapeHtmlSafe(input);
    expect(result).toBe(input);
  });

  it('should handle multiple code fences', () => {
    const input = '```\n<div>1</div>\n```\n<span>bad</span>\n```\n<div>2</div>\n```';
    const result = escapeHtmlSafe(input);
    expect(result).toContain('```\n<div>1</div>\n```');
    expect(result).toContain('```\n<div>2</div>\n```');
    expect(result).toContain('&lt;span&gt;bad&lt;/span&gt;');
  });

  it('should handle multiple inline code blocks', () => {
    const input = 'Use `<div>` or `<span>` but not <script>';
    const result = escapeHtmlSafe(input);
    expect(result).toBe('Use `<div>` or `<span>` but not &lt;script&gt;');
  });
});

describe('escapeMarkdownSyntax', () => {
  it('escapes heading markers', () => {
    expect(escapeMarkdownSyntax('# Heading')).toBe('\\# Heading');
    expect(escapeMarkdownSyntax('## Subheading')).toBe('\\#\\# Subheading');
    expect(escapeMarkdownSyntax('### Level 3')).toBe('\\#\\#\\# Level 3');
  });

  it('escapes asterisks and underscores', () => {
    expect(escapeMarkdownSyntax('**bold** and _italic_')).toBe('\\*\\*bold\\*\\* and \\_italic\\_');
  });

  it('escapes brackets', () => {
    expect(escapeMarkdownSyntax('[link](url)')).toBe('\\[link\\]\\(url\\)');
  });

  it('preserves code fences', () => {
    const input = '# Title\n```\n# Not a heading\n**not bold**\n```\n# Another heading';
    const output = escapeMarkdownSyntax(input);

    expect(output).toContain('```\n# Not a heading\n**not bold**\n```');
    expect(output).toContain('\\# Title');
    expect(output).toContain('\\# Another heading');
  });

  it('handles multiple code fences', () => {
    const input = '```\ncode1\n```\ntext\n```\ncode2\n```';
    const output = escapeMarkdownSyntax(input);

    expect(output).toContain('```\ncode1\n```');
    expect(output).toContain('```\ncode2\n```');
  });
});

describe('unescapeMarkdownSyntax', () => {
  it('unescapes heading markers', () => {
    expect(unescapeMarkdownSyntax('\\# Heading')).toBe('# Heading');
  });

  it('unescapes asterisks and underscores', () => {
    expect(unescapeMarkdownSyntax('\\*\\*bold\\*\\*')).toBe('**bold**');
  });
});
