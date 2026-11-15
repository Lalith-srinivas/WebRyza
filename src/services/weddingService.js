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
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { calculateCommission } from '../utils/weddingCommission';

export const PARTNERS_COLLECTION = 'wedding_partners';
export const CARDS_COLLECTION = 'wedding_cards';
export const PAYMENTS_COLLECTION = 'wedding_payments';
export const USERNAMES_COLLECTION = 'partner_usernames';

export const BASE_REGISTRATION_URL = 'https://cards.webryza.in/?ref=';

/**
 * Normalizes username to lowercase, trimmed, with non-alphanumeric chars stripped (allows _ and -)
 */
export function normalizeUsername(username) {
  if (!username || typeof username !== 'string') return '';
  return username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
}

/**
 * Generates the deterministic synthetic email for a username.
 * Every portal and admin tool uses this identical algorithm.
 */
export function usernameToEmail(username) {
  const clean = normalizeUsername(username);
  return clean ? `${clean}@partner.webryza.in` : '';
}

/**
 * Checks if a username is available.
 * Detects if a username is actively in use or is an orphaned stale mapping.
 */
export async function checkUsernameAvailability(username, currentPartnerId = null) {
  const clean = normalizeUsername(username);
  if (!clean || clean.length < 3) {
    return { available: false, reason: 'Username must be at least 3 characters (letters, numbers, hyphens, underscores).' };
  }

  const usernameRef = doc(db, USERNAMES_COLLECTION, clean);
  const usernameSnap = await getDoc(usernameRef);

  if (!usernameSnap.exists()) {
    return { available: true, cleanUsername: clean, loginEmail: usernameToEmail(clean) };
  }

  const data = usernameSnap.data();
  // If it's already assigned to the current partner being edited
  if (currentPartnerId && (data.partnerId === currentPartnerId || data.partnerCode === currentPartnerId)) {
    return { available: true, cleanUsername: clean, loginEmail: usernameToEmail(clean) };
  }

  // Cross-check if the mapped partner document actually exists in wedding_partners
  const partnerSnap = await getDoc(doc(db, PARTNERS_COLLECTION, data.partnerId || data.partnerCode || ''));
  if (!partnerSnap.exists()) {
    // The partner document was previously deleted, but this username mapping was orphaned!
    return {
      available: false,
      isOrphaned: true,
      cleanUsername: clean,
      reason: `The username "${clean}" is held by an orphaned mapping from a previously deleted partner. Use the Diagnostic Tool in Partners to release it.`
    };
  }

  return {
    available: false,
    cleanUsername: clean,
    reason: `The username "${clean}" is already taken by ${partnerSnap.data().shopName || 'another partner'}.`
  };
}

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
 * Creates a partner record in Firestore on the Firebase Spark plan.
 * Deterministically maps username to internal login address `${username}@partner.webryza.in`.
 * Does not pretend writing to Firestore creates an Auth account.
 */
