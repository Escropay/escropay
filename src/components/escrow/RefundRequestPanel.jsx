import React, { useState } from 'react';

const APP_BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname.includes('preview-sandbox') || window.location.hostname.includes('base44')
    ? 'https://escropay.app'
    : window.location.origin)
  : 'https://escropay.app';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export default function RefundRequestPanel({ escrow, currentUser, onUpdate }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBuyer = currentUser?.email === escrow.buyer_email;
  const isAdmin = currentUser?.role === 'admin';
  const hasRefundRequest = escrow.refund_request?.requested_by;

  const handleRequestRefund = async () => {
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate({
        refund_request: {
          reason: reason,
          requested_by: currentUser.email,
          requested_at: new Date().toISOString(),
          admin_approved: false
        }
      });

      // Notify all admins
      const admins = await base44.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.entities.Notification.create({
          user_email: admin.email,
          type: 'admin_action_required',
          escrow_id: escrow.id,
          title: 'Refund request requires approval',
          message: `${currentUser.full_name || currentUser.email} has requested a refund for ${escrow.title}`,
          action_url: `/Admin`
        });

        await base44.functions.invoke('sendEmail', {
          to: admin.email,
          subject: `Refund Request - ${escrow.title}`,
          body: `<h2>Refund Request Pending Approval</h2><p><strong>${currentUser.full_name || currentUser.email}</strong> has requested a refund.</p><p><strong>Transaction ID:</strong> ${escrow.transaction_id || escrow.id}</p><p><strong>Amount:</strong> R${escrow.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p><strong>Reason:</strong> ${reason}</p><p><a href="${APP_BASE_URL}/Admin">Review in Admin Panel</a></p>`
        });
      }

      setReason('');
    } catch (err) {
      console.error('Refund request failed:', err);
    }
    setIsSubmitting(false);
  };

  const handleAdminDecision = async (approved, notes = '') => {
    if (!isAdmin) return; // Safety guard — only admins can approve/deny
    setIsSubmitting(true);
    try {
      const updates = {
        refund_request: {
          ...escrow.refund_request,
          admin_approved: approved,
          admin_notes: notes
        }
      };

      if (approved) {
        updates.status = 'refunded';
        updates.refunded_at = new Date().toISOString();
      }

      await onUpdate(updates);

      // Notify buyer
      await base44.entities.Notification.create({
        user_email: escrow.refund_request.requested_by,
        type: approved ? 'escrow_accepted' : 'escrow_rejected',
        escrow_id: escrow.id,
        title: approved ? 'Refund approved' : 'Refund denied',
        message: approved 
          ? 'Your refund request has been approved by admin' 
          : 'Your refund request has been denied',
        action_url: `/EscrowView?id=${escrow.id}`
      });

      await base44.functions.invoke('sendEmail', {
        to: escrow.refund_request.requested_by,
        subject: `Refund ${approved ? 'Approved' : 'Denied'} - ${escrow.title}`,
        body: `<h2>Refund Request ${approved ? 'Approved' : 'Denied'}</h2><p>Your refund request has been ${approved ? 'approved' : 'denied'} by admin.</p><p><strong>Transaction ID:</strong> ${escrow.transaction_id || escrow.id}</p>${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}<p><a href="${APP_BASE_URL}/EscrowView?id=${escrow.id}">View transaction</a></p>`
      });
    } catch (err) {
      console.error('Admin decision failed:', err);
    }
    setIsSubmitting(false);
  };

  // Show admin approval panel if there's a pending request
  if (isAdmin && hasRefundRequest && !escrow.refund_request.admin_approved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">
              Refund Request Pending Approval
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Requested by: {escrow.refund_request.requested_by}
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-700">Admin Action Required</Badge>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 font-medium mb-2">Reason:</p>
          <p className="text-sm text-gray-800">{escrow.refund_request.reason}</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleAdminDecision(false, 'Refund request denied by admin')}
            disabled={isSubmitting}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
            Deny Refund
          </Button>
          <Button
            onClick={() => handleAdminDecision(true, 'Refund approved by admin')}
            disabled={isSubmitting}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Approve Refund
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show request form for buyer if no pending request
  if (isBuyer && !hasRefundRequest && escrow.status === 'funded') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6"
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Request Refund</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Reason for refund request</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're requesting a refund..."
              className="mt-1 text-sm"
              rows={3}
            />
          </div>
          <Button
            onClick={handleRequestRefund}
            disabled={!reason.trim() || isSubmitting}
            size="sm"
            className="w-full bg-red-500 hover:bg-red-600"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            Submit Refund Request (Admin Approval Required)
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show pending status for buyer
  if (isBuyer && hasRefundRequest && !escrow.refund_request.admin_approved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center gap-2 text-amber-700">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Refund request pending admin approval</span>
        </div>
      </motion.div>
    );
  }

  return null;
}