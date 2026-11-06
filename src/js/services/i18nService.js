/**
 * FoodLoop Multi-Language (i18n) Service
 * Primary Language: Indonesian ('id')
 * Secondary Language: English ('en')
 */

const STORAGE_KEY = 'foodloop_language';
let currentLang = typeof localStorage !== 'undefined'
  ? (localStorage.getItem(STORAGE_KEY) || 'id')
  : 'id';

// Ensure valid language
if (currentLang !== 'id' && currentLang !== 'en') {
  currentLang = 'id';
}

const listeners = new Set();

export const translations = {
  id: {
    // Nav & Header
    nav_home: 'Beranda',
    nav_discover: 'Temukan Makanan',
    nav_howItWorks: 'Cara Kerja',
    nav_assistant: 'Asisten AI',
    nav_partners: 'Mitra',
    nav_impact: 'Dampak Sosial',
    nav_listSurplus: 'Pasang Surplus',
    nav_dashboard: 'Dashboard',
    nav_signIn: 'Masuk',
    nav_switchAccount: 'Ganti Akun',
    nav_quickGuide: 'Panduan Cepat',
    nav_textSize: 'Mode Teks',
    nav_textLarge: 'A+ (Besar)',
    nav_textNormal: 'Normal',
    nav_lang: 'Bahasa',

    // Demo Context Bar
    demo_pill: 'DEMO PROTOTIPE',
    demo_session: 'Sesi aktif',
    demo_switchRole: 'Ganti peran',
    demo_resetBtn: 'Reset data',
    demo_role_recipient: 'Organisasi Komunitas',
    demo_role_provider: 'Penyedia Makanan',
    demo_role_individual: 'Warga / Individu',

    // Homepage Hero
    hero_eyebrow: 'Redistribusi Makanan Berlebih di Bali',
    hero_title: 'Makanan bermutu layak dapat kesempatan kedua.',
    hero_subtitle: 'FoodLoop menghubungkan bisnis kuliner di Bali dengan komunitas lokal dan warga agar surplus makanan berlebih dapat dibagikan, dipesan, dan diambil secara bermartabat dan 100% gratis.',
    hero_cta_discover: 'Cari Makanan di Sekitar Anda',
    hero_cta_donate: 'Pasang Surplus Makanan',
    hero_avail_now: 'Tersedia sekarang',
    hero_demo_listing: 'Contoh listing',

    // Hero 4 Flow Steps
    flow_1_title: 'Pasang',
    flow_1_desc: 'Bagikan jumlah porsi, cara simpan, dan jam ambil.',
    flow_2_title: 'Cocokkan',
    flow_2_desc: 'Warga & komunitas sekitar memilih berdasarkan kebutuhan & lokasi.',
    flow_3_title: 'Ambil',
    flow_3_desc: 'Pesan porsi yang dibutuhkan dan ambil langsung di lokasi.',
    flow_4_title: 'Beri Dampak',
    flow_4_desc: 'Setiap porsi yang terselamatkan tercatat transparan.',

    // User Guide for Seniors & Beginners
    guide_badge: 'Kemudahan Pengguna & Tanggung Jawab Sosial',
    guide_heading: 'Baru di FoodLoop? Cara Mudah Mengambil Makanan (Ramah Semua Usia & Lansia)',
    guide_intro: 'FoodLoop dirancang sangat sederhana agar siapa saja - termasuk orang tua dan warga yang baru pertama kali menggunakan ponsel - dapat memesan makanan berkualitas secara gratis, tanpa biaya dan tanpa langkah rumit.',
    guide_step1_title: 'Pilih Makanan di Sekitar Anda',
    guide_step1_desc: 'Buka halaman Discover. Pilih lokasi terdekat (Denpasar, Kuta, Ubud, dll). Lihat foto asli makanan, jam ambil, dan jaminan kehalalan.',
    guide_step1_tag: 'Bebas pilih wilayah',
    guide_step2_title: 'Pesan Porsi (100% Gratis)',
    guide_step2_desc: 'Klik tombol hijau "Ambil Makanan". Tentukan berapa porsi yang dibutuhkan. Tidak ada kartu kredit dan tidak ada biaya sepeser pun.',
    guide_step2_tag: 'Tanpa pembayaran',
    guide_step3_title: 'Ambil & Nikmati Makanan',
    guide_step3_desc: 'Datang ke restoran atau hotel penyedia sebelum batas waktu. Cukup tunjukkan Kode Tiket di layar HP Anda kepada staf.',
    guide_step3_tag: 'Pengambilan tertib & higienis',
    guide_btn_large_text: 'Aktifkan Mode Tulisan Besar (A+)',
    guide_btn_normal_text: 'Kembalikan Ukuran Teks Normal',
    guide_btn_read_more: 'Baca Panduan Lengkap Bergambar',
    guide_btn_ask_ai: 'Bingung? Tanya Asisten Pintar FoodLoop →',

    // Quick Discovery Bar
    search_heading: 'Cari makanan surplus berdasarkan wilayah & jam ambil',
    search_sub: 'Pilih area di Bali - FoodLoop menjaga privasi tanpa pelacakan lokasi paksa',
    search_query_label: 'Cari nama makanan atau restoran',
    search_query_placeholder: 'Contoh: nasi kotak, roti sourdough, buah...',
    search_area_label: 'Wilayah (Demo Bali)',
    search_area_all: 'Semua wilayah Bali',
    search_cat_label: 'Kategori makanan',
    search_cat_all: 'Semua kategori',
    search_time_label: 'Waktu pengambilan',
    search_time_all: 'Ambil hari ini',
    search_time_urgent: 'Sebelum 17:30 WITA',
    search_time_flexible: 'Waktu fleksibel',
    search_btn: 'Cari Makanan',

    // Community Listings
    community_eyebrow: 'Listing Komunitas',
    community_heading: 'Makanan segar, tersedia di dekat Anda',
    community_sub: 'Pratinjau surplus makanan dari komunitas mitra FoodLoop hari ini.',
    community_explore_btn: 'Jelajahi Semua Makanan Tersedia →',

    // Status Badges
    status_available: 'Tersedia',
    status_almost: 'Sisa Sedikit',
    status_reserved: 'Sudah Dipesan Penuh',
    status_expired: 'Kedaluwarsa',
    status_completed: 'Pengambilan Selesai',

    // Card Specs
    card_available_qty: 'Porsi tersedia',
    card_collect_by: 'Ambil sebelum',
    card_collect_today: 'Ambil hari ini',
    card_allergen_inside: 'Ada rincian alergen',
    card_allergen_check: 'Konfirmasi alergen',
    card_btn_view: 'Lihat Detail & Ambil',

    // Categories
    cat_prepared_meals: 'Makanan Siap Santap',
    cat_bakery: 'Roti & Kue',
    cat_produce: 'Sayur & Buah Segar',
    cat_grocery: 'Bahan Pokok & Sembako',
    cat_other: 'Surplus Lainnya',

    // Detail & Reservation
    detail_back: '← Kembali ke Daftar Makanan',
    detail_reserve_heading: 'Ketersediaan & Pengambilan',
    detail_remaining_qty: 'Jumlah tersisa',
    detail_window: 'Jam pengambilan',
    detail_location: 'Perkiraan lokasi',
    detail_qty_label: 'Jumlah porsi yang dipesan',
    detail_confirm_window: 'Saya mengonfirmasi dapat mengambil sebelum batas waktu dan akan memeriksa kondisi makanan saat serah terima.',
    detail_btn_reserve: 'Pesan Makanan Ini (100% Gratis)',
    detail_safety_title: 'Jaminan Higienis & Tanggung Jawab',
    detail_safety_desc: 'Mitra FoodLoop menjamin makanan berlebih disimpan dan disiapkan secara higienis dalam wadah bersih.',
    detail_success_title: 'Reservasi Berhasil!',
    detail_success_desc: 'Pesanan Anda telah tercatat. Silakan datang ke lokasi sebelum batas waktu pengambilan.',
    detail_res_id: 'Kode Reservasi',

    // Footer
    footer_about: 'FoodLoop adalah platform redistribusi makanan berlebih di Bali yang menghubungkan hotel & restoran dengan komunitas lokal untuk mengurangi sampah pangan dan membantu sesama secara bermartabat.',
    footer_quick_links: 'Navigasi Cepat',
    footer_contact: 'Bantuan & Pertanyaan',
    footer_legal: 'Keamanan Pangan & Hukum',
    footer_rights: 'Hak Cipta (c) 2026 FoodLoop Bali. Seluruh hak cipta dilindungi.'
  },

  en: {
    // Nav & Header
    nav_home: 'Home',
    nav_discover: 'Discover',
    nav_howItWorks: 'How it works',
    nav_assistant: 'FoodLoop Assist',
    nav_partners: 'Partners',
    nav_impact: 'Our impact',
    nav_listSurplus: 'List surplus',
    nav_dashboard: 'Dashboard',
    nav_signIn: 'Sign in',
    nav_switchAccount: 'Switch account',
    nav_quickGuide: 'Quick Guide',
    nav_textSize: 'Text Mode',
    nav_textLarge: 'Large (A+)',
    nav_textNormal: 'Normal',
    nav_lang: 'Language',

    // Demo Context Bar
    demo_pill: 'PROTOTYPE DEMO',
    demo_session: 'Active session',
    demo_switchRole: 'Switch role',
    demo_resetBtn: 'Reset data',
    demo_role_recipient: 'Recipient Org',
    demo_role_provider: 'Food Provider',
    demo_role_individual: 'Individual',

    // Homepage Hero
    hero_eyebrow: 'Bali Community Surplus Redistribution',
    hero_title: 'Good food deserves another chance.',
    hero_subtitle: 'FoodLoop connects food businesses in Bali with nearby community organizations and individuals so edible surplus food can be shared, reserved, collected, and tracked, dignified and 100% free.',
    hero_cta_discover: 'Discover surplus food',
    hero_cta_donate: 'List surplus food',
    hero_avail_now: 'Available now',
    hero_demo_listing: 'Demo listing',

    // Hero 4 Flow Steps
    flow_1_title: 'List',
    flow_1_desc: 'Share surplus quantity, storage, and pickup window.',
    flow_2_title: 'Match',
    flow_2_desc: 'Nearby recipients filter by need, area, and timing.',
    flow_3_title: 'Collect',
    flow_3_desc: 'Reserve exact portions and coordinate handoff.',
    flow_4_title: 'Make an impact',
    flow_4_desc: 'Confirmed handoffs build transparent local records.',

    // User Guide for Seniors & Beginners
    guide_badge: 'Usability & Social Responsibility',
    guide_heading: 'New to FoodLoop? Simple Steps to Collect Food (Friendly for All Ages & Seniors)',
    guide_intro: 'FoodLoop is designed simply so that anyone - including seniors and first-time smartphone users - can reserve quality food for free, with no fees and no complicated steps.',
    guide_step1_title: 'Choose Food Near You',
    guide_step1_desc: 'Open the Discover page. Pick your nearby area in Bali. Check real food photos, collection windows, and dietary safety.',
    guide_step1_tag: 'Flexible Bali areas',
    guide_step2_title: 'Reserve Portions (100% Free)',
    guide_step2_desc: 'Click the green "Reserve" button. Choose how many portions you need. No credit card, completely free.',
    guide_step2_tag: 'Zero payment required',
    guide_step3_title: 'Collect & Enjoy',
    guide_step3_desc: 'Visit the partner restaurant or hotel before the deadline. Simply show the Digital Ticket Code on your phone.',
    guide_step3_tag: 'Orderly & hygienic handoff',
    guide_btn_large_text: 'Enable Large Text Mode (A+)',
    guide_btn_normal_text: 'Return to Normal Text Size',
    guide_btn_read_more: 'Read Illustrated Guide',
    guide_btn_ask_ai: 'Questions? Ask FoodLoop Assist →',

    // Quick Discovery Bar
    search_heading: 'Find surplus food by area and collection window',
    search_sub: 'Choose an area in Bali - FoodLoop never assumes your exact geolocation',
    search_query_label: 'Search food or provider',
    search_query_placeholder: 'e.g., rice bowls, sourdough, produce...',
    search_area_label: 'Area (Bali demo)',
    search_area_all: 'All Bali areas',
    search_cat_label: 'Category',
    search_cat_all: 'All categories',
    search_time_label: 'Collection time',
    search_time_all: 'Collect today',
    search_time_urgent: 'Before 17:30 WITA',
    search_time_flexible: 'Flexible',
    search_btn: 'Find surplus',

    // Community Listings
    community_eyebrow: 'Community listings',
    community_heading: 'Good food, available nearby',
    community_sub: 'A preview of food shared by the FoodLoop community today.',
    community_explore_btn: 'Explore all available food →',

    // Status Badges
    status_available: 'Available',
    status_almost: 'Almost reserved',
    status_reserved: 'Fully reserved',
    status_expired: 'Expired',
    status_completed: 'Handoff completed',

    // Card Specs
    card_available_qty: 'Available quantity',
    card_collect_by: 'Collect by',
    card_collect_today: 'Collect today',
    card_allergen_inside: 'Allergen info inside',
    card_allergen_check: 'Confirm allergens',
    card_btn_view: 'View details & reserve',

    // Categories
    cat_prepared_meals: 'Prepared meals',
    cat_bakery: 'Bakery & pastry',
    cat_produce: 'Fresh produce',
    cat_grocery: 'Grocery & pantry',
    cat_other: 'Other surplus',

    // Detail & Reservation
    detail_back: '← Back to Discover',
    detail_reserve_heading: 'Availability & Pickup',
    detail_remaining_qty: 'Remaining quantity',
    detail_window: 'Collection window',
    detail_location: 'Approximate location',
    detail_qty_label: 'Quantity to reserve',
    detail_confirm_window: 'I confirm we can collect before the stated window and will inspect the food at handoff.',
    detail_btn_reserve: 'Reserve surplus food (100% Free)',
    detail_safety_title: 'Safety & Trust Notice',
    detail_safety_desc: 'FoodLoop providers ensure surplus food is prepared and maintained under safe, hygienic standards.',
    detail_success_title: "You're reserved!",
    detail_success_desc: 'Your reservation has been recorded. Please arrive before the collection deadline.',
    detail_res_id: 'Reservation ID',

    // Footer
    footer_about: 'FoodLoop connects food businesses in Bali with nearby community organizations and individuals so edible surplus food can be shared, reserved, collected, and tracked.',
    footer_quick_links: 'Quick Links',
    footer_contact: 'Support & Questions',
    footer_legal: 'Food Safety & Compliance',
    footer_rights: 'Copyright (c) 2026 FoodLoop Bali. All rights reserved.'
  }
};

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (lang !== 'id' && lang !== 'en') return;
  currentLang = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
  listeners.forEach((fn) => {
    try {
      fn(lang);
    } catch (err) {
      console.error('i18n listener error:', err);
    }
  });
}

export function toggleLanguage() {
  const nextLang = currentLang === 'id' ? 'en' : 'id';
  setLanguage(nextLang);
  return nextLang;
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key, fallback = '') {
  const dict = translations[currentLang] || translations.id;
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  const fallbackDict = translations.id;
  if (fallbackDict && fallbackDict[key] !== undefined) {
    return fallbackDict[key];
  }
  return fallback || key;
}
