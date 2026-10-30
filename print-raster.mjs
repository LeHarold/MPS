// Warp Web Mercator tiles into the print map's fixed-latitude projection.
export async function printRaster(ownerMap,kind,opacity=1,progress=()=>{}){
 const size=ownerMap.getSize(),bounds=ownerMap.getBounds(),n=Math.max(1,Math.min(18,Math.ceil(Math.log2(360*size.x/256/(bounds.getEast()-bounds.getWest()))))),count=2**n;
 const tileY=lat=>(1-Math.asinh(Math.tan(Math.max(-85.051128,Math.min(85.051128,lat))*Math.PI/180))/Math.PI)/2*count;
 const west=bounds.getWest()/360*count+count/2,east=bounds.getEast()/360*count+count/2,top=tileY(bounds.getNorth()),bottom=tileY(bounds.getSouth());
 const jobs=[];for(let x=Math.floor(west);x<Math.ceil(east);x++)for(let y=Math.max(0,Math.floor(top));y<Math.min(count,Math.ceil(bottom));y++)jobs.push({x,y});
 if(jobs.length>400)throw Error('列印範圍過大，請調整比例尺');
 const tiles=new Map(),total=jobs.length;let complete=0;
 await Promise.all(Array.from({length:Math.min(8,jobs.length)},async()=>{while(jobs.length){const {x,y}=jobs.shift(),tx=((x%count)+count)%count,url=kind==='satellite'?`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${n}/${y}/${tx}`:`https://tile.openstreetmap.org/${n}/${tx}/${y}.png`;
 const response=await fetch(url,{mode:'cors',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('底圖載入失敗，請重試');const bitmap=await createImageBitmap(await response.blob());tiles.set(x+','+y,bitmap);progress(Math.round(++complete/total*100));
 }}));
 const canvas=document.createElement('canvas');canvas.width=size.x;canvas.height=size.y;const ctx=canvas.getContext('2d');
 for(let row=0;row<size.y;row++){const lat=ownerMap.containerPointToLatLng([0,row+.5]).lat,sy=tileY(lat),ty=Math.floor(sy);for(let x=Math.floor(west);x<Math.ceil(east);x++){const img=tiles.get(x+','+ty);if(!img)continue;const dx=(x-west)/(east-west)*size.x,dw=size.x/(east-west);ctx.drawImage(img,0,Math.min(255.99,(sy-ty)*256),256,Math.max(.01,Math.min(1,Math.abs(tileY(ownerMap.containerPointToLatLng([0,row+1]).lat)-tileY(ownerMap.containerPointToLatLng([0,row]).lat))*256)),dx,row,dw,1)}}
 for(const img of tiles.values())img.close();return L.imageOverlay(canvas.toDataURL('image/png'),bounds,{pane:'basePane',opacity,interactive:false});
}
