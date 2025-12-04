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
    console.log('Updating badge to:', count);
    updateBadge(count);

    // Also update dock bounce on macOS for new messages (only when count increases)
    if (count > 0) {
      const mainWindow = getMainWindow();
      if (process.platform === 'darwin' && !mainWindow?.isFocused()) {
        app.dock?.bounce('informational');
      }
    }
  });
}
