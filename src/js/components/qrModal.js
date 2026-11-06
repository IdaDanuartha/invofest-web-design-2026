/**
 * FoodLoop QR Ticket & QR Scanner Components
 * Enables recipients to show QR codes at pickup, and providers to scan & verify handoffs.
 */

import { openModal, closeModal } from './modal.js';
import { renderQrCodeSvg } from '../../utils/qrCode.js';
import { icon } from './icons.js';
import { showToast } from './toast.js';
import { reservationService } from '../services/reservationService.js';
import { escapeHtml } from '../../utils/validation.js';
import { formatPickupWindow } from '../../utils/formatDate.js';
import { t, getLanguage } from '../services/i18nService.js';
import { router } from '../router.js';

/**
 * Open Digital QR Ticket Modal for Recipients
 */
export function openQrTicketModal(reservation) {
  if (!reservation) return;
  const isId = getLanguage() === 'id';
  const qrPayload = `FOODLOOP-RES:${reservation.id}`;
  const qrSvg = renderQrCodeSvg(qrPayload, { size: 190, darkColor: '#244B3B' });

  const windowStr = reservation.pickupWindow
    ? formatPickupWindow(reservation.pickupWindow.start, reservation.pickupWindow.end)
    : 'Waktu pickup terkonfirmasi';

  openModal({
    title: isId ? 'Tiket QR Penjemputan Makanan' : 'Digital Pickup QR Ticket',
    bodyHtml: `
      <div style="text-align:center;">
        <div class="qr-ticket-box">
          ${qrSvg}
          <div class="qr-ticket-badge">
            ${icon('shieldCheck', 13)} ${isId ? 'Tiket Digital Resmi FoodLoop' : 'Official FoodLoop Digital Pass'}
          </div>
          <div style="margin-top:8px; font-family:var(--font-mono); font-weight:700; font-size:1.15rem; color:var(--color-forest); letter-spacing:0.04em;">
            ${escapeHtml(reservation.id)}
          </div>
        </div>

        <div style="background:var(--color-cream); border:1px solid var(--color-line); border-radius:var(--radius-sm); padding:12px; margin-bottom:14px; text-align:left; font-size:0.84rem;">
          <div style="margin-bottom:6px;">
            <span style="color:var(--color-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700;">${isId ? 'Makanan Surplus' : 'Surplus Food'}:</span>
            <div style="font-weight:700; color:var(--color-ink); font-size:0.95rem;">${escapeHtml(reservation.listingTitle || 'Surplus Food')}</div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; padding-top:8px; border-top:1px dashed var(--color-line-strong);">
            <div>
              <span style="color:var(--color-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">${isId ? 'Jumlah Porsi' : 'Quantity'}:</span>
              <div style="font-weight:700; color:var(--color-forest);">${reservation.quantity} ${escapeHtml(reservation.unit || 'porsi')}</div>
            </div>
            <div>
              <span style="color:var(--color-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">${isId ? 'Penyedia Makanan' : 'Provider'}:</span>
              <div style="font-weight:600; color:var(--color-ink);">${escapeHtml(reservation.providerName)}</div>
            </div>
          </div>
          <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--color-line-strong);">
            <span style="color:var(--color-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">${isId ? 'Jadwal Penjemputan' : 'Pickup Window'}:</span>
            <div style="font-weight:600; color:var(--color-ink);">${escapeHtml(windowStr)}</div>
          </div>
          ${
            reservation.collectionInstructions
              ? `
              <div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--color-line-strong);">
                <span style="color:var(--color-muted); font-size:0.72rem; text-transform:uppercase; font-weight:700;">${isId ? 'Petunjuk Tempat' : 'Instructions'}:</span>
                <div style="color:var(--color-ink-soft); font-size:0.8rem;">${escapeHtml(reservation.collectionInstructions)}</div>
              </div>
            `
              : ''
          }
        </div>

        <p style="font-size:0.78rem; color:var(--color-muted); line-height:1.4;">
          ${icon('info', 12)} ${isId ? 'Tunjukkan QR Code ini kepada staf penyedia makanan saat serah terima. Staf akan memindai untuk mencatat handoff resmi.' : 'Present this QR code to the staff upon arrival. They will scan it to complete the handoff.'}
        </p>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="qr-copy-code-btn">
        ${icon('check', 13)} ${isId ? 'Salin Kode Tiket' : 'Copy Ticket ID'}
      </button>
      <button type="button" class="btn btn-primary btn-sm" data-modal-close>
        ${isId ? 'Tutup' : 'Close'}
      </button>
    `,
    onMount(dialog) {
      const copyBtn = dialog.querySelector('#qr-copy-code-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(reservation.id);
            showToast(isId ? `Kode tiket ${reservation.id} disalin ke clipboard.` : `Ticket ${reservation.id} copied.`, 'success');
          }
        });
      }
    }
  });
}

