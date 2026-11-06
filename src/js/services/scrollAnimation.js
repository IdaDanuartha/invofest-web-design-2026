/**
 * FoodLoop Scroll Reveal Animation Service (AOS)
 * Progressive enhancement: Components are visible by default.
 * Elements below the initial view slide up and fade in smoothly when scrolled into view.
 */

let activeObserver = null;

export function initScrollAnimations(root = document) {
  if (typeof window === 'undefined') return;

  // If reduced motion is preferred or IntersectionObserver is not supported, do nothing (all items remain visible)
  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  if (activeObserver) {
    activeObserver.disconnect();
  }

  activeObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.setAttribute('data-reveal-state', 'revealed');
          observer.unobserve(el);

          // Clean up after transition finishes so card hovers work smoothly
          setTimeout(() => {
            if (el.getAttribute('data-reveal-state') === 'revealed') {
              el.removeAttribute('data-reveal-state');
            }
          }, 900);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    }
  );

  // Target section headers and key card components
  const targetSelectors = [
    '.reveal-on-scroll',
    '.section-header',
    '.quick-discovery-bar',
    '.hero-flow-strip',
    '.flow-step-item',
    '.step-card',
    '.listing-card',
    '.kpi-card',
    '.ecosystem-card',
    '.story-editorial-block',
    '.ai-spotlight-box',
    '.faq-item',
    '.user-guide-card',
    '.pathway-card',
    '.impact-chart-card',
    '.partner-card'
  ];

  const elements = root.querySelectorAll(targetSelectors.join(', '));

  // Stagger grid containers
  const staggeredContainers = root.querySelectorAll(
    '.steps-grid, .grid-3, .grid-4, .kpi-grid, .ecosystem-grid, .discover-results-grid, .faq-accordion, .featured-feed-grid, .quick-discovery-grid, .hero-flow-strip'
  );

  staggeredContainers.forEach((container) => {
    const children = container.querySelectorAll(
      '.step-card, .listing-card, .kpi-card, .ecosystem-card, .faq-item, .user-guide-card, .pathway-card, .partner-card, .flow-step-item'
    );
    children.forEach((child, idx) => {
      child.style.setProperty('--delay-index', String(Math.min(idx, 5)));
    });
  });

  elements.forEach((el) => {
    // Header bar and demo bar never animate on scroll
    if (el.closest('#sticky-site-header') || el.closest('.demo-context-bar')) {
      el.removeAttribute('data-reveal-state');
      return;
    }

    // Top hero grid has its own dedicated CSS entrance choreography
    if (el.closest('.hero-grid')) {
      el.removeAttribute('data-reveal-state');
      return;
    }

    const rect = el.getBoundingClientRect();
    // Elements below the immediate top focal point animate into view on scroll
    if (rect.top > 260) {
      el.setAttribute('data-reveal-state', 'pending');
      activeObserver.observe(el);
    } else {
      // Elements already fully at top remain visible
      el.removeAttribute('data-reveal-state');
    }
  });

  // Safety failsafe: If any element remains pending after 2.5s (e.g. fast scrolling or layout shift), reveal it
  setTimeout(() => {
    root.querySelectorAll('[data-reveal-state="pending"]').forEach((pendingEl) => {
      const rect = pendingEl.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) {
        pendingEl.setAttribute('data-reveal-state', 'revealed');
      }
    });
  }, 2500);
}
