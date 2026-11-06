/**
 * FoodLoop Discover Page - /discover (PRD Section 8)
 */

import { appState } from '../state.js';
import { listingService } from '../services/listingService.js';
import { renderListingCard } from '../components/listingCard.js';
import { renderFilterPanel } from '../components/filterPanel.js';
import { showToast } from '../components/toast.js';
import { bindImageFallbacks } from '../../utils/accessibility.js';
import { escapeHtml } from '../../utils/validation.js';
import { formatDeadlineBadge, getCategoryLabel } from '../../utils/formatDate.js';
import { icon } from '../components/icons.js';
import { getLanguage, t } from '../services/i18nService.js';

export function renderDiscoverPage(container, { query = {} } = {}) {
  // Apply URL query parameters if navigated with ?area=...&category=...
  if (query.area || query.category || query.q) {
    appState.setDiscoverFilters({
      ...(query.area ? { area: query.area } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.q ? { query: query.q } : {})
    });
  }

  let selectedMapListingId = null;

  function renderView() {
    const lang = getLanguage();
    const isId = lang === 'id';
    const state = appState.getState();
    const filters = state.discoverFilters;
    const results = listingService.filterAndSortListings(filters);

    if (!selectedMapListingId && results.length > 0) {
      selectedMapListingId = results[0].id;
    } else if (results.length > 0 && !results.some((r) => r.id === selectedMapListingId)) {
      selectedMapListingId = results[0].id;
    }

    const selectedMapItem = results.find((r) => r.id === selectedMapListingId) || results[0] || null;

    container.innerHTML = `
      <section class="section-sm">
        <div class="container">
          <!-- Page Header -->
          <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom: var(--space-5);">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span class="eyebrow" style="margin-bottom:0;">${isId ? 'Direktori Surplus Bali' : 'Bali Surplus Directory'}</span>
                <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">Demo</span>
              </div>
              <h1>${isId ? 'Temukan Makanan Bermutu di Sekitar Anda' : 'Find good food near you'}</h1>
              <p style="margin-top:6px;">
                ${isId ? 'Filter surplus makanan berdasarkan wilayah, batas waktu pengambilan, porsi, dan informasi alergen.' : 'Filter available surplus by area, collection window, quantity, and provider-disclosed dietary notes.'}
              </p>
            </div>
            <div style="display:flex; gap:8px;">
              <a href="#/assistant" data-link="/assistant" class="btn btn-secondary btn-sm">${icon('sparkle', 12)} ${isId ? 'Tanya Asisten AI' : 'FoodLoop Assist'}</a>
              <a href="#/donate" data-link="/donate" class="btn btn-primary btn-sm">${icon('plus', 12)} ${t('nav_listSurplus')}</a>
            </div>
          </div>

          <!-- Top Search Bar -->
          <div class="quick-discovery-bar" style="margin-bottom: var(--space-5); padding: var(--space-4);">
            <form id="discover-search-form" style="display:grid; grid-template-columns: 1fr auto auto; gap:12px; align-items:center;">
              <div>
                <label for="discover-query-input" class="sr-only">Search by food, provider, ingredient, or area</label>
                <input
                  type="search"
                  id="discover-query-input"
                  class="form-input"
                  placeholder="${isId ? 'Cari makanan, restoran, bahan, atau wilayah di Bali (cth. Denpasar, nasi, roti)...' : 'Search food, provider, ingredient, or Bali area...'}"
                  value="${escapeHtml(filters.query || '')}"
                />
              </div>
              <button type="submit" class="btn btn-primary">${isId ? 'Cari' : 'Search'}</button>
              <button type="button" class="btn btn-secondary" id="mobile-filter-drawer-btn" style="display:inline-flex;">
                ${isId ? 'Filter' : 'Filters'}
              </button>
            </form>
          </div>

          <!-- Missing Precise Location Transparency Notice (PRD Section 7.3 & 8) -->
          ${
            filters.area === 'all'
              ? `
                <div class="notice-banner" style="margin-bottom: var(--space-5); align-items:center; justify-content:space-between; flex-wrap:wrap;">
                  <div style="display:flex; align-items:center; gap:10px; max-width:680px;">
                    <span class="notice-banner-icon">${icon('mapPin', 12)}</span>
                    <div>
                      <strong>${isId ? 'Pilihan Wilayah:' : 'Area selection:'}</strong> ${isId ? 'Menampilkan makanan di seluruh Bali (Denpasar, Badung, Ubud). Pilih area untuk mempersempit jarak penjemputan.' : 'Showing listings across all Bali areas. Choose an area to narrow collection distance.'}
                    </div>
                  </div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" data-quick-area="Denpasar">Denpasar</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-quick-area="Sanur">Sanur</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-quick-area="Badung - Canggu">Canggu</button>
                  </div>
                </div>
              `
              : ''
          }

          <div class="discover-layout">
            <!-- Filter Sidebar / Drawer -->
            <aside class="filter-sidebar" id="discover-filter-sidebar" aria-label="Surplus listing filters">
              ${renderFilterPanel(filters)}
            </aside>

            <!-- Results Column -->
            <div>
              <div class="discover-toolbar">
                <div style="font-size:0.875rem; font-weight:600;">
                  ${isId 
                    ? `Menampilkan <strong>${results.length}</strong> makanan surplus ${filters.area !== 'all' ? `di <strong>${escapeHtml(filters.area)}</strong>` : 'di Bali'}`
                    : `Showing <strong>${results.length}</strong> surplus ${results.length === 1 ? 'listing' : 'listings'} ${filters.area !== 'all' ? `in <strong>${escapeHtml(filters.area)}</strong>` : 'across Bali'}`}
                </div>

                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <label for="discover-sort-select" style="font-size:0.8125rem; color:var(--color-muted);">${isId ? 'Urutkan:' : 'Sort by:'}</label>
                    <select id="discover-sort-select" class="form-select" style="width:auto; min-height:36px; padding:4px 10px; font-size:0.8125rem;">
                      <option value="soonest" ${filters.sortBy === 'soonest' ? 'selected' : ''}>${isId ? 'Batas waktu terdekat' : 'Soonest pickup'}</option>
                      <option value="nearest" ${filters.sortBy === 'nearest' ? 'selected' : ''}>${isId ? 'Terdekat dari area saya' : 'Nearest area'}</option>
                      <option value="most-available" ${filters.sortBy === 'most-available' ? 'selected' : ''}>${isId ? 'Porsi terbanyak' : 'Most available'}</option>
                      <option value="recent" ${filters.sortBy === 'recent' ? 'selected' : ''}>${isId ? 'Baru ditambahkan' : 'Recently added'}</option>
                    </select>
                  </div>

                  <div class="segmented-tabs" role="group" aria-label="View mode toggle">
                    <button
                      type="button"
                      class="segmented-tab ${filters.viewMode === 'list' ? 'is-active' : ''}"
                      data-view-mode="list"
                    >
                      ${isId ? 'Daftar' : 'Grid List'}
                    </button>
                    <button
                      type="button"
                      class="segmented-tab ${filters.viewMode === 'map' ? 'is-active' : ''}"
                      data-view-mode="map"
                    >
                      ${isId ? 'Peta Wilayah' : 'Area Map'}
                    </button>
                  </div>
                </div>
              </div>

              ${
                results.length === 0
                  ? `
                    <!-- Empty Discover State (Exact microcopy from PRD Section 25) -->
                    <div class="state-panel">
                      <div aria-hidden="true">${icon('emptyBox', 44)}</div>
                      <h3>${isId ? 'Belum ada makanan surplus yang cocok dengan filter.' : 'No surplus matches these filters yet.'}</h3>
                      <p>${isId ? 'Coba pilih area yang lebih luas atau hapus beberapa kriteria pencarian.' : 'Try a wider area or remove a filter.'}</p>
                      <button type="button" class="btn btn-primary" id="empty-clear-filters-btn">${isId ? 'Hapus Semua Filter' : 'Clear filters'}</button>
                    </div>
                  `
                  : filters.viewMode === 'map'
                  ? `
                    <!-- Interactive Regional Map Split View (PRD Section 8) -->
                    <div class="bali-map-container" aria-label="Interactive Bali regional surplus map">
                      <div class="bali-map-canvas">
                        <svg viewBox="0 0 100 100" style="width:100%; height:100%; position:absolute; inset:0;" preserveAspectRatio="none" aria-hidden="true">
                          <path d="M8,45 Q28,22 60,20 Q88,24 92,52 Q84,82 54,88 Q26,85 8,45 Z" fill="#EFECE3" stroke="#7D9B70" stroke-width="0.8"/>
                          <text x="64" y="32" font-size="3.2" fill="#5A625A" font-weight="700">UBUD</text>
                          <text x="56" y="60" font-size="3.5" fill="#202722" font-weight="700">DENPASAR</text>
                          <text x="75" y="72" font-size="3.1" fill="#5A625A" font-weight="700">SANUR</text>
                          <text x="20" y="54" font-size="3.1" fill="#5A625A" font-weight="700">CANGGU</text>
                          <text x="26" y="70" font-size="3.1" fill="#5A625A" font-weight="700">SEMINYAK</text>
                          <text x="36" y="83" font-size="3.1" fill="#5A625A" font-weight="700">KUTA</text>
                        </svg>

                        ${results
                          .map((item) => {
                            const x = item.mapCoords?.x || 58;
                            const y = item.mapCoords?.y || 64;
                            const isSelected = selectedMapItem && selectedMapItem.id === item.id;
                            return `
                              <button
                                type="button"
                                class="map-pin-btn ${isSelected ? 'is-selected' : ''}"
                                style="left:${x}%; top:${y}%;"
                                data-map-pin="${escapeHtml(item.id)}"
                                aria-label="Inspect ${escapeHtml(item.title)} in ${escapeHtml(item.area)}, ${item.quantityAvailable} ${escapeHtml(item.unit)} available"
                              >
                                ${item.quantityAvailable} ${escapeHtml(item.unit)}
                              </button>
                            `;
                          })
                          .join('')}

                        <div style="position:absolute; bottom:10px; left:10px; background:rgba(255,254,250,0.92); padding:4px 10px; border-radius:6px; font-size:0.72rem; color:var(--color-muted);">
                          Approximate area pins (exact street address shared upon reservation)
                        </div>
                      </div>

                      <div>
                        ${
                          selectedMapItem
                            ? renderListingCard(selectedMapItem, {
                                showSaveButton: true,
                                isSaved: state.savedListingIds.includes(selectedMapItem.id)
                              })
                            : ''
                        }
                      </div>
                    </div>
                  `
                  : `
                    <div class="discover-results-grid">
                      ${results
                        .map((item) =>
                          renderListingCard(item, {
                            showSaveButton: true,
                            isSaved: state.savedListingIds.includes(item.id)
                          })
                        )
                        .join('')}
                    </div>
                  `
              }
            </div>
          </div>
        </div>
      </section>
    `;

    bindImageFallbacks(container);
    bindDiscoverEvents();
  }

  function bindDiscoverEvents() {
    const state = appState.getState();
    const filters = state.discoverFilters;

    // Search form
    const searchForm = container.querySelector('#discover-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = container.querySelector('#discover-query-input').value;
        appState.setDiscoverFilters({ query: q });
        renderView();
      });
    }

    // Mobile filter drawer button
    const drawerBtn = container.querySelector('#mobile-filter-drawer-btn');
    const sidebar = container.querySelector('#discover-filter-sidebar');
    if (drawerBtn && sidebar) {
      drawerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('is-mobile-open');
      });
    }

    // Quick area buttons
    container.querySelectorAll('[data-quick-area]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.setDiscoverFilters({ area: btn.getAttribute('data-quick-area') });
        renderView();
      });
    });

    // Available only checkbox
    const availCheck = container.querySelector('#filter-available-only');
    if (availCheck) {
      availCheck.addEventListener('change', () => {
        appState.setDiscoverFilters({ availableOnly: availCheck.checked });
        renderView();
      });
    }

    // Area select
    const areaSelect = container.querySelector('#filter-area-select');
    if (areaSelect) {
      areaSelect.addEventListener('change', () => {
        appState.setDiscoverFilters({ area: areaSelect.value });
        renderView();
      });
    }

    // Category select
    const catSelect = container.querySelector('#filter-category-select');
    if (catSelect) {
      catSelect.addEventListener('change', () => {
        appState.setDiscoverFilters({ category: catSelect.value });
        renderView();
      });
    }

    // Time select
    const timeSelect = container.querySelector('#filter-time-select');
    if (timeSelect) {
      timeSelect.addEventListener('change', () => {
        appState.setDiscoverFilters({ timeFilter: timeSelect.value });
        renderView();
      });
    }

    // Provider type select
    const provSelect = container.querySelector('#filter-provider-select');
    if (provSelect) {
      provSelect.addEventListener('change', () => {
        appState.setDiscoverFilters({ providerType: provSelect.value });
        renderView();
      });
    }

    // Min quantity slider
    const minQtySlider = container.querySelector('#filter-min-qty');
    if (minQtySlider) {
      minQtySlider.addEventListener('change', () => {
        appState.setDiscoverFilters({ minQuantity: Number(minQtySlider.value) });
        renderView();
      });
    }

    // Dietary checkboxes
    container.querySelectorAll('input[name="filter-dietary"]').forEach((box) => {
      box.addEventListener('change', () => {
        const checked = Array.from(container.querySelectorAll('input[name="filter-dietary"]:checked')).map(
          (el) => el.value
        );
        appState.setDiscoverFilters({ dietary: checked });
        renderView();
      });
    });

    // Allergen exclusion checkboxes
    container.querySelectorAll('input[name="filter-allergen"]').forEach((box) => {
      box.addEventListener('change', () => {
        const checked = Array.from(container.querySelectorAll('input[name="filter-allergen"]:checked')).map(
          (el) => el.value
        );
        appState.setDiscoverFilters({ excludeAllergens: checked });
        renderView();
      });
    });

    // Sort select
    const sortSelect = container.querySelector('#discover-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        appState.setDiscoverFilters({ sortBy: sortSelect.value });
        renderView();
      });
    }

    // View mode toggle (List / Map)
    container.querySelectorAll('[data-view-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.setDiscoverFilters({ viewMode: btn.getAttribute('data-view-mode') });
        renderView();
      });
    });

    // Map pin selection
    container.querySelectorAll('[data-map-pin]').forEach((pin) => {
      pin.addEventListener('click', () => {
        selectedMapListingId = pin.getAttribute('data-map-pin');
        renderView();
      });
    });

    // Reset filters buttons
    const resetBtns = container.querySelectorAll('#reset-discover-filters-btn, #empty-clear-filters-btn');
    resetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.resetDiscoverFilters();
        renderView();
      });
    });

    // Save / Bookmark listing buttons
    container.querySelectorAll('[data-toggle-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const listingId = btn.getAttribute('data-toggle-save');
        const nowSaved = appState.toggleSavedListing(listingId);
        showToast(
          nowSaved ? 'Saved listing to your recipient dashboard.' : 'Removed listing from saved items.',
          'info'
        );
        renderView();
      });
    });
  }

  renderView();
}

