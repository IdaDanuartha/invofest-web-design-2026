/**
 * FoodLoop Surplus Detail Page - /food/:id (PRD Section 9)
 */

import { appState } from '../state.js';
import { listingService } from '../services/listingService.js';
import { reservationService } from '../services/reservationService.js';
import { renderListingCard, getStatusBadgeHtml } from '../components/listingCard.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { bindImageFallbacks } from '../../utils/accessibility.js';
import { escapeHtml } from '../../utils/validation.js';
import { formatPickupWindow, formatDateTime, getCategoryLabel } from '../../utils/formatDate.js';
import { icon } from '../components/icons.js';
import { getLanguage, t } from '../services/i18nService.js';
import { openQrTicketModal } from '../components/qrModal.js';
import { renderQrCodeSvg } from '../../utils/qrCode.js';

export function renderListingDetailPage(container, { params = {} } = {}) {
  const listingId = params.id;
  let lastCreatedReservation = null;

  function renderView() {
    const lang = getLanguage();
    const isId = lang === 'id';
    const listing = listingService.getById(listingId);

    if (!listing) {
      container.innerHTML = `
        <section class="section">
          <div class="container-narrow">
            <div class="state-panel">
              <h2>${isId ? 'Makanan surplus tidak ditemukan' : 'Surplus listing not found'}</h2>
              <p>${isId ? `ID makanan (${escapeHtml(listingId)}) tidak ditemukan atau mungkin sudah dihapus.` : `This listing ID (${escapeHtml(listingId)}) does not exist or may have been removed.`}</p>
              <a href="#/discover" data-link="/discover" class="btn btn-primary">${isId ? 'Kembali ke Direktori Makanan' : 'Return to Discover'}</a>
            </div>
          </div>
        </section>
      `;
      return;
    }

    const state = appState.getState();
    const isSaved = state.savedListingIds.includes(listing.id);
    const categoryLabel = getCategoryLabel(listing.category);
    const pickupWindowStr = formatPickupWindow(listing.pickupStart, listing.pickupEnd);
    const isReservable =
      listing.quantityAvailable > 0 &&
      listing.status !== 'expired' &&
      listing.status !== 'unavailable' &&
      listing.status !== 'draft';

    const relatedListings = listingService
      .getAllPublicListings()
      .filter((item) => item.id !== listing.id && (item.category === listing.category || item.area === listing.area))
      .slice(0, 3);

    const hasUnconfirmedAllergen =
      !listing.allergens ||
      listing.allergens.length === 0 ||
      listing.allergens.some((a) => /confirm|not specified/i.test(a));

    container.innerHTML = `
      <section class="section-sm">
        <div class="container">
          <!-- 1. Breadcrumb -->
          <nav aria-label="Breadcrumb" style="margin-bottom: var(--space-4); font-size: var(--text-sm); color: var(--color-muted);">
            <a href="#/discover" data-link="/discover" style="text-decoration:underline;">${isId ? 'Temukan Makanan' : 'Discover'}</a>
            <span aria-hidden="true"> / </span>
            <a href="#/discover?category=${escapeHtml(listing.category)}" data-link="/discover?category=${escapeHtml(listing.category)}" style="text-decoration:underline;">
              ${escapeHtml(categoryLabel)}
            </a>
            <span aria-hidden="true"> / </span>
            <span style="color: var(--color-ink); font-weight: 600;">${escapeHtml(listing.title)}</span>
          </nav>

          <div class="detail-layout">
            <!-- Left Main Content Column -->
            <div>
              <!-- 2. Large Food Image & Thumbnails -->
              <div class="detail-gallery-main">
                <img
                  id="detail-main-photo"
                  src="${escapeHtml(listing.image)}"
                  alt="${escapeHtml(listing.title)} from ${escapeHtml(listing.providerName)}"
                  data-fallback-category="${escapeHtml(listing.category)}"
                />
              </div>
              <div style="display:flex; gap:10px; margin-bottom: var(--space-5);">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  data-switch-photo="${escapeHtml(listing.image)}"
                  style="padding: 4px 10px;"
                >
                  ${isId ? 'Foto utama' : 'Primary photo'}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  data-switch-photo="${escapeHtml(listing.fallbackImage || 'assets/images/listing-rice.svg')}"
                  style="padding: 4px 10px;"
                >
                  ${isId ? 'Kartu kemasan / kategori' : 'Packaging / category card'}
                </button>
              </div>

              <!-- 3. Listing Title, Category, Provider & Verified Status -->
              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:10px;">
                <span class="badge badge-neutral">${escapeHtml(categoryLabel)}</span>
                ${getStatusBadgeHtml(listing)}
                ${listing.isDemo ? `<span class="badge-demo" style="padding:3px 8px; border-radius:4px;">${isId ? 'Listing demo' : 'Demo listing'}</span>` : ''}
              </div>

              <h1 style="font-size: clamp(1.75rem, 3vw, 2.4rem); margin-bottom:10px;">
                ${escapeHtml(listing.title)}
              </h1>

              <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-bottom: var(--space-5); padding-bottom: var(--space-4); border-bottom: 1px solid var(--color-line);">
                <div>
                  <span style="color:var(--color-muted); font-size:0.85rem;">${isId ? 'Dibagikan oleh' : 'Shared by'}</span>
                  <strong style="margin-left:4px;">${escapeHtml(listing.providerName)}</strong>
                  <span style="color:var(--color-muted); font-size:0.85rem;">(${escapeHtml(listing.providerType)})</span>
                </div>
                ${
                  listing.providerVerified
                    ? `<span class="badge badge-forest" title="Demo partner profile on file">${icon('check', 12)} ${isId ? 'Mitra Demo Terdaftar' : 'Participating Demo Partner'}</span>`
                    : `<span class="badge badge-neutral">${isId ? 'Kontributor Komunitas' : 'Community Contributor'}</span>`
                }
                <span style="color:var(--color-muted); font-size:0.85rem;">${icon('mapPin', 13)} ${isId ? 'Perkiraan wilayah:' : 'Approximate area:'} <strong>${escapeHtml(listing.area)}</strong></span>
              </div>

              <!-- 5. Description & Preparation Details -->
              <div style="margin-bottom: var(--space-5);">
                <h2 style="font-size:1.2rem; margin-bottom:8px;">${isId ? 'Deskripsi Makanan &amp; Waktu Masak' : 'Food description &amp; preparation'}</h2>
                <p style="margin-bottom:14px;">${escapeHtml(listing.description)}</p>

                <div class="info-spec-table">
                  <div class="info-spec-box">
                    <span class="listing-spec-label">${isId ? 'Waktu pengolahan / pembuatan' : 'Preparation / baking time'}</span>
                    <span class="listing-spec-value">
                      ${listing.preparedAt ? escapeHtml(formatDateTime(listing.preparedAt)) : (isId ? 'Belum ditentukan - tanyakan pada penyedia' : 'Not specified - confirm with provider')}
                    </span>
                  </div>
                  <div class="info-spec-box">
                    <span class="listing-spec-label">${isId ? 'Penerima yang berhak' : 'Eligible recipients'}</span>
                    <span class="listing-spec-value">
                      ${listing.recipientEligibility === 'organization'
                        ? (isId ? 'Organisasi penerima terverifikasi' : 'Verified recipient organizations')
                        : (isId ? 'Organisasi &amp; warga yang berhak' : 'Organizations &amp; eligible individuals')
                      }
                    </span>
                  </div>
                </div>
              </div>

              <!-- 6. Ingredients & Allergen Disclosure (Safety & Trust Rules) -->
              <div style="margin-bottom: var(--space-5);">
                <h2 style="font-size:1.2rem; margin-bottom:8px;">${isId ? 'Keterbukaan Bahan &amp; Alergen' : 'Ingredients &amp; allergen disclosure'}</h2>
                <div class="info-spec-box" style="margin-bottom:12px;">
                  <div style="margin-bottom:10px;">
                    <span class="listing-spec-label">${isId ? 'Bahan makanan yang dinyatakan' : 'Disclosed ingredients'}</span>
                    <p style="font-weight:500; color:var(--color-ink);">
                      ${
                        listing.ingredients && listing.ingredients.length > 0
                          ? escapeHtml(listing.ingredients.join(', '))
                          : (isId ? 'Belum dicantumkan oleh penyedia - tanyakan sebelum memesan.' : 'Not specified by provider - please ask before reserving.')
                      }
                    </p>
                  </div>
                  <div style="padding-top:10px; border-top:1px solid var(--color-line);">
                    <span class="listing-spec-label">${isId ? 'Keterbukaan alergen' : 'Allergen disclosure'}</span>
                    <p style="font-weight:600; color:${hasUnconfirmedAllergen ? 'var(--color-citrus-ink)' : 'var(--color-ink)'};">
                      ${
                        listing.allergens && listing.allergens.length > 0
                          ? escapeHtml(listing.allergens.join(' • '))
                          : (isId ? 'Informasi alergen belum disertakan. Harap hubungi penyedia sebelum memesan.' : 'Allergen information not provided. Please contact the provider before reserving.')
                      }
                    </p>
                  </div>
                </div>

                ${
                  hasUnconfirmedAllergen
                    ? `
                      <div class="notice-banner notice-banner-warning" style="margin-bottom:12px;">
                        <span class="notice-banner-icon">${icon('info', 12)}</span>
                        <div>
                          <strong>${isId ? 'Perlu Konfirmasi Alergen:' : 'Allergen check required:'}</strong>
                          <span>${isId ? 'Informasi alergen belum lengkap atau butuh konfirmasi. Pastikan memeriksa langsung dengan penyedia sebelum mengonsumsi.' : 'Allergen information is incomplete or marked for confirmation. Never assume a listing is allergen-free without verifying directly with the provider.'}</span>
                        </div>
                      </div>
                    `
                    : ''
                }

                ${
                  listing.dietaryTags && listing.dietaryTags.length > 0
                    ? `
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span style="font-size:0.8125rem; color:var(--color-muted);">${isId ? 'Label dari penyedia:' : 'Provider-supplied tags:'}</span>
                        ${listing.dietaryTags.map((t) => `<span class="badge badge-neutral">${escapeHtml(t)}</span>`).join('')}
                      </div>
                    `
                    : ''
                }
              </div>

              <!-- 7. Storage / Handling Details -->
              <div style="margin-bottom: var(--space-5);">
                <h2 style="font-size:1.2rem; margin-bottom:8px;">${isId ? 'Catatan Penyimpanan &amp; Higienitas' : 'Storage &amp; handling notes'}</h2>
                <div class="info-spec-table">
                  <div class="info-spec-box">
                    <span class="listing-spec-label">${isId ? 'Kondisi penyimpanan' : 'Storage condition'}</span>
                    <span style="font-size:0.9rem; font-weight:500;">
                      ${escapeHtml(listing.storageNotes || (isId ? 'Belum ditentukan' : 'Not specified'))}
                    </span>
                  </div>
                  <div class="info-spec-box">
                    <span class="listing-spec-label">${isId ? 'Ketentuan wadah' : 'Container requirement'}</span>
                    <span style="font-size:0.9rem; font-weight:500;">
                      ${listing.bringContainer
                        ? (isId ? 'Penerima wajib membawa wadah / tas belanja bersih' : 'Recipient must bring clean containers / bags')
                        : (isId ? 'Sudah diporsi dalam wadah tertutup rapat' : 'Pre-portioned in sealed containers')
                      }
                    </span>
                  </div>
                </div>
              </div>

              <!-- 8. Collection Instructions & Contact Method -->
              <div style="margin-bottom: var(--space-5);">
                <h2 style="font-size:1.2rem; margin-bottom:8px;">${isId ? 'Petunjuk Pengambilan' : 'Collection instructions'}</h2>
                <div class="info-spec-box">
                  <p style="margin-bottom:8px;">${escapeHtml(listing.collectionInstructions)}</p>
                  <div style="font-size:0.8125rem; color:var(--color-muted);">
                    <strong>${isId ? 'Metode koordinasi:' : 'Coordination method:'}</strong> ${escapeHtml(listing.contactMethod || (isId ? 'Thread pesan dalam aplikasi saat reservasi' : 'In-app message thread upon reservation'))}
                  </div>
                </div>
              </div>

              <!-- Safety & Trust Notice + Report Listing Action -->
              <div class="notice-banner" style="justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                <div style="display:flex; align-items:flex-start; gap:12px; min-width:0; flex:1;">
                  <span class="notice-banner-icon">${icon('shield', 13)}</span>
                  <div>
                    <strong>${isId ? 'Informasi disediakan oleh penyedia makanan.' : 'Information provided by the food provider.'}</strong>
                    <div style="font-size:0.8125rem; color:var(--color-muted); margin-top:2px;">
                      ${isId ? 'FoodLoop tidak menerbitkan sertifikasi keamanan makanan secara sepihak. Penerima wajib memeriksa kondisi fisik makanan saat serah terima dan menolak apabila tidak layak.' : 'FoodLoop does not certify food safety. Recipients should inspect food at handoff and reject anything unsuitable.'}
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-danger-outline btn-sm" id="report-listing-btn" style="flex-shrink:0;">
                  ${icon('flag', 13)} ${isId ? 'Laporkan listing' : 'Report listing'}
                </button>
              </div>
            </div>

            <!-- Right Sticky Column: 4 & 9. Availability & Reservation Panel -->
            <aside class="detail-reservation-panel" aria-label="Reserve surplus food">
              ${
                lastCreatedReservation
                  ? `
                    <!-- Confirmation Screen (PRD Section 9 & 25) -->
                    <div style="padding: var(--space-2) 0;">
                      <span class="badge badge-success" style="margin-bottom:10px;">${icon('check', 13)} ${isId ? 'Reservasi Terkonfirmasi' : 'Reservation confirmed'}</span>
                      <h2 style="font-size:1.35rem; margin-bottom:8px;">
                        ${isId ? 'Pesanan Anda Siap! Silakan cek waktu dan petunjuk ambil.' : "You're reserved. Check the collection window and instructions before you go."}
                      </h2>
                      <p style="font-size:0.875rem; margin-bottom:16px;">
                        ${isId ? 'Porsi Anda telah dicatat secara resmi dan kuota makanan telah diperbarui.' : 'Your reservation has been recorded and the listing’s remaining quantity has been updated.'}
                      </p>

                      <div class="qr-ticket-box" style="margin-block:12px; padding:14px;">
                        ${renderQrCodeSvg(`FOODLOOP-RES:${lastCreatedReservation.id}`, { size: 160, darkColor: '#244B3B' })}
                        <div class="qr-ticket-badge" style="margin-top:8px;">
                          ${icon('scan', 12)} ${isId ? 'Tunjukkan QR ini saat penjemputan' : 'Show this QR code at pickup'}
                        </div>
                      </div>

                      <div class="listing-card-specs" style="grid-template-columns:1fr; gap:10px; margin-bottom:16px;">
                        <div>
                          <span class="listing-spec-label">${isId ? 'Kode Reservasi (Tiket Digital)' : 'Reservation ID'}</span>
                          <span class="listing-spec-value" style="font-family:var(--font-mono); font-size:1.1rem; color:var(--color-forest);">${escapeHtml(lastCreatedReservation.id)}</span>
                        </div>
                        <div>
                          <span class="listing-spec-label">${isId ? 'Jumlah porsi dipesan' : 'Reserved quantity'}</span>
                          <span class="listing-spec-value">${lastCreatedReservation.quantity} ${escapeHtml(lastCreatedReservation.unit)}</span>
                        </div>
                        <div>
                          <span class="listing-spec-label">${isId ? 'Batas jam pengambilan' : 'Collection window'}</span>
                          <span class="listing-spec-value">${escapeHtml(pickupWindowStr)}</span>
                        </div>
                        <div>
                          <span class="listing-spec-label">${isId ? 'Petunjuk pengambilan' : 'Pickup instructions'}</span>
                          <span style="font-size:0.82rem; color:var(--color-ink);">${escapeHtml(listing.collectionInstructions)}</span>
                        </div>
                      </div>

                      <div style="display:flex; flex-direction:column; gap:8px;">
                        <button type="button" class="btn btn-secondary btn-block" id="detail-open-qr-ticket-btn">
                          ${icon('qrCode', 13)} ${isId ? 'Buka Tiket QR Layar Penuh' : 'Open Full QR Ticket'}
                        </button>
                        <a href="#/dashboard/reservations" data-link="/dashboard/reservations" class="btn btn-primary btn-block">
                          ${isId ? 'Kelola di Menu Reservasi Saya →' : 'Manage in My Reservations →'}
                        </a>
                        <button type="button" class="btn btn-ghost btn-block" id="detail-new-res-view-btn">
                          ${isId ? 'Kembali ke Rincian Makanan' : 'Back to listing panel'}
                        </button>
                      </div>
                    </div>
                  `
                  : `
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                      <span style="font-size:0.8125rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-muted);">
                        ${isId ? 'Ketersediaan & Pengambilan' : 'Availability & Pickup'}
                      </span>
                      <button type="button" class="btn btn-ghost btn-sm" id="detail-save-btn" style="padding:4px 10px;">
                        ${isSaved ? `${icon('bookmarkFilled', 13)} ${isId ? 'Tersimpan' : 'Saved'}` : `${icon('bookmark', 13)} ${isId ? 'Simpan' : 'Save listing'}`}
                      </button>
                    </div>

                    <div style="padding:14px; background:var(--color-cream); border:1px solid var(--color-line); border-radius:var(--radius-sm); margin-bottom:16px;">
                      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
                        <span style="font-size:0.85rem; color:var(--color-muted);">${isId ? 'Porsi tersisa' : 'Remaining quantity'}</span>
                        <span style="font-size:1.35rem; font-weight:700; color:var(--color-forest);">
                          ${listing.quantityAvailable} <span style="font-size:0.9rem; font-weight:500; color:var(--color-ink-soft);">/ ${listing.quantityTotal} ${escapeHtml(listing.unit)}</span>
                        </span>
                      </div>
                      <div style="font-size:0.85rem; padding-top:8px; border-top:1px solid var(--color-line);">
                        <span style="color:var(--color-muted); display:block; font-size:0.75rem;">${isId ? 'Jam pengambilan' : 'Collection window'}</span>
                        <strong>${escapeHtml(pickupWindowStr)}</strong>
                      </div>
                      <div style="font-size:0.85rem; margin-top:8px;">
                        <span style="color:var(--color-muted); display:block; font-size:0.75rem;">${isId ? 'Wilayah pengambilan' : 'Approximate location'}</span>
                        <strong>${icon('mapPin', 13)} ${escapeHtml(listing.area)}, Bali</strong>
                      </div>
                    </div>

                    ${
                      isReservable
                        ? `
                          <form id="detail-reserve-form">
                            <div class="form-group">
                              <label for="reserve-qty-input" class="form-label">
                                <span>${isId ? `Jumlah porsi (${escapeHtml(listing.unit)})` : `Quantity to reserve (${escapeHtml(listing.unit)})`}</span>
                                <span class="form-label-optional">${isId ? `Maks ${listing.quantityAvailable}` : `Max ${listing.quantityAvailable}`}</span>
                              </label>
                              <div style="display:flex; gap:8px; align-items:center;">
                                <button type="button" class="btn btn-secondary btn-sm" id="qty-dec-btn" aria-label="Decrease quantity">${icon('minus', 12)}</button>
                                <input
                                  type="number"
                                  id="reserve-qty-input"
                                  class="form-input"
                                  min="1"
                                  max="${listing.quantityAvailable}"
                                  value="${Math.min(4, listing.quantityAvailable)}"
                                  required
                                  style="text-align:center; font-weight:700;"
                                />
                                <button type="button" class="btn btn-secondary btn-sm" id="qty-inc-btn" aria-label="Increase quantity">${icon('plus', 12)}</button>
                              </div>
                            </div>

                            <div class="form-group">
                              <label class="checkbox-label">
                                <input type="checkbox" id="reserve-window-confirm" required />
                                <span>
                                  ${isId ? `Saya mengonfirmasi sanggup mengambil sebelum <strong>${escapeHtml(pickupWindowStr)}</strong> dan akan memeriksa makanan saat serah terima.` : `I confirm we can collect before <strong>${escapeHtml(pickupWindowStr)}</strong> and will inspect the food at handoff.`}
                                </span>
                              </label>
                            </div>

                            <div id="reserve-error-msg" class="form-error" style="margin-bottom:10px;" hidden></div>

                            <button type="submit" class="btn btn-primary btn-block btn-lg">
                              ${isId ? 'Pesan Porsi Ini (100% Gratis)' : 'Reserve surplus food (Free)'}
                            </button>
                          </form>
                        `
                        : `
                          <div class="notice-banner" style="margin-bottom:12px;">
                            <span class="notice-banner-icon">${icon('info', 12)}</span>
                            <div>
                              ${isId ? `Makanan ini saat ini berstatus <strong>${escapeHtml(listing.status)}</strong> (${listing.quantityAvailable} ${escapeHtml(listing.unit)} tersisa) dan belum dapat dipesan.` : `This listing is currently <strong>${escapeHtml(listing.status)}</strong> (${listing.quantityAvailable} ${escapeHtml(listing.unit)} remaining) and cannot accept new reservations.`}
                            </div>
                          </div>
                          <a href="#/discover" data-link="/discover" class="btn btn-secondary btn-block">${isId ? 'Cari Makanan Lain yang Tersedia' : 'Browse other available food'}</a>
                        `
                    }
                  `
              }
            </aside>
          </div>

          <!-- 10. Related Listings -->
          ${
            relatedListings.length > 0
              ? `
                <div style="margin-top: var(--space-10); padding-top: var(--space-8); border-top: 1px solid var(--color-line);">
                  <div class="section-header" style="margin-bottom: var(--space-5);">
                    <div>
                      <span class="eyebrow">${isId ? 'Pilihan terdekat lainnya' : 'Nearby alternatives'}</span>
                      <h2 style="font-size:1.5rem;">${isId ? 'Makanan surplus terkait' : 'Related surplus listings'}</h2>
                    </div>
                    <a href="#/discover" data-link="/discover" class="btn btn-secondary btn-sm">${isId ? 'Lihat semua makanan →' : 'See all listings →'}</a>
                  </div>
                  <div class="grid-3">
                    ${relatedListings.map((item) => renderListingCard(item)).join('')}
                  </div>
                </div>
              `
              : ''
          }
        </div>
      </section>
    `;

    bindImageFallbacks(container);
    bindDetailEvents(listing);
  }

  function bindDetailEvents(listing) {
    // Photo thumbnail switcher
    const mainPhoto = container.querySelector('#detail-main-photo');
    container.querySelectorAll('[data-switch-photo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (mainPhoto) {
          mainPhoto.src = btn.getAttribute('data-switch-photo');
        }
      });
    });

    // Save toggle
    const saveBtn = container.querySelector('#detail-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const saved = appState.toggleSavedListing(listing.id);
        showToast(
          saved
            ? (isId ? 'Makanan disimpan ke dashboard Anda.' : 'Saved listing to your dashboard.')
            : (isId ? 'Dihapus dari simpanan.' : 'Removed from saved listings.'),
          'info'
        );
        renderView();
      });
    }

    // Quantity +/- stepper
    const qtyInput = container.querySelector('#reserve-qty-input');
    const decBtn = container.querySelector('#qty-dec-btn');
    const incBtn = container.querySelector('#qty-inc-btn');
    if (qtyInput && decBtn && incBtn) {
      decBtn.addEventListener('click', () => {
        const current = Number(qtyInput.value) || 1;
        qtyInput.value = Math.max(1, current - 1);
      });
      incBtn.addEventListener('click', () => {
        const current = Number(qtyInput.value) || 1;
        qtyInput.value = Math.min(listing.quantityAvailable, current + 1);
      });
    }

    // Reservation submit
    const reserveForm = container.querySelector('#detail-reserve-form');
    const errorBox = container.querySelector('#reserve-error-msg');
    if (reserveForm) {
      reserveForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const qty = Number(qtyInput?.value || 0);
        const confirmed = container.querySelector('#reserve-window-confirm')?.checked;

        if (!confirmed) {
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = isId
              ? 'Harap konfirmasi bahwa Anda dapat mengambil makanan dalam jadwal batas waktu.'
              : 'Please confirm that you can collect within the stated pickup window.';
          }
          return;
        }

        try {
          const reservation = reservationService.createReservation({
            listingId: listing.id,
            quantity: qty
          });
          lastCreatedReservation = reservation;
          showToast(
            isId
              ? `Pesanan berhasil (${reservation.quantity} ${reservation.unit}). Cek jadwal dan petunjuk penjemputan sebelum berangkat.`
              : `You're reserved (${reservation.quantity} ${reservation.unit}). Check the collection window and instructions before you go.`,
            'success'
          );
          renderView();
        } catch (err) {
          if (errorBox) {
            errorBox.hidden = false;
            errorBox.textContent = err.message;
          }
        }
      });
    }

    const openQrTicketBtn = container.querySelector('#detail-open-qr-ticket-btn');
    if (openQrTicketBtn && lastCreatedReservation) {
      openQrTicketBtn.addEventListener('click', () => {
        openQrTicketModal(lastCreatedReservation);
      });
    }

    const backToPanelBtn = container.querySelector('#detail-new-res-view-btn');
    if (backToPanelBtn) {
      backToPanelBtn.addEventListener('click', () => {
        lastCreatedReservation = null;
        renderView();
      });
    }

    // Report listing modal (PRD Section 9 & P1)
    const reportBtn = container.querySelector('#report-listing-btn');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        openModal({
          title: isId ? `Laporkan makanan: ${listing.title}` : `Report listing: ${listing.title}`,
          bodyHtml: `
            <p style="margin-bottom:12px; font-size:0.875rem;">
              ${isId
                ? 'Bantu jaga transparansi FoodLoop. Laporkan jika ada rincian alergen yang tidak jelas, batas penjemputan lewat, atau kondisi makanan tidak layak.'
                : 'Help keep FoodLoop accountable. Flag listings with missing allergen disclosures, expired pickup windows, or unsuitable food conditions.'
              }
            </p>
            <form id="modal-report-listing-form">
              <div class="form-group">
                <label for="report-reason-select" class="form-label">${isId ? 'Alasan pelaporan' : 'Reason for report'}</label>
                <select id="report-reason-select" class="form-select" required>
                  <option value="Missing allergen or storage details">${isId ? 'Rincian alergen atau penyimpanan tidak lengkap' : 'Missing allergen or storage details'}</option>
                  <option value="Collection window already passed">${isId ? 'Waktu pengambilan sudah terlewat' : 'Collection window already passed'}</option>
                  <option value="Food condition appears unsuitable at handoff">${isId ? 'Kondisi makanan tidak layak saat serah terima' : 'Food condition appears unsuitable at handoff'}</option>
                  <option value="Inaccurate pickup instructions">${isId ? 'Petunjuk penjemputan tidak akurat' : 'Inaccurate pickup instructions'}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="report-notes-input" class="form-label">${isId ? 'Catatan tambahan' : 'Additional notes'}</label>
                <textarea id="report-notes-input" class="form-textarea" placeholder="${isId ? 'Tuliskan konteks singkat untuk pemeriksaan tim...' : 'Provide brief context for platform review...'}"></textarea>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" class="btn btn-secondary btn-sm" data-modal-close>${isId ? 'Batal' : 'Cancel'}</button>
                <button type="submit" class="btn btn-danger btn-sm">${isId ? 'Kirim laporan' : 'Submit report'}</button>
              </div>
            </form>
          `,
          onMount(dialog) {
            const form = dialog.querySelector('#modal-report-listing-form');
            form.addEventListener('submit', (e) => {
              e.preventDefault();
              const reason = dialog.querySelector('#report-reason-select').value;
              const notes = dialog.querySelector('#report-notes-input').value.trim();
              appState.addReport({
                listingId: listing.id,
                listingTitle: listing.title,
                reason,
                notes
              });
              closeModal();
              showToast(isId ? 'Laporan dicatat untuk ditinjau pengelola.' : 'Report logged for platform review.', 'warning');
            });
          }
        });
      });
    }
  }

  renderView();
}

