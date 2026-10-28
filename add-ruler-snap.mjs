import fs from 'node:fs';
let j=fs.readFileSync('dist/workspace.js','utf8'),w=fs.readFileSync('dist/waypoint-picker.mjs','utf8');
j=j.replace('distance,dms,factor,rad,parseVertices','distance,dms,factor,rad,snapRulerEndpoints,parseVertices');
j=j.replace("if(name==='protractor')snapProtractor();save()", "if(name==='protractor')snapProtractor();else snapRuler();save()");
const extra=`
const rulerSnapLabel=document.createElement('label'),rulerSnapToggle=document.createElement('input');rulerSnapToggle.type='checkbox';rulerSnapToggle.id='ruler-snap';rulerSnapToggle.checked=state.settings.rulerSnap!==false;rulerSnapLabel.append(rulerSnapToggle,document.createTextNode('直尺兩端吸附航點／標記'));$('settings-panel').querySelector('.section-body').append(rulerSnapLabel);rulerSnapToggle.onchange=()=>{state.settings.rulerSnap=rulerSnapToggle.checked;save()};
function snapRuler(){if(state.settings.rulerSnap===false)return;const locations=[...waypointPicker.getVisiblePoints().map(p=>p.position),...state.layers.filter(l=>l.visible&&(l.opacity??1)>0).flatMap(l=>l.objects.filter(o=>o.type==='point').map(o=>o.points[0]))],unique=new Map();for(const p of locations){const at=map.latLngToContainerPoint(p);unique.set(p[0]+','+p[1],[at.x,at.y])}const size=map.getSize(),result=snapRulerEndpoints(instrumentGeometry('ruler'),[...unique.values()],24,size.x*2);if(!result)return;const s=state.instruments.ruler;s.x=result.cx/size.x;s.y=result.cy/size.y;s.rotation=result.rotation;s.scale=result.width/instrumentSizes.ruler.width;renderInstruments();toast(result.ends===2?'直尺兩端已分別吸附至兩個點':'直尺端點已吸附至鄰近點')}
`;
j=j.replace("refreshUI();try{if(localStorage",extra+"\nrefreshUI();try{if(localStorage");
j=j.replace("updateOpacityInputs();renderRangeLists();renderAirports();", "updateOpacityInputs();renderRangeLists();renderAirports();if($('ruler-snap'))$('ruler-snap').checked=state.settings.rulerSnap!==false;");
w=w.replace('getPoints:()=>points}', "getPoints:()=>points,getVisiblePoints:()=>getSettings().fixes?points.filter(p=>selectedIds().has(p.id)):[]}");
fs.writeFileSync('dist/workspace.js',j);fs.writeFileSync('dist/waypoint-picker.mjs',w);
