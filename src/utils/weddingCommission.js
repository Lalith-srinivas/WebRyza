/**
 * Wedding Cards Commission & Financial Calculation Utility
 * 
 * Business Rules:
 * - Minimum customer charge: ₹1,500
 * - If amount charged < ₹2,000: WebRyza Share = ₹1,000
 * - If amount charged >= ₹2,000: WebRyza Share = ₹1,500
 * - Partner Commission = Amount Charged - WebRyza Share
 * - Amount Due to WebRyza = max(0, WebRyza Share - Amount Received by WebRyza)
 * - Payment Status:
 *     - received === 0: 'pending'
 *     - received > 0 && received < WebRyza Share: 'partial'
 *     - received >= WebRyza Share: 'paid'
 */

export const MINIMUM_CHARGE = 1500;
export const COMMISSION_TIER_THRESHOLD = 2000;
export const TIER_1_WEBRYZA_SHARE = 1000; // Under ₹2,000
export const TIER_2_WEBRYZA_SHARE = 1500; // ₹2,000 and above

/**
 * Calculates WebRyza share, partner commission, pending amount, and payment status.
 * 
 * @param {number|string} amountCharged - Customer price charged
 * @param {number|string} amountReceived - Total payments received so far
 * @returns {object} Calculated financial details
 */
export function calculateCommission(amountCharged, amountReceived = 0) {
  const charged = Number(amountCharged) || 0;
  const received = Math.max(0, Number(amountReceived) || 0);

  if (charged < MINIMUM_CHARGE) {
    return {
      isValid: false,
      error: `Minimum customer charge must be at least ₹${MINIMUM_CHARGE.toLocaleString('en-IN')}`,
      amountCharged: charged,
      webryzaShare: 0,
      partnerCommission: 0,
      amountReceivedByWebryza: received,
      amountDueToWebryza: 0,
      paymentStatus: 'pending'
    };
  }

  const webryzaShare = charged < COMMISSION_TIER_THRESHOLD 
    ? TIER_1_WEBRYZA_SHARE 
    : TIER_2_WEBRYZA_SHARE;

  const partnerCommission = Math.max(0, charged - webryzaShare);
  const amountDueToWebryza = Math.max(0, webryzaShare - received);

  let paymentStatus = 'pending';
  if (received >= webryzaShare) {
    paymentStatus = 'paid';
  } else if (received > 0) {
    paymentStatus = 'partial';
  }

  return {
    isValid: true,
    amountCharged: charged,
    webryzaShare,
    partnerCommission,
    amountReceivedByWebryza: received,
    amountDueToWebryza,
    paymentStatus
  };
}

/**
 * Formats a currency amount into Indian Rupee string (e.g. ₹1,500)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Formats Firestore timestamp or ISO date to display string
 */
export function formatWeddingDate(timestamp, includeTime = false) {
  if (!timestamp) return '-';
  try {
    const date = typeof timestamp?.toDate === 'function' 
      ? timestamp.toDate() 
      : (timestamp instanceof Date ? timestamp : new Date(timestamp));
    
    if (isNaN(date.getTime())) return '-';

    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('en-IN', options);
  } catch {
    return '-';
  }
}

/**
 * Formats timestamp to YYYY-MM-DD for date inputs
 */
export function formatDateForInput(timestamp) {
  if (!timestamp) return '';
  try {
    const date = typeof timestamp?.toDate === 'function' 
      ? timestamp.toDate() 
      : (timestamp instanceof Date ? timestamp : new Date(timestamp));
    
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return '';
  }
}
