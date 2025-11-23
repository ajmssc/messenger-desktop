import { session, systemPreferences } from 'electron';
import { isAllowedUrl } from './utils';

const ALLOWED_PERMISSIONS = [
  'notifications',
  'media',
  'mediaKeySystem',
  'clipboard-read',
  'clipboard-sanitized-write',
];

export async function requestMediaAccess(): Promise<void> {
  if (process.platform === 'darwin') {
    const micStatus = await systemPreferences.askForMediaAccess('microphone');
    const camStatus = await systemPreferences.askForMediaAccess('camera');
    console.log('Microphone access:', micStatus ? 'granted' : 'denied');
    console.log('Camera access:', camStatus ? 'granted' : 'denied');
  }
}

export function setupPermissions(): void {
  // Handle permission requests from the page
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback, details) => {
      console.log('Permission request:', permission, details.requestingUrl);

      // Allow media permissions for messenger.com
      if (details.requestingUrl && isAllowedUrl(details.requestingUrl)) {
        if (ALLOWED_PERMISSIONS.includes(permission)) {
          callback(true);
          return;
        }
      }
      callback(false);
    }
  );

  // Handle permission checks (required for camera/microphone to work)
  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission, requestingOrigin) => {
      const checkPermissions = [
        'notifications',
        'media',
        'mediaKeySystem',
        'clipboard-read',
      ];

      if (isAllowedUrl(requestingOrigin) && checkPermissions.includes(permission)) {
        return true;
      }
      return false;
    }
  );
}
