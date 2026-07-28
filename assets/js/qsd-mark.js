/* <qsd-mark> — the QSD monogram as a self-contained, reusable Web Component.
   Shadow DOM encapsulates the SVG + CSS + its rAF morph (no id/style collisions,
   any number of instances). It sizes to its host box (container queries) and
   observes itself for scroll-pause + cursor tilt — no host wiring. Was an iframe.
   Usage:  <qsd-mark></qsd-mark>  (size it via CSS on the element).            */
(function(){
  "use strict";
  if (customElements.get('qsd-mark')) return;
  var CSS = ':host{ display:flex; align-items:center; justify-content:center;\n  container-type:inline-size;               /* the mark sizes to OUR box → reusable at any size */\n  pointer-events:none; }\n.mark-wrap{ position:relative; aspect-ratio:1/1; display:grid; place-items:center;\n  width: clamp(220px, 50cqw, 460px); }\n.glow-bg{ position:absolute; inset:-24%; z-index:0; pointer-events:none; filter:blur(18px);\n  transition:opacity 1.1s cubic-bezier(.16,1,.3,1); }\n.glow-warm{ background:radial-gradient(circle at 50% 50%, rgba(228,177,129,.16), rgba(228,177,129,0) 60%); opacity:.5; }\n.glow-dusk{ background:radial-gradient(circle at 50% 50%, rgba(120,104,140,.22), rgba(120,104,140,0) 62%); opacity:0; }\n.mark-wrap.is-locked .glow-warm{ opacity:.12; }\n.mark-wrap.is-locked .glow-dusk{ opacity:.5; }\nsvg.qsd{ position:relative; z-index:1; width:100%; height:100%; overflow:visible; transform-origin:50% 50%; }\n#ink{ fill:url(#inkDusk); stroke:url(#writeLine); stroke-width:2.3; vector-effect:non-scaling-stroke;\n  stroke-linejoin:round; stroke-linecap:round; filter:none; transition:filter 1.2s cubic-bezier(.16,1,.3,1); }\n.is-developed #ink{ filter:drop-shadow(0 0 12px rgba(120,104,140,.22)); }\n.grain{ position:absolute; inset:0; z-index:2; pointer-events:none; opacity:0; mix-blend-mode:soft-light;\n  background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'g\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'160\' height=\'160\' filter=\'url(%23g)\'/%3E%3C/svg%3E"); background-size:160px 160px; transition:opacity 1.2s ease; }\n.mark-wrap.is-locked .grain{ opacity:.06; }\n#seed{ filter:drop-shadow(0 0 9px rgba(228,177,129,.75)); }\n@media (prefers-reduced-motion:reduce){ .glow-bg{animation:none!important} .glow-warm{opacity:.12!important}\n  .glow-dusk{opacity:.5!important} .grain{opacity:.06!important} svg.qsd{transform:none!important} #ink{transition:none!important} }';
  var MARKUP = '<div class="mark-wrap" id="wrap"><div class="glow-bg glow-warm" id="glowWarm"></div><div class="glow-bg glow-dusk" id="glowDusk"></div><svg class="qsd" id="svg" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\n        <defs>\n          <!-- viewBox is Y-flipped by the outer g (scale -1.6), so objectBoundingBox\n               y=0 → screen BOTTOM, y=1 → screen TOP. The dusk gradient below was\n               validated in this exact flipped space: ember-peach lands lower-left,\n               dusk-indigo upper-right. -->\n\n          <!-- RESTING INK — "hollow dusk": warm→cool, dimmed, atmospheric. -->\n          <linearGradient id="inkDusk" x1="0.12" y1="0" x2="0.88" y2="1">\n            <stop offset="0"    stop-color="#cf9463"/>  <!-- ember-peach (lower-left) -->\n            <stop offset="0.42" stop-color="#8f6a76"/>  <!-- mauve -->\n            <stop offset="1"    stop-color="#4b4a7d"/>   <!-- dusk-indigo (upper-right) -->\n          </linearGradient>\n\n          <!-- FORMING STROKE — the warm line-of-light during inscription\n               (screen bottom warm-amber → top hot-ivory). Cools to a whisper. -->\n          <linearGradient id="writeLine" x1="0" y1="0" x2="0" y2="1">\n            <stop offset="0"   stop-color="#d79a5a"/>\n            <stop offset="0.5" stop-color="#f4d29a"/>\n            <stop offset="1"   stop-color="#fff3df"/>\n          </linearGradient>\n          <radialGradient id="seedGrad" cx="0.5" cy="0.5" r="0.5">\n            <stop offset="0"    stop-color="#fff6e6"/>\n            <stop offset="0.55" stop-color="rgba(240,205,150,0.55)"/>\n            <stop offset="1"    stop-color="rgba(228,177,129,0)"/>\n          </radialGradient>\n\n        </defs>\n\n        <!-- The real logo transform stack, preserved verbatim. The path\'s own\n             translate(13.7243,28.3362) is hoisted onto this inner <g> so both the\n             seed and the morphing path share one raw coordinate space. -->\n        <g transform="scale(1.600000,-1.600000) translate(0,-500)">\n          <g transform="translate(13.724300,28.336200)">\n            <circle id="seed" r="5" opacity="0" fill="url(#seedGrad)"/>\n            <g id="mark" opacity="0">\n              <path id="ink" d=""></path>\n            </g>\n          </g>\n        </g>\n      </svg><div class="grain"></div></div>';
  class QsdMark extends HTMLElement {
    connectedCallback(){
      if (this._booted) return; this._booted = true;
      var root = this.attachShadow({ mode:'open' });
      root.innerHTML = '<style>'+CSS+'</style>'+MARKUP;
      var host = this;
      (function(){

  "use strict";

  // ---- The REAL final mark. All commands are M/L + Z per subpath, so the
  //      command structure is trivially uniform: this is the morph target and
  //      every intermediate state is the same points relocated. ----
  var D = "M 189.084000 1.086300 L 194.533800 1.502000 L 200.091100 2.247700 L 361.972400 28.961300 L 366.405000 29.837700 L 370.649500 30.877200 L 374.705000 32.080600 L 378.570900 33.449000 L 382.246500 34.983600 L 385.731000 36.685300 L 389.023800 38.555100 L 392.124100 40.594100 L 395.242200 43.070200 L 398.204800 45.976000 L 401.016300 49.309900 L 403.681300 53.071100 L 406.204500 57.257700 L 408.590200 61.868500 L 410.843200 66.902500 L 412.967900 72.357700 L 468.373500 224.583300 L 470.178400 229.922400 L 471.621800 235.037900 L 472.699300 239.931500 L 473.406600 244.604700 L 473.739100 249.059200 L 473.692500 253.296400 L 473.262300 257.317900 L 472.444100 261.125100 L 471.383400 264.563500 L 470.091300 267.981000 L 468.568400 271.378300 L 466.815300 274.755700 L 464.832900 278.113800 L 462.621600 281.453300 L 460.182200 284.774400 L 457.515300 288.078100 L 351.012000 412.562300 L 347.099100 416.889600 L 343.051800 420.882900 L 338.870600 424.540900 L 334.556000 427.862000 L 330.108700 430.844600 L 325.529100 433.487400 L 320.817900 435.788600 L 315.975600 437.746800 L 311.008100 439.359300 L 305.914500 440.627200 L 300.696000 441.551400 L 295.353200 442.132500 L 289.887100 442.371300 L 284.298600 442.268500 L 278.588500 441.825100 L 272.757700 441.041600 L 111.290900 414.064700 L 107.146500 413.253100 L 103.157600 412.282600 L 99.325000 411.152600 L 95.649600 409.862400 L 92.131900 408.411200 L 88.772900 406.798400 L 85.573200 405.023500 L 82.533600 403.085500 L 79.430000 400.702000 L 76.489500 397.903000 L 73.707800 394.690000 L 71.080600 391.064900 L 68.603400 387.029800 L 66.271900 382.586200 L 64.081800 377.736000 L 62.028600 372.480900 L 6.623000 220.255300 L 4.743800 214.704200 L 3.237500 209.392300 L 2.108400 204.317700 L 1.361100 199.478600 L 1.000000 194.873400 L 1.029600 190.500100 L 1.454200 186.357100 L 2.278300 182.442500 L 3.365400 178.886700 L 4.705700 175.337300 L 6.298100 171.793800 L 8.141300 168.255900 L 10.234300 164.723400 L 12.575800 161.195700 L 15.164900 157.672900 L 18.000100 154.154400 L 18.050700 154.094800 L 124.859700 29.609200 L 128.656800 25.462300 L 132.581200 21.637900 L 136.631400 18.136500 L 140.806000 14.958300 L 145.103600 12.104200 L 149.522900 9.574600 L 154.062300 7.370100 L 158.720400 5.491200 L 163.495900 3.938500 L 168.387300 2.712400 L 173.393300 1.813600 L 178.512300 1.242700 L 183.743000 1.000000 Z M 347.123300 390.503100 L 207.612400 413.726900 L 206.928000 413.821600 L 275.353900 425.253700 L 280.190300 425.906900 L 284.897500 426.281000 L 289.476800 426.377000 L 293.929700 426.195400 L 298.257500 425.737300 L 302.461400 425.003400 L 306.542900 423.994600 L 310.503300 422.711700 L 314.355600 421.151300 L 318.118600 419.305700 L 321.793000 417.173500 L 325.379400 414.753200 L 328.878200 412.043200 L 332.290000 409.042000 L 335.615400 405.748200 L 338.854900 402.160100 L 349.171700 390.101600 Z M 77.063700 367.008500 L 78.691000 371.198600 L 80.379600 375.004500 L 82.125100 378.427700 L 83.923200 381.470500 L 85.769400 384.134200 L 87.659400 386.420900 L 89.588900 388.332100 L 91.553400 389.870100 L 93.835500 391.321300 L 96.266100 392.660200 L 98.845300 393.886100 L 101.573300 394.998100 L 104.450300 395.995500 L 107.476400 396.877500 L 113.976800 398.291900 L 159.291300 405.862700 L 157.504200 404.833100 L 153.589800 402.214200 L 149.786700 399.297300 L 146.095000 396.083100 L 142.515000 392.573000 L 139.046800 388.768100 L 47.230900 281.322400 L 44.905500 278.442200 L 44.752300 278.233800 Z M 280.379000 47.807300 L 276.622500 48.098600 L 272.773200 48.611200 L 133.162900 71.649400 L 127.188500 72.949500 L 121.842200 74.642900 L 119.405700 75.634100 L 117.125900 76.720100 L 115.002300 77.900100 L 113.034100 79.173100 L 111.356900 80.517100 L 109.698700 82.198800 L 108.064000 84.219800 L 106.457400 86.581300 L 104.883400 89.284900 L 103.346600 92.332200 L 101.851500 95.724600 L 100.402700 99.463600 L 52.571500 230.878800 L 51.347000 234.478400 L 50.371400 237.855600 L 49.640300 241.008900 L 49.149000 243.937000 L 48.893100 246.638400 L 48.868100 249.111800 L 49.069500 251.355600 L 49.492800 253.368400 L 51.021800 257.713300 L 53.183700 262.097200 L 55.983700 266.516000 L 59.427000 270.966000 L 151.183800 378.342500 L 153.974000 381.408500 L 156.830300 384.220900 L 159.753400 386.781100 L 162.743500 389.090800 L 165.801400 391.151400 L 168.927300 392.964300 L 172.122000 394.531200 L 175.385600 395.853600 L 178.729900 396.936600 L 182.172900 397.786400 L 185.716300 398.402300 L 189.361200 398.783400 L 193.109300 398.928900 L 196.961800 398.838100 L 200.920300 398.510000 L 204.986000 397.943800 L 344.442100 374.729400 L 349.952500 373.530400 L 354.926500 371.942800 L 359.370600 369.972800 L 363.291000 367.626000 L 364.898300 366.348800 L 366.485900 364.751700 L 368.049300 362.833000 L 369.584300 360.591500 L 371.086300 358.025100 L 372.551100 355.132400 L 373.974200 351.911600 L 375.351200 348.360900 L 423.182400 216.945900 L 424.478800 213.145000 L 425.518700 209.580600 L 426.306500 206.254400 L 426.846400 203.168300 L 427.142900 200.324300 L 427.200400 197.724200 L 427.023100 195.370000 L 426.615500 193.263600 L 425.944200 191.037300 L 425.093500 188.781800 L 424.062700 186.498500 L 422.851300 184.188200 L 419.884100 179.491000 L 416.187400 174.698800 L 324.015600 67.272800 L 321.410700 64.409100 L 318.732500 61.774000 L 315.979800 59.367200 L 313.151100 57.188200 L 310.245100 55.236400 L 307.260300 53.511300 L 304.195300 52.012200 L 301.048900 50.738900 L 297.819400 49.690600 L 294.505600 48.866900 L 291.106000 48.267200 L 287.619400 47.891100 L 284.044200 47.737800 Z M 327.369100 98.365700 L 329.051200 98.404800 L 330.855700 98.797200 L 332.552300 99.522100 L 334.088600 100.563000 L 335.412600 101.903100 L 336.472200 103.525900 L 395.594600 217.778900 L 395.837100 218.392400 L 396.185100 219.186900 L 396.229300 219.384200 L 396.306100 219.578600 L 396.429100 220.276800 L 396.585300 220.974400 L 396.591100 221.196100 L 396.631600 221.426200 L 396.615100 222.122600 L 396.633200 222.818100 L 396.593200 223.048100 L 396.588000 223.270000 L 396.433600 223.967200 L 396.312100 224.666500 L 396.235700 224.861200 L 396.192000 225.058400 L 395.846200 225.853300 L 395.604900 226.467800 L 336.482500 341.381500 L 335.426700 343.006700 L 334.105800 344.349900 L 332.572000 345.394300 L 330.877200 346.123200 L 329.073500 346.519800 L 327.305700 346.564900 L 327.077900 346.587700 L 206.552100 346.587700 L 206.249800 346.557500 L 205.892800 346.567800 L 205.210700 346.453700 L 204.611500 346.393800 L 204.323700 346.305200 L 204.026800 346.255600 L 203.465000 346.041100 L 202.804000 345.837800 L 202.490100 345.668900 L 202.206800 345.560800 L 201.743300 345.267200 L 201.168400 344.958000 L 200.870800 344.714600 L 200.563300 344.519800 L 200.163100 344.135900 L 199.743300 343.792700 L 199.497300 343.497200 L 199.203500 343.215400 L 198.896100 342.775100 L 198.567500 342.380400 L 198.374700 342.028400 L 198.144500 341.698800 L 197.937200 341.229600 L 197.679700 340.759400 L 197.558600 340.372700 L 197.403400 340.021600 L 197.283700 339.495000 L 197.118700 338.968200 L 197.082100 338.608200 L 196.997300 338.235500 L 196.978300 337.588400 L 196.923000 337.045200 L 196.953500 336.745400 L 196.943100 336.392000 L 197.058300 335.715800 L 197.118700 335.122000 L 197.207900 334.836900 L 197.258100 334.542500 L 197.474500 333.985900 L 197.679700 333.330800 L 197.850200 333.019400 L 197.959300 332.738900 L 254.385600 222.159800 L 205.905200 128.309900 L 187.733100 163.719200 L 215.494000 217.807100 L 215.730200 218.410400 L 216.060100 219.157100 L 216.112200 219.386600 L 216.199400 219.609100 L 216.314800 220.277000 L 216.466300 220.943200 L 216.473700 221.197000 L 216.518700 221.457800 L 216.500800 222.121400 L 216.520400 222.786700 L 216.475800 223.048100 L 216.469000 223.301400 L 216.319200 223.967200 L 216.205300 224.636100 L 216.118800 224.858600 L 216.067100 225.088500 L 215.738400 225.837000 L 215.504100 226.439700 L 156.863200 341.353400 L 156.784800 341.474900 L 156.720100 341.625000 L 156.170200 342.428000 L 155.812900 342.982100 L 155.738800 343.057900 L 155.675000 343.151100 L 155.079700 343.732600 L 154.496500 344.329600 L 154.402800 344.393800 L 154.327100 344.467700 L 153.771900 344.826400 L 152.966100 345.379000 L 152.815200 345.444500 L 152.693200 345.523300 L 152.074800 345.765800 L 151.273700 346.113400 L 151.075100 346.157800 L 150.879600 346.234400 L 150.175700 346.358600 L 149.471400 346.515800 L 149.247800 346.522200 L 149.016300 346.563200 L 148.314300 346.549200 L 147.611200 346.569500 L 147.378900 346.530600 L 147.155700 346.526200 L 146.449900 346.375200 L 145.745000 346.257200 L 145.549300 346.182500 L 145.349800 346.139800 L 144.543800 345.798700 L 143.925000 345.562400 L 143.802500 345.484800 L 143.650800 345.420600 L 142.838700 344.874400 L 142.281500 344.521500 L 142.205300 344.448300 L 142.110900 344.384900 L 141.522500 343.793400 L 140.921800 343.216900 L 140.857000 343.124200 L 140.782300 343.049100 L 140.420600 342.499100 L 139.862800 341.700400 L 139.796700 341.550700 L 139.717200 341.429800 L 79.758600 226.516300 L 79.520300 225.919400 L 79.155500 225.088700 L 79.112800 224.898800 L 79.041000 224.719000 L 78.916600 224.026500 L 78.753500 223.301600 L 78.747700 223.086600 L 78.709200 222.872500 L 78.723200 222.180100 L 78.703700 221.458000 L 78.742300 221.234300 L 78.746500 221.028400 L 78.897900 220.333200 L 79.023000 219.609300 L 79.096700 219.421000 L 79.136400 219.238800 L 79.480600 218.440400 L 79.728400 217.807300 L 138.367600 103.550800 L 139.421700 101.924500 L 140.741200 100.580000 L 142.274000 99.534100 L 143.968100 98.803500 L 145.771300 98.405100 L 147.631700 98.355800 L 147.664100 98.361300 L 149.449200 98.408600 L 151.252400 98.806900 L 152.946500 99.537400 L 154.479400 100.583300 L 155.798900 101.927800 L 156.853100 103.554100 L 176.929700 142.670400 L 197.005900 103.550900 L 198.060000 101.924600 L 199.379500 100.580100 L 200.912300 99.534100 L 202.606400 98.803600 L 204.409600 98.405200 L 206.270000 98.355800 L 208.135300 98.672200 L 209.953700 99.371200 L 211.594900 100.415800 L 211.979900 100.786900 L 212.738100 101.301300 L 214.061200 102.642400 L 215.119700 104.265900 L 273.760600 217.784900 L 274.000400 218.392800 L 274.338100 219.156800 L 274.387400 219.373700 L 274.470800 219.585100 L 274.590200 220.265900 L 274.744200 220.943000 L 274.751300 221.183700 L 274.795000 221.432900 L 274.778500 222.109300 L 274.798400 222.786500 L 274.755900 223.036100 L 274.750000 223.276700 L 274.599500 223.954100 L 274.483400 224.635900 L 274.401000 224.847900 L 274.352800 225.064800 L 274.019000 225.830500 L 273.782200 226.439600 L 222.211700 327.502600 L 248.381100 327.502600 L 302.139200 222.147700 L 245.715500 112.202700 L 245.010100 110.400600 L 244.690900 108.551900 L 244.740700 106.708300 L 245.142700 104.921200 L 245.879900 103.242400 L 246.935400 101.723400 L 248.292100 100.415800 L 249.933200 99.371200 L 251.751600 98.672100 L 253.617000 98.355800 L 254.372200 98.375900 L 254.753000 98.337800 L 327.089400 98.337800 Z M 442.844400 204.207100 L 442.181300 208.455400 L 441.186200 212.905400 L 439.863500 217.559000 L 438.217400 222.418200 L 397.927100 333.114900 L 445.322300 277.718200 L 449.399000 272.446200 L 451.146100 269.826700 L 452.700500 267.218500 L 454.063300 264.621500 L 455.235500 262.035800 L 456.218200 259.461300 L 457.012500 256.898300 L 457.512900 254.459700 L 457.747900 251.756100 L 457.713200 248.789100 L 457.404300 245.560100 L 456.816800 242.070700 L 455.946300 238.322500 L 454.788300 234.317000 L 453.338300 230.055800 L 443.041400 201.765000 Z M 270.000200 117.422800 L 321.517500 217.807400 L 321.737500 218.369500 L 322.085400 219.156700 L 322.140600 219.399500 L 322.222800 219.609500 L 322.331700 220.239800 L 322.491500 220.942800 L 322.499400 221.210900 L 322.542100 221.458200 L 322.525100 222.086000 L 322.545700 222.786400 L 322.498700 223.062600 L 322.492200 223.301800 L 322.351200 223.928600 L 322.230800 224.635700 L 322.139100 224.871700 L 322.090200 225.088900 L 321.780000 225.795400 L 321.529600 226.439400 L 269.961400 327.502600 L 322.006200 327.502600 L 376.211600 222.145700 L 322.020700 117.422800 Z M 99.132900 222.096600 L 148.175200 316.088700 L 196.114800 222.145700 L 176.930600 184.768400 L 155.534800 226.459200 L 154.480700 228.085500 L 153.161300 229.430000 L 151.628500 230.476000 L 149.934400 231.206600 L 148.131100 231.605000 L 146.270800 231.654400 L 144.405300 231.338000 L 142.586900 230.638900 L 140.945900 229.594300 L 139.589100 228.286700 L 138.533700 226.767700 L 137.796500 225.088900 L 137.394500 223.301800 L 137.344600 221.458200 L 137.663900 219.609500 L 138.369200 217.807400 L 166.127200 163.719500 L 147.609700 127.641000 Z M 30.234400 164.466100 L 27.926400 167.324900 L 25.826100 170.167800 L 23.942000 172.981900 L 22.273100 175.766900 L 20.818300 178.522500 L 19.576200 181.248400 L 18.545900 183.944300 L 17.726100 186.609700 L 17.213900 189.159400 L 16.979500 191.990200 L 17.027500 195.100600 L 17.362300 198.488700 L 17.988300 202.152800 L 18.910000 206.091000 L 20.131800 210.301700 L 21.658100 214.783000 L 32.949700 245.806400 L 33.143700 243.031800 L 33.752700 238.906800 L 34.690900 234.595200 L 35.953600 230.095600 L 37.536400 225.406500 L 81.437700 104.788600 Z M 310.614900 37.360200 L 314.592400 39.293500 L 318.462200 41.510700 L 322.222800 44.011200 L 325.872800 46.794900 L 329.410900 49.861000 L 332.835400 53.209000 L 336.145100 56.838300 L 428.384100 164.343400 L 430.278200 166.698200 L 397.932900 77.830200 L 396.220600 73.410200 L 394.451100 69.392600 L 392.628900 65.775800 L 390.758500 62.558600 L 388.844500 59.739600 L 386.891600 57.317400 L 384.904200 55.290800 L 382.886900 53.658300 L 380.571500 52.141200 L 378.074200 50.736500 L 375.395300 49.445400 L 372.535100 48.268900 L 369.493700 47.208300 L 366.271500 46.264800 L 362.868700 45.439500 L 359.285500 44.733700 L 307.859400 36.247600 Z M 180.033000 17.167900 L 175.921300 17.610000 L 171.909600 18.316900 L 167.996400 19.289000 L 164.180300 20.526900 L 160.459800 22.031100 L 156.833600 23.802000 L 153.300300 25.840200 L 149.858400 28.146200 L 146.506500 30.720400 L 143.243300 33.563400 L 140.067200 36.675700 L 136.976900 40.057600 L 121.674000 57.893300 L 122.805400 57.559500 L 126.527900 56.652200 L 130.410800 55.887400 L 130.488000 55.874400 L 270.207000 32.818500 L 275.089300 32.174300 L 279.876900 31.818400 L 280.926300 31.803200 L 197.506500 18.037500 L 192.981200 17.425500 L 188.561500 17.076200 L 184.245900 16.990200 Z";

  var ink  = root.getElementById('ink');
  var seed = root.getElementById('seed');
  var mark = root.getElementById('mark');
  var wrap = root.getElementById('wrap');
  var svg  = root.getElementById('svg');
  var glowWarm = root.getElementById('glowWarm');
  var glowDusk = root.getElementById('glowDusk');

  // ---- resting-tilt state: the held mark tips toward a live cursor ----
  var G_TARGET = { x:0.5, y:0.5 };   // desired tilt target (cursor pos, Y-flipped)
  var G_POS    = { x:0.5, y:0.5 };   // eased actual
  var G_LAST_MOVE = -1e9;            // performance.now() of the last host pointer msg
  var G_TILT   = { x:0, y:0 };       // eased 3D tilt (deg)

  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- parse the compound path into subpaths of [x,y] points ----------
  function parse(d){
    var subs=[], cur=null, tk=d.trim().split(/\s+/), i=0;
    while(i<tk.length){
      var t=tk[i];
      if(t==='M'||t==='L'){
        var x=parseFloat(tk[i+1]), y=parseFloat(tk[i+2]);
        if(t==='M'){ cur={pts:[]}; subs.push(cur); }
        cur.pts.push([x,y]); i+=3;
      } else { i+=1; }              // Z (and anything else) — no coords
    }
    return subs;
  }
  var subs = parse(D);

  function centroid(pts){
    var x=0,y=0,i; for(i=0;i<pts.length;i++){ x+=pts[i][0]; y+=pts[i][1]; }
    return { x:x/pts.length, y:y/pts.length };
  }
  function bboxArea(pts){
    var mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9,i,p;
    for(i=0;i<pts.length;i++){ p=pts[i];
      if(p[0]<mnx)mnx=p[0]; if(p[0]>mxx)mxx=p[0];
      if(p[1]<mny)mny=p[1]; if(p[1]>mxy)mxy=p[1]; }
    return (mxx-mnx)*(mxy-mny);
  }

  var all=[], i;
  for(i=0;i<subs.length;i++){ all=all.concat(subs[i].pts); }
  var G = centroid(all);                       // global seed origin

  var areas=[], maxA=0;
  for(i=0;i<subs.length;i++){ areas[i]=bboxArea(subs[i].pts); if(areas[i]>maxA)maxA=areas[i]; }

  // The largest outlines (outer + inner hexagon boundary) are the FRAME; they
  // form first from the seed. Everything else is monogram, staggered after.
  for(i=0;i<subs.length;i++){
    subs[i].idx = i;
    subs[i].c   = centroid(subs[i].pts);
    subs[i].frame = areas[i] >= 0.5*maxA;
  }
  var letters = subs.filter(function(s){return !s.frame;})
                    .sort(function(a,b){return a.c.x-b.c.x;});   // inscribe L→R

  // ---------------------------- timeline (seconds) ----------------------------
  // One breath of the loop: inscribe (~0.4→4.4) · STAY (~4.4→7.3) · dissolve
  // (7.3→8.3) · a beat of dark (8.3→8.8) · then it carries on from the seed.
  var LOOP = 8.8;
  var T_MARK_IN0=0.05, T_MARK_IN1=0.50;
  var T_SEED_IN0=0.00, T_SEED_IN1=0.32, T_SEED_OUT0=0.50, T_SEED_OUT1=1.25;
  var T_STROKE0=0.42, T_STROKE1=0.80;
  var T_FRAME0=0.42, T_FRAME1=2.12;
  var T_LET0=1.75,  LET_STAGGER=1.42, LET_DUR=1.20;   // last letter ends ~4.37
  var T_FILL0=4.28, T_FILL1=5.00;
  var T_LOCK0=4.30, T_HOLD0=5.00, T_HOLD1=7.30;
  var T_REL0=7.30,  T_REL1=8.30;   // a longer, graceful dissolve than the write

  var nL = letters.length;
  for(i=0;i<nL;i++){
    letters[i].start = T_LET0 + (nL>1 ? i/(nL-1) : 0) * LET_STAGGER;
  }

  // Precompute each subpath's pivot (trajectory origin), start spin, and the
  // point offsets from that pivot. Pivot only shapes the *path of travel* — at
  // progress 1 every point lands exactly on target regardless of pivot.
  for(i=0;i<subs.length;i++){
    var s=subs[i];
    var piv = s.frame
      ? { x:s.c.x, y:s.c.y }                                   // frame: own centre (≈ seed)
      : { x:s.c.x+(G.x-s.c.x)*0.45, y:s.c.y+(G.y-s.c.y)*0.45 };// glyphs: stream from near seed
    s.piv = piv;
    s.theta0 = s.frame ? -0.13 : (0.15 * ((s.idx%2) ? 1 : -1)); // gentle counter-spin
    var d0=[], j; for(j=0;j<s.pts.length;j++){ d0.push([s.pts[j][0]-piv.x, s.pts[j][1]-piv.y]); }
    s.d0 = d0;
  }

  // ---------- LOD: a curvature-simplified point subset per subpath (once) ----------
  // PERF: the source outlines are font-flattened — hundreds of near-collinear
  // micro-points. Ramer–Douglas–Peucker (run ONCE here) yields a subset that stays
  // within `eps` of the true outline. While a subpath is IN FLIGHT (moving, detail
  // invisible) we emit this "lite" subset; the instant it settles we swap to full
  // fidelity. eps is sub-perceptual even at rest scale, so the swap never pops.
  function rdp(pts, eps2, keep, lo, hi){
    var idx=-1, dmax=0, ax=pts[lo][0], ay=pts[lo][1];
    var dx=pts[hi][0]-ax, dy=pts[hi][1]-ay, len2=dx*dx+dy*dy;
    for(var i=lo+1;i<hi;i++){
      var tt = len2 ? ((pts[i][0]-ax)*dx+(pts[i][1]-ay)*dy)/len2 : 0;
      var ex=pts[i][0]-(ax+dx*tt), ey=pts[i][1]-(ay+dy*tt), d=ex*ex+ey*ey;
      if(d>dmax){ dmax=d; idx=i; }
    }
    if(idx>0 && dmax>eps2){ rdp(pts,eps2,keep,lo,idx); rdp(pts,eps2,keep,idx,hi); }
    else { keep[hi]=1; }
  }
  var LITE_EPS=1.7, liteTotal=0, fullTotal=0;   // eps in path units (~1.5px at full size — invisible in motion, full fidelity returns at rest)
  for(i=0;i<subs.length;i++){
    var sp=subs[i], np=sp.pts.length, fullIx=[]; for(j=0;j<np;j++) fullIx.push(j);
    sp.full=fullIx; fullTotal+=np;
    if(np<14){ sp.lite=fullIx; liteTotal+=np; continue; }   // tiny bits: nothing to gain
    var keep={0:1}; rdp(sp.pts, LITE_EPS*LITE_EPS, keep, 0, np-1);
    var lite=[]; for(j=0;j<np;j++){ if(keep[j]) lite.push(j); }
    sp.lite=lite; liteTotal+=lite.length;
  }
  // Real, per-run measurement (open devtools): the source outlines are heavily
  // oversampled (618 pts / 11 subpaths), so RDP keeps only ~28% in flight
  // (~170 pts) — the in-motion `d` string and its parse/raster shrink ~3.5×,
  // near-losslessly (sub-pixel deviation). Full fidelity returns at rest.
  if(window.console && console.info){
    console.info('QSD morph LOD — flight points:', liteTotal, '/ rest points:', fullTotal,
                 '('+Math.round(100*liteTotal/fullTotal)+'% in flight)');
  }

  // -------------------------- easing (cubic-bezier) --------------------------
  function cubicBezier(x1,y1,x2,y2){
    var cx=3*x1, bx=3*(x2-x1)-cx, ax=1-cx-bx;
    var cy=3*y1, by=3*(y2-y1)-cy, ay=1-cy-by;
    function bxT(t){ return ((ax*t+bx)*t+cx)*t; }
    function byT(t){ return ((ay*t+by)*t+cy)*t; }
    function dbx(t){ return (3*ax*t+2*bx)*t+cx; }
    function solve(x){ var t=x,i,e,d; for(i=0;i<6;i++){ e=bxT(t)-x; if(Math.abs(e)<1e-5)break; d=dbx(t); if(d===0)break; t-=e/d; } return t; }
    return function(x){ if(x<=0)return 0; if(x>=1)return 1; return byT(solve(x)); };
  }
  var easeFrame  = cubicBezier(0.16,1,0.30,1);  // expo-out: flings out, settles
  var easeLetter = cubicBezier(0.22,1,0.36,1);  // quint-out
  var easeFade   = cubicBezier(0.40,0,0.20,1);

  function clamp(v){ return v<0?0:(v>1?1:v); }
  function lerp(a,b,t){ return a+(b-a)*t; }

  // -------------------- morph geometry: progress + fragment build --------------------
  // progress for a subpath at time t (the frame eases as one; glyphs per stagger)
  function progressOf(s,t){
    return s.frame ? easeFrame(clamp((t-T_FRAME0)/(T_FRAME1-T_FRAME0)))
                   : easeLetter(clamp((t-s.start)/LET_DUR));
  }

  // Build ONE subpath's `d` fragment. Settled (p>=1) → full points at 1-decimal
  // (crisp at rest). In flight (p<1) → the RDP "lite" subset with integer coords:
  // a much shorter string that parses/rasters faster and is invisible while the
  // piece is moving. At p>=1 the spin unwinds to 0 and scale is 1, so full points
  // land exactly on the real mark.
  function fragOf(s,p){
    var full=(p>=1), ix=full?s.full:s.lite;
    var ang=s.theta0*(1-p), scl=p, c=Math.cos(ang), sn=Math.sin(ang);
    var px=s.piv.x, py=s.piv.y, d0=s.d0, m=ix.length, i, k, dx, dy, X, Y, out;
    k=ix[0]; dx=d0[k][0]; dy=d0[k][1];
    X=px+scl*(c*dx-sn*dy); Y=py+scl*(sn*dx+c*dy);
    out = full ? ('M'+X.toFixed(1)+' '+Y.toFixed(1))
               : ('M'+Math.round(X)+' '+Math.round(Y));
    for(i=1;i<m;i++){
      k=ix[i]; dx=d0[k][0]; dy=d0[k][1];
      X=px+scl*(c*dx-sn*dy); Y=py+scl*(sn*dx+c*dy);
      out += full ? ('L'+X.toFixed(1)+' '+Y.toFixed(1))
                  : ('L'+Math.round(X)+' '+Math.round(Y));
    }
    return out+'Z';
  }

  // Per-subpath fragment cache. A settled subpath is computed ONCE then reused
  // verbatim, so only pieces in motion pay CPU. Before the frame starts forming
  // (t<T_FRAME0) nothing is drawn; during the long hold NOTHING changes, so the
  // whole setAttribute is skipped. Returns true iff the joined string changed.
  var frags = new Array(subs.length);
  var lastD = '';
  function rebuildPath(t){
    if(t < T_FRAME0) return false;          // pre-form window: geometry is empty
    var changed=false, k, s, p;
    for(k=0;k<subs.length;k++){
      s=subs[k]; p=progressOf(s,t);
      if(p>=1){
        if(s._settled) continue;            // cache hit — this piece is at rest
        s._settled=true; frags[k]=fragOf(s,1); changed=true;
      } else {
        s._settled=false; frags[k]=fragOf(s,p); changed=true;
      }
    }
    if(changed){
      var d=frags.join('');
      if(d!==lastD){ ink.setAttribute('d',d); lastD=d; }
    }
    return changed;
  }
  function resetPath(){
    for(var k=0;k<subs.length;k++){ subs[k]._settled=false; frags[k]=''; }
    lastD=''; ink.setAttribute('d','');
  }

  // ------------------------------ per-frame render ------------------------------
  // The d-rebuild (the costly part) is capped to ~48fps; scale + opacity still
  // update every rAF so motion stays silky even on 120/144Hz panels. The geometry
  // is flung fast during the write, so 48fps of point-rebuild is imperceptible —
  // it just spares the main thread while the host is mid-load.
  var REBUILD_MIN = 1000/48;
  var lastRebuild = -1e9;
  var strokeIsDusk = false;

  function render(t, now){
    if(now - lastRebuild >= REBUILD_MIN){ rebuildPath(t); lastRebuild = now; }

    // group presence (fade in / release fade out)
    var mo;
    if(t<T_MARK_IN1)      mo=easeFade(clamp((t-T_MARK_IN0)/(T_MARK_IN1-T_MARK_IN0)));
    else if(t<T_REL0)     mo=1;
    else                  mo=1-easeFade(clamp((t-T_REL0)/(T_REL1-T_REL0)));
    mark.setAttribute('opacity', mo.toFixed(3));

    // warm line-of-light fades in with the frame, then recedes to a whisper as the
    // dusk fill develops — this recession IS the visible "cooling".
    var so = 0.90*clamp((t-T_STROKE0)/(T_STROKE1-T_STROKE0));
    if(t>=T_REL0)  so *= (1-clamp((t-T_REL0)/(T_REL1-T_REL0)));   // hold warm; fade only at loop release
    ink.style.strokeOpacity = so.toFixed(3);

    // The stroke keeps the warm line-of-light it formed with, all the way through the
    // hold — no swap to a second gradient, no hue drift. Swapping/​breathing the colour
    // the instant the mark finished read as an abrupt, unexpected "ending"; the mark
    // now simply settles into the colour it was written in and rests there.

    // hollow-dusk fill develops in once geometry is locked
    var fo = 0;             // no dusk-fill develop — mark rests as warm hollow lines
    ink.style.fillOpacity = fo.toFixed(3);

    // seed ember: ignite, then hand off to the forming frame
    var se = clamp((t-T_SEED_IN0)/(T_SEED_IN1-T_SEED_IN0));
    se *= (1-clamp((t-T_SEED_OUT0)/(T_SEED_OUT1-T_SEED_OUT0)));
    seed.style.opacity = (se*0.95).toFixed(3);

    // clean settle at the lock (a single damped seat — no springy overshoot),
    // a contemplative breath on the hold, a soft exhale on release
    var k=1;
    if(t>=T_LOCK0 && t<T_HOLD0){
      var lp=clamp((t-T_LOCK0)/(T_HOLD0-T_LOCK0));
      k = 1 + 0.013*Math.sin(lp*Math.PI)*(1-lp)*(1-lp);
    } else if(t>=T_HOLD0 && t<T_REL0){
      k = 1 + 0.0035*Math.sin((t-T_HOLD0)*1.6);
    } else if(t>=T_REL0){
      k = 1 + 0.012*clamp((t-T_REL0)/(T_REL1-T_REL0));
    }

    // ---- resting: a subtle tilt toward a LIVE cursor, and nothing else ----
    // No idle orbit, no colour breath. When the pointer is away the held mark is
    // perfectly still in the colour it was written in; on hover it just tips a few
    // degrees toward the cursor — a physical response, never a colour change.
    var inStay = (t>=T_HOLD0 && t<T_REL0);
    var fresh = inStay && (now - G_LAST_MOVE < 2200);
    var tgx = fresh ? G_TARGET.x : 0.5;   // follow a live cursor; else rest at centre (still)
    var tgy = fresh ? G_TARGET.y : 0.5;
    G_POS.x += (tgx - G_POS.x)*0.06;      // eased follow (silky, never snaps)
    G_POS.y += (tgy - G_POS.y)*0.06;

    var ttx = inStay ? (G_POS.y-0.5)*6.4 : 0;   // rotateX
    var tty = inStay ? (G_POS.x-0.5)*6.4 : 0;   // rotateY
    G_TILT.x += (ttx - G_TILT.x)*0.08;
    G_TILT.y += (tty - G_TILT.y)*0.08;
    svg.style.transform = 'perspective(1100px) rotateX('+G_TILT.x.toFixed(2)+'deg) rotateY('+G_TILT.y.toFixed(2)+'deg) scale('+k.toFixed(4)+')';

    // dim dusk bloom + halo handoff only while the mark is developed (cheap:
    // geometry is static here, so the blur/grain raster once)
    var dev = false;        // never develop/lock — no grain square, no dusk bloom
    wrap.classList.toggle('is-developed', dev);
    wrap.classList.toggle('is-locked', dev);
  }

  // -------------------------------- run / degrade --------------------------------
  if(RM){
    // reduced-motion: no loop, no breath — paint the finished HOLLOW-DUSK mark once.
    ink.setAttribute('d', D);
    ink.style.stroke = 'url(#writeLine)';   // warm line-of-light (image 1)
    mark.setAttribute('opacity','1');
    ink.style.fillOpacity='0';              // hollow — no dusk fill
    ink.style.strokeOpacity='0.9';
    seed.style.opacity='0';
    // no is-developed/is-locked: no grain square, no dusk bloom
  } else {
    // Loops forever: inscribe · stay · dissolve · a beat of dark · carry on.
    var t0=null, lastLoop=0, running=false, paused=false;

    function tick(now){
      if(paused){ running=false; return; }      // stopped while the host is off-screen
      if(t0===null){ t0=now; }
      var elapsed=(now-t0)/1000;
      var loop=Math.floor(elapsed/LOOP);
      if(loop!==lastLoop){ resetPath(); lastLoop=loop; }   // new cycle → redraw from the seed
      render(elapsed - loop*LOOP, now);
      requestAnimationFrame(tick);
    }
    function run(){ if(running) return; running=true; requestAnimationFrame(tick); }
    function launch(){ resetPath(); t0=null; lastLoop=0; paused=false; run(); }

    // PERF: don't fight the host's first paint. Kick off once the main thread goes
    // idle (past the hero photo decode + entrance reveals), or 500ms in at worst.
    resetPath();
    if('requestIdleCallback' in window) requestIdleCallback(launch, { timeout: 900 });
    else setTimeout(launch, 500);

    // Self-contained: pause the loop when WE scroll off-screen, and read the cursor
    // relative to OUR OWN box. No host wiring — drop <qsd-mark> anywhere and it works.
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ if(paused) launch(); } else { paused = true; } });
      }, { threshold: 0.06 }).observe(host);
    }
    window.addEventListener('mousemove', function(e){
      var r = host.getBoundingClientRect(); if(!r.width || !r.height) return;
      var x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      if(x<-0.35||x>1.35||y<-0.35||y>1.35) return;   // ignore a far-away cursor
      G_TARGET.x = clamp(x); G_TARGET.y = clamp(1 - y);
      G_LAST_MOVE = (window.performance && performance.now) ? performance.now() : 0;
    }, { passive:true });

    // Web Animations API — phase-independent ambient life on the halos (transform
    // only, so it never fights the opacity the lock state drives).
    if(glowWarm.animate){
      glowWarm.animate(
        [{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],
        { duration:6400, iterations:Infinity, easing:'ease-in-out' }
      );
    }
    if(glowDusk.animate){
      glowDusk.animate(
        [{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],
        { duration:7600, iterations:Infinity, easing:'ease-in-out' }
      );
    }
  }
      })();
    }
  }
  customElements.define('qsd-mark', QsdMark);
})();
