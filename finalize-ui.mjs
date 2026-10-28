import fs from 'node:fs';let s=fs.readFileSync('dist/workspace.js','utf8');
s=s.replace("let step=span/pixels*7;if(step<1/60)", "let step=span/pixels*7;if(pixels/span>=90)step=1/60;if(step<1/60)");
// Preserve the one-minute step at readable scales instead of promoting it to five minutes.
s=s.replace("else step=step<.2?5/60:step<.5?15/60:1;", "else if(step>1/60)step=step<.2?5/60:step<.5?15/60:1;");
s=s.replace("tick.classList.toggle('degree-tick',degree);", "tick.classList.toggle('degree-tick',degree);tick.classList.toggle('five-minute-tick',minute%5===0);");
s=s.replace("else if(span/pixels<1/120){", "else if(span/pixels<1/120&&(pixels/span>=900||minute%5===0)){");
s=s.replace("renderObjects();renderLayers();save('已儲存標記用途與連線距離')", "renderObjects();renderLayers();$('object-coords').value=vertexText(f.object.points);showHandles(f.object);save('已儲存標記用途與連線距離')");
s=s.replace("updateOpacityInputs();renderRangeLists();renderAirports();if($('ruler-snap'))", "updateOpacityInputs();renderRangeLists();renderAirports();if($('altitude-unit'))$('altitude-unit').value=state.settings.altitudeUnit||'ft';if($('ruler-snap'))");
s=s.replace("return[p[1],p[0],p[2]||0]", "return[p[1],p[0],p[2]??0]");
fs.writeFileSync('dist/workspace.js',s);fs.appendFileSync('dist/workspace.css','\n.lng-tick{height:3px}.lat-tick{width:3px}.lng-tick.five-minute-tick{height:7px}.lat-tick.five-minute-tick{width:7px}.lng-tick.degree-tick{height:10px}.lat-tick.degree-tick{width:10px}\n');
