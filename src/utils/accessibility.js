/**
 * FoodLoop Accessibility Utilities (PRD Section 24)
 * Focus trapping, screen-reader announcements, and fallback image handler.
 */

import { getCategoryLabel } from './formatDate.js';
import { escapeHtml } from './validation.js';

let activeFocusTrapCleanup = null;

export function announceToScreenReader(message, priority = 'polite') {
  let region = document.getElementById('sr-live-announcer');
  if (!region) {
    region = document.createElement('div');
    region.id = 'sr-live-announcer';
    region.className = 'sr-only';
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  } else {
    region.setAttribute('aria-live', priority);
  }
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 40);
}

export function trapFocus(containerElement, onEscape) {
  if (activeFocusTrapCleanup) {
    activeFocusTrapCleanup();
  }
  const previousActiveElement = document.activeElement;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  function handleKeyDown(event) {
    if (event.key === 'Escape' && typeof onEscape === 'function') {
      event.preventDefault();
      onEscape();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = Array.from(containerElement.querySelectorAll(focusableSelector))
      .filter((el) => el.offsetParent !== null);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', handleKeyDown);

  const firstFocusable = containerElement.querySelector(focusableSelector);
  if (firstFocusable) {
    window.requestAnimationFrame(() => firstFocusable.focus());
  }

  activeFocusTrapCleanup = () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
    activeFocusTrapCleanup = null;
  };

  return activeFocusTrapCleanup;
}

/**
 * Attaches graceful fallback for any broken food image (PRD Section 6.5)
 */
export function bindImageFallbacks(root = document) {
  const images = root.querySelectorAll('img[data-fallback-category]');
  images.forEach((img) => {
    if (img.dataset.fallbackBound === 'true') return;
    img.dataset.fallbackBound = 'true';

    const handleError = () => {
      const category = img.getAttribute('data-fallback-category') || 'Surplus food';
      const label = getCategoryLabel(category);
      const wrapper = document.createElement('div');
      wrapper.className = 'image-fallback';
      wrapper.setAttribute('role', 'img');
      wrapper.setAttribute('aria-label', img.getAttribute('alt') || label);
      wrapper.innerHTML = `
        <span class="image-fallback-category">${escapeHtml ? escapeHtml(label) : label}</span>
        <span style="font-size: 0.78rem; color: var(--color-muted);">FoodLoop Community Listing</span>
      `;
      if (img.parentNode) {
        img.parentNode.replaceChild(wrapper, img);
      }
    };

    img.addEventListener('error', handleError);
    if (img.complete && img.naturalWidth === 0) {
      handleError();
    }
  });
}
