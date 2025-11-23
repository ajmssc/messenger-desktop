import { app } from 'electron';

let currentBadgeCount = 0;

// Update dock badge - use dock.setBadge for macOS (works better for unsigned/dev apps)
export function updateBadge(count: number): void {
  if (count === currentBadgeCount) return;
  currentBadgeCount = count;

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setBadge(count > 0 ? count.toString() : '');
  } else {
    app.setBadgeCount(count);
  }
}

export function getCurrentBadgeCount(): number {
  return currentBadgeCount;
}
