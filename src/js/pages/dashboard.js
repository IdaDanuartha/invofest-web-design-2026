/**
 * FoodLoop Dashboard & Sub-routes (PRD Sections 16, 17, 18, 19)
 * Routes:
 * - /dashboard (Overview adapted to Provider, Recipient, or Admin role)
 * - /dashboard/listings (Provider listing management)
 * - /dashboard/reservations (Recipient reservation & collection management)
 * - /dashboard/activity (Handoff state machine ledger & CSV export)
 */

import { appState } from '../state.js';
import { listingService, localizeListing } from '../services/listingService.js';
import { reservationService, localizeReservation } from '../services/reservationService.js';
import { renderListingCard, getStatusBadgeHtml } from '../components/listingCard.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { FOOD_CATEGORIES } from '../data/seed.js';
import { bindImageFallbacks } from '../../utils/accessibility.js';
import { escapeHtml } from '../../utils/validation.js';
import {
  formatNumber,
  formatPickupWindow,
  formatDateTime,
  formatDeadlineBadge,
  getCategoryLabel
} from '../../utils/formatDate.js';
import { icon } from '../components/icons.js';
import { getLanguage, t } from '../services/i18nService.js';
import { openQrTicketModal, openQrScannerModal } from '../components/qrModal.js';

function getReservationStatusBadge(status) {
  const isId = getLanguage() === 'id';
  switch (status) {
    case 'reserved':
      return `<span class="badge badge-citrus">${icon('statusDot', 7)} ${isId ? 'Dipesan - Menunggu Penjemputan' : 'Reserved - Awaiting pickup'}</span>`;
    case 'collected':
      return `<span class="badge badge-forest">${icon('statusHalf', 9)} ${isId ? 'Diambil - Konfirmasi Selesai' : 'Collected - Confirm completion'}</span>`;
    case 'completed':
      return `<span class="badge badge-success">${icon('check', 12)} ${isId ? 'Penyerahan Selesai' : 'Handoff completed'}</span>`;
    case 'cancelled':
      return `<span class="badge badge-expired">${icon('x', 11)} ${isId ? 'Dibatalkan' : 'Cancelled'}</span>`;
    default:
      return `<span class="badge badge-neutral">${escapeHtml(status)}</span>`;
  }
}

function renderDashboardSidebar(activeRoute, user) {
  const isActive = (r) => activeRoute === r;
  const lang = getLanguage();
  const isId = lang === 'id';
  const role = user.role || 'recipient';
  const state = appState.getState();

  // Role badge display label
  const roleDisplayLabel = role === 'provider'
    ? (isId ? 'Penyedia Makanan' : 'Food Provider')
    : role === 'recipient'
    ? (isId ? 'Organisasi Komunitas' : 'Community Recipient')
    : role === 'individual'
    ? (isId ? 'Warga / Individu' : 'Individual Recipient')
    : (isId ? 'Platform Steward (Admin)' : 'Platform Steward');

  // Compute active counts for badges
  const activeListingsCount = state.listings.filter((l) =>
    (role === 'admin' || l.providerId === user.id) && (l.status === 'available' || l.status === 'almost-reserved')
  ).length;

  const activeReservationsCount = state.reservations.filter((r) =>
    (role === 'provider' ? r.providerId === user.id : role === 'admin' ? true : r.recipientId === user.id) &&
    (r.status === 'reserved' || r.status === 'collected')
  ).length;

  let navLinksHtml = '';

  if (role === 'provider') {
    // PROVIDER NAVIGATION (Food businesses)
    navLinksHtml = `
      <a href="#/dashboard" data-link="/dashboard" class="dashboard-nav-link ${isActive('/dashboard') ? 'is-active' : ''}">
        <span>${isId ? 'Ringkasan Outlet' : 'Outlet Overview'}</span>
      </a>
      <a href="#/dashboard/listings" data-link="/dashboard/listings" class="dashboard-nav-link ${isActive('/dashboard/listings') ? 'is-active' : ''}">
        <span>${isId ? 'Surplus Makanan Saya' : 'My Surplus Listings'}</span>
        ${activeListingsCount > 0 ? `<span class="badge badge-forest" style="font-size:0.68rem; padding:1px 6px;">${activeListingsCount}</span>` : ''}
      </a>
      <a href="#/dashboard/reservations" data-link="/dashboard/reservations" class="dashboard-nav-link ${isActive('/dashboard/reservations') ? 'is-active' : ''}">
        <span>${isId ? 'Pesanan Masuk' : 'Incoming Orders'}</span>
        ${activeReservationsCount > 0 ? `<span class="badge badge-citrus" style="font-size:0.68rem; padding:1px 6px;">${activeReservationsCount}</span>` : ''}
      </a>
      <a href="#/dashboard/activity" data-link="/dashboard/activity" class="dashboard-nav-link ${isActive('/dashboard/activity') ? 'is-active' : ''}">
        <span>${isId ? 'Riwayat Serah Terima' : 'Handoff Ledger'}</span>
      </a>
      <a href="#/assistant" data-link="/assistant" class="dashboard-nav-link">
        <span>${icon('sparkle', 12)} ${isId ? 'Asisten AI FoodLoop' : 'FoodLoop Assist'}</span>
      </a>
      <a href="#/profile" data-link="/profile" class="dashboard-nav-link">
        <span>${isId ? 'Profil & Outlet' : 'Profile & Outlet'}</span>
      </a>
    `;
  } else if (role === 'recipient') {
    // COMMUNITY RECIPIENT NAVIGATION (Charities, Community Kitchens)
    navLinksHtml = `
      <a href="#/dashboard" data-link="/dashboard" class="dashboard-nav-link ${isActive('/dashboard') ? 'is-active' : ''}">
        <span>${isId ? 'Ringkasan Komunitas' : 'Overview'}</span>
      </a>
      <a href="#/dashboard/reservations" data-link="/dashboard/reservations" class="dashboard-nav-link ${isActive('/dashboard/reservations') ? 'is-active' : ''}">
        <span>${isId ? 'Reservasi & Tiket QR' : 'Reservations & QR'}</span>
        ${activeReservationsCount > 0 ? `<span class="badge badge-forest" style="font-size:0.68rem; padding:1px 6px;">${activeReservationsCount}</span>` : ''}
      </a>
      <a href="#/dashboard/activity" data-link="/dashboard/activity" class="dashboard-nav-link ${isActive('/dashboard/activity') ? 'is-active' : ''}">
        <span>${isId ? 'Riwayat Penjemputan' : 'Collection History'}</span>
      </a>
      <a href="#/discover" data-link="/discover" class="dashboard-nav-link">
        <span>${isId ? 'Cari Makanan di Sekitar' : 'Discover Food'}</span>
      </a>
      <a href="#/profile" data-link="/profile" class="dashboard-nav-link">
        <span>${isId ? 'Profil Organisasi' : 'Organization Profile'}</span>
      </a>
    `;
  } else if (role === 'individual') {
    // INDIVIDUAL RECIPIENT NAVIGATION (Nearby Residents)
    navLinksHtml = `
      <a href="#/dashboard" data-link="/dashboard" class="dashboard-nav-link ${isActive('/dashboard') ? 'is-active' : ''}">
        <span>${isId ? 'Ringkasan Warga' : 'Overview'}</span>
      </a>
      <a href="#/dashboard/reservations" data-link="/dashboard/reservations" class="dashboard-nav-link ${isActive('/dashboard/reservations') ? 'is-active' : ''}">
        <span>${isId ? 'Tiket Pengambilan Saya' : 'My Pickup Tickets'}</span>
        ${activeReservationsCount > 0 ? `<span class="badge badge-forest" style="font-size:0.68rem; padding:1px 6px;">${activeReservationsCount}</span>` : ''}
      </a>
      <a href="#/discover" data-link="/discover" class="dashboard-nav-link">
        <span>${isId ? 'Cari Makanan Gratis' : 'Find Free Food'}</span>
      </a>
      <a href="#/profile" data-link="/profile" class="dashboard-nav-link">
        <span>${isId ? 'Profil Akun' : 'My Profile'}</span>
      </a>
    `;
  } else {
    // ADMIN / PLATFORM STEWARD NAVIGATION
    navLinksHtml = `
      <a href="#/dashboard" data-link="/dashboard" class="dashboard-nav-link ${isActive('/dashboard') ? 'is-active' : ''}">
        <span>${isId ? 'Ringkasan Ekosistem' : 'Ecosystem Overview'}</span>
      </a>
      <a href="#/dashboard/listings" data-link="/dashboard/listings" class="dashboard-nav-link ${isActive('/dashboard/listings') ? 'is-active' : ''}">
        <span>${isId ? 'Monitoring Semua Surplus' : 'All Listings Monitor'}</span>
        ${activeListingsCount > 0 ? `<span class="badge badge-forest" style="font-size:0.68rem; padding:1px 6px;">${activeListingsCount}</span>` : ''}
      </a>
      <a href="#/dashboard/reservations" data-link="/dashboard/reservations" class="dashboard-nav-link ${isActive('/dashboard/reservations') ? 'is-active' : ''}">
        <span>${isId ? 'Semua Reservasi & Handoff' : 'All Handoffs'}</span>
        ${activeReservationsCount > 0 ? `<span class="badge badge-citrus" style="font-size:0.68rem; padding:1px 6px;">${activeReservationsCount}</span>` : ''}
      </a>
      <a href="#/dashboard/activity" data-link="/dashboard/activity" class="dashboard-nav-link ${isActive('/dashboard/activity') ? 'is-active' : ''}">
        <span>${isId ? 'Audit Log & Ledger CSV' : 'Audit Ledger CSV'}</span>
      </a>
      <a href="#/profile" data-link="/profile" class="dashboard-nav-link">
        <span>${isId ? 'Pengaturan Platform' : 'Platform Settings'}</span>
      </a>
    `;
  }

  return `
    <aside class="dashboard-sidebar" aria-label="Dashboard navigation">
      <div style="padding-bottom:12px; margin-bottom:12px; border-bottom:1px solid var(--color-line);">
        <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-muted); font-weight:700;">
          ${isId ? 'Ruang Kerja Aktif' : 'Active Workspace'}
        </div>
        <div style="font-weight:700; font-size:1.05rem; margin-top:3px; line-height:1.2;">${escapeHtml(user.name)}</div>
        <span class="badge ${role === 'provider' ? 'badge-forest' : role === 'admin' ? 'badge-citrus' : 'badge-available'}" style="margin-top:6px; font-size:0.72rem; padding:2px 8px;">
          ${escapeHtml(roleDisplayLabel)}
        </span>
      </div>

      <nav class="dashboard-nav">
        ${navLinksHtml}
      </nav>
    </aside>
  `;
}

