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
export function createNavigationRuler({ map, getReference, formatDistance, onVisibility, onGestureStart }) {
  const host = map.getContainer(), wrap = host.parentElement;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('navigation-ruler');
  svg.setAttribute('aria-label', '雙點量尺：雙向航向與大圓距離');
  svg.innerHTML = '<g class="navigation-band"><rect class="navigation-shade" y="-35" height="70"/><path class="navigation-lines"/><text class="navigation-forward" y="-17"/><text class="navigation-distance" y="4"/><text class="navigation-reverse" y="25"/></g><circle data-ruler-end="0" r="13"/><circle data-ruler-end="1" r="13"/>';
  wrap.append(svg);
  let points = null, timer = null, drag = null, candidate = null, blockedClick = false;
  const touches = new Map();
  const local = event => { const r = host.getBoundingClientRect(); return [event.clientX - r.left, event.clientY - r.top]; };
  const inside = event => host.contains(event.target) || svg.contains(event.target);
  const toGeo = p => map.containerPointToLatLng(p);
  const suppress = event => { event.preventDefault(); event.stopImmediatePropagation(); };
  let resumeDragging = false, resumeZoom = false;
  function pause() {
    onGestureStart?.();
    resumeDragging = map.dragging.enabled(); resumeZoom = map.touchZoom.enabled();
    map.dragging.disable(); map.touchZoom.disable();
  }
  function resume() {
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
  function down(event) {
    if (!inside(event) || event.target.closest('.instrument,.object-transform,.compass-center,.compass-end')) return;
    blockedClick = false;
    const p = local(event), end = event.target.closest('[data-ruler-end]');
    if (end && points) {
      pause(); drag = { id: event.pointerId, end: Number(end.dataset.rulerEnd), start: p, moved: false }; suppress(event); return;
    }
    if (points) candidate = { id: event.pointerId, p, moved: false };
    if (event.pointerType !== 'touch') return;
    touches.set(event.pointerId, { p, start: p });
    if (touches.size === 2) {
      onGestureStart?.(); candidate = null; clearTimer();
      timer = setTimeout(() => {
        timer = null;
        if (touches.size !== 2) return;
        pause(); drag = { dual: true }; blockedClick = true;
        show([...touches.values()].map(t => toGeo(t.p)));
      }, 1000);
    } else if (touches.size > 2) clearTimer();
  }
  function move(event) {
    const p = local(event), touch = touches.get(event.pointerId);
    if (touch) { touch.p = p; if (Math.hypot(p[0]-touch.start[0], p[1]-touch.start[1]) > 10) clearTimer(); }
    if (candidate?.id === event.pointerId && Math.hypot(p[0]-candidate.p[0],p[1]-candidate.p[1]) > 6) candidate.moved = true;
    if (!drag) return;
    if (drag.dual && touch && touches.size === 2) points = [...touches.values()].map(t => toGeo(t.p));
    else if (drag.id === event.pointerId) { points[drag.end] = toGeo(p); drag.moved ||= Math.hypot(p[0]-drag.start[0],p[1]-drag.start[1]) > 4; }
    else return;
    render(); suppress(event);
  }
  function up(event) {
    clearTimer(); touches.delete(event.pointerId);
    if (drag) {
      if (!drag.dual && drag.id !== event.pointerId) return;
      if (!drag.dual && !drag.moved && event.type !== 'pointercancel') show(null);
      if (!drag.dual || touches.size === 0) { drag = null; resume(); }
      blockedClick = true; suppress(event); return;
    }
    if (candidate?.id === event.pointerId) {
      if (!candidate.moved && event.type !== 'pointercancel' && points) { show(null); blockedClick = true; onGestureStart?.(); suppress(event); }
      candidate = null;
    }
  }
  const click = event => { if (inside(event) && (blockedClick || points)) { if (points) show(null); blockedClick = false; suppress(event); } };
  const touchMove = event => { if (drag) suppress(event); };
  window.addEventListener('pointerdown', down, true);
  window.addEventListener('pointermove', move, { capture: true, passive: false });
  window.addEventListener('pointerup', up, { capture: true, passive: false });
  window.addEventListener('pointercancel', up, { capture: true, passive: false });
  window.addEventListener('click', click, true);
  window.addEventListener('touchmove', touchMove, { capture: true, passive: false });
  map.on('move zoom resize', render);
  render();
  return {
    get visible() { return !!points; }, render,
    showDefault() { const s = map.getSize(); show([toGeo([s.x*.25,s.y*.5]),toGeo([s.x*.75,s.y*.5])]); },
    hide() { clearTimer(); drag = candidate = null; touches.clear(); resume(); show(null); }
  };
}
