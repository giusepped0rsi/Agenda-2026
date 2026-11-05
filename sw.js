/* Agenda — funzionamento offline.
   Pagina: prima la rete (così ricevi gli aggiornamenti), se manca la connessione la copia salvata.
   Icone e manifest: dalla copia salvata.
   Quando pubblichi una nuova versione, cambia il numero qui sotto. */
const CACHE = 'agenda-v1';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate'){
    const net = fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    });
    const timeout = new Promise((_, rej) => setTimeout(rej, 3000));   // rete lenta: dopo 3 s usa la copia
    e.respondWith(Promise.race([net, timeout]).catch(() => caches.match('./index.html').then(r => r || net)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
