// RAINBOW RESURRECTION
// 画像ファイル7点を index.html / game.js と同じ場所に置いてください。

const canvas = document.getElementById('art');
const ctx = canvas.getContext('2d');

const files = [
  ['word01.png', 'word01'], ['word02.png', 'word02'],
  ['wani.png', 'wani'], ['nj03.png', 'nj03'],
  ['herin.png', 'herin'], ['catt.png', 'catt'],
  ['cat.png', 'cat']
];
const images = {};
files.forEach(([file, key]) => {
  const img = new Image();
  img.src = file;
  img.onload = () => images[key] = img;
  img.onerror = () => console.warn('画像を読み込めません:', file);
});

let W = 0, H = 0, dpr = 1;
let pointerDown = false, pointer = {x: 0, y: 0, px: 0, py: 0};
let alive = true, deathFlash = 0, lastMove = 0, time = 0;
let items = [];
let particles = [];
let beams = [];
let lastAttack = 0;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!items.length) makeItems();
}
window.addEventListener('resize', resize);

function makeItems() {
  const keys = ['word01','word02','wani','nj03','herin','catt','cat'];
  items = keys.map((key, i) => ({
    key, x: W*(.16 + Math.random()*.68), y: H*(.18 + Math.random()*.62),
    vx: (Math.random()-.5)*.45, vy: (Math.random()-.5)*.45,
    angle: Math.random()*Math.PI*2, spin: (Math.random()-.5)*.018,
    scale: .55 + Math.random()*.45, pulse: Math.random()*6.28,
    size: key === 'herin' ? 100 : key === 'cat' ? 118 : 90,
    alive: true
  }));
}
resize();

function pointerPosition(e) {
  const r = canvas.getBoundingClientRect();
  return {x: e.clientX-r.left, y: e.clientY-r.top};
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  const p = pointerPosition(e);
  pointer = {...p, px:p.x, py:p.y};
  pointerDown = true;
  lastMove = performance.now();
  if (alive) startMusic();
  else checkAngel(p.x, p.y);
});
canvas.addEventListener('pointermove', e => {
  if (!pointerDown) return;
  const p = pointerPosition(e);
  pointer.px = pointer.x; pointer.py = pointer.y;
  pointer.x = p.x; pointer.y = p.y;
  lastMove = performance.now();
  if (!alive) checkAngel(p.x, p.y);
});
function releasePointer() {
  pointerDown = false;
  pauseMusic();
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('lostpointercapture', releasePointer);
window.addEventListener('blur', releasePointer);

function checkAngel(x,y) {
  const angel = items.find(o => o.key === 'herin');
  if (!angel) return;
  if (Math.hypot(x-angel.x, y-angel.y) < 85) {
    alive = true; deathFlash = 1;
    items.forEach(o => o.alive = true);
    burst(angel.x, angel.y, '#fff0ff', 38);
    document.getElementById('status').textContent = 'REVIVED';
  }
}

function burst(x,y,color,n) {
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, s=1+Math.random()*5;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:35+Math.random()*35,color});
  }
}

function rainbowBeam(cat, target) {
  const dx = target.x-cat.x, dy = target.y-cat.y;
  const len = Math.hypot(dx,dy) || 1;
  const ux=dx/len, uy=dy/len;
  beams.push({x:cat.x,y:cat.y,ux,uy,len:Math.min(len,Math.max(W,H)*.8),life:28});
  // レインボーの光線が指先に届いたらプレイヤーは倒れる
  if (len < Math.max(W,H)*.8) {
    alive = false; deathFlash = 1;
    burst(target.x,target.y,'#ff6bd6',45);
    document.getElementById('status').textContent = 'RAINBOW HIT — TOUCH HERIN';
    pauseMusic();
  }
}

