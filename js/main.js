/**
 * ترجمات السنة — Main JavaScript
 * Author: Front-end Developer
 * Responsibilities:
 *   1. Navbar: scroll effect + mobile toggle + active link tracking
 *   2. Hadith slider: auto-play + manual nav + dots
 *   3. Scroll-reveal: timeline items + companion cards
 *   4. Tab system: rulings section
 *   5. Back-to-top button
 *   6. Logo typing shimmer animation
 */

'use strict';

/* ========================================================
   SECTION 1 — Navbar & Side Drawer
   ======================================================== */
const header         = document.querySelector('.site-header');
const navToggle      = document.getElementById('navToggle');
const navDrawer      = document.getElementById('navDrawer');
const drawerClose    = document.getElementById('drawerClose');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerLinks    = document.querySelectorAll('#drawerLinks a');
const directNavLinks = document.querySelectorAll('.nav-direct-links a');
const allNavAnchors  = document.querySelectorAll('.nav-direct-links a, #drawerLinks a');
const backToTopBtn   = document.getElementById('backToTop');

// Open / Close Drawer
function openDrawer() {
  if (!navDrawer) return;
  navDrawer.classList.add('drawer-open');
  if (drawerBackdrop) drawerBackdrop.classList.add('active');
  if (navToggle) {
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
  }
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  if (!navDrawer) return;
  navDrawer.classList.remove('drawer-open');
  if (drawerBackdrop) drawerBackdrop.classList.remove('active');
  if (navToggle) {
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
}

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = navDrawer && navDrawer.classList.contains('drawer-open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });
}

if (drawerClose) {
  drawerClose.addEventListener('click', closeDrawer);
}

if (drawerBackdrop) {
  drawerBackdrop.addEventListener('click', closeDrawer);
}

// Close drawer on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navDrawer && navDrawer.classList.contains('drawer-open')) {
    closeDrawer();
  }
});

// Close drawer when any drawer link is clicked
drawerLinks.forEach(a => {
  a.addEventListener('click', () => {
    closeDrawer();
  });
});

// Scroll effect: add solid background after 60px
function onScroll() {
  const scrolled = window.scrollY > 60;
  if (header) header.classList.toggle('scrolled', scrolled);
  if (backToTopBtn) {
    backToTopBtn.hidden = !scrolled;
  }
  trackActiveSection();
}

// Track which section is visible and highlight corresponding nav link
const sectionIds = [
  'adhkar',
  'references',
  'about',
  'rulings',
  'manasik',
  'hadiths',
  'hady',
  'companions',
  'umrah',
  'about-us',
  'goals',
  'contact'
];

function trackActiveSection() {
  const scrollMid = window.scrollY + window.innerHeight * 0.4;

  let currentId = null;
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.offsetTop <= scrollMid) currentId = id;
  }

  allNavAnchors.forEach(a => {
    const href = a.getAttribute('href');
    const active = href === `#${currentId}`;
    a.setAttribute('aria-current', active ? 'true' : 'false');
    a.classList.toggle('active', active);
  });
}

window.addEventListener('scroll', onScroll, { passive: true });


/* ========================================================
   SECTION 2 — Hadith Slider
   ======================================================== */
const hadithTrack = document.getElementById('hadithTrack');
const hadithPrev  = document.getElementById('hadithPrev');
const hadithNext  = document.getElementById('hadithNext');
const dotsContainer = document.getElementById('hadithDots');

const hadithCards  = hadithTrack.querySelectorAll('.hadith-card');
const totalSlides  = hadithCards.length;
let   currentSlide = 0;
let   autoSlideTimer = null;

// Build dots
hadithCards.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.className = 'hadith-dot' + (i === 0 ? ' active' : '');
  dot.setAttribute('aria-label', `الانتقال إلى الحديث ${i + 1}`);
  dot.setAttribute('role', 'listitem');
  dot.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(dot);
});

function goToSlide(index) {
  currentSlide = (index + totalSlides) % totalSlides;
  hadithTrack.style.transform = `translateX(${currentSlide * 100}%)`;

  dotsContainer.querySelectorAll('.hadith-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

hadithNext.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
hadithPrev.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });

function startAutoSlide() {
  autoSlideTimer = setInterval(nextSlide, 5500);
}

function resetAutoSlide() {
  clearInterval(autoSlideTimer);
  startAutoSlide();
}

// Pause on hover / focus
const sliderRegion = document.querySelector('.hadith-slider');
sliderRegion.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
sliderRegion.addEventListener('mouseleave', startAutoSlide);
sliderRegion.addEventListener('focusin',    () => clearInterval(autoSlideTimer));
sliderRegion.addEventListener('focusout',   startAutoSlide);

