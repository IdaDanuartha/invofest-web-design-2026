/**
 * FoodLoop Create Listing Page - /donate (PRD Section 10)
 * 3-Step Stepper: Food details -> Collection details -> Review and publish
 * Includes integrated AI Listing Draft assistant.
 */

import { appState } from '../state.js';
import { listingService } from '../services/listingService.js';
import { draftListing } from '../services/aiService.js';
import { renderListingCard } from '../components/listingCard.js';
import { showToast } from '../components/toast.js';
import { BALI_AREAS, FOOD_CATEGORIES } from '../data/seed.js';
import { bindImageFallbacks } from '../../utils/accessibility.js';
import { escapeHtml, validateListingStep1, validateListingStep2 } from '../../utils/validation.js';
import { formatPickupWindow } from '../../utils/formatDate.js';
import { icon } from '../components/icons.js';
import { getLanguage, t } from '../services/i18nService.js';

export function renderCreateListingPage(container) {
  const pendingDraft = appState.consumePendingAiDraft();
  const currentUser = appState.getCurrentUser();
  const isId = getLanguage() === 'id';

  let currentStep = 1;
  let publishedListing = null;
  let stepErrors = {};
  let aiChecklistNotice = pendingDraft ? pendingDraft.missingChecklist : [];

  const formState = {
    title: pendingDraft?.title || '',
    category: pendingDraft?.category || 'prepared-meals',
    description: pendingDraft?.description || '',
    quantityTotal: typeof pendingDraft?.quantityTotal === 'number' ? pendingDraft.quantityTotal : 12,
    unit: pendingDraft?.unit || 'portions',
    preparedAt: '2026-11-06T11:30',
    ingredients: pendingDraft?.ingredients && !pendingDraft.ingredients.startsWith('Please confirm')
      ? pendingDraft.ingredients
      : '',
    allergens: pendingDraft?.allergens || [isId ? 'Belum terkonfirmasi / perlu pemeriksaan' : 'Not sure / needs confirmation'],
    dietaryTags: [],
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    conditionNotes: isId ? 'Baru diporsi dan dikemas rapi dalam wadah bersih.' : 'Freshly portioned and sealed in clean containers.',
    pickupStart: '2026-11-06T15:00',
    pickupEnd: '2026-11-06T17:30',
    area: currentUser?.area || 'Denpasar',
    collectionInstructions: isId
      ? 'Datang langsung ke konter dapur dan tunjukkan ID reservasi FoodLoop Anda.'
      : 'Check in at the kitchen counter and show your FoodLoop reservation ID.',
    recipientEligibility: 'any',
    contactMethod: isId
      ? 'Pesan koordinasi dalam aplikasi saat reservasi'
      : 'In-app coordination message upon reservation',
    storageNotes: pendingDraft?.storageNotes && !pendingDraft.storageNotes.startsWith('Please confirm')
      ? pendingDraft.storageNotes
      : (isId ? 'Disimpan dingin pada suhu 4°C di lemari pendingin komersial' : 'Chilled at 4°C in commercial refrigerator'),
    bringContainer: false,
    accuracyConfirmed: false
  };

  function getMissingChecklist(isId = false) {
    const items = [];
    if (!formState.preparedAt) {
      items.push(isId
        ? 'Waktu pengolahan/pembuatan belum ditentukan (sangat disarankan untuk makanan matang & roti).'
        : 'Preparation date/time is not specified (recommended for prepared meals & bakery).');
    }
    if (!formState.ingredients || formState.ingredients.trim().length === 0) {
      items.push(isId
        ? 'Daftar bahan makanan kosong - penerima akan melihat keterangan "Belum ditentukan - tanyakan sebelum memesan".'
        : 'Ingredients list is empty - recipients will see "Not specified - please ask before reserving".');
    }
    if (
      !formState.allergens ||
      formState.allergens.length === 0 ||
      formState.allergens.some((a) => /not sure|confirm|belum pasti/i.test(a))
    ) {
      items.push(isId
        ? 'Alergen memuat opsi "Belum pasti / butuh konfirmasi" - penerima akan diminta memverifikasi sebelum konsumsi.'
        : 'Allergens include "Not sure / needs confirmation" - recipients will be prompted to verify with you.');
    }
    if (!formState.storageNotes || formState.storageNotes.trim().length < 4) {
      items.push(isId
        ? 'Catatan suhu dan cara penyimpanan belum diisi.'
        : 'Storage / temperature notes are missing.');
    }
    return items;
  }

  function renderView() {
    const lang = getLanguage();
    const isId = lang === 'id';

    if (publishedListing) {
      container.innerHTML = `
        <section class="section">
          <div class="container-narrow">
            <div class="state-panel" style="border-style:solid; border-color:var(--color-leaf); background:var(--color-paper);">
              <span class="badge badge-success">
                ${icon('check', 12)} ${publishedListing.status === 'draft' ? (isId ? 'Tersimpan sebagai draf' : 'Saved as draft') : (isId ? 'Listing surplus berhasil dipublikasikan' : 'Surplus listing published')}
              </span>
              <h1 style="font-size:2rem;">${escapeHtml(publishedListing.title)}</h1>
              <p>
                ID Listing: <code style="font-family:var(--font-mono); font-weight:700;">${escapeHtml(publishedListing.id)}</code>
                • ${publishedListing.quantityTotal} ${escapeHtml(publishedListing.unit)} di ${escapeHtml(publishedListing.area)}
              </p>
              <div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top: var(--space-3);">
                <a href="#/food/${escapeHtml(publishedListing.id)}" data-link="/food/${escapeHtml(publishedListing.id)}" class="btn btn-primary">
                  ${isId ? 'Lihat Tampilan Listing' : 'View listing'}
                </a>
                <a href="#/dashboard/listings" data-link="/dashboard/listings" class="btn btn-secondary">
                  ${isId ? 'Kelola di Menu Surplus Saya' : 'Manage in My Listings'}
                </a>
                <button type="button" class="btn btn-secondary" id="copy-listing-share-btn">
                  ${isId ? 'Salin Tautan Listing' : 'Share listing link'}
                </button>
              </div>
            </div>
          </div>
        </section>
      `;

      const shareBtn = container.querySelector('#copy-listing-share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          const shareUrl = `${window.location.origin}${window.location.pathname}#/food/${publishedListing.id}`;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).catch(() => {});
          }
          showToast(isId ? `Tautan berhasil disalin: #/food/${publishedListing.id}` : `Copied share link: #/food/${publishedListing.id}`, 'success');
        });
      }
      return;
    }

    const allergenOptions = [
      { id: 'Contains gluten (wheat)', label: isId ? 'Mengandung gluten (gandum)' : 'Contains gluten (wheat)' },
      { id: 'Contains soy', label: isId ? 'Mengandung kedelai' : 'Contains soy' },
      { id: 'Contains tree nuts / peanuts', label: isId ? 'Mengandung kacang-kacangan' : 'Contains tree nuts / peanuts' },
      { id: 'Contains dairy', label: isId ? 'Mengandung susu sapi / dairy' : 'Contains dairy' },
      { id: 'Contains eggs', label: isId ? 'Mengandung telur' : 'Contains eggs' },
      { id: 'Contains sesame', label: isId ? 'Mengandung wijen' : 'Contains sesame' },
      { id: 'Not sure / needs confirmation', label: isId ? 'Belum pasti / butuh konfirmasi' : 'Not sure / needs confirmation' }
    ];

    const dietaryOptions = [
      { id: 'Vegetarian', label: 'Vegetarian' },
      { id: 'Vegan', label: 'Vegan' },
      { id: 'Dairy-free', label: isId ? 'Bebas susu (Dairy-free)' : 'Dairy-free' },
      { id: 'Halal-friendly (provider noted)', label: isId ? 'Ramah Halal (Keterangan Penyedia)' : 'Halal-friendly (provider noted)' }
    ];

    const unitOptions = [
      { id: 'portions', label: isId ? 'porsi (portions)' : 'portions' },
      { id: 'packs', label: isId ? 'bungkus (packs)' : 'packs' },
      { id: 'kg', label: 'kg' },
      { id: 'boxes', label: isId ? 'kotak / boks (boxes)' : 'boxes' },
      { id: 'items', label: isId ? 'buah / butir (items)' : 'items' }
    ];

    const presetPhotos = [
      {
        label: isId ? 'Makanan siap santap / porsi (Prepared meals)' : 'Prepared meals (bowls)',
        url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
      },
      {
        label: isId ? 'Roti & Pastry (Bakery)' : 'Bakery & sourdough',
        url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'
      },
      {
        label: isId ? 'Hasil tani segar (Fresh produce)' : 'Fresh highland produce',
        url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80'
      },
      {
        label: isId ? 'Bahan pokok & sembako (Pantry)' : 'Pantry & dry goods',
        url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80'
      }
    ];

    container.innerHTML = `
      <section class="section-sm">
        <div class="container-narrow">
          <div style="margin-bottom: var(--space-5);">
            <span class="eyebrow">${isId ? 'Alur Kerja Penyedia Makanan' : 'Provider workflow'}</span>
            <h1>${isId ? 'Pasang Surplus Makanan' : 'Create a surplus listing'}</h1>
            <p style="margin-top:6px;">
              ${isId
                ? 'Bagikan rincian jumlah porsi, jadwal penjemputan, dan informasi makanan agar warga sekitar dapat mengambil dengan tertib dan lancar.'
                : 'Share clear quantity, timing, and food disclosure details so nearby recipients can collect smoothly.'}
            </p>
          </div>

          <!-- Quick AI Assist Draft Box (PRD Section 10) -->
          <div class="ai-preview-console" style="margin-bottom: var(--space-6); background:var(--color-paper);">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge badge-ai">${icon('sparkle', 12)} ${isId ? 'Susun Draf Otomatis dengan AI' : 'Draft this listing with AI'}</span>
                <span class="badge-demo" style="padding:2px 6px; border-radius:4px;">Demo AI</span>
              </div>
              <span style="font-size:0.75rem; color:var(--color-muted);">
                ${isId ? 'AI membantu merapikan draf rincian. Mitra penyedia wajib memeriksa kebenaran data sebelum dipublikasikan.' : 'AI can help organize the details. The provider must check them before publishing.'}
              </span>
            </div>
            <div style="display:grid; grid-template-columns: 1fr auto; gap:10px; align-items:start;">
              <div>
                <label for="donate-ai-quick-input" class="sr-only">${isId ? 'Jelaskan surplus makanan dalam bahasa sehari-hari' : 'Describe your surplus in plain language'}</label>
                <input
                  type="text"
                  id="donate-ai-quick-input"
                  class="form-input"
                  placeholder="${isId ? 'contoh: 14 porsi nasi kari sayur dan nasi putih, dimasak jam 11:30, disimpan dingin 4°C, ambil sebelum 17:30' : 'e.g., 14 portions of vegetable curry and steamed rice, prepared at 11:30, chilled at 4°C, collect before 17:30'}"
                  value="${escapeHtml(pendingDraft?.rawInput || '')}"
                />
              </div>
              <button type="button" class="btn btn-secondary" id="donate-ai-draft-btn">
                ${isId ? 'Buat Draf dengan AI' : 'Draft this listing with AI'}
              </button>
            </div>
            ${
              aiChecklistNotice && aiChecklistNotice.length > 0
                ? `
                  <div class="notice-banner notice-banner-warning" style="margin-top:10px;">
                    <span class="notice-banner-icon">${icon('sparkle', 12)}</span>
                    <div>
                      <strong>${isId ? 'Draf AI diterapkan - mohon periksa dan konfirmasi rincian ini:' : 'AI draft applied - please confirm these details:'}</strong>
                      <ul style="margin-top:4px; padding-left:18px; list-style:disc; font-size:0.8rem;">
                        ${aiChecklistNotice.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                      </ul>
                    </div>
                  </div>
                `
                : ''
            }
          </div>

          <!-- 3-Step Stepper Bar -->
          <div class="stepper-bar" role="list" aria-label="Listing creation progress">
            <div class="stepper-item ${currentStep === 1 ? 'is-active' : currentStep > 1 ? 'is-done' : ''}" role="listitem">
              <span>01</span>
              <span>${isId ? 'Rincian makanan' : 'Food details'}</span>
            </div>
            <div class="stepper-item ${currentStep === 2 ? 'is-active' : currentStep > 2 ? 'is-done' : ''}" role="listitem">
              <span>02</span>
              <span>${isId ? 'Jadwal & lokasi' : 'Collection details'}</span>
            </div>
            <div class="stepper-item ${currentStep === 3 ? 'is-active' : ''}" role="listitem">
              <span>03</span>
              <span>${isId ? 'Tinjau & publikasikan' : 'Review & publish'}</span>
            </div>
          </div>

          <!-- Step Content Panel -->
          <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-lg); padding: var(--space-6);">
            ${
              currentStep === 1
                ? `
                  <h2 style="font-size:1.35rem; margin-bottom: var(--space-4);">${isId ? 'Langkah 1: Rincian Makanan' : 'Step 1: Food details'}</h2>

                  <div class="form-group">
                    <label for="f-title" class="form-label">${isId ? 'Nama Makanan *' : 'Listing title *'}</label>
                    <input
                      type="text"
                      id="f-title"
                      class="form-input ${stepErrors.title ? 'is-invalid' : ''}"
                      value="${escapeHtml(formState.title)}"
                      placeholder="${isId ? 'contoh: Nasi Kotak Ayam Bakar atau Roti Sourdough Artisan' : 'e.g., Vegetable rice bowls or Artisan sourdough loaves'}"
                    />
                    ${stepErrors.title ? `<span class="form-error">${escapeHtml(stepErrors.title)}</span>` : ''}
                  </div>

                  <div class="grid-3">
                    <div class="form-group">
                      <label for="f-category" class="form-label">${isId ? 'Kategori Makanan *' : 'Food category *'}</label>
                      <select id="f-category" class="form-select">
                        ${FOOD_CATEGORIES.map(
                          (c) => `<option value="${escapeHtml(c.id)}" ${formState.category === c.id ? 'selected' : ''}>${escapeHtml(
                            isId
                              ? c.id === 'prepared-meals' ? 'Makanan Siap Santap'
                                : c.id === 'bakery' ? 'Roti & Pastry'
                                : c.id === 'produce' ? 'Hasil Tani & Sayur'
                                : c.id === 'grocery' ? 'Bahan Pokok & Sembako'
                                : 'Surplus Lainnya'
                              : c.label
                          )}</option>`
                        ).join('')}
                      </select>
                    </div>

                    <div class="form-group">
                      <label for="f-quantity" class="form-label">${isId ? 'Jumlah Tersedia *' : 'Quantity available *'}</label>
                      <input
                        type="number"
                        id="f-quantity"
                        class="form-input ${stepErrors.quantityTotal ? 'is-invalid' : ''}"
                        min="1"
                        max="2000"
                        value="${escapeHtml(String(formState.quantityTotal))}"
                      />
                      ${stepErrors.quantityTotal ? `<span class="form-error">${escapeHtml(stepErrors.quantityTotal)}</span>` : ''}
                    </div>

                    <div class="form-group">
                      <label for="f-unit" class="form-label">${isId ? 'Satuan *' : 'Unit *'}</label>
                      <select id="f-unit" class="form-select">
                        ${unitOptions
                          .map((u) => `<option value="${u.id}" ${formState.unit === u.id ? 'selected' : ''}>${escapeHtml(u.label)}</option>`)
                          .join('')}
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="f-description" class="form-label">${isId ? 'Deskripsi Makanan *' : 'Description *'}</label>
                    <textarea
                      id="f-description"
                      class="form-textarea ${stepErrors.description ? 'is-invalid' : ''}"
                      placeholder="${isId ? 'Jelaskan apa saja yang didapat, bagaimana makanan dikemas, dan ukuran porsi...' : 'Describe what is included, how it is packed, and portion size...'}"
                    >${escapeHtml(formState.description)}</textarea>
                    ${stepErrors.description ? `<span class="form-error">${escapeHtml(stepErrors.description)}</span>` : ''}
                  </div>

                  <div class="grid-2">
                    <div class="form-group">
                      <label for="f-preparedAt" class="form-label">
                        <span>${isId ? 'Waktu Pengolahan / Pembuatan' : 'Preparation / baking time'}</span>
                        <span class="form-label-optional">${isId ? 'Opsional tapi disarankan' : 'Optional where relevant'}</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="f-preparedAt"
                        class="form-input"
                        value="${escapeHtml(formState.preparedAt)}"
                      />
                    </div>

                    <div class="form-group">
                      <label for="f-ingredients" class="form-label">
                        <span>${isId ? 'Daftar Bahan Makanan' : 'Ingredients'}</span>
                        <span class="form-label-optional">${isId ? 'Pisahkan dengan koma' : 'Comma-separated'}</span>
                      </label>
                      <input
                        type="text"
                        id="f-ingredients"
                        class="form-input"
                        value="${escapeHtml(formState.ingredients)}"
                        placeholder="${isId ? 'contoh: nasi putih, tahu tempe, wortel, kecap asin' : 'e.g., steamed rice, tofu, carrots, soy sauce'}"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <span class="form-label">${isId ? 'Pernyataan Kandungan Alergen (Pilih yang sesuai atau tandai butuh konfirmasi) *' : 'Allergen disclosure (select all that apply or mark needs confirmation) *'}</span>
                    <div class="grid-2" style="gap:6px; padding:10px 14px; background:var(--color-cream); border-radius:var(--radius-sm); border:1px solid var(--color-line);">
                      ${allergenOptions
                        .map(
                          (alg) => `
                            <label class="checkbox-label">
                              <input
                                type="checkbox"
                                name="f-allergens"
                                value="${escapeHtml(alg.id)}"
                                ${formState.allergens.includes(alg.id) ? 'checked' : ''}
                              />
                              <span>${escapeHtml(alg.label)}</span>
                            </label>
                          `
                        )
                        .join('')}
                    </div>
                  </div>

                  <div class="form-group">
                    <span class="form-label">
                      <span>${isId ? 'Informasi Diet & Halal (Hanya yang dikonfirmasi penyedia)' : 'Dietary information (provider-confirmed only)'}</span>
                      <span class="form-label-optional">${isId ? 'Jangan menebak' : 'Never guess'}</span>
                    </span>
                    <div style="display:flex; flex-wrap:wrap; gap:14px;">
                      ${dietaryOptions
                        .map(
                          (tag) => `
                            <label class="checkbox-label">
                              <input
                                type="checkbox"
                                name="f-dietary"
                                value="${escapeHtml(tag.id)}"
                                ${formState.dietaryTags.includes(tag.id) ? 'checked' : ''}
                              />
                              <span>${escapeHtml(tag.label)}</span>
                            </label>
                          `
                        )
                        .join('')}
                    </div>
                  </div>

                  <div class="grid-2">
                    <div class="form-group">
                      <label for="f-photo-preset" class="form-label">${isId ? 'Foto Makanan (Pilihan preset atau unggah foto)' : 'Food photo (preset or upload up to 4)'}</label>
                      <select id="f-photo-preset" class="form-select">
                        ${presetPhotos
                          .map(
                            (p) => `<option value="${escapeHtml(p.url)}" ${formState.image === p.url ? 'selected' : ''}>${escapeHtml(p.label)}</option>`
                          )
                          .join('')}
                      </select>
                      <input type="file" id="f-photo-upload" accept="image/*" multiple class="form-input" style="margin-top:6px; padding:6px;" />
                    </div>

                    <div class="form-group">
                      <label for="f-condition" class="form-label">${isId ? 'Catatan Kemasan & Kondisi Fisik' : 'Condition & packaging notes'}</label>
                      <textarea id="f-condition" class="form-textarea" style="min-height:84px;">${escapeHtml(formState.conditionNotes)}</textarea>
                    </div>
                  </div>

                  <div style="display:flex; justify-content:space-between; gap:12px; margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-line);">
                    <button type="button" class="btn btn-secondary" id="step1-save-draft-btn">${isId ? 'Simpan sebagai Draf' : 'Save as draft'}</button>
                    <button type="button" class="btn btn-primary" id="step1-next-btn">${isId ? 'Lanjut: Jadwal & Lokasi →' : 'Next: Collection details →'}</button>
                  </div>
                `
                : currentStep === 2
                ? `
                  <h2 style="font-size:1.35rem; margin-bottom: var(--space-4);">${isId ? 'Langkah 2: Jadwal & Lokasi Pengambilan' : 'Step 2: Collection details'}</h2>

                  <div class="grid-2">
                    <div class="form-group">
                      <label for="f-pickupStart" class="form-label">${isId ? 'Jam Mulai Pengambilan *' : 'Collection window start *'}</label>
                      <input
                        type="datetime-local"
                        id="f-pickupStart"
                        class="form-input ${stepErrors.pickupStart ? 'is-invalid' : ''}"
                        value="${escapeHtml(formState.pickupStart)}"
                      />
                      ${stepErrors.pickupStart ? `<span class="form-error">${escapeHtml(stepErrors.pickupStart)}</span>` : ''}
                    </div>

                    <div class="form-group">
                      <label for="f-pickupEnd" class="form-label">${isId ? 'Batas Akhir Pengambilan *' : 'Collection deadline *'}</label>
                      <input
                        type="datetime-local"
                        id="f-pickupEnd"
                        class="form-input ${stepErrors.pickupEnd ? 'is-invalid' : ''}"
                        value="${escapeHtml(formState.pickupEnd)}"
                      />
                      ${stepErrors.pickupEnd ? `<span class="form-error">${escapeHtml(stepErrors.pickupEnd)}</span>` : ''}
                    </div>
                  </div>

                  <div class="grid-2">
                    <div class="form-group">
                      <label for="f-area" class="form-label">${isId ? 'Wilayah di Bali *' : 'Approximate area (Bali) *'}</label>
                      <select id="f-area" class="form-select">
                        ${BALI_AREAS.map(
                          (a) => `<option value="${escapeHtml(a)}" ${formState.area === a ? 'selected' : ''}>${escapeHtml(a)}</option>`
                        ).join('')}
                      </select>
                    </div>

                    <div class="form-group">
                      <label for="f-eligibility" class="form-label">${isId ? 'Kriteria Penerima Makanan *' : 'Recipient preference *'}</label>
                      <select id="f-eligibility" class="form-select">
                        <option value="any" ${formState.recipientEligibility === 'any' ? 'selected' : ''}>${isId ? 'Semua penerima (Komunitas & Warga individu)' : 'Any eligible recipient (orgs & individuals)'}</option>
                        <option value="organization" ${formState.recipientEligibility === 'organization' ? 'selected' : ''}>${isId ? 'Khusus komunitas / dapur umum terverifikasi' : 'Verified recipient organization only'}</option>
                        <option value="invited" ${formState.recipientEligibility === 'invited' ? 'selected' : ''}>${isId ? 'Organisasi mitra undangan khusus' : 'Invited partner organization'}</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="f-instructions" class="form-label">${isId ? 'Petunjuk Penjemputan di Tempat *' : 'Collection instructions *'}</label>
                    <textarea
                      id="f-instructions"
                      class="form-textarea ${stepErrors.collectionInstructions ? 'is-invalid' : ''}"
                      placeholder="${isId ? 'Ke mana penerima harus melapor? Siapa staf atau konter yang harus ditemui?' : 'Where should the recipient check in? Who should they ask for?'}"
                    >${escapeHtml(formState.collectionInstructions)}</textarea>
                    ${stepErrors.collectionInstructions ? `<span class="form-error">${escapeHtml(stepErrors.collectionInstructions)}</span>` : ''}
                  </div>

                  <div class="grid-2">
                    <div class="form-group">
                      <label for="f-storage" class="form-label">${isId ? 'Informasi Suhu & Cara Penyimpanan *' : 'Storage / temperature information *'}</label>
                      <input
                        type="text"
                        id="f-storage"
                        class="form-input"
                        value="${escapeHtml(formState.storageNotes)}"
                        placeholder="${isId ? 'contoh: Disimpan dingin di kulkas 4°C atau Rak suhu ruang' : 'e.g., Chilled at 4°C or Ambient bakery rack'}"
                      />
                    </div>

                    <div class="form-group">
                      <label for="f-contact" class="form-label">${isId ? 'Metode Koordinasi' : 'Contact method'}</label>
                      <input
                        type="text"
                        id="f-contact"
                        class="form-input"
                        value="${escapeHtml(formState.contactMethod)}"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" id="f-bringContainer" ${formState.bringContainer ? 'checked' : ''} />
                      <span>${isId ? 'Penerima wajib membawa wadah, tas, atau kotak sendiri saat mengambil makanan' : 'Recipient needs to bring their own clean containers, crates, or bags for transfer'}</span>
                    </label>
                  </div>

                  <div style="display:flex; justify-content:space-between; gap:12px; margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-line);">
                    <button type="button" class="btn btn-secondary" id="step2-back-btn">${isId ? '← Kembali ke Rincian Makanan' : '← Back to Food details'}</button>
                    <button type="button" class="btn btn-primary" id="step2-next-btn">${isId ? 'Lanjut: Tinjau & Publikasikan →' : 'Next: Review & publish →'}</button>
                  </div>
                `
                : `
                  <h2 style="font-size:1.35rem; margin-bottom: var(--space-4);">${isId ? 'Langkah 3: Tinjau dan Publikasikan' : 'Step 3: Review and publish'}</h2>

                  <div class="grid-2" style="align-items:start; margin-bottom: var(--space-5);">
                    <div>
                      <span class="listing-spec-label" style="margin-bottom:8px;">${isId ? 'Pratinjau Kartu untuk Penerima' : 'Recipient Card Preview'}</span>
                      ${renderListingCard({
                        id: 'preview_card',
                        title: formState.title || (isId ? 'Listing tanpa judul' : 'Untitled listing'),
                        category: formState.category,
                        description: formState.description,
                        quantityTotal: Number(formState.quantityTotal) || 1,
                        quantityAvailable: Number(formState.quantityTotal) || 1,
                        unit: formState.unit,
                        providerName: currentUser?.role === 'provider' ? currentUser.name : 'Demo Kitchen',
                        providerType: currentUser?.organizationType || 'Restaurant',
                        area: formState.area,
                        pickupStart: formState.pickupStart,
                        pickupEnd: formState.pickupEnd,
                        allergens: formState.allergens,
                        dietaryTags: formState.dietaryTags,
                        recipientEligibility: formState.recipientEligibility,
                        image: formState.image,
                        status: 'available',
                        isDemo: true
                      })}
                    </div>

                    <div>
                      <span class="listing-spec-label" style="margin-bottom:8px;">${isId ? 'Pemeriksaan Kelengkapan Informasi' : 'Summary & Missing Information Check'}</span>
                      <div class="info-spec-box" style="margin-bottom:12px;">
                        <div style="margin-bottom:8px;">
                          <span class="listing-spec-label">${isId ? 'Jadwal Pengambilan' : 'Collection window'}</span>
                          <strong>${escapeHtml(formatPickupWindow(formState.pickupStart, formState.pickupEnd))}</strong>
                        </div>
                        <div style="margin-bottom:8px;">
                          <span class="listing-spec-label">${isId ? 'Keterangan Bahan Makanan' : 'Ingredients disclosed'}</span>
                          <span>${escapeHtml(formState.ingredients || (isId ? 'Belum ditentukan' : 'Not specified'))}</span>
                        </div>
                        <div style="margin-bottom:8px;">
                          <span class="listing-spec-label">${isId ? 'Pernyataan Alergen' : 'Allergen disclosure'}</span>
                          <strong>${escapeHtml(formState.allergens.join(', '))}</strong>
                        </div>
                        <div>
                          <span class="listing-spec-label">${isId ? 'Cara & Suhu Penyimpanan' : 'Storage & handling'}</span>
                          <span>${escapeHtml(formState.storageNotes)}</span>
                        </div>
                      </div>

                      ${
                        getMissingChecklist(isId).length > 0
                          ? `
                            <div class="notice-banner notice-banner-warning">
                              <span class="notice-banner-icon">${icon('alertTriangle', 12)}</span>
                              <div>
                                <strong>${isId ? 'Daftar rincian yang belum lengkap atau perlu dicek:' : 'Missing / unconfirmed details checklist:'}</strong>
                                <ul style="margin-top:4px; padding-left:16px; list-style:disc; font-size:0.8rem;">
                                  ${getMissingChecklist(isId).map((m) => `<li>${escapeHtml(m)}</li>`).join('')}
                                </ul>
                              </div>
                            </div>
                          `
                          : `
                            <div class="notice-banner">
                              <span class="notice-banner-icon">${icon('check', 12)}</span>
                              <span>${isId ? 'Seluruh kolom penting makanan, suhu simpan, dan alergen telah terisi dengan baik.' : 'All recommended food, storage, and allergen fields are filled out.'}</span>
                            </div>
                          `
                      }
                    </div>
                  </div>

                  <div class="form-group" style="padding:12px 16px; background:var(--color-cream); border-radius:var(--radius-sm); border:1px solid var(--color-line);">
                    <label class="checkbox-label">
                      <input type="checkbox" id="f-accuracy-confirm" ${formState.accuracyConfirmed ? 'checked' : ''} />
                      <span>
                        <strong>${isId ? 'Konfirmasi keakuratan data:' : 'Confirm accuracy:'}</strong> ${isId ? 'Saya mengonfirmasi bahwa deskripsi makanan, riwayat penyimpanan, dan pernyataan alergen di atas adalah benar dan akurat, serta makanan ini layak dikonsumsi.' : 'I confirm that the food description, storage history, and allergen disclosure are accurate to the best of my knowledge, and that this surplus is suitable for redistribution.'}
                      </span>
                    </label>
                    ${stepErrors.accuracy ? `<span class="form-error" style="margin-top:6px;">${escapeHtml(stepErrors.accuracy)}</span>` : ''}
                  </div>

                  <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:12px; margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--color-line);">
                    <button type="button" class="btn btn-secondary" id="step3-back-btn">${isId ? '← Ubah Jadwal & Lokasi' : '← Edit collection details'}</button>
                    <div style="display:flex; gap:10px;">
                      <button type="button" class="btn btn-secondary" id="step3-draft-btn">${isId ? 'Simpan sebagai Draf' : 'Save as draft'}</button>
                      <button type="button" class="btn btn-primary btn-lg" id="step3-publish-btn">${isId ? 'Publikasikan Listing (100% Gratis)' : 'Publish surplus listing'}</button>
                    </div>
                  </div>
                `
            }
          </div>
        </div>
      </section>
    `;

    bindImageFallbacks(container);
    bindStepEvents();
  }

  function syncStep1Fields() {
    const titleEl = container.querySelector('#f-title');
    if (!titleEl) return;
    formState.title = titleEl.value;
    formState.category = container.querySelector('#f-category').value;
    formState.quantityTotal = Number(container.querySelector('#f-quantity').value);
    formState.unit = container.querySelector('#f-unit').value;
    formState.description = container.querySelector('#f-description').value;
    formState.preparedAt = container.querySelector('#f-preparedAt').value;
    formState.ingredients = container.querySelector('#f-ingredients').value;
    formState.allergens = Array.from(container.querySelectorAll('input[name="f-allergens"]:checked')).map((el) => el.value);
    formState.dietaryTags = Array.from(container.querySelectorAll('input[name="f-dietary"]:checked')).map((el) => el.value);
    formState.conditionNotes = container.querySelector('#f-condition').value;
  }

  function syncStep2Fields() {
    const startEl = container.querySelector('#f-pickupStart');
    if (!startEl) return;
    formState.pickupStart = startEl.value;
    formState.pickupEnd = container.querySelector('#f-pickupEnd').value;
    formState.area = container.querySelector('#f-area').value;
    formState.recipientEligibility = container.querySelector('#f-eligibility').value;
    formState.collectionInstructions = container.querySelector('#f-instructions').value;
    formState.storageNotes = container.querySelector('#f-storage').value;
    formState.contactMethod = container.querySelector('#f-contact').value;
    formState.bringContainer = container.querySelector('#f-bringContainer').checked;
  }

  function bindStepEvents() {
    // AI quick draft button
    const aiBtn = container.querySelector('#donate-ai-draft-btn');
    const aiInput = container.querySelector('#donate-ai-quick-input');
    if (aiBtn && aiInput) {
      aiBtn.addEventListener('click', async () => {
        if (currentStep === 1) syncStep1Fields();
        if (currentStep === 2) syncStep2Fields();
        const promptText = aiInput.value.trim() || '12 portions of vegetable rice, prepared at 11:00, chilled, collect before 17:00.';
        aiInput.value = promptText;
        try {
          const draft = await draftListing(promptText, { area: formState.area });
          formState.title = draft.title;
          formState.category = draft.category;
          if (typeof draft.quantityTotal === 'number') {
            formState.quantityTotal = draft.quantityTotal;
          }
          formState.unit = draft.unit;
          formState.description = draft.description;
          if (!draft.ingredients.startsWith('Please confirm')) {
            formState.ingredients = draft.ingredients;
          }
          if (!draft.storageNotes.startsWith('Please confirm')) {
            formState.storageNotes = draft.storageNotes;
          }
          aiChecklistNotice = draft.missingChecklist;
          showToast('AI draft applied. Please review and confirm all fields.', 'info');
          renderView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Preset or uploaded photo on Step 1
    const presetSelect = container.querySelector('#f-photo-preset');
    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        formState.image = presetSelect.value;
      });
    }
    const uploadInput = container.querySelector('#f-photo-upload');
    if (uploadInput) {
      uploadInput.addEventListener('change', () => {
        const file = uploadInput.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              formState.image = reader.result;
              showToast('Custom food photo attached for preview.', 'success');
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Step 1 buttons
    const step1Next = container.querySelector('#step1-next-btn');
    if (step1Next) {
      step1Next.addEventListener('click', () => {
        syncStep1Fields();
        const validation = validateListingStep1(formState);
        if (!validation.isValid) {
          stepErrors = validation.errors;
          renderView();
          return;
        }
        stepErrors = {};
        currentStep = 2;
        renderView();
      });
    }

    const step1Draft = container.querySelector('#step1-save-draft-btn');
    if (step1Draft) {
      step1Draft.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        syncStep1Fields();
        if (!formState.title.trim()) {
          formState.title = isId ? 'Draf Surplus Tanpa Judul' : 'Untitled surplus draft';
        }
        publishedListing = listingService.createListing(formState, 'draft');
        showToast(isId ? 'Listing disimpan ke draf Anda.' : 'Listing saved to your drafts.', 'info');
        renderView();
      });
    }

    // Step 2 buttons
    const step2Back = container.querySelector('#step2-back-btn');
    if (step2Back) {
      step2Back.addEventListener('click', () => {
        syncStep2Fields();
        stepErrors = {};
        currentStep = 1;
        renderView();
      });
    }

    const step2Next = container.querySelector('#step2-next-btn');
    if (step2Next) {
      step2Next.addEventListener('click', () => {
        syncStep2Fields();
        const validation = validateListingStep2(formState);
        if (!validation.isValid) {
          stepErrors = validation.errors;
          renderView();
          return;
        }
        stepErrors = {};
        currentStep = 3;
        renderView();
      });
    }

    // Step 3 buttons
    const step3Back = container.querySelector('#step3-back-btn');
    if (step3Back) {
      step3Back.addEventListener('click', () => {
        stepErrors = {};
        currentStep = 2;
        renderView();
      });
    }

    const step3Draft = container.querySelector('#step3-draft-btn');
    if (step3Draft) {
      step3Draft.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        publishedListing = listingService.createListing(formState, 'draft');
        showToast(isId ? 'Listing disimpan sebagai draf.' : 'Saved listing as draft.', 'info');
        renderView();
      });
    }

    const step3Publish = container.querySelector('#step3-publish-btn');
    if (step3Publish) {
      step3Publish.addEventListener('click', () => {
        const isId = getLanguage() === 'id';
        const confirmed = container.querySelector('#f-accuracy-confirm')?.checked;
        formState.accuracyConfirmed = Boolean(confirmed);
        if (!confirmed) {
          stepErrors = {
            accuracy: isId
              ? 'Mohon konfirmasi bahwa rincian makanan dan informasi alergen sudah akurat sebelum mempublikasikan.'
              : 'Please confirm that the food and allergen information is accurate before publishing.'
          };
          renderView();
          return;
        }
        publishedListing = listingService.createListing(formState, 'available');
        showToast(isId ? 'Listing surplus berhasil dipublikasikan!' : 'Surplus listing published!', 'success');
        renderView();
      });
    }
  }

  renderView();
}

