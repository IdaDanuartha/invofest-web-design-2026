/**
 * FoodLoop Assist - AI Service Module (PRD Section 10 & 11)
 * Deterministic local AI assistant with optional secure endpoint hook.
 * Strictly avoids inventing preparation times, ingredients, allergens, or food-safety claims.
 */

import { getLanguage } from './i18nService.js';

export async function draftListing(input = '', context = {}) {
  const isId = getLanguage() === 'id';
  const raw = String(input || '').trim();
  if (!raw) {
    throw new Error(isId ? 'Harap masukkan deskripsi singkat makanan surplus hari ini.' : 'Please enter a short description of the surplus food you have today.');
  }

  const lower = raw.toLowerCase();

  // 1. Extract explicit quantity and unit if stated
  let quantityTotal = null;
  let unit = isId ? 'porsi' : 'portions';
  const qtyMatch = raw.match(/(\d+)\s*(portions?|porsi|packs?|paket|bungkus|kg|kilograms?|boxes|kotak|loaves|trays|nampan|bowls|mangkuk|items?)/i);
  if (qtyMatch) {
    quantityTotal = Number(qtyMatch[1]);
    const matchedUnit = qtyMatch[2].toLowerCase();
    if (matchedUnit.startsWith('pack') || matchedUnit.startsWith('paket') || matchedUnit.startsWith('bungkus') || matchedUnit.startsWith('loaf') || matchedUnit.startsWith('loaves') || matchedUnit.startsWith('tray') || matchedUnit.startsWith('nampan')) {
      unit = isId ? 'paket' : 'packs';
    } else if (matchedUnit.startsWith('kg') || matchedUnit.startsWith('kilo')) {
      unit = 'kg';
    } else if (matchedUnit.startsWith('box') || matchedUnit.startsWith('kotak')) {
      unit = isId ? 'kotak' : 'boxes';
    } else {
      unit = isId ? 'porsi' : 'portions';
    }
  } else {
    const bareNumber = raw.match(/\b(\d+)\b/);
    if (bareNumber) {
      quantityTotal = Number(bareNumber[1]);
    }
  }

  // 2. Classify category based on explicit keywords
  let category = 'prepared-meals';
  if (/(bread|loaf|loaves|sourdough|pastry|croissant|roll|cake|muffin|bakery|buns|roti|kue)/i.test(lower)) {
    category = 'bakery';
  } else if (/(crate|vegetable|fruit|greens|tomato|carrot|produce|spinach|papaya|harvest|bok choy|sayur|buah|tomat|wortel|kangkung|bayam|panen)/i.test(lower)) {
    category = 'produce';
  } else if (/(dry|oats|lentil|pantry|canned|sealed|flour|grocery|packets|sembako|beras|kering|kaleng|tepung)/i.test(lower)) {
    category = 'grocery';
  }

  // 3. Extract explicit preparation time if stated (never invent!)
  let preparedAtNote = isId ? 'Harap konfirmasi' : 'Please confirm';
  const prepMatch = raw.match(/(?:prepared|baked|disiapkan|dimasak|dipanggang)\s*(?:at|around|jam|pukul)?\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|wita))/i);
  if (prepMatch) {
    preparedAtNote = isId
      ? `Tercatat di catatan: ${prepMatch[1]} (Harap verifikasi tanggal & jam pasti)`
      : `Stated in note: ${prepMatch[1]} (Please verify exact date/time)`;
  }

  // 4. Extract explicit collection deadline if stated
  let pickupDeadlineNote = isId ? 'Harap konfirmasi' : 'Please confirm';
  let suggestedPickupEndHour = '17:00';
  const collectMatch = raw.match(/(?:collect|pickup|pick up|before|by|until|ambil|sebelum|pukul|jam)\s*(?:before|by|jam|pukul)?\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(?:am|pm|wita))/i);
  if (collectMatch) {
    const timeClean = collectMatch[1].replace('.', ':');
    pickupDeadlineNote = isId ? `Ambil sebelum pukul ${timeClean}` : `Collect before ${timeClean}`;
    if (/(\d{1,2}):(\d{2})/.test(collectMatch[1])) {
      suggestedPickupEndHour = collectMatch[1].replace('.', ':');
    }
  }

  // 5. Extract explicit storage condition if stated (never invent!)
  let storageNotes = isId
    ? 'Harap konfirmasi suhu penyimpanan & wadah'
    : 'Please confirm storage temperature & packaging';
  if (/chilled|refrigerated|fridge|cold|4°c|cooler|dingin|kulkas/i.test(lower)) {
    storageNotes = isId
      ? 'Disimpan dingin sesuai catatan penyedia (harap periksa log suhu)'
      : 'Chilled storage stated by provider (please confirm temperature log)';
  } else if (/ambient|room temp|paper bag|dry|ruang|kering|kantong kertas/i.test(lower)) {
    storageNotes = isId
      ? 'Suhu ruang / penyimpanan kering sesuai catatan penyedia'
      : 'Ambient / dry storage stated by provider (please verify packaging)';
  } else if (/frozen|freezer|beku/i.test(lower)) {
    storageNotes = isId
      ? 'Penyimpanan beku sesuai catatan penyedia'
      : 'Frozen storage stated by provider';
  }

  // 6. Extract explicitly mentioned food items as candidate ingredients
  const knownIngredients = [
    'rice', 'vegetables', 'tofu', 'tempeh', 'chicken', 'sourdough', 'wheat',
    'oats', 'lentils', 'pumpkin', 'coconut', 'noodles', 'papaya', 'banana', 'greens', 'carrots',
    'nasi', 'sayur', 'tahu', 'tempe', 'ayam', 'gandum', 'labu', 'santan', 'mie', 'pepaya', 'pisang', 'wortel'
  ];
  const extractedIngredients = knownIngredients.filter((item) => lower.includes(item));

  // 7. Build suggested title without embellishing safety claims
  let suggestedTitle = isId ? 'Listing makanan surplus' : 'Surplus food listing';
  if (lower.includes('vegetable rice') || lower.includes('nasi sayur') || lower.includes('nasi kotak')) {
    suggestedTitle = isId ? 'Porsi nasi kotak sayur' : 'Vegetable rice portions';
  } else if (lower.includes('sourdough') || lower.includes('bread') || lower.includes('roti')) {
    suggestedTitle = isId ? 'Roti sourdough artisan & aneka roti' : 'Fresh bakery loaves & rolls';
  } else if (lower.includes('curry') || lower.includes('kari')) {
    suggestedTitle = isId ? 'Porsi kari & nasi hangat' : 'Prepared curry & rice portions';
  } else if ((lower.includes('vegetable') || lower.includes('sayur')) && category === 'produce') {
    suggestedTitle = isId ? 'Kotak sayuran segar panen' : 'Mixed fresh produce crates';
  } else {
    const cleanedWords = raw
      .replace(/^\d+\s*(portions?|porsi|packs?|paket|bungkus|kg|boxes|kotak|bowls)\s*(of)?\s*/i, '')
      .split(/[,.]/)[0]
      .trim();
    if (cleanedWords.length >= 3) {
      suggestedTitle = cleanedWords.charAt(0).toUpperCase() + cleanedWords.slice(1, 58);
    }
  }

  // 8. Build missing details checklist
  const missingChecklist = [];
  if (!quantityTotal) {
    missingChecklist.push(
      isId
        ? 'Jumlah dan satuan pasti (contoh: porsi, paket, atau kg) - Harap konfirmasi.'
        : 'Exact quantity and unit (e.g., portions, packs, or kg) - Please confirm.'
    );
  }
  if (preparedAtNote.includes('confirm') || preparedAtNote.includes('konfirmasi')) {
    missingChecklist.push(
      isId
        ? 'Waktu pengolahan / pembuatan - Belum dicantumkan di catatan. Harap konfirmasi.'
        : 'Preparation / baking time - Not stated in note. Please confirm.'
    );
  }
  if (pickupDeadlineNote.includes('confirm') || pickupDeadlineNote.includes('konfirmasi')) {
    missingChecklist.push(
      isId
        ? 'Jadwal mulai dan batas akhir penjemputan - Harap konfirmasi.'
        : 'Collection start and deadline window - Please confirm.'
    );
  }
  if (storageNotes.toLowerCase().includes('confirm') || storageNotes.toLowerCase().includes('konfirmasi')) {
    missingChecklist.push(
      isId
        ? 'Kondisi penyimpanan (dingin, suhu ruang, atau hangat) - Harap konfirmasi.'
        : 'Storage condition (chilled, ambient, or hot-held) - Please confirm.'
    );
  }
  // Always require explicit provider confirmation of allergens
  missingChecklist.push(
    isId
      ? 'Keterbukaan alergen (gluten, kedelai, kacang, susu, telur) - Penyedia wajib memverifikasi dan mengonfirmasi.'
      : 'Allergen disclosure (gluten, soy, nuts, dairy, eggs) - Provider must verify and confirm.'
  );
  if (!context.area) {
    missingChecklist.push(
      isId
        ? 'Wilayah penjemputan dan petunjuk serah terima di lokasi - Harap konfirmasi.'
        : 'Pickup area and specific counter/handoff instructions - Please confirm.'
    );
  }

  // Suggested tags
  const suggestedTags = [];
  if (/vegetable|vegan|plant|sayur/i.test(lower) && !/chicken|fish|meat|egg|ayam|daging|ikan/i.test(lower)) {
    suggestedTags.push(isId ? 'Vegetarian (Verifikasi)' : 'Vegetarian (Verify)');
  }
  if (/chilled|dingin/i.test(lower)) {
    suggestedTags.push(isId ? 'Simpan dingin' : 'Chilled storage');
  }

  return {
    mode: 'Demo AI',
    disclaimer: isId
      ? 'Saran AI bersifat draf. Penyedia wajib memverifikasi seluruh detail, alergen, cara simpan, dan kelayakan sebelum menerbitkan.'
      : 'AI suggestions are drafts. Providers must verify all details, allergens, storage information, and suitability before publishing.',
    rawInput: raw,
    title: suggestedTitle,
    category,
    quantityTotal: quantityTotal || (isId ? 'Harap konfirmasi' : 'Please confirm'),
    unit,
    description: isId
      ? `${raw.endsWith('.') ? raw : `${raw}.`} Disiapkan untuk penjemputan penerima melalui FoodLoop.`
      : `${raw.endsWith('.') ? raw : `${raw}.`} Structured for recipient collection via FoodLoop.`,
    preparedAtNote,
    pickupDeadlineNote,
    suggestedPickupEndHour,
    storageNotes,
    ingredients: extractedIngredients.length > 0
      ? extractedIngredients.join(', ')
      : (isId ? 'Harap konfirmasi bahan makanan' : 'Please confirm ingredients'),
    allergens: [isId ? 'Harap konfirmasi dengan penyedia' : 'Please confirm with provider'],
    suggestedTags,
    missingChecklist
  };
}

