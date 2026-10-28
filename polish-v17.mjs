import fs from 'node:fs';let j=fs.readFileSync('dist/workspace.js','utf8');
j=j.replace("const before=s.rotation;snapProtractor();if(s.rotation!==before){", "if(snapProtractor()){");
j=j.replace("toast('量角器中心與 0° 線已貼齊直線')}}", "toast('量角器中心與 0° 線已貼齊直線');return true}return false}");
j=j.replace("const text=currentHeight===null?'高度 —':", "const text=currentHeight===null?'高度 —'+(heightMode?' · '+heightMode:''):");
j=j.replace("const text=degree?axisFormat(v,lat,1):axisFormat(v,lat,1/60)", "const text=degree?axisFormat(v,lat,1):axisFormat(v,lat,1/60)");
fs.writeFileSync('dist/workspace.js',j);fs.appendFileSync('dist/workspace.css','\n.ruler .instrument-end{right:8px;top:10px}.cursor-inline{color:var(--mint)}.cursor-readout{color:var(--mint)!important}\n');
let s=fs.readFileSync('dist/data-sources.html','utf8');s=s.replace('需連線查詢。高度未取得時顯示無資料。','可連線查詢或預先下載區域網格後離線插值查詢。離線網格間距由使用者選擇（0.05°、0.01°、0.005°），並非原始 90 m 解析度；高度未取得時顯示無資料。下載區域儲存在該裝置瀏覽器的 IndexedDB，清除網站資料會移除。');fs.writeFileSync('dist/data-sources.html',s);
