/**
 * FoodLoop Client-Side Router (PRD Section 5)
 * Supports all 15 routes with parameters (/food/:id), query strings,
 * browser history, and direct route loading.
 */

import { announceToScreenReader, bindImageFallbacks } from '../utils/accessibility.js';

const routeTable = [];
let notFoundHandler = null;
let afterRenderCallback = null;

function normalizePath(rawPath) {
  if (!rawPath) return '/';
  let clean = rawPath.trim();
  if (clean.startsWith('#')) {
    clean = clean.slice(1);
  }
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  const [pathname, queryString] = clean.split('?');
  const normalizedPathname = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
  return {
    pathname: normalizedPathname || '/',
    query: Object.fromEntries(new URLSearchParams(queryString || ''))
  };
}

function matchRoute(pathname) {
  for (const route of routeTable) {
    const paramNames = [];
    const regexSource = route.pattern
      .replace(/:([^/]+)/g, (_, key) => {
        paramNames.push(key);
        return '([^/]+)';
      });
    const regex = new RegExp(`^${regexSource}$`);
    const match = pathname.match(regex);
    if (match) {
      const params = {};
      paramNames.forEach((name, idx) => {
        params[name] = decodeURIComponent(match[idx + 1]);
      });
      return { route, params };
    }
  }
  return null;
}

export const router = {
  register(pattern, title, renderFn) {
    routeTable.push({ pattern, title, renderFn });
  },

  setNotFound(renderFn) {
    notFoundHandler = renderFn;
  },

  onAfterRender(cb) {
    afterRenderCallback = cb;
  },

  getCurrentLocation() {
    if (window.location.hash && window.location.hash.length > 1) {
      return normalizePath(window.location.hash);
    }
    const path = window.location.pathname;
    if (path && path !== '/' && !path.endsWith('index.html')) {
      return normalizePath(path + window.location.search);
    }
    return { pathname: '/', query: {} };
  },

  navigate(targetPath, { replace = false } = {}) {
    const { pathname, query } = normalizePath(targetPath);
    const qs = new URLSearchParams(query).toString();
    const hashTarget = `#${pathname}${qs ? `?${qs}` : ''}`;

    if (replace) {
      window.history.replaceState(null, '', hashTarget);
      this.resolve();
    } else if (window.location.hash !== hashTarget) {
      window.location.hash = hashTarget;
    } else {
      this.resolve();
    }
  },

  resolve() {
    const mainEl = document.getElementById('app-main');
    if (!mainEl) return;

    const { pathname, query } = this.getCurrentLocation();
    const matched = matchRoute(pathname);

    if (matched) {
      document.title = `${matched.route.title} - FoodLoop`;
      matched.route.renderFn(mainEl, { params: matched.params, query, pathname });
      announceToScreenReader(`Navigated to ${matched.route.title}`);
    } else if (notFoundHandler) {
      document.title = 'Page Not Found - FoodLoop';
      notFoundHandler(mainEl, { pathname, query });
    }

    // Trigger smooth view transition animation
    mainEl.classList.remove('view-animate-fade');
    void mainEl.offsetWidth; // Reflow
    mainEl.classList.add('view-animate-fade');

    window.scrollTo({ top: 0, behavior: 'auto' });
    bindImageFallbacks(mainEl);

    if (typeof afterRenderCallback === 'function') {
      afterRenderCallback(pathname);
    }
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('popstate', () => this.resolve());

    // Intercept clicks on [data-link] elements for clean SPA navigation
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-link]');
      if (!link) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const target = link.getAttribute('data-link') || link.getAttribute('href') || '/';
      this.navigate(target);
    });

    this.resolve();
  }
};

