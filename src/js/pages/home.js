/**
 * FoodLoop Homepage (PRD Section 7 - Highest-Priority Page)
 */

import { appState } from '../state.js';
import { router } from '../router.js';
import { listingService } from '../services/listingService.js';
import { reservationService } from '../services/reservationService.js';
import { draftListing } from '../services/aiService.js';
import { renderListingCard } from '../components/listingCard.js';
import { BALI_AREAS } from '../data/seed.js';
import { escapeHtml } from '../../utils/validation.js';
import { formatNumber, formatDeadlineBadge } from '../../utils/formatDate.js';
import { icon } from '../components/icons.js';
import { openQuickGuideModal } from '../components/quickGuideModal.js';
import { showToast } from '../components/toast.js';
import { t, getLanguage } from '../services/i18nService.js';

export function getFaqItems() {
  const lang = getLanguage();
  if (lang === 'id') {
    return [
      {
        q: 'Makanan apa saja yang dapat dibagikan di FoodLoop?',
        a: 'Makanan berlebih berkualitas yang masih segar, higienis, dan layak konsumsi dalam batas waktu aman, seperti roti toko kue yang belum terjual, makanan katering siap saji, buah & sayur segar dari petani, dan sembako kering yang masih tersegel rapi.'
      },
      {
        q: 'Siapa saja yang boleh memesan makanan surplus?',
        a: 'Dapur umum komunitas, panti asuhan, yayasan amal, sukarelawan pangan, serta seluruh warga dan individu yang membutuhkan di sekitar Bali yang dapat mengambil langsung pada jam yang telah ditentukan.'
      },
      {
        q: 'Apakah FoodLoop merupakan layanan pesan-antar makanan (ojek online)?',
        a: 'Bukan. FoodLoop adalah platform koordinasi penemuan, pemesanan, dan penjemputan mandiri (self-pickup). Penerima atau sukarelawan datang langsung ke lokasi mitra penyedia untuk mengambil makanan secara tertib dan gratis.'
      },
      {
        q: 'Bagaimana cara mengambil makanan setelah reservasi?',
        a: 'Setelah memesan porsi, Anda akan mendapatkan Kode Reservasi (tiket digital) dan petunjuk arah. Datanglah sebelum jam batas ambil, periksa kondisi makanan, dan tunjukkan kode tersebut kepada staf untuk serah terima.'
      },
      {
        q: 'Bagaimana penanganan alergen, kehalalan, dan suhu penyimpanan?',
        a: 'Penyedia mencantumkan status halal/vegetarian, daftar alergen (kacang, susu, gluten, telur), serta cara simpan (hangat, dingin 4°C, atau suhu ruangan). Data disajikan transparan agar warga merasa aman dan tenang.'
      },
      {
        q: 'Apakah makanan di FoodLoop benar-benar 100% gratis?',
        a: 'Ya, seluruh makanan surplus yang dibagikan melalui FoodLoop adalah 100% gratis tanpa biaya tersembunyi, tanpa uang pendaftaran, dan tanpa kewajiban kartu kredit.'
      }
    ];
  }
  return [
    {
      q: 'What kind of food can be listed?',
      a: 'Edible surplus food that has been stored safely and remains within its suitable consumption window, such as unsold bakery loaves, unserved catering trays, portioned kitchen prep, fresh produce crates, and sealed dry pantry items.'
    },
    {
      q: 'Who can reserve surplus food?',
      a: 'Verified community kitchens, charities, neighbourhood pantries, and nearby individuals who can collect within the stated time window.'
    },
    {
      q: 'Is FoodLoop a food delivery service?',
      a: 'No. FoodLoop is a surplus discovery, reservation, and handoff coordination platform. Recipients or volunteer collection partners pick up directly from the provider within the agreed window.'
    },
    {
      q: 'How does collection work?',
      a: 'After reserving a specific quantity, the recipient receives the provider’s pickup instructions and reservation ID. At handoff, the recipient inspects the food, collects the reserved amount, and both parties confirm completion.'
    },
    {
      q: 'How are allergens and storage details handled?',
      a: 'Providers disclose known ingredients, common allergens, preparation time, and storage conditions. Missing details are explicitly marked "Please confirm with provider", never assumed safe.'
    },
    {
      q: 'Is surplus food completely free on FoodLoop?',
      a: 'Yes, all surplus listings shared through FoodLoop are 100% free with zero fees, no subscription costs, and no credit card required.'
    }
  ];
}

export const FAQ_ITEMS = getFaqItems();

