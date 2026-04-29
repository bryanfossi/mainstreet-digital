/* ============================================================
   MAIN STREET DIGITAL — scripts.js
   Shared JavaScript across all 4 pages.
   Pure vanilla JS — no dependencies.
   ============================================================ */

(function () {
  'use strict';

  /* ── Sticky Header Shadow ────────────────────────────────── */
  function initStickyHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* ── Mobile Menu ─────────────────────────────────────────── */
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay    = document.getElementById('mobile-overlay');

    if (!hamburger || !mobileMenu) return;

    function openMenu() {
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close menu');
    }

    function closeMenu() {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
    }

    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close on nav link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
        hamburger.focus();
      }
    });
  }

  /* ── Active Nav Link ─────────────────────────────────────── */
  function setActiveNav() {
    // Normalize: strip trailing slash, .html extension, and ensure leading slash.
    function normalize(p) {
      if (!p) return '/';
      p = p.replace(/\.html$/, '').replace(/\/$/, '');
      if (p === '' || p === '/index') return '/';
      if (!p.startsWith('/')) p = '/' + p;
      return p;
    }

    const currentPath = normalize(window.location.pathname);
    const allNavLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');

    allNavLinks.forEach(link => {
      const linkPath = normalize(link.getAttribute('href'));
      if (linkPath === currentPath) {
        link.classList.add('active');
      }
    });
  }

  /* ── Lead Magnet Form (Free Digital Health Check) ────────── */
  function initLeadMagnetForm() {
    const form = document.getElementById('leadmag-form');
    if (!form) return;

    const nameInput = form.querySelector('#leadmag-name');
    const emailInput = form.querySelector('#leadmag-email');
    const submitBtn = form.querySelector('.leadmag-submit');
    const errorEl = form.querySelector('.leadmag-error');

    function setError(msg) {
      if (!errorEl) return;
      if (msg) {
        errorEl.textContent = msg;
        errorEl.classList.add('visible');
      } else {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    [nameInput, emailInput].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => {
        el.classList.remove('error');
        setError('');
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      setError('');

      const name = (nameInput && nameInput.value || '').trim();
      const email = (emailInput && emailInput.value || '').trim();

      if (!email) {
        emailInput.classList.add('error');
        setError('Please enter your email address.');
        emailInput.focus();
        return;
      }
      if (!validateEmail(email)) {
        emailInput.classList.add('error');
        setError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }

      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Request failed.');
          }
          window.location.href = '/health-check';
        })
        .catch((err) => {
          submitBtn.textContent = originalLabel;
          submitBtn.disabled = false;
          setError(err.message || 'Something went wrong. Please try again.');
        });
    });
  }

  /* ── Scroll-Reveal (lightweight, intersection-based) ─────── */
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    // Add reveal class to eligible elements
    const revealSelectors = [
      '.pain-card',
      '.how-column',
      '.service-preview-card',
      '.trust-item',
      '.pricing-card',
      '.addon-tile',
      '.team-card',
      '.value-item',
      '.step-item',
      '.mission-text',
      '.mission-visual',
    ];

    document.querySelectorAll(revealSelectors.join(', ')).forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = `opacity 0.55s ease ${(i % 3) * 0.1}s, transform 0.55s ease ${(i % 3) * 0.1}s`;
      observer.observe(el);
    });
  }

  /* ── Smooth Scroll for Anchor Links ─────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const headerH = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--header-h')) || 72;
          const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  /* Sequential Hero Video Playlist (index page only) */
  function initHeroVideoPlaylist() {
    const player = document.getElementById('hero-video-player');
    if (!player) return;

    // Skip on mobile — the video is hidden via CSS and we don't want to fetch it.
    if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return;

    const playlistAttr = player.getAttribute('data-playlist') || '';
    const playlist = playlistAttr
      .split(',')
      .map(src => src.trim())
      .filter(Boolean);

    if (playlist.length === 0) return;

    let currentIndex = 0;

    function playAt(index) {
      currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
      const nextSrc = playlist[currentIndex];

      if (player.getAttribute('src') !== nextSrc) {
        player.setAttribute('src', nextSrc);
        player.load();
      } else {
        player.currentTime = 0;
      }

      const playPromise = player.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Ignore autoplay rejection silently; browser will start on user interaction.
        });
      }
    }

    player.addEventListener('ended', () => {
      playAt(currentIndex + 1);
    });

    player.addEventListener('error', () => {
      playAt(currentIndex + 1);
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && player.paused) {
        const playPromise = player.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }
    });

    playAt(0);
  }

  /* ── Init ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initStickyHeader();
    initMobileMenu();
    setActiveNav();
    initLeadMagnetForm();
    initScrollReveal();
    initSmoothScroll();
    initHeroVideoPlaylist();
  });

})();
