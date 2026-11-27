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
  function detail(name,lines,checked,onChange) {
    const content=document.createElement('div');
    const title=document.createElement('strong');title.textContent=name;
    content.append(title);
    for(const text of lines){const row=document.createElement('p');row.textContent=text;content.append(row);}
    const label=document.createElement('label');
    const check=document.createElement('input');check.type='checkbox';check.checked=checked;
    check.onchange=()=>onChange(check.checked);
    label.append(check,document.createTextNode('在地圖顯示此名稱'));content.append(label);
    return content;
  }
  const routeLabels=L.layerGroup().addTo(overlays);
  const palette=['#4a97d8','#a16dc4','#21866c','#c27827','#cd586b','#3b8f9e','#657bd2','#718830'];
  const routeColor=name=>{
    let hash=0;
    for(const char of name)hash=(Math.imul(hash,31)+char.charCodeAt(0))>>>0;
    return palette[hash%palette.length];
  };
  const shown=(options,kind,key)=>options.nameOverrides?.[kind]?.[key]??!!options[kind+'Names'];
  const makeName=name=>{const span=document.createElement('span');span.textContent=name;return span;};
  function indexRoutes(pack){
    const routes=new Map();
    for(const [name,,lat,lng,,lat2,lng2] of pack.routes){
      if(!routes.has(name))routes.set(name,[]);
      routes.get(name).push([[lat,lng],[lat2,lng2]]);
    }
    return routes;
  }
  function updateLayers(){
    const prefs=getSettings().regionalAirways||{};
    for(const [id,label] of regions){
      const pack=loaded.get(id),options=prefs[id]||{};
      if(!pack)continue;
      if(!active.has(id))active.set(id,{routes:L.layerGroup(),points:L.layerGroup().addTo(overlays)});
      const layers=active.get(id);
      if(options.routes&&!overlays.hasLayer(layers.routes)){
        if(!layers.routes.getLayers().length)for(const [name,segments] of pack.routeIndex){
          L.polyline(segments,{renderer,color:routeColor(name),weight:1.35,opacity:.82})
            .bindPopup(()=>detail(name,[segments.length+' 航段 · '+label+' · AIRAC 2013.10'],shown(getSettings().regionalAirways[id],'routes',name),visible=>{
              const setting=getSettings().regionalAirways[id];
              setting.nameOverrides||={};setting.nameOverrides.routes||={};
              setting.nameOverrides.routes[name]=visible;refreshViewport();save();
            })).addTo(layers.routes);
        }
        overlays.addLayer(layers.routes);
      }else if(!options.routes&&overlays.hasLayer(layers.routes))overlays.removeLayer(layers.routes);
    }
    refreshViewport();
  }
  function refreshViewport(){
    const prefs=getSettings().regionalAirways||{};
    const bounds=map.getBounds(),center=map.getCenter(),occupied=new Set(),names=new Map();
    routeLabels.clearLayers();
    function canPlace(position){
      const pixel=map.latLngToContainerPoint(position);
      if(pixel.x<28||pixel.y<15||pixel.x>map.getSize().x-28||pixel.y>map.getSize().y-15)return false;
      const cell=Math.floor(pixel.x/78)+':'+Math.floor(pixel.y/34);
      if(occupied.has(cell))return false;
      occupied.add(cell);return true;
    }
    for(const [id,label,color] of regions){
      const pack=loaded.get(id),layers=active.get(id),options=prefs[id]||{};
      if(!pack||!layers)continue;
      if(options.routes)for(const [name,segments] of pack.routeIndex){
        if(!shown(options,'routes',name))continue;
        for(const [a,b] of segments){
          if(Math.abs(a[1]-b[1])>180)continue;
          const position=[(a[0]+b[0])/2,(a[1]+b[1])/2];
          if(!bounds.contains(position))continue;
          const score=(position[0]-center.lat)**2+(position[1]-center.lng)**2;
          if(!names.has(name)||score<names.get(name).score)names.set(name,{position,score});
        }
      }
      layers.points.clearLayers();
      if(!options.points||map.getZoom()<7)continue;
      for(const [name,lat,lng] of pack.points){
        const position=[lat,lng];
        if(!bounds.contains(position))continue;
        const key=[name,lat,lng].join(':');
        const marker=L.circleMarker(position,{renderer,radius:3,color,weight:1.2,fillOpacity:.72,mpsName:name});
        marker.bindPopup(()=>detail(name,[formatPair(position),label+' · AIRAC 2013.10'],shown(options,'points',key),visible=>{
          options.nameOverrides||={};options.nameOverrides.points||={};options.nameOverrides.points[key]=visible;
          if(visible)marker.bindTooltip(makeName(name),{permanent:true,direction:'top'});else marker.unbindTooltip();
          save();
        })).addTo(layers.points);
      }
    }
    for(const [name,{position}] of names){
      if(!canPlace(position))continue;
      L.tooltip({permanent:true,direction:'center',className:'regional-route-name',opacity:1})
        .setLatLng(position).setContent(makeName(name)).addTo(routeLabels);
    }
    for(const [id] of regions){
      const options=prefs[id]||{};
      active.get(id)?.points.eachLayer(marker=>{
        const position=marker.getLatLng();
        const name=marker.options.mpsName;
        if(name&&shown(options,'points',[name,position.lat,position.lng].join(':'))&&canPlace(position)){
          marker.bindTooltip(makeName(name),{permanent:true,direction:'top',className:'regional-point-name'});
        }
      });
    }
  }
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
        }).then(pack=>{pack.routeIndex=indexRoutes(pack);loaded.set(id,pack);return pack;}).finally(()=>loading=null);
      }
      return loading;
    };
    const update=async()=>{
      const prefs=getSettings();
      prefs.regionalAirways||={};
      prefs.regionalAirways[id]||={};
      for(const [kind,check] of Object.entries(checks))prefs.regionalAirways[id][kind]=check.checked;
      if(!checks.routes.checked&&!checks.points.checked){status.textContent='';updateLayers();return;}
      try{const pack=await load();status.textContent=pack.routes.length+' 航段 · '+pack.points.length+' 航點（放大至第 7 級顯示）';updateLayers();}
      catch(error){status.textContent=error.message+'，可重新勾選重試。';}
    };
    for(const [kind,text] of [['routes','航路'],['routesNames','顯示航路名稱'],['points','航點'],['pointsNames','顯示航點名稱']]){
      const row=document.createElement('label');
      const check=document.createElement('input');check.type='checkbox';checks[kind]=check;
      check.checked=!!getSettings().regionalAirways?.[id]?.[kind];
      check.onchange=()=>{update();save();};
      row.append(check,document.createTextNode(text));card.append(row);
    }
    section.append(card);
    if(checks.routes.checked||checks.points.checked)void update();
  }
  map.on('moveend',refreshViewport);
}