// Touch / swipe support
let touchStartX = 0;
sliderRegion.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
sliderRegion.addEventListener('touchend',   e => {
  const delta = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(delta) > 40) { delta > 0 ? nextSlide() : prevSlide(); resetAutoSlide(); }
});

startAutoSlide();


/* ========================================================
   SECTION 3 — Scroll Reveal (IntersectionObserver)
   ======================================================== */
function createRevealObserver(selector, visibleClass = 'visible', rootMarginBottom = '-80px') {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (!entry.isIntersecting) return;
      // Stagger each item slightly
      const delay = Array.from(elements).indexOf(entry.target) * 80;
      setTimeout(() => entry.target.classList.add(visibleClass), delay);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: `0px 0px ${rootMarginBottom} 0px`, threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

createRevealObserver('.timeline-item');
createRevealObserver('.companion-card');


/* ========================================================
   SECTION 4 — Tab System (Rulings)
   ======================================================== */
const tabButtons  = document.querySelectorAll('.tab-btn');
const tabPanels   = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = 'tab-' + btn.dataset.tab;

    tabButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });

    tabPanels.forEach(panel => {
      panel.classList.remove('active');
      panel.hidden = true;
    });

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.classList.add('active');
      targetPanel.hidden = false;
    }
  });

  // Keyboard navigation for tabs (left/right arrows)
  btn.addEventListener('keydown', e => {
    const tabList = [...tabButtons];
    const current = tabList.indexOf(e.target);
    let next = -1;

    if (e.key === 'ArrowLeft')  next = (current + 1) % tabList.length;
    if (e.key === 'ArrowRight') next = (current - 1 + tabList.length) % tabList.length;

    if (next >= 0) {
      tabList[next].focus();
      tabList[next].click();
    }
  });
});


/* ========================================================
   SECTION 5 — Back to Top
   ======================================================== */
if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ========================================================
   SECTION 6 — Logo Shimmer / Pulse on Load
   ======================================================== */
function animateLogo() {
  const brandAccent = document.querySelector('.brand-accent, .logo-accent');
  if (!brandAccent) return;

  // Add a brief shimmer class, then remove
  brandAccent.style.transition = 'color 0.6s ease, text-shadow 0.6s ease';
  brandAccent.style.textShadow = '0 0 18px rgba(201,168,76,0.7)';

  setTimeout(() => {
    brandAccent.style.textShadow = '';
  }, 1800);
}

// Run on page load (after a short delay for visual effect)
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(animateLogo, 800);
  // Trigger initial scroll state check (e.g., if user refreshes mid-page)
  onScroll();
});


/* ========================================================
   SECTION 7 — Hero parallax (subtle, GPU-friendly)
   ======================================================== */
const heroImg = document.querySelector('.hero-img');

if (heroImg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroHeight = document.querySelector('.hero').offsetHeight;
    if (scrollY < heroHeight) {
      heroImg.style.transform = `scale(1.07) translateY(${scrollY * 0.18}px)`;
    }
  }, { passive: true });
}


/* ========================================================
   SECTION 8 — Reading Progress Bar
   ======================================================== */
(function createProgressBar() {
  const bar = document.createElement('div');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'تقدم القراءة');
  bar.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(to left, var(--clr-gold-light, #e8cf8a), var(--clr-gold, #c9a84c));
    z-index: 200;
    transition: width 0.1s linear;
    pointer-events: none;
  `;
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const docHeight   = document.documentElement.scrollHeight - window.innerHeight;
    const progress    = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    bar.style.width   = progress.toFixed(1) + '%';
  }, { passive: true });
})();


/* ========================================================
   SECTION 9 — Adhkar Filter Tabs & Copy Button
   ======================================================== */
const adhkarTabBtns = document.querySelectorAll('.adhkar-tab-btn');
const dhikrCards    = document.querySelectorAll('.dhikr-card');

adhkarTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    adhkarTabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    const filter = btn.getAttribute('data-filter');
    dhikrCards.forEach(card => {
      if (filter === 'all' || card.getAttribute('data-stage') === filter) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// Toast notification for copying
function showCopyToast(msg = 'تم نسخ الذكر بنجاح ✓') {
  let toast = document.querySelector('.copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'copy-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// Copy dhikr text
document.querySelectorAll('.btn-copy-dhikr').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-clipboard-target');
    const textEl = document.getElementById(targetId);
    if (!textEl) return;

    const textToCopy = textEl.textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showCopyToast();
      }).catch(() => {
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }
  });
});

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showCopyToast();
  } catch (err) {
    showCopyToast('تعذر النسخ تلقائياً');
  }
  document.body.removeChild(ta);
}
