import fs from 'node:fs';let s=fs.readFileSync('dist/workspace.js','utf8');
// Instruments keep their original direct drag, two-finger gesture and compass draw handlers.
const start=s.indexOf('let compassPressAt=0; function resolveMapMove('),end=s.indexOf(" if(tool!=='pan')return null;const point=",start);
const prefix=s.slice(start,end),scale=prefix.slice(prefix.indexOf("if(node.closest?.('#map-scale'))"),prefix.indexOf('\n const instrument='));
s=s.slice(0,start)+"function resolveMapMove(node,host,ownerMap=map,event){if(node.closest?.('.instrument,.compass-center,#compass-end,.compass-arm-label'))return null;const label=node.closest?.('.leaflet-tooltip');if(label&&moveLabels.has(label)){const record=moveLabels.get(label);if(ownerMap===map&&compassGroup.hasLayer(record.label._source||record.label))return null;return labelMoveTarget(record,host)}if(ownerMap!==map)return null;"+scale+'\n'+s.slice(end);
s=s.replace('else compassFollowing=false;save()', 'else compassFollowing=!compassFollowing;save()');
s=s.replace("return{name:grouped?'群組：'+layer.name:found.object.name,rotate:","return{name:grouped?'群組：'+layer.name:found.object.name,tap(){if(tool!=='pan')return;if(found.object.type==='point'||anchorIndex===null)inspectObject(id);else inspectVertex(id,anchorIndex)},rotate:");
s=s.replace("return{name:el.textContent.trim(),rotate:false", "return{name:el.textContent.trim(),tap(){if(!isPrint)el.click()},rotate:false");
s=s.replace("else source?.openPopup?.()}});", "else if(label.options.mpsCoordinateObjectId)inspectVertex(label.options.mpsCoordinateObjectId,label.options.mpsPointIndex||0);else source?.openPopup?.()}});");
fs.writeFileSync('dist/workspace.js',s);
for(const file of ['dist/index.html','dist/workspace.html']){let html=fs.readFileSync(file,'utf8');html=html.replaceAll('長按後以十字箭頭移動、外環旋轉及 ↗ 縮放','拖曳移動；雙指旋轉及縮放').replaceAll('長按尺規顯示操作控制：十字箭頭移動、外環旋轉、↗ 縮放；0 點吸附後鎖定，點擊 0 解鎖。','直接拖曳尺規移動，雙指可旋轉及縮放；0 點吸附後鎖定，點擊 0 解鎖；鎖定時拖另一端旋轉及伸縮。');fs.writeFileSync(file,html)}
