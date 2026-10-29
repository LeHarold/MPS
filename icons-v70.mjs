import fs from 'node:fs';
const svg=(body)=>`<svg class="instrument-tool-icon" viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ruler=svg('<path d="M3 8h22v12H3zM7 8v6m4-6v3m4-3v6m4-6v3m4-3v6"/>');
const protractor=svg('<circle cx="14" cy="14" r="11"/><path d="M14 3v4m11 7h-4M14 25v-4M3 14h4m-.8-7.8 2.6 2.6m13-2.6-2.6 2.6m2.6 13-2.6-2.6m-13 2.6 2.6-2.6M14 14V8m0 6 5 3"/><circle cx="14" cy="14" r="1"/>');
const compass=svg('<path d="M12 3h4v4h-4zM14 7 6 24m8-17 8 17M9 17h10M6 24l-1 2m17-2 1 2"/><circle cx="14" cy="8" r="2.3"/><path d="m19 19 3-1"/>');
for(const name of ['index.html','workspace.html']){const path='dist/'+name;let s=fs.readFileSync(path,'utf8');s=s.replace('>↔<span class="caret">','>'+ruler+'<span class="caret">').replace('>↔ <span>直尺</span>','>'+ruler+'<span>直尺</span>').replace('>∠ <span>圓形量角器</span>','>'+protractor+'<span>圓形量角器</span>').replace('<p>0 點吸附後會鎖定，點擊 0 解鎖。鎖定時拖另一端可旋轉及縮放；直尺中段亦可貼齊航點。</p>','');fs.writeFileSync(path,s)}
const path='dist/workspace.js';let s=fs.readFileSync(path,'utf8');s=s.replace("compassButton.textContent='⌁ ';",'compassButton.innerHTML='+JSON.stringify(compass)+';');fs.writeFileSync(path,s);
fs.appendFileSync('dist/workspace.css','\n.instrument-tool-icon{flex:none;vertical-align:middle}.instrument-menu-row>button:first-child,.compass-menu-row>button:first-child{display:flex;align-items:center;gap:8px}\n');
