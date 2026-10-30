import fs from 'node:fs';
let s=fs.readFileSync('dist/workspace.js','utf8');
s="import {outerVertices,transformPoints,nearestPathFraction} from './map-editing.mjs?v=109';\nimport {createPressControls} from './press-controls.mjs?v=109';\n"+s;
s=s.replace("const map=L.map", "const moveLabels=new WeakMap(),distanceRecords=new WeakMap();\nconst map=L.map");
s=s.replace("const vertices=boxEditor.read(),points=orderedPolygon(vertices)","const inputs=boxEditor.read(),vertices=outerVertices(inputs),points=vertices.map(v=>[...v.position])");
s=s.replace("已依輸入順序建立區域，欄位已清空","已沿外圍建立區域，欄位已清空").replace("已依原始座標及順序建立 ","已沿輸入座標外圍建立 ");
s=s.replaceAll('3 NM','2 NM').replaceAll('3*1852','2*1852');
s=s.replace("object.intervalMarks={enabled:$('segment-marks-enabled').checked,spacingM,count}","object.intervalMarks={...object.intervalMarks,enabled:$('segment-marks-enabled').checked,spacingM,count}");
s=s.replace('x=-dy/n*5,y=dx/n*5','x=-dy/n*5*(object.intervalMarks.scale??1),y=dx/n*5*(object.intervalMarks.scale??1)');
const a=s.indexOf('function attachMoveLabel('),b=s.indexOf("map.on('layeradd',e=>attachMoveLabel",a);
s=s.slice(0,a)+`function attachMoveLabel(label,ownerMap){
 if(!(label instanceof L.Tooltip)||!label.options.permanent||label.options.className?.includes('cursor-readout'))return;
 const element=label.getElement(),at=label.getLatLng();if(!element||!at)return;
 label.options.mpsLabelKey||=element.textContent.trim()+'@'+at.lat.toFixed(7)+','+at.lng.toFixed(7);
 label.options.mpsBaseOffset||=[label.options.offset?.x||0,label.options.offset?.y||0];const base=label.options.mpsBaseOffset,isPrint=ownerMap!==map,scale=isPrint?ownerMap.getContainer().clientWidth/(pdfPreview?.mw||1):1,store=isPrint?'printLabelPositions':'labelPositions',saved=state.settings[store]?.[label.options.mpsLabelKey];
 if(saved)label.options.offset=L.point(base[0]+saved.x*scale,base[1]+saved.y*scale);label.options.offset=constrainNameOffset(label,ownerMap,label.options.offset||L.point(0,0));label.update();
 moveLabels.set(element,{label,ownerMap});element.style.pointerEvents='auto';element.style.touchAction='none';element.title='長按後使用十字箭頭移動';
 if(element.dataset.moveLabel)return;element.dataset.moveLabel='1';element.addEventListener('click',e=>{e.stopPropagation();if(isPrint||tool!=='pan')return;const source=label._source,point=source?.getElement?.();if(point?.dataset.objectId){const f=getObject(point.dataset.objectId);if(f?.object.type==='point')inspectObject(f.object.id);else if(f)inspectVertex(f.object.id,Number(point.dataset.vertexIndex)||0)}else source?.openPopup?.()});
}

`+s.slice(b);
const c=s.indexOf('function enableDistanceDrag('),d=s.indexOf('const pointMount=',c);
s=s.slice(0,c)+`function enableDistanceDrag(line,o){const label=line.getTooltip();if(!label||o.points.length<2)return;const path=o.points;
 const at=t=>{const v=t*(path.length-1),i=Math.min(path.length-2,Math.floor(v)),f=v-i;return L.latLng(path[i][0]+(path[i+1][0]-path[i][0])*f,path[i][1]+(path[i+1][1]-path[i][1])*f)};
 const position=()=>label.setLatLng(at(o.distanceLabelPosition??.5));line.on('tooltipopen',position);position();label.options.mpsDistancePoints=path;label.options.mpsDistanceKey=o.id||label.options.mpsLabelKey;label.options.mpsCategory='distance';const el=label.getElement();if(!el)return;distanceRecords.set(el,o);el.dataset.distanceDrag='1';el.classList.add('distance-drag-target');attachMoveLabel(label,map);el.addEventListener('click',e=>{e.stopPropagation();if(o.id)selectObject(o.id)});
}

`+s.slice(d);
// Keep polygon interiors transparent to hit-testing, while their vertices remain editable.
s=s.replace("if(element){element.setAttribute('data-geometry-id',o.id)","if(element){element.style.pointerEvents=o.type==='polygon'?'none':'stroke';element.setAttribute('data-geometry-id',o.id)");
s=s.replace("marker.options.mpsObjectId=object.id;marker.options.mpsPointIndex=index;", "marker.options.mpsObjectId=object.id;marker.options.mpsPointIndex=index;marker.dragging.disable();const handle=marker.getElement();if(handle){handle.dataset.objectId=object.id;handle.dataset.vertexIndex=String(index);handle.dataset.vertexHandle='true'}");
// All label connectors are rendered in one pass, including manual and coordinate labels.
s=s.replace("if(!enabled){$('label-layout-status')", "if(!enabled){renderLabelConnections(map);$('label-layout-status')");
s=s.replace("$('label-layout-status').textContent='名稱最大距離 2 NM", "renderLabelConnections(map);$('label-layout-status').textContent='名稱最大距離 2 NM");
s=s.replace("return !!el&&!label.areaPoints&&!/cursor-readout|object-coordinate-label|area-name-label/.test(classes)", "return !!el&&!/cursor-readout/.test(classes)");
s=s.replace("const at=label.getLatLng(),anchor=ownerMap.latLngToContainerPoint(at),values=", "const at=label.getLatLng(),anchor=ownerMap.latLngToContainerPoint(at),values=");
s=s.replace("pm.on('layeradd',e=>attachMoveLabel(e.layer,pm));for(const[name,z]", "pm.on('layeradd',e=>attachMoveLabel(e.layer,pm));pm.on('moveend',()=>renderLabelConnections(pm));for(const[name,z]");
s=s.replace("prepareNameConstraints(pm,root);printViewCenter=pm.getCenter();", "prepareNameConstraints(pm,root);renderLabelConnections(pm);printViewCenter=pm.getCenter();");
// Compass short clicks retain locking, but movement now uses the common long-press controls.
s=s.replace("else compassFollowing=!compassFollowing;save()", "else compassFollowing=false;save()");
// Replace old instruction text which described direct dragging.
s=s.replace("拖曳地圖平移。點一下標記查看資料", "拖曳地圖平移。長按物件顯示移動／旋轉／縮放控制。點一下標記查看資料");
fs.writeFileSync('dist/workspace.js',s);
