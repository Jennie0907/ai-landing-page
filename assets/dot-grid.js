/**
 * DotGrid — vanilla port of react-bits DotGrid-JS-CSS
 * https://www.reactbits.dev/backgrounds/dot-grid
 */
(function initHeroDotGrid() {
  const root = document.getElementById('hero-dot-grid');
  if (!root) return;

  const wrap = root.querySelector('.dot-grid__wrap');
  const canvas = root.querySelector('.dot-grid__canvas');
  if (!wrap || !canvas || !canvas.getContext) return;

  const num = (key, fallback) => {
    const v = parseFloat(root.dataset[key]);
    return Number.isFinite(v) ? v : fallback;
  };

  const config = {
    dotSize: num('dotSize', 5),
    gap: num('gap', 15),
    baseColor: root.dataset.baseColor || '#f1f4fa',
    activeColor: root.dataset.activeColor || '#3B82F6',
    proximity: num('proximity', 150),
    speedTrigger: num('speedTrigger', 100),
    shockRadius: num('shockRadius', 280),
    shockStrength: num('shockStrength', 5),
    maxSpeed: num('maxSpeed', 5000),
    resistance: num('resistance', 750),
    returnDuration: num('returnDuration', 1.5),
  };

  let baseRgb = hexToRgb(config.baseColor);
  let activeRgb = hexToRgb(config.activeColor);

  function resolveThemeColors() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const baseColor = dark
      ? root.dataset.baseColorDark || root.dataset.baseColor || '#3c4047'
      : root.dataset.baseColor || '#f1f4fa';
    const activeColor = dark
      ? root.dataset.activeColorDark || root.dataset.activeColor || '#1463ff'
      : root.dataset.activeColor || '#3B82F6';
    return { baseColor, activeColor };
  }

  function syncThemeColors() {
    const { baseColor, activeColor } = resolveThemeColors();
    config.baseColor = baseColor;
    config.activeColor = activeColor;
    baseRgb = hexToRgb(baseColor);
    activeRgb = hexToRgb(activeColor);
  }
  const proxSq = config.proximity * config.proximity;

  let dots = [];
  let circlePath = null;
  let ctx = null;
  let logicalW = 0;
  let logicalH = 0;
  let rafId = null;

  const pointer = {
    x: -9999,
    y: -9999,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  };

  function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(m[1], 16),
      g: parseInt(m[2], 16),
      b: parseInt(m[3], 16),
    };
  }

  function throttle(fn, limit) {
    let last = 0;
    return function throttled(...args) {
      const now = performance.now();
      if (now - last >= limit) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  function buildGrid() {
    const { width, height } = wrap.getBoundingClientRect();
    logicalW = width;
    logicalH = height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (typeof Path2D !== 'undefined') {
      circlePath = new Path2D();
      circlePath.arc(0, 0, config.dotSize / 2, 0, Math.PI * 2);
    } else {
      circlePath = null;
    }

    const { dotSize, gap } = config;
    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;
    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({
          cx: startX + x * cell,
          cy: startY + y * cell,
          xOffset: 0,
          yOffset: 0,
          xVel: 0,
          yVel: 0,
          _inertiaApplied: false,
        });
      }
    }
  }

  function impulse(dot, pushX, pushY) {
    if (dot._inertiaApplied) return;
    dot._inertiaApplied = true;
    dot.xVel += pushX;
    dot.yVel += pushY;
  }

  function springStep(dt) {
    const damp = Math.exp((-config.resistance / 1000) * dt);
    const spring = (12 / config.returnDuration) * dt;

    for (const dot of dots) {
      dot.xVel *= damp;
      dot.yVel *= damp;
      dot.xVel -= dot.xOffset * spring;
      dot.yVel -= dot.yOffset * spring;
      dot.xOffset += dot.xVel * dt * 0.06;
      dot.yOffset += dot.yVel * dt * 0.06;

      if (
        dot._inertiaApplied &&
        Math.hypot(dot.xOffset, dot.yOffset) < 0.4 &&
        Math.hypot(dot.xVel, dot.yVel) < 0.4
      ) {
        dot.xOffset = 0;
        dot.yOffset = 0;
        dot.xVel = 0;
        dot.yVel = 0;
        dot._inertiaApplied = false;
      }
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, logicalW, logicalH);

    const { x: px, y: py } = pointer;
    const r = config.dotSize / 2;

    for (const dot of dots) {
      const ox = dot.cx + dot.xOffset;
      const oy = dot.cy + dot.yOffset;
      const dx = dot.cx - px;
      const dy = dot.cy - py;
      const dsq = dx * dx + dy * dy;

      let fill = config.baseColor;
      if (dsq <= proxSq) {
        const dist = Math.sqrt(dsq);
        const t = 1 - dist / config.proximity;
        const rr = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
        const gg = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
        const bb = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
        fill = `rgb(${rr},${gg},${bb})`;
      }

      if (circlePath) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = fill;
        ctx.fill(circlePath);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }
    }
  }

  let lastFrame = performance.now();
  function loop(now) {
    const dt = Math.min(32, now - lastFrame);
    lastFrame = now;
    springStep(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const now = performance.now();
    const dt = pointer.lastTime ? now - pointer.lastTime : 16;
    const dx = clientX - pointer.lastX;
    const dy = clientY - pointer.lastY;
    let vx = (dx / dt) * 1000;
    let vy = (dy / dt) * 1000;
    let speed = Math.hypot(vx, vy);
    if (speed > config.maxSpeed) {
      const scale = config.maxSpeed / speed;
      vx *= scale;
      vy *= scale;
      speed = config.maxSpeed;
    }
    pointer.lastTime = now;
    pointer.lastX = clientX;
    pointer.lastY = clientY;
    pointer.vx = vx;
    pointer.vy = vy;
    pointer.speed = speed;
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
  }

  function onMove(e) {
    updatePointer(e.clientX, e.clientY);

    const { speed, x: px, y: py, vx, vy } = pointer;
    if (speed <= config.speedTrigger) return;

    for (const dot of dots) {
      const dist = Math.hypot(dot.cx - px, dot.cy - py);
      if (dist < config.proximity && !dot._inertiaApplied) {
        const pushX = dot.cx - px + vx * 0.005;
        const pushY = dot.cy - py + vy * 0.005;
        impulse(dot, pushX, pushY);
      }
    }
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    for (const dot of dots) {
      const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
      if (dist < config.shockRadius && !dot._inertiaApplied) {
        const falloff = Math.max(0, 1 - dist / config.shockRadius);
        const pushX = (dot.cx - cx) * config.shockStrength * falloff;
        const pushY = (dot.cy - cy) * config.shockStrength * falloff;
        impulse(dot, pushX, pushY);
      }
    }
  }

  syncThemeColors();
  buildGrid();
  rafId = requestAnimationFrame(loop);

  window.addEventListener('themechange', () => {
    syncThemeColors();
    buildGrid();
  });

  const throttledMove = throttle(onMove, 50);
  window.addEventListener('mousemove', throttledMove, { passive: true });
  window.addEventListener('click', onClick);

  let ro;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(buildGrid);
    ro.observe(wrap);
  } else {
    window.addEventListener('resize', buildGrid);
  }

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', throttledMove);
    window.removeEventListener('click', onClick);
    if (ro) ro.disconnect();
    else window.removeEventListener('resize', buildGrid);
  });
})();
