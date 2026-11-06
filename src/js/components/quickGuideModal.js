/**
 * FoodLoop Quick Onboarding & Elderly Guide Modal
 * Evaluated under "Kemudahan Pengguna dan Responsibilitas"
 */

import { openModal, closeModal } from './modal.js';
import { icon } from './icons.js';
import { router } from '../router.js';
import { showToast } from './toast.js';
import { getLanguage } from '../services/i18nService.js';

export function openQuickGuideModal() {
  const isLargeText = document.documentElement.classList.contains('large-text-mode');
  const lang = getLanguage();

  const isId = lang === 'id';

  openModal({
    title: isId ? 'Panduan Cepat FoodLoop: Cara Ambil Makanan (Gratis)' : 'FoodLoop Quick Guide: How to Collect Surplus Food (Free)',
    bodyHtml: `
      <div class="quick-guide-modal-content">
        <p style="font-size:1.05rem; line-height:1.6; margin-bottom:16px; color:var(--color-ink);">
          ${isId
            ? 'Selamat datang! FoodLoop adalah layanan yang menghubungkan hotel & restoran di Bali dengan warga sekitar agar makanan berlebih berkualitas tinggi tidak terbuang sia-sia.'
            : 'Welcome! FoodLoop connects food businesses in Bali with local communities and individuals so surplus food is rescued and shared with dignity.'}
        </p>

        <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:20px;">
          <div style="display:flex; gap:14px; align-items:flex-start; padding:12px; background:var(--color-cream); border-radius:var(--radius-sm); border:1px solid var(--color-line);">
            <div style="width:32px; height:32px; border-radius:50%; background:var(--color-forest); color:var(--color-paper); display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">1</div>
            <div>
              <strong style="display:block; font-size:1rem; margin-bottom:2px; color:var(--color-ink);">
                ${isId ? 'Cari Makanan di Halaman "Discover"' : 'Find Food on the "Discover" Page'}
              </strong>
              <span style="font-size:0.875rem; color:var(--color-ink-soft); line-height:1.5; display:block;">
                ${isId
                  ? 'Buka menu <strong>Discover</strong> di atas layar. Pilih wilayah Anda di Bali (Denpasar, Kuta, Ubud, Sanur). Anda bisa melihat foto asli hidangan, jumlah porsi yang tersisa, dan jam buka pengambilan.'
                  : 'Open the <strong>Discover</strong> tab. Choose your area in Bali. Check real photos, remaining portions, dietary tags, and collection windows.'}
              </span>
            </div>
          </div>

          <div style="display:flex; gap:14px; align-items:flex-start; padding:12px; background:var(--color-cream); border-radius:var(--radius-sm); border:1px solid var(--color-line);">
            <div style="width:32px; height:32px; border-radius:50%; background:var(--color-forest); color:var(--color-paper); display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">2</div>
            <div>
              <strong style="display:block; font-size:1rem; margin-bottom:2px; color:var(--color-ink);">
                ${isId ? 'Pilih Jumlah Porsi & Klik "Pesan Porsi" (100% Gratis)' : 'Choose Portions & Click "Reserve" (100% Free)'}
              </strong>
              <span style="font-size:0.875rem; color:var(--color-ink-soft); line-height:1.5; display:block;">
                ${isId
                  ? 'Klik paket makanan yang Anda inginkan. Pilih berapa porsi (misal 1 atau 2 bungkus untuk keluarga). Makanan ini <strong>100% Gratis</strong>, tanpa biaya tersembunyi, tanpa kartu kredit, dan tanpa deposit.'
                  : 'Select the food listing you need. Choose quantity. This surplus is <strong>100% Free</strong>, no hidden fees, no credit card, no deposit required.'}
              </span>
            </div>
          </div>

          <div style="display:flex; gap:14px; align-items:flex-start; padding:12px; background:var(--color-cream); border-radius:var(--radius-sm); border:1px solid var(--color-line);">
            <div style="width:32px; height:32px; border-radius:50%; background:var(--color-forest); color:var(--color-paper); display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">3</div>
            <div>
              <strong style="display:block; font-size:1rem; margin-bottom:2px; color:var(--color-ink);">
                ${isId ? 'Datang ke Lokasi & Tunjukkan Kode di Layar HP' : 'Collect On-Site & Show Digital Code'}
              </strong>
              <span style="font-size:0.875rem; color:var(--color-ink-soft); line-height:1.5; display:block;">
                ${isId
                  ? 'Setelah memesan, Anda akan mendapatkan <strong>Kode Reservasi</strong> (contoh: <code>FL-4821</code>). Datang ke restoran/hotel sebelum jam batas ambil, tunjukkan kode di layar ponsel Anda kepada staf, dan bawa pulang makanan Anda dengan tenang.'
                  : 'After reserving, you receive a <strong>Reservation Code</strong> (e.g. <code>FL-4821</code>). Arrive before the deadline, show your screen to staff, and collect your food smoothly.'}
              </span>
            </div>
          </div>
        </div>

        <div style="padding:12px; border-radius:var(--radius-sm); background:rgba(46, 125, 50, 0.08); border-left:4px solid var(--color-forest); margin-bottom:16px;">
          <strong style="display:block; color:var(--color-forest); font-size:0.9rem; margin-bottom:4px;">
            ${icon('shieldCheck', 14)} ${isId ? 'Jaminan Higienis & Tanggung Jawab Sosial' : 'Hygienic Standards & Community Responsibility'}
          </strong>
          <span style="font-size:0.8125rem; color:var(--color-ink-soft); line-height:1.5; display:block;">
            ${isId
              ? 'Setiap makanan telah diverifikasi cara simpan dan waktu pengolahannya. Informasi alergen dan kehalalan dicantumkan dengan transparan demi kenyamanan bersama.'
              : 'All surplus listings are verified for safe handling and freshness. Allergen and dietary tags are clearly labelled.'}
          </span>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <span style="font-size:0.875rem; color:var(--color-muted);">${isId ? 'Mata terasa lelah membaca?' : 'Eyes tired of small text?'}</span>
          <button type="button" class="btn btn-secondary btn-sm" id="modal-toggle-large-text-btn">
            ${icon('sparkles', 13)} <span id="modal-large-text-label">${isLargeText ? (isId ? 'Kembalikan Ukuran Teks Normal' : 'Return to Normal Size') : (isId ? 'Aktifkan Mode Tulisan Besar (A+)' : 'Enable Large Text (A+)')}</span>
          </button>
        </div>
      </div>
    `,
    footerHtml: `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:8px;">
        <button type="button" class="btn btn-ghost btn-sm" data-modal-close>${isId ? 'Tutup' : 'Close'}</button>
        <button type="button" class="btn btn-primary btn-sm" id="modal-start-discover-btn">
          ${isId ? 'Mulai Cari Makanan Sekarang →' : 'Discover Available Food Now →'}
        </button>
      </div>
    `,
    onMount(dialog) {
      const toggleBtn = dialog.querySelector('#modal-toggle-large-text-btn');
      const label = dialog.querySelector('#modal-large-text-label');
      if (toggleBtn && label) {
        toggleBtn.addEventListener('click', () => {
          const nowLarge = document.documentElement.classList.toggle('large-text-mode');
          localStorage.setItem('foodloop_large_text', String(nowLarge));
          label.textContent = nowLarge
            ? (isId ? 'Kembalikan Ukuran Teks Normal' : 'Return to Normal Size')
            : (isId ? 'Aktifkan Mode Tulisan Besar (A+)' : 'Enable Large Text (A+)');
          showToast(nowLarge 
            ? (isId ? 'Mode Tulisan Besar (A+) Diaktifkan.' : 'Large text mode enabled.') 
            : (isId ? 'Mode Tulisan Normal Diaktifkan.' : 'Normal text mode enabled.'), 'info');
        });
      }

      const discoverBtn = dialog.querySelector('#modal-start-discover-btn');
      if (discoverBtn) {
        discoverBtn.addEventListener('click', () => {
          closeModal();
          router.navigate('/discover');
        });
      }
    }
  });
}
