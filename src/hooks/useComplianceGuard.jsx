/**
 * @hook useComplianceGuard
 * @description
 *   Returns whether the current user is permitted to transact.
 *   Blocks all financial actions (create escrow, fund, release, payout)
 *   until account_status === 'active'.
 *
 *   Usage:
 *     const { canTransact, blockReason, statusLabel } = useComplianceGuard(user);
 */
export function useComplianceGuard(user) {
  const status = user?.account_status;

  // Full payment actions (fund, release, payout) require verified/active account
  // Admins always have full access; also allow if kyc_status is verified but account_status not yet set
  const canMakePayments = status === 'active' || user?.role === 'admin' || (!status && user?.kyc_status === 'verified');

  // Creating/receiving escrow, chatting, accepting, disputing — allowed for all non-blocked users
  const BLOCKED_STATUSES = ['suspended', 'terminated', 'blacklisted'];
  const canUseEscrow = !BLOCKED_STATUSES.includes(status);

  // Legacy alias kept for any existing usages
  const canTransact = canMakePayments;

  const statusLabel = {
    pending_compliance_approval: 'Pending Compliance Approval',
    active: 'Active',
    restricted: 'Restricted — EDD Required',
    suspended: 'Suspended',
    terminated: 'Terminated',
    blacklisted: 'Blacklisted',
  }[status] || 'Pending Compliance Approval';

  const paymentBlockReason = !canMakePayments ? {
    pending_compliance_approval:
      'Complete your KYC verification to fund or receive payouts.',
    restricted:
      'Payments are restricted pending Enhanced Due Diligence (EDD). Contact compliance@escropay.co.za.',
    suspended:
      'Your account has been suspended. Contact compliance@escropay.co.za.',
    terminated:
      'Your account has been terminated. Contact compliance@escropay.co.za.',
    blacklisted:
      'Your account has been flagged. Contact compliance@escropay.co.za.',
  }[status] || null : null;

  return { canTransact, canMakePayments, canUseEscrow, paymentBlockReason, statusLabel, accountStatus: status };
}