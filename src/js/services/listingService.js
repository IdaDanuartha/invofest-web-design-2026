/**
 * FoodLoop Listing Service (PRD Section 8, 9, 10, 17)
 * Handles listing retrieval, filtering, sorting, publishing, and status updates.
 */

import { appState } from '../state.js';
import { getLanguage } from './i18nService.js';

export function localizeListing(item) {
  if (!item) return null;
  const isId = getLanguage() === 'id';
  if (!isId) return item;

  return {
    ...item,
    title: item.title_id || item.title,
    description: item.description_id || item.description,
    unit: item.unit_id || (item.unit === 'portions' ? 'porsi' : item.unit === 'packs' ? 'paket' : item.unit),
    ingredients: item.ingredients_id || item.ingredients,
    allergens: item.allergens_id || item.allergens,
    dietaryTags: item.dietaryTags_id || item.dietaryTags,
    storageNotes: item.storageNotes_id || item.storageNotes,
    collectionInstructions: item.collectionInstructions_id || item.collectionInstructions,
    providerType: item.providerType_id || item.providerType
  };
}

const CATEGORY_FALLBACK_IMAGES = {
  'prepared-meals': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
  'produce': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
  'grocery': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
  'other': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'
};

const AREA_COORDS = {
  'Denpasar': { x: 59, y: 63 },
  'Badung - Canggu': { x: 33, y: 57 },
  'Badung - Seminyak': { x: 40, y: 68 },
  'Badung - Kuta': { x: 44, y: 78 },
  'Sanur': { x: 74, y: 68 },
  'Ubud': { x: 64, y: 34 }
};

