// 旧オリジン専用。新しい /fretboard/ の Service Worker とは共有しない。
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map(async (client) => {
      // 旧SWが export.html を旧アプリへ置き換えた画面も再読込する。
      try {
        await client.navigate(client.url);
      } catch {
        // 閉じられた画面があっても、他の画面の片付けを続ける。
      }
    }));
  })());
});
