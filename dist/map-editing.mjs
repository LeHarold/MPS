// Geometry operations preserve source coordinates, names and altitude.
export function outerVertices(vertices){
 if(!Array.isArray(vertices)||vertices.length<3)throw Error('至少輸入三個不同座標點');
 const origin=vertices[0].position[1],wrap=x=>((x-origin+540)%360)-180+origin;
 const sorted=vertices.map((v,index)=>{const p=v.position;if(!Array.isArray(p)||p.length<2||p.some(n=>!Number.isFinite(n))||Math.abs(p[0])>90||Math.abs(p[1])>180)throw Error('座標資料不正確');return {v,index,x:wrap(p[1]),y:p[0]}}).sort((a,b)=>a.x-b.x||a.y-b.y);
 const unique=sorted.filter((p,i)=>!i||p.x!==sorted[i-1].x||p.y!==sorted[i-1].y);
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),half=points=>{const h=[];for(const p of points){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=1e-12)h.pop();h.push(p)}return h};
 const hull=[...half(unique).slice(0,-1),...half([...unique].reverse()).slice(0,-1)];
 if(hull.length<3)throw Error('座標無法形成區域，請輸入至少三個不共線座標');
 // Begin at the earliest input point which lies on the hull.
 const first=hull.reduce((best,p,i)=>p.index<hull[best].index?i:best,0);
 return [...hull.slice(first),...hull.slice(0,first)].map(p=>({...structuredClone(p.v),position:[...p.v.position]}));
}
const R=6371008.8,rad=x=>x*Math.PI/180;
export function geoBearing(a,b){const p=rad(a[0]),q=rad(b[0]),d=rad(b[1]-a[1]);return Math.atan2(Math.sin(d)*Math.cos(q),Math.cos(p)*Math.sin(q)-Math.sin(p)*Math.cos(q)*Math.cos(d))*180/Math.PI}
export function geoDistance(a,b){const h=Math.sin(rad(b[0]-a[0])/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(rad(b[1]-a[1])/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)))}
export function geoDestination(a,bearing,metres,altitude=0){const d=metres/R,p=rad(a[0]),l=rad(a[1]),b=rad(bearing),q=Math.asin(Math.sin(p)*Math.cos(d)+Math.cos(p)*Math.sin(d)*Math.cos(b)),r=l+Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(p),Math.cos(d)-Math.sin(p)*Math.sin(q));return[q*180/Math.PI,((r*180/Math.PI+540)%360)-180,altitude]}
export function transformPoints(points,origin,nextOrigin,angle=0,scale=1){return points.map(p=>geoDestination(nextOrigin,geoBearing(origin,p)+angle,geoDistance(origin,p)*scale,p[2]||0))}
export function nearestPathFraction(points,pixel,project){let best=Infinity,value=0;for(let i=0;i<points.length-1;i++){const a=project(points[i]),b=project(points[i+1]),dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((pixel.x-a.x)*dx+(pixel.y-a.y)*dy)/(dx*dx+dy*dy||1))),error=(pixel.x-a.x-t*dx)**2+(pixel.y-a.y-t*dy)**2;if(error<best){best=error;value=(i+t)/(points.length-1)}}return value}
