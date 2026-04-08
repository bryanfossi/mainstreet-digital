/* ============================================================
   MAIN STREET DIGITAL — scripts.js
   Shared JavaScript across all 4 pages.
   Pure vanilla JS — no dependencies.
   ============================================================ */

(function () {
  'use strict';

  /* ── Favicon: Canvas-drawn "MSD" ─────────────────────────── */
  function setFavicon() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#0A1628';
      ctx.fillRect(0, 0, 32, 32);

      // Blue left bar accent
      ctx.fillStyle = '#2B7FFF';
      ctx.fillRect(0, 0, 5, 32);

      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MSD', 18, 17);

      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = canvas.toDataURL('image/png');
      document.head.appendChild(link);
    } catch (e) {
      // Silently fail if canvas not supported
    }
  }

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
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const allNavLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');

    allNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentFile || (currentFile === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  /* ── Contact Form Validation ─────────────────────────────── */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const successEl = document.getElementById('form-success');

    function showError(input, msg) {
      input.classList.add('error');
      const errEl = input.parentElement.querySelector('.field-error');
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add('visible');
      }
    }

    function clearError(input) {
      input.classList.remove('error');
      const errEl = input.parentElement.querySelector('.field-error');
      if (errEl) errEl.classList.remove('visible');
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
      // Allow empty or valid-ish formats
      return phone === '' || /^[\d\s\-\(\)\+]{7,}$/.test(phone);
    }

    // Clear errors on input
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', () => clearError(el));
      el.addEventListener('change', () => clearError(el));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;

      const firstName = form.querySelector('#first-name');
      const lastName  = form.querySelector('#last-name');
      const business  = form.querySelector('#business-name');
      const email     = form.querySelector('#email');
      const phone     = form.querySelector('#phone');
      const interest  = form.querySelector('#interest');
      const message   = form.querySelector('#message');

      // Clear all errors first
      [firstName, lastName, business, email, phone, interest, message].forEach(clearError);

      if (!firstName.value.trim()) {
        showError(firstName, 'First name is required.');
        valid = false;
      }

      if (!lastName.value.trim()) {
        showError(lastName, 'Last name is required.');
        valid = false;
      }

      if (!business.value.trim()) {
        showError(business, 'Business name is required.');
        valid = false;
      }

      if (!email.value.trim()) {
        showError(email, 'Email address is required.');
        valid = false;
      } else if (!validateEmail(email.value.trim())) {
        showError(email, 'Please enter a valid email address.');
        valid = false;
      }

      if (phone.value.trim() && !validatePhone(phone.value.trim())) {
        showError(phone, 'Please enter a valid phone number.');
        valid = false;
      }

      if (!interest.value) {
        showError(interest, 'Please select an area of interest.');
        valid = false;
      }

      if (!message.value.trim()) {
        showError(message, 'Please tell us a bit about your business.');
        valid = false;
      }

      if (valid) {
        // Simulate async submission
        const submitBtn = form.querySelector('.form-submit');
        submitBtn.textContent = 'Sending…';
        submitBtn.disabled = true;

        setTimeout(() => {
          form.style.display = 'none';
          if (successEl) {
            successEl.classList.add('visible');
            successEl.querySelector('h3').focus();
          }
        }, 900);
      }
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
    setFavicon();
    initStickyHeader();
    initMobileMenu();
    setActiveNav();
    initContactForm();
    initScrollReveal();
    initSmoothScroll();
    initHeroVideoPlaylist();
  });

})();
