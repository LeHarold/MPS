// One long-press contract for map objects, labels and instruments.
export function createPressControls({host,resolve,onBegin=()=>{},onCommit=()=>{},onClose=()=>{}}){
 const control=document.createElement('div');control.className='object-transform';control.hidden=true;control.setAttribute('role','group');control.setAttribute('aria-label','物件移動旋轉縮放');
 control.innerHTML='<div class="transform-title"></div><div class="transform-dial"><button class="transform-ring" data-transform="rotate" aria-label="拖動外圍圓環旋轉"><svg viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="39"/><path d="m78 17 5 14-14-3"/></svg></button><button class="transform-move" data-transform="move" aria-label="拖動十字箭頭移動"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3v26M3 16h26M12 7l4-4 4 4M12 25l4 4 4-4M7 12l-4 4 4 4M25 12l4 4-4 4"/></svg></button><button class="transform-scale" data-transform="scale" aria-label="拖動縮放">↗</button></div><button class="transform-done" aria-label="完成物件操作">✓</button>';
 host.append(control);let current=null,hold=null,gesture=null,suppressUntil=0;
 const clearHold=()=>{if(!hold)return;clearTimeout(hold.timer);hold=null};
 function position(){if(!current)return;const p=current.anchor(),box=host.getBoundingClientRect(),bottom=Math.min(box.height-156,window.innerHeight-box.top-156),right=Math.min(box.width-64,window.innerWidth-box.left-64);control.style.left=Math.max(64,Math.min(right,p.x))+'px';control.style.top=Math.max(8,Math.min(bottom,p.y+24))+'px'}
 function close(){clearHold();if(gesture)finish();current=null;control.hidden=true;onClose()}
 function show(target){if(gesture)finish();current=target;control.querySelector('.transform-title').textContent=target.name;control.querySelector('[data-transform=move]').disabled=target.move===false;control.querySelector('[data-transform=rotate]').disabled=target.rotate===false;control.querySelector('[data-transform=scale]').disabled=target.scale===false;control.hidden=false;position()}
 function stop(e){e.preventDefault();e.stopImmediatePropagation()}
 host.addEventListener('pointerdown',e=>{
  if(e.target.closest('.object-transform')||e.button!==0)return;
  const target=resolve(e.target,e);if(!target){if(current&&!e.target.closest('input,button,select'))close();return}
  stop(e);clearHold();const pending={id:e.pointerId,x:e.clientX,y:e.clientY,target};pending.timer=setTimeout(()=>{if(hold!==pending)return;show(target);suppressUntil=performance.now()+800;pending.activated=true;host.dispatchEvent(new CustomEvent('mps-transform-ready',{detail:{name:target.name}}))},450);hold=pending;
 },true);
 host.addEventListener('pointermove',e=>{if(!hold||hold.id!==e.pointerId)return;if(Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>9&&!hold.activated){suppressUntil=performance.now()+500;clearHold()}else if(hold.activated)stop(e)},true);
 host.addEventListener('pointerup',e=>{if(hold?.id===e.pointerId){if(hold.activated){stop(e);suppressUntil=performance.now()+500}clearHold()}},true);
 host.addEventListener('pointercancel',clearHold,true);
 for(const name of ['mousedown','touchstart','contextmenu'])host.addEventListener(name,e=>{if(!e.target.closest('.object-transform')&&resolve(e.target,e)){if(name==='contextmenu'||name==='touchstart')e.preventDefault();e.stopImmediatePropagation()}},true);
 host.addEventListener('click',e=>{if(performance.now()<suppressUntil&&!e.target.closest('.object-transform'))stop(e)},true);
 function finish(cancel=false){if(!gesture)return;const g=gesture;gesture=null;if(cancel)current?.apply({dx:0,dy:0,angle:0,scale:1},g.base,g.mode);current?.finish?.();onCommit();position()}
 control.addEventListener('pointerdown',e=>{const button=e.target.closest('[data-transform]');if(!button||button.disabled||!current)return;stop(e);const rect=control.querySelector('.transform-dial').getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;onBegin();gesture={id:e.pointerId,mode:button.dataset.transform,base:current.capture(),x:e.clientX,y:e.clientY,cx,cy,angle:Math.atan2(e.clientY-cy,e.clientX-cx),radius:Math.max(20,Math.hypot(e.clientX-cx,e.clientY-cy))};control.setPointerCapture(e.pointerId)});
 control.addEventListener('pointermove',e=>{const g=gesture;if(!g||g.id!==e.pointerId)return;stop(e);const angle=(Math.atan2(e.clientY-g.cy,e.clientX-g.cx)-g.angle)*180/Math.PI,scale=Math.max(.05,Math.min(20,Math.hypot(e.clientX-g.cx,e.clientY-g.cy)/g.radius));current.apply({dx:e.clientX-g.x,dy:e.clientY-g.y,angle,scale},g.base,g.mode)});
 control.addEventListener('pointerup',e=>{if(gesture?.id===e.pointerId){stop(e);finish()}});control.addEventListener('pointercancel',()=>finish(true));control.querySelector('.transform-done').onclick=e=>{e.stopPropagation();close()};
 const keydown=e=>{if(e.key==='Escape')close()},outside=e=>{if(current&&!host.contains(e.target))close()},release=e=>{if(hold?.id===e.pointerId)clearHold()};
 document.addEventListener('keydown',keydown);document.addEventListener('pointerdown',outside,true);document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);host.addEventListener('pointerleave',clearHold);control.addEventListener('lostpointercapture',()=>finish());
 return {show,close,position,element:control,destroy(){close();document.removeEventListener('keydown',keydown);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('pointerup',release);document.removeEventListener('pointercancel',release);control.remove()},get target(){return current}};
}
