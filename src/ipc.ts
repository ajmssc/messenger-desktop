import { app, ipcMain, Notification, BrowserWindow } from 'electron';
import { updateBadge } from './badge';

export function setupIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Handle notification from preload
  ipcMain.on('show-notification', (_event, { title, body }) => {
    console.log('Showing native notification:', title, body);
    const notification = new Notification({
      title,
      body,
      silent: false,
    });

    notification.on('click', () => {
      const mainWindow = getMainWindow();
      mainWindow?.show();
      mainWindow?.focus();
    });

    notification.show();
  });

  // Handle badge count updates from preload
  ipcMain.on('update-badge', (_event, count: number) => {
    // Only update if count is > 0 (don't reset from injected script, let title handler do that)
    if (count > 0) {
      updateBadge(count);

      // Also update dock bounce on macOS for new messages
      const mainWindow = getMainWindow();
      if (process.platform === 'darwin' && !mainWindow?.isFocused()) {
        app.dock?.bounce('informational');
      }
    }
  });
}
