import fs from 'node:fs/promises';
const base='https://ais.caa.gov.tw/eaip/AIRAC%20AIP%20AMDT%2004-26_2026_10_01/eAIP/';
const menu=await fs.readFile('menu.html','utf8');
const link=[...menu.matchAll(/href=['"]([^'"]+)['"]/g)].map(m=>m[1]).find(s=>s.startsWith('RC-AD 2 RCSS ')&&s.includes('-en-GB.html'));
const html=await(await fetch(new URL(link,base))).text();await fs.writeFile('songshan-official.html',html);
const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1].replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ').trim());console.log(rows.filter(s=>/VOR\/DME|VOT|DME\s|NDB\s/.test(s)).slice(0,30).join('\n'));
await fs.writeFile('songshan-source-url.txt',new URL(link,base).href);