export function renderDashboardPage(container, { pathname = '/dashboard' } = {}) {
  let listingTab = 'all';
  let listingSearch = '';
  let listingCategory = 'all';
  let reservationTab = 'all';

  function renderView() {
    const state = appState.getState();
    const user = appState.getCurrentUser() || state.users[0];
    const metrics = reservationService.computeImpactMetrics();

    if (pathname === '/dashboard/listings') {
      renderMyListingsView(state, user);
    } else if (pathname === '/dashboard/reservations') {
      renderMyReservationsView(state, user);
    } else if (pathname === '/dashboard/activity') {
      renderActivityHandoffsView(state, user);
    } else {
      renderOverviewView(state, user, metrics);
    }

    bindImageFallbacks(container);
    bindSharedDashboardActions();
  }

  function renderOverviewView(state, user, metrics) {
    const isProvider = user.role === 'provider';
    const isRecipient = user.role === 'recipient';
    const isIndividual = user.role === 'individual';
    const isAdmin = user.role === 'admin';
    const lang = getLanguage();
    const isId = lang === 'id';

    // Strict role-based dataset filtering (No cross-contamination between roles)
    const localizedAllListings = state.listings.map(localizeListing);
    const localizedAllReservations = state.reservations.map(localizeReservation);

    const providerListings = isAdmin
      ? localizedAllListings
      : localizedAllListings.filter((l) => l.providerId === user.id);

    const providerReservations = isAdmin
      ? localizedAllReservations
      : localizedAllReservations.filter((r) => r.providerId === user.id);

    const recipientReservations = isAdmin
      ? localizedAllReservations
      : localizedAllReservations.filter((r) => r.recipientId === user.id);

    const savedListings = localizedAllListings.filter((l) => (state.savedListingIds || []).includes(l.id));

    const alertsListings = providerListings.filter(
      (l) =>
        l.status === 'draft' ||
        (l.allergens || []).some((a) => /confirm|not sure/i.test(a))
    );

    // Compute portions received or shared
    const myCompletedRes = (isProvider ? providerReservations : recipientReservations).filter((r) => r.status === 'completed');
    const myPortionsCount = myCompletedRes.reduce((sum, r) => sum + (r.quantity || 0), 0);

    const activeResQueue = isProvider ? providerReservations : recipientReservations;

    container.innerHTML = `
      <div class="container">
        <div class="dashboard-shell">
          ${renderDashboardSidebar('/dashboard', user)}

          <div>
            <!-- Greeting & Contextual Quick Action -->
            <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom: var(--space-5);">
              <div>
                <span class="eyebrow">${
                  isProvider
                    ? (isId ? 'Dashboard Mitra Penyedia' : 'Provider Operations')
                    : isIndividual
                    ? (isId ? 'Dashboard Warga & Penerima' : 'Individual Dashboard')
                    : isRecipient
                    ? (isId ? 'Dashboard Dapur & Komunitas' : 'Community Kitchen Dashboard')
                    : (isId ? 'Dashboard Pengawas Platform' : 'Platform Oversight')
                }</span>
                <h1 style="font-size:1.85rem; line-height:1.2;">${isId ? 'Halo' : 'Hello'}, ${escapeHtml(user.name)}</h1>
                <p style="margin-top:4px; font-size:0.92rem; color:var(--color-ink-soft);">
                  ${
                    isProvider
                      ? (isId ? 'Kelola stok surplus makanan aktif dari outlet Anda, pantau pesanan dari komunitas, dan verifikasi serah terima dengan pemindai QR.' : 'Manage your active surplus listings, review recipient reservations, and confirm collection handoffs.')
                      : isIndividual
                      ? (isId ? 'Cek tiket pengambilan makanan gratis Anda, petunjuk arah ke lokasi dapur/toko roti penyedia, dan makanan favorit yang Anda simpan.' : 'Track your active collection tickets, pickup instructions from providers, and saved food listings.')
                      : isRecipient
                      ? (isId ? 'Pantau porsi makanan surplus yang dipesan untuk dapur umum/komunitas, buka tiket QR digital, dan koordinasikan penjemputan.' : 'Track your community reservations, open digital QR tickets, and coordinate timely pickups in Denpasar & Badung.')
                      : (isId ? 'Pantau seluruh metrik penyelamatan makanan surplus di Bali, status verifikasi serah terima antar mitra, dan antrean laporan masyarakat.' : 'Complete oversight of all surplus food flows, community safety reports, and handoff verification across Bali.')
                  }
                </p>
              </div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                ${
                  isProvider || isAdmin
                    ? `
                      <button type="button" class="btn btn-secondary btn-sm" id="dashboard-scan-qr-btn">
                        ${icon('scan', 13)} ${isId ? 'Scan QR Penjemputan' : 'Scan Pickup QR'}
                      </button>
                      <a href="#/donate" data-link="/donate" class="btn btn-primary btn-sm">${icon('plus', 12)} ${isId ? 'Pasang Surplus' : 'Create Listing'}</a>
                    `
                    : `
                      <a href="#/discover" data-link="/discover" class="btn btn-primary btn-sm">${icon('search', 12)} ${isId ? 'Cari Makanan di Sekitar' : 'Explore Food'}</a>
                      <a href="#/dashboard/reservations" data-link="/dashboard/reservations" class="btn btn-secondary btn-sm">${icon('qrCode', 12)} ${isId ? 'Tiket QR Saya' : 'My QR Tickets'}</a>
                    `
                }
                <a href="#/assistant" data-link="/assistant" class="btn btn-secondary btn-sm">${icon('sparkle', 12)} FoodLoop Assist</a>
              </div>
            </div>

            <!-- Alerts for Provider Listings Missing Key Details (PRD Section 16) -->
            ${
              isProvider && alertsListings.length > 0
                ? `
                  <div class="notice-banner notice-banner-warning" style="margin-bottom: var(--space-5); align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px;">
                    <div style="display:flex; align-items:flex-start; gap:12px; min-width:0; flex:1;">
                      <span class="notice-banner-icon">${icon('alertTriangle', 12)}</span>
                      <div>
                        <strong>${isId ? `Perlu tindakan pada ${alertsListings.length} listing:` : `Action needed on ${alertsListings.length} listings:`}</strong>
                        <div style="font-size:0.85rem; margin-top:2px;">
                          ${isId ? 'Draft atau listing dengan catatan alergen belum pasti wajib diverifikasi sebelum jam penjemputan warga.' : 'Drafts or listings with unconfirmed allergen notes should be verified before collection time.'}
                        </div>
                      </div>
                    </div>
                    <a href="#/dashboard/listings" data-link="/dashboard/listings" class="btn btn-secondary btn-sm" style="flex-shrink:0;">${isId ? 'Periksa Listing Saya' : 'Review My Listings'}</a>
                  </div>
                `
                : ''
            }

            <!-- KPI Summary Row Adjusted Per Role -->
            <div class="kpi-grid" style="margin-bottom: var(--space-6);">
              ${
                isProvider
                  ? `
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Surplus Aktif Outlet' : 'Active Outlet Listings'}</div>
                      <div class="kpi-value">${providerListings.filter((l) => l.status === 'available' || l.status === 'almost-reserved').length}</div>
                      <div class="kpi-sub">${isId ? 'Tersedia untuk dipesan' : 'Open for pickup'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Menunggu Penjemputan' : 'Awaiting Collection'}</div>
                      <div class="kpi-value">${providerReservations.filter((r) => r.status === 'reserved' || r.status === 'collected').length}</div>
                      <div class="kpi-sub">${isId ? 'Pesanan siap diambil' : 'Ready for pickup'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Total Porsi Tersalurkan' : 'Portions Shared'}</div>
                      <div class="kpi-value">${formatNumber(myPortionsCount)}</div>
                      <div class="kpi-sub">${isId ? 'Dari outlet ini' : 'From this outlet'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Estimasi CO2 Dicegah' : 'CO2 Avoided'}</div>
                      <div class="kpi-value">${Math.round(myPortionsCount * 1.8)} kg</div>
                      <div class="kpi-sub">${isId ? 'Dampak lingkungan' : 'Environmental saving'}</div>
                    </div>
                  `
                  : isRecipient || isIndividual
                  ? `
                    <div class="kpi-card">
                      <div class="kpi-label">${isIndividual ? (isId ? 'Tiket Pengambilan Aktif' : 'Active Tickets') : (isId ? 'Reservasi Aktif Komunitas' : 'Active Reservations')}</div>
                      <div class="kpi-value">${recipientReservations.filter((r) => r.status === 'reserved' || r.status === 'collected').length}</div>
                      <div class="kpi-sub">${isId ? 'Menunggu diambil' : 'Scheduled for pickup'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Jadwal Hari Ini' : 'Due for Pickup Today'}</div>
                      <div class="kpi-value">${recipientReservations.filter((r) => r.status === 'reserved').length}</div>
                      <div class="kpi-sub">${isId ? 'Periksa batas jam ambil' : 'Check time window'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Total Porsi Diterima' : 'Portions Collected'}</div>
                      <div class="kpi-value">${formatNumber(myPortionsCount)}</div>
                      <div class="kpi-sub">${isId ? 'Tercatat di riwayat' : 'Verified collections'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Makanan Disimpan' : 'Saved Listings'}</div>
                      <div class="kpi-value">${savedListings.length}</div>
                      <div class="kpi-sub">${isId ? 'Pantau ketersediaan' : 'Bookmarked items'}</div>
                    </div>
                  `
                  : `
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Semua Surplus Bali' : 'All Bali Listings'}</div>
                      <div class="kpi-value">${state.listings.length}</div>
                      <div class="kpi-sub">${isId ? 'Aktif & terdaftar' : 'Total listings'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Reservasi Berjalan' : 'Active Handoffs'}</div>
                      <div class="kpi-value">${state.reservations.filter((r) => r.status === 'reserved' || r.status === 'collected').length}</div>
                      <div class="kpi-sub">${isId ? 'Dalam proses serah terima' : 'In transit'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Total Porsi Terselamatkan' : 'Portions Saved'}</div>
                      <div class="kpi-value">${formatNumber(metrics.portionsRedistributed)}</div>
                      <div class="kpi-sub">${isId ? 'Seluruh ekosistem Bali' : 'Bali ecosystem'}</div>
                    </div>
                    <div class="kpi-card">
                      <div class="kpi-label">${isId ? 'Laporan Komunitas' : 'Incident Reports'}</div>
                      <div class="kpi-value">${(state.reports || []).length}</div>
                      <div class="kpi-sub">${isId ? 'Butuh moderasi admin' : 'Pending review'}</div>
                    </div>
                  `
              }
            </div>

            <!-- Active Reservations & Handoff Queue -->
            <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-md); padding: var(--space-5); margin-bottom: var(--space-6);">
              <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom: var(--space-4);">
                <div>
                  <h2 style="font-size:1.25rem;">
                    ${
                      isProvider
                        ? (isId ? 'Pesanan Masuk & Antrean Penjemputan' : 'Incoming Reservations & Handoff Queue')
                        : isIndividual
                        ? (isId ? 'Tiket Pengambilan Makanan Saya' : 'My Food Collection Tickets')
                        : isRecipient
                        ? (isId ? 'Jadwal Penjemputan & Reservasi Komunitas' : 'Your Upcoming Collections & Reservations')
                        : (isId ? 'Antrean Serah Terima Se-Bali' : 'Bali-wide Handoff Ledger Queue')
                    }
                  </h2>
                  <p style="font-size:0.82rem; color:var(--color-muted);">
                    ${isId ? 'Alur status resmi: DIPESAN (RESERVED) → SUDAH DIAMBIL (COLLECTED) → SELESAI (COMPLETED).' : 'State flow: RESERVED → COLLECTED → COMPLETED.'}
                  </p>
                </div>
                <a
                  href="#/dashboard/reservations"
                  data-link="/dashboard/reservations"
                  class="btn btn-secondary btn-sm"
                >
                  ${isId ? 'Buka Pengelola Reservasi →' : 'Open full reservation manager →'}
                </a>
              </div>

              <div style="display:flex; flex-direction:column; gap:12px;">
                ${
                  activeResQueue.length === 0
                    ? `
                      <div class="state-panel" style="padding: var(--space-4); text-align:center;">
                        <p style="margin-bottom:8px; font-weight:500;">
                          ${
                            isProvider
                              ? (isId ? 'Belum ada pesanan masuk untuk outlet Anda saat ini. Listing surplus yang Anda buat akan muncul di sini saat dipesan.' : 'No incoming reservations for your outlet yet.')
                              : isIndividual
                              ? (isId ? 'Anda belum memiliki pesanan aktif. Pesan porsi makanan surplus gratis dari restoran atau toko roti di Bali.' : 'You do not have any active food collection tickets yet.')
                              : isRecipient
                              ? (isId ? 'Belum ada reservasi aktif untuk dapur umum Anda. Temukan surplus makanan berkualitas di sekitar Anda.' : 'No upcoming community kitchen collections yet.')
                              : (isId ? 'Tidak ada reservasi aktif yang sedang berjalan saat ini.' : 'No active reservations in the system.')
                          }
                        </p>
                        ${
                          !isProvider
                            ? `<a href="#/discover" data-link="/discover" class="btn btn-primary btn-sm">${isId ? 'Cari Makanan di Sekitar' : 'Discover Food'}</a>`
                            : `<a href="#/donate" data-link="/donate" class="btn btn-primary btn-sm">${isId ? '+ Pasang Surplus Makanan' : '+ Create Listing'}</a>`
                        }
                      </div>
                    `
                    : activeResQueue
                        .slice(0, 5)
                        .map((res) => renderReservationActionRow(res, isProvider))
                        .join('')
                }
              </div>
            </div>

            ${
              isProvider
                ? `
                  <!-- Provider Active Listings Preview -->
                  <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-md); padding: var(--space-5); margin-bottom: var(--space-6);">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-4);">
                      <h2 style="font-size:1.25rem;">${isId ? 'Surplus Makanan Outlet Anda' : 'Your Surplus Listings'}</h2>
                      <a href="#/dashboard/listings" data-link="/dashboard/listings" class="btn btn-secondary btn-sm">${isId ? 'Kelola Semua Listing →' : 'Manage All Listings →'}</a>
                    </div>
                    <div class="data-table-wrap">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>${isId ? 'Listing Makanan' : 'Listing'}</th>
                            <th>${isId ? 'Sisa Kuota' : 'Remaining'}</th>
                            <th>${isId ? 'Batas Jam Ambil' : 'Collection Deadline'}</th>
                            <th>Status</th>
                            <th>${isId ? 'Aksi' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${
                            providerListings.length === 0
                              ? `<tr><td colspan="5" style="text-align:center; padding:16px;">${isId ? 'Belum ada listing. Klik tombol di atas untuk mendaftarkan surplus.' : 'No listings found.'}</td></tr>`
                              : providerListings
                                  .slice(0, 5)
                                  .map(
                                    (l) => `
                                      <tr>
                                        <td>
                                          <a href="#/food/${escapeHtml(l.id)}" data-link="/food/${escapeHtml(l.id)}" style="font-weight:700; text-decoration:underline;">
                                            ${escapeHtml(l.title)}
                                          </a>
                                          <div style="font-size:0.75rem; color:var(--color-muted);">${icon('mapPin', 12)} ${escapeHtml(l.area)}</div>
                                        </td>
                                        <td style="font-weight:700;">${l.quantityAvailable} / ${l.quantityTotal} ${escapeHtml(l.unit)}</td>
                                        <td>${escapeHtml(formatDeadlineBadge(l.pickupEnd))}</td>
                                        <td>${getStatusBadgeHtml(l)}</td>
                                        <td>
                                          <a href="#/dashboard/listings" data-link="/dashboard/listings" class="btn btn-secondary btn-sm">${isId ? 'Kelola' : 'Manage'}</a>
                                        </td>
                                      </tr>
                                    `
                                  )
                                  .join('')
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                `
                : `
                  <!-- Recipient Saved Listings & Preferences (PRD Section 16) -->
                  <div style="margin-bottom: var(--space-6);" id="saved">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-4);">
                      <div>
                        <h2 style="font-size:1.25rem;">${isId ? 'Makanan yang Disimpan' : 'Saved Listings'} (${savedListings.length})</h2>
                        <p style="font-size:0.82rem; color:var(--color-muted);">
                          ${isId ? 'Daftar makanan surplus yang Anda tandai untuk dipantau ketersediaannya.' : 'Food listings you bookmarked for quick access.'}
                        </p>
                      </div>
                      <a href="#/discover" data-link="/discover" class="btn btn-secondary btn-sm">${isId ? 'Jelajahi Makanan →' : 'Browse Discover →'}</a>
                    </div>
                    ${
                      savedListings.length === 0
                        ? `<div class="state-panel"><p>${isId ? 'Belum ada makanan disimpan. Klik ikon bookmark pada makanan di halaman Temukan Makanan.' : 'No saved listings yet.'}</p></div>`
                        : `<div class="grid-2">${savedListings.slice(0, 2).map((l) => renderListingCard(l, { showSaveButton: true, isSaved: true })).join('')}</div>`
                    }
                  </div>
                `
            }

            <!-- Recent Activity Stream -->
            <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-md); padding: var(--space-5);">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-3);">
                <h2 style="font-size:1.15rem;">${isId ? 'Riwayat Serah Terima Terakhir' : 'Recent Activity & Handoff Events'}</h2>
                <a href="#/dashboard/activity" data-link="/dashboard/activity" class="btn btn-ghost btn-sm">${isId ? 'Log Lengkap →' : 'Full Audit Log →'}</a>
              </div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${state.activity
                  .filter((ev) => isAdmin || ev.actorId === user.id || (ev.summary && ev.summary.toLowerCase().includes(user.name.toLowerCase())))
                  .slice(0, 5)
                  .map(
                    (ev) => `
                      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; background:var(--color-cream); border-radius:var(--radius-xs); font-size:0.85rem;">
                        <span>${escapeHtml(ev.summary)}</span>
                        <span style="font-size:0.75rem; color:var(--color-muted); white-space:nowrap;">${escapeHtml(formatDateTime(ev.createdAt))}</span>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 17. My Listings - /dashboard/listings (PRD Section 17)
   */
  function renderMyListingsView(state, user) {
    const isProvider = user.role === 'provider';
    const isAdmin = user.role === 'admin';
    const lang = getLanguage();
    const isId = lang === 'id';

    // If non-provider attempts to open My Listings, guide them gently
    if (!isProvider && !isAdmin) {
      container.innerHTML = `
        <div class="container">
          <div class="dashboard-shell">
            ${renderDashboardSidebar('/dashboard/listings', user)}

            <div>
              <div class="notice-banner" style="margin-bottom: var(--space-5);">
                <span class="notice-banner-icon">${icon('info', 12)}</span>
                <div>
                  <strong>${isId ? 'Menu Khusus Mitra Penyedia Makanan (Food Provider)' : 'Food Provider Management Only'}</strong>
                  <p style="margin-top: 4px; font-size: 0.88rem;">
                    ${isId
                      ? `Anda saat ini masuk sebagai <strong>${escapeHtml(user.name)} (${escapeHtml(user.role)})</strong>. Menu ini digunakan oleh restoran, toko roti, dan pelaku usaha kuliner untuk memasang dan mengelola stok makanan surplus. Sebagai penerima makanan, Anda dapat melihat tiket dan jadwal penjemputan di menu Reservasi Saya.`
                      : `You are currently logged in as <strong>${escapeHtml(user.name)} (${escapeHtml(user.role)})</strong>. This section is reserved for food businesses to list and manage surplus items.`
                    }
                  </p>
                </div>
                <div style="display:flex; gap:8px; margin-top:8px;">
                  <a href="#/dashboard/reservations" data-link="/dashboard/reservations" class="btn btn-primary btn-sm">
                    ${isId ? 'Buka Reservasi Saya →' : 'View My Reservations →'}
                  </a>
                  <a href="#/discover" data-link="/discover" class="btn btn-secondary btn-sm">
                    ${isId ? 'Cari Makanan di Sekitar' : 'Discover Food'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Provider sees only their own listings; Admin sees all listings
    const baseListings = (isAdmin
      ? state.listings
      : state.listings.filter((l) => l.providerId === user.id)
    ).map(localizeListing);

    const filtered = baseListings.filter((item) => {
      if (listingTab === 'drafts' && item.status !== 'draft') return false;
      if (listingTab === 'active' && item.status !== 'available' && item.status !== 'almost-reserved') return false;
      if (listingTab === 'reserved' && item.status !== 'reserved') return false;
      if (listingTab === 'completed' && item.status !== 'completed') return false;
      if (listingTab === 'expired' && item.status !== 'expired' && item.status !== 'unavailable') return false;

      if (listingCategory !== 'all' && item.category !== listingCategory) return false;
      if (listingSearch.trim()) {
        const q = listingSearch.trim().toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.area.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    container.innerHTML = `
      <div class="container">
        <div class="dashboard-shell">
          ${renderDashboardSidebar('/dashboard/listings', user)}

          <div>
            <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom: var(--space-5);">
              <div>
                <span class="eyebrow">${isAdmin ? 'Platform Monitoring' : (isId ? 'Manajemen Stok Surplus' : 'Provider Management')}</span>
                <h1 style="font-size:1.85rem; line-height:1.2;">${isAdmin ? (isId ? 'Monitoring Seluruh Surplus Bali' : 'All Bali Surplus Listings') : (isId ? 'Surplus Makanan Saya' : 'My Surplus Listings')}</h1>
                <p style="margin-top:4px; font-size:0.92rem; color:var(--color-ink-soft);">
                  ${
                    isAdmin
                      ? (isId ? 'Pengawasan ketersediaan dan kepatuhan alergen seluruh listing surplus di Bali.' : 'Oversight of all active food listings across Bali providers.')
                      : (isId ? `Daftar makanan surplus yang Anda daftarkan dari outlet ${escapeHtml(user.name)}. Ubah status, perbarui sisa porsi, atau buat listing baru.` : 'Edit details, publish drafts, pause availability, or inspect reservations.')
                  }
                </p>
              </div>
              <a href="#/donate" data-link="/donate" class="btn btn-primary btn-sm">${icon('plus', 12)} ${isId ? 'Pasang Surplus Baru' : 'Create new listing'}</a>
            </div>

            <!-- Tabs & Filters (PRD Section 17) -->
            <div class="discover-toolbar" style="margin-bottom: var(--space-4);">
              <div class="segmented-tabs" role="tablist" aria-label="Filter listings by status">
                ${[
                  { id: 'all', label: isId ? 'Semua' : 'All' },
                  { id: 'drafts', label: 'Drafts' },
                  { id: 'active', label: isId ? 'Aktif' : 'Active' },
                  { id: 'reserved', label: isId ? 'Dipesan' : 'Reserved' },
                  { id: 'completed', label: isId ? 'Selesai' : 'Completed' },
                  { id: 'expired', label: isId ? 'Selesai / Berakhir' : 'Expired / Paused' }
                ]
                  .map(
                    (t) => `
                      <button
                        type="button"
                        role="tab"
                        aria-selected="${listingTab === t.id}"
                        class="segmented-tab ${listingTab === t.id ? 'is-active' : ''}"
                        data-listing-tab="${t.id}"
                      >
                        ${escapeHtml(t.label)}
                      </button>
                    `
                  )
                  .join('')}
              </div>

              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <input
                  type="search"
                  id="my-listings-search"
                  class="form-input"
                  style="width:200px; min-height:36px; padding:4px 10px; font-size:0.82rem;"
                  placeholder="${isId ? 'Cari judul / area...' : 'Search title or area...'}"
                  value="${escapeHtml(listingSearch)}"
                />
                <select id="my-listings-cat" class="form-select" style="width:auto; min-height:36px; padding:4px 10px; font-size:0.82rem;">
                  <option value="all" ${listingCategory === 'all' ? 'selected' : ''}>${isId ? 'Semua kategori' : 'All categories'}</option>
                  ${FOOD_CATEGORIES.map(
                    (c) => `<option value="${escapeHtml(c.id)}" ${listingCategory === c.id ? 'selected' : ''}>${escapeHtml(c.label)}</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            ${
              filtered.length === 0
                ? `
                  <div class="state-panel">
                    <h3>${isId ? 'Tidak ada listing pada tab ini' : 'No listings in this tab'}</h3>
                    <p>${isId ? 'Coba ganti tab filter status atau buat listing surplus makanan baru.' : 'Try switching status tabs or create a new surplus listing.'}</p>
                    <a href="#/donate" data-link="/donate" class="btn btn-primary btn-sm">${isId ? '+ Pasang Surplus' : 'Create listing'}</a>
                  </div>
                `
                : `
                  <div style="display:flex; flex-direction:column; gap:12px;">
                    ${filtered
                      .map((item) => {
                        const resCount = reservationService.getReservationsForListing(item.id).length;
                        return `
                          <article style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-md); padding: var(--space-4); display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px;">
                            <div style="flex:1; min-width:240px;">
                              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                                ${getStatusBadgeHtml(item)}
                                <span class="badge badge-neutral">${escapeHtml(getCategoryLabel(item.category))}</span>
                                <span style="font-size:0.78rem; color:var(--color-muted);">ID: ${escapeHtml(item.id)}</span>
                                ${isAdmin ? `<span class="badge badge-citrus" style="font-size:0.7rem;">${escapeHtml(item.providerName)}</span>` : ''}
                              </div>
                              <h3 style="font-size:1.15rem;">
                                <a href="#/food/${escapeHtml(item.id)}" data-link="/food/${escapeHtml(item.id)}" style="text-decoration:underline;">
                                  ${escapeHtml(item.title)}
                                </a>
                              </h3>
                              <div style="font-size:0.82rem; color:var(--color-muted); margin-top:4px;">
                                ${icon('mapPin', 12)} ${escapeHtml(item.area)} • <strong>${item.quantityAvailable} / ${item.quantityTotal} ${escapeHtml(item.unit)}</strong> ${isId ? 'tersisa' : 'remaining'} • ${escapeHtml(formatPickupWindow(item.pickupStart, item.pickupEnd))} • <strong>${resCount}</strong> ${isId ? 'reservasi' : 'reservations'}
                              </div>
                            </div>

                            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                              <a href="#/food/${escapeHtml(item.id)}" data-link="/food/${escapeHtml(item.id)}" class="btn btn-secondary btn-sm">
                                ${isId ? 'Lihat Detail' : 'View details'}
                              </a>
                              <button type="button" class="btn btn-secondary btn-sm" data-edit-listing="${escapeHtml(item.id)}">
                                ${isId ? 'Edit' : 'Edit'}
                              </button>
                              ${
                                item.status === 'draft'
                                  ? `<button type="button" class="btn btn-primary btn-sm" data-publish-draft="${escapeHtml(item.id)}">${isId ? 'Publikasikan' : 'Publish draft'}</button>`
                                  : item.status === 'expired' || item.status === 'unavailable'
                                  ? `<button type="button" class="btn btn-primary btn-sm" data-reactivate-listing="${escapeHtml(item.id)}">${isId ? 'Aktifkan Lagi' : 'Re-open'}</button>`
                                  : `<button type="button" class="btn btn-danger-outline btn-sm" data-pause-listing="${escapeHtml(item.id)}">${isId ? 'Jeda Ketersediaan' : 'Pause / Unavailable'}</button>`
                              }
                            </div>
                          </article>
                        `;
                      })
                      .join('')}
                  </div>
                `
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 18. My Reservations - /dashboard/reservations (PRD Section 18)
   */
  function renderMyReservationsView(state, user) {
    const isProvider = user.role === 'provider';
    const isRecipient = user.role === 'recipient';
    const isIndividual = user.role === 'individual';
    const isAdmin = user.role === 'admin';
    const lang = getLanguage();
    const isId = lang === 'id';

    // Strict role-based dataset filtering:
    // Provider sees incoming orders for their food.
    // Recipient / Individual sees their own bookings.
    // Admin sees all reservations across Bali.
    const userReservations = (isAdmin
      ? state.reservations
      : isProvider
      ? state.reservations.filter((r) => r.providerId === user.id)
      : state.reservations.filter((r) => r.recipientId === user.id)
    ).map(localizeReservation);

    const allRes = userReservations.filter((r) => {
      if (reservationTab === 'upcoming') return r.status === 'reserved';
      if (reservationTab === 'awaiting') return r.status === 'reserved' || r.status === 'collected';
      if (reservationTab === 'completed') return r.status === 'completed';
      if (reservationTab === 'cancelled') return r.status === 'cancelled';
      return true;
    });

    const pageTitle = isProvider
      ? (isId ? 'Pesanan Masuk & Penjemputan' : 'Incoming Reservations & Handoffs')
      : isIndividual
      ? (isId ? 'Tiket Pengambilan Saya' : 'My Collection Tickets')
      : isRecipient
      ? (isId ? 'Reservasi Makanan Komunitas' : 'Community Reservations')
      : (isId ? 'Monitoring Seluruh Reservasi Bali' : 'All Bali Reservations & Handoffs');

    const pageDesc = isProvider
      ? (isId ? 'Pantau penerima yang telah memesan porsi makanan dari outlet Anda. Pindai kode QR tiket penerima atau konfirmasi saat penjemputan selesai.' : 'Review recipient bookings for your surplus listings. Scan their ticket QR or verify collection handoffs.')
      : isIndividual
      ? (isId ? 'Daftar tiket digital pengambilan porsi makanan Anda. Buka tiket QR di bawah ini dan tunjukkan kepada petugas saat jam penjemputan.' : 'Your official food collection tickets. Present the QR code on your ticket to staff upon collection.')
      : isRecipient
      ? (isId ? 'Daftar porsi makanan surplus yang telah dipesan untuk dapur umum dan komunitas Anda. Buka Tiket QR untuk ditunjukkan saat pengambilan.' : 'Track community kitchen reservations and access digital QR tickets for pickup verification.')
      : (isId ? 'Pengawasan menyeluruh alur serah terima dari seluruh penyedia ke seluruh komunitas penerima di Bali.' : 'Complete oversight of all surplus handoffs across Bali providers and recipients.');

    container.innerHTML = `
      <div class="container">
        <div class="dashboard-shell">
          ${renderDashboardSidebar('/dashboard/reservations', user)}

          <div>
            <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom: var(--space-5);">
              <div>
                <span class="eyebrow">${
                  isProvider
                    ? (isId ? 'Antrean Serah Terima Outlet' : 'Handoff Coordinator')
                    : isIndividual
                    ? (isId ? 'Tiket Digital Warga' : 'Personal Digital Tickets')
                    : isRecipient
                    ? (isId ? 'Koordinasi Logistik Komunitas' : 'Community Logistics')
                    : (isId ? 'Pengawasan Handoff Bali' : 'Bali Oversight')
                }</span>
                <h1 style="font-size:1.85rem; line-height:1.2;">${pageTitle}</h1>
                <p style="margin-top:4px; font-size:0.92rem; color:var(--color-ink-soft);">
                  ${pageDesc}
                </p>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${
                  isProvider || isAdmin
                    ? `
                      <button type="button" class="btn btn-secondary btn-sm" id="dashboard-scan-qr-btn">
                        ${icon('scan', 13)} ${isId ? 'Scan QR Penjemputan' : 'Scan Pickup QR'}
                      </button>
                    `
                    : ''
                }
                <a href="#/discover" data-link="/discover" class="btn btn-primary btn-sm">
                  ${icon('search', 12)} ${isId ? 'Cari Makanan di Sekitar' : 'Find More Surplus'}
                </a>
              </div>
            </div>

            <div class="discover-toolbar" style="margin-bottom: var(--space-4);">
              <div class="segmented-tabs" role="tablist" aria-label="Filter reservations by status">
                ${[
                  { id: 'all', label: isId ? 'Semua Reservasi' : 'All reservations' },
                  { id: 'upcoming', label: isId ? 'Akan Datang (Dipesan)' : 'Upcoming (Reserved)' },
                  { id: 'awaiting', label: isId ? 'Menunggu Diambil' : 'Awaiting Collection' },
                  { id: 'completed', label: isId ? 'Selesai' : 'Completed' },
                  { id: 'cancelled', label: isId ? 'Dibatalkan' : 'Cancelled' }
                ]
                  .map(
                    (t) => `
                      <button
                        type="button"
                        role="tab"
                        aria-selected="${reservationTab === t.id}"
                        class="segmented-tab ${reservationTab === t.id ? 'is-active' : ''}"
                        data-res-tab="${t.id}"
                      >
                        ${escapeHtml(t.label)}
                      </button>
                    `
                  )
                  .join('')}
              </div>
            </div>

            ${
              allRes.length === 0
                ? `
                  <div class="state-panel">
                    <h3>${isId ? 'Tidak ada reservasi pada tampilan ini' : 'No reservations in this view'}</h3>
                    <p>${
                      isProvider
                        ? (isId ? 'Belum ada pesanan masuk untuk filter ini.' : 'No incoming reservations match this filter.')
                        : (isId ? 'Jelajahi makanan surplus yang tersedia di Denpasar dan Badung untuk membuat reservasi gratis.' : 'Explore available surplus listings in Denpasar and Badung to make a reservation.')
                    }</p>
                    ${
                      !isProvider
                        ? `<a href="#/discover" data-link="/discover" class="btn btn-primary btn-sm">${isId ? 'Cari Makanan di Sekitar' : 'Explore Discover'}</a>`
                        : ''
                    }
                  </div>
                `
                : `
                  <div style="display:flex; flex-direction:column; gap:14px;">
                    ${allRes.map((res) => renderReservationActionRow(res, isProvider)).join('')}
                  </div>
                `
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 19. Activity & Handoffs - /dashboard/activity (PRD Section 19)
   */
  function renderActivityHandoffsView(state, user) {
    const isProvider = user.role === 'provider';
    const isAdmin = user.role === 'admin';
    const lang = getLanguage();
    const isId = lang === 'id';

    // Activity filtering per role
    const activityList = isAdmin
      ? state.activity
      : state.activity.filter(
          (ev) =>
            ev.actorId === user.id ||
            (ev.summary && ev.summary.toLowerCase().includes(user.name.toLowerCase()))
        );

    container.innerHTML = `
      <div class="container">
        <div class="dashboard-shell">
          ${renderDashboardSidebar('/dashboard/activity', user)}

          <div>
            <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom: var(--space-5);">
              <div>
                <span class="eyebrow">${isId ? 'Rekam Jejak Terverifikasi' : 'Traceable Ledger'}</span>
                <h1 style="font-size:1.85rem; line-height:1.2;">${isId ? 'Riwayat Serah Terima & Aktivitas' : 'Activity & handoff log'}</h1>
                <p style="margin-top:4px; font-size:0.92rem; color:var(--color-ink-soft);">
                  ${isId ? 'Setiap perubahan status (TERSEDIA → DIPESAN → DIAMBIL → SELESAI) tercatat resmi dengan stempel waktu.' : 'Every state transition is recorded with an immutable timestamp.'}
                </p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="export-activity-csv-btn">
                ${icon('download', 12)} ${isId ? 'Ekspor CSV Riwayat' : 'Export activity CSV'}
              </button>
            </div>

            ${
              isAdmin && state.reports && state.reports.length > 0
                ? `
                  <div class="notice-banner notice-banner-warning" style="margin-bottom: var(--space-5);">
                    <span class="notice-banner-icon">${icon('shield', 12)}</span>
                    <div>
                      <strong>${isId ? `Antrean Moderasi Admin (${state.reports.length} laporan masuk):` : `Admin review queue (${state.reports.length} reported listings):`}</strong>
                      ${state.reports.map((rep) => `<div style="margin-top:2px;">• ${escapeHtml(rep.listingTitle)} - ${escapeHtml(rep.reason)} (${escapeHtml(rep.notes || 'No extra notes')})</div>`).join('')}
                    </div>
                  </div>
                `
                : ''
            }

            <div class="data-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${isId ? 'ID Aktivitas' : 'Event ID'}</th>
                    <th>${isId ? 'Entitas' : 'Entity'}</th>
                    <th>${isId ? 'Aksi Status' : 'Action'}</th>
                    <th>${isId ? 'Ringkasan Aktivitas' : 'Summary'}</th>
                    <th>${isId ? 'Pelaku' : 'Actor'}</th>
                    <th>${isId ? 'Waktu Transaksi' : 'Timestamp'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    activityList.length === 0
                      ? `<tr><td colspan="6" style="text-align:center; padding:18px;">${isId ? 'Belum ada riwayat aktivitas yang tercatat untuk akun Anda.' : 'No activity records found.'}</td></tr>`
                      : activityList
                          .map(
                            (ev) => `
                              <tr>
                                <td style="font-family:var(--font-mono); font-size:0.75rem;">${escapeHtml(ev.id)}</td>
                                <td><span class="badge badge-neutral">${escapeHtml(ev.entityType)}</span></td>
                                <td style="font-weight:700; color:var(--color-forest);">${escapeHtml(ev.action)}</td>
                                <td>${escapeHtml(ev.summary)}</td>
                                <td>${escapeHtml(ev.actorName || ev.actorId)}</td>
                                <td style="color:var(--color-muted); white-space:nowrap;">${escapeHtml(formatDateTime(ev.createdAt))}</td>
                              </tr>
                            `
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderReservationActionRow(rawRes, isProvider) {
    const res = localizeReservation(rawRes);
    const windowStr = formatPickupWindow(res.pickupWindow?.start, res.pickupWindow?.end);
    const lang = getLanguage();
    const isId = lang === 'id';

    const nextActionHint = isId
      ? res.status === 'reserved'
        ? 'Langkah selanjutnya: Penerima mengambil sesuai jam dan menandai "Sudah Diambil", atau Penyedia menekan "Konfirmasi Selesai".'
        : res.status === 'collected'
        ? 'Langkah selanjutnya: Penyedia memverifikasi & menyelesaikan serah terima untuk mencatat dampak sosial.'
        : res.status === 'completed'
        ? 'Serah terima telah selesai dan dampak sosial resmi tercatat.'
        : 'Reservasi ini telah dibatalkan.'
      : res.status === 'reserved'
        ? 'Next step: Recipient collects within window and marks Collected, or Provider confirms Completed handoff.'
        : res.status === 'collected'
        ? 'Next step: Provider confirms Completed handoff to credit Impact metrics.'
        : res.status === 'completed'
        ? 'Handoff verified and counted in Impact metrics.'
        : 'Reservation cancelled.';

    return `
      <article style="background:var(--color-cream); border:1px solid var(--color-line-strong); border-radius:var(--radius-md); padding: var(--space-4);">
        <div style="display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px;">
          <div>
            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:4px;">
              ${getReservationStatusBadge(res.status)}
              <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--color-muted);">ID: ${escapeHtml(res.id)}</span>
            </div>
            <h3 style="font-size:1.1rem;">
              <a href="#/food/${escapeHtml(res.listingId)}" data-link="/food/${escapeHtml(res.listingId)}" style="text-decoration:underline;">
                ${escapeHtml(res.listingTitle)}
              </a>
            </h3>
            <div style="font-size:0.82rem; color:var(--color-ink-soft); margin-top:2px;">
              <strong>${res.quantity} ${escapeHtml(res.unit)}</strong> •
              ${isId ? 'Penyedia:' : 'Provider:'} <strong>${escapeHtml(res.providerName)}</strong> →
              ${isId ? 'Penerima:' : 'Recipient:'} <strong>${escapeHtml(res.recipientName)}</strong> •
              ${icon('mapPin', 12)} ${escapeHtml(res.area || 'Denpasar')}
            </div>
            <div style="font-size:0.78rem; color:var(--color-muted); margin-top:4px;">
              ${isId ? 'Batas jam ambil:' : 'Collection window:'} <strong>${escapeHtml(windowStr)}</strong> • ${escapeHtml(nextActionHint)}
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${
              !isProvider
                ? `
                  <button type="button" class="btn btn-primary btn-sm" data-view-qr-ticket="${escapeHtml(res.id)}" title="${isId ? 'Tampilkan QR Code untuk dipindai saat pengambilan' : 'Show QR ticket'}">
                    ${icon('qrCode', 13)} ${isId ? 'Buka Tiket QR' : 'Open QR Ticket'}
                  </button>
                `
                : `
                  ${
                    res.status === 'reserved' || res.status === 'collected'
                      ? `
                        <button type="button" class="btn btn-primary btn-sm" data-transition-res="${escapeHtml(res.id)}" data-next-status="completed">
                          ${icon('check', 12)} ${isId ? 'Konfirmasi Selesai' : 'Confirm Complete'}
                        </button>
                      `
                      : ''
                  }
                  <button type="button" class="btn btn-secondary btn-sm" data-view-qr-ticket="${escapeHtml(res.id)}" title="${isId ? 'Lihat QR Code tiket penerima' : 'Show QR ticket reference'}">
                    ${icon('qrCode', 13)} ${isId ? 'QR Tiket' : 'QR Ticket'}
                  </button>
                `
            }

            <button type="button" class="btn btn-secondary btn-sm" data-view-pickup="${escapeHtml(res.id)}">
              ${isId ? 'Petunjuk Ambil' : 'Pickup instructions'}
            </button>
            <button type="button" class="btn btn-secondary btn-sm" data-contact-provider="${escapeHtml(res.id)}">
              ${isId ? (isProvider ? 'Hubungi Penerima' : 'Pesan ke Penyedia') : `Message ${isProvider ? 'recipient' : 'provider'}`}
            </button>

            ${
              !isProvider && res.status === 'reserved'
                ? `
                  <button type="button" class="btn btn-secondary btn-sm" data-transition-res="${escapeHtml(res.id)}" data-next-status="collected">
                    ${isId ? 'Tandai Sudah Diambil' : 'Mark collected'}
                  </button>
                  <button type="button" class="btn btn-danger-outline btn-sm" data-cancel-res="${escapeHtml(res.id)}">
                    ${isId ? 'Batalkan' : 'Cancel'}
                  </button>
                `
                : ''
            }
          </div>
        </div>
      </article>
    `;
  }

  function bindSharedDashboardActions() {
    // 1. Listing tabs & filters
    container.querySelectorAll('[data-listing-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        listingTab = tab.getAttribute('data-listing-tab');
        renderView();
      });
    });

    const lSearch = container.querySelector('#my-listings-search');
    if (lSearch) {
      lSearch.addEventListener('input', () => {
        listingSearch = lSearch.value;
        renderView();
      });
    }

    const lCat = container.querySelector('#my-listings-cat');
    if (lCat) {
      lCat.addEventListener('change', () => {
        listingCategory = lCat.value;
        renderView();
      });
    }

    // 2. Reservation tabs
    container.querySelectorAll('[data-res-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        reservationTab = tab.getAttribute('data-res-tab');
        renderView();
      });
    });

    // 3. Reservation state transitions (RESERVED -> COLLECTED -> COMPLETED)
    container.querySelectorAll('[data-transition-res]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const resId = btn.getAttribute('data-transition-res');
        const nextStatus = btn.getAttribute('data-next-status');
        try {
          const updated = reservationService.transitionReservationStatus(resId, nextStatus);
          if (nextStatus === 'completed') {
            showToast(
              `Handoff completed! ${updated.quantity} ${updated.unit} added to Impact metrics.`,
              'success'
            );
          } else {
            showToast(`Reservation ${resId} marked as ${nextStatus}.`, 'info');
          }
          renderView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // 4. Cancel reservation confirmation modal
    container.querySelectorAll('[data-cancel-res]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        const resId = btn.getAttribute('data-cancel-res');
        const rawRes = appState.getState().reservations.find((r) => r.id === resId);
        const res = localizeReservation(rawRes);
        if (!res) return;

        openModal({
          title: isId ? `Batalkan reservasi ${res.id}?` : `Cancel reservation ${res.id}?`,
          bodyHtml: `
            <p style="margin-bottom:12px;">
              ${isId
                ? `Apakah Anda yakin ingin membatalkan pesanan untuk <strong>${res.quantity} ${escapeHtml(res.unit)}</strong> dari <strong>${escapeHtml(res.listingTitle)}</strong>?`
                : `Are you sure you want to cancel your reservation for <strong>${res.quantity} ${escapeHtml(res.unit)}</strong> of <strong>${escapeHtml(res.listingTitle)}</strong>?`
              }
            </p>
            <div class="notice-banner">
              <span class="notice-banner-icon">${icon('info', 12)}</span>
              <span>${isId
                ? 'Pembatalan akan mengembalikan kuota porsi ke listing agar penerima lain dapat mengambilnya sebelum batas waktu.'
                : 'Cancelling restores the reserved quantity back to the listing so another recipient can collect it before the deadline.'
              }</span>
            </div>
          `,
          footerHtml: `
            <button type="button" class="btn btn-secondary btn-sm" data-modal-close>${isId ? 'Tetap Simpan Reservasi' : 'Keep reservation'}</button>
            <button type="button" class="btn btn-danger btn-sm" id="confirm-cancel-res-btn">${isId ? 'Konfirmasi Pembatalan' : 'Confirm cancellation'}</button>
          `,
          onMount(dialog) {
            dialog.querySelector('#confirm-cancel-res-btn').addEventListener('click', () => {
              reservationService.transitionReservationStatus(resId, 'cancelled');
              closeModal();
              showToast(isId ? 'Reservasi dibatalkan dan kuota porsi dikembalikan.' : 'Reservation cancelled and quantity restored to listing.', 'warning');
              renderView();
            });
          }
        });
      });
    });

    // 4b. View QR Ticket Modal
    container.querySelectorAll('[data-view-qr-ticket]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const resId = btn.getAttribute('data-view-qr-ticket');
        const rawRes = appState.getState().reservations.find((r) => r.id === resId);
        const res = localizeReservation(rawRes);
        if (res) {
          openQrTicketModal(res);
        }
      });
    });

    // 4c. Provider QR Scanner Modal
    container.querySelectorAll('#dashboard-scan-qr-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        openQrScannerModal({
          onHandoffCompleted: () => renderView()
        });
      });
    });

    // 5. View pickup instructions modal
    container.querySelectorAll('[data-view-pickup]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        const resId = btn.getAttribute('data-view-pickup');
        const rawRes = appState.getState().reservations.find((r) => r.id === resId);
        const res = localizeReservation(rawRes);
        if (!res) return;

        openModal({
          title: isId ? `Petunjuk Penjemputan: ${res.listingTitle}` : `Pickup instructions: ${res.listingTitle}`,
          bodyHtml: `
            <div class="listing-card-specs" style="grid-template-columns:1fr; gap:10px; margin-bottom:14px;">
              <div>
                <span class="listing-spec-label">${isId ? 'ID Reservasi (Tunjukkan saat serah terima)' : 'Reservation ID (Show at handoff)'}</span>
                <span class="listing-spec-value" style="font-family:var(--font-mono);">${escapeHtml(res.id)}</span>
              </div>
              <div>
                <span class="listing-spec-label">${isId ? 'Penyedia & Wilayah' : 'Provider & Area'}</span>
                <span class="listing-spec-value">${escapeHtml(res.providerName)} • ${icon('mapPin', 12)} ${escapeHtml(res.area)}</span>
              </div>
              <div>
                <span class="listing-spec-label">${isId ? 'Jadwal Batas Jam Pengambilan' : 'Collection window'}</span>
                <span class="listing-spec-value">${escapeHtml(formatPickupWindow(res.pickupWindow?.start, res.pickupWindow?.end))}</span>
              </div>
              <div>
                <span class="listing-spec-label">${isId ? 'Petunjuk Konter & Serah Terima' : 'Check-in & handoff instructions'}</span>
                <p style="font-size:0.9rem; color:var(--color-ink); margin-top:2px;">
                  ${escapeHtml(res.collectionInstructions || (isId ? 'Datang ke konter utama dan sebutkan ID reservasi FoodLoop Anda.' : 'Check in at main counter with your FoodLoop reservation ID.'))}
                </p>
              </div>
            </div>
          `,
          footerHtml: `<button type="button" class="btn btn-primary btn-sm" data-modal-close>${isId ? 'Selesai' : 'Done'}</button>`
        });
      });
    });

    // 6. Contact provider / recipient demo message composer modal
    container.querySelectorAll('[data-contact-provider]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        const resId = btn.getAttribute('data-contact-provider');
        const rawRes = appState.getState().reservations.find((r) => r.id === resId);
        const res = localizeReservation(rawRes);
        if (!res) return;

        openModal({
          title: isId ? `Pesan Koordinasi untuk ${res.id}` : `Coordination message for ${res.id}`,
          bodyHtml: `
            <p style="font-size:0.85rem; color:var(--color-muted); margin-bottom:12px;">
              ${isId
                ? `Kirim catatan koordinasi penjemputan terkait <strong>${escapeHtml(res.listingTitle)}</strong> (${res.quantity} ${escapeHtml(res.unit)}).`
                : `Send a pickup coordination note regarding <strong>${escapeHtml(res.listingTitle)}</strong> (${res.quantity} ${escapeHtml(res.unit)}).`
              }
            </p>
            <form id="modal-res-msg-form">
              <div class="form-group">
                <label for="res-msg-text" class="form-label">${isId ? 'Pesan' : 'Message'}</label>
                <textarea id="res-msg-text" class="form-textarea" required>${
                  isId
                    ? `Halo ${escapeHtml(res.providerName)}, kami mengonfirmasi penjemputan ${res.quantity} ${escapeHtml(res.unit)} sesuai batas jam yang tertera. Tim kami sedang menuju ke lokasi.`
                    : `Hello ${escapeHtml(res.providerName)}, confirming our collection of ${res.quantity} ${escapeHtml(res.unit)} within your pickup window. Our coordinator is on the way.`
                }</textarea>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button type="button" class="btn btn-secondary btn-sm" data-modal-close>${isId ? 'Batal' : 'Cancel'}</button>
                <button type="submit" class="btn btn-primary btn-sm">${isId ? 'Kirim Pesan' : 'Send message'}</button>
              </div>
            </form>
          `,
          onMount(dialog) {
            dialog.querySelector('#modal-res-msg-form').addEventListener('submit', (e) => {
              e.preventDefault();
              const body = dialog.querySelector('#res-msg-text').value.trim();
              appState.addMessage({
                reservationId: res.id,
                to: res.providerName,
                from: res.recipientName,
                body
              });
              appState.logActivity({
                entityType: 'reservation',
                entityId: res.id,
                action: 'message_sent',
                summary: `Coordination note sent for reservation ${res.id} (${res.listingTitle})`
              });
              closeModal();
              showToast(isId ? 'Pesan koordinasi berhasil dikirim!' : 'Coordination message sent!', 'success');
            });
          }
        });
      });
    });

    // 7. Edit listing modal (Preserves reservation history, PRD Section 17)
    container.querySelectorAll('[data-edit-listing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        const listingId = btn.getAttribute('data-edit-listing');
        const item = listingService.getById(listingId);
        if (!item) return;

        openModal({
          title: isId ? `Ubah Listing: ${item.title}` : `Edit listing: ${item.title}`,
          bodyHtml: `
            <p style="font-size:0.82rem; color:var(--color-muted); margin-bottom:12px;">
              ${isId
                ? 'Mengubah data listing tetap mempertahankan riwayat reservasi yang telah tercatat sebelumnya.'
                : 'Editing a listing preserves its existing reservation history.'
              }
            </p>
            <form id="modal-edit-listing-form">
              <div class="form-group">
                <label for="edit-l-title" class="form-label">${isId ? 'Nama Makanan' : 'Title'}</label>
                <input type="text" id="edit-l-title" class="form-input" value="${escapeHtml(item.title)}" required />
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label for="edit-l-qty" class="form-label">${isId ? `Sisa Porsi Tersedia (${escapeHtml(item.unit)})` : `Remaining quantity (${escapeHtml(item.unit)})`}</label>
                  <input type="number" id="edit-l-qty" class="form-input" min="0" max="2000" value="${item.quantityAvailable}" required />
                </div>
                <div class="form-group">
                  <label for="edit-l-storage" class="form-label">${isId ? 'Catatan Suhu & Penyimpanan' : 'Storage notes'}</label>
                  <input type="text" id="edit-l-storage" class="form-input" value="${escapeHtml(item.storageNotes || '')}" />
                </div>
              </div>
              <div class="form-group">
                <label for="edit-l-instructions" class="form-label">${isId ? 'Petunjuk Penjemputan di Tempat' : 'Collection instructions'}</label>
                <textarea id="edit-l-instructions" class="form-textarea" style="min-height:74px;">${escapeHtml(item.collectionInstructions || '')}</textarea>
              </div>
              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button type="button" class="btn btn-secondary btn-sm" data-modal-close>${isId ? 'Batal' : 'Cancel'}</button>
                <button type="submit" class="btn btn-primary btn-sm">${isId ? 'Simpan Perubahan' : 'Save changes'}</button>
              </div>
            </form>
          `,
          onMount(dialog) {
            dialog.querySelector('#modal-edit-listing-form').addEventListener('submit', (e) => {
              e.preventDefault();
              const newQty = Number(dialog.querySelector('#edit-l-qty').value);
              listingService.updateListingDetails(item.id, {
                title: dialog.querySelector('#edit-l-title').value.trim(),
                quantityAvailable: newQty,
                quantityTotal: Math.max(item.quantityTotal, newQty),
                storageNotes: dialog.querySelector('#edit-l-storage').value.trim(),
                collectionInstructions: dialog.querySelector('#edit-l-instructions').value.trim()
              });
              closeModal();
              showToast(isId ? 'Listing berhasil diperbarui (riwayat reservasi tetap aman).' : 'Listing updated (reservation history preserved).', 'success');
              renderView();
            });
          }
        });
      });
    });

    // 8. Pause / Mark unavailable confirmation modal (PRD Section 17)
    container.querySelectorAll('[data-pause-listing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        const listingId = btn.getAttribute('data-pause-listing');
        const item = listingService.getById(listingId);
        if (!item) return;

        openModal({
          title: isId ? `Tandai "${item.title}" Tidak Tersedia?` : `Mark "${item.title}" unavailable?`,
          bodyHtml: `
            <p style="margin-bottom:12px;">
              ${isId
                ? 'Tindakan ini akan menjeda penerimaan pesanan baru dan menyetel sisa porsi menjadi 0. Catatan reservasi yang telah selesai tetap tersimpan dengan aman.'
                : 'This will pause new reservations and set remaining available quantity to 0. Existing reservation records remain preserved.'
              }
            </p>
          `,
          footerHtml: `
            <button type="button" class="btn btn-secondary btn-sm" data-modal-close>${isId ? 'Batal' : 'Cancel'}</button>
            <button type="button" class="btn btn-danger btn-sm" id="confirm-pause-listing-btn">${isId ? 'Tandai Tidak Tersedia' : 'Mark unavailable'}</button>
          `,
          onMount(dialog) {
            dialog.querySelector('#confirm-pause-listing-btn').addEventListener('click', () => {
              listingService.updateListingStatus(item.id, 'expired');
              closeModal();
              showToast(isId ? 'Listing ditandai tidak tersedia.' : 'Listing marked unavailable.', 'warning');
              renderView();
            });
          }
        });
      });
    });

    // Publish draft or Reactivate listing
    container.querySelectorAll('[data-publish-draft], [data-reactivate-listing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        const id = btn.getAttribute('data-publish-draft') || btn.getAttribute('data-reactivate-listing');
        listingService.updateListingStatus(id, 'available');
        showToast(isId ? 'Listing kini aktif dan dapat ditemukan di Discover!' : 'Listing is now active and available on Discover!', 'success');
        renderView();
      });
    });

    // Saved listing toggle on recipient overview
    container.querySelectorAll('[data-toggle-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-save');
        appState.toggleSavedListing(id);
        renderView();
      });
    });

    // Export activity CSV (P1 feature)
    const exportCsvBtn = container.querySelector('#export-activity-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => {
        const { activity } = appState.getState();
        const headers = ['Event_ID', 'Entity_Type', 'Entity_ID', 'Action', 'Summary', 'Actor', 'Created_At'];
        const rows = activity.map((ev) => [
          ev.id,
          ev.entityType,
          ev.entityId,
          ev.action,
          `"${(ev.summary || '').replace(/"/g, '""')}"`,
          `"${(ev.actorName || ev.actorId || '').replace(/"/g, '""')}"`,
          ev.createdAt
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `foodloop-activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        const isId = getLanguage() === 'id';
        showToast(isId ? 'Buku catatan aktivitas diekspor sebagai CSV.' : 'Exported activity ledger as CSV.', 'success');
      });
    }
  }

  renderView();
}

