import { session, systemPreferences, WebContents, WebFrameMain } from 'electron';
import { isAllowedUrl } from './utils';

const ALLOWED_PERMISSIONS = [
  'notifications',
  'media',
  'mediaKeySystem',
  'clipboard-read',
  'clipboard-sanitized-write',
] as const;

const CHECK_PERMISSIONS = [
  'notifications',
  'media',
  'mediaKeySystem',
  'clipboard-read',
] as const;

function isAllowedOrigin(origin: string): boolean {
  if (!origin || origin === 'null' || origin === 'about:blank') {
    return false;
  }

  try {
    const url = origin.includes('://') ? origin : `https://${origin}`;
    return isAllowedUrl(url);
  } catch {
    return false;
  }
}

function collectFrameSources(frame: WebFrameMain | null, sources: string[]): void {
  if (!frame || frame.isDestroyed()) {
    return;
  }

  if (frame.origin) {
    sources.push(frame.origin);
  }
  if (frame.url) {
    sources.push(frame.url);
  }
}

function getTrustedUrls(webContents: WebContents | null): string[] {
  if (!webContents || webContents.isDestroyed()) {
    return [];
  }

  const sources: string[] = [];
  const currentUrl = webContents.getURL();
  if (currentUrl) {
    sources.push(currentUrl);
  }

  collectFrameSources(webContents.mainFrame, sources);

  let opener = webContents.opener;
  while (opener && !opener.isDestroyed()) {
    collectFrameSources(opener, sources);
    opener = opener.parent;
  }

  return sources;
}

function isTrustedWebContents(webContents: WebContents | null): boolean {
  return getTrustedUrls(webContents).some((source) => isAllowedUrl(source) || isAllowedOrigin(source));
}

function isTrustedPermissionContext(
  webContents: WebContents | null,
  ...candidateOrigins: (string | undefined)[]
): boolean {
  if (candidateOrigins.some((origin) => origin && isAllowedOrigin(origin))) {
    return true;
  }

  if (candidateOrigins.some((url) => url && isAllowedUrl(url))) {
    return true;
  }

  return isTrustedWebContents(webContents);
}

function isAllowedPermission(permission: string): boolean {
  return (ALLOWED_PERMISSIONS as readonly string[]).includes(permission);
}

function isAllowedCheckPermission(permission: string): boolean {
  return (CHECK_PERMISSIONS as readonly string[]).includes(permission);
}

function isMediaPermission(permission: string): boolean {
  return permission === 'media';
}

async function requestAccessIfNeeded(
  mediaType: 'microphone' | 'camera'
): Promise<boolean> {
  const status = systemPreferences.getMediaAccessStatus(mediaType);
  console.log(`${mediaType} status:`, status);

  if (status === 'granted') {
    return true;
  }

  const granted = await systemPreferences.askForMediaAccess(mediaType);
  console.log(`${mediaType} access:`, granted ? 'granted' : 'denied');
  return granted;
}

export async function requestMediaAccess(): Promise<void> {
  if (process.platform !== 'darwin') {
    return;
  }

  await requestAccessIfNeeded('microphone');
  await requestAccessIfNeeded('camera');
}

export async function ensureMediaAccess(): Promise<void> {
  await requestMediaAccess();
}

export function setupPermissions(): void {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      console.log('Permission request:', permission, details.requestingUrl, details);

      if (isMediaPermission(permission)) {
        callback(true);
        return;
      }

      if (!isAllowedPermission(permission)) {
        callback(false);
        return;
      }

      const mediaDetails = details as { securityOrigin?: string };
      const allowed = isTrustedPermissionContext(
        webContents,
        details.requestingUrl,
        mediaDetails.securityOrigin
      );

      callback(allowed);
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      if (isMediaPermission(permission)) {
        return true;
      }

      if (!isAllowedCheckPermission(permission)) {
        return false;
      }

      return isTrustedPermissionContext(
        webContents,
        requestingOrigin,
        details.securityOrigin,
        details.requestingUrl,
        details.embeddingOrigin
      );
    }
  );
}
