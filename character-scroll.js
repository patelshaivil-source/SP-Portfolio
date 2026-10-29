/* Transparent character overlay (145-frame sequence). The existing portfolio background is untouched.
 *
 * Frames live in /character-frames/c000.webp … c144.webp (transparent, 659x915, cropped to one shared box).
 * Frames 0-84 are the head-turn (looking left -> facing camera at 42 -> looking right); 85-144 are the wave.
 * - Scrolling plays the whole sequence with an inertial playhead and cross-fades neighbouring frames.
 * - Cursor gaze: head/eyes follow the pointer (sweeps the head-turn frames, then a smaller sway while scrolling).
 */
(() => {
  'use strict';
  const scriptURL = document.currentScript.src;
  const stage = document.getElementById('heroStage');
  if (!stage) {
    const frame = document.querySelector('iframe[title="Shaivil Patel portfolio"]');
    if (!frame) return;
    const install = () => {
      const doc = frame.contentDocument;
      if (!doc || !doc.getElementById('heroStage') || doc.getElementById('character-scroll-script')) return;
      const script = doc.createElement('script');
      script.id = 'character-scroll-script';
      script.src = scriptURL;
      doc.body.appendChild(script);
    };
    frame.addEventListener('load', install);
    install();
    return;
  }
  if (document.getElementById('characterScrollCanvas')) return;
  const journey = document.getElementById('heroJourney');
  const canvas = document.createElement('canvas');
  canvas.id = 'characterScrollCanvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Shaivil turns and waves hello as you scroll.');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;';
  stage.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const N = 145, HEAD_END = 84, REST = 42;            // frame count, last head-turn frame, camera-facing frame
  const MW = 1440, MH = 810;                          // offscreen blend layer (16:9)
  // The cutout was cropped from a 1672x941 frame at (450,26) size 659x915; keep that placement in the 16:9 layer.
  const FX = 450/1672*MW, FY = 26/941*MH, FW = 659/1672*MW, FH = 915/941*MH;
  const mix = document.createElement('canvas'); mix.width = MW; mix.height = MH;
  const mctx = mix.getContext('2d', { alpha: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const assetBase = new URL('character-frames/', new URL('.', scriptURL));
  const blobs = new Array(N), bitmaps = new Array(N), pending = new Array(N);
  let loaded = false, disposed = false, inView = true, ready = 0;
  let target = 0, current = 0, last = 0, raf = 0, width = 0, height = 0;
  // Cursor gaze
  let gx = 0, gy = 0, gtx = 0, gty = 0, gaze = 0, pointerSeen = false;
  const clamp = x => Math.min(1, Math.max(0, x));
  const range = (x,a,b) => Math.min(b, Math.max(a, x));

  // ---- frame loading: rest pose first, then outward; decode lazily in a sliding window ----
  const order = [...Array(N).keys()].sort((a,b) => Math.abs(a-REST) - Math.abs(b-REST));
  let qi = 0, active = 0;
  function pump() {
    while (qi < order.length && active < 6) {
      const i = order[qi++]; active++;
      fetch(new URL('c' + String(i).padStart(3,'0') + '.webp', assetBase)).then(r => { if (!r.ok) throw Error('frame'); return r.blob(); })
        .then(b => { blobs[i] = b; ready++; if (!loaded && ready >= 12) { loaded = true; canvas.dataset.loaded = String(N); size(); } })
        .catch(() => { canvas.dataset.error = 'load'; })
        .finally(() => { active--; pump(); });
    }
  }
  function bitmap(i) {
    if (bitmaps[i]) return bitmaps[i];
    if (blobs[i] && !pending[i]) {
      pending[i] = createImageBitmap(blobs[i]).then(bm => { if (pending[i]) bitmaps[i] = bm; else bm.close(); }).catch(() => { pending[i] = null; });
    }
    return null;
  }
  function nearestReady(i) {
    for (let d = 0; d < N; d++) for (const j of [i-d, i+d]) if (j >= 0 && j < N && bitmaps[j]) return bitmaps[j];
    return null;
  }
  function evict(center) {
    for (let i = 0; i < N; i++) if (bitmaps[i] && Math.abs(i-center) > 18) { bitmaps[i].close(); bitmaps[i] = null; pending[i] = null; }
  }

  function size() {
    const box = stage.getBoundingClientRect();
    width = box.width; height = box.height;
    const mask = width<=700 ? 'linear-gradient(to bottom,black 55%,transparent 68%)' : 'linear-gradient(to bottom,black 87%,transparent 100%)';
    canvas.style.maskImage = mask; canvas.style.webkitMaskImage = mask;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    update();
  }
  function update() {
    const rect = journey.getBoundingClientRect();
    target = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
    wake();
  }
  function wake() {
    if (!raf && loaded && inView && !document.hidden && !disposed) raf = requestAnimationFrame(tick);
  }
  function draw(progress) {
    // Welcome text first, then the character story: scroll plays frames 0..144.
    let t = reduced.matches ? 90 : clamp((progress-.10)/.77)*(N-1);
    // Name section: the avatar is on screen from the first paint, facing the camera, then eases into the scroll story.
    if (!reduced.matches) t = Math.max(t, REST*(1-clamp((progress-.03)/.07)));
    if (!reduced.matches && gaze > .001) {
      // Early on the cursor sweeps the head-turn frames (left -> facing you -> right); later it adds a gentle sway.
      const idle = 1 - clamp((progress-.16)/.14);
      const sweep = REST + gx*(HEAD_END-REST);
      const eff = idle*sweep + (1-idle)*(t + gx*10);
      t = range(t + (eff - t)*gaze, 0, N-1);
    }
    const low = Math.floor(t), high = Math.min(N-1, low+1), alpha = t-low;
    for (let i = low-3; i <= high+3; i++) if (i >= 0 && i < N) bitmap(i);
    if (bitmaps[low]) evict(Math.round(t));
    const A = bitmaps[low] || nearestReady(low), B = bitmaps[high] || A;
    if (A) {
      mctx.clearRect(0,0,MW,MH);
      // additive premultiplied blend so opaque overlap pixels never turn translucent
      mctx.globalCompositeOperation = 'source-over';
      mctx.globalAlpha = 1-alpha;
      mctx.drawImage(A,FX,FY,FW,FH);
      if (alpha > .01 && B) {
        mctx.globalCompositeOperation = 'lighter';
        mctx.globalAlpha = alpha;
        mctx.drawImage(B,FX,FY,FW,FH);
      }
      mctx.globalAlpha = 1;
      mctx.globalCompositeOperation = 'source-over';
    }
    ctx.clearRect(0,0,width,height);
    const mobile = width <= 700;
    const h = height*(mobile ? .51 : .83), w = h*16/9;
    const x = width*(mobile ? .50 : .32)-w/2;
    const y = height*(mobile ? .16 : .17);
    ctx.globalAlpha = reduced.matches ? 1 : clamp((1-progress)/.08);
    ctx.drawImage(mix,x,y,w,h);
    ctx.globalAlpha = 1;
    canvas.style.transform = gaze>.001 && !reduced.matches ? `perspective(900px) rotateY(${(gx*4*gaze).toFixed(2)}deg) rotateX(${(-gy*2*gaze).toFixed(2)}deg) translateX(${(gx*6*gaze).toFixed(1)}px)` : '';
    canvas.dataset.gaze = gx.toFixed(3);
    canvas.dataset.pose = t.toFixed(3);
    canvas.dataset.progress = progress.toFixed(4);
  }
  function tick(now) {
    raf = 0;
    if (!loaded || !inView || document.hidden || disposed) { last=0; return; }
    const dt = last ? Math.min(50,now-last) : 16.67;
    last = now;
    current += (target-current)*(1-Math.exp(-dt/85));
    if (Math.abs(current-target)<.0001) current = target;
    const gk = 1-Math.exp(-dt/110);
    gx += (gtx-gx)*gk; gy += (gty-gy)*gk;
    gaze += ((pointerSeen?1:0)-gaze)*(1-Math.exp(-dt/260));
    draw(current);
    const gazeMoving = Math.abs(gtx-gx)>.002 || Math.abs(gty-gy)>.002 || (pointerSeen && gaze<.995);
    const decoding = ready < N && ready >= 12 || pending.some((p,i)=>p && !bitmaps[i]);
    if ((Math.abs(current-target)>.0001 || gazeMoving || decoding) && !reduced.matches) wake();
    else last = 0;
  }
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) { last=0; update(); } else { cancelAnimationFrame(raf); raf=0; last=0; }
  });
  observer.observe(stage);
  const resize = new ResizeObserver(size); resize.observe(stage);
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    gtx = range((e.clientX/Math.max(1,window.innerWidth))*2-1,-1,1);
    gty = range((e.clientY/Math.max(1,window.innerHeight))*2-1,-1,1);
    pointerSeen = true; wake();
  }, { passive:true });
  document.addEventListener('pointerleave', () => { gtx=0; gty=0; wake(); });
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', size, { passive:true });
  document.addEventListener('visibilitychange', () => { last=0; if (!document.hidden) update(); });
  reduced.addEventListener('change', update);
  window.addEventListener('pageshow', () => { disposed=false; last=0; update(); });
  window.addEventListener('pagehide', () => { cancelAnimationFrame(raf); raf=0; last=0; });
  pump();
})();
