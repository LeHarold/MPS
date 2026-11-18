import { calculateMagVar } from './vendor/wmm2025.mjs';

const radians = value => value * Math.PI / 180;
export function initialCourse(a, b) {
  const delta = radians(b.lng - a.lng);
  const y = Math.sin(delta) * Math.cos(radians(b.lat));
  const x = Math.cos(radians(a.lat)) * Math.sin(radians(b.lat)) -
    Math.sin(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.cos(delta);
  return Math.hypot(x, y) < 1e-12 ? null : (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function navigationReadout(a, b, reference = 'magnetic', date = new Date()) {
  const dLat = radians(b.lat - a.lat), dLon = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2;
  const metres = 2 * 6371008.8 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
  const course = (from, to) => {
    let value = initialCourse(from, to);
    if (value === null) return null;
    if (reference === 'magnetic') {
      const year = date.getUTCFullYear();
      if (year < 2025 || year >= 2030) return null;
      value -= calculateMagVar(date.valueOf() / 86400000 + 2440587.5, from.lat, from.lng, 0);
    }
    return (value + 360) % 360;
  };
  return { metres, forward: course(a, b), reverse: course(b, a) };
}

/** Transient geographic ruler. It never creates a saved drawing or changes map objects. */
export function createNavigationRuler({ map, getReference, formatDistance, onVisibility, onGestureStart, onClaim }) {
  const host = map.getContainer(), wrap = host.parentElement;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('navigation-ruler');
  svg.setAttribute('aria-label', '雙點量尺：雙向航向與大圓距離');
  svg.innerHTML = '<g class="navigation-band"><rect class="navigation-shade" y="-35" height="70"/><path class="navigation-lines"/><text class="navigation-forward" y="-17"/><text class="navigation-distance" y="4"/><text class="navigation-reverse" y="25"/></g><circle data-ruler-end="0" r="13"/><circle data-ruler-end="1" r="13"/>';
  wrap.append(svg);
  let points = null, timer = null, drag = null, candidate = null, blockedClick = false;
  let owned = false, oneBase = null, pinchBase = null, multiTouch = false;
  const touches = new Map();
  const local = event => { const r = host.getBoundingClientRect(); return [event.clientX - r.left, event.clientY - r.top]; };
  const inside = event => host.contains(event.target) || svg.contains(event.target);
  const toGeo = p => map.containerPointToLatLng(p);
  const suppress = event => { if(event.cancelable !== false)event.preventDefault(); event.stopImmediatePropagation(); };
  let resumeDragging = false, resumeZoom = false;
  function pause() {
    if(owned)return;
    owned=true;
    onGestureStart?.();
    resumeDragging = map.dragging.enabled(); resumeZoom = map.touchZoom.enabled();
    onClaim?.();
    map.dragging.disable(); map.touchZoom.disable();
  }
  function resume() {
    if(!owned)return;
    owned=false;
    if (resumeDragging) map.dragging.enable();
    if (resumeZoom) map.touchZoom.enable();
    resumeDragging = resumeZoom = false;
  }
  function render() {
    // SVG has no reflected HTMLElement.hidden property in Safari or Chromium.
    svg.setAttribute('style', points ? '' : 'display:none');
    if (!points) return;
    const size = map.getSize(); svg.setAttribute('viewBox', `0 0 ${size.x} ${size.y}`);
    let [a, b] = points.map(p => map.latLngToContainerPoint(p));
    let [from, to] = points;
    if (a.x > b.x) { [a, b] = [b, a]; [from, to] = [to, from]; }
    const length = Math.hypot(b.x - a.x, b.y - a.y), angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const band = svg.querySelector('g'); band.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${angle})`);
    svg.querySelector('rect').setAttribute('width', length);
    svg.querySelector('path').setAttribute('d', `M0,-35V35 M${length},-35V35 M0,-30H${length} M0,30H${length} M0,0H${length}`);
    const reference = getReference(), data = navigationReadout(from, to, reference);
    const course = value => (value === null ? '—' : String(Math.round(value) % 360).padStart(3, '0') + '°') + (reference === 'true' ? ' T' : ' M');
    for (const text of svg.querySelectorAll('text')) text.setAttribute('x', length / 2);
    svg.querySelector('.navigation-forward').textContent = course(data.forward) + ' →';
    svg.querySelector('.navigation-distance').textContent = formatDistance(data.metres);
    svg.querySelector('.navigation-reverse').textContent = '← ' + course(data.reverse);
    svg.querySelectorAll('circle').forEach((node, i) => { const p = map.latLngToContainerPoint(points[i]); node.setAttribute('cx', p.x); node.setAttribute('cy', p.y); });
  }
  function show(value) { points = value; document.body.classList.toggle('navigation-ruler-active', !!points); onVisibility?.(!!points); render(); }
  function clearTimer() { clearTimeout(timer); timer = null; }
  const screenPoints = () => points.map(p=>{const s=map.latLngToContainerPoint(p);return [s.x,s.y];});
  const excluded = node => node.closest?.('.instrument,.object-transform,.compass-center,#compass-end,.compass-gesture-arm,.compass-gesture-ring');
  function rulerEnd(node){const end=node.closest?.('[data-ruler-end]');return end?Number(end.dataset.rulerEnd):null;}
  function resetBase() {
    oneBase=pinchBase=null;
    if(!points||!touches.size)return;
    const fingers=[...touches.entries()];
    if(fingers.length===1){const [id,touch]=fingers[0];oneBase={id,at:[...touch.p],points:screenPoints(),end:touch.end};}
    else pinchBase={ids:fingers.slice(0,2).map(([id])=>id),at:fingers.slice(0,2).map(([,t])=>[...t.p]),points:screenPoints()};
  }
  function updateTouchGeometry() {
    if(pinchBase){
      const current=pinchBase.ids.map(id=>touches.get(id)?.p);
      if(current.some(p=>!p))return;
      const [a,b]=pinchBase.at,[c,d]=current;
      const oldLength=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(oldLength<2)return;
      const scale=Math.hypot(d[0]-c[0],d[1]-c[1])/oldLength;
      const angle=Math.atan2(d[1]-c[1],d[0]-c[0])-Math.atan2(b[1]-a[1],b[0]-a[0]);
      points=pinchBase.points.map(p=>{
        const x=p[0]-(a[0]+b[0])/2,y=p[1]-(a[1]+b[1])/2;
        return toGeo([(c[0]+d[0])/2+scale*(x*Math.cos(angle)-y*Math.sin(angle)),(c[1]+d[1])/2+scale*(x*Math.sin(angle)+y*Math.cos(angle))]);
      });
    }else if(oneBase){
      const touch=touches.get(oneBase.id);if(!touch)return;
      const dx=touch.p[0]-oneBase.at[0],dy=touch.p[1]-oneBase.at[1];
      points=oneBase.points.map((p,i)=>toGeo(oneBase.end===null||oneBase.end===i?[p[0]+dx,p[1]+dy]:p));
    }
    render();
  }
  function touchStart(event) {
    const added=[...event.changedTouches].filter(t=>inside(t)&&!excluded(t.target));
    if(!added.length)return;
    if(!touches.size){blockedClick=false;multiTouch=false;candidate=null;}
    for(const t of added){const p=local(t);touches.set(t.identifier,{p,start:[...p],end:rulerEnd(t.target),moved:false});}
    if(touches.size>1){multiTouch=true;candidate=null;onGestureStart?.();}
    const onRuler=points&&added.some(t=>svg.contains(t.target));
    if(owned||onRuler){
      clearTimer();pause();resetBase();blockedClick=true;suppress(event);return;
    }
    if(points&&touches.size===1){const [id,t]=[...touches][0];candidate={id,p:[...t.p],moved:false};}
    clearTimer();
    if(touches.size===2&&!added.some(t=>touches.get(t.identifier).moved)){
      timer=setTimeout(()=>{
        timer=null;
        if(touches.size!==2||[...touches.values()].some(t=>t.moved))return;
        pause();blockedClick=true;
        show([...touches.values()].map(t=>toGeo(t.p)));
        [...touches.values()].forEach((t,i)=>t.end=i);
        resetBase();
      },1000);
    }
  }
  function touchMove(event) {
    let tracked=false;
    for(const t of event.touches){const record=touches.get(t.identifier);if(!record)continue;tracked=true;record.p=local(t);if(Math.hypot(record.p[0]-record.start[0],record.p[1]-record.start[1])>(owned?3:8))record.moved=true;}
    if(!tracked)return;
    if([...touches.values()].some(t=>t.moved))clearTimer();
    if(candidate){const t=touches.get(candidate.id);if(t?.moved)candidate.moved=true;}
    if(owned){updateTouchGeometry();suppress(event);}
  }
  function touchEnd(event) {
    const ended=[...event.changedTouches].filter(t=>touches.has(t.identifier));
    if(!ended.length)return;
    clearTimer();
    const wasOwned=owned,cancelled=event.type==='touchcancel';
    if(!cancelled)for(const t of ended){const record=touches.get(t.identifier);record.p=local(t);if(Math.hypot(record.p[0]-record.start[0],record.p[1]-record.start[1])>(owned?3:8))record.moved=true;}
    const tap=!cancelled&&!multiTouch&&ended.length===1&&!touches.get(ended[0].identifier).moved;
    if(!cancelled&&owned){
      for(const t of ended)touches.get(t.identifier).p=local(t);
      updateTouchGeometry();
    }
    ended.forEach(t=>touches.delete(t.identifier));
    if(wasOwned){
      if(tap&&points)show(null);
      if(cancelled){touches.clear();oneBase=pinchBase=null;resume();}
      else if(touches.size)resetBase();else{oneBase=pinchBase=null;resume();}
      blockedClick=true;suppress(event);
    }else if(tap&&points&&candidate&&!candidate.moved){show(null);onGestureStart?.();blockedClick=true;suppress(event);}
    else if(multiTouch||cancelled||candidate?.moved)blockedClick=true;
    candidate=null;
    if(!touches.size)multiTouch=false;
  }
  function down(event) {
    // Leaflet uses TouchEvents. Do not also process their compatibility PointerEvents.
    if(event.pointerType==='touch')return;
    if (!inside(event) || excluded(event.target)) return;
    blockedClick = false;
    const p = local(event), end = event.target.closest('[data-ruler-end]');
    if (end && points) {
      pause(); drag = { id: event.pointerId, end: Number(end.dataset.rulerEnd), start: p, moved: false }; suppress(event); return;
    }
    if (points) candidate = { id: event.pointerId, p, moved: false };
  }
  function move(event) {
    if(event.pointerType==='touch')return;
    const p = local(event);
    if (candidate?.id === event.pointerId && Math.hypot(p[0]-candidate.p[0],p[1]-candidate.p[1]) > 6) candidate.moved = true;
    if (!drag) return;
    if (drag.id === event.pointerId) { points[drag.end] = toGeo(p); drag.moved ||= Math.hypot(p[0]-drag.start[0],p[1]-drag.start[1]) > 4; }
    else return;
    render(); suppress(event);
  }
  function up(event) {
    if(event.pointerType==='touch')return;
    if (drag) {
      if (drag.id !== event.pointerId) return;
      if (!drag.moved && event.type !== 'pointercancel') show(null);
      drag = null; resume();
      blockedClick = true; suppress(event); return;
    }
    if (candidate?.id === event.pointerId) {
      if (candidate.moved) blockedClick = true;
      if (!candidate.moved && event.type !== 'pointercancel' && points) { show(null); blockedClick = true; onGestureStart?.(); suppress(event); }
      candidate = null;
    }
  }
  const click = event => {
    if (!inside(event)) return;
    if (blockedClick) { blockedClick = false; suppress(event); return; }
    if (points) { show(null); suppress(event); }
  };
  const cancel=()=>{clearTimer();touches.clear();oneBase=pinchBase=drag=candidate=null;multiTouch=false;resume();};
  window.addEventListener('pointerdown', down, true);
  window.addEventListener('pointermove', move, { capture: true, passive: false });
  window.addEventListener('pointerup', up, { capture: true, passive: false });
  window.addEventListener('pointercancel', up, { capture: true, passive: false });
  window.addEventListener('click', click, true);
  window.addEventListener('touchstart', touchStart, { capture: true, passive: false });
  window.addEventListener('touchmove', touchMove, { capture: true, passive: false });
  window.addEventListener('touchend', touchEnd, { capture: true, passive: false });
  window.addEventListener('touchcancel', touchEnd, { capture: true, passive: false });
  window.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  map.on('move zoom resize', render);
  render();
  return {
    get visible() { return !!points; }, render,
    showDefault() { const s = map.getSize(); show([toGeo([s.x*.25,s.y*.5]),toGeo([s.x*.75,s.y*.5])]); },
    hide() { cancel(); show(null); }
  };
}
