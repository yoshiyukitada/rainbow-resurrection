
// RAINBOW RESURRECTION
// Collision + Black Hole + Angel Revival

const canvas = document.getElementById('art');
const ctx = canvas.getContext('2d');

const files = [
  ['word01.png', 'word01'],
  ['word02.png', 'word02'],
  ['wani.png', 'wani'],
  ['nj03.png', 'nj03'],
  ['herin.png', 'herin'],
  ['catt.png', 'catt'],
  ['cat.png', 'cat']
];

const images = {};
files.forEach(([file, key]) => {
  const img = new Image();
  img.src = file;
  img.onload = () => images[key] = img;
  img.onerror = () => console.warn('Image missing:', file);
});

let W, H, dpr;
let pointerDown = false;
let pointer = { x: 0, y: 0, px: 0, py: 0 };
let alive = true;
let time = 0;
let items = [];
let particles = [];
let beams = [];
let lastAttack = 0;
let hole = { x: 0, y: 0, r: 48 };

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  hole.x = W * 0.5;
  hole.y = H * 0.53;
  if (!items.length) makeItems();
}
window.addEventListener('resize', resize);

function makeItems() {
  const keys = ['word01', 'word02', 'wani', 'nj03', 'herin', 'catt', 'cat'];
  items = keys.map(key => {
    const size = key === 'herin' ? 165 : key === 'cat' ? 180 : 150;
    return {
      key,
      x: W * (0.12 + Math.random() * 0.76),
      y: H * (0.16 + Math.random() * 0.68),
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.4,
      angle: Math.random() * 6.28,
      spin: (Math.random() - 0.5) * 0.035,
      size,
      radius: size * 0.32,
      pulse: Math.random() * 6.28,
      alive: true
    };
  });
}

resize();

function pointerPosition(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  const p = pointerPosition(e);
  pointer = { ...p, px: p.x, py: p.y };
  pointerDown = true;

  if (!alive) {
    checkAngel(p.x, p.y);
    return;
  }
  startMusic();
});

canvas.addEventListener('pointermove', e => {
  if (!pointerDown) return;
  const p = pointerPosition(e);
  pointer.px = pointer.x;
  pointer.py = pointer.y;
  pointer.x = p.x;
  pointer.y = p.y;

  if (!alive) checkAngel(p.x, p.y);
});

function releasePointer() {
  if (!pointerDown) return;
  pointerDown = false;
  pauseMusic();
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);
window.addEventListener('blur', releasePointer);

function burst(x, y, color, count = 25) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * 6.28;
    const speed = 1 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 40 + Math.random() * 30,
      color
    });
  }
}

function checkAngel(x, y) {
  const angel = items.find(o => o.key === 'herin');
  if (!angel) return;

  if (Math.hypot(x - angel.x, y - angel.y) < angel.radius + 35) {
    alive = true;
    items.forEach(o => {
      o.alive = true;
      o.x = Math.max(40, Math.min(W - 40, o.x));
      o.y = Math.max(50, Math.min(H - 50, o.y));
    });
    burst(angel.x, angel.y, '#fff0ff', 55);
    document.getElementById('status').textContent = 'REVIVED!';
  }
}

function collide(a, b) {
  if (!a.alive || !b.alive) return;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 0.01;
  const min = a.radius + b.radius;

  if (dist >= min) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = min - dist;

  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  const impulse = 1.2;
  a.vx -= nx * impulse;
  a.vy -= ny * impulse;
  b.vx += nx * impulse;
  b.vy += ny * impulse;
}

function rainbowBeam(cat, target) {
  const dx = target.x - cat.x;
  const dy = target.y - cat.y;
  const len = Math.hypot(dx, dy) || 1;

  beams.push({
    x: cat.x,
    y: cat.y,
    ux: dx / len,
    uy: dy / len,
    len: Math.min(len, Math.max(W, H)),
    life: 25
  });

  if (len < Math.max(W, H) * 0.8) {
    alive = false;
    pauseMusic();
    burst(target.x, target.y, '#ff6bd6', 50);
    document.getElementById('status').textContent =
      'RAINBOW HIT — TOUCH HERIN TO REVIVE';
  }
}

