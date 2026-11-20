/** http(s) only, so a pasted `javascript:` or `file:` URL can never become a request target. */
export function parseApiUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
