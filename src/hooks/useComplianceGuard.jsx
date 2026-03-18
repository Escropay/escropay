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

  const canTransact = status === 'active';

  const statusLabel = {
    pending_compliance_approval: 'Pending Compliance Approval',
    active: 'Active',
    restricted: 'Restricted — EDD Required',
    suspended: 'Suspended',
    terminated: 'Terminated',
    blacklisted: 'Blacklisted',
  }[status] || 'Pending Compliance Approval';

  const blockReason = {
    pending_compliance_approval:
      'Your account is pending compliance approval. Please complete your KYC verification and await review.',
    restricted:
      'Your account is restricted pending Enhanced Due Diligence (EDD). Our compliance team will contact you.',
    suspended:
      'Your account has been suspended. Please contact compliance@escropay.co.za for assistance.',
    terminated:
      'Your account has been terminated. Please contact compliance@escropay.co.za.',
    blacklisted:
      'Your account has been flagged. Please contact compliance@escropay.co.za.',
  }[status] || null;

  return { canTransact, blockReason, statusLabel, accountStatus: status };
}