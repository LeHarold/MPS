import fs from'node:fs';let s=fs.readFileSync('dist/workspace.js','utf8');
s="import {applyPointMOMs,validatePointMOMs} from './point-relations.mjs?v=105';\n"+s;
const lines=s.split('\n'),index=lines.findIndex(l=>l.startsWith("$('apply-object').onclick=()=>"));if(index<0)throw Error('Apply handler missing');lines[index]=fs.readFileSync('apply-object-v106.txt','utf8').trim();s=lines.join('\n');
s=s.replace(".addTo(handles);marker.on('click'", ".addTo(handles);marker.options.mpsObjectId=object.id;marker.options.mpsPointIndex=index;marker.on('click'");
s=s.replace("const geo=objectPaths.get(object.id);if(object.type", "updateMOMGeometry();const geo=objectPaths.get(object.id);if(object.type");
s=s.replace("className:'object-coordinate-label'}).setLatLng(p)", "className:'object-coordinate-label',mpsCoordinateObjectId:o.id,mpsPointIndex:i}).setLatLng(p)");
s+='\n'+fs.readFileSync('mom-ui-v106.txt','utf8').replace('row.editor.read;','');
s+='\nconst objectsBeforeMOM=renderObjects;renderObjects=function(){const result=applyPointMOMs(state);objectsBeforeMOM();if(result.detached)save()};\n';
fs.writeFileSync('dist/workspace.js',s);
let model=fs.readFileSync('dist/workspace-model.mjs','utf8');model="import {validatePointMOMs} from './point-relations.mjs?v=105';\n"+model;model=model.replace('if(!ids.has(p.activeLayerId))','validatePointMOMs(p);\n if(!ids.has(p.activeLayerId))');fs.writeFileSync('dist/workspace-model.mjs',model);
for(const p of ['dist/sw.js','dist/sw-v7.source']){let text=fs.readFileSync(p,'utf8');text=text.replace("'workspace-model.mjs?v=104'","'point-relations.mjs?v=104','workspace-model.mjs?v=104'");fs.writeFileSync(p,text)}
let versions=fs.readFileSync('version-assets.mjs','utf8').replace("'project-merge-worker.mjs'","'workspace-model.mjs','project-merge-worker.mjs'");fs.writeFileSync('version-assets.mjs',versions);
