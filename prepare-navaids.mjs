import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='https://ais.caa.gov.tw/eaip/AIRAC%20AIP%20AMDT%2004-26_2026_10_01/eAIP/';
const index=await fs.readFile('menu.html','utf8'),linkNames=[...index.matchAll(/href=['"]([^'"]+)['"]/g)].map(m=>m[1]);
const aids=new Map(),airportCodes=['RCSS','RCTP','RCKH','RCMQ','RCNN','RCQC','RCKU','RCYU','RCFN','RCBS','RCMT','RCFG','RCKW','RCLY','RCGI'];
function extract(html,source,airport=''){const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1].replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim());for(const text of rows){const type=text.match(/^(?:[A-Z][A-Z /-]*?\s+)?(VOR\/DME|DME|NDB)\b/)?.[1],pos=text.match(/(\d{6}(?:\.\d+)?)N\s+(\d{7}(?:\.\d+)?)E/),ident=text.match(/\s([A-Z][A-Z0-9]{0,5})\s+(?:\d+(?:\.\d+)?\s+(?:MHZ|KHZ)|\(CH)/)?.[1];if(!type||!pos||!ident)continue;const key=type+':'+ident;if(aids.has(key))continue;const dec=s=>{const n=Number(s);return Math.floor(n/10000)+Math.floor(n%10000/100)/60+n%100/3600};aids.set(key,{id:key,name:ident,station:text.split(type)[0].trim()||airport,category:type,points:[dec(pos[1]),dec(pos[2]),0],frequency:text.match(/\d+(?:\.\d+)?\s+(?:MHZ|KHZ)(?:\s+\(CH[^)]+\))?|\(CH[^)]+\)/)?.[0]||'',source,remarks:text})}}
extract(await fs.readFile('hcn-official.html','utf8'),base+'RC-ENR%204.1-en-GB.html');
for(const code of airportCodes){const href=linkNames.find(s=>s.startsWith('RC-AD 2 '+code+' ')&&s.includes('-en-GB.html'));if(!href)continue;const url=new URL(href,base).href;const response=await fetch(url);if(!response.ok)throw Error(code+' AIP unavailable');extract(await response.text(),url,code)}
const names={APU:'安部／大屯山',HCN:'恆春',HLG:'後龍',HLN:'花蓮',GID:'綠島',MKG:'馬公',TNN:'西港',TSI:'臺北松山'};
for(const aid of aids.values())if(names[aid.name]&&aid.category==='VOR/DME')aid.station=names[aid.name];
const vor=[...aids.values()].filter(a=>a.category==='VOR/DME');assert.equal(vor.length,8,'Official VOR/DME count must be eight');assert(vor.some(a=>a.name==='TSI'));
const result={effective:'2026-10-01',equipmentSource:'https://www.anws.gov.tw/FlightService/Electronic/services/nav.htm',source:base+'RC-ENR%204.1-en-GB.html',note:'VOR/DME 8 座依 ENR 4.1 與 RCSS AD 2.19 列示。DME 與 NDB 補充各機場 AD 2.19 公開表；NDB 含機場定位臺，分類數量不等同總臺裝備統計。靜態 AIP 不代表即時運作狀態，請查 NOTAM。',aids:[...aids.values()]};
await fs.writeFile('dist/navaids.json',JSON.stringify(result));console.log(Object.fromEntries(['VOR/DME','DME','NDB'].map(c=>[c,result.aids.filter(a=>a.category===c).length])));

