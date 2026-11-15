const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Validates a username string (alphanumeric, dashes, underscores, 3-30 chars)
 */
function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const regex = /^[a-zA-Z0-9_-]{3,30}$/;
  return regex.test(username.trim());
}

/**
 * Callable Function: createPartnerAccount
 * Securely creates a partner's Firebase Auth account, assigns the partner role,
 * generates registration URL & QR mapping, and connects the Auth UID to wedding_partners.
 */
exports.createPartnerAccount = functions.https.onCall(async (data, context) => {
  // 1. Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated WebRyza administrators can create partner accounts.'
    );
  }

  const {
    shopName,
    ownerName,
    phone,
    email = '',
    address = '',
    partnerCode,
    username,
    password
  } = data || {};

  // 2. Validate input fields
  if (!shopName || !ownerName || !phone || !partnerCode || !username || !password) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Shop Name, Owner Name, Phone, Partner ID, Username, and Password are required.'
    );
  }

  const cleanUsername = String(username).toLowerCase().trim();
  const cleanPartnerCode = String(partnerCode).trim().toUpperCase();

  if (!isValidUsername(cleanUsername)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Username must be 3-30 characters long and can only contain letters, numbers, hyphens, and underscores.'
    );
  }

  if (String(password).length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters long.'
    );
  }

  // 3. Check if username is already taken
  const usernameDocRef = db.collection('partner_usernames').doc(cleanUsername);
  const usernameSnap = await usernameDocRef.get();
  if (usernameSnap.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      `The username "${cleanUsername}" is already taken. Please choose another username.`
    );
  }

  // 4. Check if partnerCode already exists
  const partnerDocRef = db.collection('wedding_partners').doc(cleanPartnerCode);
  const partnerSnap = await partnerDocRef.get();
  if (partnerSnap.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      `Partner ID "${cleanPartnerCode}" already exists. Please choose or generate another ID.`
    );
  }

  // 5. Internal email mapping for Firebase Auth
  const internalEmail = `${cleanUsername}@partner.webryza.in`;

  let userRecord;
  try {
    // Create Firebase Authentication user
    userRecord = await admin.auth().createUser({
      email: internalEmail,
      password: String(password),
      displayName: String(shopName).trim(),
      disabled: false
    });
  } catch (authError) {
    console.error('Error creating Firebase Auth user:', authError);
    if (authError.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError(
        'already-exists',
        `An account with username "${cleanUsername}" already exists in Firebase Auth.`
      );
    }
    throw new functions.https.HttpsError('internal', authError.message || 'Failed to create login account.');
  }

  try {
    // 6. Assign Custom Claims: role 'partner'
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'partner',
      partnerCode: cleanPartnerCode,
      partnerId: cleanPartnerCode
    });

    const registrationUrl = `https://cards.webryza.in/?ref=${cleanPartnerCode}`;

    // 7. Write to wedding_partners (NEVER store password in plaintext)
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
    await partnerDocRef.set(partnerData);

    // 8. Write to partner_usernames lookup mapping
    await usernameDocRef.set({
      username: cleanUsername,
      partnerCode: cleanPartnerCode,
      partnerId: cleanPartnerCode,
      authUid: userRecord.uid,
      internalEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      partnerCode: cleanPartnerCode,
      authUid: userRecord.uid,
      username: cleanUsername,
      registrationUrl
    };
  } catch (firestoreError) {
    console.error('Error saving partner to Firestore:', firestoreError);
    // Cleanup Auth user if Firestore write fails to prevent orphaned auth accounts
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    throw new functions.https.HttpsError('internal', 'Failed to store partner record in database.');
  }
});

/**
 * Callable Function: changePartnerUsername
 * Allows the admin to change a partner's username, updating their login email and mapping.
 */
