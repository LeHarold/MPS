import fs from 'node:fs';let s=fs.readFileSync('dist/workspace.js','utf8');
s=s.replaceAll('livePrintMap=pm;livePrintRoot=root;',"preservePrintCoordinates(pm);livePrintMap=pm;livePrintRoot=root;");
s=s.replace("const width=root.clientWidth;root.style.height=width*p.mh/p.mw+'px';root.style.setProperty", "const width=root.clientWidth;root.style.width=width+'px';root.style.maxWidth='none';root.style.height=width*p.mh/p.mw+'px';root.style.setProperty");
s+=`\n// Leaflet normally rounds projected vertices to preview pixels. Printing retains\n// fractional positions so degree ticks and geometry share the exact page scale.\nfunction preservePrintCoordinates(ownerMap){ownerMap.latLngToLayerPoint=function(position){return this.project(L.latLng(position),this.getZoom()).subtract(this.getPixelOrigin())}}\n`;
fs.writeFileSync('dist/workspace.js',s);
