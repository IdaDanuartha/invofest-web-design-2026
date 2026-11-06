/**
 * FoodLoop Application Bootstrap (PRD Section 5 & 22)
 * Registers all 15 routes and initializes responsive header, main view, and footer.
 */

import { router } from './router.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { getLanguage, onLanguageChange, t } from './services/i18nService.js';
import { renderHomePage } from './pages/home.js';
import { renderDiscoverPage } from './pages/discover.js';
import { renderListingDetailPage } from './pages/listingDetail.js';
import { renderCreateListingPage } from './pages/createListing.js';
import { renderAssistantPage } from './pages/assistant.js';
import { renderPartnersPage } from './pages/partners.js';
import { renderImpactPage } from './pages/impact.js';
import { renderHowItWorksPage } from './pages/howItWorks.js';
import { renderLoginPage, renderSignupPage, renderProfilePage } from './pages/auth.js';
import { renderDashboardPage } from './pages/dashboard.js';
import { escapeHtml } from '../utils/validation.js';
import { initScrollAnimations } from './services/scrollAnimation.js';

function initApp() {
  // Initialize language (Indonesian default)
  const currentLang = getLanguage();
  document.documentElement.lang = currentLang;

  // Restore user accessibility preferences (Large text / elderly readability)
  if (localStorage.getItem('foodloop_large_text') === 'true') {
    document.documentElement.classList.add('large-text-mode');
  }

  // Listen for language changes and refresh layout + current view
  onLanguageChange((newLang) => {
    document.documentElement.lang = newLang;
    renderHeader(router.getCurrentLocation().pathname);
    router.resolve();
    renderFooter();
  });

  const isId = currentLang === 'id';

  // Register all 15 PRD routes with Indonesian default titles
  router.register('/', isId ? 'Makanan bermutu layak dapat kesempatan kedua' : 'Good food deserves another chance', renderHomePage);
  router.register('/discover', isId ? 'Temukan Makanan Surplus di Bali' : 'Discover Surplus Food in Bali', renderDiscoverPage);
  router.register('/food/:id', isId ? 'Detail Makanan Surplus' : 'Surplus Listing Details', renderListingDetailPage);
  router.register('/donate', isId ? 'Pasang Surplus Makanan' : 'Create a Surplus Listing', renderCreateListingPage);
  router.register('/assistant', isId ? 'Asisten Cerdas FoodLoop (AI)' : 'FoodLoop Assist (AI)', renderAssistantPage);
  router.register('/how-it-works', isId ? 'Cara Kerja FoodLoop' : 'How FoodLoop Works', renderHowItWorksPage);
  router.register('/partners', isId ? 'Direktori Mitra & Ekosistem' : 'Partner Directory & Ecosystem', renderPartnersPage);
  router.register('/impact', isId ? 'Dampak Kami & Metodologi' : 'Our Impact & Methodology', renderImpactPage);
  router.register('/login', isId ? 'Masuk Akun' : 'Sign In', renderLoginPage);
  router.register('/signup', isId ? 'Daftar Akun Baru' : 'Create Account', renderSignupPage);
  router.register('/dashboard', isId ? 'Dashboard Pengguna' : 'User Dashboard', renderDashboardPage);
  router.register('/dashboard/listings', isId ? 'Daftar Surplus Saya' : 'My Surplus Listings', renderDashboardPage);
  router.register('/dashboard/reservations', isId ? 'Reservasi & Pengambilan Saya' : 'My Reservations & Handoffs', renderDashboardPage);
  router.register('/dashboard/activity', isId ? 'Catatan Riwayat Aktivitas' : 'Activity & Handoff Ledger', renderDashboardPage);
  router.register('/profile', isId ? 'Profil & Pengaturan Organisasi' : 'Profile & Organization Settings', renderProfilePage);

  router.setNotFound((container, { pathname }) => {
    container.innerHTML = `
      <section class="section">
        <div class="container-narrow">
          <div class="state-panel">
            <h1>Page not found</h1>
            <p>The route <code>${escapeHtml(pathname)}</code> does not exist in FoodLoop.</p>
            <div style="display:flex; gap:10px;">
              <a href="#/" data-link="/" class="btn btn-primary">Return Home</a>
              <a href="#/discover" data-link="/discover" class="btn btn-secondary">Discover Surplus</a>
            </div>
          </div>
        </div>
      </section>
    `;
  });

  router.onAfterRender((pathname) => {
    renderHeader(pathname);
    // Initialize scroll-triggered animations for all sections & cards
    setTimeout(() => {
      initScrollAnimations();
    }, 50);
  });

  renderFooter();
  router.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