exports.changePartnerUsername = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only WebRyza administrators can change partner usernames.'
    );
  }

  const { partnerId, newUsername } = data || {};
  if (!partnerId || !newUsername) {
    throw new functions.https.HttpsError('invalid-argument', 'Partner ID and new username are required.');
  }

  const cleanNew = String(newUsername).toLowerCase().trim();
  if (!isValidUsername(cleanNew)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'New username must be 3-30 characters long and can only contain letters, numbers, hyphens, and underscores.'
    );
  }

  const partnerDocRef = db.collection('wedding_partners').doc(String(partnerId).trim());
  const partnerSnap = await partnerDocRef.get();
  if (!partnerSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Partner document not found.');
  }

  const partnerData = partnerSnap.data();
  const oldUsername = (partnerData.username || '').toLowerCase().trim();
  if (oldUsername === cleanNew) {
    return { success: true, message: 'Username is unchanged.' };
  }

  // Check if new username document exists
  const newUsernameDocRef = db.collection('partner_usernames').doc(cleanNew);
  const newSnap = await newUsernameDocRef.get();
  if (newSnap.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      `The username "${cleanNew}" is already in use by another partner.`
    );
  }

  const authUid = partnerData.authUid;
  const newInternalEmail = `${cleanNew}@partner.webryza.in`;

  // Update Firebase Auth user email if Auth account exists
  if (authUid) {
    try {
      await admin.auth().updateUser(authUid, { email: newInternalEmail });
    } catch (err) {
      console.error('Failed to update Auth user email:', err);
      throw new functions.https.HttpsError('internal', 'Failed to update login account in Firebase Authentication.');
    }
  }

  // Batch update Firestore
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
 * Allows the admin to set a new password for the partner in Firebase Authentication.
 */
exports.resetPartnerPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only WebRyza administrators can reset partner passwords.'
    );
  }

  const { partnerId, newPassword } = data || {};
  if (!partnerId || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'Partner ID and new password are required.');
  }

  if (String(newPassword).length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'New password must be at least 6 characters long.');
  }

  const partnerDocRef = db.collection('wedding_partners').doc(String(partnerId).trim());
  const partnerSnap = await partnerDocRef.get();
  if (!partnerSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Partner document not found.');
  }

  const partnerData = partnerSnap.data();
  let authUid = partnerData.authUid;

  // If partner does not have an Auth UID yet (legacy record), create one now
  if (!authUid) {
    const username = partnerData.username || partnerData.partnerCode.toLowerCase();
    const internalEmail = `${username}@partner.webryza.in`;
    const newUser = await admin.auth().createUser({
      email: internalEmail,
      password: String(newPassword),
      displayName: partnerData.shopName,
      disabled: partnerData.isActive === false
    });
    authUid = newUser.uid;
    await admin.auth().setCustomUserClaims(authUid, {
      role: 'partner',
      partnerCode: partnerData.partnerCode || partnerId,
      partnerId: partnerId
    });
    await partnerDocRef.update({
      authUid,
      username,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // Update password in Firebase Auth (never stored in Firestore!)
    await admin.auth().updateUser(authUid, {
      password: String(newPassword)
    });
  }

  return { success: true, message: 'Password has been successfully updated.' };
});

/**
 * Callable Function: togglePartnerStatus
 * Enables or disables the partner's Firebase Auth login account and updates Firestore.
 */
exports.togglePartnerStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only WebRyza administrators can activate or deactivate partners.'
    );
  }

  const { partnerId, isActive } = data || {};
  if (!partnerId || typeof isActive !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'Partner ID and active boolean state are required.');
  }

  const partnerDocRef = db.collection('wedding_partners').doc(String(partnerId).trim());
  const partnerSnap = await partnerDocRef.get();
  if (!partnerSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Partner not found.');
  }

  const partnerData = partnerSnap.data();
  const authUid = partnerData.authUid;

  // Disable/enable Firebase Auth user login if user exists
  if (authUid) {
    try {
      await admin.auth().updateUser(authUid, {
        disabled: !isActive
      });
    } catch (err) {
      console.warn('Could not update Auth user status:', err);
    }
  }

  await partnerDocRef.update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, isActive };
});

/**
 * Callable Function: lookupPartnerUsername
 * Public/Portal helper for cards.webryza.in login screen:
 * Resolves username to internal auth email so partners can log in with username only.
 */
exports.lookupPartnerUsername = functions.https.onCall(async (data) => {
  const { username } = data || {};
  if (!username) {
    throw new functions.https.HttpsError('invalid-argument', 'Username is required.');
  }

  const clean = String(username).toLowerCase().trim();
  const docSnap = await db.collection('partner_usernames').doc(clean).get();
  if (!docSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Invalid username or password.');
  }

  const record = docSnap.data();
  // Check if partner is active
  const partnerSnap = await db.collection('wedding_partners').doc(record.partnerCode || record.partnerId).get();
  if (partnerSnap.exists && partnerSnap.data().isActive === false) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This partner account has been deactivated. Please contact WebRyza admin.'
    );
  }

  return {
    internalEmail: record.internalEmail || `${clean}@partner.webryza.in`,
    partnerCode: record.partnerCode,
    shopName: partnerSnap.exists ? partnerSnap.data().shopName : ''
  };
});
