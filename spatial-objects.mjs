// Immutable geographic envelopes and a packed bounding-volume hierarchy.
// Query by the whole envelope, not just vertices: crossings and enclosing rings survive.
const overlap=(a,b)=>a.west<=b.east&&a.east>=b.west&&a.south<=b.north&&a.north>=b.south;
export function geographicBoxes(points){
 if(!points?.length)return[];
 let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity,previous;
 for(const p of points){let x=Number(p[1]),y=Number(p[0]);if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  if(previous!==undefined){while(x-previous>180)x-=360;while(x-previous< -180)x+=360;}previous=x;
  west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y);
 }
 if(west===Infinity)return[];
 if(east-west>=360)return[{west:-180,east:180,south,north}];
 while(west< -180){west+=360;east+=360;}while(west>180){west-=360;east-=360;}
 return east<=180?[{west,east,south,north}]:[{west,east:180,south,north},{west:-180,east:east-360,south,north}];
}
export function viewBoxes(bounds,buffer=.2){
 let {west,east,south,north}=bounds;if(east<west)east+=360;
 const dx=(east-west)*buffer,dy=(north-south)*buffer;
 west-=dx;east+=dx;south=Math.max(-90,south-dy);north=Math.min(90,north+dy);
 if(east-west>=360)return[{west:-180,east:180,south,north}];
 while(west< -180){west+=360;east+=360;}while(west>180){west-=360;east-=360;}
 return east<=180?[{west,east,south,north}]:[{west,east:180,south,north},{west:-180,east:east-360,south,north}];
}
function envelope(items){return items.reduce((a,b)=>({west:Math.min(a.west,b.west),east:Math.max(a.east,b.east),south:Math.min(a.south,b.south),north:Math.max(a.north,b.north)}),{west:Infinity,east:-Infinity,south:Infinity,north:-Infinity});}
function pack(items){if(!items.length)return null;const box=envelope(items);if(items.length<=16)return{box,items};const x=box.east-box.west>=box.north-box.south;items.sort((a,b)=>x?(a.west+a.east)-(b.west+b.east):(a.south+a.north)-(b.south+b.north));const mid=items.length>>1;return{box,left:pack(items.slice(0,mid)),right:pack(items.slice(mid))};}
export class ObjectSpatialIndex{
 constructor(layers){this.records=new Map();this.byObjectId=new Map();const entries=[];for(const layer of layers)for(const object of layer.objects){const key=layer.id+':'+object.id,boxes=geographicBoxes(object.points),record={key,layer,object,boxes};this.records.set(key,record);this.byObjectId.set(object.id,record);for(const box of boxes)entries.push({...box,key});}this.root=pack(entries);}
 query(bounds,buffer=.2){const found=new Set(),boxes=viewBoxes(bounds,buffer);this.visited=0;
  const visit=(node,box)=>{if(!node||!overlap(node.box,box))return;this.visited++;if(node.items){for(const item of node.items)if(overlap(item,box))found.add(item.key);}else{visit(node.left,box);visit(node.right,box);}};
  for(const box of boxes)visit(this.root,box);return[...found].map(key=>this.records.get(key)).filter(r=>r.layer.visible&&r.object.visible!==false);
 }
}
const mercator=p=>[p[1],Math.log(Math.tan(Math.PI/4+Math.max(-85.05,Math.min(85.05,p[0]))*Math.PI/360))*180/Math.PI];
function segmentError(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=dx||dy?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))):0;return(p[0]-a[0]-dx*t)**2+(p[1]-a[1]-dy*t)**2;}
export function simplifyDisplay(points,zoom,{polygon=false,full=false}={}){
 if(full||zoom>=14||points.length<8)return points;
 const projected=points.map(mercator),threshold=(360/(256*2**zoom)*.7)**2,keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
 while(stack.length){const [a,b]=stack.pop();let far=-1,error=threshold;for(let i=a+1;i<b;i++){const e=segmentError(projected[i],projected[a],projected[b]);if(e>error){error=e;far=i;}}if(far>=0){keep.add(far);stack.push([a,far],[far,b]);}}
 const result=[...keep].sort((a,b)=>a-b).map(i=>points[i]);return polygon&&result.length<3?points:result;
}
export function detailBucket(zoom){return Math.max(0,Math.min(14,Math.floor(zoom)));}
export function diffVisible(current,records){const next=new Map(records.map(r=>[r.key,r]));return{added:records.filter(r=>!current.has(r.key)),removed:[...current.keys()].filter(k=>!next.has(k)),next};}
