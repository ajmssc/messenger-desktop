export const ALLOWED_DOMAINS = [
  'messenger.com',
  'facebook.com',
  'fb.com',
  'meta.com',
  'fbcdn.net',
  'fbsbx.com',
  'facebook.net',
];

export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';

export function isAllowedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}
