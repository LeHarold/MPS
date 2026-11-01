// Leaflet owns the translation. Append rotation after it, so the geographic
// anchor does not rotate around the map container's origin.
export function rotatedLabelEdge(anchor,{cx,cy,width,height,angle=0}){
 const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r),dx=anchor.x-cx,dy=anchor.y-cy;
 const x=Math.max(-width/2,Math.min(width/2,dx*c+dy*s)),y=Math.max(-height/2,Math.min(height/2,-dx*s+dy*c));
 return{x:cx+x*c-y*s,y:cy+x*s+y*c};
}
export function labelBorderSize(element){const style=getComputedStyle(element),extra=axis=>style.boxSizing==='border-box'?0:axis.reduce((n,key)=>n+(parseFloat(style[key])||0),0);return{width:(parseFloat(style.width)||element.offsetWidth)+extra(['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth']),height:(parseFloat(style.height)||element.offsetHeight)+extra(['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'])}}
export function applyLabelRotation(label,angle){
 label.options.mpsHeading=Number.isFinite(angle)?angle:0;
 if(!label.mpsPositionWithoutHeading&&typeof label._setPosition==='function'){
  label.mpsPositionWithoutHeading=label._setPosition;
  label._setPosition=function(...args){this.mpsPositionWithoutHeading.apply(this,args);const el=this.getElement();if(!el)return;el.style.rotate='none';if(this.options.mpsClampOffset){const next=this.options.mpsClampOffset(this);if(next){this.options.offset=next;this.mpsPositionWithoutHeading.apply(this,args)}}const base=el.style.transform||'';el.style.transform=base+' rotate('+(this.options.mpsHeading||0)+'deg)';el.style.transformOrigin='center center'};
 }
 const el=label.getElement();if(el)el.style.rotate='none';label.update();
}
export function preserveLabelCenter(label,center,point){if(!center)return;const el=label.getElement();if(!el)return;const r=el.getBoundingClientRect(),dx=center.x-(r.left+r.width/2),dy=center.y-(r.top+r.height/2);if(Math.hypot(dx,dy)<.02)return;const old=label.options.offset||{x:0,y:0};label.options.offset=point(old.x+dx,old.y+dy);label.update()}
