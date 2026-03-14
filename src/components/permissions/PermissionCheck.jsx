import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Permission matrix
const PERMISSIONS = {
  buyer: {
    view: ['own_escrows', 'own_wallet', 'own_profile'],
    create: ['escrow', 'dispute', 'milestone_approval'],
    update: ['own_profile', 'milestone_approval'],
    delete: []
  },
  seller: {
    view: ['own_escrows', 'own_wallet', 'own_profile'],
    create: ['dispute', 'milestone_deliverable'],
    update: ['own_profile', 'milestone_deliverable', 'accept_escrow'],
    delete: []
  },
  agent: {
    view: ['all_escrows', 'all_wallets', 'transaction_states', 'milestone_activity'],
    create: ['manual_release'],
    update: ['lock_funds', 'release_funds', 'pause_transaction'],
    delete: []
  },
  arbitrator: {
    view: ['disputed_escrows', 'evidence', 'communication_history'],
    create: ['dispute_resolution', 'evidence_request'],
    update: ['dispute_outcome', 'payment_release'],
    delete: []
  },
  compliance: {
    view: ['all_users', 'all_escrows', 'kyc_status', 'aml_flags', 'transaction_volumes'],
    create: ['compliance_review', 'aml_flag'],
    update: ['freeze_account', 'approve_high_value', 'kyc_approval'],
    delete: []
  },
  auditor: {
    view: ['all_escrows', 'all_wallets', 'audit_logs', 'transaction_states', 'compliance_data'],
    create: [],
    update: [],
    delete: []
  },
  admin: {
    view: ['everything'],
    create: ['everything'],
    update: ['everything'],
    delete: ['everything']
  }
};

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const can = (action, resource) => {
    if (!user?.role) return false;
    const rolePerms = PERMISSIONS[user.role];
    if (!rolePerms) return false;
    
    if (rolePerms[action]?.includes('everything')) return true;
    return rolePerms[action]?.includes(resource) || false;
  };

  const canViewEscrow = (escrow) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'agent' || user.role === 'auditor') return true;
    if (user.role === 'compliance') return true;
    if (user.role === 'arbitrator' && escrow.status === 'disputed') return true;
    return escrow.buyer_email === user.email || escrow.seller_email === user.email;
  };

  const canModifyEscrow = (escrow) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'agent') return true;
    if (user.role === 'arbitrator' && escrow.status === 'disputed') return true;
    return escrow.buyer_email === user.email || escrow.seller_email === user.email;
  };

  return {
    user,
    can,
    canViewEscrow,
    canModifyEscrow,
    isAgent: user?.role === 'agent',
    isArbitrator: user?.role === 'arbitrator',
    isCompliance: user?.role === 'compliance',
    isAuditor: user?.role === 'auditor',
    isAdmin: user?.role === 'admin',
    isBuyer: user?.role === 'buyer',
    isSeller: user?.role === 'seller'
  };
}

export function PermissionGate({ children, action, resource, fallback = null }) {
  const { can } = usePermissions();
  
  if (!can(action, resource)) {
    return fallback;
  }
  
  return <>{children}</>;
}