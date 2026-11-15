const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Production and staging origins allowed to call WebRyza backend functions.
 * Unrestricted origins are strictly forbidden in production.
 */
const ALLOWED_ORIGINS = [
  'https://www.webryza.in',
  'https://webryza.in',
  'https://cards.webryza.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

const FUNCTION_OPTS = {
  cors: ALLOWED_ORIGINS,
  region: 'us-central1'
};

/**
 * Validates that the caller is an authenticated WebRyza administrator.
 * Rejects unauthenticated callers and users carrying the partner role claim.
 */
function verifyAdmin(request) {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Authentication required. Please sign in to the WebRyza Admin Panel.'
    );
  }

  // Partners are not permitted to execute administrative backend functions
  if (request.auth.token && request.auth.token.role === 'partner') {
    throw new HttpsError(
      'permission-denied',
      'Unauthorized. Only WebRyza administrators can perform this action.'
    );
  }
}

/**
 * Normalizes username to lowercase and trims whitespace
 */
function normalizeUsername(username) {
  if (!username || typeof username !== 'string') return '';
  return username.toLowerCase().trim();
}

/**
 * Validates username string (alphanumeric, dashes, underscores, 3-30 chars)
 */
function validateUsernameFormat(username) {
  const regex = /^[a-z0-9_-]{3,30}$/;
  return regex.test(username);
}

/**
 * Callable Function: createPartnerAccount
 * Securely creates a partner account:
 * 1. Verifies admin authorization
 * 2. Normalizes username and checks uniqueness atomically in partner_usernames
 * 3. Creates the Firebase Authentication user with role: 'partner'
 * 4. Creates the partner record in wedding_partners and maps authUid
 * 5. Creates the username mapping in partner_usernames
 * 6. Safely rolls back if any step fails
 */
