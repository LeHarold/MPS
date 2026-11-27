// Screen-local placement: never send a waypoint name to a distant empty region.
export class LabelBoxIndex {
  constructor(size=64){this.size=size;this.cells=new Map();this.checks=0;}
  keys(box){const keys=[];for(let x=Math.floor(box.x/this.size);x<=Math.floor((box.x+box.w)/this.size);x++)for(let y=Math.floor(box.y/this.size);y<=Math.floor((box.y+box.h)/this.size);y++)keys.push(x+':'+y);return keys;}
  add(box){for(const key of this.keys(box)){if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(box);}}
  overlaps(box){const seen=new Set();for(const key of this.keys(box))for(const other of this.cells.get(key)||[]){if(seen.has(other))continue;seen.add(other);this.checks++;if(box.x<other.x+other.w&&box.x+box.w>other.x&&box.y<other.y+other.h&&box.y+box.h>other.y)return true;}return false;}
}

export function labelEdgeGap(anchor,box){return Math.hypot(Math.max(box.x-anchor.x,0,anchor.x-box.x-box.w),Math.max(box.y-anchor.y,0,anchor.y-box.y-box.h));}

export function placeNearbyWaypoints(items,bounds,obstacles=[],avoid=true,{density='standard',zoom=10}={}){
  if(density==='full')avoid=false;
  const padding=density==='compact'?10:2;
  const quota=density==='full'?Infinity:density==='compact'?(zoom<8?1:2):zoom<6?2:Infinity,cells=new Map();
  const index=new LabelBoxIndex();for(const box of obstacles)index.add(box);
  const results=[];
  for(const item of [...items].sort((a,b)=>b.priority-a.priority||String(a.key).localeCompare(String(b.key)))){
    const cell=Math.floor(item.anchor.x/96)+':'+Math.floor(item.anchor.y/96),used=cells.get(cell)||0;
    if(used>=quota&&item.priority<1000){results.push({id:item.id,dx:item.w/2+7,dy:0,hidden:true});continue;}
    const gap=7,x=item.w/2+gap,y=item.h/2+gap;
    const choices=[[x,0],[-x,0],[0,-y],[0,y],[x,-y],[-x,-y],[x,y],[-x,y]];
    if(item.previous){const p=item.previous,box={x:item.anchor.x+p.x-item.w/2,y:item.anchor.y+p.y-item.h/2,w:item.w,h:item.h};if(labelEdgeGap(item.anchor,box)<=12)choices.unshift([p.x,p.y]);}
    let selected=null;
    for(const [dx,dy]of choices){
      const box={x:item.anchor.x+dx-item.w/2,y:item.anchor.y+dy-item.h/2,w:item.w,h:item.h};
      if(box.x<bounds.x||box.y<bounds.y||box.x+box.w>bounds.x+bounds.w||box.y+box.h>bounds.y+bounds.h)continue;
      const padded={x:box.x-padding,y:box.y-padding,w:box.w+padding*2,h:box.h+padding*2};
      if(!avoid||!index.overlaps(padded)){selected={id:item.id,dx,dy,hidden:false};index.add(padded);break;}
    }
    results.push(selected||{id:item.id,dx:x,dy:0,hidden:avoid});
    if(selected||!avoid)cells.set(cell,used+1);
  }
  return {placements:results,checks:index.checks};
}

export function viewportPaintDue(now,last,moving,interval=80){return !moving||now-last>=interval;}
