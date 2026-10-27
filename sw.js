const CACHE='map-workspace-v6',FILES=['./','index.html','style.css?v=6','app.js?v=6','coordinates.mjs','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','vendor/leaflet.js','vendor/leaflet.css','world.json','routes.json'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request))) });






