/* ============================================================
   SATELLITE ACADEMY — interactions
   ============================================================ */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- page enter / leave transition ---------- */
  requestAnimationFrame(() => document.body.classList.add('page-ready'));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') ||
        a.target === '_blank' || href.endsWith('.pdf')) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = href; }, 330);
  });
  addEventListener('pageshow', () => document.body.classList.remove('is-leaving'));

  /* ---------- starfield canvas ---------- */
  const canvas = $('#starfield');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, stars = [], shooters = [], dpr = Math.min(devicePixelRatio || 1, 2);
    const COLORS = ['#ffffff', '#c7d2fe', '#a5f3fc', '#fbcfe8', '#fef3c7'];

    function resize() {
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      const count = Math.min(240, Math.floor(innerWidth / 7));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.5 + .3) * dpr,
        a: Math.random(), t: Math.random() * .02 + .004,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        vx: (Math.random() - .5) * .05 * dpr,
        vy: (Math.random() * .12 + .02) * dpr
      }));
    }

    function spawnShooter() {
      const fromLeft = Math.random() > .5;
      shooters.push({
        x: fromLeft ? -60 : w + 60,
        y: Math.random() * h * .55,
        vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 4) * dpr,
        vy: (2.4 + Math.random() * 1.6) * dpr,
        life: 1, len: (90 + Math.random() * 90) * dpr
      });
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.a += s.t; if (s.a > 1 || s.a < 0) s.t *= -1;
        s.x += s.vx; s.y += s.vy;
        if (s.y > h) s.y = 0; if (s.x > w) s.x = 0; if (s.x < 0) s.x = w;
        ctx.globalAlpha = Math.max(.12, Math.abs(s.a));
        ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
        if (s.r > 1.4 * dpr) {
          ctx.globalAlpha = Math.abs(s.a) * .28;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.4, 0, 7); ctx.fill();
        }
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        const g = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx / 6 * sh.len / 40, sh.y - sh.vy / 6 * sh.len / 40);
        g.addColorStop(0, `rgba(255,255,255,${sh.life})`);
        g.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g; ctx.lineWidth = 2.2 * dpr; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 9, sh.y - sh.vy * 9);
        ctx.stroke();
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= .012;
        if (sh.life <= 0 || sh.x < -200 || sh.x > w + 200 || sh.y > h + 200) shooters.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    resize();
    if (!reduce) { tick(); setInterval(() => { if (Math.random() > .45 && shooters.length < 3) spawnShooter(); }, 2600); }
    else { tick(); }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 180); });
  }

  /* ---------- scroll progress ---------- */
  const bar = $('.progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    const nav = $('#nav');
    if (nav) nav.classList.toggle('scrolled', scrollY > 30);
    if (!reduce) {
      $$('[data-parallax]').forEach(el => {
        const sp = parseFloat(el.dataset.parallax) || .12;
        el.style.transform = `translate3d(0,${scrollY * sp}px,0)`;
      });
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- nav ---------- */
  const toggle = $('.nav-toggle'), links = $('.nav-links');
  if (toggle) toggle.addEventListener('click', () => links.classList.toggle('open'));
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => links && links.classList.remove('open')));

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal,.reveal-l,.reveal-r,.reveal-scale').forEach(el => io.observe(el));

  /* ---------- count-up ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, target = parseFloat(el.dataset.count), dur = 1500, t0 = performance.now();
      const suffix = el.dataset.suffix || '';
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- 3D tilt ---------- */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    $$('[data-tilt]').forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateY(${(px - .5) * 10}deg) rotateX(${(.5 - py) * 10}deg) translateY(-6px)`;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- cursor glow ---------- */
  const glow = $('.cursor-glow');
  if (glow && matchMedia('(pointer:fine)').matches && !reduce) {
    let gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy;
    addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; });
    (function loop() { cx += (gx - cx) * .12; cy += (gy - cy) * .12;
      glow.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  }

  /* ---------- typewriter ---------- */
  const typeEl = $('[data-type]');
  if (typeEl) {
    const phrases = JSON.parse(typeEl.dataset.type);
    let pi = 0, ci = 0, deleting = false;
    (function run() {
      const cur = phrases[pi];
      typeEl.textContent = cur.slice(0, ci);
      if (!deleting) {
        if (ci++ < cur.length) return setTimeout(run, 55);
        deleting = true; return setTimeout(run, 1700);
      }
      if (ci-- > 0) return setTimeout(run, 28);
      deleting = false; pi = (pi + 1) % phrases.length; setTimeout(run, 300);
    })();
  }

  /* ---------- random fact machine ---------- */
  const factBox = $('#factBox'), factBtn = $('#factBtn');
  if (factBox && factBtn) {
    const facts = JSON.parse(factBtn.dataset.facts);
    let last = -1;
    factBtn.addEventListener('click', () => {
      let i; do { i = Math.floor(Math.random() * facts.length); } while (i === last && facts.length > 1);
      last = i;
      factBox.classList.remove('pop'); void factBox.offsetWidth;
      factBox.textContent = facts[i];
      factBox.classList.add('pop');
    });
  }

  /* ---------- quiz ---------- */
  const quiz = $('#quiz');
  if (quiz) {
    const blocks = $$('.q-block', quiz);
    let answered = 0, score = 0;
    blocks.forEach(block => {
      $$('.q-opt', block).forEach(opt => {
        opt.addEventListener('click', () => {
          if (block.dataset.done) return;
          block.dataset.done = '1'; answered++;
          const correct = opt.dataset.correct === '1';
          if (correct) score++;
          opt.classList.add(correct ? 'correct' : 'wrong');
          if (!correct) $$('.q-opt', block).find(o => o.dataset.correct === '1').classList.add('correct');
          if (answered === blocks.length) {
            const r = $('#quizResult');
            const pct = Math.round(score / blocks.length * 100);
            r.innerHTML = `🚀 You scored <b>${score} / ${blocks.length}</b> (${pct}%) — ${
              pct === 100 ? 'Mission Commander! Flawless flight.' :
              pct >= 66 ? 'Flight Engineer! Great navigating.' :
              'Cadet! Re-read the mission notes and try again.'}`;
            r.classList.add('show');
            r.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });
    });
  }

  /* ---------- hotspots (tap on touch) ---------- */
  $$('.hotspot').forEach(h => h.addEventListener('click', (e) => {
    e.stopPropagation();
    $$('.hotspot').forEach(o => { if (o !== h) o.classList.remove('open'); });
    h.classList.toggle('open');
  }));
  document.addEventListener('click', () => $$('.hotspot.open').forEach(h => h.classList.remove('open')));

  /* ---------- flip cards on tap ---------- */
  $$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('flipped')));

  /* ---------- contact form (demo) ---------- */
  const form = $('#contactForm');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = $('#formOk');
    ok.classList.add('show');
    ok.textContent = `Thanks, ${$('#name').value.split(' ')[0] || 'friend'}! Your message is on its way to Mission Control. 🛰️`;
    form.reset();
  });
})();
