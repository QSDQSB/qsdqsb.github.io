/* <qsd-bubbles> — the handle as six glass bubbles in a living cell.
   q s d q s b drift inside a flowing glass membrane; whenever two meet, both
   turn — letter to figure, figure to letter (q·9 s·5 d·2 q·9 s·5 b·6), the
   pun on 952956. A turned glyph sits out further turns for two seconds. Click a
   glyph for a glass burst and a knock (half the time it turns); drag and let go
   to give it a push.
   Self-contained like <qsd-mark>: Shadow DOM, sizes itself to its host box,
   pauses off-screen, and under window.QSD.motionOff() paints the word once and
   holds it. Only transforms move per frame; every glyph and its glow are drawn
   once. Usage: <qsd-bubbles></qsd-bubbles> (size it via CSS on the element). */
(function () {
  "use strict";
  if (!window.customElements || customElements.get("qsd-bubbles")) return;

  var NS = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------- glyphs
  // One plump italic hand. Every glyph is ONE continuous stroke (M + cubics):
  // a stroke that ended inside the glass would show its gloss line's rounded
  // end as a bright dot at the join, so the pen retraces instead.
  var GLYPH = {
    q: "M68 124 C63 114 51 109 37 109 C19 109 4 124 4 142 C4 160 19 175 37 175 C53 175 68 162 70 146" +
       " C70 134 70 120 70 110 C70 150 70 192 70 208 C70 221 77 227 85 222",
    s: "M60 118 C55 111 46 108 36 108 C22 108 12 115 12 127 C12 139 24 143 36 146 C50 149 62 154 62 164" +
       " C62 175 50 179 37 179 C25 179 15 175 10 167",
    d: "M68 124 C63 114 51 109 37 109 C19 109 4 124 4 142 C4 160 19 175 37 175 C53 175 68 162 70 146" +
       " C70 120 70 90 70 62 C70 100 70 146 70 164 C70 174 75 179 83 176",
    b: "M10 62 C10 100 10 146 10 176 C10 166 10 156 10 146 C10 124 24 109 42 109 C60 109 74 124 74 142" +
       " C74 160 60 176 42 176 C27 176 14 168 10 156",
    "9": "M64 98 C64 82 52 70 36 70 C20 70 8 82 8 98 C8 114 20 126 36 126 C52 126 64 114 64 98 C64 130 62 158 57 178",
    "5": "M62 70 C48 70 34 71 20 72 C19 88 17 104 16 118 C24 110 33 106 42 106 C58 106 68 120 68 140" +
         " C68 164 54 180 38 180 C26 180 16 175 10 166",
    "2": "M10 96 C10 80 24 70 38 70 C54 70 66 81 66 96 C66 116 46 140 14 178 C32 177 52 177 70 178",
    "6": "M60 78 C54 72 46 70 38 70 C20 70 8 92 8 128 C8 160 22 180 40 180 C56 180 68 168 68 150" +
         " C68 132 56 120 40 120 C26 120 14 128 10 140 C9 145 8.6 149 8.6 152"
  };
  var PAIRS = [["q", "9"], ["s", "5"], ["d", "2"], ["q", "9"], ["s", "5"], ["b", "6"]];
  var BASE = 180, SLANT = 0.2;                      // baseline; tan ≈ 11.3° italic lean
  var TUBE = 22, RIM_IN = 18, PAD = 22;             // glyph units: tube width, rim inner edge, halo room
  var GAP = 5, EDGE = 18;                           // air between slots; room for the membrane's dents
  var DRIFT = 0.5, COOLDOWN = 2000, TURN_ON_CLICK = 0.5;

  // Glyph geometry is computed from the path data itself — no getBBox or
  // getTotalLength — so the component builds correctly even while its host is
  // display:none (the hero hides it in phone landscape).
  function slanted(d) {
    return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, function (_, x, y) {
      return (+x + (BASE - y) * SLANT).toFixed(1) + " " + y;
    });
  }
  function cubicsOf(d) {
    var n = d.match(/-?\d*\.?\d+/g).map(Number), segs = [], cur = [n[0], n[1]], i;
    for (i = 2; i < n.length; i += 6) {
      var s = [cur, [n[i], n[i + 1]], [n[i + 2], n[i + 3]], [n[i + 4], n[i + 5]]];
      segs.push(s); cur = s[3];
    }
    return segs;
  }
  function bez(s, t) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, e = t * t * t;
    return [a * s[0][0] + b * s[1][0] + c * s[2][0] + e * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + e * s[3][1]];
  }
  function geometry(d) {                            // ink box + a chain of points every ~13 units
    var pts = [], L = [0], acc = 0, i, k;
    cubicsOf(d).forEach(function (s) {
      for (k = (pts.length ? 1 : 0); k <= 48; k++) {
        var p = bez(s, k / 48);
        if (pts.length) { var q = pts[pts.length - 1]; acc += Math.hypot(p[0] - q[0], p[1] - q[1]); L.push(acc); }
        pts.push(p);
      }
    });
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, n = Math.max(6, Math.round(acc / 13)), chain = [], j = 0;
    for (i = 0; i <= n; i++) {
      var target = acc * i / n;
      while (j < L.length - 2 && L[j + 1] < target) j++;
      var f = (target - L[j]) / ((L[j + 1] - L[j]) || 1), a = pts[j], b = pts[j + 1];
      chain.push([a[0] + (b[0] - a[0]) * f - cx, a[1] + (b[1] - a[1]) * f - cy]);
    }
    return { bb: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, cx: cx, cy: cy, chain: chain };
  }

  // ---------------------------------------------------------------- styles
  // url(#…) references are set as SVG attributes, not in this stylesheet, so
  // they resolve inside the shadow tree in every engine.
  var CSS =
    ":host{display:flex;align-items:center;justify-content:center}" +
    ".stage{position:relative;flex:0 0 auto;pointer-events:auto;touch-action:pan-y}" +
    /* each layer fades in on its own: a parent below full opacity would cut the
       glass off from the page behind it (a backdrop root) for the whole fade */
    ".case-shadow,.case-glass,.case-rim,.field{opacity:0;transition:opacity 1.1s cubic-bezier(.16,1,.3,1)}" +
    ".is-in .case-shadow,.is-in .case-glass,.is-in .case-rim,.is-in .field{opacity:1}" +
    ".case-shadow{position:absolute;inset:14% 3% -12%;border-radius:50%;pointer-events:none;" +
      "background:radial-gradient(closest-side,rgba(0,0,0,.26),rgba(0,0,0,.1) 60%,transparent)}" +
    ".case-glass{position:absolute;inset:-10%;pointer-events:none;" +
      "-webkit-backdrop-filter:blur(6px) saturate(1.15) brightness(.97);backdrop-filter:blur(6px) saturate(1.15) brightness(.97);" +
      "background:linear-gradient(155deg,rgba(255,246,230,.045),rgba(255,246,230,.008) 45%,rgba(120,104,140,.035))}" +
    ".case-rim{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}" +
    ".field{position:absolute;inset:0}" +
    ".body{position:absolute;left:0;top:0;will-change:transform;contain:layout style}" +
    ".face{position:absolute;inset:0;width:100%;height:100%;overflow:visible}" +
    ".face[hidden]{display:block;opacity:0}" +
    ".halo{fill:none;stroke:#e4b181;stroke-opacity:.26}" +
    ".warm{fill:none;stroke:#d79a5a;stroke-opacity:.26}" +
    ".gloss{fill:none;stroke:#fff6e6;stroke-opacity:.85}" +
    ".drop{position:absolute;left:0;top:0;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;opacity:0;pointer-events:none;" +
      "background:radial-gradient(circle at 35% 30%,#fff6e6,rgba(244,210,154,.6) 45%,rgba(228,177,129,0) 72%)}" +
    ".burst{position:absolute;left:0;top:0;z-index:3;pointer-events:none;opacity:0;will-change:transform,opacity}" +
    ".burst svg{display:block;width:100%;height:100%;overflow:visible}" +
    ".burst g{transform-origin:0 0}" +
    ".br-halo{fill:none;stroke:#e4b181;stroke-opacity:.3;stroke-width:11}" +
    ".br-tube{fill:none;stroke:#fff3df;stroke-opacity:.07;stroke-width:6.8}" +
    ".br-rim{fill:none;stroke:#f4d29a;stroke-opacity:.85;stroke-width:1.1}" +
    ".br-gloss{fill:none;stroke:#fff6e6;stroke-opacity:.9;stroke-width:1.5;stroke-linecap:round}" +
    ".bc-halo{fill:none;stroke:#e4b181;stroke-opacity:.28;stroke-width:9;stroke-linecap:round}" +
    ".bc-rim{fill:none;stroke:#f4d29a;stroke-opacity:.9;stroke-width:5.6;stroke-linecap:round}" +
    ".bc-in{fill:none;stroke:#2a1f16;stroke-opacity:.62;stroke-width:3.3;stroke-linecap:round}" +
    ".bd-body{fill:rgba(255,243,223,.09);stroke:#f4d29a;stroke-opacity:.85;stroke-width:.9}" +
    ".bd-hi{fill:#fff6e6;fill-opacity:.9}";

  var DEFS =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="tubeWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3df" stop-opacity=".1"/><stop offset="1" stop-color="#d79a5a" stop-opacity=".07"/></linearGradient>' +
    '<linearGradient id="rimWarm" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff3df"/><stop offset=".55" stop-color="#f4d29a"/><stop offset="1" stop-color="#d79a5a"/></linearGradient>' +
    '<filter id="haloBlur" filterUnits="userSpaceOnUse" x="-200" y="-200" width="700" height="700"><feGaussianBlur stdDeviation="7"/></filter>' +
    '</defs></svg>';

  // The click burst, in the bubbles' own glass: a ripple ring with rim, gloss
  // and glow; short hollow glass capsules for action lines; glass droplets.
  var BURST =
    '<svg viewBox="-60 -60 120 120" aria-hidden="true">' +
    '<g class="b-ring"><circle class="br-halo" r="26" filter="url(#haloBlur)"/><circle class="br-tube" r="26"/>' +
    '<circle class="br-rim" r="22.6"/><circle class="br-rim" r="29.4"/>' +
    '<path class="br-gloss" d="M-24.4 -8.9 A26 26 0 0 1 -12.2 -23"/></g>' +
    '<g class="b-caps"><path class="bc-halo" filter="url(#haloBlur)" d="M31.5 12.7 L39.9 16.1 M11.3 33.4 L13.6 36.4 M-13.4 32.6 L-16.9 41 M-31 15.5 L-35.6 17.8 M-33.4 -11.3 L-42.2 -14.3 M-14.3 -30.8 L-16.4 -35.4 M14.2 -30.9 L18 -39.1 M31.6 -12.6 L36.3 -14.5"/>' +
    '<path class="bc-rim" d="M31.5 12.7 L39.9 16.1 M11.3 33.4 L13.6 36.4 M-13.4 32.6 L-16.9 41 M-31 15.5 L-35.6 17.8 M-33.4 -11.3 L-42.2 -14.3 M-14.3 -30.8 L-16.4 -35.4 M14.2 -30.9 L18 -39.1 M31.6 -12.6 L36.3 -14.5"/>' +
    '<path class="bc-in" d="M31.5 12.7 L39.9 16.1 M11.3 33.4 L13.6 36.4 M-13.4 32.6 L-16.9 41 M-31 15.5 L-35.6 17.8 M-33.4 -11.3 L-42.2 -14.3 M-14.3 -30.8 L-16.4 -35.4 M14.2 -30.9 L18 -39.1 M31.6 -12.6 L36.3 -14.5"/></g>' +
    '<g class="b-drops">' +
    '<circle class="bd-body" cx="50.2" cy="4.8" r="3.4"/><circle class="bd-hi" cx="49" cy="3.4" r="1.1"/>' +
    '<circle class="bd-body" cx="30.6" cy="41.9" r="2.4"/><circle class="bd-hi" cx="29.8" cy="40.9" r="0.8"/>' +
    '<circle class="bd-body" cx="-10.8" cy="50.4" r="4.2"/><circle class="bd-hi" cx="-12.3" cy="48.7" r="1.3"/>' +
    '<circle class="bd-body" cx="-45.9" cy="23.8" r="2.8"/><circle class="bd-hi" cx="-46.9" cy="22.7" r="0.9"/>' +
    '<circle class="bd-body" cx="-46.3" cy="-21.6" r="3.6"/><circle class="bd-hi" cx="-47.6" cy="-23" r="1.2"/>' +
    '<circle class="bd-body" cx="-9.5" cy="-51.9" r="2.2"/><circle class="bd-hi" cx="-10.3" cy="-52.8" r="0.7"/>' +
    '<circle class="bd-body" cx="35.2" cy="-37.4" r="3"/><circle class="bd-hi" cx="34.1" cy="-38.6" r="1"/></g></svg>';

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  class QsdBubbles extends HTMLElement {
    connectedCallback() {
      if (this._booted) { this._resume && this._resume(); return; }
      this._booted = true;
      var host = this, root = this.attachShadow({ mode: "open" });
      root.innerHTML = "<style>" + CSS + "</style>" + DEFS +
        '<div class="stage"><div class="case-shadow"></div><div class="case-glass"></div>' +
        '<svg class="case-rim" aria-hidden="true"></svg><div class="field"></div></div>';
      var stage = root.querySelector(".stage"), field = root.querySelector(".field");
      var glass = root.querySelector(".case-glass"), rimSvg = root.querySelector(".case-rim");
      var RM = window.QSD && window.QSD.motionOff ? window.QSD.motionOff()
             : !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

      var seed = 1 + Math.floor(Math.random() * 2147483645);          // a fresh field every visit
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

      // ---------------------------------------------------------------- faces
      var uid = 0;
      function makeFace(ch) {
        var id = "g" + (uid++), d = slanted(GLYPH[ch]), g = geometry(d), bb = g.bb;
        var svg = el("svg", { class: "face", "aria-hidden": "true" }), defs = el("defs", {}, svg);
        el("path", { id: id, d: d }, defs);
        function use(attrs, parent) {
          attrs.href = "#" + id; attrs.fill = "none"; attrs["stroke-linecap"] = "round"; attrs["stroke-linejoin"] = "round";
          return el("use", attrs, parent);
        }
        var box = { maskUnits: "userSpaceOnUse", x: -400, y: -400, width: 1200, height: 1200 };
        var inner = el("mask", Object.assign({ id: id + "i" }, box), defs);
        use({ stroke: "#fff", "stroke-width": RIM_IN + 1 }, inner);
        var rimM = el("mask", Object.assign({ id: id + "r" }, box), defs);
        use({ stroke: "#fff", "stroke-width": TUBE }, rimM);
        use({ stroke: "#000", "stroke-width": RIM_IN }, rimM);
        use({ class: "halo", "stroke-width": TUBE + 12, filter: "url(#haloBlur)" }, svg);                    // glow
        use({ stroke: "url(#tubeWarm)", "stroke-width": TUBE }, svg);                                          // translucent body
        use({ class: "warm", "stroke-width": 10, transform: "translate(3 4)", mask: "url(#" + id + "i)" }, svg);     // light pooling low
        use({ class: "gloss", "stroke-width": 3.4, transform: "translate(-3.6 -4.4)", mask: "url(#" + id + "i)" }, svg); // specular line
        el("rect", { fill: "url(#rimWarm)", x: bb.x - TUBE, y: bb.y - TUBE, width: bb.width + 2 * TUBE, height: bb.height + 2 * TUBE,
                     mask: "url(#" + id + "r)" }, svg);                                                          // the lit rim
        return { svg: svg, cx: g.cx, cy: g.cy, bb: bb, half: Math.max(bb.width, bb.height) / 2 + PAD, chain: g.chain };
      }
      var bodies = PAIRS.map(function (pair) {
        var div = document.createElement("div"); div.className = "body";
        field.appendChild(div);
        var faces = pair.map(makeFace), half = Math.max(faces[0].half, faces[1].half);
        faces.forEach(function (f, k) {
          f.svg.setAttribute("viewBox", (f.cx - half) + " " + (f.cy - half) + " " + (2 * half) + " " + (2 * half));
          div.appendChild(f.svg);
          if (k) f.svg.setAttribute("hidden", "");
        });
        var drops = [];
        for (var i = 0; i < 6; i++) { var dr = document.createElement("span"); dr.className = "drop"; div.appendChild(dr); drops.push(dr); }
        return { div: div, faces: faces, half: half, face: 0, lastTurn: -1e9, turnedAt: -1, drops: drops,
                 x: 0, y: 0, vx: 0, vy: 0, ang: 0, av: 0, sq: 0, sv: 0, phi: 0 };
      });

      // ---------------------------------------------------------------- the case hugs the word
      var UW = 2 * EDGE - GAP, top = 1e9, bottom = -1e9;
      bodies.forEach(function (b) {
        b.slot = Math.max(b.faces[0].bb.width, b.faces[1].bb.width) + TUBE;
        UW += b.slot + GAP;
        b.faces.forEach(function (f) { top = Math.min(top, f.bb.y - TUBE / 2); bottom = Math.max(bottom, f.bb.y + f.bb.height + TUBE / 2); });
      });
      top -= EDGE; bottom += EDGE;
      var UH = bottom - top;

      var W = 0, H = 0, K = 1, S = 60, RAD = 12;      // K: px per glyph unit; RAD: tube radius in px
      function fit() {                                // size the case to the host box; false if hidden
        var hw = host.clientWidth, hh = host.clientHeight;
        if (!hw || !hh) return false;
        var w = Math.min(hw * 0.9, hh * 0.8 * UW / UH, 560);
        var oW = W, oH = H;
        W = w; H = w * UH / UW;
        stage.style.width = W + "px"; stage.style.height = H + "px";
        K = W / UW; S = 48 * K; RAD = (TUBE / 2 + 1) * K;
        bodies.forEach(function (b) {
          var px = 2 * b.half * K;
          b.div.style.width = px + "px"; b.div.style.height = px + "px";
          b.faces.forEach(function (f) {
            f.pts = f.chain.map(function (c) { return [c[0] * K, c[1] * K]; });
            f.reach = RAD;
            f.pts.forEach(function (c) { f.reach = Math.max(f.reach, Math.hypot(c[0], c[1]) + RAD); });
          });
          if (oW) { b.x *= W / oW; b.y *= H / oH; }
        });
        placeCase();
        return true;
      }

      // ---------------------------------------------------------------- the membrane
      // A squircle in polar form so it can be asked about any point at any
      // moment: r(φ, t) = squircle(φ) · (1 + drifting harmonics + impact
      // bulges). Physics and picture read the same function.
      var harmonics = [[2, 0.021], [3, 0.025], [4, 0.014], [5, 0.01], [7, 0.005]].map(function (h) {
        return { k: h[0], a: h[1] * (0.6 + rnd() * 0.8), ph: rnd() * 6.283, w: (rnd() < 0.5 ? -1 : 1) * (0.22 + rnd() * 0.4) };
      });
      var bumps = [], clock = 0, NEXP = 3.6, SEGS = 64, CX = 0, CY = 0, SX = 1, SY = 1, GLASS_PAD = 0.1;
      function caseR(phi) {
        var c = Math.abs(Math.cos(phi)), sn = Math.abs(Math.sin(phi)), i;
        var r = Math.pow(Math.pow(c, NEXP) + Math.pow(sn, NEXP), -1 / NEXP), f = 1 + 0.008 * Math.sin(clock * 0.9);
        for (i = 0; i < harmonics.length; i++) { var h = harmonics[i]; f += h.a * Math.sin(h.k * phi + h.ph + h.w * clock); }
        for (i = 0; i < bumps.length; i++) {
          var d = phi - bumps[i].phi; d -= 6.283 * Math.round(d / 6.283);
          f += bumps[i].amp * Math.exp(-d * d / 0.12);
        }
        return r * f;
      }
      function wallDist(x, y) {                       // ≈ signed px distance to the membrane (inside < 0)
        var u = (x - CX) / SX, v = (y - CY) / SY, phi = Math.atan2(v, u);
        return (Math.hypot(u, v) - caseR(phi)) * Math.hypot(SX * Math.cos(phi), SY * Math.sin(phi));
      }
      function openD(pts) {                           // Catmull–Rom through points
        var f = function (v) { return v.toFixed(1); }, d = "M" + f(pts[0][0]) + " " + f(pts[0][1]), i, n = pts.length;
        for (i = 0; i < n - 1; i++) {
          var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
          d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) + " " + f(p2[0] - (p3[0] - p1[0]) / 6) +
               " " + f(p2[1] - (p3[1] - p1[1]) / 6) + " " + f(p2[0]) + " " + f(p2[1]);
        }
        return d;
      }
      function closedD(pts, ox, oy) {
        var n = pts.length, f = function (v) { return v.toFixed(1); }, i, d = "M" + f(pts[0][0] + ox) + " " + f(pts[0][1] + oy);
        for (i = 0; i < n; i++) {
          var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
          d += "C" + f(p1[0] + (p2[0] - p0[0]) / 6 + ox) + " " + f(p1[1] + (p2[1] - p0[1]) / 6 + oy) + " " + f(p2[0] - (p3[0] - p1[0]) / 6 + ox) +
               " " + f(p2[1] - (p3[1] - p1[1]) / 6 + oy) + " " + f(p2[0] + ox) + " " + f(p2[1] + oy);
        }
        return d + "Z";
      }
      // Rim layers are built once; per frame only the one outline's `d` changes.
      rimSvg.innerHTML = '<defs>' +
        '<linearGradient id="caseEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6e6" stop-opacity=".5"/><stop offset=".45" stop-color="#fff6e6" stop-opacity=".06"/><stop offset="1" stop-color="#e4b181" stop-opacity=".32"/></linearGradient>' +
        '<linearGradient id="caseBevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6e6" stop-opacity=".1"/><stop offset=".5" stop-color="#fff6e6" stop-opacity="0"/><stop offset="1" stop-color="#e4b181" stop-opacity=".06"/></linearGradient>' +
        '<path id="caseShape"/><clipPath id="caseClip"><use href="#caseShape"/></clipPath></defs>' +
        '<use href="#caseShape" fill="none" stroke="url(#caseBevel)" stroke-width="10" clip-path="url(#caseClip)"/>' +
        '<use href="#caseShape" fill="none" stroke="url(#caseEdge)" stroke-width="1.3"/>' +
        '<path class="case-sheen" fill="none" stroke="#fff6e6" stroke-opacity=".3" stroke-width="2.2" stroke-linecap="round"/>';
      var shapePath = rimSvg.querySelector("#caseShape"), sheen = rimSvg.querySelector(".case-sheen");
      function placeCase() {
        CX = W / 2; CY = H / 2; SX = W / 2 - 3; SY = H / 2 - 3;
        rimSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
      }
      function drawCase() {
        var pts = [], i;
        for (i = 0; i < SEGS; i++) {
          var phi = i / SEGS * 6.283, R = caseR(phi);
          pts.push([CX + SX * R * Math.cos(phi), CY + SY * R * Math.sin(phi)]);
        }
        shapePath.setAttribute("d", closedD(pts, 0, 0));
        // the glass overhangs the stage so a bulge never runs out of backdrop
        glass.style.clipPath = "path('" + closedD(pts, W * GLASS_PAD, H * GLASS_PAD) + "')";
        sheen.setAttribute("d", openD(pts.slice(Math.round(SEGS * 0.57), Math.round(SEGS * 0.69)).map(function (p) {
          return [CX + (p[0] - CX) * 0.955, CY + (p[1] - CY) * 0.93];   // just inside the upper-left edge
        })));
      }
      function bump(x, y, speed) {                    // a glyph strikes the membrane at (x, y)
        var phi = Math.atan2((y - CY) / SY, (x - CX) / SX), kick = Math.min(0.5, speed / S * 0.16), i;
        for (i = 0; i < bumps.length; i++) {
          var d = phi - bumps[i].phi; d -= 6.283 * Math.round(d / 6.283);
          if (Math.abs(d) < 0.3) { bumps[i].vel += kick; return; }
        }
        if (bumps.length < 8) bumps.push({ phi: phi, amp: 0, vel: kick });
      }
      function flowCase(dt) {
        clock += dt;
        for (var i = bumps.length - 1; i >= 0; i--) {  // each bulge: a damped spring back to rest
          var bp = bumps[i];
          bp.vel += (-70 * bp.amp - 5 * bp.vel) * dt; bp.amp += bp.vel * dt;
          if (bp.amp > 0.07) { bp.amp = 0.07; bp.vel = Math.min(0, bp.vel); }
          if (Math.abs(bp.amp) < 1e-4 && Math.abs(bp.vel) < 1e-3) bumps.splice(i, 1);
        }
      }

      function layWord() {                            // the word, each glyph in its slot on the baseline
        var ux = EDGE;
        bodies.forEach(function (b) {
          b.x = (ux + b.slot / 2) * K; b.y = (b.faces[0].cy - top) * K;
          ux += b.slot + GAP;
          var a = rnd() * 6.283; b.vx = Math.cos(a) * S; b.vy = Math.sin(a) * S;
        });
      }

      // ---------------------------------------------------------------- the turn: pop + swell
      var stepNo = 0, touching = {};
      function turn(b, nx, ny, forced) {
        if (b.turnedAt === stepNo) return;            // two contacts in the same instant: one turn
        var t = clock * 1000;                         // the simulation's clock, so fast-forward agrees
        if (!forced && t - b.lastTurn < COOLDOWN) return;
        b.turnedAt = stepNo; b.lastTurn = t;
        var out = b.faces[b.face].svg, inn = b.faces[1 - b.face].svg;
        b.face = 1 - b.face;
        if (!out.animate) { inn.removeAttribute("hidden"); out.setAttribute("hidden", ""); return; }
        // A turn can land mid-way through the previous one: read where each face
        // is now, cancel, and carry on from there — or the older animation
        // resurfaces when the newer one ends and the hidden face flashes back.
        var outOp = parseFloat(getComputedStyle(out).opacity), inOp = parseFloat(getComputedStyle(inn).opacity);
        out.getAnimations().concat(inn.getAnimations()).forEach(function (a) { a.cancel(); });
        inn.removeAttribute("hidden"); out.setAttribute("hidden", "");
        out.animate([{ opacity: outOp, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.16)" }],
          { duration: 300, easing: "cubic-bezier(0.2, 0, 0.2, 1)" });
        var back = inOp > 0.05;
        inn.animate(back
          ? [{ opacity: inOp, transform: "scale(1)" }, { opacity: 1, transform: "scale(1)" }]
          : [{ opacity: 0, transform: "scale(0.5)" }, { opacity: 1, offset: 0.35 }, { opacity: 1, transform: "scale(1)" }],
          { duration: back ? 260 : 720, easing: back ? "cubic-bezier(0.2, 0, 0.2, 1)" : "cubic-bezier(0.34, 1.5, 0.64, 1)" });
        var c = b.half * K;
        b.drops.forEach(function (d, i) {             // a few droplets thrown clear of the impact
          d.getAnimations().forEach(function (a) { a.cancel(); });
          var a = Math.atan2(-ny, -nx) + (i - 2.5) * 0.55 + (rnd() - 0.5) * 0.4, r = (0.55 + rnd() * 0.5) * c;
          d.animate([
            { opacity: 0.95, transform: "translate(" + c + "px," + c + "px) scale(1)" },
            { opacity: 0, transform: "translate(" + (c + Math.cos(a) * r) + "px," + (c + Math.sin(a) * r) + "px) scale(0.3)" }
          ], { duration: 560 + i * 40, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
        });
      }

      // ---------------------------------------------------------------- physics
      function contact(b, c, margin) {                // deepest circle-pair overlap between two chains
        var fb = b.faces[b.face].pts, fc = c.faces[c.face].pts, best = -Infinity, nx = 0, ny = 0,
            min = 2 * RAD, lim = (min + margin) * (min + margin), i, j;
        for (i = 0; i < fb.length; i++) {
          var ax = b.x + fb[i][0], ay = b.y + fb[i][1];
          for (j = 0; j < fc.length; j++) {
            var dx = c.x + fc[j][0] - ax, dy = c.y + fc[j][1] - ay, d2 = dx * dx + dy * dy;
            if (d2 >= lim) continue;
            var d = Math.sqrt(d2) || 0.001;
            if (min - d > best) { best = min - d; nx = dx / d; ny = dy / d; }
          }
        }
        return best > (margin ? -Infinity : 0) ? { pen: best, nx: nx, ny: ny } : null;
      }
      function squash(b, phi, speed) {                // squash along the hit; the spring rebounds it
        if (speed < 4) return;
        b.phi = phi; b.sv += Math.min(3.2, speed / (S * 0.55));
      }
      // The wall tests each glyph as DRAWN — squash, stretch and sway applied to
      // its collision points (the same matrix paint() hands to CSS) — so a
      // wobbling letter can't bulge through the glass.
      function walls(b, react) {
        var cp = Math.cos(b.phi), sp = Math.sin(b.phi), ca = Math.cos(b.ang), sa = Math.sin(b.ang);
        var ka = 1 - b.sq, kb = 1 + 0.6 * b.sq;
        var s00 = ka * cp * cp + kb * sp * sp, s01 = (ka - kb) * cp * sp, s11 = ka * sp * sp + kb * cp * cp;
        var m00 = ca * s00 - sa * s01, m01 = ca * s01 - sa * s11, m10 = sa * s00 + ca * s01, m11 = sa * s01 + ca * s11;
        var pts = b.faces[b.face].pts, worst = 0, wx = 0, wy = 0, i;
        for (i = 0; i < pts.length; i++) {
          var px = pts[i][0], py = pts[i][1];
          var x = b.x + m00 * px + m01 * py, y = b.y + m10 * px + m11 * py, pen = wallDist(x, y) + RAD;
          if (pen > worst) { worst = pen; wx = x; wy = y; }
        }
        if (!worst) return;
        var gx = wallDist(wx + 1, wy) - wallDist(wx - 1, wy), gy = wallDist(wx, wy + 1) - wallDist(wx, wy - 1), gl = Math.hypot(gx, gy) || 1;
        var nx = gx / gl, ny = gy / gl;               // outward normal
        b.x -= nx * worst; b.y -= ny * worst;
        var vo = b.vx * nx + b.vy * ny;
        if (react && vo > 0) {
          squash(b, Math.atan2(ny, nx), vo); bump(wx, wy, vo);
          b.vx -= 2 * vo * nx; b.vy -= 2 * vo * ny;
        }
      }
      function step(dt) {
        var n = bodies.length, i, j, b, c, it, target = S * DRIFT, PART = 2 + K;
        stepNo++;
        flowCase(dt);
        for (i = 0; i < n; i++) {
          b = bodies[i];
          var sp = Math.hypot(b.vx, b.vy) || 1, k = 1 + (target / sp - 1) * Math.min(1, dt * 0.8);   // drift governor
          b.vx *= k; b.vy *= k;
          b.x += b.vx * dt; b.y += b.vy * dt;
          b.av += (-30 * b.ang - 3.2 * b.av) * dt; b.ang += b.av * dt;            // sway, settling upright
          if (b.ang > 0.12) { b.ang = 0.12; b.av = Math.min(0, b.av); } else if (b.ang < -0.12) { b.ang = -0.12; b.av = Math.max(0, b.av); }
          b.sv += (-240 * b.sq - 7 * b.sv) * dt; b.sq += b.sv * dt;              // squash spring
          if (b.sq > 0.24) { b.sq = 0.24; b.sv = 0; } else if (b.sq < -0.24) { b.sq = -0.24; b.sv = 0; }
        }
        // A packed case needs a few relaxation passes; velocities respond on the first only.
        for (it = 0; it < 4; it++) {
          for (i = 0; i < n; i++) walls(bodies[i], it === 0);
          for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
            b = bodies[i]; c = bodies[j];
            var key = i * 8 + j, rr = b.faces[b.face].reach + c.faces[c.face].reach + PART, dx = c.x - b.x, dy = c.y - b.y;
            if (dx * dx + dy * dy >= rr * rr) { if (!it) touching[key] = false; continue; }
            var hit = contact(b, c, it ? 0 : PART), was = touching[key];
            if (!it) {
              // Every collision turns both: the moment a pair meets. They must
              // part by PART px before the next meeting counts, so resting
              // against each other never strobes.
              var now = !!hit && (was ? true : hit.pen > 0);
              if (now && !was) { turn(b, hit.nx, hit.ny); turn(c, -hit.nx, -hit.ny); }
              touching[key] = now;
            }
            if (!hit || hit.pen <= 0) continue;
            var push = hit.pen / 2 + 0.2;
            b.x -= hit.nx * push; b.y -= hit.ny * push; c.x += hit.nx * push; c.y += hit.ny * push;
            if (it) continue;
            var vn = (c.vx - b.vx) * hit.nx + (c.vy - b.vy) * hit.ny;
            if (vn < 0) {                             // equal-mass elastic
              b.vx += vn * hit.nx; b.vy += vn * hit.ny; c.vx -= vn * hit.nx; c.vy -= vn * hit.ny;
              var phi = Math.atan2(hit.ny, hit.nx);
              squash(b, phi, -vn); squash(c, phi, -vn);
              b.av -= hit.nx * 2.5; c.av += hit.nx * 2.5;
              // a knock that returns before the pair has parted is still a collision
              if (was && -vn > S * 0.3) { turn(b, hit.nx, hit.ny); turn(c, -hit.nx, -hit.ny); }
            }
          }
        }
      }
      var lastCase = -1e9;
      function paint(force) {
        var pn = performance.now();
        if (force || pn - lastCase > 32) { drawCase(); lastCase = pn; }   // the flow is slow: 30 fps of outline
        for (var i = 0; i < bodies.length; i++) {
          var b = bodies[i], h = b.half * K, ph = (b.phi * 57.3).toFixed(1);
          b.div.style.transform = "translate3d(" + (b.x - h).toFixed(2) + "px," + (b.y - h).toFixed(2) + "px,0) rotate(" + (b.ang * 57.3).toFixed(2) + "deg)" +
            " rotate(" + ph + "deg) scale(" + (1 - b.sq).toFixed(3) + "," + (1 + 0.6 * b.sq).toFixed(3) + ") rotate(" + (-ph) + "deg)";
        }
      }

      // ---------------------------------------------------------------- hands
      // Click: the glass burst and a knock, always; the turn, half the time
      // (skipping the cooldown — a click is deliberate). Drag and let go: a push
      // of 40% of the flick, capped; the governor eases it back to the drift.
      var bursts = [], burstNext = 0;
      for (var bi = 0; bi < 3; bi++) {
        var bd = document.createElement("div"); bd.className = "burst"; bd.innerHTML = BURST;
        stage.appendChild(bd); bursts.push(bd);
      }
      function pop(x, y) {
        if (!bursts[0].animate) return;
        var node = bursts[burstNext++ % bursts.length], size = 140 * K, twist = (rnd() - 0.5) * 40;
        node.style.width = node.style.height = size + "px";
        node.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
        var at = "translate(" + (x - size / 2).toFixed(1) + "px," + (y - size / 2).toFixed(1) + "px) rotate(" + twist.toFixed(1) + "deg) ";
        var out = "cubic-bezier(0.16, 1, 0.3, 1)";
        node.animate([{ opacity: 0, transform: at + "scale(0.9)" }, { opacity: 1, transform: at + "scale(1)", offset: 0.12 },
                      { opacity: 1, transform: at + "scale(1)", offset: 0.55 }, { opacity: 0, transform: at + "scale(1.04)" }],
                     { duration: 620, easing: "ease-out" });
        node.querySelector(".b-ring").animate([{ transform: "scale(0.45)", opacity: 1 }, { transform: "scale(1.18)", opacity: 0 }], { duration: 520, easing: out });
        node.querySelector(".b-caps").animate([{ transform: "scale(0.7)" }, { transform: "scale(1.22)" }], { duration: 460, easing: out });
        node.querySelector(".b-drops").animate([{ transform: "scale(0.62) rotate(0deg)" }, { transform: "scale(1.42) rotate(" + (twist * 0.3).toFixed(1) + "deg)" }],
                                              { duration: 620, easing: out });
      }
      function local(e) { var r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function glyphAt(x, y) {
        var best = null, bestD = Infinity;
        bodies.forEach(function (b) {
          b.faces[b.face].pts.forEach(function (p) {
            var d = Math.hypot(b.x + p[0] - x, b.y + p[1] - y);
            if (d < bestD) { bestD = d; best = b; }
          });
        });
        return bestD <= RAD + 6 ? best : null;
      }
      var held = null;
      if (!RM) {
        stage.addEventListener("pointerdown", function (e) {
          var p = local(e), b = glyphAt(p[0], p[1]);
          if (!b) return;
          held = { b: b, x0: p[0], y0: p[1], t0: e.timeStamp, px: p[0], py: p[1], pt: e.timeStamp, vx: 0, vy: 0, moved: false };
          try { stage.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
          e.preventDefault();
        });
        stage.addEventListener("pointermove", function (e) {
          var p = local(e);
          if (!held) { stage.style.cursor = glyphAt(p[0], p[1]) ? "pointer" : ""; return; }
          var dt = Math.max(1, e.timeStamp - held.pt) / 1000;
          held.vx += ((p[0] - held.px) / dt - held.vx) * 0.35;
          held.vy += ((p[1] - held.py) / dt - held.vy) * 0.35;
          held.px = p[0]; held.py = p[1]; held.pt = e.timeStamp;
          if (Math.hypot(p[0] - held.x0, p[1] - held.y0) > 6) { held.moved = true; stage.style.cursor = "grabbing"; }
        });
        stage.addEventListener("pointerup", function (e) {
          if (!held) return;
          var b = held.b, p = local(e);
          if (!held.moved && e.timeStamp - held.t0 < 450) {
            var nx = b.x - p[0], ny = b.y - p[1], nl = Math.hypot(nx, ny) || 1;
            if (rnd() < TURN_ON_CLICK) { stepNo++; turn(b, nx / nl, ny / nl, true); }
            pop(p[0], p[1]);
            b.sq = 0; b.sv = 0; squash(b, Math.atan2(ny, nx), S * 1.9);
            b.av += (nx / nl) * 6;
            b.vx += (nx / nl) * S * 0.55; b.vy += (ny / nl) * S * 0.55;
          } else if (e.timeStamp - held.pt < 120) {
            var cap = S * 2.4, ix = held.vx * 0.4, iy = held.vy * 0.4, il = Math.hypot(ix, iy);
            if (il > cap) { ix *= cap / il; iy *= cap / il; }
            b.vx += ix; b.vy += iy;
            squash(b, Math.atan2(iy, ix), il * 0.6);
          }
          held = null;
          stage.style.cursor = glyphAt(p[0], p[1]) ? "pointer" : "";
        });
        stage.addEventListener("pointercancel", function () { held = null; stage.style.cursor = ""; });
      } else {
        stage.style.pointerEvents = "none";           // motion off: a still word, nothing to handle
      }

      // ---------------------------------------------------------------- run / pause
      var built = false, running = false, visible = true, last = null, raf = 0;
      function tick(now) {
        if (!running || !visible) { raf = 0; return; }
        if (last === null) last = now;
        var dt = Math.min(1 / 30, (now - last) / 1000); last = now;
        step(dt); paint(false);
        raf = requestAnimationFrame(tick);
      }
      function run() { if (!raf && running && visible && !RM) { last = null; raf = requestAnimationFrame(tick); } }
      function build() {                               // first sizing: lay the word, paint it, fade in
        if (built || !fit()) return;
        built = true;
        layWord(); paint(true);
        requestAnimationFrame(function () { stage.classList.add("is-in"); });
        if (RM) return;
        // Don't fight the host's first paint: start once the main thread idles.
        var go = function () { running = true; run(); };
        if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 900 }); else setTimeout(go, 500);
      }
      new ResizeObserver(function () {
        if (!built) { build(); return; }
        if (fit()) paint(true);
      }).observe(host);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          visible = es[es.length - 1].isIntersecting;
          if (visible) run();
        }, { threshold: 0.06 }).observe(host);
      }
      this._resume = run;
      build();
    }
  }
  customElements.define("qsd-bubbles", QsdBubbles);
})();
