import fs from 'node:fs';
let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("const land=L.layerGroup()", "for(const [name,z] of [['referencePane',300],['routePane',350],['userPane',450],['userPointPane',470],['referencePointPane',480]]){map.createPane(name);map.getPane(name).style.zIndex=String(z)}\nconst land=L.layerGroup()");
j=j.replace("style={color:layer.color", "style={pane:o.type==='point'?'userPointPane':'userPane',color:layer.color");
j=j.replace("const line=L.polyline(points,{color:", "const line=L.polyline(points,{pane:'routePane',color:");
j=j.replace("const options={referenceId:ref.id,", "const options={pane:'referencePane',referenceId:ref.id,");
j=j.replace("{referenceId:ref.id,radius:4", "{pane:'referencePointPane',referenceId:ref.id,radius:5");
fs.writeFileSync('dist/workspace.js',j);
