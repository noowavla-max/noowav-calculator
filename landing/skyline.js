/* Gritty LA-style city skyline, drawn once to a fixed canvas behind the page.
   Deterministic (seeded) so it looks the same on every visit; redrawn on resize. */
(function () {
  "use strict";
  const cv = document.getElementById("city");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");

  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // one reusable grain tile
  const grain = document.createElement("canvas");
  grain.width = grain.height = 180;
  (function () {
    const g = grain.getContext("2d"), id = g.createImageData(180, 180), r = rng(7);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  })();

  function palm(x, base, h, lean, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = "round";
    const topX = x + lean, topY = base - h;
    ctx.lineWidth = Math.max(2, h * 0.018);
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, topX, topY); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, h * 0.012);
    const fronds = [[-1, 0.12], [-0.8, -0.2], [-0.4, -0.35], [0.4, -0.35], [0.8, -0.2], [1, 0.12], [0.15, -0.42]];
    fronds.forEach(([dx, dy]) => {
      const len = h * 0.24;
      ctx.beginPath(); ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(topX + dx * len * 0.6, topY + dy * len - len * 0.2, topX + dx * len, topY + (dy + 0.35) * len);
      ctx.stroke();
    });
  }

  function layer(r, W, base, opts) {
    // opts: minH, maxH, minW, maxW, color, windows, landmarks
    let x = -20;
    const rects = [];
    while (x < W + 20) {
      const w = opts.minW + r() * (opts.maxW - opts.minW);
      let h = opts.minH + Math.pow(r(), 1.6) * (opts.maxH - opts.minH);
      // taller toward the downtown cluster
      const d = Math.abs(x + w / 2 - W * opts.center) / W;
      h *= 1 + Math.max(0, 0.9 - d * 3.2) * opts.cluster;
      rects.push([x, w, h]);
      x += w + (r() < 0.25 ? r() * opts.maxW * 0.5 : 0);
    }
    ctx.fillStyle = opts.color;
    rects.forEach(([x, w, h]) => {
      const top = base - h;
      ctx.fillRect(x, top, w, h + 2);
      // rooftop clutter: setbacks, AC boxes, antennas, water towers
      const t = r();
      if (t < 0.25) ctx.fillRect(x + w * 0.2, top - h * 0.06, w * 0.6, h * 0.06 + 1);
      else if (t < 0.4) ctx.fillRect(x + w * 0.5, top - h * 0.22, Math.max(1.2, w * 0.03), h * 0.22);
      else if (t < 0.5 && w > 18) { const tw = Math.min(14, w * 0.3); ctx.fillRect(x + w * 0.15, top - tw * 1.1, tw, tw * 0.8); ctx.fillRect(x + w * 0.15 + tw * 0.15, top - tw * 0.3, 1.5, tw * 0.3); ctx.fillRect(x + w * 0.15 + tw * 0.75, top - tw * 0.3, 1.5, tw * 0.3); }
      else if (t < 0.62) ctx.fillRect(x + w * 0.1, top - 4, w * 0.25, 4);
    });
    if (opts.windows) {
      rects.forEach(([x, w, h]) => {
        const top = base - h, cw = opts.win, gap = cw * 1.7;
        const cols = Math.floor((w - 4) / gap), rows = Math.floor((h - 8) / (gap * 1.25));
        const lit = 0.05 + r() * opts.windows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          if (r() > lit) continue;
          const warm = r() < 0.62;
          ctx.globalAlpha = 0.35 + r() * 0.55;
          ctx.fillStyle = warm ? "#ffc27a" : (r() < 0.5 ? "#c88bff" : "#ff7ae6");
          ctx.fillRect(x + 3 + i * gap, top + 6 + j * gap * 1.25, cw, cw * 1.25);
        }
      });
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = Math.max(window.innerHeight, 560);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(1984);
    const mobile = W < 700;
    const horizon = H * (mobile ? 0.6 : 0.56);
    const scale = Math.min(1.4, Math.max(0.75, W / 1100));

    // smoggy dusk sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#050308");
    sky.addColorStop(0.35, "#120822");
    sky.addColorStop(0.62, "#3a1458");
    sky.addColorStop(0.8, "#5c1a6e");
    sky.addColorStop(1, "#1a0a22");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.5, horizon + H * 0.08, 10, W * 0.5, horizon + H * 0.08, Math.max(W, H) * 0.6);
    glow.addColorStop(0, "rgba(240,60,200,.35)"); glow.addColorStop(0.4, "rgba(150,50,230,.15)"); glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // a few dim stars through the smog
    for (let i = 0; i < 70; i++) { ctx.globalAlpha = r() * 0.35; ctx.fillStyle = "#e9dcff"; ctx.fillRect(r() * W, r() * horizon * 0.6, 1, 1); }
    ctx.globalAlpha = 1;

    // far layer (hazy, purple)
    layer(r, W, horizon + H * 0.1, { minH: 20 * scale, maxH: 110 * scale, minW: 16, maxW: 46, color: "#2b1242", center: 0.5, cluster: 1.2, windows: 0, win: 2 });
    // smog band
    const smog = ctx.createLinearGradient(0, horizon - H * 0.05, 0, horizon + H * 0.18);
    smog.addColorStop(0, "rgba(120,40,160,0)"); smog.addColorStop(0.6, "rgba(120,40,160,.35)"); smog.addColorStop(1, "rgba(60,20,90,.2)");
    ctx.fillStyle = smog; ctx.fillRect(0, horizon - H * 0.05, W, H * 0.25);

    // mid layer: downtown with landmark towers
    const midBase = horizon + H * 0.2;
    layer(r, W, midBase, { minH: 40 * scale, maxH: 170 * scale, minW: 18, maxW: 52, color: "#170a26", center: 0.52, cluster: 1.6, windows: 0.22, win: 2 });
    ctx.fillStyle = "#170a26";
    const cx = W * 0.52, u = scale;
    // stepped cylindrical tower with crown
    ctx.fillRect(cx - 22 * u, midBase - 330 * u, 44 * u, 330 * u);
    ctx.fillRect(cx - 17 * u, midBase - 348 * u, 34 * u, 20 * u);
    ctx.fillRect(cx - 11 * u, midBase - 362 * u, 22 * u, 16 * u);
    // sail tower with spire + aircraft light
    const sx = cx - 70 * u;
    ctx.beginPath(); ctx.moveTo(sx - 22 * u, midBase); ctx.lineTo(sx - 22 * u, midBase - 300 * u); ctx.lineTo(sx, midBase - 326 * u); ctx.lineTo(sx + 22 * u, midBase - 300 * u); ctx.lineTo(sx + 22 * u, midBase); ctx.fill();
    ctx.fillRect(sx - 1.2, midBase - 372 * u, 2.4, 50 * u);
    ctx.fillStyle = "#ff3b5c"; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(sx, midBase - 373 * u, 2.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, midBase - 364 * u, 1.8, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    // a box tower beside it
    ctx.fillStyle = "#170a26"; ctx.fillRect(cx + 34 * u, midBase - 280 * u, 40 * u, 280 * u);
    // landmark windows
    for (let j = 0; j < 40; j++) for (let i = 0; i < 6; i++) {
      if (r() > 0.18) continue;
      ctx.globalAlpha = 0.3 + r() * 0.5; ctx.fillStyle = r() < 0.6 ? "#ffc27a" : "#c88bff";
      ctx.fillRect(cx - 18 * u + i * 6.5 * u, midBase - 320 * u + j * 7.6 * u, 2, 3);
      if (r() < 0.5) ctx.fillRect(cx + 38 * u + i * 6 * u, midBase - 272 * u + j * 6.6 * u, 2, 3);
    }
    ctx.globalAlpha = 1;

    // near layer: low, dark, gritty
    const nearBase = H + 2;
    layer(r, W, nearBase, { minH: 30 * scale, maxH: 120 * scale, minW: 24, maxW: 80, color: "#09050f", center: 0.15, cluster: 0.4, windows: 0.12, win: 2.5 });
    // power lines
    ctx.strokeStyle = "rgba(10,6,16,.9)"; ctx.lineWidth = 1;
    const poleY = H - 150 * scale;
    for (const k of [0, 1]) { ctx.beginPath(); ctx.moveTo(0, poleY + k * 6); ctx.quadraticCurveTo(W * 0.5, poleY + 40 * scale + k * 6, W, poleY - 10 + k * 6); ctx.stroke(); }
    // palms in front
    const pc = "#07040b";
    palm(W * 0.06, H, 260 * scale, 10, pc);
    palm(W * 0.13, H, 200 * scale, -8, pc);
    palm(W * 0.88, H, 280 * scale, -12, pc);
    palm(W * 0.95, H, 210 * scale, 6, pc);
    if (!mobile) { palm(W * 0.3, H, 170 * scale, 6, pc); palm(W * 0.72, H, 190 * scale, -6, pc); }

    // grit: grain, dust specks, scratches
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.22; ctx.fillStyle = ctx.createPattern(grain, "repeat"); ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    for (let i = 0; i < 260; i++) { ctx.globalAlpha = r() * 0.25; ctx.fillStyle = r() < 0.5 ? "#000" : "#d8c6ff"; const s = r() * 1.6 + 0.4; ctx.fillRect(r() * W, r() * H, s, s); }
    for (let i = 0; i < 7; i++) { ctx.globalAlpha = 0.05 + r() * 0.06; ctx.fillStyle = "#e6d9ff"; ctx.fillRect(r() * W, 0, 1, H); }
    ctx.globalAlpha = 1;

    // vignette + darken top for legibility
    const vig = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.3, W / 2, H * 0.55, Math.max(W, H) * 0.85);
    vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,.65)");
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  }

  let t;
  let lastW = 0;
  function onResize() {
    // ignore mobile address-bar height jitter; redraw on width change
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    draw();
  }
  onResize();
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(onResize, 150); });
})();
