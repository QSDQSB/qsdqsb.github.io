/* ==========================================================================
   Jianfei treatise - progressive enhancement for /posts/jianfei-diary/

   Loaded only on the treatise post (gated in _includes/scripts.html on
   `page.jianfei_treatise`). It NEVER alters the post's words -- it only:
     1. transforms the two "Daily Diet Record" tables into a calendar heatmap
        (desktop) + stacked day-list (mobile), keeping the original table as the
        no-JS fallback (hidden once the exhibit is built);
     2. mutes the "TO BE UPDATED!" (unrecorded) attempts;
     3. draws the weight figure on scroll-in and gently reveals the two exhibits.

   All motion bails under prefers-reduced-motion (paired with the SCSS guard in
   _sass/_jianfei-treatise.scss). Companion styles: `.jf-*` classes there.
   ========================================================================== */
(function () {
  "use strict";
  var body = document.body;
  if (!body || body.className.indexOf("jianfei-treatise") === -1) return;
  var content = document.querySelector(".page__content");
  if (!content) return;

  document.documentElement.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  var DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  function toDate(str, year) { var p = String(str).trim().split(/\s+/); return new Date(year, MONTHS[p[0]], +p[1]); }
  function col(d) { return (d.getDay() + 6) % 7; } // Mon=0 ... Sun=6
  function seg(s) {
    if (!s) return [];
    s = String(s).replace(/\+/g, " ").trim();
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter().segment(s), function (x) { return x.segment; })
        .filter(function (g) { return g.trim(); });
    }
    return s.split(/\s+/);
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ---- 1. diet tables -> calendar + list exhibits ---- */
  function yearBefore(node) {
    var n = node;
    while (n) {
      if (n.tagName === "H2") { var m = (n.textContent || "").match(/\d{4}/); if (m) return +m[0]; }
      n = n.previousElementSibling;
    }
    return 2025;
  }
  function headerCells(table) {
    var tr = table.querySelector("thead tr") || table.querySelector("tr");
    return tr ? Array.prototype.map.call(tr.children, function (c) { return (c.textContent || "").trim().toLowerCase(); }) : [];
  }
  function bodyRows(table) {
    var trs = table.querySelectorAll("tbody tr");
    if (!trs.length) { trs = Array.prototype.slice.call(table.querySelectorAll("tr"), 1); }
    return Array.prototype.map.call(trs, function (tr) {
      return Array.prototype.map.call(tr.children, function (c) { return (c.textContent || "").trim(); });
    });
  }
  function mealEl(tag, val) {
    var m = el("div", "jf-meal");
    m.appendChild(el("span", "jf-meal-t", tag));
    m.appendChild(el("span", "jf-meal-g", seg(val).join("")));
    return m;
  }
  function buildCal(rows) {
    var cal = el("div", "jf-cal");
    var head = el("div", "jf-cal-head");
    DOW.forEach(function (d, i) { head.appendChild(el("div", "jf-cal-hc" + (i >= 5 ? " wknd" : ""), d)); });
    cal.appendChild(head);
    var weeks = {};
    rows.forEach(function (r) { var m = new Date(r.d); m.setDate(r.d.getDate() - col(r.d)); (weeks[m.getTime()] = weeks[m.getTime()] || {})[col(r.d)] = r; });
    Object.keys(weeks).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {
      var w = el("div", "jf-cal-week");
      for (var c = 0; c < 7; c++) {
        var r = weeks[k][c];
        if (!r) { w.appendChild(el("div", "jf-cell empty")); continue; }
        var cell = el("div", "jf-cell" + (c >= 5 ? " wknd" : ""));
        var dt = el("div", "jf-cell-date");
        dt.appendChild(el("span", "jf-cell-n", r.n));
        dt.appendChild(el("span", "jf-cell-d", r.date));
        cell.appendChild(dt);
        cell.appendChild(mealEl("B", r.b));
        cell.appendChild(mealEl("L", r.l));
        cell.appendChild(mealEl("S", r.s));
        w.appendChild(cell);
      }
      cal.appendChild(w);
    });
    return cal;
  }
  function buildList(rows) {
    var ol = el("ol", "jf-list");
    rows.forEach(function (r) {
      var li = el("li", "jf-row");
      li.appendChild(el("span", "jf-row-n", r.n));
      var d = el("span", "jf-row-d");
      d.appendChild(document.createTextNode(r.date + " "));
      d.appendChild(el("em", null, r.dow));
      li.appendChild(d);
      var m = el("span", "jf-row-m");
      [["B", r.b], ["L", r.l], ["S", r.s]].forEach(function (x) {
        var sp = el("span", "jf-row-meal");
        sp.appendChild(el("span", "jf-row-t", x[0]));
        sp.appendChild(el("span", "jf-row-g", seg(x[1]).join("")));
        m.appendChild(sp);
      });
      li.appendChild(m);
      ol.appendChild(li);
    });
    return ol;
  }
  function transform(table) {
    var head = headerCells(table);
    var di = head.indexOf("day"), dti = head.indexOf("date");
    if (di === -1 || dti === -1) return; // not a diet table (e.g. the emoji legend)
    var dowi = head.indexOf("dow"), bi = head.indexOf("b"), li = head.indexOf("l"), si = head.indexOf("s");
    var year = yearBefore(table);
    var rows = bodyRows(table)
      .filter(function (r) { return r[di] && /^#?\d/.test(r[di]); })
      .map(function (r) {
        var d = toDate(r[dti], year);
        return { n: r[di].replace("#", ""), date: r[dti], dow: dowi > -1 ? r[dowi] : DOW[col(d)], b: r[bi], l: r[li], s: r[si], d: d };
      });
    if (!rows.length) return;
    var wrap = el("div", "jf-exhibit");
    wrap.appendChild(buildCal(rows));
    wrap.appendChild(buildList(rows));
    table.parentNode.insertBefore(wrap, table.nextSibling);
    table.classList.add("jf-source-hidden");
    return wrap;
  }
  var exhibits = [];
  Array.prototype.forEach.call(content.querySelectorAll("table"), function (t) {
    var w = transform(t);
    if (w) exhibits.push(w);
  });

  /* ---- 2. mute the unrecorded attempts ---- */
  Array.prototype.forEach.call(content.querySelectorAll("p"), function (p) {
    if ((p.textContent || "").trim() === "TO BE UPDATED!") p.classList.add("jf-unrecorded");
  });

  /* ---- 3. motion (restrained; below-the-fold only, so no flash) ---- */
  if (reduce) return;

  // gentle reveal of the two diet exhibits
  var revealTargets = exhibits.slice();
  revealTargets.forEach(function (t) { t.classList.add("jf-reveal"); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("jf-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    revealTargets.forEach(function (t) { io.observe(t); });
  } else {
    revealTargets.forEach(function (t) { t.classList.add("jf-in"); });
  }

  // SIGNATURE ANIMATION: the weight descent writes itself as you scroll past it.
  // Progress maps the figure's travel up the viewport to stroke-dashoffset, so the
  // -6 kg line plots itself like a seismograph; area/points/labels follow the pen.
  var plot = content.querySelector(".jf-plot");
  var line = plot && plot.querySelector(".jf-line");
  if (line && line.getTotalLength) {
    var L = line.getTotalLength();
    line.style.strokeDasharray = L;
    var raf = null;
    var draw = function () {
      raf = null;
      var rect = plot.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // draw over a comfortable band as the figure rises from ~86% to ~24% of the viewport
      var p = (vh * 0.86 - rect.top) / (vh * 0.62);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      line.style.strokeDashoffset = String(L * (1 - p));
      plot.style.setProperty("--jf-p", p.toFixed(3));
      if (p > 0.985) { plot.classList.add("jf-drawn"); } else { plot.classList.remove("jf-drawn"); }
    };
    var onScroll = function () { if (!raf) { raf = requestAnimationFrame(draw); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    draw();
  }
})();
