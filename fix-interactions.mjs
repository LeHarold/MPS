import fs from 'node:fs';
let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("if(prefs.names&&!(l instanceof L.CircleMarker))l.bindTooltip(ref.name,{permanent:true})", "if(!(l instanceof L.CircleMarker)){l.unbindTooltip();l.bindTooltip(ref.name,{permanent:prefs.names===true})}");
j=j.replace("const p=map.mouseEventToLatLng(e);draftPoints.push([p.lat,p.lng,0]);e.preventDefault()", "const bounds=mapElement.getBoundingClientRect(),p=map.containerPointToLatLng(snapDrawing([e.clientX-bounds.left,e.clientY-bounds.top]));draftPoints.push([p.lat,p.lng,0]);e.preventDefault()");
const extra=`
$('editor-panel').addEventListener('toggle',()=>{if(!$('editor-panel').open){handles.clearLayers();selected=null;renderObjects()}});
`;
j=j.replace("refreshUI();try{if(localStorage",extra+"\nrefreshUI();try{if(localStorage");
fs.writeFileSync('dist/workspace.js',j);
