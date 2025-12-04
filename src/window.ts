import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { isAllowedUrl, USER_AGENT } from './utils';
import { updateBadge } from './badge';

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.webContents.setUserAgent(USER_AGENT);
  mainWindow.loadURL('https://www.messenger.com');

  setupWindowOpenHandler(mainWindow);
  setupNavigationHandler(mainWindow);
  setupTitleHandler(mainWindow);
  setupContentInjection(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}

function setupWindowOpenHandler(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(({ url, frameName }) => {
    console.log('Window open request:', { url, frameName });

    // Allow popups for messenger/facebook domains or blank popups (needed for calls)
    if (!url || url === '' || url === 'about:blank' || isAllowedUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 800,
          height: 600,
          webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
          },
        },
      };
    }

    // Open external URLs in default browser (only valid http/https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url).catch((err) => {
        console.error('Failed to open external URL:', err);
      });
    }
    return { action: 'deny' };
  });
}

function setupNavigationHandler(window: BrowserWindow): void {
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function setupTitleHandler(window: BrowserWindow): void {
  window.on('page-title-updated', (_event, title) => {
    console.log('Page title updated:', title);
    const match = title.match(/^\((\d+)\)/);
    if (match) {
      const count = parseInt(match[1], 10);
      console.log('Setting badge count:', count);
      updateBadge(count);
    }
  });
}

function setupContentInjection(window: BrowserWindow): void {
  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript(`
      (function() {
        // Intercept notifications
        const OriginalNotification = window.Notification;

        window.Notification = function(title, options) {
          window.postMessage({ type: 'notification', title, options }, '*');
          return new OriginalNotification(title, options);
        };

        window.Notification.permission = OriginalNotification.permission;
        window.Notification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);

        // Monitor unread count from title
        let lastCount = 0;
        let lastCountTimestamp = 0;
        let resetTimeoutId = null;
        const RESET_TIMEOUT_MS = 3000; // Reset badge if no count seen for 3 seconds

        function checkUnreadCount() {
          const title = document.title;
          const match = title.match(/^\\((\\d+)\\)/);

          if (match) {
            // We found a count in the title
            const count = parseInt(match[1], 10);
            lastCountTimestamp = Date.now();

            // Clear any pending reset timeout
            if (resetTimeoutId) {
              clearTimeout(resetTimeoutId);
              resetTimeoutId = null;
            }

            if (count !== lastCount) {
              lastCount = count;
              window.postMessage({ type: 'unread-count', count }, '*');
            }
          } else {
            // No count in the title - if we previously had a count, start the reset timeout
            if (lastCount > 0 && !resetTimeoutId) {
              resetTimeoutId = setTimeout(() => {
                // If we still haven't seen a count after the timeout, reset to 0
                if (lastCount !== 0) {
                  lastCount = 0;
                  window.postMessage({ type: 'unread-count', count: 0 }, '*');
                }
                resetTimeoutId = null;
              }, RESET_TIMEOUT_MS);
            }
          }
        }

        // Check periodically and on title changes
        setInterval(checkUnreadCount, 1000);

        // Also observe title changes via MutationObserver
        const titleEl = document.querySelector('title');
        if (titleEl) {
          new MutationObserver(checkUnreadCount).observe(titleEl, { childList: true, characterData: true, subtree: true });
        }

        // Initial check
        checkUnreadCount();

        console.log('Messenger Desktop: Notification and badge interceptor installed');
      })();
    `);
  });

  window.webContents.on('console-message', (_event, _level, message) => {
    if (message.includes('Notification interceptor')) {
      console.log(message);
    }
  });
}
