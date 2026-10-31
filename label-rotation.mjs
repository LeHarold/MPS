// Leaflet owns the translation. Append rotation after it, so the geographic
// anchor does not rotate around the map container's origin.
export function applyLabelRotation(label,angle){
 label.options.mpsHeading=Number.isFinite(angle)?angle:0;
 if(!label.mpsPositionWithoutHeading&&typeof label._setPosition==='function'){
  label.mpsPositionWithoutHeading=label._setPosition;
  label._setPosition=function(...args){this.mpsPositionWithoutHeading.apply(this,args);const el=this.getElement();if(!el)return;el.style.rotate='none';const base=el.style.transform||'';el.style.transform=base+' rotate('+(this.options.mpsHeading||0)+'deg)';el.style.transformOrigin='center center'};
 }
 const el=label.getElement();if(el)el.style.rotate='none';label.update();
}
