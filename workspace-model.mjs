import {validatePointMOMs} from './point-relations.mjs?v=106';
import {parseCoordinate} from './coordinates.mjs';
export const factor=u=>({nm:1852,km:1000,m:1}[u]||1852);
export const rad=n=>n*Math.PI/180;
export function distance(a,b){const x=Math.sin(rad(b[0]-a[0])/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(rad(b[1]-a[1])/2)**2;return 12742017.6*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)))}
export function dms(v,lat){const t=Math.round(Math.abs(v)*36000),d=Math.floor(t/36000),m=Math.floor(t%36000/600),s=(t%600/10).toFixed(1);return`${String(d).padStart(lat?2:3,'0')}°${String(m).padStart(2,'0')}′${s.padStart(4,'0')}″${lat?(v<0?'S':'N'):(v<0?'W':'E')}`}
export function parseVertices(text,min=1){const pts=text.trim().split(/\n/).map(line=>{const a=line.split(/[,，]/).map(x=>x.trim());if(a.length<2||a.length>3)throw Error('每行請輸入 緯度,經度,高度（高度可省略）');const z=a.length===3?Number(a[2]):0;if(!Number.isFinite(z))throw Error('高度須為數字');return[parseCoordinate(a[0],true),parseCoordinate(a[1],false),z]});if(pts.length<min)throw Error(`至少需要 ${min} 個座標`);return pts}
export function boundingRectangle(points){if(points.length<2)throw Error('至少輸入兩個不同位置的座標');const south=Math.min(...points.map(p=>p[0])),north=Math.max(...points.map(p=>p[0])),west=Math.min(...points.map(p=>p[1])),east=Math.max(...points.map(p=>p[1]));if(south===north||west===east)throw Error('座標須涵蓋不同緯度與經度，才能建立外框');return[[south,west,0],[south,east,0],[north,east,0],[north,west,0]]}
export function pointOnInstrument(cx,cy,rotation,width,height,x,y){const a=rad(rotation),dx=x-width/2,dy=y-height/2;return[cx+dx*Math.cos(a)-dy*Math.sin(a),cy+dx*Math.sin(a)+dy*Math.cos(a)]}
export function gestureAngle(a,b){return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI}
export function angleDelta(now,before){return((now-before+540)%360)-180}
export function snapRulerEndpoints(g,points,threshold=24,maxWidth=2000){
 const start=pointOnInstrument(g.cx,g.cy,g.rotation,g.width,g.height,18,20),end=pointOnInstrument(g.cx,g.cy,g.rotation,g.width,g.height,g.width-18,20);
 const nearest=(p,exclude)=>points.filter(q=>q!==exclude).map(q=>({point:q,d:Math.hypot(q[0]-p[0],q[1]-p[1])})).filter(q=>q.d<=threshold).sort((a,b)=>a.d-b.d)[0]?.point;
 const a=nearest(start),b=nearest(end,a);if(!a&&!b)return null;
 if(a&&b){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),width=length+36;if(width>=100&&width<=maxWidth){const rotation=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,angle=rad(rotation),offset=20-g.height/2;return{cx:(a[0]+b[0])/2+offset*Math.sin(angle),cy:(a[1]+b[1])/2-offset*Math.cos(angle),rotation,width,ends:2}}}
 const target=a||b,original=a?start:end;return{cx:g.cx+target[0]-original[0],cy:g.cy+target[1]-original[1],rotation:g.rotation,width:g.width,ends:1};
}
export function niceInterval(range,target=6){if(!(range>0))return 1;const rough=range/target,power=10**Math.floor(Math.log10(rough));return([1,2,5,10].find(n=>n*power>=rough)||10)*power}
export function validateRange(from,to){if(!Number.isFinite(from)||!Number.isFinite(to)||from<0||to<=from)throw Error('標色範圍須滿足：0 ≤ 起點 < 終點');return[from,to]}
export function duplicateLayer(layer,id,objectId){return {...structuredClone(layer),id,name:layer.name+' 副本',objects:layer.objects.map(o=>({...structuredClone(o),id:objectId()}))}}
export function validateProject(p){
 if(p?.version!==2||!Array.isArray(p.layers)||!p.layers.length||p.layers.length>200)throw Error('不是支援的地圖專案檔');
 const ids=new Set(),objectIds=new Set();
 for(const l of p.layers){if(typeof l.id!=='string'||ids.has(l.id)||typeof l.name!=='string'||!Array.isArray(l.objects)||l.objects.length>20000)throw Error('圖層資料無效');ids.add(l.id);if(typeof l.visible!=='boolean')throw Error('圖層顯示設定無效');for(const o of l.objects){if(typeof o.id!=='string'||objectIds.has(o.id)||!['point','line','polygon'].includes(o.type)||typeof o.name!=='string'||!/^#[\da-f]{6}$/i.test(o.color)||!Array.isArray(o.points)||o.points.length<(o.type==='point'?1:o.type==='polygon'?3:2)||o.type==='point'&&o.points.length!==1||o.points.some(a=>!Array.isArray(a)||a.length<2||a.length>3||a.some(v=>!Number.isFinite(v))||Math.abs(a[0])>90||Math.abs(a[1])>180))throw Error('標繪資料無效');objectIds.add(o.id)}}
 validatePointMOMs(p);
 if(!ids.has(p.activeLayerId))p.activeLayerId=p.layers[0].id;
 return p;
}
export function resolveObjectColor(object,layer){return object.colorOverride?object.color:(layer?.color||object.color)}
export function resolvePointColor(object,layer,index){return object.pointProperties?.[index]?.color||resolveObjectColor(object,layer)}
export function setPointColor(object,index,color){if(!/^#[\da-f]{6}$/i.test(color)||!Number.isInteger(index)||index<0||index>=object.points.length)throw Error('點顏色設定無效');object.pointProperties=structuredClone(object.pointProperties||[]);object.pointProperties[index]={...(object.pointProperties[index]||{}),color}}
export function coordinateColorKey(point){const lng=((point[1]+180)%360+360)%360-180;return Math.round(point[0]*1e7)+','+Math.round(lng*1e7)}
export function synchronizeCoordinateColors(project,edits){const colors=new Map();for(const edit of edits)if(/^#[\da-f]{6}$/i.test(edit.color))colors.set(coordinateColorKey(edit.position),edit.color);let count=0;for(const layer of project.layers)for(const object of layer.objects){let properties=null;object.points.forEach((point,index)=>{const color=colors.get(coordinateColorKey(point));if(!color)return;properties||=structuredClone(object.pointProperties||[]);properties[index]={...(properties[index]||{}),color};count++});if(properties)object.pointProperties=properties}return count}
