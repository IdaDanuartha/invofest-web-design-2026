/**
 * FoodLoop Accessible Modal Component (PRD Section 24)
 * Traps keyboard focus inside the modal and returns focus to trigger on close.
 */

import { trapFocus } from '../../utils/accessibility.js';
import { escapeHtml } from '../../utils/validation.js';
import { icon } from './icons.js';

let releaseTrap = null;

export function closeModal() {
  const backdrop = document.getElementById('app-modal-backdrop');
  if (!backdrop) return;
  backdrop.hidden = true;
  backdrop.innerHTML = '';
  if (typeof releaseTrap === 'function') {
    releaseTrap();
    releaseTrap = null;
  }
}

export function openModal({ title, bodyHtml, footerHtml = '', onMount = null }) {
  let backdrop = document.getElementById('app-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'app-modal-backdrop';
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
  }

  backdrop.hidden = false;
  backdrop.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title-heading">
      <div class="modal-header">
        <h3 id="modal-title-heading">${escapeHtml(title)}</h3>
        <button type="button" class="modal-close" data-modal-close aria-label="Close dialog">${icon('x', 16)}</button>
      </div>
      <div class="modal-body">
        ${bodyHtml}
      </div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop || event.target.closest('[data-modal-close]')) {
      closeModal();
    }
  });

  const dialog = backdrop.querySelector('.modal-dialog');
  releaseTrap = trapFocus(dialog, closeModal);

  if (typeof onMount === 'function') {
    onMount(dialog);
  }
}

