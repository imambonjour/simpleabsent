(function () {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const COLORS = ['#5FA762','#4A90C8','#E8953C','#D14949','#FFEB3B','#B44FD8','#F06292','#26C6DA'];
  const SHAPES = ['rect', 'circle', 'strip'];
  let particles = [];
  let raf = null;
  let loopRunning = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function Particle(x, y) {
    this.x = x;
    this.y = y;
    const angle = (Math.random() * 140 - 70) * Math.PI / 180;
    const speed = Math.random() * 22 + 10;
    this.vx = Math.sin(angle) * speed;
    this.vy = -Math.cos(angle) * speed;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    this.w = this.shape === 'strip' ? Math.random() * 4 + 2 : Math.random() * 10 + 5;
    this.h = this.shape === 'strip' ? Math.random() * 14 + 8 : this.w;
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.18;
    this.mass = Math.random() * 0.6 + 0.4;
    this.drag = Math.random() * 0.012 + 0.010;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.08 + 0.03;
    this.alpha = 1;
  }

  function update(p) {
    p.vx += Math.sin(p.wobble) * 0.3;
    p.vy += 0.45 * p.mass;
    p.vx *= (1 - p.drag);
    p.vy *= (1 - p.drag * 0.6);
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.rotSpeed * (1 + Math.abs(p.vy) * 0.04);
    p.wobble += p.wobbleSpeed;
    if (p.y > canvas.height - 60) {
      p.alpha = Math.max(0, 1 - (p.y - (canvas.height - 60)) / 60);
    }
  }

  function draw(p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, Math.abs(Math.cos(p.wobble)) * 0.7 + 0.3);
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0.01 && p.y < canvas.height + 80);
    particles.forEach(p => { update(p); draw(p); });
    if (particles.length > 0) {
      raf = requestAnimationFrame(loop);
    } else {
      loopRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.remove();
    }
  }

  // Spawn partikel pertama langsung tanpa delay,
  // sisanya menyusul dengan delay kecil agar terlihat burst natural
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.9;

  // Batch pertama: langsung masuk semua sebelum frame pertama
  for (let i = 0; i < 60; i++) {
    particles.push(new Particle(cx + (Math.random() - 0.5) * 30, cy));
  }

  // Mulai loop segera setelah ada partikel
  loopRunning = true;
  raf = requestAnimationFrame(loop);

  // Sisa partikel menyusul dalam 300ms untuk efek burst bertahap
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      particles.push(new Particle(cx + (Math.random() - 0.5) * 30, cy));
    }, Math.random() * 300);
  }
})();