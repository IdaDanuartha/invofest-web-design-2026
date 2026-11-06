/**
 * FoodLoop Central Application State (PRD Section 21)
 * Manages current user role, listings, reservations, activity log, saved items,
 * active discover filters, and AI draft handoff.
 */

import {
  SEED_USERS,
  SEED_LISTINGS,
  SEED_RESERVATIONS,
  SEED_ACTIVITY,
  SEED_PARTNERS
} from './data/seed.js';
import { storageService } from './services/storageService.js';

const listeners = new Set();

function cloneSeed(data) {
  return JSON.parse(JSON.stringify(data));
}

function getInitialDiscoverFilters() {
  return {
    query: '',
    area: 'all',
    category: 'all',
    timeFilter: 'all',
    providerType: 'all',
    dietary: [],
    excludeAllergens: [],
    minQuantity: 1,
    availableOnly: false,
    sortBy: 'soonest',
    viewMode: 'list'
  };
}

function loadInitialState() {
  const users = storageService.get('users') || cloneSeed(SEED_USERS);
  const rawListings = storageService.get('listings') || cloneSeed(SEED_LISTINGS);
  const listings = rawListings.map((item) => {
    const seedMatch = SEED_LISTINGS.find((s) => s.id === item.id);
    if (seedMatch) {
      return {
        ...seedMatch,
        ...item,
        title_id: seedMatch.title_id,
        title_en: seedMatch.title_en || seedMatch.title,
        description_id: seedMatch.description_id,
        description_en: seedMatch.description_en || seedMatch.description,
        unit_id: seedMatch.unit_id,
        unit_en: seedMatch.unit_en || seedMatch.unit,
        ingredients_id: seedMatch.ingredients_id,
        ingredients_en: seedMatch.ingredients_en || seedMatch.ingredients,
        allergens_id: seedMatch.allergens_id,
        allergens_en: seedMatch.allergens_en || seedMatch.allergens,
        dietaryTags_id: seedMatch.dietaryTags_id,
        dietaryTags_en: seedMatch.dietaryTags_en || seedMatch.dietaryTags,
        storageNotes_id: seedMatch.storageNotes_id,
        storageNotes_en: seedMatch.storageNotes_en || seedMatch.storageNotes,
        collectionInstructions_id: seedMatch.collectionInstructions_id,
        collectionInstructions_en: seedMatch.collectionInstructions_en || seedMatch.collectionInstructions,
        providerType_id: seedMatch.providerType_id,
        providerType_en: seedMatch.providerType_en || seedMatch.providerType
      };
    }
    return item;
  });

  const rawReservations = storageService.get('reservations');
  let reservations = (rawReservations || cloneSeed(SEED_RESERVATIONS)).map((r) => {
    const seedRes = SEED_RESERVATIONS.find((sr) => sr.id === r.id);
    if (seedRes) {
      return {
        ...seedRes,
        ...r,
        listingTitle_id: seedRes.listingTitle_id,
        listingTitle_en: seedRes.listingTitle_en || seedRes.listingTitle,
        unit_id: seedRes.unit_id,
        unit_en: seedRes.unit_en || seedRes.unit,
        collectionInstructions_id: seedRes.collectionInstructions_id,
        collectionInstructions_en: seedRes.collectionInstructions_en || seedRes.collectionInstructions
      };
    }
    return r;
  });

  if (!reservations.some((r) => r.id === 'res_007')) {
    const seedRes007 = SEED_RESERVATIONS.find((r) => r.id === 'res_007');
    if (seedRes007) reservations.push(JSON.parse(JSON.stringify(seedRes007)));
  }
  const activity = storageService.get('activity') || cloneSeed(SEED_ACTIVITY);
  const partners = storageService.get('partners') || cloneSeed(SEED_PARTNERS);
  const savedListingIds = storageService.get('savedListingIds') || ['food_001', 'food_002'];
  const currentUserId = storageService.get('currentUserId') || 'recipient_001';
  const messages = storageService.get('messages') || [];
  const reports = storageService.get('reports') || [];

  storageService.set('users', users);
  storageService.set('listings', listings);
  storageService.set('reservations', reservations);
  storageService.set('activity', activity);
  storageService.set('partners', partners);
  storageService.set('savedListingIds', savedListingIds);
  storageService.set('currentUserId', currentUserId);

  return {
    users,
    listings,
    reservations,
    activity,
    partners,
    savedListingIds,
    currentUserId,
    messages,
    reports,
    discoverFilters: getInitialDiscoverFilters(),
    pendingAiDraft: null
  };
}

