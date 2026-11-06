/**
 * FoodLoop Impact Dashboard Page - /impact (PRD Section 13)
 * Demonstrates transparent, methodology-backed outcomes without greenwashing.
 */

import { reservationService } from '../services/reservationService.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../../utils/validation.js';
import { formatNumber, formatDateTime, getCategoryLabel } from '../../utils/formatDate.js';
import { getLanguage } from '../services/i18nService.js';

export function renderImpactPage(container) {
  let trendPeriod = 'weekly'; // 'weekly' | 'monthly'

  function renderView() {
    const isId = getLanguage() === 'id';
    const metrics = reservationService.computeImpactMetrics();
    const categories = Object.values(metrics.categoryBreakdown);
    const totalHandoffs = Math.max(1, metrics.completedHandoffsCount);

    const trendBars =
      trendPeriod === 'weekly'
        ? [
            { label: isId ? 'Mgg 1 (Okt)' : 'Wk 1 (Oct)', handoffs: 1, portions: 10 },
            { label: isId ? 'Mgg 2 (Okt)' : 'Wk 2 (Oct)', handoffs: 2, portions: 18 },
            { label: isId ? 'Mgg 3 (Okt)' : 'Wk 3 (Oct)', handoffs: 2, portions: 24 },
            { label: isId ? 'Mgg Berjalan (Nov)' : 'Current Wk (Nov)', handoffs: metrics.completedHandoffsCount, portions: metrics.portionsRedistributed }
          ]
        : [
            { label: isId ? 'Sep (Demo)' : 'Sep (Demo)', handoffs: 2, portions: 20 },
            { label: isId ? 'Okt (Demo)' : 'Oct (Demo)', handoffs: 3, portions: 36 },
            { label: isId ? 'Nov (Aktif)' : 'Nov (Active)', handoffs: metrics.completedHandoffsCount, portions: metrics.portionsRedistributed }
          ];

    const maxPortionsBar = Math.max(40, ...trendBars.map((b) => b.portions));

    container.innerHTML = `
      <section class="section-sm">
        <div class="container">
          <!-- Intro -->
          <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom: var(--space-6);">
            <div style="max-width:700px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span class="eyebrow" style="margin-bottom:0;">${isId ? 'Laporan Transparan' : 'Transparent reporting'}</span>
                <span class="badge-demo" style="padding:2px 8px; border-radius:4px;">${isId ? 'Data sesi & serah terima nyata' : 'Seeded & live session handoffs'}</span>
              </div>
              <h1>${isId ? 'Dampak nyata diukur dari penjemputan berhasil' : 'Impact measured by completed handoffs'}</h1>
              <p style="margin-top:8px;">
                ${isId
                  ? 'FoodLoop mencatat penjemputan surplus makanan yang benar-benar telah terverifikasi antara mitra penyedia dan penerima. Reservasi yang batal, kedaluwarsa, atau tidak diambil tidak pernah dihitung sebagai makanan terselamatkan.'
                  : 'FoodLoop tracks verified surplus collections between providers and recipients. Uncollected, cancelled, or expired reservations are never counted as redistributed food.'
                }
              </p>
            </div>
            <div style="display:flex; gap:10px;">
              <button type="button" class="btn btn-secondary btn-sm" id="export-impact-csv-btn">
                ↓ ${isId ? 'Ekspor CSV Serah Terima' : 'Export handoffs CSV'}
              </button>
              <a href="#/donate" data-link="/donate" class="btn btn-primary btn-sm">+ ${isId ? 'Pasang Surplus' : 'List surplus'}</a>
            </div>
          </div>

          <!-- KPI Cards (PRD Section 13) -->
          <div class="kpi-grid" style="margin-bottom: var(--space-7);">
            <div class="kpi-card">
              <div class="kpi-label">${isId ? 'Penjemputan Selesai' : 'Completed handoffs'}</div>
              <div class="kpi-value">${formatNumber(metrics.completedHandoffsCount)}</div>
              <div class="kpi-sub">${isId ? 'Transfer fisik terverifikasi via tiket QR' : 'Verified provider-to-recipient transfers'}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">${isId ? 'Porsi Terselamatkan' : 'Portions redistributed'}</div>
              <div class="kpi-value">${formatNumber(metrics.portionsRedistributed)}</div>
              <div class="kpi-sub">
                ${isId ? `Rincian satuan: ${formatNumber(metrics.packsRedistributed)} bks • ${formatNumber(metrics.kgRedistributed)} kg hasil tani` : `Separate units: ${formatNumber(metrics.packsRedistributed)} packs • ${formatNumber(metrics.kgRedistributed)} kg produce`}
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">${isId ? 'Mitra Penyedia Aktif' : 'Providers participating'}</div>
              <div class="kpi-value">${formatNumber(metrics.activeProvidersCount)}</div>
              <div class="kpi-sub">${isId ? 'Restoran, bakery & toko pangan di Bali' : 'Active Bali demo kitchens, bakeries & grocers'}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">${isId ? 'Komunitas Penerima Terlayani' : 'Recipient organizations served'}</div>
              <div class="kpi-value">${formatNumber(metrics.recipientOrgsServedCount)}</div>
              <div class="kpi-sub">${isId ? 'Dapur umum, panti & warga sekitar' : 'Community kitchens & neighbourhood pantries'}</div>
            </div>
          </div>

          <!-- Trend Chart & Breakdown by Food Category -->
          <div class="grid-2" style="margin-bottom: var(--space-8); align-items:stretch;">
            <!-- Trend Chart -->
            <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-md); padding: var(--space-5); display:flex; flex-direction:column; justify-content:space-between;">
              <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom: var(--space-4);">
                <div>
                  <h2 style="font-size:1.15rem;">${isId ? 'Tren Porsi Terselamatkan (Demo)' : 'Redistributed portions trend (Demo)'}</h2>
                  <span style="font-size:0.78rem; color:var(--color-muted);">${isId ? 'Mencerminkan serah terima nyata pada sesi saat ini' : 'Reflects completed handoffs in the current session'}</span>
                </div>
                <div class="segmented-tabs" role="group" aria-label="Trend period">
                  <button
                    type="button"
                    class="segmented-tab ${trendPeriod === 'weekly' ? 'is-active' : ''}"
                    data-trend-period="weekly"
                  >
                    ${isId ? 'Per minggu' : 'By week'}
                  </button>
                  <button
                    type="button"
                    class="segmented-tab ${trendPeriod === 'monthly' ? 'is-active' : ''}"
                    data-trend-period="monthly"
                  >
                    ${isId ? 'Per bulan' : 'By month'}
                  </button>
                </div>
              </div>

              <div style="display:grid; grid-template-columns: repeat(${trendBars.length}, 1fr); gap:16px; align-items:end; height:190px; padding-top:20px; border-bottom:1px solid var(--color-line);">
                ${trendBars
                  .map((bar) => {
                    const heightPct = Math.max(14, Math.round((bar.portions / maxPortionsBar) * 100));
                    return `
                      <div style="display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--color-forest); margin-bottom:6px;">
                          ${bar.portions}p (${bar.handoffs})
                        </span>
                        <div style="width:100%; max-width:56px; height:${heightPct}%; background:var(--color-forest); border-radius:6px 6px 0 0;"></div>
                      </div>
                    `;
                  })
                  .join('')}
              </div>

              <div style="display:grid; grid-template-columns: repeat(${trendBars.length}, 1fr); gap:16px; text-align:center; padding-top:8px; font-size:0.75rem; color:var(--color-muted);">
                ${trendBars.map((b) => `<span>${escapeHtml(b.label)}</span>`).join('')}
              </div>
            </div>

            <!-- Breakdown by Food Category -->
            <div style="background:var(--color-paper); border:1px solid var(--color-line); border-radius:var(--radius-md); padding: var(--space-5);">
              <h2 style="font-size:1.15rem; margin-bottom:4px;">${isId ? 'Rincian Berdasarkan Kategori Makanan' : 'Breakdown by food category'}</h2>
              <p style="font-size:0.8rem; color:var(--color-muted); margin-bottom: var(--space-4);">
                ${isId ? 'Serah terima terverifikasi dikelompokkan menurut kategori makanan surplus.' : 'Completed handoffs grouped by surplus category.'}
              </p>

              ${categories
                .map((cat) => {
                  const pct = Math.round((cat.count / totalHandoffs) * 100);
                  const catLabel = isId
                    ? cat.id === 'prepared-meals' ? 'Makanan Siap Santap'
                      : cat.id === 'bakery' ? 'Roti & Pastry'
                      : cat.id === 'produce' ? 'Hasil Tani & Sayur'
                      : cat.id === 'grocery' ? 'Bahan Pokok & Sembako'
                      : 'Surplus Lainnya'
                    : cat.label;
                  return `
                    <div class="category-bar-row">
                      <div class="category-bar-header">
                        <span>${escapeHtml(catLabel)}</span>
                        <span style="color:var(--color-muted);">${cat.count} ${isId ? 'serah terima' : 'handoffs'} (${cat.portions} ${isId ? 'unit' : 'units'})</span>
                      </div>
                      <div class="category-bar-track">
                        <div class="category-bar-fill" style="width:${Math.max(4, pct)}%;"></div>
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>

          <!-- Recent Completed Handoffs (Anonymized recipient personal info) -->
          <div style="margin-bottom: var(--space-8);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-3);">
              <div>
                <h2 style="font-size:1.3rem;">${isId ? 'Log Serah Terima Makanan Terverifikasi' : 'Recent completed handoffs'}</h2>
                <p style="font-size:0.82rem; color:var(--color-muted);">
                  ${isId ? 'Identitas pribadi warga individu disamarkan demi privasi. Menyelesaikan reservasi di dashboard langsung memperbarui log ini.' : 'Individual recipient personal identifiers are anonymized. Completing a reservation in the dashboard updates this ledger immediately.'}
                </p>
              </div>
            </div>

            <div class="data-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>${isId ? 'ID Serah Terima' : 'Handoff ID'}</th>
                    <th>${isId ? 'Makanan Surplus' : 'Surplus listing'}</th>
                    <th>${isId ? 'Kategori' : 'Category'}</th>
                    <th>${isId ? 'Penyedia' : 'Provider'}</th>
                    <th>${isId ? 'Penerima (Disamarkan jika individu)' : 'Recipient (Anonymized if individual)'}</th>
                    <th>${isId ? 'Jumlah & Satuan' : 'Quantity & unit'}</th>
                    <th>${isId ? 'Waktu Selesai' : 'Completed at'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${metrics.completedRecords
                    .map((r) => {
                      const anonRecipient = r.recipientId.startsWith('individual')
                        ? (isId ? 'Warga Individu Terverifikasi (Denpasar)' : 'Verified Individual Recipient (Denpasar)')
                        : r.recipientName;
                      return `
                        <tr>
                          <td style="font-family:var(--font-mono); font-size:0.78rem;">${escapeHtml(r.id)}</td>
                          <td style="font-weight:600;">${escapeHtml(r.listingTitle)}</td>
                          <td><span class="badge badge-neutral">${escapeHtml(getCategoryLabel(r.category))}</span></td>
                          <td>${escapeHtml(r.providerName)}</td>
                          <td>${escapeHtml(anonRecipient)}</td>
                          <td style="font-weight:700; color:var(--color-forest);">${r.quantity} ${escapeHtml(r.unit)}</td>
                          <td style="color:var(--color-muted);">${escapeHtml(formatDateTime(r.completedAt || r.createdAt))}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Methodology Panel (PRD Section 13) -->
          <div style="background:var(--color-paper); border:1px solid var(--color-line-strong); border-radius:var(--radius-lg); padding: var(--space-6);">
            <div class="grid-asymmetric" style="align-items:center;">
              <div>
                <span class="eyebrow">${isId ? 'Kebijakan Anti-Greenwashing' : 'No greenwashing policy'}</span>
                <h2 style="font-size:1.4rem; margin-bottom:10px;">${isId ? 'Bagaimana FoodLoop Menghitung Dampak' : 'How FoodLoop calculates impact'}</h2>
                <ul style="display:flex; flex-direction:column; gap:8px; font-size:0.9rem; color:var(--color-ink-soft);">
                  <li><strong>${isId ? '1. Hanya serah terima yang benar-benar selesai:' : '1. Strictly completed handoffs:'}</strong> ${isId ? 'Sebuah reservasi baru dihitung sebagai dampak nyata setelah statusnya berubah menjadi COMPLETED.' : 'A reservation only contributes to impact metrics once its state reaches COMPLETED.'}</li>
                  <li><strong>${isId ? '2. Pemisahan satuan yang konsisten:' : '2. Consistent unit separation:'}</strong> ${isId ? 'Porsi makanan matang, kemasan boks/pantry, dan kilogram hasil tani dicatat dalam satuan aslinya, tidak dijumlahkan sembarangan.' : 'Prepared meal portions, bakery/grocery packs, and produce kilograms are tracked in their own units, never arbitrarily summed together.'}</li>
                  <li><strong>${isId ? '3. Tanpa klaim emisi CO₂ atau pohon fiktif:' : '3. No unverified CO₂ or "trees planted" claims:'}</strong> ${isId ? 'Estimasi lingkungan wajib merujuk pada standar konversi berat riil makanan yang telah diaudit.' : 'Environmental estimates require audited food-weight conversion factors and verified baseline waste data.'}</li>
                </ul>
              </div>
              <div style="background:var(--color-cream); padding:var(--space-5); border-radius:var(--radius-md); border:1px solid var(--color-line);">
                <h3 style="font-size:1.1rem; margin-bottom:8px;">${isId ? 'Ingin menguji pembaruan dampak secara langsung?' : 'Ready to test live impact updates?'}</h3>
                <p style="font-size:0.875rem; margin-bottom:16px;">
                  ${isId ? 'Pesan makanan atau selesaikan reservasi di Dashboard untuk melihat metrik di halaman ini bertambah secara real-time.' : 'Reserve a listing or mark an existing reservation as completed in the Dashboard to watch these metrics update in real time.'}
                </p>
                <div style="display:flex; flex-wrap:wrap; gap:10px;">
                  <a href="#/dashboard" data-link="/dashboard" class="btn btn-primary btn-sm">${isId ? 'Buka Dashboard' : 'Open Dashboard'}</a>
                  <a href="#/discover" data-link="/discover" class="btn btn-secondary btn-sm">${isId ? 'Cari Makanan Surplus' : 'Discover surplus'}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    container.querySelectorAll('[data-trend-period]').forEach((btn) => {
      btn.addEventListener('click', () => {
        trendPeriod = btn.getAttribute('data-trend-period');
        renderView();
      });
    });

    const csvBtn = container.querySelector('#export-impact-csv-btn');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        const headers = ['Handoff_ID', 'Listing_Title', 'Category', 'Provider', 'Recipient', 'Quantity', 'Unit', 'Area', 'Completed_At'];
        const rows = metrics.completedRecords.map((r) => [
          r.id,
          `"${(r.listingTitle || '').replace(/"/g, '""')}"`,
          r.category,
          `"${(r.providerName || '').replace(/"/g, '""')}"`,
          `"${(r.recipientName || '').replace(/"/g, '""')}"`,
          r.quantity,
          r.unit,
          `"${r.area || ''}"`,
          r.completedAt || r.createdAt
        ]);
        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `foodloop-completed-handoffs-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(isId ? 'Data serah terima berhasil diekspor sebagai CSV.' : 'Exported completed handoffs as CSV.', 'success');
      });
    }
  }

  renderView();
}

