import { describe, it, expect } from 'vitest';
import { isTabmarkBlobUrl } from '../src/content/github/url';

describe('isTabmarkBlobUrl', () => {
  it('matches GitHub blob URL for *.table.md', () => {
    const url = new URL('https://github.com/owner/repo/blob/main/path/to/file.table.md');
    expect(isTabmarkBlobUrl(url)).toBe(true);
  });

  it('does not match non-blob paths', () => {
    const url = new URL('https://github.com/owner/repo/tree/main/path/to/file.table.md');
    expect(isTabmarkBlobUrl(url)).toBe(false);
  });

  it('does not match non-tabmark files', () => {
    const url = new URL('https://github.com/owner/repo/blob/main/path/to/file.md');
    expect(isTabmarkBlobUrl(url)).toBe(false);
  });

  it('does not match other hosts', () => {
    const url = new URL('https://example.com/owner/repo/blob/main/file.table.md');
    expect(isTabmarkBlobUrl(url)).toBe(false);
  });
});
