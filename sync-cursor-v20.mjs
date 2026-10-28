import fs from 'node:fs';let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("let future=[],inspected=null;", "let cursorReady=false;let future=[],inspected=null;");
j=j.replace("function updateCursor(){ $('position').textContent=pair(lastCursor)}", "function updateCursor(){ $('position').textContent=pair(lastCursor);if(cursorReady){if(!lastHeightPosition||lastHeightPosition[0]!==lastCursor[0]||lastHeightPosition[1]!==lastCursor[1]){const request=++altitudeRequest;clearTimeout(altitudeTimer);currentHeight=null;heightMode='';offlineTileHeight(...lastCursor).then(hit=>{if(request===altitudeRequest&&hit){currentHeight=hit.elevation;heightMode='離線地形 z'+hit.region.z;paintCursorHeight()}}).catch(()=>{})}paintCursorHeight()}}");
j=j.replace("cursorIcon.bindTooltip(cursorReadout);", "cursorIcon.bindTooltip(cursorReadout);cursorReady=true;");
j=j.replace("function paintCursorHeight(){const text=", "function paintCursorHeight(){lastHeightPosition=[...lastCursor];const text=");
fs.writeFileSync('dist/workspace.js',j);
