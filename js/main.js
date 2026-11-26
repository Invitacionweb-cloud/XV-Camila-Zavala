/**
 * XV Años · Camila Zavala
 * Invitación digital interactiva — Vanilla JS
 *
 * @module Main
 */

const EVENT_DATE = '2026-12-18T19:00:00'; // [Fecha y hora exacta del evento]

(function () {
  'use strict';

  /* ==========================================================================
     ESTADO GLOBAL DE LA APLICACIÓN
     ========================================================================== */

  const App = {
    started: false,
    /**
     * Inicializa AOS una sola vez, después de abrir el sobre.
     * Se difiere para que las animaciones del Hero se disparen al descubrirse.
     */
    startAOS() {
      if (this.started || !window.AOS) return;
      window.AOS.init({
        duration: 900,
        once: true,
        easing: 'ease-out-cubic',
        offset: 60,
        disable: 'phone'
      });
      this.started = true;
    }
  };

  /* ==========================================================================
     MÓDULO: AUDIO
     ========================================================================== */

  const Music = (function () {
    /** @type {HTMLAudioElement|null} */
    let audio = null;
    let isPlaying = false;
    const btn = document.getElementById('musicBtn');

    function create() {
      try {
        audio = new Audio('assets/audio/cancion.mp3');
        audio.loop = true;
        audio.volume = 0.55;
        audio.preload = 'auto';
        audio.addEventListener('error', () => {
          console.warn('[Music] El archivo de audio no está disponible.');
        });
      } catch (err) {
        console.warn('[Music] No se pudo instanciar el audio:', err);
      }
    }

    function setPlayingUI(playing) {
      isPlaying = playing;
      if (!btn) return;
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute(
        'aria-label',
        playing ? 'Pausar música' : 'Reproducir música'
      );
    }

    function play() {
      if (!audio) return;
      audio
        .play()
        .then(() => setPlayingUI(true))
        .catch((err) => {
          console.warn('[Music] Reproducción bloqueada por el navegador:', err);
        });
    }

    function toggle() {
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        setPlayingUI(false);
      } else {
        audio
          .play()
          .then(() => setPlayingUI(true))
          .catch((err) => console.warn('[Music] Error al reanudar:', err));
      }
    }

    function init() {
      create();
      if (btn) btn.addEventListener('click', toggle);
    }

    return { init, play };
  })();

  /* ==========================================================================
     MÓDULO: APERTURA DEL SOBRE
     ========================================================================== */

  const Envelope = (function () {
    const screen = document.getElementById('envelopeScreen');
    const envelope = document.getElementById('envelope');
    const seal = document.getElementById('waxSeal');
    const musicBtn = document.getElementById('musicBtn');

    let opened = false;

    function open() {
      if (opened) return;
      opened = true;

      // 1) Giro 3D de la solapa
      envelope.classList.add('is-open');

      // 2) Desvanecer pantalla, liberar scroll, iniciar música
      window.setTimeout(() => {
        screen.classList.add('is-open');
        document.body.classList.remove('lock-scroll');
        if (musicBtn) musicBtn.classList.remove('is-hidden');

        Music.play();
        App.startAOS();
      }, 650);
    }

    function init() {
      if (!seal) return;

      seal.addEventListener('click', open);
      seal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    }

    return { init };
  })();

  /* ==========================================================================
     MÓDULO: CUENTA REGRESIVA
     ========================================================================== */

  const Countdown = (function () {
    /** @type {number} */
    let targetTime = 0;
    let intervalId = null;

    function paint(key, value) {
      const el = document.querySelector(`[data-countdown="${key}"]`);
      if (el) el.textContent = String(value).padStart(2, '0');
    }

    function tick() {
      const diff = Math.max(0, targetTime - Date.now());

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      paint('days', days);
      paint('hours', hours);
      paint('minutes', minutes);
      paint('seconds', seconds);

      if (diff === 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function init() {
      const parsed = new Date(EVENT_DATE).getTime();
      if (Number.isNaN(parsed)) {
        console.warn('[Countdown] EVENT_DATE inválida:', EVENT_DATE);
        return;
      }
      targetTime = parsed;
      tick();
      intervalId = window.setInterval(tick, 1000);
    }

    return { init };
  })();

  /* ==========================================================================
     MÓDULO: PARTÍCULAS CANVAS (BOKEH DORADO)
     ========================================================================== */

  const Particles = (function () {
    /** @type {HTMLCanvasElement|null} */
    let canvas = null;
    /** @type {CanvasRenderingContext2D|null} */
    let ctx = null;

    let particles = [];
    let width = 0;
    let height = 0;
    let rafId = 0;

    const COLORS = [
      'rgba(212, 175, 55, ',
      'rgba(252, 246, 186, ',
      'rgba(170, 119, 28, '
    ];

    const CONFIG = {
      countDesktop: 38,
      countMobile: 18,
      minRadiusDesktop: 1,
      maxRadiusDesktop: 3.6,
      minRadiusMobile: 1,
      maxRadiusMobile: 2.4
    };

    function isMobile() {
      return window.innerWidth < 768;
    }

    function buildParticle() {
      const mobile = isMobile();
      const rMin = mobile ? CONFIG.minRadiusMobile : CONFIG.minRadiusDesktop;
      const rMax = mobile ? CONFIG.maxRadiusMobile : CONFIG.maxRadiusDesktop;

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: rMin + Math.random() * (rMax - rMin),
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: -0.12 - Math.random() * 0.35,
        opacity: 0.2 + Math.random() * 0.5,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.006 + Math.random() * 0.014
      };
    }

    function rebuild() {
      const count = isMobile() ? CONFIG.countMobile : CONFIG.countDesktop;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(buildParticle());
      }
    }

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        // Reciclaje de partículas
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const alpha = p.opacity * (0.55 + Math.sin(p.pulse) * 0.45);
        const r = p.radius * 3;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, p.color + alpha + ')');
        grad.addColorStop(0.45, p.color + alpha * 0.45 + ')');
        grad.addColorStop(1, p.color + '0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    function handleResize() {
      resize();
      rebuild();
    }

    function init() {
      canvas = document.getElementById('particles-canvas');
      if (!canvas) return;

      ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (prefersReduced) return;

      resize();
      rebuild();
      frame();

      window.addEventListener('resize', handleResize);

      // Pausar cuando la pestaña está oculta → ahorro de batería
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(rafId);
        } else {
          cancelAnimationFrame(rafId);
          frame();
        }
      });
    }

    return { init };
  })();

  /* ==========================================================================
     MÓDULO: GALERÍA SWIPER
     ========================================================================== */

  const Gallery = (function () {
    function init() {
      if (typeof window.Swiper !== 'function') return;

      const el = document.querySelector('.gallery-swiper');
      if (!el) return;

      const pagination = el.querySelector('.swiper-pagination');
      const next = el.querySelector('.swiper-button-next');
      const prev = el.querySelector('.swiper-button-prev');

      new window.Swiper(el, {
        effect: 'fade',
        fadeEffect: { crossFade: true },
        loop: true,
        speed: 850,
        grabCursor: true,
        autoplay: {
          delay: 5200,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        pagination: pagination
          ? { el: pagination, clickable: true }
          : undefined,
        navigation: {
          nextEl: next,
          prevEl: prev
        },
        a11y: { enabled: true }
      });
    }

    return { init };
  })();

  /* ==========================================================================
     MÓDULO: ICONOS LUCIDE
     ========================================================================== */

  const Icons = (function () {
    function refresh() {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({
          attrs: { 'stroke-width': '1.5' }
        });
      }
    }
    return { refresh };
  })();

  /* ==========================================================================
     BOOTSTRAP
     ========================================================================== */

  function init() {
    Icons.refresh();
    Envelope.init();
    Music.init();
    Countdown.init();
    Particles.init();
    Gallery.init();
    // AOS se inicializa después de abrir el sobre (App.startAOS)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();