import fs from 'node:fs';let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("onChange:()=>save(),onCopy:","onChange:()=>{save();renderInstruments()},onCopy:");
j=j.replace("objectPaths.set(o.id,geometry)}}}","objectPaths.set(o.id,geometry)}}renderInstruments()}");
fs.writeFileSync('dist/workspace.js',j);
for(const name of ['index.html','workspace.html']){let h=fs.readFileSync('dist/'+name,'utf8').replace('href="manifest.webmanifest"','href="manifest.webmanifest?v=27"');fs.writeFileSync('dist/'+name,h)}
for(const name of ['sw.js','sw-v7.source']){let sw=fs.readFileSync('dist/'+name,'utf8').replace("'manifest.webmanifest'","'manifest.webmanifest?v=27'");fs.writeFileSync('dist/'+name,sw)}
