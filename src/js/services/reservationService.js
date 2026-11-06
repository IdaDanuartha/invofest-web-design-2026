/**
 * FoodLoop Reservation & Handoff Service (PRD Section 9, 13, 18, 19)
 * State Machine: AVAILABLE -> RESERVED -> COLLECTED -> COMPLETED
 * Terminal exceptions: CANCELLED, EXPIRED, REPORTED
 */

import { appState } from '../state.js';
import { getLanguage } from './i18nService.js';

export function localizeReservation(res) {
  if (!res) return null;
  const isId = getLanguage() === 'id';

  if (isId) {
    return {
      ...res,
      listingTitle: res.listingTitle_id || res.listingTitle,
      unit: res.unit_id || (res.unit === 'portions' ? 'porsi' : res.unit === 'packs' ? 'paket' : res.unit),
      collectionInstructions: res.collectionInstructions_id || res.collectionInstructions
    };
  }

  return {
    ...res,
    listingTitle: res.listingTitle_en || res.listingTitle,
    unit: res.unit_en || (res.unit === 'porsi' ? 'portions' : res.unit === 'paket' ? 'packs' : res.unit),
    collectionInstructions: res.collectionInstructions_en || res.collectionInstructions
  };
}

export const reservationService = {
  getAllReservations() {
    return appState.getState().reservations.map(localizeReservation);
  },

  getRecipientReservations(recipientId) {
    const { reservations } = appState.getState();
    const list = !recipientId ? reservations : reservations.filter((r) => r.recipientId === recipientId);
    return list.map(localizeReservation);
  },

  getProviderReservations(providerId) {
    const { reservations } = appState.getState();
    const list = !providerId ? reservations : reservations.filter((r) => r.providerId === providerId);
    return list.map(localizeReservation);
  },

  getReservationsForListing(listingId) {
    const { reservations } = appState.getState();
    return reservations.filter((r) => r.listingId === listingId).map(localizeReservation);
  },

  createReservation({ listingId, quantity }) {
    const { listings, reservations } = appState.getState();
    const user = appState.getCurrentUser();

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) {
      throw new Error('Listing not found.');
    }

    if (listing.status === 'expired' || listing.status === 'unavailable' || listing.quantityAvailable <= 0) {
      throw new Error('This surplus listing is no longer available for reservation.');
    }

    const reqQty = Number(quantity);
    if (!Number.isFinite(reqQty) || reqQty < 1) {
      throw new Error('Please choose a valid quantity of at least 1.');
    }

    if (reqQty > listing.quantityAvailable) {
      throw new Error(`Cannot reserve ${reqQty} ${listing.unit}. Only ${listing.quantityAvailable} ${listing.unit} remaining.`);
    }

    const recipientId = user && (user.role === 'recipient' || user.role === 'individual')
      ? user.id
      : 'recipient_001';
    const recipientName = user && (user.role === 'recipient' || user.role === 'individual')
      ? user.name
      : 'Community Table (Demo)';

    const newReservation = {
      id: `res_${Date.now().toString().slice(-5)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      category: listing.category,
      providerId: listing.providerId,
      providerName: listing.providerName,
      recipientId,
      recipientName,
      area: listing.area,
      quantity: reqQty,
      unit: listing.unit,
      status: 'reserved',
      pickupWindow: {
        start: listing.pickupStart,
        end: listing.pickupEnd
      },
      collectionInstructions: listing.collectionInstructions,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isDemo: true
    };

    const nextAvailable = Math.max(0, listing.quantityAvailable - reqQty);
    let nextListingStatus = 'available';
    if (nextAvailable === 0) {
      nextListingStatus = 'reserved';
    } else if (nextAvailable <= Math.ceil(listing.quantityTotal * 0.35)) {
      nextListingStatus = 'almost-reserved';
    }

    const updatedListings = listings.map((l) => {
      if (l.id !== listing.id) return l;
      return {
        ...l,
        quantityAvailable: nextAvailable,
        status: nextListingStatus
      };
    });

    const updatedReservations = [newReservation, ...reservations];
    appState.saveListings(updatedListings);
    appState.saveReservations(updatedReservations);

    appState.logActivity({
      entityType: 'reservation',
      entityId: newReservation.id,
      action: 'reserved',
      summary: `${recipientName} reserved ${reqQty} ${listing.unit} of "${listing.title}" from ${listing.providerName}`,
      actorId: recipientId,
      actorName: recipientName
    });

    return newReservation;
  },

  /**
   * Transition reservation status:
   * - 'collected' (Recipient confirms pickup at collection window)
   * - 'completed' (Provider or recipient confirms completed handoff -> counts in Impact!)
   * - 'cancelled' (Restores quantity back to the listing if still active)
   */
  transitionReservationStatus(reservationId, nextStatus) {
    const { listings, reservations } = appState.getState();
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) {
      throw new Error('Reservation record not found.');
    }

    const nowIso = new Date().toISOString();
    const updatedReservations = reservations.map((r) => {
      if (r.id !== reservationId) return r;
      return {
        ...r,
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? nowIso : r.completedAt
      };
    });

    // If cancelled, return the quantity back to the listing
    if (nextStatus === 'cancelled' && target.status !== 'cancelled') {
      const updatedListings = listings.map((l) => {
        if (l.id !== target.listingId) return l;
        const restored = Math.min(l.quantityTotal, l.quantityAvailable + target.quantity);
        let status = l.status;
        if (restored > 0 && status === 'reserved') {
          status = restored <= Math.ceil(l.quantityTotal * 0.35) ? 'almost-reserved' : 'available';
        }
        return {
          ...l,
          quantityAvailable: restored,
          status
        };
      });
      appState.saveListings(updatedListings);
    }

    // If completed and all quantity of the listing was reserved, mark listing completed
    if (nextStatus === 'completed') {
      const updatedListings = listings.map((l) => {
        if (l.id !== target.listingId) return l;
        if (l.quantityAvailable === 0) {
          return { ...l, status: 'completed' };
        }
        return l;
      });
      appState.saveListings(updatedListings);
    }

    appState.saveReservations(updatedReservations);

    const actionLabels = {
      collected: `Collection confirmed for ${target.quantity} ${target.unit} of "${target.listingTitle}"`,
      completed: `Completed handoff verified: ${target.quantity} ${target.unit} of "${target.listingTitle}" (${target.providerName} → ${target.recipientName})`,
      cancelled: `Reservation ${target.id} cancelled (${target.quantity} ${target.unit} restored to listing)`
    };

    appState.logActivity({
      entityType: 'reservation',
      entityId: reservationId,
      action: nextStatus,
      summary: actionLabels[nextStatus] || `Reservation ${reservationId} status changed to ${nextStatus}`
    });

    return updatedReservations.find((r) => r.id === reservationId);
  },

  /**
   * Computes transparent impact metrics strictly from COMPLETED handoffs (PRD Section 13)
   * Never adds different units (e.g. portions vs kg) blindly together; reports portions
   * as primary meal-equivalent unit and shows unit breakdown transparently.
   */
  computeImpactMetrics() {
    const { reservations, listings } = appState.getState();
    const completed = reservations.filter((r) => r.status === 'completed');

    let portionsRedistributed = 0;
    let packsRedistributed = 0;
    let kgRedistributed = 0;

    const providerSet = new Set();
    const recipientSet = new Set();
    const categoryBreakdown = {
      'prepared-meals': { count: 0, portions: 0, label: 'Prepared meals' },
      'bakery': { count: 0, portions: 0, label: 'Bakery & pastry' },
      'produce': { count: 0, portions: 0, label: 'Fresh produce' },
      'grocery': { count: 0, portions: 0, label: 'Grocery & pantry' },
      'other': { count: 0, portions: 0, label: 'Other surplus' }
    };

    completed.forEach((r) => {
      providerSet.add(r.providerId);
      recipientSet.add(r.recipientId);

      if (r.unit === 'portions') {
        portionsRedistributed += r.quantity;
      } else if (r.unit === 'packs' || r.unit === 'boxes' || r.unit === 'items') {
        packsRedistributed += r.quantity;
      } else if (r.unit === 'kg') {
        kgRedistributed += r.quantity;
      }

      const catKey = categoryBreakdown[r.category] ? r.category : 'other';
      categoryBreakdown[catKey].count += 1;
      categoryBreakdown[catKey].portions += r.quantity;
    });

    // Also include active providers who have published listings
    listings.forEach((l) => {
      if (l.status !== 'draft') providerSet.add(l.providerId);
    });

    return {
      completedHandoffsCount: completed.length,
      portionsRedistributed,
      packsRedistributed,
      kgRedistributed,
      activeProvidersCount: providerSet.size,
      recipientOrgsServedCount: recipientSet.size,
      categoryBreakdown,
      completedRecords: completed
    };
  }
};

