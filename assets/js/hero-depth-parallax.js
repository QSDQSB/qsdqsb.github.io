/* Hero depth parallax (Lontananza).
 *
 * Upgrades every `[data-depth-map]` element to a WebGL canvas that leans its
 * photograph around a neural depth map (generated at authoring time by
 * scripts/generate-hero-depth-maps.mjs). Two hosts exist today:
 *
 *   - `.page__hero-media` (page__hero.html) — smooth damped motion; the CSS
 *     background-image stays underneath as loading state and fallback.
 *   - `.home__hero-depth` (home.html) — spring motion (`data-depth-motion=
 *     "spring"`): underdamped, so the photograph overshoots and settles with
 *     a bounce. The wrapper's own CSS re-applies the home frost (blur, mask,
 *     slow zoom), so the glassmorphism reads exactly as before.
 *
 * No WebGL, reduced motion, ?motion=off, or any load/compile failure leaves
 * the static hero exactly as it ships today.
 *
 * Per-element knobs (0–100 prototyping scale, from frontmatter or layout):
 *   data-depth-amp    lean amplitude          (default 60)
 *   data-depth-focus  depth value kept pinned (default 75 — near field)
 *   data-depth-motion "smooth" | "spring"     (default smooth)
 *   data-depth-dpr    device-pixel-ratio cap  (default 2; home uses 1 — the
 *                     7px frost makes retina resolution pure waste)
 */
