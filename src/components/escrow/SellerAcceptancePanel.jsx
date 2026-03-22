import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Edit3, Loader2, Clock } from 'lucide-react';

const APP_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname.includes('preview-sandbox') || window.location.hostname.includes('base44')
    ? 'https://escropay.app'
    : window.location.origin)
  : 'https://escropay.app';

export default function SellerAcceptancePanel({ escrow, currentUser, isLoadingUser, onUpdate }) {
  const [modificationReason, setModificationReason] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [showModificationForm, setShowModificationForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSeller = currentUser?.email === escrow.seller_email;

  // Only show for sellers when escrow is pending their acceptance
  if (escrow.status !== 'pending_seller_acceptance' || !isSeller) return null;

  if (isLoadingUser) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <Clock className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

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
        title: 'Escrow accepted by seller',
        message: `${escrow.seller_name || escrow.seller_email} has accepted the escrow for "${escrow.title}". Please fund it to proceed.`,
        action_url: `/EscrowView?id=${escrow.id}`
      });

      await base44.functions.invoke('sendEmail', {
        to: escrow.buyer_email,
        subject: `Escrow Accepted – ${escrow.title}`,
        body: `<h2>Your Escrow Has Been Accepted</h2><p><strong>${escrow.seller_name || escrow.seller_email}</strong> has accepted the escrow transaction.</p><p><strong>Transaction ID:</strong> ${escrow.transaction_id || escrow.id}</p><p><strong>Amount:</strong> R${escrow.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p>Please fund the escrow to proceed.</p><p><a href="${APP_BASE_URL}/EscrowView?id=${escrow.id}">View transaction</a></p>`
      });
    } catch (err) {
      console.error('Accept failed:', err);
    }
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate({ status: 'rejected_by_seller' });

      await base44.entities.Notification.create({
        user_email: escrow.buyer_email,
        type: 'escrow_rejected',
        escrow_id: escrow.id,
        title: 'Escrow rejected by seller',
        message: `${escrow.seller_name || escrow.seller_email} has rejected the escrow for "${escrow.title}".`,
        action_url: `/EscrowView?id=${escrow.id}`
      });

      await base44.functions.invoke('sendEmail', {
        to: escrow.buyer_email,
        subject: `Escrow Rejected – ${escrow.title}`,
        body: `<h2>Your Escrow Has Been Rejected</h2><p><strong>${escrow.seller_name || escrow.seller_email}</strong> has rejected the escrow transaction.</p><p><strong>Transaction ID:</strong> ${escrow.transaction_id || escrow.id}</p><p>You may create a new escrow with revised terms.</p>`
      });
    } catch (err) {
      console.error('Reject failed:', err);
    }
    setIsSubmitting(false);
  };

  const handleRequestModification = async () => {
    if (!modificationReason.trim()) return;
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

      await base44.entities.Notification.create({
        user_email: escrow.buyer_email,
        type: 'modification_requested',
        escrow_id: escrow.id,
        title: 'Seller requested modifications',
        message: `${escrow.seller_name || escrow.seller_email} has requested changes to "${escrow.title}".`,
        action_url: `/EscrowView?id=${escrow.id}`
      });

      await base44.functions.invoke('sendEmail', {
        to: escrow.buyer_email,
        subject: `Modification Requested – ${escrow.title}`,
        body: `<h2>Modification Requested</h2><p><strong>${escrow.seller_name || escrow.seller_email}</strong> has requested changes to the escrow terms.</p><p><strong>Reason:</strong> ${modificationReason}</p>${requestedChanges ? `<p><strong>Requested Changes:</strong> ${requestedChanges}</p>` : ''}<p><a href="${APP_BASE_URL}/EscrowView?id=${escrow.id}">Review and update</a></p>`
      });

      setShowModificationForm(false);
      setModificationReason('');
      setRequestedChanges('');
    } catch (err) {
      console.error('Modification request failed:', err);
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mt-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Badge className="bg-purple-100 text-purple-700 border border-purple-200">Action Required</Badge>
        <span className="text-sm text-purple-700 font-medium">You've been invited as seller</span>
      </div>

      <div className="bg-white rounded-xl p-4 mb-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Amount</span>
          <span className="font-semibold text-gray-900">R{escrow.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {escrow.description && (
          <div>
            <span className="text-gray-500">Terms</span>
            <p className="text-gray-800 mt-1">{escrow.description}</p>
          </div>
        )}
      </div>

      {!showModificationForm ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Accept
          </Button>
          <Button
            onClick={() => setShowModificationForm(true)}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Request Changes
          </Button>
          <Button
            onClick={handleReject}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
            Reject
          </Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div>
            <Label className="text-xs">Reason for requesting changes</Label>
            <Textarea
              value={modificationReason}
              onChange={e => setModificationReason(e.target.value)}
              placeholder="Why are you requesting modifications?"
              className="mt-1 text-sm"
              rows={2}
            />
          </div>
          <div>
            <Label className="text-xs">Specific changes requested (optional)</Label>
            <Textarea
              value={requestedChanges}
              onChange={e => setRequestedChanges(e.target.value)}
              placeholder="Describe what you'd like changed..."
              className="mt-1 text-sm"
              rows={2}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModificationForm(false)} disabled={isSubmitting}>Cancel</Button>
            <Button
              onClick={handleRequestModification}
              disabled={!modificationReason.trim() || isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit3 className="w-4 h-4 mr-2" />}
              Send Modification Request
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}