/**
 * @component ComplianceBanner
 * @description
 *   Displayed on Dashboard when user's account_status is not 'active'.
 *   Informs the user of their compliance status and blocks transacting.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusConfig = {
  pending_compliance_approval: {
    icon: Clock,
    color: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
    title: 'Account Pending Compliance Approval',
    message:
      'Your account is under review. You can create and manage escrow transactions, but funding and payouts are locked until your KYC is verified and approved.',
    action: 'Complete KYC',
    actionUrl: 'Profile',
    actionTab: '?tab=kyc',
  },
  restricted: {
    icon: AlertTriangle,
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-500',
    titleColor: 'text-orange-800',
    textColor: 'text-orange-700',
    title: 'Account Restricted — Enhanced Due Diligence Required',
    message:
      'Your account has been flagged for Enhanced Due Diligence (EDD). All transactions are blocked until our compliance team completes their review. You will be contacted via email.',
    action: 'View Profile',
    actionUrl: 'Profile',
    actionTab: '',
  },
  suspended: {
    icon: AlertTriangle,
    color: 'bg-red-50 border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
    title: 'Account Suspended',
    message:
      'Your account has been temporarily suspended by our compliance team. All transactions are frozen. Please contact compliance@escropay.co.za for assistance.',
    action: null,
    actionUrl: null,
  },
  terminated: {
    icon: XCircle,
    color: 'bg-red-50 border-red-300',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-700',
    title: 'Account Terminated',
    message:
      'This account has been terminated following a compliance review. If you believe this is an error, contact compliance@escropay.co.za.',
    action: null,
    actionUrl: null,
  },
  blacklisted: {
    icon: XCircle,
    color: 'bg-red-50 border-red-300',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-700',
    title: 'Account Access Restricted',
    message:
      'We are unable to process your account at this time. Please contact compliance@escropay.co.za. Reference: ESCA-COMPLIANCE.',
    action: null,
    actionUrl: null,
  },
};

export default function ComplianceBanner({ accountStatus }) {
  if (!accountStatus || accountStatus === 'active') return null;

  const config = statusConfig[accountStatus];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-2xl p-5 mb-6 ${config.color}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`font-semibold text-sm ${config.titleColor}`}>{config.title}</h3>
              <p className={`text-sm mt-1 ${config.textColor}`}>{config.message}</p>
            </div>
            {config.action && config.actionUrl && (
              <Link to={createPageUrl(config.actionUrl) + (config.actionTab || '')}>
                <Button size="sm" variant="outline" className="flex-shrink-0 border-current">
                  {config.action}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Shield className={`w-3.5 h-3.5 ${config.iconColor}`} />
            <span className={`text-xs ${config.textColor}`}>
              Escropay Compliance Engine · FICA / AML / CFT Enforced · compliance@escropay.co.za
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}