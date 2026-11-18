export const LINE_STYLES = [['solid','實線'],['dashed','虛線'],['dotted','點線'],['dashdot','點畫線'],['double','雙細線']];
export function lineStyleOptions(style) {
  return {mpsLineStyle: style || 'solid', dashArray: ({dashed:'8 6',dotted:'1 5',dashdot:'8 4 1 4'})[style] || null};
}

/** Parallel offsets in renderer pixels; miter joins are limited at sharp corners. */
export function offsetLine(points, offset, closed = false) {
  if (points.length < 2) return points.map(p=>({...p}));
  const normal = (a,b) => {const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy);return n>1e-9?{x:-dy/n,y:dx/n}:{x:0,y:0};};
  return points.map((p,i)=>{
    const before = i > 0 ? normal(points[i-1],p) : closed ? normal(points.at(-1),p) : normal(p,points[1]);
    const after = i < points.length-1 ? normal(p,points[i+1]) : closed ? normal(p,points[0]) : before;
    const sum={x:before.x+after.x,y:before.y+after.y},length=Math.hypot(sum.x,sum.y);
    const direction=length>1e-9?{x:sum.x/length,y:sum.y/length}:after;
    const divisor=Math.max(.25,Math.abs(direction.x*after.x+direction.y*after.y));
    return {x:p.x+direction.x*offset/divisor,y:p.y+direction.y*offset/divisor};
  });
}

/** SVG renderer extension also applies to Leaflet's print-map clones. */
export function installDoubleLines(L) {
  if(L.Canvas&&!L.Canvas.prototype._mpsDoubleInstalled){
    const canvas=L.Canvas.prototype,update=canvas._updatePoly;
    canvas._mpsDoubleInstalled=true;
    canvas._updatePoly=function(layer,closed){
      if(layer.options.mpsLineStyle!=='double')return update.call(this,layer,closed);
      if(!this._drawing||!layer._parts?.length)return;
      const options=layer.options;
      if(options.fill){try{layer.options={...options,stroke:false};update.call(this,layer,closed);}finally{layer.options=options;}}
      const ctx=this._ctx,stroke={options:{...options,fill:false,weight:options.weight>2?1.8:1,_dashArray:[]}};
      for(const offset of [-2,2]){
        ctx.beginPath();
        for(const part of layer._parts){const points=offsetLine(part,offset,closed);points.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p.x,p.y));if(closed)ctx.closePath();}
        this._fillStroke(ctx,stroke);
      }
    };
  }
  const prototype=L.SVG.prototype;
  if(prototype._mpsDoubleInstalled)return;
  prototype._mpsDoubleInstalled=true;
  const updatePoly=prototype._updatePoly,updateStyle=prototype._updateStyle,removePath=prototype._removePath;
  const clear=layer=>{for(const path of layer._mpsTwinPaths||[])path.remove();layer._mpsTwinPaths=null;};
  function paint(layer,closed=layer._mpsClosed) {
    if(!layer._path)return;
    if(layer.options.mpsLineStyle!=='double'){clear(layer);return;}
    layer._path.setAttribute('stroke-opacity','0');
    if(!layer._parts)return;
    if(!layer._mpsTwinPaths)layer._mpsTwinPaths=[-1,1].map(()=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('pointer-events','none');p.setAttribute('class','mps-double-line');layer._path.parentNode.append(p);return p;});
    layer._mpsTwinPaths.forEach((path,index)=>{
      const parts=layer._parts.map(part=>offsetLine(part,index===0?-2:2,closed));
      path.setAttribute('d',parts.map(part=>part.length?'M'+part.map(p=>p.x+','+p.y).join('L')+(closed?'Z':''):'').join(''));
      path.setAttribute('fill','none');path.setAttribute('stroke',layer.options.color);
      path.setAttribute('stroke-width',layer.options.weight>2?1.8:1);
      path.setAttribute('stroke-opacity',layer.options.opacity??1);
      path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
    });
  }
  prototype._updatePoly=function(layer,closed){updatePoly.call(this,layer,closed);layer._mpsClosed=closed;paint(layer,closed);};
  prototype._updateStyle=function(layer){updateStyle.call(this,layer);paint(layer);};
  prototype._removePath=function(layer){clear(layer);return removePath.call(this,layer);};
}
