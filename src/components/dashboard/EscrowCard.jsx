import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet,
  ArrowRight,
  User,
  Calendar,
  Bot,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import MilestonePanel from './MilestonePanel';
import DisputePanel from './DisputePanel';
import InAppChat from '@/components/chat/InAppChat';
import PaymentModal from '@/components/payment/PaymentModal';
import BuyerModificationPanel from '@/components/escrow/BuyerModificationPanel';
import SellerAcceptancePanel from '@/components/escrow/SellerAcceptancePanel';
import { useCurrency } from '@/components/common/CurrencyContext';
import { base44 } from '@/api/base44Client';
import { useComplianceGuard } from '@/hooks/useComplianceGuard';

const statusConfig = {
  pending_seller_acceptance: {
    label: 'Pending Acceptance',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Clock,
    glow: 'shadow-purple-500/10'
  },
  modification_requested: {
    label: 'Modification Requested',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Clock,
    glow: 'shadow-orange-500/10'
  },
  rejected_by_seller: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    glow: 'shadow-red-500/10'
  },
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
    glow: 'shadow-amber-500/10'
  },
  funded: {
    label: 'Funded',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: Wallet,
    glow: 'shadow-cyan-500/10'
  },
  released: {
    label: 'Released',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    glow: 'shadow-emerald-500/10'
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    glow: 'shadow-red-500/10'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: ArrowRight,
    glow: 'shadow-gray-500/10'
  }
};

export default function EscrowCard({ escrow, onAction, onUpdate, index = 0, currentUser }) {
  const { format: formatCurrency } = useCurrency();
  const [showDisputePanel, setShowDisputePanel] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const status = statusConfig[escrow.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const otherPartyEmail = currentUser?.email === escrow.buyer_email ? escrow.seller_email : escrow.buyer_email;
  const otherPartyName = currentUser?.email === escrow.buyer_email ? escrow.seller_name : escrow.buyer_name;
  const isSeller = currentUser?.email === escrow.seller_email;
  const isBuyer = currentUser?.email === escrow.buyer_email;
  const { canMakePayments } = useComplianceGuard(currentUser);

  const handlePaymentComplete = () => {
    onAction(escrow.id, 'funded');
  };

  const handleRequestPayout = async () => {
    await onUpdate(escrow.id, { payout_requested: true, payout_requested_at: new Date().toISOString() });
    // Notify admins
    const admins = await base44.entities.User.filter({ role: 'admin' });
    for (const admin of admins) {
      await base44.entities.Notification.create({
        user_email: admin.email,
        type: 'admin_action_required',
        escrow_id: escrow.id,
        title: 'Payout Requested',
        message: `${escrow.seller_name || escrow.seller_email} has requested a payout for "${escrow.title}"`,
        action_url: `/Admin`
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative"
    >
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
        status.glow
      )} />
      <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                {escrow.title}
              </h3>
              {escrow.transaction_id && (
                <span className="text-xs text-gray-400 font-mono ml-2">{escrow.transaction_id}</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {escrow.description || 'No description provided'}
            </p>
          </div>
          <Badge className={cn("border", status.color)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{escrow.buyer_name || escrow.buyer_email}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">{escrow.seller_name || escrow.seller_email}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(escrow.amount)}
            </p>
            {escrow.due_date && (
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <Calendar className="w-3 h-3" />
                <span>Due {format(new Date(escrow.due_date), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <InAppChat
              escrowId={escrow.id}
              escrowTitle={escrow.title}
              currentUser={currentUser}
              otherPartyEmail={otherPartyEmail}
              otherPartyName={otherPartyName}
            />
            {escrow.status === 'pending' && currentUser?.email === escrow.buyer_email && (
              <Button
                size="sm"
                onClick={() => canMakePayments && setShowPaymentModal(true)}
                disabled={!canMakePayments}
                title={!canMakePayments ? 'Complete KYC verification to fund escrow' : ''}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              >
                <Wallet className="w-4 h-4 mr-1" />
                Fund
              </Button>
            )}
            {escrow.status === 'funded' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDisputePanel(true)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Dispute
                </Button>
                {isSeller && canMakePayments && (
                  escrow.payout_requested ? (
                    <Badge className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Payout Requested
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleRequestPayout}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Wallet className="w-4 h-4 mr-1" />
                      Request Payout
                    </Button>
                  )
                )}
                {isBuyer && canMakePayments && (
                  <Button
                    size="sm"
                    onClick={() => onAction(escrow.id, 'released')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Release
                  </Button>
                )}
              </>
            )}
            {escrow.status === 'disputed' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDisputePanel(true)}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Bot className="w-4 h-4 mr-1" />
                  AI Resolution
                </Button>
                {currentUser?.email === escrow.buyer_email && (
                  <Button
                    size="sm"
                    onClick={() => onAction(escrow.id, 'refunded')}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Refund
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Seller Acceptance Panel */}
        <SellerAcceptancePanel
          escrow={escrow}
          currentUser={currentUser}
          isLoadingUser={!currentUser && currentUser !== null ? true : false}
          onUpdate={(data) => onUpdate(escrow.id, data)}
        />

        {/* Buyer Modification Panel */}
        <BuyerModificationPanel
          escrow={escrow}
          currentUser={currentUser}
          onUpdate={(data) => onUpdate(escrow.id, data)}
        />

        {/* Milestone Panel */}
        {onUpdate && (
          <MilestonePanel escrow={escrow} onUpdate={onUpdate} currentUser={currentUser} />
        )}
      </div>

      {/* Dispute Panel Modal */}
      {showDisputePanel && (
        <DisputePanel
          escrow={escrow}
          onUpdate={onUpdate}
          onClose={() => setShowDisputePanel(false)}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        escrow={escrow}
        onPaymentComplete={handlePaymentComplete}
      />
    </motion.div>
  );
}