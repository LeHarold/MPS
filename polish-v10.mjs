import fs from 'node:fs';
let j=fs.readFileSync('dist/workspace.js','utf8'),h=fs.readFileSync('dist/workspace.html','utf8');
j=j.replace("map.getContainer().classList.toggle('erase-mode',next==='erase');","map.getContainer().classList.toggle('erase-mode',next==='erase');document.body.classList.toggle('free-mode',next==='free');");
j=j.replace("if(!e.target.closest('[data-instrument]')||e.pointerType==='mouse'&&e.button!==0)return;", "if(tool==='free'&&!e.target.closest('[data-instrument]')||e.pointerType==='mouse'&&e.button!==0)return;");
j=j.replace("const line=L.polyline(points,{color:","const routeStyle=state.settings.routeStyles?.[r.name]||{};const line=L.polyline(points,{color:");
j=j.replace("routePaths.set(r.name,line)","routePaths.set(r.name,line);line.setStyle({color:routeStyle.color||state.settings.routeColor||'#6ed7bd',opacity:routeStyle.opacity??state.settings.routeOpacity??1});if(routeStyle.names)line.bindTooltip(r.name,{permanent:true})");
j=j.replace("details.append(locate,copy);row.append(input,details)","state.settings.routeStyles||={};const prefs=state.settings.routeStyles[r.name]||={name:r.name,names:false,color:'#6ed7bd',opacity:1};details.append(layerStyle(prefs,()=>{renderRoutes();save()}),opacityControl(r.name,prefs.opacity,v=>{prefs.opacity=v;renderRoutes();save()}),locate,copy);row.append(input,details)");
j=j.replace("routeLines.eachLayer(l=>{l.setStyle({opacity:clampOpacity(state.settings.routeOpacity),color:state.settings.routeColor||'#6ed7bd'});", "routeLines.eachLayer(l=>{const name=[...routePaths].find(([,v])=>v===l)?.[0],prefs=state.settings.routeStyles?.[name]||{};l.setStyle({opacity:clampOpacity(state.settings.routeOpacity)*(prefs.opacity??1),color:prefs.color||state.settings.routeColor||'#6ed7bd'});");
j=j.replace("drawRef()}applyReferenceOpacity()}","drawRef()}applyReferenceOpacity();updateOpacityInputs()}");
j=j.replace("const delta=(to-from+360)%360;", "const delta=(to-from+360)%360;");
j=j.replaceAll('id="ruler-range-band"','class="ruler-range-band"').replaceAll('id="protractor-range-band"','class="protractor-range-band"');
j=j.replace("renderInstruments();updateScale();if(draftPoints.length)", "renderInstruments();updateScale();waypointPicker.renderMap();renderRangeLists();if(draftPoints.length)");
j=j.replace("const key=a.category==='military'?'airportsMilitary':'airportsCivil';", "const key=a.category==='military'?'airportsMilitary':'airportsCivil';");
j=j.replace("const icon=L.divIcon({", "const icon=L.divIcon({");
j=j.replace("L.marker(a.position,{icon}).bindTooltip(a.name)", "L.marker(a.position,{icon,opacity:state.settings.airportOpacity??1}).bindTooltip(a.name,{permanent:state.settings.airportNames===true})");
j=j.replace("{color:'#ffdb8f',weight:4}","{color:state.settings.airportColor||'#ffdb8f',weight:4,opacity:state.settings.airportOpacity??1}");
j=j.replace("let altitudeTimer,altitudeRequest=0;", "const attribution=document.createElement('a');attribution.href='https://open-meteo.com/en/docs/elevation-api';attribution.target='_blank';attribution.rel='noopener';attribution.textContent='地表高度：Open-Meteo / Copernicus GLO-90（約 90 m 解析度）';$('settings-panel').querySelector('.section-body').append(attribution);\nlet altitudeTimer,altitudeRequest=0;");
// Altitude mode belongs to a geometry and is retained on KML round trips.
j=j.replace("objects.push({id:uid(),name,description,type,points,color})", "objects.push({id:uid(),name,description,type,points,color,altitudeMode:tags(g,'altitudeMode')[0]?.textContent||'clampToGround'})");
j=j.replace("const coordinates='<coordinates>'+p.join(' ')+'</coordinates>'", "const coordinates='<altitudeMode>'+escapeXML(o.altitudeMode||'absolute')+'</altitudeMode><coordinates>'+p.join(' ')+'</coordinates>'");
// Keep each instrument's actions adjacent to its own menu row.
h=h.replace('<div class="instrument-actions"><button id="ruler-reset">reset 水平</button><button id="ruler-hide">收起直尺</button><button id="protractor-reset">reset 水平</button><button id="protractor-hide">收起量角器</button></div>','');
h=h.replace('<button id="ruler-tool"','<div class="instrument-menu-row"><button id="ruler-tool"').replace('<button id="protractor-tool">','<button id="ruler-reset">reset 水平</button><button id="ruler-hide">收起</button></div><div class="instrument-menu-row"><button id="protractor-tool">').replace('<p>尺規可與繪圖同時使用。','<button id="protractor-reset">reset 水平</button><button id="protractor-hide">收起</button></div><p>尺規可與繪圖同時使用。');
h=h.replace('雙指觸碰尺規拖曳列可旋轉。','雙指可旋轉與放大縮小。');
h=h.replace('雙指按住拖曳列可旋轉；','雙指按住尺規可旋轉與縮放；');
h=h.replace('小圖示顯示其跑道方向','小圖示顯示其跑道方向');
fs.writeFileSync('dist/workspace.js',j);fs.writeFileSync('dist/workspace.html',h);fs.writeFileSync('dist/index.html',h);
fs.appendFileSync('dist/workspace.css',`\n.instrument,.instrument svg{pointer-events:auto}.free-mode .instrument,.free-mode .instrument svg{pointer-events:none}.instrument [data-instrument]{pointer-events:auto}.instrument-menu-row{display:flex;align-items:center;gap:4px}.popover .instrument-menu-row button{font-size:11px;flex:0 0 auto;width:auto;padding:5px}.popover .instrument-menu-row button:first-child{flex:1;font-size:20px}.popover .instrument-menu-row button:first-child span{font-size:12px}#instrument-menu{width:360px}.latitude-axis,.longitude-axis{background:transparent}.axis-label,.degree-label,.minute-label{text-shadow:none}\n`);
