/* X-Pass per iPhone - service worker
   Salva sul telefono tutti i file dell'app, così X-Pass funziona anche senza internet.
   VERSIONE viene cambiata automaticamente da GitHub a ogni pubblicazione: il telefono
   se ne accorge alla prima apertura con internet, scarica la versione nuova e la usa.
   I dati (cassaforte, impostazioni) NON sono qui: restano nel database del telefono e non vengono toccati. */
const VERSIONE = "__BUILD__";
const CACHE = "xpass-" + VERSIONE;
const FILE = ["index.html", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  // Scarica tutti i file ignorando le copie vecchie; se anche uno solo non arriva, resta la versione precedente
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILE.map(f =>
        fetch(new Request(f, { cache: "reload" })).then(r => {
          if (!r.ok) throw new Error(f + " " + r.status);
          return c.put(f, r);
        }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x.startsWith("xpass-") && x !== CACHE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    e.respondWith(caches.open(CACHE).then(c => c.match("index.html")).then(x => x || fetch(r)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r, { ignoreSearch: true })).then(x => x || fetch(r)));
});
