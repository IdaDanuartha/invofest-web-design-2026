/**
 * FoodLoop Discover Filter Panel Component (PRD Section 8)
 */

import { BALI_AREAS, FOOD_CATEGORIES } from '../data/seed.js';
import { escapeHtml } from '../../utils/validation.js';
import { getLanguage, t } from '../services/i18nService.js';
import { getCategoryLabel } from '../../utils/formatDate.js';

export function renderFilterPanel(filters) {
  const lang = getLanguage();
  const isId = lang === 'id';

  const dietaryOptions = isId
    ? ['Vegetarian', 'Vegan', 'Bebas Produk Susu', 'Ramah Halal (Catatan penyedia)']
    : ['Vegetarian', 'Vegan', 'Dairy-free', 'Halal-friendly (provider noted)'];

  const allergenOptions = isId
    ? [
        { id: 'gluten', label: 'Bebas gluten tercatat' },
        { id: 'nuts', label: 'Bebas kacang tercatat' },
        { id: 'soy', label: 'Bebas kedelai tercatat' },
        { id: 'eggs', label: 'Bebas telur tercatat' }
      ]
    : [
        { id: 'gluten', label: 'Exclude disclosed gluten' },
        { id: 'nuts', label: 'Exclude disclosed tree nuts' },
        { id: 'soy', label: 'Exclude disclosed soy' },
        { id: 'eggs', label: 'Exclude disclosed eggs' }
      ];

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-3);">
      <h2 style="font-size: 1.05rem;">${isId ? 'Filter Pencarian' : 'Filters'}</h2>
      <button type="button" class="btn btn-ghost btn-sm" id="reset-discover-filters-btn" style="padding: 4px 10px;">
        ${isId ? 'Reset semua' : 'Reset all'}
      </button>
    </div>

    <div class="filter-group">
      <label class="checkbox-label" style="font-weight: 600; color: var(--color-ink);">
        <input type="checkbox" id="filter-available-only" ${filters.availableOnly ? 'checked' : ''} />
        <span>${isId ? 'Hanya tampilkan yang masih tersedia' : 'Available surplus only'}</span>
      </label>
    </div>

    <div class="filter-group">
      <label for="filter-area-select" class="filter-group-title" style="display:block;">${isId ? 'Wilayah di Bali' : 'Area in Bali'}</label>
      <select id="filter-area-select" class="form-select">
        <option value="all" ${filters.area === 'all' ? 'selected' : ''}>${isId ? 'Semua wilayah Bali' : 'All Bali areas'}</option>
        ${BALI_AREAS.map(
          (area) => `<option value="${escapeHtml(area)}" ${filters.area === area ? 'selected' : ''}>${escapeHtml(area)}</option>`
        ).join('')}
      </select>
    </div>

    <div class="filter-group">
      <label for="filter-category-select" class="filter-group-title" style="display:block;">${isId ? 'Kategori makanan' : 'Food category'}</label>
      <select id="filter-category-select" class="form-select">
        <option value="all" ${filters.category === 'all' ? 'selected' : ''}>${isId ? 'Semua kategori' : 'All categories'}</option>
        ${FOOD_CATEGORIES.map(
          (cat) => `<option value="${escapeHtml(cat.id)}" ${filters.category === cat.id ? 'selected' : ''}>${escapeHtml(getCategoryLabel(cat.id))}</option>`
        ).join('')}
      </select>
    </div>

    <div class="filter-group">
      <label for="filter-time-select" class="filter-group-title" style="display:block;">${isId ? 'Waktu pengambilan' : 'Collection timing'}</label>
      <select id="filter-time-select" class="form-select">
        <option value="all" ${filters.timeFilter === 'all' ? 'selected' : ''}>${isId ? 'Semua jadwal hari ini' : 'Any window today'}</option>
        <option value="urgent" ${filters.timeFilter === 'urgent' ? 'selected' : ''}>${isId ? 'Sebelum 17:30 WITA' : 'Collect before 17:30 WITA'}</option>
        <option value="flexible" ${filters.timeFilter === 'flexible' ? 'selected' : ''}>${isId ? 'Sore / Malam fleksibel' : 'Flexible afternoon / evening'}</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="filter-provider-select" class="filter-group-title" style="display:block;">${isId ? 'Tipe Penyedia' : 'Provider type'}</label>
      <select id="filter-provider-select" class="form-select">
        <option value="all" ${filters.providerType === 'all' ? 'selected' : ''}>${isId ? 'Semua tipe penyedia' : 'All provider types'}</option>
        <option value="Restaurant" ${filters.providerType === 'Restaurant' ? 'selected' : ''}>${isId ? 'Restoran' : 'Restaurant'}</option>
        <option value="Bakery" ${filters.providerType === 'Bakery' ? 'selected' : ''}>${isId ? 'Toko Roti / Bakery' : 'Bakery'}</option>
        <option value="Grocery" ${filters.providerType === 'Grocery' ? 'selected' : ''}>${isId ? 'Pasar Swalayan / Toko' : 'Grocery'}</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="filter-min-qty" class="filter-group-title" style="display:flex; justify-content:space-between;">
        <span>${isId ? 'Jumlah minimum tersedia' : 'Min. quantity available'}</span>
        <span id="filter-min-qty-val">${filters.minQuantity || 1}+ ${isId ? 'unit / porsi' : 'units'}</span>
      </label>
      <input
        type="range"
        id="filter-min-qty"
        min="1"
        max="16"
        step="1"
        value="${filters.minQuantity || 1}"
        style="width:100%; accent-color: var(--color-forest);"
      />
    </div>

    <div class="filter-group">
      <div class="filter-group-title">${isId ? 'Label Diet Terverifikasi Penyedia' : 'Provider-confirmed dietary tags'}</div>
      ${dietaryOptions
        .map(
          (tag) => `
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="filter-dietary"
                value="${escapeHtml(tag)}"
                ${(filters.dietary || []).includes(tag) ? 'checked' : ''}
              />
              <span>${escapeHtml(tag)}</span>
            </label>
          `
        )
        .join('')}
    </div>

    <div class="filter-group">
      <div class="filter-group-title">${isId ? 'Pengecualian Alergen (Tercatat)' : 'Allergen exclusions (disclosed)'}</div>
      ${allergenOptions
        .map(
          (alg) => `
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="filter-allergen"
                value="${escapeHtml(alg.id)}"
                ${(filters.excludeAllergens || []).includes(alg.id) ? 'checked' : ''}
              />
              <span>${escapeHtml(alg.label)}</span>
            </label>
          `
        )
        .join('')}
      <p class="form-hint" style="margin-top: 6px;">
        ${isId
          ? 'Makanan dengan alergen yang belum pasti tetap ditampilkan dengan tanda peringatan agar penerima dapat memeriksa langsung dengan penyedia.'
          : 'Listings with unconfirmed allergens remain visible with a warning so recipients can verify directly with the provider.'
        }
      </p>
    </div>
  `;
}