export function renderHomePage(container) {
  const publicListings = listingService.getAllPublicListings();
  const previewListings = publicListings.slice(0, 3);
  const heroFeatured = publicListings[0] || null;
  const metrics = reservationService.computeImpactMetrics();
  const faqItems = getFaqItems();
  const lang = getLanguage();

  container.innerHTML = `
    <!-- 7.2 Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-grid">
          <div>
            <span class="eyebrow">${t('hero_eyebrow')}</span>
            <h1 class="hero-headline">
              ${lang === 'id' ? 'Makanan bermutu layak dapat <span class="serif-accent">kesempatan kedua.</span>' : 'Good food deserves <span class="serif-accent">another chance.</span>'}
            </h1>
            <p class="hero-lead">
              ${t('hero_subtitle')}
            </p>
            <div class="hero-cta-group">
              <a href="#/discover" data-link="/discover" class="btn btn-primary btn-lg">${t('hero_cta_discover')}</a>
              <a href="#/donate" data-link="/donate" class="btn btn-secondary btn-lg">${t('hero_cta_donate')}</a>
            </div>
            <div class="hero-trust-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>${lang === 'id' ? 'Reservasi terlacak, transparansi alergen & penyimpanan aman, serah terima tertib di Bali.' : 'Traceable reservations, explicit allergen & storage disclosure, and accountable local handoffs across Bali.'}</span>
            </div>
          </div>

          <div>
            <div class="hero-visual-frame">
              <img
                src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=80"
                alt="Freshly prepared surplus bowls and bakery loaves arranged on a wooden kitchen counter ready for community pickup"
                data-fallback-category="prepared-meals"
              />
              ${
                heroFeatured
                  ? `
                  <div class="hero-overlay-card" aria-label="Sample surplus listing preview">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
                      <span class="badge badge-available">${icon('statusDot', 7)} ${t('status_available')}</span>
                      <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">Demo</span>
                    </div>
                    <div style="display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                      <div>
                        <div style="font-weight:700; font-size:1.05rem; color:var(--color-ink);">${escapeHtml(heroFeatured.title)}</div>
                        <div style="font-size:0.8125rem; color:var(--color-muted);">
                          ${escapeHtml(heroFeatured.providerName)} • ${icon('mapPin', 13)} ${escapeHtml(heroFeatured.area)}
                        </div>
                      </div>
                      <div style="text-align:right;">
                        <div style="font-weight:700; color:var(--color-forest);">${heroFeatured.quantityAvailable} ${escapeHtml(heroFeatured.unit)}</div>
                        <div style="font-size:0.75rem; color:var(--color-muted);">${escapeHtml(formatDeadlineBadge(heroFeatured.pickupEnd))}</div>
                      </div>
                    </div>
                  </div>
                `
                  : ''
              }
            </div>
          </div>
        </div>

        <!-- Visual Flow Strip: List -> Match -> Collect -> Make an impact -->
        <div class="hero-flow-strip reveal-on-scroll" aria-label="Core redistribution workflow">
          <div class="flow-step-item">
            <span class="flow-step-num">1</span>
            <div>
              <strong style="display:block; font-size:0.875rem;">${t('flow_1_title')}</strong>
              <span style="font-size:0.78rem; color:var(--color-muted);">${t('flow_1_desc')}</span>
            </div>
          </div>
          <div class="flow-step-item">
            <span class="flow-step-num">2</span>
            <div>
              <strong style="display:block; font-size:0.875rem;">${t('flow_2_title')}</strong>
              <span style="font-size:0.78rem; color:var(--color-muted);">${t('flow_2_desc')}</span>
            </div>
          </div>
          <div class="flow-step-item">
            <span class="flow-step-num">3</span>
            <div>
              <strong style="display:block; font-size:0.875rem;">${t('flow_3_title')}</strong>
              <span style="font-size:0.78rem; color:var(--color-muted);">${t('flow_3_desc')}</span>
            </div>
          </div>
          <div class="flow-step-item">
            <span class="flow-step-num">4</span>
            <div>
              <strong style="display:block; font-size:0.875rem;">${t('flow_4_title')}</strong>
              <span style="font-size:0.78rem; color:var(--color-muted);">${t('flow_4_desc')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7.3 Quick Discovery Module -->
    <section class="section-sm" aria-labelledby="quick-search-heading">
      <div class="container">
        <div class="quick-discovery-bar">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:14px;">
            <h2 id="quick-search-heading" style="font-size:1.15rem;">${t('search_heading')}</h2>
            <span style="font-size:0.78rem; color:var(--color-muted);">${t('search_sub')}</span>
          </div>
          <form id="home-quick-search-form" class="quick-discovery-grid">
            <div>
              <label for="home-search-query" class="form-label">${t('search_query_label')}</label>
              <input
                type="search"
                id="home-search-query"
                class="form-input"
                placeholder="${t('search_query_placeholder')}"
              />
            </div>
            <div>
              <label for="home-search-area" class="form-label">${t('search_area_label')}</label>
              <select id="home-search-area" class="form-select">
                <option value="all">${t('search_area_all')}</option>
                ${BALI_AREAS.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="home-search-category" class="form-label">${t('search_cat_label')}</label>
              <select id="home-search-category" class="form-select">
                <option value="all">${t('search_cat_all')}</option>
                <option value="bakery">${t('cat_bakery')}</option>
                <option value="prepared-meals">${t('cat_prepared_meals')}</option>
                <option value="produce">${t('cat_produce')}</option>
                <option value="grocery">${t('cat_grocery')}</option>
                <option value="other">${t('cat_other')}</option>
              </select>
            </div>
            <div>
              <label for="home-search-time" class="form-label">${t('search_time_label')}</label>
              <select id="home-search-time" class="form-select">
                <option value="all">${t('search_time_all')}</option>
                <option value="urgent">${t('search_time_urgent')}</option>
                <option value="flexible">${t('search_time_flexible')}</option>
              </select>
            </div>
            <div>
              <button type="submit" class="btn btn-primary" style="width:100%;">${t('search_btn')}</button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- 7.4 Live Surplus Preview -->
    <section class="section" aria-labelledby="surplus-preview-heading">
      <div class="container">
        <div class="section-header">
          <div class="section-header-copy">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span class="eyebrow" style="margin-bottom:0;">${t('community_eyebrow')}</span>
              <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">Demo</span>
            </div>
            <h2 id="surplus-preview-heading">${t('community_heading')}</h2>
            <p style="margin-top:6px;">${t('community_sub')}</p>
          </div>
          <a href="#/discover" data-link="/discover" class="btn btn-secondary">
            ${t('community_explore_btn')}
          </a>
        </div>

        <div class="grid-3">
          ${previewListings.map((item) => renderListingCard(item)).join('')}
        </div>
      </div>
    </section>

    <!-- Kemudahan Pengguna & Tanggung Jawab Sosial: Panduan Pemula & Ramah Lansia -->
    <section class="section-sm" aria-labelledby="accessibility-guide-heading" style="background: linear-gradient(180deg, rgba(235, 241, 236, 0.5) 0%, rgba(247, 245, 239, 0.3) 100%); border-top: 1px solid var(--color-line); border-bottom: 1px solid var(--color-line);">
      <div class="container">
        <div class="user-guide-banner">
          <div class="user-guide-intro">
            <span class="badge badge-success" style="margin-bottom:8px;">
              ${icon('shieldCheck', 14)} ${t('guide_badge')}
            </span>
            <h2 id="accessibility-guide-heading" style="font-size: clamp(1.4rem, 2.2vw, 1.85rem); margin-bottom: 8px;">
              ${t('guide_heading')}
            </h2>
            <p style="font-size: var(--text-base); color: var(--color-ink-soft); max-width: 72ch;">
              ${t('guide_intro')}
            </p>
          </div>

          <div class="grid-3 user-guide-steps" style="margin-top: var(--space-6);">
            <div class="user-guide-card">
              <div class="user-guide-step-badge">1</div>
              <div class="user-guide-step-body">
                <h3>${t('guide_step1_title')}</h3>
                <p>${t('guide_step1_desc')}</p>
                <div class="user-guide-tag">${icon('mapPin', 13)} ${t('guide_step1_tag')}</div>
              </div>
            </div>

            <div class="user-guide-card">
              <div class="user-guide-step-badge">2</div>
              <div class="user-guide-step-body">
                <h3>${t('guide_step2_title')}</h3>
                <p>${t('guide_step2_desc')}</p>
                <div class="user-guide-tag">${icon('check', 13)} ${t('guide_step2_tag')}</div>
              </div>
            </div>

            <div class="user-guide-card">
              <div class="user-guide-step-badge">3</div>
              <div class="user-guide-step-body">
                <h3>${t('guide_step3_title')}</h3>
                <p>${t('guide_step3_desc')}</p>
                <div class="user-guide-tag">${icon('clock', 13)} ${t('guide_step3_tag')}</div>
              </div>
            </div>
          </div>

          <div class="user-guide-actions" style="margin-top: var(--space-6); display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; padding-top: var(--space-4); border-top: 1px dashed var(--color-line-strong);">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" id="home-large-text-quick-btn">
                ${icon('sparkles', 14)} <span id="home-text-quick-label">${t('guide_btn_large_text')}</span>
              </button>
              <button type="button" class="btn btn-ghost btn-sm" id="home-quick-guide-modal-btn">
                ${icon('info', 14)} ${t('guide_btn_read_more')}
              </button>
            </div>
            <a href="#/assistant" data-link="/assistant" class="btn btn-ghost btn-sm" style="color: var(--color-forest); font-weight: 600;">
              ${icon('sparkles', 14)} ${t('guide_btn_ask_ai')}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 7.5 How FoodLoop Works -->
    <section class="section section-paper" aria-labelledby="how-works-heading">
      <div class="container">
        <div class="section-header">
          <div class="section-header-copy">
            <span class="eyebrow">Clear accountability</span>
            <h2 id="how-works-heading">How FoodLoop works</h2>
            <p style="margin-top:6px;">Separate, practical workflows designed for busy kitchens and community coordinators.</p>
          </div>

          <div class="segmented-tabs" role="tablist" aria-label="Choose workflow pathway">
            <button
              type="button"
              role="tab"
              id="tab-pathway-provider"
              aria-selected="true"
              aria-controls="panel-pathway-content"
              class="segmented-tab is-active"
              data-pathway="provider"
            >
              I have surplus
            </button>
            <button
              type="button"
              role="tab"
              id="tab-pathway-recipient"
              aria-selected="false"
              aria-controls="panel-pathway-content"
              class="segmented-tab"
              data-pathway="recipient"
            >
              I'm looking for food
            </button>
          </div>
        </div>

        <div id="panel-pathway-content" role="tabpanel" aria-labelledby="tab-pathway-provider">
          <!-- Populated dynamically by pathway toggle -->
        </div>
      </div>
    </section>

    <!-- 7.6 AI Feature Spotlight -->
    <section class="section" aria-labelledby="ai-spotlight-heading">
      <div class="container">
        <div class="ai-spotlight-box">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="badge badge-ai">${icon('sparkle', 12)} FoodLoop Assist</span>
              <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">Demo AI</span>
            </div>
            <h2 id="ai-spotlight-heading" style="margin-bottom:12px;">${lang === 'id' ? 'Administrasi lebih ringkas. Pencocokan lebih tepat.' : 'Less admin. Better matches.'}</h2>
            <p style="margin-bottom:16px;">
              ${lang === 'id'
                ? 'AI FoodLoop membantu penyedia mendeskripsikan surplus secara jelas dan membantu penerima menemukan makanan yang sesuai kebutuhan. Manusia memegang kendali penuh atas setiap keputusan.'
                : 'FoodLoop AI helps providers describe surplus clearly and helps recipients find listings that fit their needs. People stay in control of every decision.'
              }
            </p>
            <div class="notice-banner" style="margin-bottom:20px;">
              <span class="notice-banner-icon">${icon('sparkle', 12)}</span>
              <div>
                <strong>${lang === 'id' ? 'Verifikasi Manusia Wajib:' : 'Human-verified policy:'}</strong>
                <span>${lang === 'id' ? 'Saran AI bersifat draf awal. Penyedia makanan wajib memeriksa kembali seluruh rincian porsi, alergen, dan suhu simpan sebelum dipublikasikan.' : 'AI suggestions are drafts. Providers must verify all details, allergens, storage information, and suitability before publishing.'}</span>
              </div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:12px;">
              <a href="#/assistant" data-link="/assistant" class="btn btn-primary">${lang === 'id' ? 'Coba Asisten AI FoodLoop' : 'Try FoodLoop Assist'}</a>
              <button type="button" class="btn btn-secondary" id="home-apply-ai-draft-btn">${lang === 'id' ? 'Buka draf di Pasang Surplus →' : 'Open draft in Create Listing →'}</button>
            </div>
          </div>

          <div class="ai-preview-console" aria-label="Interactive FoodLoop Assist preview">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <label for="home-ai-prompt-input" style="font-weight:700; font-size:0.875rem;">
                ${lang === 'id' ? 'Makanan apa yang Anda miliki hari ini?' : 'What food do you have today?'}
              </label>
              <button type="button" class="btn btn-ghost btn-sm" id="home-ai-run-btn" style="padding:4px 10px; color:var(--color-forest); display:inline-flex; align-items:center; gap:6px;">
                ${icon('refresh', 13)} ${lang === 'id' ? 'Buat draf otomatis' : 'Generate draft'}
              </button>
            </div>
            <textarea
              id="home-ai-prompt-input"
              class="form-textarea"
              style="min-height:74px; margin-bottom:10px;"
            >${lang === 'id' ? '12 porsi nasi kotak sayur, disiapkan jam 11:00, disimpan dingin, ambil sebelum jam 17:00.' : '12 portions of vegetable rice, prepared at 11:00, chilled, collect before 17:00.'}</textarea>

            <div id="home-ai-draft-result">
              <!-- Populated by renderHomeAiDraft -->
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7.7 Partner Ecosystem Section -->
    <section class="section section-paper" aria-labelledby="ecosystem-heading">
      <div class="container">
        <div class="section-header">
          <div class="section-header-copy">
            <span class="eyebrow">${lang === 'id' ? 'Kolaborasi Komunitas Lokal' : 'Local collaboration'}</span>
            <h2 id="ecosystem-heading">${lang === 'id' ? 'Jaringan lokal saling mendukung untuk dampak nyata.' : 'A local network makes the difference.'}</h2>
            <p style="margin-top:6px;">
              ${lang === 'id'
                ? 'Penyelamatan makanan berjalan efektif saat penyedia, dapur komunitas, dan sukarelawan penjemput saling terhubung dengan ekspektasi yang jelas.'
                : 'Redistribution works when providers, community kitchens, and collection volunteers share clear expectations.'
              }
            </p>
          </div>
          <a href="#/partners" data-link="/partners" class="btn btn-secondary">${lang === 'id' ? 'Bergabung Menjadi Mitra' : 'Become a partner'}</a>
        </div>

        <div class="ecosystem-grid">
          <div class="ecosystem-card">
            <span class="badge badge-forest" style="align-self:flex-start;">${lang === 'id' ? '01 • Penyedia makanan' : '01 • Food providers'}</span>
            <h3>${lang === 'id' ? 'Restoran, kafe, toko roti &amp; pasar swalayan' : 'Restaurants, cafés, bakeries &amp; grocers'}</h3>
            <p style="font-size:0.875rem;">
              ${lang === 'id'
                ? 'Publikasikan surplus makanan layak santap lengkap dengan catatan suhu simpan, informasi alergen, dan jam penjemputan yang pasti.'
                : 'Publish unsold edible surplus with transparent storage notes, allergen disclosures, and fixed collection windows.'
              }
            </p>
          </div>
          <div class="ecosystem-card">
            <span class="badge badge-forest" style="align-self:flex-start;">${lang === 'id' ? '02 • Organisasi kemanusiaan' : '02 • Community organizations'}</span>
            <h3>${lang === 'id' ? 'Yayasan amal, panti asuhan &amp; komunitas warga' : 'Local groups &amp; shelters'}</h3>
            <p style="font-size:0.875rem;">
              ${lang === 'id'
                ? 'Pesan porsi makanan sesuai kapasitas harian dan koordinasikan penjemputan mandiri tanpa bolak-balik kirim pesan.'
                : 'Reserve quantities matching their daily capacity and coordinate reliable pickups without back-and-forth messaging.'
              }
            </p>
          </div>
          <div class="ecosystem-card">
            <span class="badge badge-forest" style="align-self:flex-start;">03 • ${lang === 'id' ? 'Dapur umum sosial' : 'Community kitchens'}</span>
            <h3>${lang === 'id' ? 'Dapur berkah &amp; program pangan gratis' : 'Meal programs &amp; food banks'}</h3>
            <p style="font-size:0.875rem;">
              ${lang === 'id'
                ? 'Olah hasil panen segar dan aneka roti berkualitas menjadi hidangan bernutrisi untuk warga yang membutuhkan di Denpasar dan Badung.'
                : 'Turn wholesale produce crates and bakery batches into nutritious community meals across Denpasar and Badung.'
              }
            </p>
          </div>
          <div class="ecosystem-card">
            <span class="badge badge-forest" style="align-self:flex-start;">04 • ${lang === 'id' ? 'Relawan logistik' : 'Collection partners'}</span>
            <h3>${lang === 'id' ? 'Transportasi mandiri &amp; sukarelawan' : 'Volunteer relay &amp; transport'}</h3>
            <p style="font-size:0.875rem;">
              ${lang === 'id'
                ? 'Mendukung serah terima tepat waktu antara dapur penyedia dan lokasi penampungan sebelum jam batas penjemputan.'
                : 'Support scheduled handoffs between verified providers and community kitchens within tight time windows.'
              }
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7.8 Impact Section -->
    <section class="section" aria-labelledby="impact-section-heading">
      <div class="container">
        <div class="section-header">
          <div class="section-header-copy">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span class="eyebrow" style="margin-bottom:0;">${lang === 'id' ? 'Metrik Terverifikasi' : 'Accountable metrics'}</span>
              <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${lang === 'id' ? 'Pencatatan serah terima nyata' : 'Recorded demo handoffs'}</span>
            </div>
            <h2 id="impact-section-heading">${lang === 'id' ? 'Setiap porsi bermakna. Dampak nyata bersama.' : 'Small handoffs. Shared impact.'}</h2>
            <p style="margin-top:6px;">
              ${lang === 'id'
                ? 'FoodLoop hanya menghitung penjemputan makanan yang terverifikasi selesai di tempat, bukan sekadar klik tayangan halaman, reservasi batal, atau klaim lingkungan yang tidak berdasar.'
                : 'FoodLoop counts only verified, completed handoffs, never page views, uncollected reservations, or unverified emissions claims.'
              }
            </p>
          </div>
          <a href="#/impact" data-link="/impact" class="btn btn-secondary">${lang === 'id' ? 'Pelajari Metodologi Dampak →' : 'Explore our impact →'}</a>
        </div>

        <div class="kpi-grid" style="margin-bottom: var(--space-4);">
          <div class="kpi-card">
            <div class="kpi-label">${lang === 'id' ? 'Serah terima selesai' : 'Completed handoffs'}</div>
            <div class="kpi-value">${formatNumber(metrics.completedHandoffsCount)}</div>
            <div class="kpi-sub">${lang === 'id' ? 'Dikonfirmasi penyedia &amp; penerima' : 'Confirmed by provider &amp; recipient'}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${lang === 'id' ? 'Porsi terselamatkan' : 'Portions redistributed'}</div>
            <div class="kpi-value">${formatNumber(metrics.portionsRedistributed)}</div>
            <div class="kpi-sub">${lang === 'id' ? `+ ${formatNumber(metrics.packsRedistributed)} paket roti/sembako` : `+ ${formatNumber(metrics.packsRedistributed)} bakery/grocery packs`}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${lang === 'id' ? 'Mitra penyedia berpartisipasi' : 'Active participating providers'}</div>
            <div class="kpi-value">${formatNumber(metrics.activeProvidersCount)}</div>
            <div class="kpi-sub">${lang === 'id' ? 'Dapur, toko roti &amp; gerai pangan Bali' : 'Demo kitchens, bakeries &amp; grocers'}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">${lang === 'id' ? 'Organisasi penerima terlayani' : 'Recipient organizations served'}</div>
            <div class="kpi-value">${formatNumber(metrics.recipientOrgsServedCount)}</div>
            <div class="kpi-sub">${lang === 'id' ? 'Dapur umum &amp; lumbung pangan komunitas' : 'Community kitchens &amp; pantries'}</div>
          </div>
        </div>
            <div class="kpi-value">${formatNumber(metrics.portionsRedistributed)}</div>
            <div class="kpi-sub">+ ${formatNumber(metrics.packsRedistributed)} bakery/grocery packs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Active participating providers</div>
            <div class="kpi-value">${formatNumber(metrics.activeProvidersCount)}</div>
            <div class="kpi-sub">Demo kitchens, bakeries &amp; grocers</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Recipient organizations served</div>
            <div class="kpi-value">${formatNumber(metrics.recipientOrgsServedCount)}</div>
            <div class="kpi-sub">Community kitchens &amp; pantries</div>
          </div>
        </div>

        <div class="notice-banner">
          <span class="notice-banner-icon">${icon('info', 12)}</span>
          <div>
            <strong>${lang === 'id' ? 'Transparansi Metodologi:' : 'Methodology note:'}</strong>
            <span>${lang === 'id' ? 'Metrik pada prototipe ini dihitung dari pencatatan serah terima riil di Bali. Estimasi emisi CO2 merujuk pada standar metodologi jejak karbon pangan global.' : 'Prototype metrics are based on recorded demo handoffs. Environmental estimates require a documented methodology and verified data.'}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 7.9 Featured Story / Community Spotlight -->
    <section class="section-sm" aria-labelledby="story-spotlight-heading">
      <div class="container">
        <div class="story-editorial-block">
          <div class="story-media">
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80"
              alt="Kitchen coordinator packing sealed meal containers for afternoon community collection"
              data-fallback-category="prepared-meals"
            />
          </div>
          <div class="story-content">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge badge-citrus">${lang === 'id' ? 'Kisah Nyata Ilustratif' : 'Illustrative story'}</span>
              <span style="font-size:0.78rem; color:var(--color-muted);">${lang === 'id' ? 'Contoh alur kerja di Denpasar' : 'Denpasar workflow example'}</span>
            </div>
            <h2 id="story-spotlight-heading" style="font-size:1.65rem;">
              ${lang === 'id'
                ? 'Bagaimana surplus makan siang jam 15:00 menjadi santapan komunitas jam 17:30, tanpa puluhan telepon.'
                : 'How a 15:00 lunch surplus becomes a 17:30 community dinner, without ten phone calls.'
              }
            </h2>
            <p style="font-size:0.9375rem;">
              ${lang === 'id'
                ? 'Ketika restoran di Denpasar menyelesaikan layanan makan siang dengan sisa 12 porsi nasi kotak sayur yang higienis, staf dapur sering kali tidak punya waktu menelepon banyak yayasan. Dengan memasang jumlah porsi pasti, suhu simpan dingin (4°C), catatan alergen kedelai, dan batas jam ambil 15:00-17:00, koordinator komunitas sekitar dapat langsung memesan porsi yang dapat dibawa dan mengonfirmasi serah terima saat tiba di lokasi.'
                : 'When a restaurant in Denpasar finishes lunch service with 12 unserved vegetable rice bowls, staff often lack time to call multiple organizations. By listing the exact portion count, chilling time (4°C), soy allergen note, and a 15:00-17:00 pickup window, nearby community coordinators can reserve what they can carry and confirm handoff on arrival.'
              }
            </p>
            <div style="display:flex; flex-wrap:wrap; gap:16px; padding-top:8px; border-top:1px solid var(--color-line); font-size:0.8125rem; color:var(--color-muted);">
              <span><strong>14:40</strong> - ${lang === 'id' ? 'Penyedia memasang 12 porsi' : 'Provider lists 12 portions'}</span>
              <span><strong>15:05</strong> - ${lang === 'id' ? 'Dapur komunitas memesan 8 porsi' : 'Community kitchen reserves 8 portions'}</span>
              <span><strong>16:15</strong> - ${lang === 'id' ? 'Makanan diperiksa & serah terima selesai' : 'Inspected & handoff completed'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7.10 FAQ Section -->
    <section class="section" aria-labelledby="home-faq-heading">
      <div class="container-narrow">
        <div style="margin-bottom: var(--space-6);">
          <span class="eyebrow">${lang === 'id' ? 'Pertanyaan Umum' : 'Common questions'}</span>
          <h2 id="home-faq-heading">${lang === 'id' ? 'Pertanyaan yang Sering Diajukan' : 'Frequently asked questions'}</h2>
        </div>

        <div class="accordion-list" id="home-faq-accordion">
          ${faqItems.map(
            (item, idx) => `
              <div class="accordion-item">
                <button
                  type="button"
                  class="accordion-trigger"
                  aria-expanded="${idx === 0 ? 'true' : 'false'}"
                  aria-controls="faq-panel-${idx}"
                  id="faq-trigger-${idx}"
                >
                  <span>${escapeHtml(item.q)}</span>
                  <span class="accordion-icon" aria-hidden="true">${icon('plus', 12)}</span>
                </button>
                <div
                  id="faq-panel-${idx}"
                  class="accordion-panel"
                  role="region"
                  aria-labelledby="faq-trigger-${idx}"
                  ${idx === 0 ? '' : 'hidden'}
                >
                  ${escapeHtml(item.a)}
                </div>
              </div>
            `
          ).join('')}
        </div>
      </div>
    </section>
  `;

  // 1. Bind Quick Discovery form
  const searchForm = container.querySelector('#home-quick-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = container.querySelector('#home-search-query').value.trim();
      const area = container.querySelector('#home-search-area').value;
      const category = container.querySelector('#home-search-category').value;
      const timeFilter = container.querySelector('#home-search-time').value;

      appState.setDiscoverFilters({
        query,
        area,
        category,
        timeFilter
      });
      router.navigate('/discover');
    });
  }

  // 2. Bind How FoodLoop Works pathway tabs
  const pathwayPanel = container.querySelector('#panel-pathway-content');
  const pathwayTabs = container.querySelectorAll('[data-pathway]');

  function renderPathwaySteps(mode) {
    if (!pathwayPanel) return;
    const isIdPathway = getLanguage() === 'id';
    if (mode === 'recipient') {
      pathwayPanel.setAttribute('aria-labelledby', 'tab-pathway-recipient');
      pathwayPanel.innerHTML = `
        <div class="steps-grid">
          <div class="step-card">
            <span class="step-number-badge">01</span>
            <h3>${isIdPathway ? 'Temukan Makanan di Sekitar' : 'Discover food nearby'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Filter surplus makanan di Denpasar, Sanur, atau Badung berdasarkan kategori, porsi, dan batas waktu ambil.' : 'Filter available surplus in Denpasar, Sanur, or Badung by food category, quantity, and collection deadline.'}</p>
          </div>
          <div class="step-card">
            <span class="step-number-badge">02</span>
            <h3>${isIdPathway ? 'Periksa Detail &amp; Ketentuan' : 'Check details &amp; requirements'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Tinjau bahan, catatan alergen, kondisi suhu simpan, dan apakah perlu membawa wadah sendiri.' : 'Review provider-supplied ingredient lists, allergen disclosures, chilling notes, and whether to bring containers.'}</p>
          </div>
          <div class="step-card">
            <span class="step-number-badge">03</span>
            <h3>${isIdPathway ? 'Pesan Porsi Sesuai Kebutuhan' : 'Reserve the amount you can use'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Pilih berapa porsi yang dibutuhkan untuk dapur umum atau keluarga Anda, dan konfirmasikan kesiapan hadir tepat waktu.' : 'Select the exact portion count your organization or household needs and confirm you can arrive in the time window.'}</p>
          </div>
          <div class="step-card">
            <span class="step-number-badge">04</span>
            <h3>${isIdPathway ? 'Ambil Makanan Sesuai Jadwal' : 'Collect within the stated window'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Periksa kondisi makanan saat tiba di lokasi, tunjukkan tiket digital, dan konfirmasikan serah terima di aplikasi.' : 'Inspect the food at handoff, complete collection, and log the handoff in your activity record.'}</p>
          </div>
        </div>
      `;
    } else {
      pathwayPanel.setAttribute('aria-labelledby', 'tab-pathway-provider');
      pathwayPanel.innerHTML = `
        <div class="steps-grid">
          <div class="step-card">
            <span class="step-number-badge">01</span>
            <h3>${isIdPathway ? 'Bagikan Surplus yang Tersedia' : 'Share what is available'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Ketik catatan ringkas atau gunakan Asisten AI FoodLoop untuk menyusun draf makanan, roti, atau hasil tani berlebih.' : 'Enter a quick description or use FoodLoop Assist to structure today’s unsold meals, bakery loaves, or produce.'}</p>
          </div>
          <div class="step-card">
            <span class="step-number-badge">02</span>
            <h3>${isIdPathway ? 'Lengkapi Jumlah, Waktu &amp; Alergen' : 'Add quantity, time &amp; food details'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Tentukan jumlah porsi, batas jam penjemputan, suhu simpan (dingin/hangat), serta keterbukaan alergen.' : 'Specify portion count, collection deadline, storage conditions, and explicit allergen disclosures.'}</p>
          </div>
          <div class="step-card">
            <span class="step-number-badge">03</span>
            <h3>${isIdPathway ? 'Pantau Pesanan yang Masuk' : 'Review a recipient reservation'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Lihat organisasi atau warga yang memesan makanan Anda, sisa kuota yang ada, dan pesan koordinasi kedatangan.' : 'See who reserved your surplus, how much remains available, and any pickup coordination notes.'}</p>
          </div>
          <div class="step-card">
            <span class="step-number-badge">04</span>
            <h3>${isIdPathway ? 'Serah Terima &amp; Konfirmasi Selesai' : 'Hand over &amp; confirm collection'}</h3>
            <p style="font-size:0.875rem;">${isIdPathway ? 'Selesaikan serah terima makanan pada jam yang ditentukan dan catat dampak sosial yang telah terselamatkan.' : 'Complete the handoff during your stated window and record the outcome in your impact summary.'}</p>
          </div>
        </div>
      `;
    }
  }

  renderPathwaySteps('provider');
  pathwayTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-pathway');
      pathwayTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      renderPathwaySteps(mode);
    });
  });

  // 3. Bind Interactive AI Spotlight Preview
  const aiInput = container.querySelector('#home-ai-prompt-input');
  const aiResultBox = container.querySelector('#home-ai-draft-result');
  const aiRunBtn = container.querySelector('#home-ai-run-btn');
  const aiApplyBtn = container.querySelector('#home-apply-ai-draft-btn');
  let latestHomeDraft = null;

  async function updateHomeAiPreview() {
    if (!aiInput || !aiResultBox) return;
    const isIdPreview = getLanguage() === 'id';
    try {
      const draft = await draftListing(aiInput.value);
      latestHomeDraft = draft;
      aiResultBox.innerHTML = `
        <div class="ai-draft-output-grid">
          <div>
            <span class="listing-spec-label">${isIdPreview ? 'Saran Judul (Draf AI)' : 'Suggested title (Draft)'}</span>
            <strong style="font-size:0.875rem;">${escapeHtml(draft.title)}</strong>
          </div>
          <div>
            <span class="listing-spec-label">${isIdPreview ? 'Kategori &amp; Jumlah' : 'Category &amp; Quantity'}</span>
            <strong style="font-size:0.875rem;">${escapeHtml(draft.category)} • ${escapeHtml(String(draft.quantityTotal))} ${escapeHtml(draft.unit)}</strong>
          </div>
          <div>
            <span class="listing-spec-label">${isIdPreview ? 'Penyimpanan &amp; Jam Masak' : 'Storage &amp; Prep'}</span>
            <span style="font-size:0.8125rem;">${escapeHtml(draft.storageNotes)}</span>
          </div>
          <div>
            <span class="listing-spec-label">${isIdPreview ? 'Batas Jam Ambil' : 'Collection window'}</span>
            <span style="font-size:0.8125rem;">${escapeHtml(draft.pickupDeadlineNote)}</span>
          </div>
        </div>
        <div style="margin-top:10px; padding:10px 12px; background:var(--color-citrus-subtle); border-radius:var(--radius-xs); font-size:0.78rem; color:var(--color-citrus-ink);">
          <strong>${isIdPreview ? 'Daftar Periksa yang Harus Dikonfirmasi Penyedia:' : 'Missing information checklist (Provider must confirm):'}</strong>
          <ul style="margin-top:4px; padding-left:16px; list-style:disc;">
            ${draft.missingChecklist.slice(0, 3).map((m) => `<li>${escapeHtml(m)}</li>`).join('')}
          </ul>
        </div>
      `;
    } catch (err) {
      aiResultBox.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
    }
  }

  updateHomeAiPreview();
  if (aiRunBtn) {
    aiRunBtn.addEventListener('click', updateHomeAiPreview);
  }
  if (aiApplyBtn) {
    aiApplyBtn.addEventListener('click', async () => {
      if (!latestHomeDraft && aiInput) {
        latestHomeDraft = await draftListing(aiInput.value);
      }
      if (latestHomeDraft) {
        appState.setPendingAiDraft(latestHomeDraft);
      }
      router.navigate('/donate');
    });
  }

  // 4. Bind FAQ Accordion: Only one open at a time
  const faqTriggers = container.querySelectorAll('#home-faq-accordion .accordion-trigger');
  faqTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isCurrentlyExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Close all accordion panels
      faqTriggers.forEach((otherTrigger) => {
        otherTrigger.setAttribute('aria-expanded', 'false');
        const otherPanelId = otherTrigger.getAttribute('aria-controls');
        const otherPanel = container.querySelector(`#${otherPanelId}`);
        if (otherPanel) {
          otherPanel.hidden = true;
          otherPanel.classList.remove('is-open');
        }
      });

      // Open only this one if it was closed
      if (!isCurrentlyExpanded) {
        trigger.setAttribute('aria-expanded', 'true');
        const panelId = trigger.getAttribute('aria-controls');
        const panel = container.querySelector(`#${panelId}`);
        if (panel) {
          panel.hidden = false;
          panel.classList.add('is-open');
        }
      }
    });
  });

  // 5. Bind User Guide & Elderly Accessibility Controls
  const homeGuideBtn = container.querySelector('#home-quick-guide-modal-btn');
  if (homeGuideBtn) {
    homeGuideBtn.addEventListener('click', () => {
      openQuickGuideModal();
    });
  }

  const homeLargeTextBtn = container.querySelector('#home-large-text-quick-btn');
  const homeLargeTextLabel = container.querySelector('#home-text-quick-label');
  const updateHomeTextLabel = () => {
    const isLarge = document.documentElement.classList.contains('large-text-mode');
    if (homeLargeTextLabel) {
      homeLargeTextLabel.textContent = isLarge ? 'Kembalikan Ukuran Teks Normal' : 'Aktifkan Mode Tulisan Besar (A+)';
    }
  };
  updateHomeTextLabel();

  if (homeLargeTextBtn) {
    homeLargeTextBtn.addEventListener('click', () => {
      const nowLarge = document.documentElement.classList.toggle('large-text-mode');
      localStorage.setItem('foodloop_large_text', String(nowLarge));
      updateHomeTextLabel();
      showToast(nowLarge ? 'Mode Tulisan Besar (A+) Diaktifkan.' : 'Mode Tulisan Normal Diaktifkan.', 'info');
      // Update header as well
      const headerTextLabel = document.querySelector('#header-text-toggle-label');
      if (headerTextLabel) {
        headerTextLabel.textContent = nowLarge ? 'Mode Teks: A+ (Besar)' : 'Mode Teks: Normal';
      }
    });
  }
}

