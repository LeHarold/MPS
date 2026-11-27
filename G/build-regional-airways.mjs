import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';

const partitions = {
  japan: [122, 24, 150, 46],
  philippines: [116, 4, 130, 21.75],
  china: [73, 17.5, 135.2, 54],
};
const read = name => gunzipSync(fs.readFileSync('outputs/fg-'+name+'.dat.gz')).toString('latin1').split(/\r?\n/).slice(3);
function within(lng,lat,[west,south,east,north]) {
  return lng>=west&&lng<=east&&lat>=south&&lat<=north;
}
const airways=read('airways').map(line=>line.trim().split(/\s+/)).filter(row=>row.length===10);
const fixes=read('fixes').map(line=>line.trim().split(/\s+/)).filter(row=>row.length===3);
for(const [region,bounds] of Object.entries(partitions)){
 const routes=[];
 for(const [from,lat1,lng1,to,lat2,lng2,,,,name] of airways){
   const a=[+lat1,+lng1],b=[+lat2,+lng2];
   if(!within((a[1]+b[1])/2,(a[0]+b[0])/2,bounds))continue;
   if(region==='china'&&(within((a[1]+b[1])/2,(a[0]+b[0])/2,partitions.japan)||within((a[1]+b[1])/2,(a[0]+b[0])/2,partitions.philippines)))continue;
   routes.push([name,from,...a,to,...b]);
 }
 const points=fixes.flatMap(([lat,lng,name])=>within(+lng,+lat,bounds)&&!(region==='china'&&(within(+lng,+lat,partitions.japan)||within(+lng,+lat,partitions.philippines)))?[[name,+lat,+lng]]:[]);
 fs.writeFileSync('dist/regional-'+region+'.json',JSON.stringify({cycle:'2013.10',region,bounds,routes,points})+'\n');
 console.log(region,routes.length,points.length);
}
