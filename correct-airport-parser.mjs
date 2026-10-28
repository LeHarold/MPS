import fs from 'node:fs';
let s=fs.readFileSync('prepare-airports.mjs','utf8');
s=s.replace("const runwayRows=rows.filter", "const runwaySection=html.slice(html.indexOf('AD 2.12 RUNWAY'),html.indexOf('AD 2.13 DECLARED'));const runwayTableRows=[...runwaySection.matchAll(/<tr\\b[^>]*>([\\s\\S]*?)<\\/tr>/gi)].map(m=>m[1].replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\\s+/g,' ').trim());const runwayRows=runwayTableRows.filter");
s=s.replace(".replace('-en-GB.html','');airports.push", ".replace(/-en-GB.html.*$/,'');airports.push");
// Use true bearing of the runway endpoints, rather than magnetic runway numbers.
s=s.replace("await fs.writeFile('dist/airports.json'", "for(const a of airports){const p=a.runways[0]?.points;if(p){const rad=x=>x*Math.PI/180,d=rad(p[1][1]-p[0][1]),lat1=rad(p[0][0]),lat2=rad(p[1][0]);a.bearing=(Math.atan2(Math.sin(d)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(d))*180/Math.PI+360)%360}}\nawait fs.writeFile('dist/airports.json'");
fs.writeFileSync('prepare-airports.mjs',s);