export async function createPartner({
  shopName,
  ownerName,
  phone,
  email = '',
  address = '',
  partnerCode,
  username,
  authUid = ''
}) {
  const finalCode = (partnerCode && partnerCode.trim()) ? partnerCode.trim().toUpperCase() : await generateNextPartnerCode();
  const cleanUsername = normalizeUsername(username);

  if (!cleanUsername) {
    throw new Error('Username is required.');
  }
  if (cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }

  const check = await checkUsernameAvailability(cleanUsername);
  if (!check.available) {
    throw new Error(check.reason);
  }

  const partnerDocRef = doc(db, PARTNERS_COLLECTION, finalCode);
  const partnerSnap = await getDoc(partnerDocRef);
  if (partnerSnap.exists()) {
    throw new Error(`Partner ID "${finalCode}" already exists. Please choose another ID.`);
  }

  const loginEmail = usernameToEmail(cleanUsername);
  const registrationUrl = `${BASE_REGISTRATION_URL}${finalCode}`;

  const partnerData = {
    partnerCode: finalCode,
    shopName: String(shopName).trim(),
    ownerName: String(ownerName).trim(),
    phone: String(phone).trim(),
    email: email ? String(email).trim() : '',
    address: address ? String(address).trim() : '',
    username: cleanUsername,
    loginEmail,
    authUid: authUid ? String(authUid).trim() : '',
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

  const usernameData = {
    username: cleanUsername,
    partnerCode: finalCode,
    partnerId: finalCode,
    authUid: authUid ? String(authUid).trim() : '',
    internalEmail: loginEmail,
    shopName: String(shopName).trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const batch = writeBatch(db);
  batch.set(partnerDocRef, partnerData);
  batch.set(doc(db, USERNAMES_COLLECTION, cleanUsername), usernameData);
  await batch.commit();

  return { id: finalCode, ...partnerData, loginEmail };
}

/**
 * Changes a partner's username in Firestore:
 * Releases the old username mapping and reserves the new one atomically.
 */
export async function changePartnerUsername(partnerId, newUsername) {
  const cleanNew = normalizeUsername(newUsername);
  if (!cleanNew || cleanNew.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }

  const check = await checkUsernameAvailability(cleanNew, partnerId);
  if (!check.available) {
    throw new Error(check.reason);
  }

  const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
  const partnerSnap = await getDoc(partnerRef);
  if (!partnerSnap.exists()) {
    throw new Error('Partner not found.');
  }

  const partnerData = partnerSnap.data();
  const oldUsername = normalizeUsername(partnerData.username);
  const newLoginEmail = usernameToEmail(cleanNew);

  const batch = writeBatch(db);
  if (oldUsername && oldUsername !== cleanNew) {
    batch.delete(doc(db, USERNAMES_COLLECTION, oldUsername));
  }
  batch.set(doc(db, USERNAMES_COLLECTION, cleanNew), {
    username: cleanNew,
    partnerCode: partnerData.partnerCode || partnerId,
    partnerId: partnerId,
    authUid: partnerData.authUid || '',
    internalEmail: newLoginEmail,
    shopName: partnerData.shopName || '',
    updatedAt: serverTimestamp()
  });
  batch.update(partnerRef, {
    username: cleanNew,
    loginEmail: newLoginEmail,
    updatedAt: serverTimestamp()
  });

  await batch.commit();
  return { success: true, newUsername: cleanNew, newLoginEmail };
}

/**
 * Updates a partner's linked Firebase Auth UID
 */
export async function linkPartnerAuthUid(partnerId, authUid) {
  const cleanUid = String(authUid || '').trim();
  const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
  const partnerSnap = await getDoc(partnerRef);
  if (!partnerSnap.exists()) throw new Error('Partner not found.');

  const partnerData = partnerSnap.data();
  const username = normalizeUsername(partnerData.username);

  const batch = writeBatch(db);
  batch.update(partnerRef, {
    authUid: cleanUid,
    updatedAt: serverTimestamp()
  });
  if (username) {
    batch.set(doc(db, USERNAMES_COLLECTION, username), {
      authUid: cleanUid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
  await batch.commit();
  return { success: true, authUid: cleanUid };
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
 * Does not release the username when merely deactivated.
 */
export async function togglePartnerStatus(partnerId, isActive) {
  if (!partnerId) throw new Error('Partner ID is required.');
  const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
  await updateDoc(partnerRef, {
    isActive,
    updatedAt: serverTimestamp()
  });
  return { success: true, isActive };
}

/**
 * Permanently deletes a partner shop in Firestore on the Spark plan:
 * 1. Preserves all linked wedding cards and payment records by unlinking partner
 * 2. Deletes the partner document from wedding_partners
 * 3. Deletes the username document from partner_usernames, immediately releasing the username
 */
export async function deletePartner(partnerId) {
  if (!partnerId) throw new Error('Partner ID is required.');

  const partnerRef = doc(db, PARTNERS_COLLECTION, partnerId);
  const partnerSnap = await getDoc(partnerRef);
  if (!partnerSnap.exists()) {
    throw new Error('Partner record not found.');
  }

  const partnerData = partnerSnap.data();
  const shopName = partnerData.shopName || 'Deleted Partner';
  const cleanUsername = normalizeUsername(partnerData.username);

  // Preserve all historical wedding cards
  const cardsQuery = query(collection(db, CARDS_COLLECTION), where('partnerId', '==', partnerId));
  const cardsSnap = await getDocs(cardsQuery);
  if (!cardsSnap.empty) {
    const cardsBatch = writeBatch(db);
    cardsSnap.forEach(cardDoc => {
      cardsBatch.update(cardDoc.ref, {
        partnerId: '',
        partnerShopName: `${shopName} (Former Partner)`,
        source: 'direct',
        updatedAt: serverTimestamp()
      });
    });
    await cardsBatch.commit();
  }

  // Atomically delete partner and release username mapping
  const cleanupBatch = writeBatch(db);
  if (cleanUsername) {
    cleanupBatch.delete(doc(db, USERNAMES_COLLECTION, cleanUsername));
  }
  cleanupBatch.delete(partnerRef);
  await cleanupBatch.commit();

  return {
    success: true,
    releasedUsername: cleanUsername,
    authUid: partnerData.authUid,
    loginEmail: partnerData.loginEmail || usernameToEmail(cleanUsername)
  };
}

/**
 * Sends a standard Firebase Auth password reset email to a partner's personal/real email
 */
export async function sendPartnerPasswordResetEmail(email) {
  if (!email || !email.includes('@')) {
    throw new Error('A valid email address is required to send a password reset link.');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Diagnostic utility: Scans Firestore to find orphaned usernames, missing mappings, and UID mismatches
 */
export async function diagnosePartnerDataConsistency() {
  const [partnersSnap, usernamesSnap] = await Promise.all([
    getDocs(collection(db, PARTNERS_COLLECTION)),
    getDocs(collection(db, USERNAMES_COLLECTION))
  ]);

  const partnersMap = new Map();
  partnersSnap.forEach(docSnap => {
    partnersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  });

  const usernamesMap = new Map();
  usernamesSnap.forEach(docSnap => {
    usernamesMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  });

  const orphanedUsernames = [];
  const missingUsernameDocs = [];
  const unlinkedPartners = [];
  const inactivePartners = [];

  // 1. Check for usernames in partner_usernames whose partner is missing
  for (const [username, data] of usernamesMap.entries()) {
    const partnerId = data.partnerId || data.partnerCode;
    if (!partnerId || !partnersMap.has(partnerId)) {
      orphanedUsernames.push({
        username,
        data,
        reason: partnerId ? `Partner ID "${partnerId}" does not exist in wedding_partners` : 'Missing partnerId reference'
      });
    }
  }

  // 2. Check for partners whose username document is missing or mismatched
  for (const [partnerId, partner] of partnersMap.entries()) {
    const cleanUser = normalizeUsername(partner.username);
    if (!cleanUser || !usernamesMap.has(cleanUser)) {
      missingUsernameDocs.push({
        partnerId,
        shopName: partner.shopName,
        expectedUsername: cleanUser || partner.partnerCode?.toLowerCase()
      });
    }

    if (!partner.authUid) {
      unlinkedPartners.push({
        partnerId,
        shopName: partner.shopName,
        username: partner.username,
        loginEmail: partner.loginEmail || usernameToEmail(partner.username)
      });
    }

    if (partner.isActive === false) {
      inactivePartners.push({
        partnerId,
        shopName: partner.shopName,
        username: partner.username
      });
    }
  }

  return {
    totalPartners: partnersMap.size,
    totalUsernames: usernamesMap.size,
    orphanedUsernames,
    missingUsernameDocs,
    unlinkedPartners,
    inactivePartners
  };
}

/**
 * Releases an orphaned username from partner_usernames
 */
export async function releaseOrphanedUsername(username) {
  const clean = normalizeUsername(username);
  if (!clean) throw new Error('Username required.');
  const usernameRef = doc(db, USERNAMES_COLLECTION, clean);
  await deleteDoc(usernameRef);
  return { success: true, releasedUsername: clean };
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
