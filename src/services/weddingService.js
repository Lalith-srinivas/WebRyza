import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { calculateCommission } from '../utils/weddingCommission';

export const PARTNERS_COLLECTION = 'wedding_partners';
export const CARDS_COLLECTION = 'wedding_cards';
export const PAYMENTS_COLLECTION = 'wedding_payments';
export const USERNAMES_COLLECTION = 'partner_usernames';

const BASE_REGISTRATION_URL = 'https://cards.webryza.in/?ref=';

/**
 * Generates the next sequential Partner ID (e.g., SHOP001, SHOP002)
 */
export async function generateNextPartnerCode() {
  const querySnapshot = await getDocs(collection(db, PARTNERS_COLLECTION));
  let maxId = 0;

  querySnapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const code = data.partnerCode || docSnapshot.id;
    const match = code.match(/SHOP(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxId) {
        maxId = num;
      }
    }
  });

  const nextId = maxId + 1;
  return `SHOP${String(nextId).padStart(3, '0')}`;
}

/**
 * Creates a new partner shop securely.
 * Uses trusted Cloud Function createPartnerAccount to create the Firebase Auth login,
 * connect the UID, assign role: 'partner', and generate registration URL & QR.
 */
export async function createPartner({
  shopName,
  ownerName,
  phone,
  email = '',
  address = '',
  partnerCode,
  username,
  password
}) {
  const finalCode = (partnerCode && partnerCode.trim()) ? partnerCode.trim().toUpperCase() : await generateNextPartnerCode();
  const cleanUsername = String(username || '').toLowerCase().trim();
  const registrationUrl = `${BASE_REGISTRATION_URL}${finalCode}`;

  if (!cleanUsername) {
    throw new Error('Username is required.');
  }
  if (!password || String(password).length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  // Attempt secure account creation via Cloud Function
  try {
    const createPartnerFn = httpsCallable(functions, 'createPartnerAccount');
    const result = await createPartnerFn({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      partnerCode: finalCode,
      username: cleanUsername,
      password: String(password)
    });

    return {
      id: finalCode,
      partnerCode: finalCode,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      username: cleanUsername,
      authUid: result.data?.authUid || '',
      role: 'partner',
      isActive: true,
      registrationUrl
    };
  } catch (cloudErr) {
    console.warn('Cloud Function createPartnerAccount unavailable or failed. Using direct Firestore transaction:', cloudErr);
    
    // Check if username is taken in partner_usernames
    const usernameSnap = await getDoc(doc(db, USERNAMES_COLLECTION, cleanUsername));
    if (usernameSnap.exists()) {
      throw new Error(`The username "${cleanUsername}" is already taken. Please choose another username.`);
    }

    // Direct Firestore creation
    const partnerData = {
      partnerCode: finalCode,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      username: cleanUsername,
      authUid: '',
      role: 'partner',
      isActive: true,
      registrationUrl,
      totalProjects: 0,
      totalAmountCharged: 0,
      totalAmountDue: 0,
      totalAmountPaid: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const batch = writeBatch(db);
    batch.set(doc(db, PARTNERS_COLLECTION, finalCode), partnerData);
    batch.set(doc(db, USERNAMES_COLLECTION, cleanUsername), {
      username: cleanUsername,
      partnerCode: finalCode,
      partnerId: finalCode,
      authUid: '',
      internalEmail: `${cleanUsername}@partner.webryza.in`,
      createdAt: serverTimestamp()
    });

    await batch.commit();

    return { id: finalCode, ...partnerData };
  }
}

/**
 * Changes a partner's username using Cloud Function changePartnerUsername
 */
export async function changePartnerUsername(partnerId, newUsername) {
  const cleanNew = String(newUsername).toLowerCase().trim();
  if (!cleanNew || cleanNew.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }

  try {
    const changeUsernameFn = httpsCallable(functions, 'changePartnerUsername');
    await changeUsernameFn({
      partnerId,
      newUsername: cleanNew
    });
  } catch (cloudErr) {
    console.warn('Cloud Function changePartnerUsername unavailable, updating Firestore mapping directly:', cloudErr);
    
    const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
    const partnerSnap = await getDoc(partnerRef);
    if (!partnerSnap.exists()) throw new Error('Partner not found.');

    const oldUsername = (partnerSnap.data().username || '').toLowerCase().trim();

    // Check if new username exists
    const newUsernameSnap = await getDoc(doc(db, USERNAMES_COLLECTION, cleanNew));
    if (newUsernameSnap.exists()) {
      throw new Error(`Username "${cleanNew}" is already taken.`);
    }

    const batch = writeBatch(db);
    if (oldUsername) {
      batch.delete(doc(db, USERNAMES_COLLECTION, oldUsername));
    }
    batch.set(doc(db, USERNAMES_COLLECTION, cleanNew), {
      username: cleanNew,
      partnerCode: partnerSnap.data().partnerCode || partnerId,
      partnerId: partnerId,
      internalEmail: `${cleanNew}@partner.webryza.in`,
      updatedAt: serverTimestamp()
    });
    batch.update(partnerRef, {
      username: cleanNew,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  }
}

/**
 * Resets a partner's password using Cloud Function resetPartnerPassword
 */
export async function resetPartnerPassword(partnerId, newPassword) {
  if (!newPassword || String(newPassword).length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  try {
    const resetPasswordFn = httpsCallable(functions, 'resetPartnerPassword');
    await resetPasswordFn({
      partnerId,
      newPassword: String(newPassword)
    });
  } catch (cloudErr) {
    console.error('Failed to reset password via Cloud Function:', cloudErr);
    throw new Error(cloudErr.message || 'Failed to reset password. Please ensure Cloud Functions are deployed.');
  }
}

/**
 * Updates an existing partner shop details (shop name, owner, phone, etc.)
 */
export async function updatePartner(partnerId, updateFields) {
  const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
  const dataToUpdate = {
    ...updateFields,
    updatedAt: serverTimestamp()
  };

  await updateDoc(partnerRef, dataToUpdate);
  if (updateFields.shopName) {
    await syncShopNameToCards(partnerId, updateFields.shopName);
  }
}

/**
 * Toggles partner active state (activation / deactivation).
 * Uses Cloud Function togglePartnerStatus to enable/disable Firebase Auth login,
 * and updates Firestore.
 */
export async function togglePartnerStatus(partnerId, isActive) {
  const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
  
  // Try Cloud Function to update Firebase Auth user state
  try {
    const toggleStatusFn = httpsCallable(functions, 'togglePartnerStatus');
    await toggleStatusFn({ partnerId, isActive });
  } catch (err) {
    console.warn('Cloud Function togglePartnerStatus unavailable, updating Firestore directly:', err);
    await updateDoc(partnerRef, {
      isActive,
      updatedAt: serverTimestamp()
    });
  }
}

/**
 * Permanently deletes a partner shop.
 * Preserves all linked wedding cards and payment histories by converting their source to direct.
 */
export async function deletePartner(partnerId) {
  const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
  const partnerSnap = await getDoc(partnerRef);
  const shopName = partnerSnap.exists() ? (partnerSnap.data().shopName || 'Deleted Partner') : 'Deleted Partner';

  // Unlink associated cards to preserve project and payment data
  const cardsQuery = query(collection(db, CARDS_COLLECTION), where('partnerId', '==', partnerId));
  const cardsSnap = await getDocs(cardsQuery);
  if (!cardsSnap.empty) {
    const batch = writeBatch(db);
    cardsSnap.forEach(cardDoc => {
      batch.update(cardDoc.ref, {
        partnerId: '',
        partnerShopName: `${shopName} (Former Partner)`,
        source: 'direct',
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }

  // Delete partner document
  await deleteDoc(partnerRef);
}

/**
 * Fetches all partners
 */
export async function fetchAllPartners() {
  const q = query(collection(db, PARTNERS_COLLECTION));
  const snapshot = await getDocs(q);
  const partners = [];
  snapshot.forEach(docSnap => {
    partners.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Sort by partner code descending or creation
  partners.sort((a, b) => (b.partnerCode || '').localeCompare(a.partnerCode || ''));
  return partners;
}

/**
 * Recalculates partner summary metrics from all associated wedding cards
 */
export async function syncPartnerMetrics(partnerId) {
  if (!partnerId) return;
  try {
    const q = query(collection(db, CARDS_COLLECTION), where('partnerId', '==', partnerId));
    const snapshot = await getDocs(q);

    let totalProjects = 0;
    let totalAmountCharged = 0;
    let totalAmountDue = 0;
    let totalAmountPaid = 0;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      totalProjects += 1;
      totalAmountCharged += Number(data.amountCharged) || 0;
      totalAmountDue += Number(data.amountDueToWebryza) || 0;
      totalAmountPaid += Number(data.amountReceivedByWebryza) || 0;
    });

    const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
    await updateDoc(partnerRef, {
      totalProjects,
      totalAmountCharged,
      totalAmountDue,
      totalAmountPaid,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error(`Failed to sync metrics for partner ${partnerId}:`, err);
  }
}

/**
 * Syncs updated shop name to associated wedding cards
 */
async function syncShopNameToCards(partnerId, newShopName) {
  try {
    const q = query(collection(db, CARDS_COLLECTION), where('partnerId', '==', partnerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { partnerShopName: newShopName });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error syncing shop name to cards:', err);
  }
}

/**
 * Fetches all wedding cards with optional filtering
 */
export async function fetchAllWeddingCards() {
  const q = query(collection(db, CARDS_COLLECTION));
  const snapshot = await getDocs(q);
  const cards = [];
  snapshot.forEach(docSnap => {
    cards.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Sort by creation date descending
  cards.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
    return timeB - timeA;
  });

  return cards;
}

/**
 * Fetches a single wedding card by ID
 */
export async function fetchWeddingCardById(cardId) {
  const docRef = doc(db, CARDS_COLLECTION, cardId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Creates a new wedding project card with automatic commission calculation
 */
export async function createWeddingCard(cardData) {
  const amountCharged = Number(cardData.amountCharged) || 0;
  const commission = calculateCommission(amountCharged, 0);

  if (!commission.isValid) {
    throw new Error(commission.error);
  }

  const newCard = {
    brideName: cardData.brideName?.trim() || '',
    groomName: cardData.groomName?.trim() || '',
    brideParents: cardData.brideParents?.trim() || '',
    groomParents: cardData.groomParents?.trim() || '',
    phone: cardData.phone?.trim() || '',
    email: cardData.email?.trim() || '',
    weddingDate: cardData.weddingDate ? Timestamp.fromDate(new Date(cardData.weddingDate)) : null,
    weddingTime: cardData.weddingTime?.trim() || '',
    venueName: cardData.venueName?.trim() || '',
    venueAddress: cardData.venueAddress?.trim() || '',
    venueLocation: cardData.venueLocation?.trim() || '',
    additionalDetails: cardData.additionalDetails?.trim() || '',
    events: Array.isArray(cardData.events) ? cardData.events : [],
    partnerId: cardData.partnerId?.trim() || '',
    partnerShopName: cardData.partnerShopName?.trim() || '',
    source: cardData.partnerId ? 'partner' : 'direct',
    amountCharged: commission.amountCharged,
    webryzaShare: commission.webryzaShare,
    partnerCommission: commission.partnerCommission,
    amountReceivedByWebryza: 0,
    amountDueToWebryza: commission.amountDueToWebryza,
    status: cardData.status || 'confirmed',
    paymentStatus: 'pending',
    websiteUrl: cardData.websiteUrl?.trim() || '',
    adminNotes: cardData.adminNotes?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null
  };

  const docRef = await addDoc(collection(db, CARDS_COLLECTION), newCard);
  
  if (newCard.partnerId) {
    await syncPartnerMetrics(newCard.partnerId);
  }

  return { id: docRef.id, ...newCard };
}

/**
 * Updates a wedding card's details and recalculates commission if amount was changed
 */
export async function updateWeddingCard(cardId, updateData) {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  const currentSnap = await getDoc(cardRef);
  if (!currentSnap.exists()) throw new Error("Wedding project not found");

  const currentData = currentSnap.data();
  const oldPartnerId = currentData.partnerId;

  const dataToSave = { ...updateData, updatedAt: serverTimestamp() };

  // If amount charged was updated, recalculate commission and remaining balance
  if (updateData.amountCharged !== undefined) {
    const newAmount = Number(updateData.amountCharged);
    const received = Number(currentData.amountReceivedByWebryza) || 0;
    const commission = calculateCommission(newAmount, received);

    if (!commission.isValid) {
      throw new Error(commission.error);
    }

    dataToSave.amountCharged = commission.amountCharged;
    dataToSave.webryzaShare = commission.webryzaShare;
    dataToSave.partnerCommission = commission.partnerCommission;
    dataToSave.amountDueToWebryza = commission.amountDueToWebryza;
    dataToSave.paymentStatus = commission.paymentStatus;
  }

  // Handle status update to 'completed'
  if (updateData.status === 'completed' && !currentData.completedAt && !updateData.completedAt) {
    dataToSave.completedAt = serverTimestamp();
  }

  // Handle weddingDate timestamp conversion if passed as string
  if (typeof updateData.weddingDate === 'string' && updateData.weddingDate) {
    dataToSave.weddingDate = Timestamp.fromDate(new Date(updateData.weddingDate));
  }

  await updateDoc(cardRef, dataToSave);

  // Sync partner metrics if partner is involved or was changed
  const newPartnerId = updateData.partnerId !== undefined ? updateData.partnerId : oldPartnerId;
  if (newPartnerId) {
    await syncPartnerMetrics(newPartnerId);
  }
  if (oldPartnerId && oldPartnerId !== newPartnerId) {
    await syncPartnerMetrics(oldPartnerId);
  }
}

/**
 * Permanently deletes a wedding card and cleans up associated payments
 */
export async function deleteWeddingCard(cardId) {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  const currentSnap = await getDoc(cardRef);
  if (!currentSnap.exists()) return;
  const partnerId = currentSnap.data().partnerId;

  // Delete all payments linked to this card
  const paymentsQuery = query(collection(db, PAYMENTS_COLLECTION), where('weddingCardId', '==', cardId));
  const paymentsSnap = await getDocs(paymentsQuery);
  const batch = writeBatch(db);
  paymentsSnap.forEach(pDoc => {
    batch.delete(pDoc.ref);
  });
  batch.delete(cardRef);
  await batch.commit();

  if (partnerId) {
    await syncPartnerMetrics(partnerId);
  }
}

/**
 * Fetches all payments recorded for a specific wedding card
 */
export async function fetchPaymentsForCard(cardId) {
  const q = query(
    collection(db, PAYMENTS_COLLECTION), 
    where('weddingCardId', '==', cardId)
  );
  const snapshot = await getDocs(q);
  const payments = [];
  snapshot.forEach(docSnap => {
    payments.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Sort newest first
  payments.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
    return timeB - timeA;
  });

  return payments;
}

/**
 * Records a new payment received for a wedding project
 */
export async function recordWeddingPayment({
  weddingCardId,
  partnerId = '',
  partnerShopName = '',
  amount,
  paymentMethod = 'UPI',
  paymentReference = '',
  paymentDate,
  notes = ''
}) {
  const paymentAmount = Number(amount);
  if (!paymentAmount || paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  // 1. Fetch current wedding card
  const cardRef = doc(db, CARDS_COLLECTION, weddingCardId);
  const cardSnap = await getDoc(cardRef);
  if (!cardSnap.exists()) throw new Error("Wedding project not found");

  const cardData = cardSnap.data();
  const webryzaShare = Number(cardData.webryzaShare) || 0;

  // 2. Fetch existing payments to prevent duplicate totals
  const existingPayments = await fetchPaymentsForCard(weddingCardId);
  const previousTotalReceived = existingPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const newTotalReceived = previousTotalReceived + paymentAmount;
  const newPendingAmount = Math.max(0, webryzaShare - newTotalReceived);

  let newPaymentStatus = 'pending';
  if (newTotalReceived >= webryzaShare) {
    newPaymentStatus = 'paid';
  } else if (newTotalReceived > 0) {
    newPaymentStatus = 'partial';
  }

  // 3. Create payment document
  const paymentDocData = {
    weddingCardId,
    partnerId: partnerId || cardData.partnerId || '',
    partnerShopName: partnerShopName || cardData.partnerShopName || '',
    amount: paymentAmount,
    paymentMethod,
    paymentReference: paymentReference.trim(),
    paymentDate: paymentDate ? Timestamp.fromDate(new Date(paymentDate)) : serverTimestamp(),
    notes: notes.trim(),
    createdAt: serverTimestamp()
  };

  const paymentDocRef = await addDoc(collection(db, PAYMENTS_COLLECTION), paymentDocData);

  // 4. Update wedding card financial status
  await updateDoc(cardRef, {
    amountReceivedByWebryza: newTotalReceived,
    amountDueToWebryza: newPendingAmount,
    paymentStatus: newPaymentStatus,
    updatedAt: serverTimestamp()
  });

  // 5. Update partner totals if applicable
  const targetPartnerId = partnerId || cardData.partnerId;
  if (targetPartnerId) {
    await syncPartnerMetrics(targetPartnerId);
  }

  return { id: paymentDocRef.id, ...paymentDocData };
}

/**
 * Deletes a recorded payment and recalculates wedding card and partner balances
 */
export async function deleteWeddingPayment(paymentId, weddingCardId) {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  await deleteDoc(paymentRef);

  // Re-fetch remaining payments
  const remainingPayments = await fetchPaymentsForCard(weddingCardId);
  const cardRef = doc(db, CARDS_COLLECTION, weddingCardId);
  const cardSnap = await getDoc(cardRef);
  if (!cardSnap.exists()) return;

  const cardData = cardSnap.data();
  const webryzaShare = Number(cardData.webryzaShare) || 0;
  const newTotalReceived = remainingPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const newPendingAmount = Math.max(0, webryzaShare - newTotalReceived);

  let newPaymentStatus = 'pending';
  if (newTotalReceived >= webryzaShare) {
    newPaymentStatus = 'paid';
  } else if (newTotalReceived > 0) {
    newPaymentStatus = 'partial';
  }

  await updateDoc(cardRef, {
    amountReceivedByWebryza: newTotalReceived,
    amountDueToWebryza: newPendingAmount,
    paymentStatus: newPaymentStatus,
    updatedAt: serverTimestamp()
  });

  if (cardData.partnerId) {
    await syncPartnerMetrics(cardData.partnerId);
  }
}

/**
 * Real-time listener: Subscribes to all partners in wedding_partners
 */
export function subscribeToPartners(callback, onError) {
  const q = query(collection(db, PARTNERS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const partners = [];
    snapshot.forEach(docSnap => {
      partners.push({ id: docSnap.id, ...docSnap.data() });
    });
    partners.sort((a, b) => (b.partnerCode || '').localeCompare(a.partnerCode || ''));
    callback(partners);
  }, (err) => {
    console.error("Error subscribing to partners:", err);
    if (onError) onError(err);
  });
}

/**
 * Real-time listener: Subscribes to all wedding cards in wedding_cards
 */
export function subscribeToWeddingCards(callback, onError) {
  const q = query(collection(db, CARDS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const cards = [];
    snapshot.forEach(docSnap => {
      cards.push({ id: docSnap.id, ...docSnap.data() });
    });
    cards.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
      return timeB - timeA;
    });
    callback(cards);
  }, (err) => {
    console.error("Error subscribing to wedding cards:", err);
    if (onError) onError(err);
  });
}

/**
 * Real-time listener: Subscribes to a single partner document
 */
export function subscribeToPartner(partnerId, callback, onError) {
  if (!partnerId) return () => {};
  const docRef = doc(db, PARTNERS_COLLECTION, partnerId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (err) => {
    console.error(`Error subscribing to partner ${partnerId}:`, err);
    if (onError) onError(err);
  });
}

/**
 * Real-time listener: Subscribes to payments for a specific wedding card
 */
export function subscribeToPaymentsForCard(cardId, callback, onError) {
  if (!cardId) return () => {};
  const q = query(collection(db, PAYMENTS_COLLECTION), where('weddingCardId', '==', cardId));
  return onSnapshot(q, (snapshot) => {
    const payments = [];
    snapshot.forEach(docSnap => {
      payments.push({ id: docSnap.id, ...docSnap.data() });
    });
    payments.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
      return timeB - timeA;
    });
    callback(payments);
  }, (err) => {
    console.error(`Error subscribing to payments for card ${cardId}:`, err);
    if (onError) onError(err);
  });
}
