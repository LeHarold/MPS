import {parseCoordinate} from './coordinates.mjs';
export function parseSearchPosition(raw){
 const text=raw.trim().replace(/，/g,',').replace(/；/g,';');let parts=text.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
 if(parts.length===1){const directed=text.match(/^(.+?[NS])\s*(.+?[EW])$/i);if(directed)parts=directed.slice(1);else{const n=text.split(/\s+/);if(n.length===2)parts=n;else if(n.length===4||n.length===6)parts=[n.slice(0,n.length/2).join(' '),n.slice(n.length/2).join(' ')]}}
 if(parts.length!==2)throw Error('請輸入「緯度, 經度」，可用十進位或度分秒');return[parseCoordinate(parts[0],true),parseCoordinate(parts[1],false),0];
}
export function searchCatalog(items,query,limit=60){const q=query.trim().toLocaleLowerCase();if(!q)return[];return items.map((item,index)=>{const name=item.name.toLocaleLowerCase(),words=(item.name+' '+(item.detail||'')).toLocaleLowerCase();return{item,index,rank:name===q?0:name.startsWith(q)?1:words.includes(q)?2:99}}).filter(r=>r.rank<99).sort((a,b)=>a.rank-b.rank||a.index-b.index).slice(0,limit).map(r=>r.item)}
export function placeLabelBoxes(items,bounds,obstacles=[],hideOverflow=false){
 const used=obstacles.map(r=>({...r})),results=[];const offsets=[[0,0]];for(let r=18;r<=180;r+=18)for(let a=0;a<8;a++)offsets.push([Math.cos(a*Math.PI/4)*r,Math.sin(a*Math.PI/4)*r]);
 const overlap=(a,b)=>a.x<b.x+b.w+3&&a.x+a.w+3>b.x&&a.y<b.y+b.h+3&&a.y+a.h+3>b.y;
 for(const item of [...items].sort((a,b)=>b.priority-a.priority)){let choice=null;const candidates=item.fixed?[[0,0]]:offsets;for(const[dx,dy]of candidates){const r={x:item.x+dx,y:item.y+dy,w:item.w,h:item.h};if(!item.fixed&&(r.x<bounds.x||r.y<bounds.y||r.x+r.w>bounds.x+bounds.w||r.y+r.h>bounds.y+bounds.h))continue;if(!used.some(b=>overlap(r,b))){choice={...r,dx,dy};break}}
 const hidden=!choice&&!item.fixed&&hideOverflow;if(!choice)choice={x:item.x,y:item.y,w:item.w,h:item.h,dx:0,dy:0};if(!hidden)used.push(choice);results.push({id:item.id,dx:choice.dx,dy:choice.dy,hidden});}return results;
}
export function labelRank(category,preference='user'){const ranks={selected:1000,manual:950,distance:850,user:800,waypoint:650,route:500,reference:450,airport:400};return category===preference?900:(ranks[category]||300)}
export function calibrationDistance(ratio,unitFactor){if(!(ratio>0&&unitFactor>0))throw Error('Invalid scale');return ratio*.05/unitFactor}
export function readPrintTemplate(template){const p=structuredClone(template);if(!['a4','a3','letter'].includes(p.paper)||!['landscape','portrait'].includes(p.orientation)||!Number.isFinite(p.ratio)||p.ratio<100||p.ratio>1e8)throw Error('列印版型不正確');return p}
export async function openBackupHistory(){
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('mps-backup-history',1);r.onupgradeneeded=()=>r.result.createObjectStore('versions',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 const tx=(mode,action)=>new Promise((resolve,reject)=>{const t=db.transaction('versions',mode),r=action(t.objectStore('versions'));t.oncomplete=()=>resolve(r?.result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('備份交易失敗'))});
 return{put:record=>tx('readwrite',s=>s.put(record)),get:id=>tx('readonly',s=>s.get(id)),list:async()=>((await tx('readonly',s=>s.getAll()))||[]).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),remove:id=>tx('readwrite',s=>s.delete(id))};
}
