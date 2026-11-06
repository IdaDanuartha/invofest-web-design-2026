/**
 * FoodLoop Assist - AI Assistant Page (/assistant, PRD Section 11)
 * Capabilities:
 * 1. Listing draft + Missing-detail detection
 * 2. Recipient matching + Plain-language explanation
 * 3. Collection coordination message drafting
 */

import { appState } from '../state.js';
import { router } from '../router.js';
import { listingService } from '../services/listingService.js';
import { draftListing, matchSurplus, draftPickupMessage } from '../services/aiService.js';
import { showToast } from '../components/toast.js';
import { BALI_AREAS, FOOD_CATEGORIES } from '../data/seed.js';
import { escapeHtml } from '../../utils/validation.js';
import { formatDeadlineBadge } from '../../utils/formatDate.js';
import { icon } from '../components/icons.js';
import { getLanguage } from '../services/i18nService.js';

export function renderAssistantPage(container) {
  let activeMode = 'draft'; // 'draft' | 'match' | 'message'
  const lang = getLanguage();
  const isId = lang === 'id';
  let providerInput = isId 
    ? '12 porsi nasi kotak sayur, disiapkan jam 11:00, disimpan dingin, ambil sebelum jam 17:00.'
    : '12 portions of vegetable rice, prepared at 11:00, chilled, collect before 17:00.';
  let currentDraft = null;
  let matchPrefs = {
    area: 'Denpasar',
    category: 'prepared-meals',
    quantity: 10
  };
  let currentMatches = null;
  let messageContext = {
    recipientName: appState.getCurrentUser()?.name || (isId ? 'Dapur Komunitas (Demo)' : 'Community Table (Demo)'),
    providerName: 'Demo Kitchen',
    listingTitle: isId ? 'Nasi kotak sayur segar' : 'Vegetable rice bowls',
    quantity: 4,
    unit: 'portions',
    pickupTime: '15:30 WITA',
    bringContainer: false
  };
  let currentMessageDraft = null;

  async function initData() {
    currentDraft = await draftListing(providerInput);
    currentMatches = await matchSurplus(matchPrefs, listingService.getAllPublicListings());
    currentMessageDraft = await draftPickupMessage(messageContext);
    renderView();
  }

  function renderView() {
    const curLang = getLanguage();
    const isIdNow = curLang === 'id';

    container.innerHTML = `
      <section class="section-sm">
        <div class="container">
          <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom: var(--space-5);">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span class="badge badge-ai">${icon('sparkle', 12)} FoodLoop Assist</span>
                <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">Demo AI - Cepat &amp; Mandiri</span>
              </div>
              <h1>${isIdNow ? 'Asisten AI untuk Pembuatan Listing Cepat &amp; Pencocokan Transparan' : 'Practical AI for faster listing &amp; transparent matching'}</h1>
              <p style="margin-top:6px;">
                ${isIdNow ? 'Asisten cerdas membantu merapikan catatan makanan, mendeteksi kelengkapan alergen, dan memberi saran porsi.' : 'AI drafts structured fields, detects missing disclosures, and explains recipient matches. Humans review and approve every action.'}
              </p>
            </div>

            <div class="segmented-tabs" role="tablist" aria-label="FoodLoop Assist capability mode">
              <button
                type="button"
                role="tab"
                aria-selected="${activeMode === 'draft'}"
                class="segmented-tab ${activeMode === 'draft' ? 'is-active' : ''}"
                data-assist-mode="draft"
              >
                ${isIdNow ? '1. Draf Makanan' : '1. Draft Listing'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected="${activeMode === 'match'}"
                class="segmented-tab ${activeMode === 'match' ? 'is-active' : ''}"
                data-assist-mode="match"
              >
                ${isIdNow ? '2. Rekomendasi' : '2. Match Surplus'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected="${activeMode === 'message'}"
                class="segmented-tab ${activeMode === 'message' ? 'is-active' : ''}"
                data-assist-mode="message"
              >
                ${isIdNow ? '3. Pesan Ambil' : '3. Pickup Message'}
              </button>
            </div>
          </div>

          <!-- Split Layout (PRD Section 11) -->
          <div class="assistant-split">
            <!-- Left Panel: Input & Suggested Prompt Chips -->
            <div class="assistant-panel">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <h2 style="font-size:1.15rem;">${isIdNow ? 'Masukkan Catatan Makanan' : 'Assistant Input'}</h2>
                <span class="badge-demo" style="padding:2px 6px; border-radius:4px;">Aman &amp; Teruji</span>
              </div>

              <div style="margin-bottom: var(--space-4);">
                <span style="font-size:0.78rem; color:var(--color-muted); display:block; margin-bottom:6px;">
                  ${isIdNow ? 'Contoh instruksi cepat:' : 'Suggested prompt chips:'}
                </span>
                <div class="prompt-chips">
                  <button type="button" class="prompt-chip" data-chip-action="list-surplus">
                    ${isIdNow ? 'Bantu saya pasang surplus hari ini' : "Help me list today's surplus"}
                  </button>
                  <button type="button" class="prompt-chip" data-chip-action="find-kitchen">
                    ${isIdNow ? 'Cari makanan untuk dapur komunitas' : 'Find food for our community kitchen'}
                  </button>
                  <button type="button" class="prompt-chip" data-chip-action="check-missing">
                    ${isIdNow ? 'Periksa rincian apa yang masih kurang' : 'Check what details are missing'}
                  </button>
                  <button type="button" class="prompt-chip" data-chip-action="draft-msg">
                    ${isIdNow ? 'Buat draf pesan penjemputan' : 'Draft a pickup message'}
                  </button>
                </div>
              </div>

              ${
                activeMode === 'draft'
                  ? `
                    <form id="assist-draft-form">
                      <div class="form-group">
                        <label for="assist-provider-notes" class="form-label">
                          ${isIdNow ? 'Catatan ringkas penyedia atau ringkasan lisan' : 'Provider rough notes or spoken summary'}
                        </label>
                        <textarea
                          id="assist-provider-notes"
                          class="form-textarea"
                          style="min-height:120px;"
                          placeholder="${isIdNow ? 'Jelaskan sisa makanan yang ada, berapa porsi/paket, kondisi penyimpanan, dan batas waktu penjemputan...' : 'Describe what food is left over, how many portions/packs, storage condition, and pickup deadline...'}"
                        >${escapeHtml(providerInput)}</textarea>
                        <span class="form-hint">
                          ${isIdNow
                            ? 'FoodLoop Assist hanya mengekstrak rincian yang Anda nyatakan dan menandai informasi yang belum lengkap (seperti alergen atau jam masak) sebagai "Harap konfirmasi".'
                            : 'FoodLoop Assist extracts only what you state and marks missing details (like allergens or prep time) as "Please confirm".'
                          }
                        </span>
                      </div>
                      <div style="display:flex; gap:10px;">
                        <button type="submit" class="btn btn-primary">${isIdNow ? 'Buat draf terstruktur' : 'Generate structured draft'}</button>
                        <button type="button" class="btn btn-secondary" id="assist-sample-bakery-btn">${isIdNow ? 'Coba contoh bakery' : 'Try bakery example'}</button>
                      </div>
                    </form>
                  `
                  : activeMode === 'match'
                  ? `
                    <form id="assist-match-form">
                      <div class="form-group">
                        <label for="match-area-select" class="form-label">${isIdNow ? 'Wilayah penerima di Bali' : 'Recipient area in Bali'}</label>
                        <select id="match-area-select" class="form-select">
                          ${BALI_AREAS.map(
                            (a) => `<option value="${escapeHtml(a)}" ${matchPrefs.area === a ? 'selected' : ''}>${escapeHtml(a)}</option>`
                          ).join('')}
                        </select>
                      </div>
                      <div class="form-group">
                        <label for="match-category-select" class="form-label">${isIdNow ? 'Kategori makanan pilihan' : 'Preferred food category'}</label>
                        <select id="match-category-select" class="form-select">
                          <option value="all" ${matchPrefs.category === 'all' ? 'selected' : ''}>${isIdNow ? 'Semua kategori' : 'All categories'}</option>
                          ${FOOD_CATEGORIES.map(
                            (c) => `<option value="${escapeHtml(c.id)}" ${matchPrefs.category === c.id ? 'selected' : ''}>${escapeHtml(isIdNow ? (c.id === 'prepared-meals' ? 'Makanan Siap Santap' : c.id === 'bakery' ? 'Roti & Kue' : c.id === 'produce' ? 'Sayur & Buah Segar' : c.id === 'grocery' ? 'Bahan Pokok & Sembako' : 'Surplus Lainnya') : c.label)}</option>`
                          ).join('')}
                        </select>
                      </div>
                      <div class="form-group">
                        <label for="match-qty-input" class="form-label">${isIdNow ? 'Target kapasitas (porsi / unit dibutuhkan)' : 'Target capacity (portions / units needed)'}</label>
                        <input
                          type="number"
                          id="match-qty-input"
                          class="form-input"
                          min="1"
                          max="100"
                          value="${matchPrefs.quantity}"
                        />
                      </div>
                      <button type="submit" class="btn btn-primary">${isIdNow ? 'Urutkan rekomendasi makanan' : 'Rank matching listings'}</button>
                    </form>
                  `
                  : `
                    <form id="assist-message-form">
                      <div class="grid-2">
                        <div class="form-group">
                          <label for="msg-provider" class="form-label">${isIdNow ? 'Nama penyedia' : 'Provider name'}</label>
                          <input type="text" id="msg-provider" class="form-input" value="${escapeHtml(messageContext.providerName)}" />
                        </div>
                        <div class="form-group">
                          <label for="msg-recipient" class="form-label">${isIdNow ? 'Nama penerima' : 'Recipient name'}</label>
                          <input type="text" id="msg-recipient" class="form-input" value="${escapeHtml(messageContext.recipientName)}" />
                        </div>
                      </div>
                      <div class="form-group">
                        <label for="msg-listing" class="form-label">${isIdNow ? 'Nama makanan surplus' : 'Surplus item'}</label>
                        <input type="text" id="msg-listing" class="form-input" value="${escapeHtml(messageContext.listingTitle)}" />
                      </div>
                      <div class="grid-2">
                        <div class="form-group">
                          <label for="msg-qty" class="form-label">${isIdNow ? 'Jumlah' : 'Quantity'} (${escapeHtml(messageContext.unit)})</label>
                          <input type="number" id="msg-qty" class="form-input" min="1" value="${messageContext.quantity}" />
                        </div>
                        <div class="form-group">
                          <label for="msg-time" class="form-label">${isIdNow ? 'Rencana jam kedatangan' : 'Planned arrival time'}</label>
                          <input type="text" id="msg-time" class="form-input" value="${escapeHtml(messageContext.pickupTime)}" />
                        </div>
                      </div>
                      <button type="submit" class="btn btn-primary">${isIdNow ? 'Buat ulang pesan penjemputan' : 'Regenerate pickup message'}</button>
                    </form>
                  `
              }

              <div class="notice-banner" style="margin-top: var(--space-5);">
                <span class="notice-banner-icon">${icon('sparkle', 12)}</span>
                <div>
                  <strong>${isIdNow ? 'Kebijakan Penggunaan AI:' : 'AI disclaimer:'}</strong>
                  <span>${isIdNow ? 'AI membantu menyusun dan merapikan data surplus. Keputusan akhir tetap berada di tangan penyedia makanan dan penerima.' : 'AI can help organize the details. The provider must check them before publishing, and recipients decide which listings to reserve.'}</span>
                </div>
              </div>
            </div>

            <!-- Right Panel: Structured Output / Editable Draft / Ranked Matches -->
            <div class="assistant-panel">
              ${
                activeMode === 'draft' && currentDraft
                  ? `
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom: var(--space-4);">
                      <div>
                        <span class="badge badge-ai">${isIdNow ? 'Saran AI - Draf dapat diedit' : 'AI suggestion - Editable draft'}</span>
                        <h2 style="font-size:1.2rem; margin-top:4px;">${isIdNow ? 'Draf Listing Terstruktur' : 'Structured Listing Draft'}</h2>
                      </div>
                      <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${escapeHtml(currentDraft.mode)}</span>
                    </div>

                    <div class="form-group">
                      <label for="draft-edit-title" class="form-label">
                        <span>${isIdNow ? 'Saran judul' : 'Suggested title'}</span>
                        <span class="form-label-optional">${isIdNow ? 'Dapat diedit' : 'Editable'}</span>
                      </label>
                      <input type="text" id="draft-edit-title" class="form-input" value="${escapeHtml(currentDraft.title)}" />
                    </div>

                    <div class="grid-3">
                      <div class="form-group">
                        <label for="draft-edit-category" class="form-label">${isIdNow ? 'Kategori' : 'Category'}</label>
                        <select id="draft-edit-category" class="form-select">
                          ${FOOD_CATEGORIES.map(
                            (c) => `<option value="${escapeHtml(c.id)}" ${currentDraft.category === c.id ? 'selected' : ''}>${escapeHtml(isIdNow ? (c.id === 'prepared-meals' ? 'Makanan Siap Santap' : c.id === 'bakery' ? 'Roti & Kue' : c.id === 'produce' ? 'Sayur & Buah Segar' : c.id === 'grocery' ? 'Bahan Pokok & Sembako' : 'Surplus Lainnya') : c.label)}</option>`
                          ).join('')}
                        </select>
                      </div>
                      <div class="form-group">
                        <label for="draft-edit-qty" class="form-label">${isIdNow ? 'Jumlah diekstrak' : 'Extracted quantity'}</label>
                        <input
                          type="text"
                          id="draft-edit-qty"
                          class="form-input"
                          value="${escapeHtml(String(currentDraft.quantityTotal))}"
                        />
                      </div>
                      <div class="form-group">
                        <label for="draft-edit-unit" class="form-label">${isIdNow ? 'Satuan' : 'Unit'}</label>
                        <input type="text" id="draft-edit-unit" class="form-input" value="${escapeHtml(currentDraft.unit)}" />
                      </div>
                    </div>

                    <div class="form-group">
                      <label for="draft-edit-desc" class="form-label">${isIdNow ? 'Deskripsi yang dirapikan' : 'Cleaned-up description'}</label>
                      <textarea id="draft-edit-desc" class="form-textarea" style="min-height:80px;">${escapeHtml(currentDraft.description)}</textarea>
                    </div>

                    <div class="grid-2">
                      <div class="form-group">
                        <label for="draft-edit-storage" class="form-label">${isIdNow ? 'Catatan penyimpanan' : 'Storage notes'}</label>
                        <input type="text" id="draft-edit-storage" class="form-input" value="${escapeHtml(currentDraft.storageNotes)}" />
                      </div>
                      <div class="form-group">
                        <label for="draft-edit-ingredients" class="form-label">${isIdNow ? 'Bahan yang diekstrak' : 'Extracted ingredients'}</label>
                        <input type="text" id="draft-edit-ingredients" class="form-input" value="${escapeHtml(currentDraft.ingredients)}" />
                      </div>
                    </div>

                    <!-- Missing Information Checklist -->
                    <div class="notice-banner notice-banner-warning" style="margin-bottom: var(--space-4);">
                      <div>
                        <strong>${isIdNow ? 'Pertanyaan untuk detail yang belum lengkap / butuh konfirmasi:' : 'Questions for missing / unconfirmed details:'}</strong>
                        <ul style="margin-top:6px; padding-left:18px; list-style:disc; font-size:0.82rem;">
                          ${currentDraft.missingChecklist.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}
                        </ul>
                      </div>
                    </div>

                    <!-- Actions: Apply draft, Edit, Try again, Discard (PRD Section 11) -->
                    <div style="display:flex; flex-wrap:wrap; gap:10px; padding-top: var(--space-3); border-top:1px solid var(--color-line);">
                      <button type="button" class="btn btn-primary" id="assist-apply-draft-btn">
                        ${isIdNow ? 'Terapkan draf ke Buat Donasi →' : 'Apply draft to Create Listing →'}
                      </button>
                      <button type="button" class="btn btn-secondary" id="assist-try-again-btn">
                        ${isIdNow ? 'Coba lagi' : 'Try again'}
                      </button>
                      <button type="button" class="btn btn-ghost" id="assist-discard-btn">
                        ${isIdNow ? 'Buang draf' : 'Discard'}
                      </button>
                    </div>
                  `
                  : activeMode === 'match' && currentMatches
                  ? `
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom: var(--space-4);">
                      <div>
                        <span class="badge badge-ai">${isIdNow ? 'Peringkat Kecocokan Transparan' : 'Transparent Match Ranking'}</span>
                        <h2 style="font-size:1.2rem; margin-top:4px;">${isIdNow ? 'Rekomendasi Makanan Surplus' : 'Recommended Surplus Listings'}</h2>
                      </div>
                      <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${escapeHtml(currentMatches.mode)}</span>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:14px;">
                      ${currentMatches.matches
                        .map(
                          (m, idx) => `
                            <div style="padding:16px; background:var(--color-cream); border:1px solid var(--color-line-strong); border-radius:var(--radius-sm);">
                              <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:8px;">
                                <div>
                                  <span class="badge badge-forest" style="margin-bottom:4px;">${isIdNow ? 'Kecocokan' : 'Match'} #${idx + 1} • Skor ${m.score}/100</span>
                                  <h3 style="font-size:1.05rem;">
                                    <a href="#/food/${escapeHtml(m.listing.id)}" data-link="/food/${escapeHtml(m.listing.id)}" style="text-decoration:underline;">
                                      ${escapeHtml(m.listing.title)}
                                    </a>
                                  </h3>
                                  <div style="font-size:0.8rem; color:var(--color-muted);">
                                    ${escapeHtml(m.listing.providerName)} • ${icon('mapPin', 13)} ${escapeHtml(m.listing.area)} • ${m.listing.quantityAvailable} ${escapeHtml(m.listing.unit)} ${isIdNow ? 'tersedia' : 'available'} • ${escapeHtml(formatDeadlineBadge(m.listing.pickupEnd))}
                                  </div>
                                </div>
                                <a href="#/food/${escapeHtml(m.listing.id)}" data-link="/food/${escapeHtml(m.listing.id)}" class="btn btn-primary btn-sm">
                                  ${isIdNow ? 'Periksa &amp; pesan' : 'Inspect &amp; reserve'}
                                </a>
                              </div>

                              <div style="font-size:0.8125rem; margin-top:8px; padding-top:8px; border-top:1px solid var(--color-line);">
                                <strong style="color:var(--color-forest);">${isIdNow ? 'Mengapa ini direkomendasikan:' : 'Why this is recommended:'}</strong>
                                <ul style="margin-top:4px; padding-left:18px; list-style:disc;">
                                  ${m.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
                                </ul>
                                ${
                                  m.cautions.length > 0
                                    ? `
                                      <div style="margin-top:6px; color:var(--color-citrus-ink);">
                                        <strong>${isIdNow ? 'Catatan:' : 'Note:'}</strong> ${escapeHtml(m.cautions.join(' • '))}
                                      </div>
                                    `
                                    : ''
                                }
                              </div>
                            </div>
                          `
                        )
                        .join('')}
                    </div>
                  `
                  : currentMessageDraft
                  ? `
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom: var(--space-4);">
                      <div>
                        <span class="badge badge-ai">${isIdNow ? 'Saran AI - Pesan dapat diedit' : 'AI suggestion - Editable message'}</span>
                        <h2 style="font-size:1.2rem; margin-top:4px;">${isIdNow ? 'Draf Koordinasi Pengambilan' : 'Collection Coordination Draft'}</h2>
                      </div>
                      <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${escapeHtml(currentMessageDraft.mode)}</span>
                    </div>

                    <div class="form-group">
                      <label for="draft-msg-subject" class="form-label">${isIdNow ? 'Baris subjek' : 'Subject line'}</label>
                      <input type="text" id="draft-msg-subject" class="form-input" value="${escapeHtml(currentMessageDraft.subject)}" />
                    </div>

                    <div class="form-group">
                      <label for="draft-msg-body" class="form-label">${isIdNow ? 'Pesan koordinasi (Dapat diedit)' : 'Coordination message (Editable)'}</label>
                      <textarea id="draft-msg-body" class="form-textarea" style="min-height:170px;">${escapeHtml(currentMessageDraft.message)}</textarea>
                      <span class="form-hint">${escapeHtml(currentMessageDraft.note)}</span>
                    </div>

                    <div style="display:flex; flex-wrap:wrap; gap:10px;">
                      <button type="button" class="btn btn-primary" id="assist-send-demo-msg-btn">
                        ${isIdNow ? 'Kirim ke penyedia di pesan demo' : 'Send to provider in demo thread'}
                      </button>
                      <button type="button" class="btn btn-secondary" id="assist-copy-msg-btn">
                        ${isIdNow ? 'Salin teks pesan' : 'Copy message text'}
                      </button>
                    </div>
                  `
                  : ''
              }
            </div>
          </div>
        </div>
      </section>
    `;

    bindAssistantEvents();
  }

  function bindAssistantEvents() {
    // Mode tabs
    container.querySelectorAll('[data-assist-mode]').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeMode = tab.getAttribute('data-assist-mode');
        renderView();
      });
    });

    // Prompt chips
    container.querySelectorAll('[data-chip-action]').forEach((chip) => {
      chip.addEventListener('click', async () => {
        const action = chip.getAttribute('data-chip-action');
        const isIdClick = getLanguage() === 'id';
        if (action === 'list-surplus') {
          activeMode = 'draft';
          providerInput = isIdClick
            ? '12 porsi nasi kotak sayur, disiapkan jam 11:00, disimpan dingin, ambil sebelum jam 17:00.'
            : '12 portions of vegetable rice, prepared at 11:00, chilled, collect before 17:00.';
          currentDraft = await draftListing(providerInput);
        } else if (action === 'check-missing') {
          activeMode = 'draft';
          providerInput = isIdClick
            ? 'Aneka roti dan kue pastry dari layanan sarapan hotel.'
            : 'Assorted pastries and bread rolls from morning service.';
          currentDraft = await draftListing(providerInput);
        } else if (action === 'find-kitchen') {
          activeMode = 'match';
          matchPrefs = { area: 'Denpasar', category: 'prepared-meals', quantity: 12 };
          currentMatches = await matchSurplus(matchPrefs, listingService.getAllPublicListings());
        } else if (action === 'draft-msg') {
          activeMode = 'message';
          currentMessageDraft = await draftPickupMessage(messageContext);
        }
        renderView();
      });
    });

    // Draft form submit
    const draftForm = container.querySelector('#assist-draft-form');
    if (draftForm) {
      draftForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isIdSubmit = getLanguage() === 'id';
        providerInput = container.querySelector('#assist-provider-notes').value;
        try {
          currentDraft = await draftListing(providerInput);
          showToast(isIdSubmit ? 'Draf listing AI berhasil diperbarui.' : 'Updated AI listing draft.', 'info');
          renderView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const sampleBakeryBtn = container.querySelector('#assist-sample-bakery-btn');
    if (sampleBakeryBtn) {
      sampleBakeryBtn.addEventListener('click', async () => {
        const isIdSample = getLanguage() === 'id';
        providerInput = isIdSample
          ? '8 paket roti sourdough dan roti gandum bertabur biji dipanggang pukul 06.00, kantong kertas suhu ruang, ambil sebelum pukul 18.30.'
          : '8 packs of sourdough loaves and seeded rolls baked at 06:00, ambient paper bags, collect before 18:30.';
        currentDraft = await draftListing(providerInput);
        renderView();
      });
    }

    // Apply draft to Create Listing
    const applyDraftBtn = container.querySelector('#assist-apply-draft-btn');
    if (applyDraftBtn) {
      applyDraftBtn.addEventListener('click', () => {
        const isIdApply = getLanguage() === 'id';
        const editedDraft = {
          ...currentDraft,
          title: container.querySelector('#draft-edit-title')?.value || currentDraft.title,
          category: container.querySelector('#draft-edit-category')?.value || currentDraft.category,
          quantityTotal: Number(container.querySelector('#draft-edit-qty')?.value) || 10,
          unit: container.querySelector('#draft-edit-unit')?.value || currentDraft.unit,
          description: container.querySelector('#draft-edit-desc')?.value || currentDraft.description,
          storageNotes: container.querySelector('#draft-edit-storage')?.value || currentDraft.storageNotes,
          ingredients: container.querySelector('#draft-edit-ingredients')?.value || currentDraft.ingredients
        };
        appState.setPendingAiDraft(editedDraft);
        showToast(isIdApply ? 'Draf dikirim ke formulir Buat Donasi.' : 'Draft sent to Create Listing form.', 'success');
        router.navigate('/donate');
      });
    }

    const tryAgainBtn = container.querySelector('#assist-try-again-btn');
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', async () => {
        const isIdTry = getLanguage() === 'id';
        currentDraft = await draftListing(providerInput);
        showToast(isIdTry ? 'Saran draf AI dibuat ulang.' : 'Regenerated AI draft suggestion.', 'info');
        renderView();
      });
    }

    const discardBtn = container.querySelector('#assist-discard-btn');
    if (discardBtn) {
      discardBtn.addEventListener('click', async () => {
        const isIdDiscard = getLanguage() === 'id';
        providerInput = '';
        currentDraft = {
          mode: 'Demo AI',
          title: '',
          category: 'prepared-meals',
          quantityTotal: isIdDiscard ? 'Harap konfirmasi' : 'Please confirm',
          unit: isIdDiscard ? 'porsi' : 'portions',
          description: '',
          storageNotes: isIdDiscard ? 'Harap konfirmasi' : 'Please confirm',
          ingredients: isIdDiscard ? 'Harap konfirmasi' : 'Please confirm',
          missingChecklist: [
            isIdDiscard
              ? 'Masukkan catatan makanan di sebelah kiri untuk membuat draf terstruktur.'
              : 'Enter rough food details on the left to generate a structured draft.'
          ]
        };
        showToast(isIdDiscard ? 'Kolom draf dibersihkan.' : 'Cleared draft fields.', 'info');
        renderView();
      });
    }

    // Match form submit
    const matchForm = container.querySelector('#assist-match-form');
    if (matchForm) {
      matchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isIdMatch = getLanguage() === 'id';
        matchPrefs = {
          area: container.querySelector('#match-area-select').value,
          category: container.querySelector('#match-category-select').value,
          quantity: Number(container.querySelector('#match-qty-input').value) || 10
        };
        currentMatches = await matchSurplus(matchPrefs, listingService.getAllPublicListings());
        showToast(isIdMatch ? 'Peringkat rekomendasi diperbarui.' : 'Updated transparent match rankings.', 'info');
        renderView();
      });
    }

    // Message form submit
    const msgForm = container.querySelector('#assist-message-form');
    if (msgForm) {
      msgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isIdMsg = getLanguage() === 'id';
        messageContext = {
          ...messageContext,
          providerName: container.querySelector('#msg-provider').value,
          recipientName: container.querySelector('#msg-recipient').value,
          listingTitle: container.querySelector('#msg-listing').value,
          quantity: Number(container.querySelector('#msg-qty').value) || 4,
          pickupTime: container.querySelector('#msg-time').value
        };
        currentMessageDraft = await draftPickupMessage(messageContext);
        showToast(isIdMsg ? 'Draf pesan penjemputan dibuat ulang.' : 'Regenerated pickup message draft.', 'info');
        renderView();
      });
    }

    const sendMsgBtn = container.querySelector('#assist-send-demo-msg-btn');
    if (sendMsgBtn) {
      sendMsgBtn.addEventListener('click', () => {
        const isIdSend = getLanguage() === 'id';
        const subject = container.querySelector('#draft-msg-subject')?.value || '';
        const body = container.querySelector('#draft-msg-body')?.value || '';
        appState.addMessage({
          to: messageContext.providerName,
          from: messageContext.recipientName,
          subject,
          body
        });
        showToast(
          isIdSend
            ? `Pesan koordinasi tercatat untuk ${messageContext.providerName}.`
            : `Coordination message recorded for ${messageContext.providerName}.`,
          'success'
        );
      });
    }

    const copyMsgBtn = container.querySelector('#assist-copy-msg-btn');
    if (copyMsgBtn) {
      copyMsgBtn.addEventListener('click', () => {
        const isIdCopy = getLanguage() === 'id';
        const body = container.querySelector('#draft-msg-body')?.value || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(body).catch(() => {});
        }
        showToast(isIdCopy ? 'Pesan disalin ke papan klip.' : 'Pickup message copied to clipboard.', 'success');
      });
    }
  }

  initData();
}

