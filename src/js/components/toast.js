/**
 * FoodLoop Toast Notification Component
 */

import { escapeHtml } from '../../utils/validation.js';
import { announceToScreenReader } from '../../utils/accessibility.js';
import { icon } from './icons.js';

export function showToast(message, type = 'info', duration = 4200) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${escapeHtml(type)}`;
  toast.setAttribute('role', 'status');

  toast.innerHTML = `
    <div>${escapeHtml(message)}</div>
    <button type="button" aria-label="Dismiss notification" style="color: #B8BEB8; font-weight: 700; padding: 0 4px; display:inline-flex; align-items:center;">${icon('x', 14)}</button>
  `;

  const closeBtn = toast.querySelector('button');
  const removeToast = () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  };

  closeBtn.addEventListener('click', removeToast);
  container.appendChild(toast);
  announceToScreenReader(message);

  if (duration > 0) {
    window.setTimeout(removeToast, duration);
  }
}

