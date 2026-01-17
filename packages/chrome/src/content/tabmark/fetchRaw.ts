import { findRawUrlAnchor } from '../github/selectors';

export class RawFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RawFetchError';
  }
}

export function getRawUrlFromDom(): string {
  const raw = findRawUrlAnchor();
  const href = raw?.href;
  if (!href) {
    throw new RawFetchError('Raw link not found on this page.');
  }
  return href;
}

export async function fetchRawMarkdown(rawUrl: string): Promise<string> {
  const res = await fetch(rawUrl, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new RawFetchError(`Failed to fetch raw markdown (HTTP ${res.status}).`);
  }
  return await res.text();
}


