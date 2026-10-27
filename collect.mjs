import fs from 'node:fs/promises';
const base='https://ais.caa.gov.tw/eaip/AIRAC%20AIP%20AMDT%2003-26_2026_08_06/eAIP/';
const menu=await (await fetch(base+'menu.html')).text();
const links=[...menu.matchAll(/href=['"]([^'"]+)['"][^>]*>([^<]*)/g)].filter(m=>/RC-ENR(?:%20| )3\.[12](?:%20| )[^"#]+-en-GB\.html/.test(m[1]));
const seen=new Set(),routes=[];
for(const m of links){let href=m[1];if(seen.has(href))continue;seen.add(href);const html=await(await fetch(new URL(href,base))).text();
const cells=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];let points=[];
for(const row of cells){const txt=row[1].replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ');const c=txt.match(/(\d{6}(?:\.\d+)?)\s*N\s*(\d{7}(?:\.\d+)?)\s*E/);if(!c)continue;const pre=txt.slice(0,c.index);const names=pre.match(/\b[A-Z][A-Z0-9]{2,}\b/g)||[];let name=names.find(n=>!['VOR','DME','NDB','FIR','BDRY'].includes(n))||row[0].match(/<tr[^>]*id="([^"]+?)row\d+"/i)?.[1]||'FIX';
const dec=s=>{const n=Number(s);return Math.floor(n/10000)+Math.floor(n%10000/100)/60+(n%100)/3600};points.push({name,lat:dec(c[1]),lng:dec(c[2])});}
const name=decodeURIComponent(href).match(/3\.[12] (.+)-en-GB/)[1];if(points.length>1)routes.push({name,points,source:new URL(href,base).href});}
await fs.writeFile('dist/routes.json',JSON.stringify({effective:'2026-08-06',source:base+'menu.html',routes}));console.log(routes.length+' routes, '+routes.reduce((n,r)=>n+r.points.length,0)+' points');

