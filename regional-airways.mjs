const regions = [
  ['japan','日本周邊','#63b3ed'],
  ['philippines','菲律賓周邊','#78d9af'],
  ['china','中國周邊','#d7a9eb']
];

export function mountRegionalAirways({L,map,mount,getSettings,save,formatPair}) {
  const panel=document.createElement('details');
  panel.id='regional-airways';
  panel.innerHTML='<summary>區域民航航路與航點（歷史）</summary><div class="section-body"><p>FlightGear／Robin A. Peel，AIRAC 2013.10。地理分區為概略範圍。僅供歷史比對，勿用於現行飛航或航行規劃。</p><p><a href="https://gitlab.com/flightgear/fgdata/-/tree/next/Navaids" target="_blank" rel="noopener">來源資料</a> · <a href="regional-airways-COPYING.txt">GPL v2 或更新版本</a></p></div>';
  mount.after(panel);
  const section=panel.lastElementChild;
  const overlays=L.layerGroup().addTo(map);
  const loaded=new Map();
  const active=new Map();
  const renderer=L.canvas({padding:.2});
  function detail(name,lines) {
    const content=document.createElement('div');
    const title=document.createElement('strong');title.textContent=name;
    content.append(title);
    for(const text of lines){const row=document.createElement('p');row.textContent=text;content.append(row);}
    return content;
  }
  const refresh=()=>{
    const prefs=getSettings().regionalAirways||{};
    for(const [id,label,color] of regions){
      const pack=loaded.get(id);
      if(!pack)continue;
      const previous=active.get(id);
      if(previous)overlays.removeLayer(previous);
      if(!prefs[id]?.routes&&!prefs[id]?.points){active.delete(id);continue;}
      const layer=L.layerGroup().addTo(overlays);
      active.set(id,layer);
      const bounds=map.getBounds().pad(.15);
      if(prefs[id]?.routes){
        for(const [name,from,lat,lng,to,lat2,lng2] of pack.routes){
          const coordinates=[[lat,lng],[lat2,lng2]];
          if(!bounds.intersects(L.latLngBounds(coordinates)))continue;
          L.polyline(coordinates,{renderer,color,weight:1.2,opacity:.82})
            .bindPopup(()=>detail(name,[from+' → '+to,label+' · AIRAC 2013.10'])).addTo(layer);
        }
      }
      if(prefs[id]?.points&&map.getZoom()>=7){
        for(const [name,lat,lng] of pack.points){
          if(!bounds.contains([lat,lng]))continue;
          L.circleMarker([lat,lng],{renderer,radius:3,color,weight:1.2,fillOpacity:.72})
            .bindPopup(()=>detail(name,[formatPair([lat,lng]),label+' · AIRAC 2013.10'])).addTo(layer);
        }
      }
    }
  };
  for(const [id,label] of regions){
    const card=document.createElement('fieldset');
    const heading=document.createElement('legend');heading.textContent=label;
    const status=document.createElement('p');status.setAttribute('role','status');
    card.append(heading,status);
    const checks={};
    let loading;
    const load=async()=>{
      if(loaded.has(id))return loaded.get(id);
      if(!loading){
        status.textContent='載入歷史參考資料…';
        loading=fetch('regional-'+id+'.json').then(response=>{
          if(!response.ok)throw Error('圖層檔案無法讀取');
          return response.json();
        }).then(pack=>{loaded.set(id,pack);return pack;}).finally(()=>loading=null);
      }
      return loading;
    };
    const update=async()=>{
      const prefs=getSettings();
      prefs.regionalAirways||={};
      prefs.regionalAirways[id]={routes:checks.routes.checked,points:checks.points.checked};
      if(!checks.routes.checked&&!checks.points.checked){status.textContent='';refresh();return;}
      try{const pack=await load();status.textContent=pack.routes.length+' 航段 · '+pack.points.length+' 航點（放大至第 7 級顯示）';refresh();}
      catch(error){status.textContent=error.message+'，可重新勾選重試。';}
    };
    for(const [kind,text] of [['routes','航路'],['points','航點']]){
      const row=document.createElement('label');
      const check=document.createElement('input');check.type='checkbox';checks[kind]=check;
      check.checked=!!getSettings().regionalAirways?.[id]?.[kind];
      check.onchange=()=>{update();save();};
      row.append(check,document.createTextNode(text));card.append(row);
    }
    section.append(card);
    if(checks.routes.checked||checks.points.checked)void update();
  }
  map.on('moveend',refresh);
}