exports.createPartnerAccount = onCall(FUNCTION_OPTS, async (request) => {
  verifyAdmin(request);

  const {
    shopName,
    ownerName,
    phone,
    email = '',
    address = '',
    partnerCode,
    username,
    password
  } = request.data || {};

  if (!shopName || !ownerName || !phone || !partnerCode || !username || !password) {
    throw new HttpsError(
      'invalid-argument',
      'Shop Name, Owner Name, Phone, Partner ID, Username, and Password are required.'
    );
  }

  const cleanUsername = normalizeUsername(username);
  const cleanPartnerCode = String(partnerCode).trim().toUpperCase();

  if (!validateUsernameFormat(cleanUsername)) {
    throw new HttpsError(
      'invalid-argument',
      'Username must be 3-30 characters long and can only contain lowercase letters, numbers, hyphens, and underscores.'
    );
  }

  if (String(password).length < 6) {
    throw new HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters long.'
    );
  }

  const usernameDocRef = db.collection('partner_usernames').doc(cleanUsername);
  const partnerDocRef = db.collection('wedding_partners').doc(cleanPartnerCode);

  // 1. Atomic reservation of username and verification of Partner ID
  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(usernameDocRef);
    if (userDoc.exists) {
      throw new HttpsError(
        'already-exists',
        `The username "${cleanUsername}" is already taken. Please choose another username.`
      );
    }

    const partnerDoc = await transaction.get(partnerDocRef);
    if (partnerDoc.exists) {
      throw new HttpsError(
        'already-exists',
        `Partner ID "${cleanPartnerCode}" already exists. Please choose or generate another ID.`
      );
    }

    // Temporarily reserve username mapping to prevent simultaneous race conditions
    transaction.set(usernameDocRef, {
      reserved: true,
      username: cleanUsername,
      partnerCode: cleanPartnerCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  const internalEmail = `${cleanUsername}@partner.webryza.in`;
  let userRecord;

  // 2. Create Firebase Authentication User
  try {
    userRecord = await admin.auth().createUser({
      email: internalEmail,
      password: String(password),
      displayName: String(shopName).trim(),
      disabled: false
    });
  } catch (authError) {
    // Release reserved username mapping if Auth creation fails
    await usernameDocRef.delete().catch(() => {});

    console.error('Error creating Firebase Auth user:', authError);
    if (authError.code === 'auth/email-already-exists') {
      throw new HttpsError(
        'already-exists',
        `An authentication account with username "${cleanUsername}" already exists.`
      );
    }
    throw new HttpsError('internal', authError.message || 'Failed to create Firebase Authentication account.');
  }

  // 3. Assign Custom Claims: role 'partner'
  try {
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'partner',
      partnerCode: cleanPartnerCode,
      partnerId: cleanPartnerCode
    });
  } catch (claimErr) {
    console.error('Error setting custom claims:', claimErr);
    // Cleanup Auth user and reserved username
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    await usernameDocRef.delete().catch(() => {});
    throw new HttpsError('internal', 'Failed to configure partner permissions.');
  }

  // 4. Save Partner document and finalize username mapping in Firestore
  try {
    const registrationUrl = `https://cards.webryza.in/?ref=${cleanPartnerCode}`;
    const batch = db.batch();

    const partnerData = {
      partnerCode: cleanPartnerCode,
      shopName: String(shopName).trim(),
      ownerName: String(ownerName).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : '',
      address: address ? String(address).trim() : '',
      username: cleanUsername,
      authUid: userRecord.uid,
      role: 'partner',
      isActive: true,
      registrationUrl,
      totalProjects: 0,
      totalAmountCharged: 0,
      totalAmountDue: 0,
      totalAmountPaid: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    batch.set(partnerDocRef, partnerData);

    batch.set(usernameDocRef, {
      username: cleanUsername,
      partnerCode: cleanPartnerCode,
      partnerId: cleanPartnerCode,
      authUid: userRecord.uid,
      internalEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
      success: true,
      partnerCode: cleanPartnerCode,
      authUid: userRecord.uid,
      username: cleanUsername,
      registrationUrl
    };
  } catch (firestoreError) {
    console.error('Error saving partner to Firestore, rolling back:', firestoreError);
    // Clean up created Auth user and username mapping to prevent orphaned records
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    await usernameDocRef.delete().catch(() => {});
    throw new HttpsError('internal', 'Failed to save partner record to Firestore.');
  }
});

/**
 * Callable Function: changePartnerUsername
 * Safely changes a partner's username:
 * 1. Verifies admin authorization
 * 2. Validates new username format and ensures uniqueness
 * 3. Updates Firebase Authentication internal email
 * 4. Atomically transfers the username mapping in partner_usernames
 */
exports.changePartnerUsername = onCall(FUNCTION_OPTS, async (request) => {
  verifyAdmin(request);

  const { partnerId, newUsername } = request.data || {};
  if (!partnerId || !newUsername) {
    throw new HttpsError('invalid-argument', 'Partner ID and new username are required.');
  }

  const cleanNew = normalizeUsername(newUsername);
  if (!validateUsernameFormat(cleanNew)) {
    throw new HttpsError(
      'invalid-argument',
      'Username must be 3-30 characters long and can only contain lowercase letters, numbers, hyphens, and underscores.'
    );
  }

  const partnerDocRef = db.collection('wedding_partners').doc(String(partnerId).trim());
  const partnerSnap = await partnerDocRef.get();
  if (!partnerSnap.exists) {
    throw new HttpsError('not-found', 'Partner document not found.');
  }

  const partnerData = partnerSnap.data();
  const oldUsername = normalizeUsername(partnerData.username);

  if (oldUsername === cleanNew) {
    return { success: true, message: 'Username is already set to this value.' };
  }

  const newUsernameDocRef = db.collection('partner_usernames').doc(cleanNew);

  // Check and reserve new username atomically
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(newUsernameDocRef);
    if (snap.exists) {
      throw new HttpsError('already-exists', `The username "${cleanNew}" is already taken.`);
    }
    transaction.set(newUsernameDocRef, {
      reserved: true,
      username: cleanNew,
      partnerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  const authUid = partnerData.authUid;
  const newInternalEmail = `${cleanNew}@partner.webryza.in`;

  // Update Auth user email if Auth account exists
  if (authUid) {
    try {
      await admin.auth().updateUser(authUid, {
        email: newInternalEmail
      });
    } catch (err) {
      console.error('Failed to update Auth user email:', err);
      // Release reservation
      await newUsernameDocRef.delete().catch(() => {});
      throw new HttpsError('internal', 'Failed to update login account in Firebase Authentication.');
    }
  }

  // Atomically update Firestore records
  const batch = db.batch();
  if (oldUsername) {
    batch.delete(db.collection('partner_usernames').doc(oldUsername));
  }
  batch.set(newUsernameDocRef, {
    username: cleanNew,
    partnerCode: partnerData.partnerCode || partnerId,
    partnerId: partnerId,
    authUid: authUid || '',
    internalEmail: newInternalEmail,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  batch.update(partnerDocRef, {
    username: cleanNew,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();

  return { success: true, newUsername: cleanNew };
});

/**
 * Callable Function: resetPartnerPassword
 * Resets a partner's password:
 * 1. Verifies admin authorization
 * 2. Finds the existing Firebase Authentication account
 * 3. Updates the existing account's password (never creates a duplicate account)
 * 4. Preserves all partner projects and payment records
 */
exports.resetPartnerPassword = onCall(FUNCTION_OPTS, async (request) => {
  verifyAdmin(request);

  const { partnerId, newPassword } = request.data || {};
  if (!partnerId || !newPassword) {
    throw new HttpsError('invalid-argument', 'Partner ID and new password are required.');
  }

  if (String(newPassword).length < 6) {
    throw new HttpsError('invalid-argument', 'New password must be at least 6 characters long.');
  }

  const partnerDocRef = db.collection('wedding_partners').doc(String(partnerId).trim());
  const partnerSnap = await partnerDocRef.get();
  if (!partnerSnap.exists) {
    throw new HttpsError('not-found', 'Partner document not found.');
  }

  const partnerData = partnerSnap.data();
  let authUid = partnerData.authUid;
  const username = normalizeUsername(partnerData.username || partnerData.partnerCode);
  const internalEmail = `${username}@partner.webryza.in`;

  // Locate the existing Authentication account
  if (!authUid) {
    try {
      const existingUser = await admin.auth().getUserByEmail(internalEmail);
      authUid = existingUser.uid;
      // Connect authUid back to partner document
      await partnerDocRef.update({
        authUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (notFoundErr) {
      console.error('Authentication user not found for password reset:', notFoundErr);
      throw new HttpsError(
        'not-found',
        `No Firebase Authentication account found for username "${username}". Please recreate the partner account.`
      );
    }
  }

  // Update existing user password via Admin SDK
  try {
    await admin.auth().updateUser(authUid, {
      password: String(newPassword)
    });
  } catch (updateErr) {
    console.error('Error updating password in Firebase Auth:', updateErr);
    if (updateErr.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'The login account for this partner was not found in Firebase Authentication.');
    }
    throw new HttpsError('internal', updateErr.message || 'Failed to update partner password.');
  }

  return { success: true, message: 'Password has been successfully updated.' };
});

/**
 * Callable Function: togglePartnerStatus
 * Enables or disables the partner's Firebase Auth login account and updates Firestore.
 */
exports.togglePartnerStatus = onCall(FUNCTION_OPTS, async (request) => {
  verifyAdmin(request);

  const { partnerId, isActive } = request.data || {};
  if (!partnerId || typeof isActive !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Partner ID and active boolean state are required.');
  }

  const partnerDocRef = db.collection('wedding_partners').doc(String(partnerId).trim());
  const partnerSnap = await partnerDocRef.get();
  if (!partnerSnap.exists) {
    throw new HttpsError('not-found', 'Partner not found.');
  }

  const partnerData = partnerSnap.data();
  const authUid = partnerData.authUid;

  if (authUid) {
    try {
      await admin.auth().updateUser(authUid, {
        disabled: !isActive
      });
    } catch (err) {
      console.warn('Could not toggle Auth user status:', err);
    }
  }

  await partnerDocRef.update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, isActive };
});

/**
 * Callable Function: deletePartnerAccount
 * Safely deletes a partner account:
 * 1. Verifies admin authorization
 * 2. Preserves all linked wedding cards and payment records (unlinks partner, sets Former Partner)
 * 3. Deletes the associated Firebase Authentication user account
 * 4. Cleans up the username mapping in partner_usernames so the username is completely released
 * 5. Deletes the partner document from wedding_partners
 */
exports.deletePartnerAccount = onCall(FUNCTION_OPTS, async (request) => {
  verifyAdmin(request);

  const { partnerId } = request.data || {};
  if (!partnerId) {
    throw new HttpsError('invalid-argument', 'Partner ID is required.');
  }

  const partnerDocRef = db.collection('wedding_partners').doc(String(partnerId).trim());
  const partnerSnap = await partnerDocRef.get();
  if (!partnerSnap.exists) {
    throw new HttpsError('not-found', 'Partner document not found.');
  }

  const partnerData = partnerSnap.data();
  const shopName = partnerData.shopName || 'Deleted Partner';
  const cleanUsername = normalizeUsername(partnerData.username);
  const authUid = partnerData.authUid;

  // 1. Preserve historical wedding cards and payment histories
  const cardsSnap = await db.collection('wedding_cards').where('partnerId', '==', partnerId).get();
  if (!cardsSnap.empty) {
    const cardsBatch = db.batch();
    cardsSnap.forEach((cardDoc) => {
      cardsBatch.update(cardDoc.ref, {
        partnerId: '',
        partnerShopName: `${shopName} (Former Partner)`,
        source: 'direct',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await cardsBatch.commit();
  }

  // 2. Safely delete the Firebase Authentication user account
  if (authUid) {
    try {
      await admin.auth().deleteUser(authUid);
    } catch (authDeleteErr) {
      console.warn('Auth user deletion warning (may already be deleted):', authDeleteErr);
    }
  } else if (cleanUsername) {
    try {
      const user = await admin.auth().getUserByEmail(`${cleanUsername}@partner.webryza.in`);
      if (user) {
        await admin.auth().deleteUser(user.uid);
      }
    } catch (e) {
      console.warn('Lookup by email for deletion note:', e.message);
    }
  }

  // 3. Atomically delete partner document and release username mapping
  const cleanupBatch = db.batch();
  if (cleanUsername) {
    cleanupBatch.delete(db.collection('partner_usernames').doc(cleanUsername));
  }
  cleanupBatch.delete(partnerDocRef);
  await cleanupBatch.commit();

  return {
    success: true,
    message: `Partner "${shopName}" and username "${cleanUsername}" have been safely released.`
  };
});

/**
 * Public/Portal helper for cards.webryza.in login screen:
 * Resolves a username to its internal partner profile.
 * Only returns active partners, never returns passwords.
 */
exports.lookupPartnerUsername = onCall(FUNCTION_OPTS, async (request) => {
  const { username } = request.data || {};
  const clean = normalizeUsername(username);

  if (!clean) {
    throw new HttpsError('invalid-argument', 'Username is required.');
  }

  const usernameDoc = await db.collection('partner_usernames').doc(clean).get();
  if (!usernameDoc.exists) {
    return { exists: false };
  }

  const data = usernameDoc.data();
  const partnerDoc = await db.collection('wedding_partners').doc(data.partnerId).get();

  if (!partnerDoc.exists || partnerDoc.data().isActive === false) {
    return { exists: false, inactive: true };
  }

  return {
    exists: true,
    partnerCode: data.partnerCode,
    partnerId: data.partnerId,
    shopName: partnerDoc.data().shopName,
    internalEmail: data.internalEmail
  };
});
