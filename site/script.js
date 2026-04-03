// Markup Marketing Site — Minimal JS

(function () {
  'use strict';

  // --- Scroll-triggered fade-in animations ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });

  // --- Platform detection ---
  const isMac = /Mac|Macintosh/.test(navigator.userAgent);

  if (!isMac) {
    // Update hero download button
    const heroDownload = document.querySelector('.hero-download');
    if (heroDownload) {
      heroDownload.textContent = 'Available for macOS';
      heroDownload.href = 'https://github.com/radjay/markup';
      heroDownload.classList.remove('btn-primary');
      heroDownload.classList.add('btn-secondary');
    }

    // Update footer download button
    const footerDownload = document.querySelector('.footer-download');
    if (footerDownload) {
      footerDownload.textContent = 'Available for macOS';
      footerDownload.href = 'https://github.com/radjay/markup';
      footerDownload.classList.remove('btn-primary');
      footerDownload.classList.add('btn-secondary');
    }

    // Update nav download button
    const navDownload = document.querySelector('.nav-download');
    if (navDownload) {
      navDownload.textContent = 'GitHub';
      navDownload.href = 'https://github.com/radjay/markup';
    }
  }
})();
