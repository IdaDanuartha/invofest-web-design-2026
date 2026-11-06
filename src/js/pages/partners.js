/**
 * FoodLoop Partners Page - /partners (PRD Section 12)
 */

import { appState } from '../state.js';
import { BALI_AREAS } from '../data/seed.js';
import { showToast } from '../components/toast.js';
import { escapeHtml, isValidEmail } from '../../utils/validation.js';
import { icon } from '../components/icons.js';
import { getLanguage } from '../services/i18nService.js';

export function renderPartnersPage(container) {
  let typeFilter = 'all';
  let areaFilter = 'all';
  let applicationSubmitted = null;
  let formError = '';

  function renderView() {
    const isId = getLanguage() === 'id';
    const { partners } = appState.getState();

    const filteredPartners = partners.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (areaFilter !== 'all' && p.area !== areaFilter) return false;
      return true;
    });

    container.innerHTML = `
      <section class="section-sm">
        <div class="container">
          <!-- Intro -->
          <div style="max-width:720px; margin-bottom: var(--space-8);">
            <span class="eyebrow">${isId ? 'Ekosistem Mitra Bali' : 'Bali Partner Ecosystem'}</span>
            <h1>${isId ? 'Makanan baik bergerak lebih jauh bersama.' : 'Good food moves further together.'}</h1>
            <p style="margin-top:10px; font-size:1.0625rem;">
              ${isId
                ? 'FoodLoop menghubungkan bisnis kuliner, pasar & toko kelontong lokal, dapur umum sosial, dan relawan logistik di seluruh Denpasar dan Badung agar surplus makanan dapat dibagikan secara berkelanjutan.'
                : 'FoodLoop connects hospitality businesses, local grocers, community kitchens, and volunteer transport relays across Denpasar and Badung so edible surplus is shared reliably.'
              }
            </p>
          </div>

          <!-- Partner Types: What Each Contributes & Receives -->
          <div class="grid-3" style="margin-bottom: var(--space-10);">
            <div class="ecosystem-card">
              <span class="badge badge-forest" style="align-self:flex-start;">${isId ? 'Penyedia makanan' : 'Food providers'}</span>
              <h3>${isId ? 'Restoran, bakery, hotel & toko pangan' : 'Restaurants, bakeries, hotels &amp; grocers'}</h3>
              <div style="font-size:0.85rem; margin-top:4px;">
                <strong>${isId ? 'Kontribusi:' : 'Contributes:'}</strong>
                <p style="margin-top:2px;">${isId ? 'Makanan berlebih berkualitas layak konsumsi, catatan cara simpan & alergen, dan jam penjemputan yang jelas.' : 'Portioned surplus food, accurate storage &amp; allergen notes, and a clear collection window.'}</p>
              </div>
              <div style="font-size:0.85rem; padding-top:8px; border-top:1px solid var(--color-line);">
                <strong>${isId ? 'Manfaat:' : 'Receives:'}</strong>
                <p style="margin-top:2px;">${isId ? 'Pesanan terstruktur tanpa pesan berulang, pengurangan limbah dapur, dan rekam jejak dampak sosial resmi.' : 'Structured reservations, fewer uncoordinated messages, reduced kitchen waste, and transparent handoff records.'}</p>
              </div>
            </div>

            <div class="ecosystem-card">
              <span class="badge badge-forest" style="align-self:flex-start;">${isId ? 'Organisasi komunitas' : 'Community organizations'}</span>
              <h3>${isId ? 'Dapur umum, panti sosial & relawan' : 'Community kitchens, pantries &amp; shelters'}</h3>
              <div style="font-size:0.85rem; margin-top:4px;">
                <strong>${isId ? 'Kontribusi:' : 'Contributes:'}</strong>
                <p style="margin-top:2px;">${isId ? 'Pengambilan tertib sesuai jadwal outlet, verifikasi fisik saat serah terima, dan distribusi makanan ke warga yang membutuhkan.' : 'Reliable collection within the provider’s window, on-site inspection, and community meal distribution.'}</p>
              </div>
              <div style="font-size:0.85rem; padding-top:8px; border-top:1px solid var(--color-line);">
                <strong>${isId ? 'Manfaat:' : 'Receives:'}</strong>
                <p style="margin-top:2px;">${isId ? 'Kepastian jumlah porsi, kategori makanan, dan keterbukaan alergen sebelum berangkat ke lokasi.' : 'Advance visibility into local surplus quantities, categories, and dietary disclosures before travelling.'}</p>
              </div>
            </div>

            <div class="ecosystem-card">
              <span class="badge badge-forest" style="align-self:flex-start;">${isId ? 'Mitra pengantaran' : 'Collection partners'}</span>
              <h3>${isId ? 'Kurir relawan & jejaring pengantaran' : 'Volunteer couriers &amp; transport relays'}</h3>
              <div style="font-size:0.85rem; margin-top:4px;">
                <strong>${isId ? 'Kontribusi:' : 'Contributes:'}</strong>
                <p style="margin-top:2px;">${isId ? 'Bantuan transportasi boks berpendingin/terisolasi antara outlet penyedia dan dapur umum.' : 'Insulated box transport between participating food businesses and community kitchens.'}</p>
              </div>
              <div style="font-size:0.85rem; padding-top:8px; border-top:1px solid var(--color-line);">
                <strong>${isId ? 'Manfaat:' : 'Receives:'}</strong>
                <p style="margin-top:2px;">${isId ? 'Petunjuk penjemputan lokasi yang jelas, ID tiket terverifikasi, dan waktu pengambilan terjadwal rapi.' : 'Clear pickup instructions, verified reservation IDs, and scheduled handoff windows.'}</p>
              </div>
            </div>
          </div>

          <!-- Partner Directory -->
          <div style="margin-bottom: var(--space-10);">
            <div class="section-header">
              <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                  <span class="eyebrow" style="margin-bottom:0;">${isId ? 'Direktori' : 'Directory'}</span>
                  <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${isId ? 'Direktori mitra demo Bali' : 'Demo partner directory'}</span>
                </div>
                <h2>${isId ? 'Mitra Berpartisipasi di Bali' : 'Participating demo partners'}</h2>
              </div>

              <div style="display:flex; flex-wrap:wrap; gap:10px;">
                <select id="partner-type-filter" class="form-select" style="width:auto; min-height:40px;">
                  <option value="all" ${typeFilter === 'all' ? 'selected' : ''}>${isId ? 'Semua tipe mitra' : 'All partner types'}</option>
                  <option value="Food provider" ${typeFilter === 'Food provider' ? 'selected' : ''}>${isId ? 'Penyedia makanan' : 'Food providers'}</option>
                  <option value="Community organization" ${typeFilter === 'Community organization' ? 'selected' : ''}>${isId ? 'Organisasi komunitas' : 'Community organizations'}</option>
                  <option value="Collection partner" ${typeFilter === 'Collection partner' ? 'selected' : ''}>${isId ? 'Mitra pengantaran' : 'Collection partners'}</option>
                </select>

                <select id="partner-area-filter" class="form-select" style="width:auto; min-height:40px;">
                  <option value="all" ${areaFilter === 'all' ? 'selected' : ''}>${isId ? 'Semua wilayah Bali' : 'All Bali areas'}</option>
                  ${BALI_AREAS.map(
                    (a) => `<option value="${escapeHtml(a)}" ${areaFilter === a ? 'selected' : ''}>${escapeHtml(a)}</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            ${
              filteredPartners.length === 0
                ? `
                  <div class="state-panel">
                    <h3>${isId ? 'Tidak ada mitra demo yang sesuai dengan filter ini' : 'No demo partners match these filters'}</h3>
                    <button type="button" class="btn btn-secondary btn-sm" id="reset-partner-filters-btn">${isId ? 'Tampilkan semua mitra' : 'Show all demo partners'}</button>
                  </div>
                `
                : `
                  <div class="grid-3">
                    ${filteredPartners
                      .map(
                        (p) => `
                          <article class="ecosystem-card">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                              <span class="badge badge-neutral">${escapeHtml(
                                isId
                                  ? p.type === 'Food provider' ? 'Penyedia makanan'
                                    : p.type === 'Community organization' ? 'Organisasi komunitas'
                                    : 'Mitra pengantaran'
                                  : p.type
                              )}</span>
                              <span class="badge-demo" style="padding:2px 6px; border-radius:4px;">${isId ? 'Mitra demo' : 'Demo partner'}</span>
                            </div>
                            <div>
                              <h3 style="font-size:1.15rem;">${escapeHtml(p.name)}</h3>
                              <div style="font-size:0.8rem; color:var(--color-muted); margin-top:2px;">
                                ${escapeHtml(p.subType)} • ${icon('mapPin', 13)} ${escapeHtml(p.area)}
                              </div>
                            </div>
                            <p style="font-size:0.875rem;">${escapeHtml(p.description)}</p>
                            <div style="margin-top:auto; padding-top:10px; border-top:1px solid var(--color-line); font-size:0.78rem;">
                              <div style="color:var(--color-muted); margin-bottom:4px;">
                                <strong>${isId ? 'Kategori:' : 'Categories:'}</strong> ${escapeHtml((p.categories || []).join(', '))}
                              </div>
                              <div style="color:var(--color-ink-soft);">
                                <strong>${isId ? 'Jadwal:' : 'Schedule:'}</strong> ${escapeHtml(p.schedule)}
                              </div>
                            </div>
                          </article>
                        `
                      )
                      .join('')}
                  </div>
                `
            }
          </div>

          <!-- Become a Partner Form (PRD Section 12) -->
          <div id="become-partner-section" style="background:var(--color-paper); border:1px solid var(--color-line-strong); border-radius:var(--radius-lg); padding: var(--space-7);">
            <div class="grid-asymmetric" style="align-items:start;">
              <div>
                <span class="eyebrow">${isId ? 'Bergabung ke Jejaring' : 'Join the network'}</span>
                <h2>${isId ? 'Daftar Menjadi Mitra FoodLoop' : 'Become a FoodLoop partner'}</h2>
                <p style="margin-top:8px; margin-bottom:16px;">
                  ${isId
                    ? 'Baik Anda mengelola restoran/toko roti dengan surplus harian, atau mengoordinasikan dapur umum untuk warga di Bali, daftarkan organisasi Anda di bawah ini.'
                    : 'Whether you run a kitchen with recurring end-of-day surplus or coordinate a community meal program in Bali, register your organization below.'
                  }
                </p>
                <div class="notice-banner">
                  <span class="notice-banner-icon">${icon('info', 12)}</span>
                  <span>
                    ${isId
                      ? 'Pendaftaran mitra baru dalam prototipe demo ini akan langsung ditambahkan ke direktori di atas dengan label <code>Mitra demo</code>.'
                      : 'New demo partner submissions are added immediately to the directory above with a <code>Demo partner</code> label.'
                    }
                  </span>
                </div>
              </div>

              <div>
                ${
                  applicationSubmitted
                    ? `
                      <div class="state-panel" style="border-style:solid; border-color:var(--color-leaf);">
                        <span class="badge badge-success">${icon('check', 12)} ${isId ? 'Pendaftaran mitra berhasil dicatat' : 'Partner application recorded'}</span>
                        <h3>${isId ? 'Selamat Datang,' : 'Welcome,'} ${escapeHtml(applicationSubmitted.name)}!</h3>
                        <p style="font-size:0.875rem;">
                          ${isId
                            ? `Organisasi Anda telah ditambahkan ke direktori mitra demo Bali di bawah kategori <strong>${escapeHtml(applicationSubmitted.type)}</strong> wilayah <strong>${escapeHtml(applicationSubmitted.area)}</strong>.`
                            : `Your organization has been added to the Bali demo partner directory under <strong>${escapeHtml(applicationSubmitted.type)}</strong> in <strong>${escapeHtml(applicationSubmitted.area)}</strong>.`
                          }
                        </p>
                        <button type="button" class="btn btn-secondary btn-sm" id="partner-another-btn">${isId ? 'Daftarkan organisasi lainnya' : 'Submit another organization'}</button>
                      </div>
                    `
                    : `
                      <form id="partner-application-form" novalidate>
                        <div class="grid-2">
                          <div class="form-group">
                            <label for="p-org-name" class="form-label">${isId ? 'Nama Organisasi / Usaha *' : 'Organization name *'}</label>
                            <input type="text" id="p-org-name" class="form-input" placeholder="${isId ? 'contoh: Dapur Sosial Ubud' : 'e.g., Ubud Community Kitchen'}" required />
                          </div>
                          <div class="form-group">
                            <label for="p-contact-person" class="form-label">${isId ? 'Nama Kontak Person *' : 'Contact person *'}</label>
                            <input type="text" id="p-contact-person" class="form-input" placeholder="${isId ? 'Nama lengkap' : 'Full name'}" required />
                          </div>
                        </div>

                        <div class="grid-3">
                          <div class="form-group">
                            <label for="p-email" class="form-label">${isId ? 'Email Kontak *' : 'Email *'}</label>
                            <input type="email" id="p-email" class="form-input" placeholder="kontak@organisasi.test" required />
                          </div>
                          <div class="form-group">
                            <label for="p-type" class="form-label">${isId ? 'Tipe Organisasi *' : 'Organization type *'}</label>
                            <select id="p-type" class="form-select">
                              <option value="Food provider">${isId ? 'Penyedia makanan' : 'Food provider'}</option>
                              <option value="Community organization">${isId ? 'Organisasi komunitas' : 'Community organization'}</option>
                              <option value="Collection partner">${isId ? 'Mitra pengantaran' : 'Collection partner'}</option>
                            </select>
                          </div>
                          <div class="form-group">
                            <label for="p-area" class="form-label">${isId ? 'Wilayah di Bali *' : 'Area *'}</label>
                            <select id="p-area" class="form-select">
                              ${BALI_AREAS.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}
                            </select>
                          </div>
                        </div>

                        <div class="form-group">
                          <label for="p-desc" class="form-label">${isId ? 'Deskripsi Singkat & Kategori Makanan *' : 'Short description &amp; accepted food categories *'}</label>
                          <textarea
                            id="p-desc"
                            class="form-textarea"
                            style="min-height:84px;"
                            placeholder="${isId ? 'Jelaskan jenis surplus yang bisa dibagikan atau kategori makanan yang dibutuhkan komunitas Anda...' : 'Tell us what surplus you can share or what food categories your community group can collect...'}"
                            required
                          ></textarea>
                        </div>

                        <div class="form-group">
                          <label class="checkbox-label">
                            <input type="checkbox" id="p-consent" required />
                            <span>
                              ${isId
                                ? 'Saya memahami bahwa mitra penyedia bertanggung jawab atas keakuratan informasi makanan dan penerima wajib memeriksa kondisi fisik makanan saat serah terima.'
                                : 'I understand that providers remain responsible for accurate food disclosure and recipients inspect food at handoff.'
                              }
                            </span>
                          </label>
                        </div>

                        ${formError ? `<div class="form-error" style="margin-bottom:10px;">${escapeHtml(formError)}</div>` : ''}

                        <button type="submit" class="btn btn-primary btn-block">${isId ? 'Kirim Pendaftaran Mitra' : 'Submit partner application'}</button>
                      </form>
                    `
                }
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    bindPartnerEvents();
  }

  function bindPartnerEvents() {
    const typeSelect = container.querySelector('#partner-type-filter');
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        typeFilter = typeSelect.value;
        renderView();
      });
    }

    const areaSelect = container.querySelector('#partner-area-filter');
    if (areaSelect) {
      areaSelect.addEventListener('change', () => {
        areaFilter = areaSelect.value;
        renderView();
      });
    }

    const resetBtn = container.querySelector('#reset-partner-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        typeFilter = 'all';
        areaFilter = 'all';
        renderView();
      });
    }

    const form = container.querySelector('#partner-application-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = container.querySelector('#p-org-name').value.trim();
        const contact = container.querySelector('#p-contact-person').value.trim();
        const email = container.querySelector('#p-email').value.trim();
        const type = container.querySelector('#p-type').value;
        const area = container.querySelector('#p-area').value;
        const description = container.querySelector('#p-desc').value.trim();
        const consent = container.querySelector('#p-consent').checked;

        const isId = getLanguage() === 'id';
        if (!name || !contact || !description) {
          formError = isId
            ? 'Mohon lengkapi nama organisasi, kontak person, dan deskripsi singkat.'
            : 'Please complete organization name, contact person, and description.';
          renderView();
          return;
        }
        if (!isValidEmail(email)) {
          formError = isId
            ? 'Mohon masukkan alamat email kontak yang valid.'
            : 'Please enter a valid contact email address.';
          renderView();
          return;
        }
        if (!consent) {
          formError = isId
            ? 'Mohon centang persetujuan tanggung jawab serah terima mitra.'
            : 'Please confirm the partner responsibility consent checkbox.';
          renderView();
          return;
        }

        formError = '';
        applicationSubmitted = appState.addPartnerApplication({
          name: `${name} (Demo)`,
          type,
          subType: `Contact: ${contact}`,
          area,
          categories: ['Prepared meals', 'Fresh produce', 'Bakery & pastry'],
          description
        });
        showToast(isId ? 'Pendaftaran mitra berhasil dicatat ke direktori!' : 'Partner application added to directory!', 'success');
        renderView();
      });
    }

    const anotherBtn = container.querySelector('#partner-another-btn');
    if (anotherBtn) {
      anotherBtn.addEventListener('click', () => {
        applicationSubmitted = null;
        renderView();
      });
    }
  }

  renderView();
}

