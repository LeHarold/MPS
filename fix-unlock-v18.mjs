import fs from 'node:fs';let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("const end=e=>{pointers.delete(e.pointerId);", "const end=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);");
j=j.replace("altitudeLabel.textContent=text;const content=", "altitudeLabel.textContent=currentHeight===null?'高度 —':altitudeText(currentHeight);altitudeLabel.title=heightMode;const content=");
j=j.replace("content.textContent=pair(lastCursor)+' · '+text;cursorIcon.setLatLng", "content.textContent=pair(lastCursor)+' · '+text;const pixel=map.latLngToContainerPoint(lastCursor),size=map.getSize(),left=pixel.x>size.x/2;cursorReadout.options.direction=left?'left':'right';content.style.display='block';content.style.whiteSpace='normal';content.style.maxWidth=Math.max(110,Math.min(400,(left?pixel.x:size.x-pixel.x)-30))+'px';cursorIcon.setLatLng");
j=j.replace('z8，台灣約 24 塊','z8，台灣周邊 20 塊');
fs.writeFileSync('dist/workspace.js',j);
let db=fs.readFileSync('dist/elevation-store.mjs','utf8');db=db.replace("r.onsuccess=()=>resolve(r.result)","r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)}");fs.writeFileSync('dist/elevation-store.mjs',db);
let test=fs.readFileSync('test-v17.mjs','utf8');test=test.replace('l.pointerdown(event(4,120,100,true));assert.equal(s.lock,null)', 'l.pointerdown(event(4,120,100,true));l.pointerup(event(4,120,100,true));assert.equal(s.lock,null)');fs.writeFileSync('test-v17.mjs',test);
