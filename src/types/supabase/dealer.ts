
import { BaseRecord, TableRow } from './common';

/**
 * Dealer record from the database
 */
export type DealerRecord = TableRow<'dealers'> & BaseRecord;

/**
 * Dealer verification record
 */
export type DealerVerificationRecord = TableRow<'dealer_verifications'> & BaseRecord;

/**
 * Verification status values
 */
export type VerificationStatus = 'pending' | 'approved' | 'rejected';


/**
 * Dealer purchase record
 */
export type DealerPurchaseRecord = TableRow<'dealer_purchases'> & BaseRecord;
