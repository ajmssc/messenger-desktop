import { ipcRenderer } from 'electron';

// Listen for messages from the injected script
window.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  if (event.data.type === 'notification') {
    const { title, options } = event.data;
    ipcRenderer.send('show-notification', {
      title,
      body: options?.body || '',
    });
  }

  if (event.data.type === 'unread-count') {
    ipcRenderer.send('update-badge', event.data.count);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Messenger Desktop loaded');
});
