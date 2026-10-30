import {distance} from './workspace-model.mjs?v=111';
export function intervalPlan(points,spacingM,count=Infinity){
 if(!Number.isFinite(spacingM)||spacingM<=0)throw Error('記號間隔必須大於 0');
 if(count!==Infinity&&!Number.isInteger(count))throw Error('記號數量須為整數，正負決定方向');
 const first=points[0],last=points.at(-1);if(!first||!last)throw Error('線段至少需要兩點');
 const east=((last[1]-first[1]+540)%360-180)*Math.cos((first[0]+last[0])*Math.PI/360),north=last[0]-first[0];
 const lastIsNE=east+north>1e-12||(Math.abs(east+north)<=1e-12&&(north>0||north===0&&east>0));
 const reverse=count<0?!lastIsNE:lastIsNE,ordered=reverse?[...points].reverse():points,segments=[];let total=0;
 for(let i=1;i<ordered.length;i++){const length=distance(ordered[i-1],ordered[i]);segments.push({index:i-1,start:total,length});total+=length}
 const maximum=Math.floor((total+Math.min(1e-6,spacingM*1e-9))/spacingM),requested=count===Infinity?maximum:Math.min(Math.abs(count),maximum),renderCount=Math.min(1000,requested),marks=[];let segment=0;
 for(let n=1;n<=renderCount;n++){const d=n*spacingM;while(segment<segments.length-1&&d>segments[segment].start+segments[segment].length+1e-6)segment++;const s=segments[segment];if(!s)break;const offset=Math.max(0,Math.min(s.length,d-s.start));marks.push({segmentIndex:reverse?points.length-2-s.index:s.index,offsetM:reverse?s.length-offset:offset,distanceM:d})}
 return{total,maximum,remainder:Math.max(0,total-maximum*spacingM),renderCount,capped:requested>1000,marks,reverse,direction:count<0?'SW→NE':'NE→SW'};
}

export function placeCursorBox(anchor,size,box,obstacles=[]){const pad=6,gap=16,candidates=[[anchor.x+gap,anchor.y-box.h/2],[anchor.x-gap-box.w,anchor.y-box.h/2],[anchor.x-box.w/2,anchor.y-gap-box.h],[anchor.x-box.w/2,anchor.y+gap]];const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;return candidates.map(([x,y],i)=>{const r={x:Math.max(pad,Math.min(x,size.w-box.w-pad)),y:Math.max(pad,Math.min(y,size.h-box.h-pad)),w:box.w,h:box.h};return{...r,score:obstacles.reduce((n,b)=>n+(overlap(r,b)?1:0),0)*100+(anchor.x>=r.x&&anchor.x<=r.x+r.w&&anchor.y>=r.y&&anchor.y<=r.y+r.h?1000:0)+i}}).sort((a,b)=>a.score-b.score)[0]}

