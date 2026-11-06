/**
 * FoodLoop Date, Time, and Number Formatting Utilities (PRD Section 23)
 * Uses Intl.DateTimeFormat and Intl.NumberFormat for localized display.
 */

import { getLanguage } from '../js/services/i18nService.js';

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const dateShortFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
  day: 'numeric'
});

const dateFullFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const numberFormatter = new Intl.NumberFormat('id-ID');

export function formatNumber(num) {
  if (typeof num !== 'number' || Number.isNaN(num)) return '0';
  return numberFormatter.format(num);
}

export function formatTimeOnly(isoString) {
  if (!isoString) return 'Belum ditentukan';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Belum ditentukan';
  return `${timeFormatter.format(date)} WITA`;
}

export function formatPickupWindow(startIso, endIso) {
  const lang = getLanguage();
  if (!startIso && !endIso) return lang === 'id' ? 'Waktu pengambilan fleksibel' : 'Flexible collection window';
  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;

  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    const dayLabel = dateShortFormatter.format(start);
    return `${dayLabel}, ${timeFormatter.format(start)}–${timeFormatter.format(end)} WITA`;
  }
  if (end && !Number.isNaN(end.getTime())) {
    return lang === 'id'
      ? `Ambil sebelum ${dateShortFormatter.format(end)}, ${timeFormatter.format(end)} WITA`
      : `Collect by ${dateShortFormatter.format(end)}, ${timeFormatter.format(end)} WITA`;
  }
  return lang === 'id' ? 'Cek detail makanan' : 'Check listing details';
}

export const formatTimeWindow = formatPickupWindow;

export function formatDeadlineBadge(endIso) {
  const lang = getLanguage();
  if (!endIso) return lang === 'id' ? 'Ambil hari ini' : 'Collect today';
  const end = new Date(endIso);
  if (Number.isNaN(end.getTime())) return lang === 'id' ? 'Ambil hari ini' : 'Collect today';
  return lang === 'id'
    ? `Ambil maks ${timeFormatter.format(end)} WITA`
    : `Collect by ${timeFormatter.format(end)} WITA`;
}

export function formatDateTime(isoString) {
  const lang = getLanguage();
  if (!isoString) return lang === 'id' ? 'Belum ditentukan' : 'Not specified';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return lang === 'id' ? 'Belum ditentukan' : 'Not specified';
  return `${dateFullFormatter.format(date)} WITA`;
}

export function getCategoryLabel(categorySlug) {
  const lang = getLanguage();
  if (lang === 'id') {
    const idMap = {
      'prepared-meals': 'Makanan Siap Santap',
      'bakery': 'Roti & Kue',
      'produce': 'Sayur & Buah Segar',
      'grocery': 'Bahan Pokok & Sembako',
      'other': 'Surplus Lainnya'
    };
    return idMap[categorySlug] || categorySlug || 'Makanan Surplus';
  }
  const map = {
    'prepared-meals': 'Prepared meals',
    'bakery': 'Bakery & pastry',
    'produce': 'Fresh produce',
    'grocery': 'Grocery & pantry',
    'other': 'Other surplus'
  };
  return map[categorySlug] || categorySlug || 'Surplus food';
}

