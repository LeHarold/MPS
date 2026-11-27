// Display-only helpers: never change stored coordinates, geometry or font preference.
export function labelDisplaySize(base,zoom,enabled=true){const size=Number.isInteger(base)&&base>=8&&base<=24?base:10;if(!enabled)return size;return Math.max(Math.min(size,6),size*Math.min(1,2**(((Number.isFinite(zoom)?zoom:6)-6)/4)))}
export function frameTask(run,request=cb=>requestAnimationFrame(cb),cancel=id=>cancelAnimationFrame(id)){
 let frame=null,args=null;
 const flush=()=>{if(frame!==null)cancel(frame);frame=null;if(!args)return;const next=args;args=null;run(...next)};
 const schedule=(...next)=>{args=next;if(frame===null)frame=request(()=>{frame=null;flush()})};
 schedule.flush=flush;schedule.cancel=()=>{if(frame!==null)cancel(frame);frame=null;args=null};return schedule;
}
const areaCache=new WeakMap();
export function memoAreaOffset(label,ownerMap,config){
 const {points,corner,offset,width,height,angle=0,project}=config,anchor=project(corner),sample=project([corner[0]+.01,corner[1]]),scale=Math.hypot(sample.x-anchor.x,sample.y-anchor.y).toFixed(6),signature=[scale,width,height,angle,...corner,points.length,...points[0],...points.at(-1)].join('|'),old=areaCache.get(label),same=p=>p.x===offset.x&&p.y===offset.y;
 if(old?.ownerMap===ownerMap&&old.points===points&&old.signature===signature&&(same(old.input)||same(old.output)))return{...old.output};
 const result=config.compute();areaCache.set(label,{ownerMap,points,signature,input:{...offset},output:{...result}});return result;
}
