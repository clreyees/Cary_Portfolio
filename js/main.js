/* ==========================================================================
   Cary Reyes, portfolio motion and interaction
   --------------------------------------------------------------------------
   Content lives in the HTML files. You should only need to touch SETTINGS.
   Libraries (loaded from a CDN in each HTML file): GSAP, ScrollTrigger,
   SplitText and Lenis. If they fail to load, the site still works: it just
   doesn't move.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     SETTINGS: safe to edit
     ------------------------------------------------------------------------ */
  const SETTINGS = {
    // Smooth scroll: lower is smoother and slower (0 to 1)
    lenisLerp: 0.08,

    // How long the hero stays pinned, in viewport heights
    heroPinLength: 1.5,

    // Parallax speed for images (1 = normal scroll speed)
    parallaxSpeed: 0.85,

    // Optional scroll-scrubbed image sequence in the hero, like a video you
    // scroll through. Export frames as sequence/001.webp, 002.webp ... then
    // set enabled: true and frameCount to the number of frames.
    heroSequence: {
      enabled: false,
      path: 'sequence/',
      frameCount: 120,
      extension: 'webp',
      padLength: 3,
    },

    // Clock in the header
    timeZone: 'Europe/London',
  };


  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */
  const html = document.documentElement;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerMQ = window.matchMedia('(hover: hover) and (pointer: fine)');

  let lenis = null;


  /* ------------------------------------------------------------------------
     Works without any library
     ------------------------------------------------------------------------ */

  // London clock: "LONDON 14:32 GMT" (switches to BST in summer)
  function initClock() {
    const clocks = $$('[data-clock]');
    if (!clocks.length) return;
    const zones = $$('[data-clock-zone]');
    let fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: SETTINGS.timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZoneName: 'short',
      });
    } catch (e) {
      return;
    }
    const tick = () => {
      const parts = fmt.formatToParts(new Date());
      const get = (type) => (parts.find((p) => p.type === type) || {}).value || '';
      const time = `${get('hour')}:${get('minute')}`;
      clocks.forEach((el) => {
        el.textContent = time;
        if (el.tagName === 'TIME') el.setAttribute('datetime', time);
      });
      zones.forEach((el) => { el.textContent = get('timeZoneName'); });
    };
    tick();
    // Align to the start of the next minute, then tick every minute
    setTimeout(() => { tick(); setInterval(tick, 60000); }, (60 - new Date().getSeconds()) * 1000);
  }

  function initYear() {
    $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  }

  // Header: hides on scroll down, returns on scroll up
  function initHeader() {
    const header = $('[data-header]');
    if (!header) return;
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      if (Math.abs(y - lastY) > 6) {
        const goingDown = y > lastY && y > header.offsetHeight * 2;
        header.classList.toggle('is-hidden', goingDown && !header.contains(document.activeElement));
        lastY = y;
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    update();
  }

  // Marquee: fills the row and duplicates it for a seamless loop
  function initMarquee() {
    $$('[data-marquee]').forEach((marquee) => {
      const track = $('.marquee__track', marquee);
      const group = $('.marquee__group', marquee);
      const toggle = $('[data-marquee-toggle]', marquee.closest('section') || document);
      if (!track || !group || reduceMQ.matches) return;

      const originals = Array.from(group.children);
      let guard = 0;
      while (group.scrollWidth < window.innerWidth * 1.1 && guard < 8) {
        originals.forEach((item) => {
          const copy = item.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          group.appendChild(copy);
        });
        guard += 1;
      }
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      marquee.classList.add('is-ready');

      if (toggle) {
        toggle.hidden = false;
        toggle.addEventListener('click', () => {
          const paused = marquee.classList.toggle('is-paused');
          toggle.setAttribute('aria-pressed', String(paused));
          toggle.textContent = paused ? 'Play' : 'Pause';
        });
      }
    });
  }

  // In-page links scroll smoothly with Lenis, then move focus for keyboard users
  function initAnchors() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href*="#"]');
      if (!link || !lenis || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = url.hash === '#top' ? document.body : document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target === document.body ? 0 : target, {
        duration: 1.6,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        onComplete: () => focusTarget(target === document.body ? $('#main') : target),
      });
      try { window.history.pushState(null, '', url.hash); } catch (e) { /* sandboxed frames */ }
    });
  }

  function focusTarget(el) {
    if (!el) return;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }


  /* ------------------------------------------------------------------------
     Motion (needs GSAP)
     ------------------------------------------------------------------------ */

  function startLenis() {
    if (typeof window.Lenis !== 'function') return () => {};
    lenis = new window.Lenis({ lerp: SETTINGS.lenisLerp, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenis = null;
    };
  }

  // Hero: pinned while the image grows to full bleed and the headline parts
  function initHero(motion) {
    const stage = $('[data-hero]');
    if (!stage || !motion) return;

    const slot = $('[data-hero-slot]', stage);
    const media = $('[data-hero-media]', stage);
    const inner = $('[data-hero-media-inner]', stage);
    const lines = $$('[data-hero-line]', stage);
    const fades = $$('[data-hero-fade]', stage);
    const cue = $('.scroll-cue', stage);
    const sequence = initHeroSequence(inner);

    // Distance from each edge of the image slot to the edge of the stage
    const edge = (side) => {
      const s = stage.getBoundingClientRect();
      const r = slot.getBoundingClientRect();
      if (side === 'top') return s.top - r.top;
      if (side === 'left') return s.left - r.left;
      if (side === 'right') return r.right - s.right;
      return r.bottom - s.bottom;
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * SETTINGS.heroPinLength)}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: sequence ? (self) => sequence.update(self.progress) : undefined,
      },
    });

    tl.fromTo(media,
      { top: 0, right: 0, bottom: 0, left: 0 },
      {
        top: () => edge('top'),
        right: () => edge('right'),
        bottom: () => edge('bottom'),
        left: () => edge('left'),
        ease: 'power2.inOut',
        duration: 1,
      }, 0.12)
      .fromTo(inner, { scale: 1.15 }, { scale: 1, duration: 1.12 }, 0);

    // Headline splits apart, line by line, in alternating directions,
    // clearing the frame just ahead of the image
    lines.forEach((line, i) => {
      const dir = i % 2 === 0 ? -1 : 1;
      tl.to(line, {
        x: () => dir * window.innerWidth * 0.22,
        yPercent: dir * 18,
        opacity: 0,
        ease: 'power2.in',
        duration: 0.5,
      }, i * 0.04);
    });
    tl.to(fades, { opacity: 0, y: -24, ease: 'power1.in', duration: 0.3 }, 0);
    if (cue) tl.to(cue, { opacity: 0, duration: 0.1 }, 0);
    tl.to({}, { duration: 0.2 }); // a short hold on the full-bleed image
  }

  // Optional image sequence drawn to a canvas and scrubbed by scroll
  function initHeroSequence(inner) {
    const cfg = SETTINGS.heroSequence;
    if (!cfg.enabled || !inner) return null;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    inner.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const frames = new Array(cfg.frameCount);
    const src = (i) => `${cfg.path}${String(i + 1).padStart(cfg.padLength, '0')}.${cfg.extension}`;
    let wanted = 0;

    const draw = (i) => {
      const img = frames[i];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };
    const load = (i) => {
      if (frames[i]) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { if (i === wanted) draw(i); };
      img.src = src(i);
      frames[i] = img;
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(inner.offsetWidth * dpr);
      canvas.height = Math.round(inner.offsetHeight * dpr);
      draw(wanted);
    };

    load(0);
    resize();
    window.addEventListener('resize', resize);
    // Preload the rest in order, a few at a time
    let next = 1;
    const preload = () => {
      for (let n = 0; n < 6 && next < cfg.frameCount; n += 1, next += 1) load(next);
      if (next < cfg.frameCount) setTimeout(preload, 60);
    };
    setTimeout(preload, 400);

    return {
      update(progress) {
        wanted = Math.min(cfg.frameCount - 1, Math.round(progress * (cfg.frameCount - 1)));
        load(wanted);
        draw(wanted);
      },
    };
  }

  // Headlines: lines slide up from behind a mask
  function initSplits(motion) {
    const canSplit = typeof window.SplitText !== 'undefined';
    $$('[data-split]').forEach((el) => {
      if (!motion || !canSplit) {
        fadeIn(el, motion);
        return;
      }
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        tag: 'span',
        aria: 'none',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 105,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        },
      });
    });
  }

  function fadeIn(el, motion, delay = 0) {
    gsap.from(el, {
      opacity: 0,
      y: motion ? 28 : 0,
      duration: motion ? 1.1 : 0.6,
      delay,
      ease: motion ? 'expo.out' : 'power1.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    });
  }

  // Text blocks fade up; lists stagger in
  function initFades(motion) {
    $$('[data-fade]').forEach((el) => fadeIn(el, motion));
    $$('[data-stagger]').forEach((list) => {
      gsap.from(list.children, {
        opacity: 0,
        y: motion ? 32 : 0,
        duration: motion ? 1.1 : 0.6,
        ease: motion ? 'expo.out' : 'power1.out',
        stagger: 0.08,
        scrollTrigger: { trigger: list, start: 'top 88%', once: true },
      });
    });
  }

  // Images: clip-path wipe from the bottom, then parallax at 0.85x
  function initImageReveals(motion) {
    $$('[data-reveal]').forEach((frame) => {
      const img = $('img, video', frame);
      if (!motion) {
        fadeIn(frame, false);
        return;
      }
      const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 90%', once: true } });
      tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' });
      if (img) tl.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
    });
  }

  function initParallax() {
    const items = $$('[data-parallax]').map((inner) => ({ inner, frame: inner.parentElement }));
    if (!items.length) return () => {};
    const extra = (frame) => (window.innerHeight + frame.offsetHeight) * (1 - SETTINGS.parallaxSpeed);
    const size = () => items.forEach(({ inner, frame }) => {
      const e = extra(frame) / 2;
      inner.style.top = `${-e}px`;
      inner.style.bottom = `${-e}px`;
    });
    size();
    ScrollTrigger.addEventListener('refreshInit', size);
    items.forEach(({ inner, frame }) => {
      gsap.fromTo(inner,
        { y: () => -extra(frame) / 2 },
        {
          y: () => extra(frame) / 2,
          ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        });
    });
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', size);
      items.forEach(({ inner }) => { inner.style.top = ''; inner.style.bottom = ''; });
    };
  }

  // Selected work: pinned horizontal scroll on desktop, a stack elsewhere
  function initWork(horizontal, motion) {
    const section = $('#work');
    if (!section) return () => {};
    const pin = $('[data-work-pin]', section);
    const track = $('[data-work-track]', section);
    const cards = $$('.card', section);
    const fill = $('[data-work-fill]', section);
    const count = $('[data-work-count]', section);
    const total = cards.length;
    const pad = (n) => String(n).padStart(2, '0');

    if (!horizontal) {
      cards.forEach((card) => {
        const media = $('[data-card-media]', card);
        if (motion) {
          gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 88%', once: true } })
            .fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' })
            .fromTo($('img', media), { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0)
            .from($('.card__body', card), { opacity: 0, y: 24, duration: 1, ease: 'expo.out' }, 0.2);
        } else {
          fadeIn(card, false);
        }
      });
      return () => {};
    }

    section.classList.add('is-horizontal');
    const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate(self) {
          if (fill) fill.style.transform = `scaleX(${self.progress})`;
          if (count) count.textContent = `${pad(Math.min(total, Math.floor(self.progress * total) + 1))} / ${pad(total)}`;
        },
      },
    });

    cards.forEach((card) => {
      const media = $('[data-card-media]', card);
      const img = $('img', media);
      const inner = $('.media__inner', media);
      const body = $('.card__body', card);
      const visibleAtStart = card.getBoundingClientRect().left < window.innerWidth;
      const trigger = visibleAtStart
        ? { trigger: section, start: 'top 55%', once: true }
        : { trigger: card, containerAnimation: tween, start: 'left 92%', once: true };

      gsap.timeline({ scrollTrigger: trigger })
        .fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' })
        .fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0)
        .from(body, { opacity: 0, y: 24, duration: 1, ease: 'expo.out' }, 0.2);

      // Images drift slightly against the sideways movement
      gsap.fromTo(inner, { xPercent: -4 }, {
        xPercent: 4,
        ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });

    // Keyboard: tabbing to a card scrolls it into view
    const onFocus = (event) => {
      const card = event.target.closest('.card');
      const st = tween.scrollTrigger;
      if (!card || !st) return;
      const offset = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
      const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const max = distance() || 1;
      const progress = gsap.utils.clamp(0, 1, (offset - gutter) / max);
      const y = st.start + progress * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    };
    track.addEventListener('focusin', onFocus);

    return () => {
      track.removeEventListener('focusin', onFocus);
      section.classList.remove('is-horizontal');
      if (fill) fill.style.transform = '';
    };
  }

  // Numbers count up from zero once they come into view
  function initCountUps(motion) {
    if (!motion) return;
    $$('[data-countup]').forEach((el) => {
      const text = el.textContent.trim();
      const match = text.match(/\d+(?:\.\d+)?/);
      if (!match || el.getBoundingClientRect().top < window.innerHeight) return;
      const end = parseFloat(match[0]);
      const decimals = (match[0].split('.')[1] || '').length;
      const before = text.slice(0, match.index);
      const after = text.slice(match.index + match[0].length);
      const counter = { value: 0 };
      el.textContent = `${before}${(0).toFixed(decimals)}${after}`;
      gsap.to(counter, {
        value: end,
        duration: 1.8,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => { el.textContent = `${before}${counter.value.toFixed(decimals)}${after}`; },
        onComplete: () => { el.textContent = text; },
      });
    });
  }

  // Section hairlines draw in from the left
  function initRules(motion) {
    if (!motion) return;
    $$('.section-head').forEach((head) => {
      ScrollTrigger.create({
        trigger: head,
        start: 'top 92%',
        once: true,
        onEnter: () => head.classList.add('is-in'),
      });
    });
  }

  // Active nav item follows the section in view
  function initActiveNav() {
    $$('[data-nav]').forEach((link) => {
      const section = document.getElementById(link.dataset.nav);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle(self) {
          link.classList.toggle('is-active', self.isActive);
          if (self.isActive) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        },
      });
    });
  }

  // Cursor dot that grows into a "View" circle over project cards
  function initCursor() {
    if (!finePointerMQ.matches || reduceMQ.matches) return;
    const cursor = document.createElement('div');
    cursor.className = 'cursor is-hidden';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="cursor__dot"><span class="cursor__label label">View</span></div>';
    document.body.appendChild(cursor);
    html.classList.add('has-cursor');

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    let shown = false;

    window.addEventListener('mousemove', (e) => {
      if (!shown) {
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        cursor.classList.remove('is-hidden');
        shown = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      cursor.classList.toggle('is-view', !!t.closest('[data-cursor="view"]'));
      cursor.classList.toggle('is-link', !!t.closest('a, button') && !t.closest('[data-cursor="view"]'));
      cursor.classList.toggle('is-invert', !!t.closest('[data-cursor-invert]'));
    });
    document.documentElement.addEventListener('mouseleave', () => {
      cursor.classList.add('is-hidden');
      shown = false;
    });
  }

  // Arriving from another page with a #hash: jump there once pins exist
  function honourHash() {
    if (!window.location.hash) return;
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }


  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  initClock();
  initYear();
  initHeader();
  initAnchors();

  const fontsReady = (document.fonts && document.fonts.ready)
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))])
    : Promise.resolve();

  fontsReady.then(() => {
    initMarquee();

    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
      html.classList.add('no-motion-lib');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    if (typeof window.SplitText !== 'undefined') gsap.registerPlugin(SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const mm = gsap.matchMedia();
    mm.add({
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 900px)',
    }, (context) => {
      const { motion, desktop } = context.conditions;
      const cleanups = [];

      if (motion) {
        cleanups.push(startLenis());
        html.classList.add('is-motion');
        cleanups.push(() => html.classList.remove('is-motion'));
      }

      initHero(motion);
      cleanups.push(initWork(desktop && motion, motion));
      initSplits(motion);
      initFades(motion);
      initImageReveals(motion);
      if (motion) cleanups.push(initParallax());
      initCountUps(motion);
      initRules(motion);

      return () => cleanups.forEach((fn) => fn && fn());
    });

    initActiveNav();
    initCursor();

    // Web fonts can arrive after this runs and change line lengths:
    // re-measure every trigger once they have
    let refreshTimer;
    const refreshSoon = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', refreshSoon);
    }

    ScrollTrigger.refresh();
    honourHash();
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  });
})();