function drawItem(o) {
  const img = images[o.key];
  const pulse = 1 + Math.sin(time * 0.05 + o.pulse) * 0.10;
  const size = o.size * pulse;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle);

  if (!o.alive) ctx.globalAlpha = 0.10;

  if (img && img.complete && img.naturalWidth) {
    const ratio = Math.min(size / img.width, size / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

function drawHole() {
  const r = hole.r * (1 + Math.sin(time * 0.06) * 0.08);
  const glow = ctx.createRadialGradient(
    hole.x, hole.y, 2, hole.x, hole.y, r * 2
  );
  glow.addColorStop(0, '#000000');
  glow.addColorStop(0.55, '#10051f');
  glow.addColorStop(0.8, 'rgba(140,90,220,.5)');
  glow.addColorStop(1, 'rgba(140,90,220,0)');

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, r * 2, 0, 6.28);
  ctx.fill();

  ctx.strokeStyle = 'rgba(210,170,255,.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hole.x, hole.y, r, 0, 6.28);
  ctx.stroke();
}

function update() {
  time++;
  ctx.clearRect(0, 0, W, H);

  // Star background
  for (let i = 0; i < 45; i++) {
    const x = (i * 173.7) % W;
    const y = (i * 97.3) % H;
    ctx.fillStyle = 'rgba(210,205,255,.16)';
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  drawHole();

  const active = pointerDown && alive;

  if (alive) {
    items.forEach(o => {
      if (!o.alive || o.key === 'herin') return;

      // Finger creates a spinning force
      if (active) {
        const dx = pointer.x - o.x;
        const dy = pointer.y - o.y;
        const dist = Math.hypot(dx, dy) + 1;
        const force = Math.min(4, 1300 / (dist * dist));

        o.vx += (-dy / dist) * force * 0.13;
        o.vy += (dx / dist) * force * 0.13;
        o.vx += (pointer.x - pointer.px) * 0.002;
        o.vy += (pointer.y - pointer.py) * 0.002;
      }

      // Black hole attraction
      const hx = hole.x - o.x;
      const hy = hole.y - o.y;
      const hd = Math.hypot(hx, hy) + 1;

      if (hd < 230) {
        const pull = (1 - hd / 230) * 0.38;
        o.vx += hx / hd * pull;
        o.vy += hy / hd * pull;
      }

      o.x += o.vx;
      o.y += o.vy;
      o.vx *= 0.993;
      o.vy *= 0.993;
      o.angle += o.spin + (active ? 0.025 : 0);

      if (o.x < o.radius || o.x > W - o.radius) o.vx *= -0.9;
      if (o.y < o.radius || o.y > H - o.radius) o.vy *= -0.9;

      o.x = Math.max(o.radius, Math.min(W - o.radius, o.x));
      o.y = Math.max(o.radius, Math.min(H - o.radius, o.y));

      // Fall into black hole
      if (hd < hole.r * 0.75) {
        o.alive = false;
        burst(o.x, o.y, '#b89cff', 30);
        document.getElementById('status').textContent =
          'LOST IN THE BLACK HOLE — FIND HERIN';
      }
    });

    // Collisions between characters
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        collide(items[i], items[j]);
      }
    }
  }

  // Angel floats gently
  const angel = items.find(o => o.key === 'herin');
  if (angel) {
    angel.y += Math.sin(time * 0.025) * 0.4;
    angel.angle += 0.003;
  }

  // Cat fires rainbow at the finger
  const cat = items.find(o => o.key === 'cat');
  if (active && cat && cat.alive && time - lastAttack > 190) {
    lastAttack = time;
    rainbowBeam(cat, pointer);
  }

  items.forEach(o => {
    if (o.alive || o.key === 'herin') drawItem(o);
  });

  // Rainbow beams
  beams = beams.filter(b => b.life-- > 0);
  beams.forEach(b => {
    const colors = [
      '#ff3b6b', '#ffb13b', '#fff35b',
      '#49f58b', '#4edbff', '#8174ff', '#ff6be8'
    ];

    ctx.save();
    ctx.lineCap = 'round';

    colors.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.globalAlpha = b.life / 25;
      ctx.lineWidth = 13 - i * 1.4;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + (i - 3) * 2);
      ctx.lineTo(
        b.x + b.ux * b.len,
        b.y + b.uy * b.len + (i - 3) * 2
      );
      ctx.stroke();
    });
    ctx.restore();
  });

  // Particles
  particles = particles.filter(p => p.life-- > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy *= 0.97;
    ctx.globalAlpha = Math.max(0, p.life / 70);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.8, 0, 6.28);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (!alive) {
    ctx.fillStyle = 'rgba(10,4,22,.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd8f4';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(
      'TOUCH HERIN THE ANGEL TO REVIVE',
      W / 2, H * 0.52
    );
  }

  requestAnimationFrame(update);
}

update();
