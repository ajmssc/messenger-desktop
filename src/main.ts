import { app, shell } from 'electron';
import { createWindow, getMainWindow } from './window';
import { ensureMediaAccess, requestMediaAccess, setupPermissions } from './permissions';
import { setupIpcHandlers } from './ipc';
import { isAllowedUrl, USER_AGENT } from './utils';

// Set app name for notifications
app.setName('Messenger');

app.on('ready', async () => {
  await requestMediaAccess();
  setupPermissions();
  setupIpcHandlers(getMainWindow);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (process.platform === 'darwin') {
    await ensureMediaAccess();
  }

  if (getMainWindow() === null) {
    createWindow();
  }
});

app.on('browser-window-focus', async () => {
  if (process.platform === 'darwin') {
    await ensureMediaAccess();
  }
});

// Security: Handle new window creation
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url).catch((err) => {
          console.error('Failed to open external URL:', err);
        });
      }
    }
  });

  // Set user agent for popup windows (calls)
  contents.setUserAgent(USER_AGENT);
});