function drawImageItem(o) {
  const img = images[o.key];
  const pulse = 1 + Math.sin(time*.045 + o.pulse)*.13;
  const s = o.size * o.scale * pulse;
  ctx.save();
  ctx.translate(o.x,o.y);
  ctx.rotate(o.angle);
  if (!o.alive) ctx.globalAlpha = .12;
  if (img && img.complete && img.naturalWidth) {
    const ratio = Math.min(s/img.width, s/img.height);
    const w=img.width*ratio, h=img.height*ratio;
    ctx.drawImage(img,-w/2,-h/2,w,h);
  } else {
    ctx.strokeStyle = '#b8a9ff'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,s*.35,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='10px Arial'; ctx.textAlign='center';
    ctx.fillText(o.key,0,4);
  }
  ctx.restore();
}

function update() {
  time++;
  ctx.clearRect(0,0,W,H);
  // 深い紺色の背景に微細な星
  for(let i=0;i<45;i++){
    const x=(i*173.7)%W, y=(i*97.3)%H;
    ctx.fillStyle=`rgba(210,205,255,${.12+.1*Math.sin(time*.02+i)})`;
    ctx.fillRect(x,y,1.3,1.3);
  }

  const active = pointerDown && alive;
  items.forEach(o => {
    if (active) {
      const dx=pointer.x-o.x, dy=pointer.y-o.y;
      const dist=Math.hypot(dx,dy)+1;
      const force=Math.min(2.8, 850/(dist*dist));
      o.vx += (-dy/dist)*force*.055 + (Math.random()-.5)*.08;
      o.vy += ( dx/dist)*force*.055 + (Math.random()-.5)*.08;
      o.angle += o.spin*3.5;
    }
    if (alive || o.key === 'herin') {
      o.x += o.vx; o.y += o.vy;
      o.vx *= active ? .985 : .94;
      o.vy *= active ? .985 : .94;
      if (o.x < 25 || o.x > W-25) o.vx *= -1;
      if (o.y < 35 || o.y > H-25) o.vy *= -1;
      o.x=Math.max(20,Math.min(W-20,o.x));
      o.y=Math.max(30,Math.min(H-20,o.y));
      o.angle += active ? o.spin*2 : o.spin*.18;
    }
    drawImageItem(o);
  });

  // catの虹攻撃：生存中、一定間隔で指の位置へ放つ
  const cat = items.find(o=>o.key==='cat');
  if (active && cat && time-lastAttack>170) {
    lastAttack=time;
    rainbowBeam(cat,{x:pointer.x,y:pointer.y});
  }

  beams = beams.filter(b=>b.life-->0);
  beams.forEach(b=>{
    const x2=b.x+b.ux*b.len, y2=b.y+b.uy*b.len;
    const colors=['#ff3b6b','#ffb13b','#fff35b','#49f58b','#4edbff','#8174ff','#ff6be8'];
    ctx.save(); ctx.lineCap='round';
    colors.forEach((c,i)=>{
      ctx.strokeStyle=c; ctx.globalAlpha=Math.max(0,b.life/28)*.8;
      ctx.lineWidth=12-i*1.1;
      ctx.beginPath(); ctx.moveTo(b.x,b.y+(i-3)*2); ctx.lineTo(x2,y2+(i-3)*2); ctx.stroke();
    });
    ctx.restore();
  });

  particles=particles.filter(p=>p.life-->0);
  particles.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vx*=.97; p.vy*=.97;
    ctx.globalAlpha=Math.max(0,p.life/70);
    ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,2.5,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
  });

  if (pointerDown) {
    ctx.save(); ctx.strokeStyle=alive?'rgba(255,255,255,.75)':'rgba(255,100,180,.8)';
    ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(pointer.x,pointer.y,13+Math.sin(time*.2)*3,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pointer.x-20,pointer.y); ctx.lineTo(pointer.x+20,pointer.y);
    ctx.moveTo(pointer.x,pointer.y-20); ctx.lineTo(pointer.x,pointer.y+20); ctx.stroke();
    ctx.restore();
  }
  if (!alive) {
    ctx.fillStyle='rgba(10,4,22,.28)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffd8f4'; ctx.textAlign='center';
    ctx.font='bold 13px Arial'; ctx.fillText('TOUCH THE ANGEL TO RETURN',W/2,H*.52);
  }
  requestAnimationFrame(update);
}
update();
