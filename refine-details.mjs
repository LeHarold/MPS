import fs from 'node:fs';
let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("geometry.addTo(draw).bindTooltip(o.name,{permanent:layer.names===true,opacity:layer.opacity??1})", "geometry.addTo(draw).bindTooltip(o.name+(o.measureDistance?' · '+formatDistance(o.points.reduce((n,p,i)=>i?n+distance(o.points[i-1],p):n,0)):''),{permanent:o.measureDistance===true||layer.names===true,opacity:layer.opacity??1})");
j=j.replace("name:name+' → '+f.object.name+' · '+formatDistance(distance(...points)),description:'航路／飛行標記連線'", "name:name+' → '+f.object.name,measureDistance:true,description:'航路／飛行標記連線'");
j=j.replace("updateScale();waypointPicker.renderMap();renderRangeLists();", "updateScale();renderObjects();renderLayers();waypointPicker.renderMap();renderRangeLists();");
j=j.replace("if(!(l instanceof L.CircleMarker)){l.unbindTooltip();l.bindTooltip(ref.name,{permanent:prefs.names===true})}", "l.unbindTooltip();if(l instanceof L.CircleMarker){const at=l.getLatLng(),i=ref.points.findIndex(p=>Math.abs(p[0]-at.lat)<1e-7&&Math.abs(p[1]-at.lng)<1e-7),name=ref.pointNames?.[i]||ref.name+' · 頂點 '+(i+1);l.bindTooltip(name,{permanent:prefs.names===true});const el=l.getElement();if(el){el.setAttribute('role','button');el.setAttribute('aria-label',name)}}else l.bindTooltip(ref.name,{permanent:prefs.names===true})");
fs.writeFileSync('dist/workspace.js',j);
