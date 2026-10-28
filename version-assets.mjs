import fs from 'node:fs';
const version=process.argv[2]||'11';
for(const file of ['workspace.html','index.html','workspace.js','waypoint-picker.mjs','sw.js','sw-v7.source']){let s=fs.readFileSync('dist/'+file,'utf8').replace(/workspace-model\.mjs(?:\?v=\d+)?/g,'workspace-model.mjs?v='+version).replace(/\?v=\d+/g,'?v='+version).replace(/map-workspace-v\d+/g,'map-workspace-v'+version);fs.writeFileSync('dist/'+file,s)}
