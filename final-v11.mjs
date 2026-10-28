import fs from 'node:fs';
let j=fs.readFileSync('dist/workspace.js','utf8'),h=fs.readFileSync('dist/workspace.html','utf8');
j=j.replace("o.name=$('objname').value.trim()||'未命名';", "o.pointKind=$('point-kind').value;o.name=$('objname').value.trim()||'未命名';");
// Independent airport categories support the same layer controls as the other sources.
j=j.replace("const key=a.category==='military'?'airportsMilitary':'airportsCivil';", "const key=a.category==='military'?'airportsMilitary':'airportsCivil';const airportStyle=state.settings.airportStyles?.[key]||{};");
j=j.replace("html:'<span style=\"transform:rotate('+a.bearing+'deg)\">▥</span>'", "html:'<span style=\"color:'+(airportStyle.color||'#ffdb8f')+';transform:rotate('+a.bearing+'deg)\">▥</span>'");
j=j.replace("opacity:state.settings.airportOpacity??1}).bindTooltip(a.name,{permanent:state.settings.airportNames===true})", "opacity:airportStyle.opacity??1}).bindTooltip(a.name,{permanent:airportStyle.names===true})");
j=j.replace("color:state.settings.airportColor||'#ffdb8f',weight:4,opacity:state.settings.airportOpacity??1", "color:airportStyle.color||'#ffdb8f',weight:4,opacity:airportStyle.opacity??1");
j=j.replace("$('airport-count').textContent=count+'/'+airportData.length;", "$('airport-count').textContent=count+'/'+airportData.length;renderAirportControls();");
const extra=`
function renderAirportControls(){for(const [id,key,name] of [['airports-civil','airportsCivil','民用／軍民合用'],['airports-military','airportsMilitary','軍用']]){let row=$(key+'-style');if(!row){row=document.createElement('div');row.id=key+'-style';$(id).parentElement.after(row)}state.settings.airportStyles||={};const prefs=state.settings.airportStyles[key]||={name,names:false,color:'#ffdb8f',opacity:1};row.replaceChildren(layerStyle(prefs,()=>{renderAirports();save()}),opacityControl(name,prefs.opacity,v=>{prefs.opacity=v;renderAirports();save()}))}}
`;
j=j.replace("refreshUI();try{if(localStorage",extra+"\nrefreshUI();try{if(localStorage");
// Numeric rotation UI is removed; legacy hidden fields are retained only for old event bindings.
h=h.replace('將尺規移回畫面中央','將尺規移回畫面中央');
h=h.replace('跑道方向為公開資料參考；圖示沿實際跑道端點方向繪製。','跑道方向為公開資料參考；圖示沿公開跑道端點方向繪製。民航 AIP 2026-10-01；軍用 OurAirports 資料庫，非即時運作狀態。');
fs.writeFileSync('dist/workspace.js',j);fs.writeFileSync('dist/workspace.html',h);fs.writeFileSync('dist/index.html',h);
let sources=fs.readFileSync('dist/data-sources.html','utf8');sources=sources.replace('</body>',`<h2>機場與地表高度</h2><p>民用／軍民合用機場：民航局 eAIP 2026-10-01 AD 2.2 與 AD 2.12 的機場參考點及跑道頭座標；圖示方向由跑道端點計算。軍用機場：<a href="https://ourairports.com/data/">OurAirports 公開資料</a>（Public Domain），2026-10-28 擷取。僅列資料庫已有公開座標的機場，不表示即時開放狀態。</p><p>游標地表高度：<a href="https://open-meteo.com/en/docs/elevation-api">Open-Meteo Elevation API</a>，來源 Copernicus DEM GLO-90（2021，約 90 m 解析度）；非飛行高度或即時雷達高度，需連線查詢。高度未取得時顯示無資料。KML 高度仍依其 altitudeMode 與公尺原始值儲存。</p></body>`);fs.writeFileSync('dist/data-sources.html',sources);
