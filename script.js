// Load design tokens from JSON and map into CSS variables
async function applyDesignSystem() {
  try {
    const response = await fetch('design/design-system.json', { cache: 'no-store' });
    const json = await response.json();
    const ds = json.design_system;
    const root = document.documentElement;

    // Colors
    const colors = ds.style.color_palette;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--bg-primary', colors.background_primary);
    root.style.setProperty('--bg-secondary', colors.background_secondary);
    root.style.setProperty('--text-primary', colors.text_primary);
    root.style.setProperty('--text-secondary', colors.text_secondary);
    root.style.setProperty('--button-bg', colors.button_background);
    root.style.setProperty('--button-border', colors.button_border);

    // Typography
    const typo = ds.style.typography;
    // We map weights; family in JSON is descriptive, using Montserrat per modern, bold geometric brief
    root.style.setProperty('--weight-heading', typo.heading_weight === 'bold' ? '800' : '700');
    root.style.setProperty('--weight-body', typo.body_weight === 'regular' ? '400' : '500');
    root.style.setProperty('--hero-size', typo.font_sizing.hero_heading || '3rem');
    root.style.setProperty('--section-heading-size', typo.font_sizing.section_heading || '2rem');
    root.style.setProperty('--body-size', typo.font_sizing.body_text || '1rem');
    root.style.setProperty('--button-size', typo.font_sizing.button_text || '1rem');
  } catch (err) {
    console.warn('Failed to load design system, using CSS fallbacks.', err);
  }
}

// Header scroll behavior
function setupScrollHeader() {
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (window.scrollY > 10) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mobile nav
function setupNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('open');
  });
}

// Reveal sections on scroll
function setupRevealOnScroll() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      }
    },
    { threshold: 0.15 }
  );
  reveals.forEach(el => observer.observe(el));
}

// Carousel controls (no autoplay per design)
function setupCarousel() {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const prevBtn = carousel.querySelector('.prev');
  const nextBtn = carousel.querySelector('.next');
  let index = 0;

  function update() {
    const offset = -index * carousel.clientWidth;
    track.style.transform = `translateX(${offset}px)`;
  }

  function goPrev() { index = (index - 1 + slides.length) % slides.length; update(); }
  function goNext() { index = (index + 1) % slides.length; update(); }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  window.addEventListener('resize', update);
  update();
}

// Accessibility helpers
function setCurrentYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  applyDesignSystem();
  setupScrollHeader();
  setupNavToggle();
  setupRevealOnScroll();
  setupCarousel();
  setCurrentYear();
  setupCuratedImages();
  setupImageFallbacks();
  setupInertiaScroll();
  setupBrandingMarquee();
});

// Swap failed images to a safe fallback so sections never appear blank
function setupImageFallbacks() {
  const defaultFallback = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop';
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied === 'true') return;
      img.dataset.fallbackApplied = 'true';
      // Try alternate extensions if provided for local assets
      const base = img.getAttribute('data-src-base');
      const list = (img.getAttribute('data-try-extensions') || '').split(',').map(s => s.trim()).filter(Boolean);
      if (base && list.length) {
        const dir = img.src.substring(0, img.src.lastIndexOf('/') + 1);
        for (const ext of list) {
          const candidate = `${dir}${base}.${ext}`;
          // Attempt sequentially
          img.src = candidate;
          return;
        }
      }
      const fb = img.getAttribute('data-fallback') || defaultFallback;
      img.src = fb;
    }, { once: true });
  });
}

// Use varied, curated Unsplash images to avoid repetition across sections
function setupCuratedImages() {
  const withParams = (base) => `${base}?q=80&w=1600&auto=format&fit=crop`;

  // Keep hero images as originally authored in HTML (per user preference)

  const beforeImages = [
    withParams('https://images.unsplash.com/photo-1526401485004-2fda9f4d2f6a'),
    withParams('https://images.unsplash.com/photo-1520975922203-b1cc4b5b5a7a')
  ];
  const afterImages = [
    withParams('https://images.unsplash.com/photo-1554344728-77cf0f2d6e0e'),
    withParams('https://images.unsplash.com/photo-1526401281623-3512c8ed7f4c')
  ];

  // Do not override trainer images; they may be local assets

  const roomImages = [
    withParams('https://images.unsplash.com/photo-1583454110551-21f2e3ed05a3'),
    withParams('https://images.unsplash.com/photo-1554284126-aa88f22d8b74'),
    withParams('https://images.unsplash.com/photo-1605296867304-46d5465a13f1')
  ];

  const mockupImage = withParams('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9');

  // Helper
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Hero: unchanged

  // Transformations: assign alternating before/after across all figures
  const pairImgs = document.querySelectorAll('.section-carousel .pair img');
  if (pairImgs.length) {
    let bi = 0, ai = 0;
    pairImgs.forEach((img, idx) => {
      const isAfter = (idx % 2) === 1;
      if (isAfter) {
        img.src = afterImages[ai % afterImages.length];
        ai++;
      } else {
        img.src = beforeImages[bi % beforeImages.length];
        bi++;
      }
    });
  }

  // Trainers: unchanged

  // Rooms
  const roomImgs = document.querySelectorAll('.rooms-grid .room img');
  roomImgs.forEach((img, i) => {
    img.src = roomImages[i % roomImages.length];
  });

  // App mockup
  const mockup = document.querySelector('.section-app .mockup-wrap img');
  if (mockup) mockup.src = mockupImage;
}

// Inertia-based smooth scrolling
function setupInertiaScroll() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const wrapper = document.getElementById('smooth-wrapper');
  const content = document.getElementById('smooth-content');
  if (!wrapper || !content) return;

  let targetScrollY = 0;
  let currentY = 0;
  const ease = 0.08; // lower = more glide

  function updateBodyHeight() {
    // Set body height to enable native scroll bar while we animate content
    const height = content.getBoundingClientRect().height;
    document.body.style.height = `${Math.ceil(height)}px`;
  }

  function onScroll() {
    targetScrollY = window.scrollY || window.pageYOffset;
  }

  function raf() {
    const delta = targetScrollY - currentY;
    currentY += delta * ease;
    content.style.transform = `translate3d(0, ${-currentY}px, 0)`;
    requestAnimationFrame(raf);
  }

  updateBodyHeight();
  window.addEventListener('resize', updateBodyHeight);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  requestAnimationFrame(raf);
}

// Ensure branding strip scrolls continuously without gaps by duplicating content
function setupBrandingMarquee() {
  const strip = document.querySelector('.branding-strip .strip-inner');
  if (!strip) return;
  const original = strip.innerHTML;
  // Duplicate until we exceed 2x viewport width to cover the loop
  const ensureFilled = () => {
    strip.innerHTML = original; // reset to original once, then build up
    while (strip.scrollWidth < window.innerWidth * 2.2) {
      strip.innerHTML += original;
    }
  };
  ensureFilled();
  window.addEventListener('resize', () => {
    // Recompute on resize to avoid gaps on very wide screens
    ensureFilled();
  });
}