/**
 * Transparent local scoring algorithm for recipient matching (PRD Section 11)
 */
export async function matchSurplus(preferences = {}, listings = []) {
  const isId = getLanguage() === 'id';
  const targetArea = preferences.area || 'Denpasar';
  const targetCategory = preferences.category || 'all';
  const neededQuantity = Number(preferences.quantity) || 10;
  const excludeAllergens = preferences.excludeAllergens || [];

  const candidates = listings.filter(
    (item) => item.status !== 'draft' && item.status !== 'expired' && item.quantityAvailable > 0
  );

  const scored = candidates.map((item) => {
    let score = 0;
    const reasons = [];
    const cautions = [];

    // 1. Category match (up to 35 pts)
    if (targetCategory === 'all' || item.category === targetCategory) {
      score += 35;
      reasons.push(
        isId
          ? `Kategori cocok dengan preferensi (${item.category.replace('-', ' ')})`
          : `Category matches preference (${item.category.replace('-', ' ')})`
      );
    } else {
      score += 10;
    }

    // 2. Area compatibility (up to 30 pts)
    if (item.area.toLowerCase() === targetArea.toLowerCase()) {
      score += 30;
      reasons.push(
        isId
          ? `Wilayah sama (${item.area}) - rute penjemputan sangat dekat`
          : `Same area (${item.area}) - short collection route`
      );
    } else if (item.area.includes('Badung') && targetArea.includes('Badung')) {
      score += 20;
      reasons.push(
        isId
          ? `Kecamatan Badung berdekatan (${item.area})`
          : `Nearby Badung sub-district (${item.area})`
      );
    } else {
      score += 8;
      cautions.push(
        isId
          ? `Berlokasi di ${item.area} (berbeda dari area pilihan ${targetArea})`
          : `Located in ${item.area} (different from selected area ${targetArea})`
      );
    }

    // 3. Quantity compatibility (up to 20 pts)
    if (item.quantityAvailable >= neededQuantity) {
      score += 20;
      reasons.push(
        isId
          ? `Jumlah tersedia (${item.quantityAvailable} ${item.unit}) mencukupi kebutuhan ${neededQuantity}`
          : `Available quantity (${item.quantityAvailable} ${item.unit}) covers requested ${neededQuantity}`
      );
    } else {
      const ratio = Math.max(0.2, item.quantityAvailable / neededQuantity);
      score += Math.round(20 * ratio);
      reasons.push(
        isId
          ? `Kecocokan kapasitas sebagian: tersedia ${item.quantityAvailable} ${item.unit}`
          : `Partial capacity match: ${item.quantityAvailable} ${item.unit} available`
      );
    }

    // 4. Information completeness & allergen transparency (up to 15 pts)
    const allergenString = (item.allergens || []).join(' ').toLowerCase();
    const hasUnconfirmedAllergen = allergenString.includes('please confirm') || allergenString.includes('not specified') || allergenString.includes('konfirmasi');
    if (!hasUnconfirmedAllergen) {
      score += 15;
      reasons.push(
        isId
          ? 'Penyedia melengkapi rincian bahan makanan & keterbukaan alergen'
          : 'Provider supplied specific ingredient & allergen disclosure'
      );
    } else {
      score += 5;
      cautions.push(
        isId
          ? 'Rincian alergen memerlukan konfirmasi langsung dengan penyedia sebelum penjemputan'
          : 'Allergen details require confirmation with provider before collection'
      );
    }

    if (excludeAllergens.length > 0) {
      const conflict = excludeAllergens.find((a) => allergenString.includes(a.toLowerCase()));
      if (conflict) {
        score -= 40;
        cautions.push(
          isId
            ? `Peringatan alergen tercatat: memuat ${conflict}`
            : `Disclosed allergen warning: mentions ${conflict}`
        );
      }
    }

    return {
      listing: item,
      score: Math.max(5, Math.min(99, score)),
      confidence: hasUnconfirmedAllergen
        ? (isId ? 'Sedang - butuh konfirmasi alergen' : 'Medium - confirm allergens')
        : (isId ? 'Tinggi - data lengkap' : 'High - complete details'),
      reasons,
      cautions
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    mode: isId ? 'Demo AI - Penilaian Transparan' : 'Demo AI - Transparent Local Scoring',
    preferencesUsed: { targetArea, targetCategory, neededQuantity },
    matches: scored
  };
}

/**
 * Drafts a concise, respectful collection coordination message (PRD Section 11)
 */
export async function draftPickupMessage(context = {}) {
  const isId = getLanguage() === 'id';
  const recipientName = context.recipientName || (isId ? 'Dapur Komunitas (Demo)' : 'Community Table (Demo)');
  const providerName = context.providerName || 'Demo Kitchen';
  const listingTitle = context.listingTitle || (isId ? 'Nasi kotak sayur segar' : 'Vegetable rice bowls');
  const quantity = context.quantity || 4;
  const unit = context.unit || (isId ? 'porsi' : 'portions');
  const pickupTime = context.pickupTime || '15:30 WITA';
  const bringContainer = context.bringContainer
    ? (isId ? 'Kami akan membawa wadah berinsulasi bersih dan tas jinjing sesuai permintaan.' : 'We will bring clean insulated containers and tote bags as requested.')
    : (isId ? 'Kami telah mencatat instruksi kemasan tertutup yang disediakan.' : 'We have noted the sealed packaging instructions.');

  return {
    mode: 'Demo AI',
    subject: isId
      ? `Koordinasi Penjemputan FoodLoop: ${listingTitle} (${quantity} ${unit})`
      : `FoodLoop Pickup Coordination: ${listingTitle} (${quantity} ${unit})`,
    message: isId
      ? `Halo tim ${providerName},\n\nKami dari ${recipientName} ingin mengonfirmasi reservasi FoodLoop untuk ${quantity} ${unit} "${listingTitle}".\n\nPetugas penjemputan kami berencana tiba sekitar pukul ${pickupTime} dalam rentang waktu penjemputan yang ditentukan. ${bringContainer}\n\nMohon beri tahu kami jika ada pembaruan terkait petunjuk serah terima di konter dapur atau catatan alergen. Terima kasih banyak telah berbagi makanan surplus ini!`
      : `Hello ${providerName} team,\n\nThis is ${recipientName} confirming our FoodLoop reservation for ${quantity} ${unit} of "${listingTitle}".\n\nOur collection person plans to arrive around ${pickupTime} within your stated pickup window. ${bringContainer}\n\nPlease let us know if there are any updates to the kitchen counter handoff instructions or allergen notes. Thank you for sharing this surplus!`,
    note: isId
      ? 'Tinjau dan edit sebelum dikirim. Pesan hanya dikirim saat Anda menekan tombol Kirim.'
      : 'Review and edit before sending. Messages are only sent when you click Send.'
  };
}

