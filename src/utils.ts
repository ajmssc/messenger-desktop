export const ALLOWED_DOMAINS = [
  'messenger.com',
  'facebook.com',
  'fb.com',
  'meta.com',
  'fbcdn.net',
  'fbsbx.com',
  'facebook.net',
];

// Fallback Chrome major used only if the running Chromium version can't be read
// (e.g. when this module is imported outside of an Electron process, such as tests).
// Keep this reasonably recent, but the real value normally comes from Electron below.
const FALLBACK_CHROME_MAJOR = 140;

/**
 * Returns the Chromium major version that Electron is actually running.
 *
 * Deriving the User-Agent from the live engine (instead of hardcoding a version)
 * means the UA advances automatically every time Electron is upgraded, so it never
 * goes stale and gets flagged by Facebook/Messenger as a suspicious/outdated browser.
 * It also guarantees the *claimed* Chrome version matches the *actual* rendering
 * engine, which is exactly what a real browser reports and what fingerprint checks
 * look for.
 */
function getChromeMajorVersion(): number {
  const chromeVersion = process.versions?.chrome;
  if (chromeVersion) {
    const major = parseInt(chromeVersion.split('.')[0], 10);
    if (!Number.isNaN(major)) {
      return major;
    }
  }
  return FALLBACK_CHROME_MAJOR;
}

/**
 * Returns the platform token for the User-Agent based on the real OS the app is
 * running on. Chrome's "UA reduction" freezes these OS strings to a fixed set of
 * values, so we mirror the exact tokens a current Chrome build emits per platform.
 */
function getPlatformToken(): string {
  switch (process.platform) {
    case 'darwin':
      return 'Macintosh; Intel Mac OS X 10_15_7';
    case 'win32':
      return 'Windows NT 10.0; Win64; x64';
    default:
      // Linux and any other Unix-like platform.
      return 'X11; Linux x86_64';
  }
}

/**
 * Builds a modern, "reduced" Chrome User-Agent string that tracks the bundled
 * Chromium version and the current OS. Format matches post-UA-reduction Chrome:
 * the minor/build/patch segments are always frozen to `0.0.0`.
 */
export function buildUserAgent(): string {
  const platform = getPlatformToken();
  const chromeMajor = getChromeMajorVersion();
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`;
}

// Computed once at startup from the running Electron/Chromium build. Existing call
// sites keep importing USER_AGENT unchanged; it just stays current automatically now.
export const USER_AGENT = buildUserAgent();

export function isAllowedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}
