/**
 * FoodLoop Surplus Listing Card Component (PRD Section 7.4 & 8)
 */

import { escapeHtml } from '../../utils/validation.js';
import { formatDeadlineBadge, getCategoryLabel } from '../../utils/formatDate.js';
import { icon } from './icons.js';
import { t, getLanguage } from '../services/i18nService.js';

export function getStatusBadgeHtml(listing) {
  if (listing.status === 'expired' || listing.status === 'unavailable') {
    return `<span class="badge badge-expired">${icon('x', 11)} ${t('status_expired')}</span>`;
  }
  if (listing.status === 'completed') {
    return `<span class="badge badge-success">${icon('check', 12)} ${t('status_completed')}</span>`;
  }
  if (listing.quantityAvailable <= 0 || listing.status === 'reserved') {
    return `<span class="badge badge-reserved">${icon('statusDot', 7)} ${t('status_reserved')}</span>`;
  }
  if (listing.status === 'almost-reserved' || listing.quantityAvailable <= Math.ceil(listing.quantityTotal * 0.35)) {
    return `<span class="badge badge-almost">${icon('statusHalf', 9)} ${t('status_almost')}</span>`;
  }
  return `<span class="badge badge-available">${icon('statusDot', 7)} ${t('status_available')}</span>`;
}

export function renderListingCard(listing, { showSaveButton = false, isSaved = false } = {}) {
  const categoryLabel = getCategoryLabel(listing.category);
  const statusBadge = getStatusBadgeHtml(listing);
  const deadlineLabel = formatDeadlineBadge(listing.pickupEnd);
  const dietaryChips = (listing.dietaryTags || [])
    .slice(0, 2)
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join('');

  const isId = getLanguage() === 'id';
  const allergenNote = listing.allergens && listing.allergens.length > 0
    ? `<span class="tag-chip" title="${escapeHtml(listing.allergens.join(', '))}">${isId ? 'Ada info alergen' : 'Allergen info'}</span>`
    : `<span class="tag-chip">${isId ? 'Periksa alergen' : 'Check allergens'}</span>`;

  return `
    <article class="listing-card" data-listing-id="${escapeHtml(listing.id)}">
      <div class="listing-card-media">
        <img
          src="${escapeHtml(listing.image)}"
          alt="${escapeHtml(listing.title)} shared by ${escapeHtml(listing.providerName)}"
          loading="lazy"
          data-fallback-category="${escapeHtml(listing.category)}"
        />
        <div class="listing-card-badges-top">
          <span class="badge badge-neutral" style="background: rgba(255,254,250,0.94);">
            ${escapeHtml(categoryLabel)}
          </span>
          ${statusBadge}
        </div>
      </div>

      <div class="listing-card-body">
        <div class="listing-card-meta-row">
          <span>${icon('mapPin', 13)} ${escapeHtml(listing.area)}</span>
          ${listing.isDemo ? `<span class="badge-demo" style="padding:1px 6px; border-radius:4px;">Demo</span>` : ''}
        </div>

        <h3 class="listing-card-title">
          <a href="#/food/${escapeHtml(listing.id)}" data-link="/food/${escapeHtml(listing.id)}">
            ${escapeHtml(listing.title)}
          </a>
        </h3>

        <div class="listing-card-provider">
          <span><strong>${escapeHtml(listing.providerName)}</strong></span>
          <span style="color: var(--color-muted);">• ${escapeHtml(listing.providerType)}</span>
        </div>

        <div class="listing-card-specs">
          <div>
            <span class="listing-spec-label">${t('card_available_qty')}</span>
            <span class="listing-spec-value">${listing.quantityAvailable} <span style="font-weight:400; color:var(--color-muted);">/ ${listing.quantityTotal} ${escapeHtml(listing.unit)}</span></span>
          </div>
          <div>
            <span class="listing-spec-label">${t('card_collect_by')}</span>
            <span class="listing-spec-value">${escapeHtml(deadlineLabel)}</span>
          </div>
        </div>

        <div class="listing-card-tags">
          ${dietaryChips}
          ${allergenNote}
        </div>

        <div class="listing-card-footer">
          <a href="#/food/${escapeHtml(listing.id)}" data-link="/food/${escapeHtml(listing.id)}" class="btn btn-primary btn-sm">
            ${t('card_btn_view')}
          </a>
          ${
            showSaveButton
              ? `<button type="button" class="btn btn-secondary btn-sm" data-toggle-save="${escapeHtml(listing.id)}" aria-pressed="${isSaved ? 'true' : 'false'}">
                   ${isSaved ? `${icon('bookmarkFilled', 13)} ${isId ? 'Tersimpan' : 'Saved'}` : `${icon('bookmark', 13)} ${isId ? 'Simpan' : 'Save'}`}
                 </button>`
              : ''
          }
        </div>
      </div>
    </article>
  `;
}

