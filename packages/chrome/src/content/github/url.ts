export function isGitHubDotCom(hostname: string): boolean {
  return hostname === 'github.com';
}

/**
 * True for GitHub "blob" pages that point at a `*.table.md` file.
 *
 * Examples:
 * - /owner/repo/blob/main/path/to/file.table.md
 *
 * Excludes:
 * - /owner/repo/blame/...
 * - /owner/repo/raw/...
 */
export function isTabmarkBlobPathname(pathname: string): boolean {
  // /:owner/:repo/blob/:ref/.../*.table.md
  // owner/repo segments can't include '/' so we just require at least:
  // ['', owner, repo, 'blob', ref, ...pathSegments]
  const parts = pathname.split('/');
  if (parts.length < 6) return false;
  if (parts[0] !== '') return false;
  if (parts[3] !== 'blob') return false;

  // The file name is the last segment.
  const fileName = parts[parts.length - 1];
  return fileName.endsWith('.table.md');
}

export function isTabmarkBlobUrl(url: URL): boolean {
  if (!isGitHubDotCom(url.hostname)) return false;
  return isTabmarkBlobPathname(url.pathname);
}
