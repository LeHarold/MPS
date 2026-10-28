import fs from 'node:fs';let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("L.control.zoom({position:'bottomright'}).addTo(map);",'');
j=j.replace("if(draftPoints.length)redrawDraft();toast('地圖單位", "if(tapeStart)renderTapeDraft({lat:lastCursor[0],lng:lastCursor[1]});if(draftPoints.length)redrawDraft();toast('地圖單位");
fs.writeFileSync('dist/workspace.js',j);
