import fs from 'node:fs';
function files(root,prefix=''){return fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(root+'/'+e.name,prefix+e.name+'/'):[prefix+e.name])}
const list=files('dist').filter(p=>p!=='sw-v7.source');if(!list.includes('offline-files.json'))list.push('offline-files.json');fs.writeFileSync('dist/offline-files.json',JSON.stringify(list,null,2));