(function () {
  'use strict';

  if (window.QSD && window.QSD.motionOff && window.QSD.motionOff()) return;

  const VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aPos * 0.5 + 0.5;',
    '  vUv.y = 1.0 - vUv.y;',
    '  gl_Position = vec4(aPos, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Iterative re-projection keeps occlusion edges tight; the luminance term
  // gives the near field per-leaf micro-relief without disturbing far planes.
  const FRAG = [
    'precision mediump float;',
    'varying vec2 vUv;',
    'uniform sampler2D uPhoto;',
    'uniform sampler2D uDepth;',
    'uniform vec2 uTilt;',
    'uniform vec2 uCover;',
    'uniform float uAmp;',
    'uniform float uFocus;',
    'uniform float uZoom;',
    'uniform float uGlow;',
    'uniform vec2 uVeil;',
    'uniform vec4 uFilter;',
    'void main() {',
    '  vec2 uv = (vUv - 0.5) * uCover * 0.94 + 0.5;',
    '  vec2 off = uTilt * uAmp;',
    '  float d = texture2D(uDepth, uv).r;',
    '  vec2 p = uv + off * (d - uFocus);',
    '  d = texture2D(uDepth, p).r;',
    '  p = uv + off * (d - uFocus);',
    '  d = texture2D(uDepth, p).r;',
    '  p = uv + off * (d - uFocus);',
    '  d = texture2D(uDepth, p).r;',
    '  p = uv + off * (d - uFocus);',
    '  vec3 lp = texture2D(uPhoto, p).rgb;',
    '  float luma = dot(lp, vec3(0.299, 0.587, 0.114));',
    '  p += off * (luma - 0.5) * d * d * 0.3;',
    // depth-weighted dolly: near field and far field scale differently, so a
    // slow uZoom oscillation reads as the camera drifting through the scene
    '  p += (p - 0.5) * (uZoom * (d - uFocus));',
    '  vec3 c = texture2D(uPhoto, p).rgb;',
    // luminance-keyed lift: shadows and mids pass through untouched, only
    // bright emitters (the neon) are pushed up — the CSS frost blur then
    // bleeds the lifted core outward as halation
    '  float cl = dot(c, vec3(0.299, 0.587, 0.114));',
    '  c *= 1.0 + uGlow * smoothstep(0.4, 0.88, cl);',
    // luminance-keyed veil (the darkening gradient the static hero paints as
    // a flat CSS layer): shadows receive it in full, emitters thin it by up
    // to 78% — this is what lets the sign burn through instead of sitting
    // capped beneath a uniform dark wash
    '  float veil = mix(uVeil.x, uVeil.y, vUv.y);',
    '  veil *= 1.0 - 0.78 * smoothstep(0.35, 0.85, cl);',
    '  c = mix(c, vec3(0.0196, 0.0196, 0.0353), veil);',
    '  gl_FragColor = vec4(mix(c, uFilter.rgb, uFilter.a), 1.0);',
    '}'
  ].join('\n');

  function setup(media) {
    const photoSrc = media.getAttribute('data-depth-photo');
    const depthSrc = media.getAttribute('data-depth-map');
    if (!photoSrc || !depthSrc) return;

    const ampRaw = parseFloat(media.getAttribute('data-depth-amp') || '');
    const AMP = ((ampRaw >= 0 && ampRaw <= 100 ? ampRaw : 60) / 100) * 0.05;
    const focusRaw = parseFloat(media.getAttribute('data-depth-focus') || '');
    const FOCUS = (focusRaw >= 0 && focusRaw <= 100 ? focusRaw : 75) / 100;
    const spring = media.getAttribute('data-depth-motion') === 'spring';
    const dprCap = parseFloat(media.getAttribute('data-depth-dpr') || '') || 2;
    const glowRaw = parseFloat(media.getAttribute('data-depth-glow') || '');
    const GLOW = (glowRaw >= 0 && glowRaw <= 100 ? glowRaw : 0) / 100 * 1.5;
    // "start end" opacities of the host's darkening gradient, applied
    // in-shader (luminance-keyed) instead of as a flat CSS layer above.
    const veilParts = (media.getAttribute('data-depth-veil') || '').split(/\s+/).map(parseFloat);
    const VEIL = veilParts.length === 2 && veilParts.every(function (v) { return v >= 0 && v <= 1; })
      ? veilParts : [0, 0];

    // The page's overlay_filter darkens the CSS background the canvas covers;
    // replicate it in the shader so contrast over the hero copy is unchanged.
    // Anything unparsable keeps the static hero rather than risking a
    // brighter image under text.
    const filterRaw = media.getAttribute('data-depth-filter') || '';
    let filterRGBA = [0, 0, 0, 0];
    if (filterRaw) {
      const m = filterRaw.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/);
      if (!m) return;
      filterRGBA = [m[1] / 255, m[2] / 255, m[3] / 255, m[4] === undefined ? 1 : +m[4]];
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-depth-canvas';
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fsh = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fsh) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uPhoto', 'uDepth', 'uTilt', 'uCover', 'uAmp', 'uFocus', 'uZoom', 'uGlow', 'uVeil', 'uFilter'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform4f(U.uFilter, filterRGBA[0], filterRGBA[1], filterRGBA[2], filterRGBA[3]);
    gl.uniform2f(U.uVeil, VEIL[0], VEIL[1]);

    let imgAspect = 1;
    function loadTexture(unit, src, isPhoto, done) {
      const tex = gl.createTexture();
      const img = new Image();
      img.onload = function () {
        if (isPhoto) imgAspect = img.naturalWidth / img.naturalHeight;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        done();
      };
      img.onerror = function () { canvas.remove(); };
      img.src = src;
    }

    const hero = media.closest('.page__hero--overlay, .home__hero') || media.parentElement;
    const cover = [1, 1];
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = media.clientWidth;
      const h = media.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const canvasAspect = w / h;
      if (canvasAspect < imgAspect) {
        cover[0] = canvasAspect / imgAspect;
        cover[1] = 1;
      } else {
        cover[0] = 1;
        cover[1] = imgAspect / canvasAspect;
      }
    }
    window.addEventListener('resize', resize);

    const target = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const vel = { x: 0, y: 0 };
    let lastPointer = -1e9;
    let lastT = 0;
    document.addEventListener('pointermove', function (e) {
      const r = hero.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = (e.clientX - (r.left + r.width / 2)) / r.width;
      const y = (e.clientY - (r.top + r.height / 2)) / r.height;
      target.x = Math.max(-0.5, Math.min(0.5, x));
      target.y = Math.max(-0.5, Math.min(0.5, y));
      lastPointer = performance.now();
    }, { passive: true });

    // Render only while the host is on screen.
    let visible = true;
    let rafPending = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          resize(); // a canvas appended while the tab was suspended has stale (or zero) dimensions
          if (!rafPending) { rafPending = true; requestAnimationFrame(draw); }
        }
      }).observe(media);
    }

    let loaded = 0;
    function onTex() {
      loaded += 1;
      if (loaded === 2) {
        media.appendChild(canvas);
        media.classList.add('depth-live');
        resize();
        rafPending = true;
        requestAnimationFrame(draw);
        requestAnimationFrame(function () { canvas.classList.add('is-live'); });
      }
    }
    loadTexture(0, photoSrc, true, onTex);
    loadTexture(1, depthSrc, false, onTex);
    gl.uniform1i(U.uPhoto, 0);
    gl.uniform1i(U.uDepth, 1);

    function draw(t) {
      if (!visible) { rafPending = false; return; }
      const dt = Math.min((t - lastT) / 1000 || 0.016, 1 / 30);
      lastT = t;

      const s = t * 0.001;
      if (performance.now() - lastPointer > 2500) {
        if (spring) {
          // adrift — a slow, contained wander for the weightless home hero
          target.x = 0.32 * Math.sin(s * 0.11);
          target.y = 0.22 * Math.sin(s * 0.073 + 2.1);
        } else {
          // idle breath — slow lissajous drift when the pointer rests
          target.x = 0.34 * Math.sin(s * 0.19);
          target.y = 0.22 * Math.sin(s * 0.13 + 1.3);
        }
      }

      // The spring variant drifts through depth as well: a slow two-tone
      // dolly breath, plus a small push tied to spring velocity so a flick
      // bounces in z, not just sideways.
      let zoom = 0;
      if (spring) {
        zoom = 0.011 * Math.sin(s * 0.09) + 0.007 * Math.sin(s * 0.053 + 1.2)
          + (vel.x * vel.x + vel.y * vel.y) * 0.0004;
      }

      if (spring) {
        // Underdamped spring (ζ ≈ 0.4) — overshoots the target and settles
        // with a bounce instead of easing straight onto it.
        vel.x += (42 * (target.x - tilt.x) - 5.2 * vel.x) * dt;
        vel.y += (42 * (target.y - tilt.y) - 5.2 * vel.y) * dt;
        tilt.x += vel.x * dt;
        tilt.y += vel.y * dt;
      } else {
        tilt.x += (target.x - tilt.x) * 0.04;
        tilt.y += (target.y - tilt.y) * 0.04;
      }

      gl.uniform2f(U.uTilt, tilt.x, tilt.y);
      gl.uniform2f(U.uCover, cover[0], cover[1]);
      gl.uniform1f(U.uAmp, AMP);
      gl.uniform1f(U.uFocus, FOCUS);
      gl.uniform1f(U.uZoom, zoom);
      // the glow breathes slowly (±8%) so the sign reads lit, not just lifted
      gl.uniform1f(U.uGlow, GLOW * (1 + 0.08 * Math.sin(s * 0.9)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(draw);
    }
  }

  document.querySelectorAll('[data-depth-map]').forEach(setup);
})();
