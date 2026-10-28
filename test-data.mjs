import fs from 'node:fs';import assert from 'node:assert/strict';
const read=name=>JSON.parse(fs.readFileSync('dist/'+name,'utf8'));
const aids=read('navaids.json'),vor=aids.aids.filter(a=>a.category==='VOR/DME');
assert.deepEqual(vor.map(a=>a.name).sort(),['APU','GID','HCN','HLG','HLN','MKG','TNN','TSI']);
const HCN=vor.find(a=>a.name==='HCN');assert(Math.abs(HCN.points[0]-(21+55/60+40/3600))<1e-9);assert(Math.abs(HCN.points[1]-(120+50/60+37/3600))<1e-9);
const ITSG=aids.aids.find(a=>a.id==='DME:ITSG');assert(Math.abs(ITSG.points[0]-(25+4/60+15.3/3600))<1e-9);assert(Math.abs(ITSG.points[1]-(121+32/60+35.8/3600))<1e-9);
function inside(p,ring){let result=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result}return result}
const world=read('world.json'),taiwan=world.features.find(f=>f.properties.NAME==='Taiwan');assert(taiwan.geometry.coordinates.some(poly=>inside([HCN.points[1],HCN.points[0]],poly[0])&&!poly.slice(1).some(r=>inside([HCN.points[1],HCN.points[0]],r))));
const refs=read('references.json'),baseline=refs.layers.find(r=>r.id==='official-baseline-taiwan');assert.equal(baseline.points.length,22);assert.equal(baseline.pathPoints.length,146);assert.equal(baseline.pointNames[0],'T1 三貂角');assert.equal(baseline.type,'line');assert(!refs.layers.some(r=>/12.*外界/.test(r.name)));
const sw=fs.readFileSync('dist/sw.js','utf8');for(const path of [...sw.matchAll(/'([^']+(?:\.html|\.js|\.mjs|\.json|\.css|\.svg|\.png|\.webmanifest)(?:\?v=7)?)'/g)].map(m=>m[1]))assert(fs.existsSync('dist/'+path.split('?')[0]),path);
assert(!/ASIA ATLAS|亞洲戰術地圖/.test(fs.readFileSync('dist/index.html','utf8')));
assert(fs.readFileSync('dist/index.html','utf8').includes('id="longitude-axis"'));assert(fs.readFileSync('dist/index.html','utf8').includes('id="latitude-axis"'));
console.log('PASS: eight official VOR/DME, HCN official coordinates and inside corrected land polygon, 22 official base points, 146 original baseline vertices, offline asset list, coordinate axes and removed branding');