let state = loadInitialState();

export const appState = {
  getState() {
    return state;
  },

  getCurrentUser() {
    return state.users.find((u) => u.id === state.currentUserId) || null;
  },

  setCurrentUser(userId) {
    state.currentUserId = userId;
    storageService.set('currentUserId', userId);
    this.notify();
  },

  registerUser(newUser) {
    const userRecord = {
      id: `user_${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role || 'recipient',
      organizationType: newUser.organizationType || 'Community organization',
      area: newUser.area || 'Denpasar',
      preferredCategories: ['prepared-meals', 'bakery', 'produce'],
      capacityPortions: 15,
      verified: false,
      isDemo: true
    };
    state.users = [userRecord, ...state.users];
    state.currentUserId = userRecord.id;
    storageService.set('users', state.users);
    storageService.set('currentUserId', state.currentUserId);
    this.notify();
    return userRecord;
  },

  updateCurrentUserProfile(updates) {
    state.users = state.users.map((u) => {
      if (u.id !== state.currentUserId) return u;
      return { ...u, ...updates };
    });
    storageService.set('users', state.users);
    this.notify();
  },

  setDiscoverFilters(partialFilters) {
    state.discoverFilters = {
      ...state.discoverFilters,
      ...partialFilters
    };
    this.notify();
  },

  resetDiscoverFilters() {
    state.discoverFilters = {
      ...getInitialDiscoverFilters(),
      viewMode: state.discoverFilters.viewMode
    };
    this.notify();
  },

  toggleSavedListing(listingId) {
    const exists = state.savedListingIds.includes(listingId);
    if (exists) {
      state.savedListingIds = state.savedListingIds.filter((id) => id !== listingId);
    } else {
      state.savedListingIds = [...state.savedListingIds, listingId];
    }
    storageService.set('savedListingIds', state.savedListingIds);
    this.notify();
    return !exists;
  },

  setPendingAiDraft(draft) {
    state.pendingAiDraft = draft;
  },

  consumePendingAiDraft() {
    const draft = state.pendingAiDraft;
    state.pendingAiDraft = null;
    return draft;
  },

  saveListings(listings) {
    state.listings = listings;
    storageService.set('listings', listings);
    this.notify();
  },

  saveReservations(reservations) {
    state.reservations = reservations;
    storageService.set('reservations', reservations);
    this.notify();
  },

  logActivity({ entityType, entityId, action, summary, actorId, actorName }) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entityType,
      entityId,
      action,
      summary,
      actorId: actorId || state.currentUserId || 'demo_user',
      actorName: actorName || (this.getCurrentUser()?.name ?? 'Demo User'),
      createdAt: new Date().toISOString()
    };
    state.activity = [event, ...state.activity];
    storageService.set('activity', state.activity);
    return event;
  },

  addPartnerApplication(partnerData) {
    const record = {
      id: `partner_${Date.now()}`,
      name: partnerData.name,
      type: partnerData.type,
      subType: partnerData.subType || partnerData.type,
      area: partnerData.area,
      categories: partnerData.categories || ['Prepared meals'],
      description: partnerData.description,
      schedule: partnerData.schedule || 'Flexible collection schedule',
      isDemo: true
    };
    state.partners = [record, ...state.partners];
    storageService.set('partners', state.partners);
    this.logActivity({
      entityType: 'partner',
      entityId: record.id,
      action: 'partner_applied',
      summary: `${record.name} submitted a partner application in ${record.area}`
    });
    this.notify();
    return record;
  },

  addMessage(msg) {
    const record = {
      id: `msg_${Date.now()}`,
      ...msg,
      createdAt: new Date().toISOString()
    };
    state.messages = [record, ...state.messages];
    storageService.set('messages', state.messages);
    this.notify();
    return record;
  },

  addReport(report) {
    const record = {
      id: `rep_${Date.now()}`,
      ...report,
      createdAt: new Date().toISOString()
    };
    state.reports = [record, ...state.reports];
    storageService.set('reports', state.reports);
    this.logActivity({
      entityType: 'listing',
      entityId: report.listingId,
      action: 'reported',
      summary: `Listing ${report.listingTitle} flagged for review: ${report.reason}`
    });
    this.notify();
    return record;
  },

  resetToSeedData() {
    storageService.clearAll();
    state = loadInitialState();
    this.notify();
  },

  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  notify() {
    listeners.forEach((cb) => cb(state));
  }
};

