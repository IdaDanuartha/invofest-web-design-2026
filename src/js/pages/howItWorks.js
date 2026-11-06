/**
 * FoodLoop How It Works Page - /how-it-works (PRD Section 14)
 */

import { getFaqItems } from './home.js';
import { escapeHtml } from '../../utils/validation.js';
import { icon } from '../components/icons.js';
import { getLanguage } from '../services/i18nService.js';

export function renderHowItWorksPage(container) {
  let selectedStage = 'published';

  function renderView() {
    const lang = getLanguage();
    const isId = lang === 'id';
    const faqItems = getFaqItems();

    const lifecycleStages = [
      {
        id: 'draft',
        label: isId ? '1. Draf' : '1. Draft',
        badge: isId ? 'Persiapan penyedia' : 'Provider prep',
        actor: isId ? 'Mitra Penyedia (dengan bantuan AI FoodLoop)' : 'Food Provider (with optional FoodLoop Assist)',
        summary: isId
          ? 'Penyedia mengetik atau mendiktekan catatan ringkas. FoodLoop Assist menyusun judul, kategori, dan jumlah porsi, serta menandai jika ada data alergen atau suhu yang perlu dikonfirmasi.'
          : 'A provider types or dictates rough notes. FoodLoop Assist extracts title, category, and quantity, while flagging missing allergen or storage fields for confirmation.',
        rules: isId ? 'Belum tampil di menu Discover. Belum dapat dipesan.' : 'Not yet visible on Discover. Cannot be reserved.'
      },
      {
        id: 'published',
        label: isId ? '2. Dipublikasikan' : '2. Published (Available)',
        badge: isId ? 'Aktif di Discover' : 'Live on Discover',
        actor: isId ? 'Mitra Penyedia Makanan' : 'Food Provider',
        summary: isId
          ? 'Penyedia mengonfirmasi keakuratan rincian makanan, suhu simpan, alergen, dan jam penjemputan. Listing tampil di menu Discover dengan sisa porsi tersedia.'
          : 'Provider confirms accuracy of food details, storage temperature, allergens, and collection window. The listing appears on Discover with remaining quantity.',
        rules: isId ? 'Terbuka untuk dipesan oleh penerima sebelum batas waktu jam ambil.' : 'Open for reservations by eligible recipients before the pickup deadline.'
      },
      {
        id: 'reserved',
        label: isId ? '3. Dipesan' : '3. Reserved',
        badge: isId ? 'Kuota porsi dikunci' : 'Quantity locked',
        actor: isId ? 'Penerima Terverifikasi / Warga' : 'Verified Recipient / Individual',
        summary: isId
          ? 'Penerima memesan porsi sesuai kebutuhan dan menyatakan kesanggupan hadir sebelum batas jam ambil. Kuota makanan langsung berkurang secara otomatis.'
          : 'A recipient reserves up to the remaining quantity and confirms they can arrive within the pickup window. Available quantity decreases immediately.',
        rules: isId ? 'Petunjuk konter lokasi dan fitur pesan koordinasi terbuka untuk pemesan.' : 'Pickup instructions and coordination messaging are unlocked for the reservation.'
      },
      {
        id: 'collected',
        label: isId ? '4. Diambil di Lokasi' : '4. Collected',
        badge: isId ? 'Serah terima di tempat' : 'On-site handoff',
        actor: isId ? 'Penerima & Penyedia Makanan' : 'Recipient & Provider',
        summary: isId
          ? 'Penerima tiba di lokasi, memeriksa kondisi fisik makanan dan label alergen, serta menandai pengambilan di aplikasi.'
          : 'Recipient arrives during the collection window, inspects the food condition and allergen labels, and confirms physical pickup.',
        rules: isId ? 'Penerima berhak menolak makanan jika kondisi fisiknya tidak layak saat serah terima.' : 'Recipients always have the right to reject food that appears unsuitable at handoff.'
      },
      {
        id: 'completed',
        label: isId ? '5. Selesai' : '5. Completed',
        badge: isId ? 'Tercatat di Dampak Sosial' : 'Counts in Impact',
        actor: isId ? 'Penyedia / Buku Kas Sistem' : 'Provider / Platform Ledger',
        summary: isId
          ? 'Serah terima terkonfirmasi selesai. Rekam jejak tercatat di log audit dan porsi makanan terselamatkan resmi masuk ke metrik Dampak Sosial.'
          : 'Handoff is confirmed complete. A timestamped event is added to the activity log and the redistributed quantity is recorded in Impact metrics.',
        rules: isId ? 'Reservasi yang batal atau kedaluwarsa tidak akan pernah masuk ke tahap ini sehingga metrik dampak selalu jujur.' : 'Cancelled or expired reservations never reach this state and never inflate impact numbers.'
      }
    ];

    const activeStageObj = lifecycleStages.find((s) => s.id === selectedStage) || lifecycleStages[1];

    container.innerHTML = `
      <section class="section-sm">
        <div class="container">
          <!-- Hero with Two Pathways -->
          <div style="max-width:740px; margin-bottom: var(--space-8);">
            <span class="eyebrow">${isId ? 'Alur Kerja Redistribusi Terlacak' : 'Traceable redistribution workflow'}</span>
            <h1>${isId ? 'Bagaimana FoodLoop Mengoordinasikan Setiap Serah Terima' : 'How FoodLoop coordinates every handoff'}</h1>
            <p style="margin-top:10px; font-size:1.0625rem;">
              ${isId
                ? 'FoodLoop menggantikan pesan grup chat yang simpang siur dengan alur kerja terstruktur dan tepat waktu, baik untuk bisnis kuliner maupun komunitas penerima.'
                : 'FoodLoop replaces ad-hoc group chats and uncertain drop-offs with a structured, time-sensitive workflow for both food businesses and community recipients.'
              }
            </p>
            <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top: var(--space-5);">
              <a href="#/donate" data-link="/donate" class="btn btn-primary">${isId ? 'Untuk Penyedia: Pasang Surplus' : 'For food providers: List surplus'}</a>
              <a href="#/discover" data-link="/discover" class="btn btn-secondary">${isId ? 'Untuk Penerima: Cari Makanan' : 'For recipients: Discover food'}</a>
            </div>
          </div>

          <!-- Two Pathways Side-by-Side -->
          <div class="grid-2" style="margin-bottom: var(--space-10);">
            <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-lg); padding: var(--space-6);">
              <span class="badge badge-forest" style="margin-bottom:12px;">${isId ? 'Jalur A • Untuk Mitra Penyedia' : 'Pathway A • For Food Providers'}</span>
              <h2 style="font-size:1.45rem; margin-bottom:16px;">${isId ? 'Bagikan surplus kurang dari dua menit' : 'Share surplus in under two minutes'}</h2>
              <ol style="display:flex; flex-direction:column; gap:14px;">
                <li class="flow-step-item">
                  <span class="flow-step-num">1</span>
                  <div>
                    <strong>${isId ? 'Susun draf dengan bahasa sehari-hari atau formulir' : 'Draft with plain language or form controls'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Tulis apa yang tersisa (misal: 12 porsi nasi kotak atau 8 roti) atau biarkan Asisten AI FoodLoop menyusun draf Anda.' : 'Enter what is unsold or let FoodLoop Assist structure your notes.'}</p>
                  </div>
                </li>
                <li class="flow-step-item">
                  <span class="flow-step-num">2</span>
                  <div>
                    <strong>${isId ? 'Cantumkan cara simpan, waktu buat, dan alergen' : 'Disclose storage, prep time, and allergens'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Tentukan suhu dingin atau ruang, bahan utama, dan apakah penerima perlu membawa wadah sendiri.' : 'Specify chilling or ambient storage, known ingredients, and whether recipients should bring containers.'}</p>
                  </div>
                </li>
                <li class="flow-step-item">
                  <span class="flow-step-num">3</span>
                  <div>
                    <strong>${isId ? 'Tetapkan batas jam penjemputan yang pasti' : 'Set a firm collection window'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Tentukan jam mulai dan jam tutup dapur Anda, tidak ada warga yang datang di luar jadwal.' : 'Define start and deadline times that fit your kitchen closing schedule, no unexpected arrivals.'}</p>
                  </div>
                </li>
                <li class="flow-step-item">
                  <span class="flow-step-num">4</span>
                  <div>
                    <strong>${isId ? 'Serah terima & verifikasi selesai' : 'Hand over &amp; confirm completion'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Cocokkan tiket QR pemesan dan tandai selesai untuk mencatat dampak sosial outlet Anda.' : 'Verify the reservation ID at pickup and mark the handoff complete to update your impact log.'}</p>
                  </div>
                </li>
              </ol>
            </div>

            <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-lg); padding: var(--space-6);">
              <span class="badge badge-citrus" style="margin-bottom:12px;">${isId ? 'Jalur B • Untuk Komunitas & Warga' : 'Pathway B • For Recipients'}</span>
              <h2 style="font-size:1.45rem; margin-bottom:16px;">${isId ? 'Temukan & pesan makanan layak di sekitar Anda' : 'Find &amp; reserve suitable food nearby'}</h2>
              <ol style="display:flex; flex-direction:column; gap:14px;">
                <li class="flow-step-item">
                  <span class="flow-step-num">1</span>
                  <div>
                    <strong>${isId ? 'Filter berdasarkan wilayah, kategori & batas waktu' : 'Filter by area, category, and deadline'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Jelajahi surplus di Denpasar, Kuta, atau Sanur, atau minta saran dari Asisten AI FoodLoop.' : 'Browse available surplus in Denpasar, Sanur, or Badung, or use FoodLoop Assist to rank matches for your kitchen’s capacity.'}</p>
                  </div>
                </li>
                <li class="flow-step-item">
                  <span class="flow-step-num">2</span>
                  <div>
                    <strong>${isId ? 'Periksa informasi alergen & petunjuk penjemputan' : 'Verify allergen &amp; handling requirements'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Lihat komposisi bahan, suhu penyimpanan, dan apakah wajib membawa wadah sendiri.' : 'Check disclosed ingredients, storage notes, and whether containers or tote bags are needed.'}</p>
                  </div>
                </li>
                <li class="flow-step-item">
                  <span class="flow-step-num">3</span>
                  <div>
                    <strong>${isId ? 'Pesan porsi yang dibutuhkan (100% Gratis)' : 'Reserve the exact quantity you can use'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Kunci jumlah porsi dan dapatkan tiket QR resmi beserta petunjuk konter penjemputan.' : 'Lock in your portion count and receive the provider’s pickup instructions and reservation ID.'}</p>
                  </div>
                </li>
                <li class="flow-step-item">
                  <span class="flow-step-num">4</span>
                  <div>
                    <strong>${isId ? 'Periksa saat tiba & konfirmasi serah terima' : 'Inspect on arrival &amp; confirm collection'}</strong>
                    <p style="font-size:0.875rem;">${isId ? 'Periksa kelayakan makanan di lokasi saat mengambil dan konfirmasi pengambilan di dashboard.' : 'Check food suitability at handoff and confirm collection in your recipient dashboard.'}</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <!-- Interactive Listing Lifecycle State Machine (PRD Section 14 & 19) -->
          <div style="background:var(--color-paper); border:1px solid var(--color-line-strong); border-radius:var(--radius-lg); padding: var(--space-6); margin-bottom: var(--space-10);">
            <div style="margin-bottom: var(--space-4);">
              <span class="eyebrow">${isId ? 'Status Alur Akuntabel' : 'Accountable state machine'}</span>
              <h2 style="font-size:1.45rem;">${isId ? 'Siklus Hidup Makanan & Serah Terima' : 'Listing &amp; handoff lifecycle'}</h2>
              <p style="margin-top:4px; font-size:0.9rem;">
                ${isId ? 'Klik setiap tahapan di bawah untuk melihat bagaimana FoodLoop mengawal surplus dari draf hingga dampak sosial tercatat.' : 'Click any stage below to see how FoodLoop tracks a surplus listing from draft to completed impact.'}
              </p>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom: var(--space-5);" role="tablist" aria-label="Listing lifecycle stages">
              ${lifecycleStages
                .map(
                  (stage) => `
                    <button
                      type="button"
                      role="tab"
                      aria-selected="${stage.id === selectedStage}"
                      class="btn ${stage.id === selectedStage ? 'btn-primary' : 'btn-secondary'} btn-sm"
                      data-lifecycle-stage="${stage.id}"
                    >
                      ${escapeHtml(stage.label)}
                    </button>
                  `
                )
                .join('')}
            </div>

            <div style="padding: var(--space-5); background:var(--color-cream); border:1px solid var(--color-line); border-radius:var(--radius-md);">
              <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px;">
                <h3 style="font-size:1.25rem;">${escapeHtml(activeStageObj.label)}</h3>
                <span class="badge badge-forest">${escapeHtml(activeStageObj.badge)}</span>
              </div>
              <p style="margin-bottom:12px;">${escapeHtml(activeStageObj.summary)}</p>
              <div style="display:flex; flex-wrap:wrap; gap:20px; font-size:0.82rem; color:var(--color-muted); padding-top:10px; border-top:1px solid var(--color-line);">
                <span><strong>${isId ? 'Pihak utama:' : 'Primary actor:'}</strong> ${escapeHtml(activeStageObj.actor)}</span>
                <span><strong>${isId ? 'Prinsip jaminan:' : 'Guardrail:'}</strong> ${escapeHtml(activeStageObj.rules)}</span>
              </div>
            </div>
          </div>

          <!-- Trust and Food Information Responsibility Section -->
          <div style="margin-bottom: var(--space-10);">
            <div class="section-header" style="margin-bottom: var(--space-4);">
              <div>
                <span class="eyebrow">${isId ? 'Keamanan & Keterbukaan' : 'Safety &amp; disclosure'}</span>
                <h2>${isId ? 'Prinsip Kepercayaan & Tanggung Jawab Makanan' : 'Trust and food information principles'}</h2>
              </div>
            </div>
            <div class="grid-3">
              <div class="step-card">
                <h3>${isId ? 'Keterbukaan nyata di atas asumsi' : 'Explicit disclosure over assumptions'}</h3>
                <p style="font-size:0.875rem;">
                  ${isId ? 'FoodLoop membedakan dengan jelas status bebas alergen dengan keterangan belum pasti. Sistem maupun AI tidak pernah mengasumsikan makanan bebas alergen tanpa kepastian.' : 'FoodLoop clearly distinguishes between "None disclosed" and "Not specified - please confirm". Neither the platform nor the AI assistant ever infers allergen-free status.'}
                </p>
              </div>
              <div class="step-card">
                <h3>${isId ? 'Otonomi penyedia & penerima' : 'Provider &amp; recipient autonomy'}</h3>
                <p style="font-size:0.875rem;">
                  ${isId ? 'Mitra penyedia bertanggung jawab atas kebenaran info makanan & standar higienis. Penerima selalu memiliki hak menolak makanan saat serah terima.' : 'Providers remain responsible for accurate food information, temperature storage, and compliance with food-safety rules. Recipients can decline any item at handoff.'}
                </p>
              </div>
              <div class="step-card">
                <h3>${isId ? 'AI membantu; manusia memutuskan' : 'AI assists; people decide'}</h3>
                <p style="font-size:0.875rem;">
                  ${isId ? 'Asisten AI mempercepat penyusunan draf dan pencarian, namun tidak pernah mempublikasikan listing atau memesan makanan tanpa persetujuan manusia.' : 'FoodLoop Assist speeds up drafting and matching, but cannot auto-publish a listing, certify food safety, or reserve food without human confirmation.'}
                </p>
              </div>
            </div>
          </div>

          <!-- FAQ -->
          <div class="container-narrow" style="padding-inline:0;">
            <h2 style="margin-bottom: var(--space-4);">${isId ? 'Pertanyaan yang Sering Diajukan' : 'Frequently asked questions'}</h2>
            <div class="accordion-list" id="hiw-faq-accordion">
              ${faqItems.map(
                (item, idx) => `
                  <div class="accordion-item">
                    <button
                      type="button"
                      class="accordion-trigger"
                      aria-expanded="${idx === 0 ? 'true' : 'false'}"
                      aria-controls="hiw-faq-panel-${idx}"
                      id="hiw-faq-trigger-${idx}"
                    >
                      <span>${escapeHtml(item.q)}</span>
                      <span class="accordion-icon" aria-hidden="true">${icon('plus', 12)}</span>
                    </button>
                    <div
                      id="hiw-faq-panel-${idx}"
                      class="accordion-panel"
                      role="region"
                      aria-labelledby="hiw-faq-trigger-${idx}"
                      ${idx === 0 ? '' : 'hidden'}
                    >
                      ${escapeHtml(item.a)}
                    </div>
                  </div>
                `
              ).join('')}
            </div>
          </div>
        </div>
      </section>
    `;

    container.querySelectorAll('[data-lifecycle-stage]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedStage = btn.getAttribute('data-lifecycle-stage');
        renderView();
      });
    });

    // Accordion: Only one open at a time
    const hiwFaqTriggers = container.querySelectorAll('#hiw-faq-accordion .accordion-trigger');
    hiwFaqTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const isCurrentlyExpanded = trigger.getAttribute('aria-expanded') === 'true';

        // Close all items
        hiwFaqTriggers.forEach((otherTrigger) => {
          otherTrigger.setAttribute('aria-expanded', 'false');
          const otherPanelId = otherTrigger.getAttribute('aria-controls');
          const otherPanel = container.querySelector(`#${otherPanelId}`);
          if (otherPanel) {
            otherPanel.hidden = true;
            otherPanel.classList.remove('is-open');
          }
        });

        // Open only clicked item if it was closed
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
  }

  renderView();
}