export const listingService = {
  getAllPublicListings() {
    const { listings } = appState.getState();
    return listings.filter((item) => item.status !== 'draft').map(localizeListing);
  },

  getById(id) {
    const { listings } = appState.getState();
    const found = listings.find((item) => item.id === id);
    return found ? localizeListing(found) : null;
  },

  getProviderListings(providerId) {
    const { listings } = appState.getState();
    const list = !providerId ? listings : listings.filter((item) => item.providerId === providerId);
    return list.map(localizeListing);
  },

  filterAndSortListings(customFilters = null) {
    const filters = customFilters || appState.getState().discoverFilters;
    const listings = this.getAllPublicListings();

    const filtered = listings.filter((item) => {
      // Text query (title, description, providerName, area, ingredients)
      if (filters.query && filters.query.trim()) {
        const q = filters.query.trim().toLowerCase();
        const haystack = [
          item.title,
          item.title_id || '',
          item.description,
          item.description_id || '',
          item.providerName,
          item.area,
          ...(item.ingredients || []),
          ...(item.ingredients_id || [])
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Area filter
      if (filters.area && filters.area !== 'all') {
        if (item.area.toLowerCase() !== filters.area.toLowerCase()) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (item.category !== filters.category) return false;
      }

      // Provider type filter
      if (filters.providerType && filters.providerType !== 'all') {
        const pType = (item.providerType || '').toLowerCase();
        const fType = filters.providerType.toLowerCase();
        if (pType !== fType && (item.providerType_id || '').toLowerCase() !== fType) {
          return false;
        }
      }

      // Available only toggle
      if (filters.availableOnly) {
        if (item.quantityAvailable <= 0 || item.status === 'reserved' || item.status === 'expired') {
          return false;
        }
      }

      // Minimum quantity filter
      if (filters.minQuantity && Number(filters.minQuantity) > 1) {
        if (item.quantityAvailable < Number(filters.minQuantity)) return false;
      }

      // Dietary tags filter (provider-supplied only)
      if (Array.isArray(filters.dietary) && filters.dietary.length > 0) {
        const itemTags = [
          ...(item.dietaryTags || []),
          ...(item.dietaryTags_id || [])
        ].map((t) => t.toLowerCase());
        const matchesAll = filters.dietary.every((tag) => {
          const tLower = tag.toLowerCase();
          if (tLower.includes('bebas produk susu') && itemTags.some(t => t.includes('dairy-free') || t.includes('bebas produk susu'))) return true;
          if (tLower.includes('ramah halal') && itemTags.some(t => t.includes('halal') || t.includes('ramah halal'))) return true;
          return itemTags.some(t => t.includes(tLower));
        });
        if (!matchesAll) return false;
      }

      // Allergen exclusions (exclude if explicitly listed in allergens)
      if (Array.isArray(filters.excludeAllergens) && filters.excludeAllergens.length > 0) {
        const allergenText = [
          ...(item.allergens || []),
          ...(item.allergens_id || [])
        ].join(' ').toLowerCase();
        const hasExcluded = filters.excludeAllergens.some((alg) => {
          const aLower = alg.toLowerCase();
          if (aLower === 'gluten' && (allergenText.includes('gluten') || allergenText.includes('gandum'))) return true;
          if (aLower === 'nuts' && (allergenText.includes('nut') || allergenText.includes('kacang'))) return true;
          if (aLower === 'soy' && (allergenText.includes('soy') || allergenText.includes('kedelai'))) return true;
          if (aLower === 'eggs' && (allergenText.includes('egg') || allergenText.includes('telur'))) return true;
          return allergenText.includes(aLower);
        });
        if (hasExcluded) return false;
      }

      // Time filter
      if (filters.timeFilter === 'urgent') {
        const end = new Date(item.pickupEnd);
        if (end.getHours() > 17) return false;
      }

      return true;
    });

    // Sort results
    return [...filtered].sort((a, b) => {
      if (filters.sortBy === 'most-available') {
        return b.quantityAvailable - a.quantityAvailable;
      }
      if (filters.sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sortBy === 'nearest') {
        const userArea = appState.getCurrentUser()?.area || 'Denpasar';
        const aMatch = a.area === userArea ? 0 : 1;
        const bMatch = b.area === userArea ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }
      // Default: 'soonest' pickup deadline, putting available items first
      const aAvail = a.quantityAvailable > 0 ? 0 : 1;
      const bAvail = b.quantityAvailable > 0 ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      return new Date(a.pickupEnd).getTime() - new Date(b.pickupEnd).getTime();
    });
  },

  createListing(formData, publishMode = 'available') {
    const user = appState.getCurrentUser();
    const { listings } = appState.getState();

    const qty = Math.max(1, Number(formData.quantityTotal) || 1);
    const area = formData.area || user?.area || 'Denpasar';
    const baseCoord = AREA_COORDS[area] || { x: 55, y: 62 };

    const newListing = {
      id: `food_${Date.now().toString().slice(-5)}`,
      title: formData.title.trim(),
      category: formData.category || 'prepared-meals',
      description: formData.description.trim(),
      quantityTotal: qty,
      quantityAvailable: qty,
      unit: formData.unit || 'portions',
      providerId: user?.role === 'provider' ? user.id : 'provider_001',
      providerName: user?.role === 'provider' ? user.name : 'Demo Kitchen',
      providerType: user?.organizationType || 'Restaurant',
      providerVerified: true,
      area,
      mapCoords: {
        x: Math.min(85, Math.max(18, baseCoord.x + Math.floor(Math.random() * 6 - 3))),
        y: Math.min(85, Math.max(22, baseCoord.y + Math.floor(Math.random() * 6 - 3)))
      },
      pickupStart: formData.pickupStart,
      pickupEnd: formData.pickupEnd,
      preparedAt: formData.preparedAt || null,
      ingredients: Array.isArray(formData.ingredients)
        ? formData.ingredients
        : String(formData.ingredients || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      allergens:
        Array.isArray(formData.allergens) && formData.allergens.length > 0
          ? formData.allergens
          : ['Please confirm with provider'],
      dietaryTags: Array.isArray(formData.dietaryTags) ? formData.dietaryTags : [],
      storageNotes: formData.storageNotes || 'Not specified - confirm storage conditions with provider.',
      collectionInstructions:
        formData.collectionInstructions || 'Contact provider upon reservation for pickup counter details.',
      recipientEligibility: formData.recipientEligibility || 'any',
      bringContainer: Boolean(formData.bringContainer),
      contactMethod: formData.contactMethod || 'In-app coordination message upon reservation',
      image: formData.image || CATEGORY_FALLBACK_IMAGES[formData.category] || CATEGORY_FALLBACK_IMAGES['prepared-meals'],
      fallbackImage: 'assets/images/listing-rice.svg',
      status: publishMode === 'draft' ? 'draft' : 'available',
      isDemo: true,
      createdAt: new Date().toISOString()
    };

    const updated = [newListing, ...listings];
    appState.saveListings(updated);

    appState.logActivity({
      entityType: 'listing',
      entityId: newListing.id,
      action: publishMode === 'draft' ? 'draft_saved' : 'published',
      summary: `${newListing.providerName} ${publishMode === 'draft' ? 'saved a draft' : 'published'}: ${newListing.title} (${newListing.quantityTotal} ${newListing.unit})`
    });

    return newListing;
  },

  updateListingStatus(listingId, newStatus) {
    const { listings } = appState.getState();
    let targetListing = null;
    const updated = listings.map((item) => {
      if (item.id !== listingId) return item;
      targetListing = { ...item, status: newStatus };
      if (newStatus === 'expired' || newStatus === 'unavailable') {
        targetListing.quantityAvailable = 0;
      } else if (newStatus === 'available' && targetListing.quantityAvailable === 0) {
        targetListing.quantityAvailable = targetListing.quantityTotal;
      }
      return targetListing;
    });

    if (targetListing) {
      appState.saveListings(updated);
      appState.logActivity({
        entityType: 'listing',
        entityId: listingId,
        action: `status_${newStatus}`,
        summary: `Listing "${targetListing.title}" status updated to ${newStatus}`
      });
    }
    return targetListing;
  },

  updateListingDetails(listingId, updates) {
    const { listings } = appState.getState();
    let updatedListing = null;
    const nextListings = listings.map((item) => {
      if (item.id !== listingId) return item;
      updatedListing = { ...item, ...updates };
      return updatedListing;
    });
    if (updatedListing) {
      appState.saveListings(nextListings);
      appState.logActivity({
        entityType: 'listing',
        entityId: listingId,
        action: 'edited',
        summary: `Listing "${updatedListing.title}" details updated (reservation history preserved)`
      });
    }
    return updatedListing;
  }
};