/**
 * Open QR Scanner Modal for Food Providers (Toko/Resto/Steward)
 */
export function openQrScannerModal({ onHandoffCompleted } = {}) {
  const isId = getLanguage() === 'id';
  let activeMediaStream = null;

  // Fetch all pending / reserved reservations for quick 1-click test scan simulation
  const allReservations = reservationService.getAllReservations();
  const pendingReservations = allReservations.filter((r) => r.status === 'reserved' || r.status === 'collected');

  openModal({
    title: isId ? 'Scanner QR Serah Terima Penjemputan' : 'FoodLoop Surplus QR Scanner',
    bodyHtml: `
      <div id="scanner-modal-body">
        <!-- Viewfinder Box -->
        <div class="scanner-viewport-wrap" id="scanner-viewport">
          <video class="scanner-camera-video" id="scanner-video-feed" playsinline muted autoplay style="display:none;"></video>
          <div class="scanner-frame-overlay">
            <span class="scanner-corner tl"></span>
            <span class="scanner-corner tr"></span>
            <span class="scanner-corner bl"></span>
            <span class="scanner-corner br"></span>
            <div class="scanner-laser-beam"></div>
          </div>
          <div class="scanner-guide-text">
            ${icon('camera', 13)} ${isId ? 'Arahkan kamera ke QR Code di layar ponsel penerima' : 'Point camera at the recipient’s QR code ticket'}
          </div>
        </div>

        <!-- Scan Result Container (Dynamically updated) -->
        <div id="scanner-result-panel" style="display:none; margin-bottom:14px;"></div>

        <!-- Manual Input / Quick Scan Section -->
        <div id="scanner-controls-panel">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:0.8125rem; font-weight:700; color:var(--color-ink);">
              ${isId ? 'Masukkan Kode Tiket atau Pilih Simulasi Scan:' : 'Enter Ticket Code or Simulate Scan:'}
            </span>
          </div>

          <form id="scanner-manual-form" style="display:flex; gap:8px; margin-bottom:12px;">
            <input
              type="text"
              id="scanner-manual-input"
              class="form-input"
              placeholder="${isId ? 'Ketik atau tempel kode tiket (cth. res_001)...' : 'Type or paste ticket ID (e.g. res_001)...'}"
              style="font-family:var(--font-mono); font-size:0.875rem;"
            />
            <button type="submit" class="btn btn-primary btn-sm" style="flex-shrink:0;">
              ${icon('scan', 13)} ${isId ? 'Verifikasi' : 'Verify'}
            </button>
          </form>

          ${
            pendingReservations.length > 0
              ? `
              <div style="font-size:0.75rem; color:var(--color-muted); margin-bottom:6px; font-weight:600;">
                ${isId ? 'Tiket Aktif Tersedia (Klik untuk Simulasi Scan 1 Detik):' : 'Active Demo Tickets Ready for Scan:'}
              </div>
              <div style="display:flex; flex-direction:column; gap:6px; max-height:140px; overflow-y:auto; padding-right:2px;">
                ${pendingReservations
                  .map(
                    (r) => `
                    <button type="button" class="quick-scan-chip" data-test-scan="${escapeHtml(r.id)}">
                      <span><strong>${escapeHtml(r.id)}</strong> - ${escapeHtml(r.listingTitle)} (${r.quantity} ${escapeHtml(r.unit)})</span>
                      <span style="color:var(--color-forest); font-weight:700;">${icon('scan', 12)} Scan</span>
                    </button>
                  `
                  )
                  .join('')}
              </div>
            `
              : `
              <div class="notice-banner" style="font-size:0.8rem; margin-top:8px;">
                <span class="notice-banner-icon">${icon('info', 12)}</span>
                <span>${isId ? 'Tidak ada reservasi aktif saat ini. Pesan surplus terlebih dahulu untuk menguji scanner.' : 'No active reservations awaiting pickup right now.'}</span>
              </div>
            `
          }
        </div>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="scanner-toggle-camera-btn">
        ${icon('camera', 13)} ${isId ? 'Kamera Langsung' : 'Live Camera'}
      </button>
      <button type="button" class="btn btn-ghost btn-sm" data-modal-close>
        ${isId ? 'Tutup Scanner' : 'Close'}
      </button>
    `,
    onMount(dialog) {
      const resultPanel = dialog.querySelector('#scanner-result-panel');
      const controlsPanel = dialog.querySelector('#scanner-controls-panel');
      const manualForm = dialog.querySelector('#scanner-manual-form');
      const manualInput = dialog.querySelector('#scanner-manual-input');
      const videoEl = dialog.querySelector('#scanner-video-feed');
      const toggleCamBtn = dialog.querySelector('#scanner-toggle-camera-btn');

      // Process verification of a ticket ID
      const processTicketCode = (rawCode) => {
        if (!rawCode) return;
        let cleanId = rawCode.trim();
        if (cleanId.startsWith('FOODLOOP-RES:')) {
          cleanId = cleanId.replace('FOODLOOP-RES:', '');
        }

        const reservations = reservationService.getAllReservations();
        const found = reservations.find((r) => r.id.toLowerCase() === cleanId.toLowerCase());

        if (!found) {
          resultPanel.style.display = 'block';
          resultPanel.innerHTML = `
            <div class="notice-banner notice-banner-danger" style="margin-bottom:10px;">
              <span class="notice-banner-icon">${icon('alertTriangle', 12)}</span>
              <div>
                <strong>${isId ? 'Tiket Tidak Ditemukan!' : 'Ticket Not Found!'}</strong>
                <div style="font-size:0.8rem; margin-top:2px;">${isId ? `Kode "${escapeHtml(cleanId)}" tidak terdaftar di sistem FoodLoop.` : `Code "${escapeHtml(cleanId)}" does not exist.`}</div>
              </div>
            </div>
          `;
          return;
        }

        if (found.status === 'completed') {
          resultPanel.style.display = 'block';
          resultPanel.innerHTML = `
            <div class="notice-banner notice-banner-warning" style="margin-bottom:10px;">
              <span class="notice-banner-icon">${icon('check', 12)}</span>
              <div>
                <strong>${isId ? 'Tiket Sudah Diserahterimakan' : 'Already Completed'}</strong>
                <div style="font-size:0.8rem; margin-top:2px;">${isId ? `Makanan ini telah diambil dan dicatat selesai sebelumnya.` : `This ticket was already marked completed.`}</div>
              </div>
            </div>
          `;
          return;
        }

        // Valid pending ticket found!
        resultPanel.style.display = 'block';
        resultPanel.innerHTML = `
          <div style="background:var(--color-paper); border:2px solid var(--color-leaf); border-radius:var(--radius-md); padding:14px; box-shadow:var(--shadow-sm); animation:viewFadeIn 200ms ease;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <span class="badge badge-success">${icon('shieldCheck', 13)} ${isId ? 'Tiket Terverifikasi Valid' : 'Valid Verified Ticket'}</span>
              <span style="font-family:var(--font-mono); font-weight:700; color:var(--color-forest);">${escapeHtml(found.id)}</span>
            </div>

            <div style="font-weight:700; font-size:1.05rem; color:var(--color-ink); margin-bottom:4px;">
              ${escapeHtml(found.listingTitle)}
            </div>

            <div style="font-size:0.84rem; color:var(--color-ink-soft); margin-bottom:10px;">
              ${isId ? 'Penerima' : 'Recipient'}: <strong>${escapeHtml(found.recipientName)}</strong> •
              ${isId ? 'Porsi' : 'Qty'}: <strong style="color:var(--color-forest);">${found.quantity} ${escapeHtml(found.unit)}</strong>
            </div>

            <div style="background:var(--color-cream); padding:10px; border-radius:var(--radius-sm); font-size:0.78rem; color:var(--color-ink-soft); margin-bottom:12px;">
              <div style="font-weight:700; color:var(--color-forest); margin-bottom:4px;">
                ${icon('shieldCheck', 12)} ${isId ? 'Pemeriksaan Mutu & Keamanan:' : 'Quality & Safety Checks:'}
              </div>
              <div style="display:flex; align-items:center; gap:6px;">${icon('check', 12)} <span>${isId ? 'Kemasan makanan bersih, higienis & tertutup rapi' : 'Food containers clean and sealed'}</span></div>
              <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">${icon('check', 12)} <span>${isId ? 'Label batas konsumsi & alergen telah diperiksa' : 'Allergen & best-before labels checked'}</span></div>
              <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">${icon('check', 12)} <span>${isId ? 'Identitas pengambil sesuai dengan nama di tiket' : 'Recipient verified against reservation ticket'}</span></div>
            </div>

            <button type="button" class="btn btn-primary btn-block" id="confirm-scan-handoff-btn" style="min-height:44px; font-weight:700;">
              ${icon('check', 14)} ${isId ? 'Konfirmasi Serah Terima (Selesaikan Handoff)' : 'Confirm & Complete Handoff'}
            </button>
          </div>
        `;

        // Bind completion button
        const confirmBtn = resultPanel.querySelector('#confirm-scan-handoff-btn');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
            reservationService.transitionReservationStatus(found.id, 'completed');
            closeModal();
            showToast(
              isId
                ? `Serah terima tiket ${found.id} berhasil diselesaikan via Scan QR!`
                : `Handoff for ticket ${found.id} completed via QR Scan!`,
              'success'
            );

            if (typeof onHandoffCompleted === 'function') {
              onHandoffCompleted(found);
            } else {
              router.resolve();
            }
          });
        }
      };

      // Form submit handler
      manualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        processTicketCode(manualInput.value);
      });

      // Quick test scan chips
      dialog.querySelectorAll('[data-test-scan]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const testId = btn.getAttribute('data-test-scan');
          manualInput.value = testId;
          // Trigger simulated laser flash
          const laser = dialog.querySelector('.scanner-laser-beam');
          if (laser) {
            laser.style.background = '#48BB78';
            laser.style.boxShadow = '0 0 20px #48BB78';
            setTimeout(() => {
              laser.style.background = '';
              laser.style.boxShadow = '';
            }, 600);
          }
          processTicketCode(testId);
        });
      });

      // Optional real webcam initiation
      if (toggleCamBtn) {
        toggleCamBtn.addEventListener('click', async () => {
          if (!activeMediaStream && navigator.mediaDevices?.getUserMedia) {
            try {
              activeMediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
              });
              if (videoEl) {
                videoEl.srcObject = activeMediaStream;
                videoEl.style.display = 'block';
              }
              toggleCamBtn.classList.add('btn-primary');
              showToast(isId ? 'Kamera aktif. Arahkan ke QR Code.' : 'Camera active. Point at QR code.', 'info');
            } catch (err) {
              showToast(isId ? 'Kamera tidak dapat diakses. Gunakan simulasi scan cepat.' : 'Camera unavailable. Use quick simulation.', 'warning');
            }
          } else if (activeMediaStream) {
            activeMediaStream.getTracks().forEach((t) => t.stop());
            activeMediaStream = null;
            if (videoEl) videoEl.style.display = 'none';
            toggleCamBtn.classList.remove('btn-primary');
          }
        });
      }
    }
  });
}
