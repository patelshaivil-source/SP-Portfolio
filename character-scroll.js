/* Transparent character overlay. The existing portfolio background is untouched. */
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
  // Blend in an offscreen layer with additive premultiplied alpha. Standard
  // source-over blending would make opaque overlapping pixels translucent.
  const mix = document.createElement('canvas');
  mix.width = 960; mix.height = 540;
  const mctx = mix.getContext('2d', { alpha: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // All 25 unique poses. Walk back through the turn before lifting the hand,
  // avoiding the old hard cut from a right-facing turn to a left-facing wave.
  const order = [...Array(15).keys(), ...Array.from({length:14}, (_,i)=>13-i), ...Array.from({length:10}, (_,i)=>15+i)];
  let images = [], loaded = false, disposed = false, inView = true, morph = null;
  let target = 0, current = 0, last = 0, raf = 0, width = 0, height = 0;
  const clamp = x => Math.min(1, Math.max(0, x));
  const assetBase = new URL('.', scriptURL);
  function createMorph(fields) {
    const surface=document.createElement('canvas'); surface.width=960; surface.height=540;
    const gl=surface.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:true});
    if(!gl) return null;
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;
      varying vec2 uv;uniform sampler2D a,b,fw,bw;uniform float t;
      vec2 flow(sampler2D f,vec2 p){vec4 c=texture2D(f,clamp(p,0.,1.))*255.;return vec2(c.r*256.+c.g,c.b*256.+c.a)/131070.-.25;}
      void main(){
        vec2 pa=uv,pb=uv;
        for(int i=0;i<3;i++){pa=uv-t*flow(fw,pa);pb=uv-(1.-t)*flow(bw,pb);}
        vec4 ca=texture2D(a,clamp(pa,0.,1.)),cb=texture2D(b,clamp(pb,0.,1.));
        gl_FragColor=mix(ca,cb,t);
      }`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Morph shader link failed');
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const texture=(image,bytes)=>{const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!bytes);
      if(bytes)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,120,68,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
      else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      return tex;};
    const textures=images.map(image=>texture(image));
    const map=new Map();
    fields.forEach(f=>{const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));const fwd=texture(null,decode(f.forward)),back=texture(null,decode(f.backward));map.set(`${f.a},${f.b}`,[fwd,back]);map.set(`${f.b},${f.a}`,[back,fwd]);});
    ['a','b','fw','bw'].forEach((name,i)=>gl.uniform1i(gl.getUniformLocation(program,name),i));
    const amount=gl.getUniformLocation(program,'t');
    return {surface,render(a,b,t){
      if(a===b)return false;
      const pair=map.get(`${a},${b}`);if(!pair||gl.isContextLost())return false;
      [textures[a],textures[b],...pair].forEach((tex,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);});
      gl.uniform1f(amount,t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return true;
    }};
  }
  function size() {
    const box = stage.getBoundingClientRect();
    width = box.width; height = box.height;
    const mask=width<=700?'linear-gradient(to bottom,black 55%,transparent 68%)':'linear-gradient(to bottom,black 87%,transparent 100%)';
    canvas.style.maskImage=mask;canvas.style.webkitMaskImage=mask;
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
    const t = reduced.matches ? 32 : clamp((progress-.10)/.77)*(order.length-1);
    const low = Math.floor(t), high = Math.min(order.length-1, low+1), alpha = t-low;
    mctx.clearRect(0,0,960,540);
    const warped=morph && morph.render(order[low],order[high],alpha);
    if(warped) mctx.drawImage(morph.surface,0,0);
    else {
    mctx.globalCompositeOperation = 'source-over';
    mctx.globalAlpha = 1-alpha;
    mctx.drawImage(images[order[low]],0,0,960,540);
    if (alpha > 0) {
      mctx.globalCompositeOperation = 'lighter';
      mctx.globalAlpha = alpha;
      mctx.drawImage(images[order[high]],0,0,960,540);
    }
    mctx.globalAlpha = 1;
    mctx.globalCompositeOperation = 'source-over';
    }
    ctx.clearRect(0,0,width,height);
    const mobile = width <= 700;
    const h = height*(mobile ? .51 : .83), w = h*16/9;
    const x = width*(mobile ? .50 : .32)-w/2;
    const y = height*(mobile ? .16 : .17);
    // Preserve the existing welcome-first, profile-second scroll narrative.
    ctx.globalAlpha = reduced.matches ? 1 : clamp((progress-.065)/.09)*clamp((1-progress)/.08);
    ctx.drawImage(mix,x,y,w,h);
    ctx.globalAlpha = 1;
    canvas.dataset.pose = t.toFixed(3);
    canvas.dataset.progress = progress.toFixed(4);
  }
  function tick(now) {
    raf = 0;
    if (!loaded || !inView || document.hidden || disposed) { last=0; return; }
    const dt = last ? Math.min(50,now-last) : 16.67;
    last=now;
    current += (target-current)*(1-Math.exp(-dt/85));
    if (Math.abs(current-target)<.0001) current=target;
    draw(current);
    if (Math.abs(current-target)>.0001 && !reduced.matches) wake();
    else last=0;
  }
  async function init() {
    try {
      const groups = await Promise.all(Array.from({length:5},(_,i)=>fetch(new URL(`character-frames-${i+1}.json`,assetBase)).then(r=>{if(!r.ok)throw Error('Frame download failed');return r.json();})));
      images = await Promise.all(groups.flat().map(src=>new Promise((resolve,reject)=>{
        const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=src;
      })));
      if (disposed) return;
      if (images.length!==25) throw Error('Expected 25 character frames');
      try {
        const fields=await Promise.all(Array.from({length:4},(_,i)=>fetch(new URL(`character-flow-${i+1}.json`,assetBase)).then(r=>{if(!r.ok)throw Error('Motion fields unavailable');return r.json();})));
        morph=createMorph(fields.flat());
        canvas.dataset.interpolation=morph?'motion-compensated':'blend';
      } catch(error) { console.warn('Using blended character animation:',error); }
      loaded=true; canvas.dataset.loaded='25'; size();
    } catch(error) {
      canvas.dataset.error='load';
      console.error('Character animation could not load:',error);
      // The existing portfolio remains intact if optional media fails.
    }
  }
  const observer = new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;
    if(inView){last=0;update();}else{cancelAnimationFrame(raf);raf=0;last=0;}
  });
  observer.observe(stage);
  const resize = new ResizeObserver(size); resize.observe(stage);
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',size,{passive:true});
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)update();});
  reduced.addEventListener('change',update);
  window.addEventListener('pageshow',()=>{disposed=false;last=0;update();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;last=0;});
  init();
})();
