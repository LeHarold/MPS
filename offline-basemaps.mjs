export function normalizePack(info, base) {
  const {source, name, bounds, date, bytes} = info;
  if (!['protomaps','sentinel2'].includes(source) || typeof name !== 'string' || !name.trim()) throw Error('來源或圖包名稱不正確');
  if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite)) throw Error('範圍須提供西、南、東、北四個座標');
  const [w,s,e,n] = bounds;
  if (w < -180 || e > 180 || s < -85.051129 || n > 85.051129 || w >= e || s >= n) throw Error('圖包範圍無效');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) throw Error('缺少圖資日期');
  if (!Number.isSafeInteger(bytes) || bytes < 127) throw Error('缺少有效檔案大小');
  const url = new URL(info.url, base);
  if (url.protocol !== 'https:' || url.username || url.password || !url.pathname.endsWith('.pmtiles')) throw Error('須提供 HTTPS PMTiles 位址');
  return {source, name:name.trim(), bounds, date, bytes, url:url.href};
}

function packStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mps-offline-basemaps', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('packs');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function packTransaction(mode, run) {
  const db = await packStore();
  try {
    return await new Promise((resolve,reject) => {
      const tx = db.transaction('packs', mode);
      const request = run(tx.objectStore('packs'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = tx.onerror = () => reject(tx.error || Error('無法存取離線圖包'));
    });
  } finally { db.close(); }
}

export function readBasemapPack(source) {
  return packTransaction('readonly', store=>store.get(source));
}

export async function removeBasemapPack(pack) {
  if (globalThis.caches) {
    const urls = new Set([pack.url]);
    const bundled = pack.source === 'protomaps' ? 'taiwan-fujian-streets' : 'central-taiwan-sentinel';
    urls.add(new URL('packs/'+bundled+'.pmtiles', location.href).href);
    if (pack.source === 'sentinel2') urls.add(new URL('packs/taiwan-fujian-sentinel.pmtiles', location.href).href);
    const cacheNames = (await caches.keys()).filter(name=>name.startsWith('map-workspace-'));
    await Promise.all(cacheNames.map(async name=>{
      const cache = await caches.open(name);
      await Promise.all([...urls].filter(Boolean).map(url=>cache.delete(url)));
    }));
  }
  await packTransaction('readwrite', store=>store.delete(pack.source));
}

export async function downloadBasemapPack(pack, progress) {
  const response = await fetch(pack.url,{cache:"no-store"});
  if (!response.ok || !response.body) throw Error('無法下載圖包');
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const {done,value} = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > pack.bytes) { await reader.cancel(); throw Error('檔案大小超出清單所列大小'); }
    chunks.push(value);
    progress(received / pack.bytes);
  }
  if (received !== pack.bytes) throw Error('檔案大小與清單不符');
  const blob = new Blob(chunks);
  const archive = new pmtiles.PMTiles(new pmtiles.FileSource(new File([blob], 'map.pmtiles')));
  const header = await archive.getHeader();
  if (pack.source==='protomaps' ? header.tileType!==1 : ![2,3,4,5].includes(header.tileType)) throw Error('圖包圖磚類型與來源不符');
  const actual = [header.minLon,header.minLat,header.maxLon,header.maxLat];
  if (actual.some((value,index)=>Math.abs(value-pack.bounds[index])>.02)) throw Error('圖包實際範圍與清單不符');
  const entry={...pack, blob, revision:crypto.randomUUID(), maxZoom:header.maxZoom};
  await packTransaction('readwrite', store=>store.put(entry, pack.source));
  return entry;
}

export async function makeOfflineBasemap(L, pack) {
  const attribution=pack.source==='protomaps'?'© OpenStreetMap contributors · Protomaps':pack.imageryYears ? '<a href="https://cloudless.eox.at/">EOX Sentinel-2 cloudless</a> · Copernicus 2016–2017 · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · MPS 裁切與轉製' : 'Copernicus Sentinel-2 · 經轉製 · '+pack.date;
  const archive=new pmtiles.PMTiles(new pmtiles.FileSource(new File([pack.blob], pack.revision+'.pmtiles')));
  const header=await archive.getHeader();
  const [west,south,east,north]=pack.bounds;
  const bounds=[[south,west],[north,east]];
  if (pack.source==='protomaps') {
    const levelDiff=1;
    return protomapsL.leafletLayer({
      url:archive,pane:'basePane',flavor:'light',lang:'zh',attribution,bounds,noWrap:true,
      levelDiff,minNativeZoom:header.minZoom+levelDiff,maxDataZoom:header.maxZoom
    });
  }
  const mime={2:'image/png',3:'image/jpeg',4:'image/webp',5:'image/avif'}[header.tileType];
  const raster=L.gridLayer({
    pane:'basePane',attribution,bounds,
    minNativeZoom:header.minZoom,maxNativeZoom:header.maxZoom,maxZoom:22,noWrap:true
  });
  raster.createTile=function(coords,done){
    const image=document.createElement('img');
    image.alt='';
    archive.getZxy(coords.z,coords.x,coords.y).then(tile=>{
      if(!tile){done(null,image);return;}
      const objectUrl=URL.createObjectURL(new Blob([tile.data],{type:mime}));
      const finish=error=>{
        URL.revokeObjectURL(objectUrl);
        done(error,image);
      };
      image.onload=()=>finish(null);
      image.onerror=()=>finish(Error('衛星圖磚無法解碼'));
      image.src=objectUrl;
    }).catch(error=>done(error,image));
    return image;
  };
  return raster;
}
