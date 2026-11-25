/* Animated gritty city skyline (LA-style, purple dusk) drawn on a fixed canvas.
   Static layers are rendered once to offscreen canvases; only moving pieces
   (smog, lights, traffic, plane, searchlights, palms, grain) redraw each frame.
   Pauses when the tab is hidden; shows a still frame for reduced-motion users. */
(function () {
  "use strict";
  const cv = document.getElementById("city");
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const off = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (c, a) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";

  const LAYER_COLORS = ["#3a1d4e", "#29143c", "#1a0c2a", "#10081c", "#07040b"].map(hex);
  const HAZE = hex("#7a3a9a");
  const WIN = { warm: "#ffcf8a", amber: "#ffb35c", cool: "#d6e2ff", violet: "#c99bff", pink: "#ff8ae0" };

  let W, H, dpr, S, sky, layers, fogs, grain, vignette, twinkles, beacons, cars, freewayY, palms, layerShift, plane;
  const parallax = [0.01, 0.02, 0.035, 0.05, 0.07];

  /* ---------------- builders ---------------- */
  function buildSky(r) {
    const c = off(W * dpr, H * dpr), g = c.getContext("2d");
    g.scale(dpr, dpr);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#040208"); grd.addColorStop(0.28, "#0b0614"); grd.addColorStop(0.5, "#1d0d30");
    grd.addColorStop(0.66, "#3a1650"); grd.addColorStop(0.8, "#5e1f62"); grd.addColorStop(1, "#2a0f2e");
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // light-pollution dome over downtown
    const dome = g.createRadialGradient(W * 0.52, H * 0.78, 10, W * 0.52, H * 0.78, Math.max(W, H) * 0.75);
    dome.addColorStop(0, "rgba(255,90,200,.30)"); dome.addColorStop(0.35, "rgba(160,60,220,.16)"); dome.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = dome; g.fillRect(0, 0, W, H);
    // hazy moon
    const mx = W * 0.8, my = H * 0.14, mr = 14 * S;
    const halo = g.createRadialGradient(mx, my, 0, mx, my, mr * 12);
    halo.addColorStop(0, "rgba(230,210,255,.16)"); halo.addColorStop(0.3, "rgba(230,210,255,.06)"); halo.addColorStop(1, "rgba(230,210,255,0)");
    g.fillStyle = halo; g.beginPath(); g.arc(mx, my, mr * 12, 0, 7); g.fill();
    const md = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    md.addColorStop(0, "rgba(245,236,255,.55)"); md.addColorStop(1, "rgba(200,180,230,.35)");
    g.fillStyle = md; g.beginPath(); g.arc(mx, my, mr * 0.8, 0, 7); g.fill();
    // a few stars through the smog
    for (let i = 0; i < 90; i++) { g.globalAlpha = r() * 0.4 * (1 - i / 90); g.fillStyle = "#efe6ff"; g.fillRect(r() * W, r() * H * 0.45, 1, 1); }
    g.globalAlpha = 1;
    return c;
  }

  function genBuildings(r, cfg) {
    const out = [];
    let x = -30;
    while (x < W + 30) {
      const w = (cfg.minW + r() * (cfg.maxW - cfg.minW)) * S;
      const d = Math.abs(x + w / 2 - W * cfg.center) / W;
      const boost = 1 + Math.max(0, 0.85 - d * 3) * cfg.cluster;
      const h = (cfg.minH + Math.pow(r(), 1.5) * (cfg.maxH - cfg.minH)) * S * boost;
      out.push({ x, w, h, crown: r(), setback: r(), lit: r() });
      x += w + (r() < 0.2 ? r() * 10 * S : 0);
    }
    return out;
  }

  function drawBuilding(g, b, base, col, li, r, cfg) {
    const top = base - b.h;
    const k = 0.88 + b.lit * 0.24;
    col = col.map((v) => Math.min(255, Math.round(v * k)));
    g.fillStyle = rgba(col, 1);
    // main body + optional setback tiers
    g.fillRect(b.x, top, b.w, b.h + 200);
    let roofY = top, roofX = b.x, roofW = b.w;
    if (b.h > 90 * S && b.setback < 0.45) {
      const tw = b.w * 0.7, th = b.h * 0.12;
      roofX = b.x + (b.w - tw) / 2; roofW = tw; roofY = top - th;
      g.fillRect(roofX, roofY, tw, th + 1);
      if (b.setback < 0.2) { const t2 = tw * 0.6, h2 = th * 0.7; g.fillRect(roofX + (tw - t2) / 2, roofY - h2, t2, h2 + 1); roofY -= h2; roofX += (tw - t2) / 2; roofW = t2; }
    }
    // crowns
    const c = b.crown, cx = roofX + roofW / 2;
    if (b.h > 120 * S && c < 0.18) { g.fillRect(cx - 0.8, roofY - b.h * 0.18, 1.6, b.h * 0.18); beacons.push({ li, x: cx, y: roofY - b.h * 0.18, ph: r() * 6 }); }
    else if (c < 0.3) { g.beginPath(); g.moveTo(roofX, roofY); g.lineTo(cx, roofY - roofW * 0.45); g.lineTo(roofX + roofW, roofY); g.fill(); }
    else if (c < 0.42) { g.fillRect(roofX + roofW * 0.15, roofY - 5 * S, roofW * 0.3, 5 * S); g.fillRect(roofX + roofW * 0.6, roofY - 3 * S, roofW * 0.2, 3 * S); }
    else if (c < 0.5 && li >= 3 && roofW > 22 * S) { // water tower
      const tw = Math.min(14 * S, roofW * 0.35), tx = roofX + roofW * 0.2;
      g.fillRect(tx, roofY - tw * 1.3, tw, tw * 0.85); g.beginPath(); g.moveTo(tx - 1, roofY - tw * 1.3); g.lineTo(tx + tw / 2, roofY - tw * 1.7); g.lineTo(tx + tw + 1, roofY - tw * 1.3); g.fill();
      g.fillRect(tx + 1, roofY - tw * 0.45, 1.4, tw * 0.45); g.fillRect(tx + tw - 2.4, roofY - tw * 0.45, 1.4, tw * 0.45);
    } else if (c < 0.6) { g.fillRect(cx - 0.6, roofY - 12 * S, 1.2, 12 * S); g.fillRect(cx + roofW * 0.2, roofY - 7 * S, 1, 7 * S); }

    if (li >= 3 && b.w > 30 * S) { g.fillStyle = "rgba(255,255,255,.025)"; for (let x = b.x + 6 * S; x < b.x + b.w - 2; x += 9 * S) g.fillRect(x, top, 1, b.h); }
    // haze at the base, sky light at the top
    const shade = g.createLinearGradient(0, top, 0, base);
    shade.addColorStop(0, rgba(HAZE, 0.05 + 0.1 * (4 - li) / 4)); shade.addColorStop(1, rgba(HAZE, 0.18 * (4 - li) / 4));
    g.fillStyle = shade; g.fillRect(b.x, top, b.w, base - top);
    // purple rim light on the side facing the city glow
    const facingRight = b.x + b.w / 2 < W * 0.52;
    g.fillStyle = rgba([210, 140, 255], 0.12 + 0.12 * li / 4);
    g.fillRect(facingRight ? b.x + b.w - 1 : b.x, top, 1, b.h);

    // windows
    if (!cfg.win) return;
    const ww = cfg.win * S, wh = ww * 1.35, gx = ww * 1.9, gy = wh * 1.9;
    const cols = Math.floor((b.w - ww) / gx), rows = Math.floor((b.h - wh * 2) / gy);
    if (cols < 1 || rows < 1) return;
    const ox = b.x + (b.w - (cols - 1) * gx - ww) / 2;
    const density = cfg.density * (b.lit < 0.25 ? 0.3 : b.lit > 0.85 ? 2.2 : 1);
    const office = b.lit > 0.55;
    for (let j = 0; j < rows; j++) {
      const floorLit = r() < 0.08; // whole floor lit, like an office after hours
      for (let i = 0; i < cols; i++) {
        const wx = ox + i * gx, wy = top + wh + j * gy;
        const on = floorLit ? r() < 0.85 : r() < density;
        if (on) {
          const pick = r();
          const color = office ? (pick < 0.7 ? WIN.cool : WIN.warm) : (pick < 0.55 ? WIN.warm : pick < 0.8 ? WIN.amber : pick < 0.93 ? WIN.violet : WIN.pink);
          const a = 0.35 + r() * 0.55;
          if (li >= 2 && r() < 0.05) { twinkles.push({ li, x: wx, y: wy, w: ww, h: wh, color, a, bg: col, on: r() < 0.6, next: 2 + r() * 14 }); continue; }
          g.globalAlpha = a; g.fillStyle = color; g.fillRect(wx, wy, ww, wh);
        } else if (li >= 3) {
          g.globalAlpha = 0.05; g.fillStyle = "#b9a6d8"; g.fillRect(wx, wy, ww, wh); // dark glass catching the sky
        }
      }
    }
    g.globalAlpha = 1;
  }

  function landmarks(g, base, col, li, r) {
    const u = S, cx = W * 0.53;
    g.fillStyle = rgba(col, 1);
    // stepped cylindrical tower with glowing crown
    g.fillRect(cx - 24 * u, base - 330 * u, 48 * u, 330 * u + 200);
    g.fillRect(cx - 18 * u, base - 350 * u, 36 * u, 22 * u);
    g.fillRect(cx - 12 * u, base - 366 * u, 24 * u, 18 * u);
    const crown = g.createLinearGradient(0, base - 366 * u, 0, base - 340 * u);
    crown.addColorStop(0, "rgba(255,120,220,.55)"); crown.addColorStop(1, "rgba(255,120,220,0)");
    g.fillStyle = crown; g.fillRect(cx - 12 * u, base - 366 * u, 24 * u, 26 * u);
    beacons.push({ li, x: cx, y: base - 368 * u, ph: 1 });
    // sail tower with spire
    const sx = cx - 78 * u;
    g.fillStyle = rgba(col, 1);
    g.beginPath(); g.moveTo(sx - 24 * u, base + 200); g.lineTo(sx - 24 * u, base - 300 * u); g.lineTo(sx, base - 330 * u); g.lineTo(sx + 24 * u, base - 300 * u); g.lineTo(sx + 24 * u, base + 200); g.fill();
    g.fillRect(sx - 1.2, base - 380 * u, 2.4, 54 * u);
    beacons.push({ li, x: sx, y: base - 381 * u, ph: 3 });
    // boxy neighbour
    g.fillRect(cx + 36 * u, base - 285 * u, 44 * u, 285 * u + 200);
    // windows on the landmarks
    for (let j = 0; j < 42; j++) for (let i = 0; i < 7; i++) {
      if (r() < 0.2) { g.globalAlpha = 0.3 + r() * 0.5; g.fillStyle = r() < 0.6 ? WIN.cool : WIN.warm; g.fillRect(cx - 20 * u + i * 6 * u, base - 322 * u + j * 7.4 * u, 2.2 * u, 3 * u); }
      if (r() < 0.15) { g.globalAlpha = 0.3 + r() * 0.5; g.fillStyle = WIN.warm; g.fillRect(sx - 18 * u + i * 5.4 * u, base - 290 * u + j * 6.8 * u, 2 * u, 3 * u); }
      if (r() < 0.18) { g.globalAlpha = 0.3 + r() * 0.5; g.fillStyle = r() < 0.5 ? WIN.cool : WIN.violet; g.fillRect(cx + 40 * u + i * 5.6 * u, base - 276 * u + j * 6.6 * u, 2 * u, 3 * u); }
    }
    g.globalAlpha = 1;
    // rim light
    g.fillStyle = "rgba(220,150,255,.25)"; g.fillRect(cx + 23 * u, base - 330 * u, 1, 330 * u); g.fillRect(sx + 23 * u, base - 300 * u, 1, 300 * u);
  }

  function buildLayers(r) {
    const mobile = W < 700;
    const horizon = H * (mobile ? 0.62 : 0.6);
    const cfgs = [
      { base: horizon + H * 0.02, minW: 14, maxW: 40, minH: 18, maxH: 90, cluster: 1.1, center: 0.5, win: 1.3, density: 0.1 },
      { base: horizon + H * 0.08, minW: 16, maxW: 46, minH: 24, maxH: 130, cluster: 1.4, center: 0.48, win: 1.6, density: 0.12 },
      { base: horizon + H * 0.16, minW: 20, maxW: 56, minH: 40, maxH: 190, cluster: 1.6, center: 0.53, win: 2, density: 0.13, landmarks: true },
      { base: horizon + H * 0.27, minW: 26, maxW: 70, minH: 30, maxH: 150, cluster: 0.6, center: 0.2, win: 2.4, density: 0.1 },
      { base: H * 0.995, minW: 34, maxW: 96, minH: 40, maxH: 130, cluster: 0.4, center: 0.85, win: 2.8, density: 0.08 },
    ];
    layers = cfgs.map((cfg, li) => {
      const c = off(W * dpr, (H + 120) * dpr), g = c.getContext("2d");
      g.scale(dpr, dpr);
      const col = LAYER_COLORS[li];
      if (cfg.landmarks) landmarks(g, cfg.base, col, li, r);
      genBuildings(r, cfg).forEach((b) => drawBuilding(g, b, cfg.base, col, li, r, cfg));
      return { c, base: cfg.base };
    });
    freewayY = H - 58 * Math.max(0.8, S);
  }

  function buildFog(r, h, color, alpha, n) {
    const c = off(W * 2 * dpr, h * dpr), g = c.getContext("2d");
    g.scale(dpr, dpr);
    for (let k = 0; k < n; k++) {
      const x = r() * W, y = h * (0.3 + r() * 0.5), rad = (60 + r() * 160) * S;
      for (const dx of [0, W]) { // drawn twice so it tiles seamlessly
        const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, rad);
        gr.addColorStop(0, rgba(color, alpha * (0.5 + r() * 0.5))); gr.addColorStop(1, rgba(color, 0));
        g.fillStyle = gr; g.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "destination-in";
    const fade = g.createLinearGradient(0, 0, 0, c.height);
    fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(0.35, "rgba(0,0,0,1)"); fade.addColorStop(0.75, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = fade; g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function buildGrain() {
    const c = off(220, 220), g = c.getContext("2d"), id = g.createImageData(220, 220), r = rng(9);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
    return c;
  }

  function buildVignette() {
    const c = off(W * dpr, H * dpr), g = c.getContext("2d");
    g.scale(dpr, dpr);
    const v = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.25, W / 2, H * 0.55, Math.max(W, H) * 0.85);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.7)");
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    // a few fixed scratches for a film-print feel
    const r = rng(77);
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.015 + r() * 0.02; g.fillStyle = "#e6d9ff"; g.fillRect(r() * W, 0, 1, H); }
    g.globalAlpha = 1;
    return c;
  }

  function buildTraffic(r) {
    cars = [];
    const n = Math.round(W / 70);
    for (let i = 0; i < n; i++) {
      const dir = r() < 0.5 ? 1 : -1;
      cars.push({ x: r() * (W + 200) - 100, dir, lane: dir > 0 ? 0 : 1, v: (40 + r() * 50) * S, len: (5 + r() * 4) * S });
    }
  }

  function buildPalms(r) {
    const s = Math.max(0.7, S);
    palms = [
      { x: W * 0.05, h: 250 * s, lean: 10 }, { x: W * 0.12, h: 195 * s, lean: -9 },
      { x: W * 0.9, h: 275 * s, lean: -12 }, { x: W * 0.965, h: 205 * s, lean: 7 },
    ];
    if (W >= 700) palms.push({ x: W * 0.32, h: 165 * s, lean: 6 }, { x: W * 0.7, h: 185 * s, lean: -6 });
    palms.forEach((p) => (p.ph = r() * 6));
  }

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = Math.max(window.innerHeight, 560);
    S = Math.min(1.35, Math.max(0.72, W / 1150));
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const r = rng(2026);
    twinkles = []; beacons = [];
    sky = buildSky(r);
    buildLayers(r);
    fogs = [
      { c: buildFog(r, H * 0.35, HAZE, 0.22, 18), y: layers[0].base - H * 0.22, v: 6, after: 0 },
      { c: buildFog(r, H * 0.3, [150, 60, 170], 0.18, 16), y: layers[1].base - H * 0.16, v: -9, after: 1 },
      { c: buildFog(r, H * 0.28, [120, 50, 150], 0.2, 14), y: layers[3].base - H * 0.14, v: 14, after: 3 },
    ];
    grain = grain || buildGrain();
    vignette = buildVignette();
    buildTraffic(r);
    buildPalms(r);
    plane = { t0: 4, period: 28 };
  }

  /* ---------------- frame ---------------- */
  function palm(p, t) {
    const sway = reduce ? 0 : Math.sin(t * 0.5 + p.ph) * 2.5;
    const base = H + 2, topX = p.x + p.lean + sway, topY = base - p.h;
    ctx.strokeStyle = "#050208"; ctx.fillStyle = "#050208"; ctx.lineCap = "round";
    // slightly tapered, gently curved trunk
    const tw = Math.max(2.5, p.h * 0.022);
    ctx.beginPath();
    ctx.moveTo(p.x - tw, base);
    ctx.quadraticCurveTo(p.x + p.lean * 0.25 - tw * 0.7, base - p.h * 0.5, topX - tw * 0.45, topY);
    ctx.lineTo(topX + tw * 0.45, topY);
    ctx.quadraticCurveTo(p.x + p.lean * 0.25 + tw * 0.7, base - p.h * 0.5, p.x + tw, base);
    ctx.fill();
    // crown: fronds rise then droop, each with leaflets hanging off it
    const L = p.h * 0.24, n = 11;
    for (let k = 0; k < n; k++) {
      const ang = -Math.PI + (k / (n - 1)) * Math.PI;          // spread from left to right
      const wob = reduce ? 0 : Math.sin(t * 0.9 + p.ph + k * 0.7) * 0.04;
      const dx = Math.cos(ang + wob), up = Math.abs(Math.sin(ang)); // centre fronds point more upward
      // side fronds arc out and droop at the tips; centre fronds point up
      const ex = topX + dx * L * (1 - up * 0.55), ey = topY + L * (0.42 * (1 - up) - 0.38 * up);
      const cx = topX + dx * L * 0.5, cy = topY - L * (0.22 + 0.3 * up);
      ctx.lineWidth = Math.max(1.2, p.h * 0.008);
      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      ctx.lineWidth = Math.max(0.8, p.h * 0.004);
      for (let i = 2; i <= 10; i++) {
        const u = i / 10, iu = 1 - u;
        const px = iu * iu * topX + 2 * iu * u * cx + u * u * ex;
        const py = iu * iu * topY + 2 * iu * u * cy + u * u * ey;
        const len = L * 0.15 * (1 - u * 0.55);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + dx * len * 0.6, py + len * 0.8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - dx * len * 0.15, py + len * 0.9); ctx.stroke();
      }
    }
  }

  function frame(ms) {
    const t = ms / 1000;
    const scroll = window.scrollY || 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(sky, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // searchlights sweeping behind the skyline
    {
      [[W * 0.3, 0], [W * 0.74, 2.1]].forEach(([x, ph]) => {
        const a = -Math.PI / 2 + Math.sin(t * 0.12 + ph) * 0.45, len = H * 0.9, spread = 0.045;
        const y = layers[1].base;
        const gr = ctx.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
        gr.addColorStop(0, "rgba(230,200,255,.10)"); gr.addColorStop(1, "rgba(230,200,255,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a - spread) * len, y + Math.sin(a - spread) * len);
        ctx.lineTo(x + Math.cos(a + spread) * len, y + Math.sin(a + spread) * len); ctx.fill();
      });
    }

    // plane crossing high up
    const pt = ((t - plane.t0) % plane.period + plane.period) % plane.period;
    if (pt < 22) {
      const px = W + 30 - (pt / 22) * (W + 60), py = H * 0.12 + pt * 1.2;
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(px, py, 1.5, 1.5);
      if (Math.sin(t * 7) > 0.6) { ctx.fillStyle = "rgba(255,70,90,.95)"; ctx.beginPath(); ctx.arc(px + 4, py + 0.5, 1.4, 0, 7); ctx.fill(); }
    }

    // building layers with drifting smog between them
    layers.forEach((L, li) => {
      layerShift = -Math.min(scroll * parallax[li], 60);
      ctx.drawImage(L.c, 0, layerShift, W, H + 120);
      // tower beacons
      beacons.forEach((b) => {
        if (b.li !== li) return;
        const on = reduce ? 0.6 : Math.max(0, Math.sin(t * 2.2 + b.ph));
        if (on > 0.05) {
          const g = ctx.createRadialGradient(b.x, b.y + layerShift, 0, b.x, b.y + layerShift, 7);
          g.addColorStop(0, "rgba(255,60,90," + 0.9 * on + ")"); g.addColorStop(1, "rgba(255,60,90,0)");
          ctx.fillStyle = g; ctx.fillRect(b.x - 7, b.y + layerShift - 7, 14, 14);
        }
      });
      // windows switching on and off
      twinkles.forEach((w) => {
        if (w.li !== li) return;
        if (!reduce && t > w.next) { w.on = !w.on; w.next = t + 3 + Math.random() * 16; }
        if (w.on) { ctx.globalAlpha = w.a; ctx.fillStyle = w.color; ctx.fillRect(w.x, w.y + layerShift, w.w, w.h); ctx.globalAlpha = 1; }
      });
      fogs.forEach((f) => {
        if (f.after !== li) return;
        const fw = W * 2;
        const x = reduce ? 0 : -(((t * f.v) % W) + W) % W;
        ctx.drawImage(f.c, x, f.y + layerShift, fw, f.c.height / dpr);
        if (x + fw < W) ctx.drawImage(f.c, x + fw, f.y + layerShift, fw, f.c.height / dpr);
      });
    });

    // freeway with moving headlights / taillights
    const fy = freewayY + layerShift;
    const street = ctx.createLinearGradient(0, fy, 0, H);
    street.addColorStop(0, "#070310"); street.addColorStop(1, "#030106");
    ctx.fillStyle = street; ctx.fillRect(0, fy, W, H - fy + 2);
    ctx.fillStyle = "#020104"; ctx.fillRect(0, fy, W, 10 * Math.max(0.8, S));
    for (let x = 30; x < W; x += 140 * Math.max(0.8, S)) ctx.fillRect(x, fy, 6 * S, H - fy);
    ctx.fillStyle = "rgba(200,140,255,.25)"; ctx.fillRect(0, fy - 1, W, 1);
    const dt = 1 / 30;
    cars.forEach((c) => {
      if (!reduce) { c.x += c.dir * c.v * dt; if (c.x > W + 80) c.x = -80; if (c.x < -80) c.x = W + 80; }
      const y = fy - 3 - c.lane * 3;
      const color = c.dir > 0 ? "255,236,200" : "255,50,70";
      const g = ctx.createLinearGradient(c.x - c.dir * c.len * 3, 0, c.x, 0);
      g.addColorStop(0, "rgba(" + color + ",0)"); g.addColorStop(1, "rgba(" + color + ",.85)");
      ctx.fillStyle = g; ctx.fillRect(Math.min(c.x, c.x - c.dir * c.len * 3), y, c.len * 3, 1.6);
    });

    // palms in front
    palms.forEach((p) => palm(p, t));

    // moving film grain + vignette
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = 0.2;
    ctx.save(); ctx.translate(reduce ? 0 : (Math.random() * 220) | 0, reduce ? 0 : (Math.random() * 220) | 0);
    ctx.fillStyle = ctx.createPattern(grain, "repeat"); ctx.fillRect(-220, -220, cv.width + 440, cv.height + 440);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    ctx.drawImage(vignette, 0, 0);
  }

  /* ---------------- loop ---------------- */
  let last = 0, raf = 0, lastW = 0;
  function loop(ms) {
    raf = requestAnimationFrame(loop);
    if (ms - last < 33) return; // ~30fps is plenty for ambient motion
    last = ms; frame(ms);
  }
  function start() { if (!raf && !reduce) raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function init() {
    if (window.innerWidth === lastW && layers) return;
    lastW = window.innerWidth;
    setup(); frame(performance.now());
  }
  init();
  start();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(init, 150); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if (reduce) window.addEventListener("scroll", () => frame(performance.now()), { passive: true });
})();
