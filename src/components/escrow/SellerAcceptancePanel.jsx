import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  Edit3,
  Loader2
} from 'lucide-react';

export default function SellerAcceptancePanel({ escrow, onUpdate, currentUser, isLoadingUser }) {
  const [action, setAction] = useState(null);
  const [modificationReason, setModificationReason] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const isSeller = currentUser?.email === escrow.seller_email || 
    (!currentUser && escrow.seller_email === urlParams.get('email'));

  // Don't hide the panel while we're still loading the user
  if (isLoadingUser) return null;

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate({
        recipient_accepted: true,
        recipient_accepted_at: new Date().toISOString(),
        status: 'pending'
      });

      // Notify buyer
      await base44.entities.Notification.create({
        user_email: escrow.buyer_email,
        type: 'escrow_accepted',
        escrow_id: escrow.id,
        title: 'Escrow accepted',
        message: `${escrow.seller_name || escrow.seller_email} has accepted the transaction`,
        action_url: `/EscrowView?id=${escrow.id}`
      });

      // Send email via Resend
      await base44.functions.invoke('sendEmail', {
        to: escrow.buyer_email,
        subject: `Transaction Accepted - ${escrow.title}`,
        body: `<h2>Escrow Transaction Accepted</h2><p><strong>${escrow.seller_name || escrow.seller_email}</strong> has accepted your escrow transaction.</p><p><strong>Transaction ID:</strong> ${escrow.transaction_id || escrow.id}</p><p><strong>Amount:</strong> R${escrow.amount.toLocaleString()}</p><p>You can now proceed to fund the escrow.</p><p><a href="${window.location.origin}/EscrowView?id=${escrow.id}">View transaction</a></p>`
      });
    } catch (err) {
      console.error('Accept failed:', err);
    }
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate({
        status: 'rejected_by_seller'
      });

      // Notify buyer
      await base44.entities.Notification.create({
        user_email: escrow.buyer_email,
        type: 'escrow_rejected',
        escrow_id: escrow.id,
        title: 'Transaction rejected',
        message: `${escrow.seller_name || escrow.seller_email} has rejected the transaction`,
        action_url: `/EscrowView?id=${escrow.id}`
      });

      // Send email via Resend
      await base44.functions.invoke('sendEmail', {
        to: escrow.buyer_email,
        subject: `Transaction Rejected - ${escrow.title}`,
        body: `<h2>Escrow Transaction Rejected</h2><p><strong>${escrow.seller_name || escrow.seller_email}</strong> has rejected your escrow transaction.</p><p><strong>Transaction ID:</strong> ${escrow.transaction_id || escrow.id}</p><p>The transaction has been cancelled.</p>`
      });
    } catch (err) {
      console.error('Reject failed:', err);
    }
    setIsSubmitting(false);
  };

  const handleRequestModification = async () => {
    if (!modificationReason.trim() || !requestedChanges.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate({
        status: 'modification_requested',
        modification_request: {
          reason: modificationReason,
          requested_changes: requestedChanges,
          requested_at: new Date().toISOString()
        }
      });

      // Notify buyer
      await base44.entities.Notification.create({
        user_email: escrow.buyer_email,
        type: 'modification_requested',
        escrow_id: escrow.id,
        title: 'Modification requested',
        message: `${escrow.seller_name || escrow.seller_email} has requested changes to the transaction`,
        action_url: `/EscrowView?id=${escrow.id}`
      });

      // Send email via Resend
      await base44.functions.invoke('sendEmail', {
        to: escrow.buyer_email,
        subject: `Modification Requested - ${escrow.title}`,
        body: `<h2>Transaction Modification Requested</h2><p><strong>${escrow.seller_name || escrow.seller_email}</strong> has requested changes to the escrow transaction.</p><p><strong>Transaction ID:</strong> ${escrow.transaction_id || escrow.id}</p><p><strong>Reason:</strong> ${modificationReason}</p><p><strong>Requested Changes:</strong> ${requestedChanges}</p><p><a href="${window.location.origin}/EscrowView?id=${escrow.id}">Review and modify transaction</a></p>`
      });
    } catch (err) {
      console.error('Request modification failed:', err);
    }
    setIsSubmitting(false);
  };

  if (escrow.status !== 'pending_seller_acceptance' || !isSeller) {
    return null;
  }

  // If seller is viewing but not logged in, prompt them to sign in to take action
  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-amber-900 mb-2">Action Required: Review Transaction</h3>
        <p className="text-sm text-amber-700 mb-4">You need to sign in to accept, reject, or request modifications to this transaction.</p>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Sign In to Review Transaction
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-amber-900 mb-4">
        Action Required: Review Transaction
      </h3>

      {!action && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => setAction('accept')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Accept Transaction
          </Button>
          <Button
            onClick={() => setAction('modify')}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Request Modification
          </Button>
          <Button
            onClick={() => setAction('reject')}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject Transaction
          </Button>
        </div>
      )}

      {action === 'accept' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-600">
            By accepting this transaction, you agree to the terms and will be able to connect your payout method.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAction(null)}>
              Back
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Confirm Acceptance
            </Button>
          </div>
        </motion.div>
      )}

      {action === 'reject' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-red-600 font-medium">
            This will permanently cancel the transaction. The buyer will be notified.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAction(null)}>
              Back
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600 flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </div>
        </motion.div>
      )}

      {action === 'modify' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div>
            <Label>Reason for modification</Label>
            <Textarea
              value={modificationReason}
              onChange={(e) => setModificationReason(e.target.value)}
              placeholder="Why do you need changes to this transaction?"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Requested changes</Label>
            <Textarea
              value={requestedChanges}
              onChange={(e) => setRequestedChanges(e.target.value)}
              placeholder="What specific changes are you requesting?"
              className="mt-1"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAction(null)}>
              Back
            </Button>
            <Button
              onClick={handleRequestModification}
              disabled={!modificationReason.trim() || !requestedChanges.trim() || isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Edit3 className="w-4 h-4 mr-2" />
              )}
              Send Modification Request
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}