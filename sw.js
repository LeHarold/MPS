const CACHE='map-workspace-v190',FILES=['live-vehicles.mjs?v=190','spatial-objects.mjs?v=190','compact-waypoints.mjs?v=190','coordinate-excel.mjs?v=190','line-appearance.mjs?v=190','navigation-ruler.mjs?v=190','navigation-ruler.css?v=190','vendor/wmm2025.mjs','vendor/wmm2025.LICENSE','workspace-storage.mjs?v=190','display-performance.mjs?v=190','area-labels.mjs?v=190','label-stability.mjs?v=190','history-timeline.mjs?v=190','movement.mjs?v=190','label-rotation.mjs?v=190','point-snap.mjs?v=190','ios-pwa.mjs?v=190','action-history.mjs?v=190','license-transfer.mjs?v=190','device-transfer.mjs?v=190','print-raster.mjs?v=190','./','index.html','workspace.css?v=190','workspace.js?v=190','point-relations.mjs?v=190','label-visibility.mjs?v=190','map-editing.mjs?v=190','press-controls.mjs?v=190','workspace-model.mjs?v=190','waypoint-picker.mjs?v=190','instrument-lock.mjs?v=190','elevation-store.mjs?v=190','map-inputs.mjs?v=190','coordinates.mjs','authorization.mjs?v=190','licensed-tools.mjs?v=190','license-public-key.json?v=190','project-merge.mjs?v=190','project-merge-worker.mjs?v=190','workspace-ux.mjs?v=190','workspace-interactions.mjs?v=190','manifest.webmanifest?v=190','icon.svg','icon-192.png','icon-512.png','vendor/leaflet.js','vendor/leaflet.css','vendor/html2canvas.min.js','vendor/jspdf.umd.min.js','vendor/jszip.min.js','offline-bootstrap.js','offline-files.json','world.json?v=190','routes.json?v=190','references.json?v=190','navaids.json?v=190','data-sources.html','airports.json?v=190'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type==='MPS_CACHE_STATUS')event.ports?.[0]?.postMessage({cache:CACHE})});
function normalFetch(event){const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);if(request.mode==='navigate'){const home=new URL(self.registration.scope),shell=url.pathname===home.pathname||url.pathname===new URL('index.html',home).pathname,key=shell?'index.html':request;try{const response=await fetch(request);if(!response.ok)throw Error('navigation unavailable');try{await cache.put(key,response.clone())}catch{}return response}catch{return await cache.match(key)||await caches.match(key)}}const cached=await cache.match(request)||await caches.match(request);if(cached)return cached;try{const response=await fetch(request);if(response.ok)try{await cache.put(request,response.clone())}catch{}return response}catch(error){const fallback=await cache.match(request,{ignoreSearch:true});if(fallback)return fallback;throw error}})())}
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);event.respondWith(handleOfflineTest(event,request,url));});
async function handleOfflineTest(event,request,url){
 const client=event.clientId?await self.clients.get(event.clientId):null;
 const test=url.searchParams.has('mps-offline-test')||(client&&new URL(client.url).searchParams.has('mps-offline-test'));
 if(test){
  if(request.method!=='GET'||url.origin!==location.origin)return new Response('Offline test',{status:503});
  const cache=await caches.open(CACHE);
  const key=request.mode==='navigate'?'index.html':request;
  return await cache.match(key)||new Response('Missing offline resource',{status:503});
 }
 let response;
 normalFetch({request,clientId:null,respondWith:value=>{response=value;}});
 return response||fetch(request);
}
