/**
 * FoodLoop Input Validation & HTML Sanitization Utilities (PRD Section 23)
 * Escapes untrusted strings before rendering in templates.
 */

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isIndonesian() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('foodloop_language') === 'id';
}

export function validateListingStep1(data) {
  const isId = isIndonesian();
  const errors = {};
  if (!data.title || data.title.trim().length < 3) {
    errors.title = isId
      ? 'Mohon masukkan nama makanan yang jelas (minimal 3 karakter).'
      : 'Please enter a descriptive food title (at least 3 characters).';
  }
  if (!data.category) {
    errors.category = isId
      ? 'Silakan pilih kategori makanan.'
      : 'Please choose a food category.';
  }
  if (!data.description || data.description.trim().length < 10) {
    errors.description = isId
      ? 'Mohon berikan deskripsi ringkas mengenai porsi dan cara pengemasan (minimal 10 karakter).'
      : 'Please provide a brief description of what is included.';
  }
  const qty = Number(data.quantityTotal);
  if (!Number.isFinite(qty) || qty < 1 || qty > 2000) {
    errors.quantityTotal = isId
      ? 'Masukkan jumlah porsi yang valid (antara 1 hingga 2.000).'
      : 'Enter a valid available quantity (between 1 and 2,000).';
  }
  if (!data.unit) {
    errors.unit = isId
      ? 'Pilih satuan takaran.'
      : 'Select a unit of measure.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateListingStep2(data) {
  const isId = isIndonesian();
  const errors = {};
  if (!data.pickupStart) {
    errors.pickupStart = isId
      ? 'Tentukan jam mulai pengambilan.'
      : 'Specify when collection can begin.';
  }
  if (!data.pickupEnd) {
    errors.pickupEnd = isId
      ? 'Tentukan batas akhir pengambilan.'
      : 'Specify the collection deadline.';
  }
  if (data.pickupStart && data.pickupEnd) {
    const start = new Date(data.pickupStart);
    const end = new Date(data.pickupEnd);
    if (end <= start) {
      errors.pickupEnd = isId
        ? 'Batas akhir pengambilan harus lebih lambat dari waktu mulai.'
        : 'Collection deadline must be after the start time.';
    }
  }
  if (!data.area) {
    errors.area = isId
      ? 'Pilih perkiraan wilayah di Bali.'
      : 'Select an approximate area in Bali.';
  }
  if (!data.collectionInstructions || data.collectionInstructions.trim().length < 5) {
    errors.collectionInstructions = isId
      ? 'Tuliskan petunjuk pengambilan yang jelas agar penerima tahu ke mana harus melapor.'
      : 'Add clear pickup instructions so the recipient knows where to go.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

