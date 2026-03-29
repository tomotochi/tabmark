import { findRawButton } from '../github/selectors';
import { isTabmarkBlobUrl } from '../github/url';

export class RawFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RawFetchError';
  }
}

export function getRawUrlFromDom(): string {
  const raw = findRawButton();
  const href = raw instanceof HTMLAnchorElement ? raw.href : undefined;
  if (!href) {
    const url = new URL(location.href);
    if (!isTabmarkBlobUrl(url)) {
      throw new RawFetchError('Raw link not found on this page.');
    }
    url.pathname = url.pathname.replace('/blob/', '/raw/');
    return url.toString();
  }
  return href;
}

export async function fetchRawMarkdown(rawUrl: string): Promise<string> {
  const res = await fetch(rawUrl, {
    method: 'GET',
    // Raw GitHub content is hosted on raw.githubusercontent.com which rejects
    // credentialed requests with wildcard CORS headers.
    credentials: 'omit',
  });
  if (!res.ok) {
    throw new RawFetchError(`Failed to fetch raw markdown (HTTP ${res.status}).`);
  }
  return await res.text();
}
