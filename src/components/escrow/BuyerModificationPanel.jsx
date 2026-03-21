import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '@/components/common/CurrencyContext';

export default function BuyerModificationPanel({ escrow, currentUser, onUpdate }) {
  const { currency } = useCurrency();
  const isBuyer = currentUser?.email === escrow.buyer_email;

  const [formData, setFormData] = useState({
    title: escrow.title || '',
    description: escrow.description || '',
    amount: escrow.amount || '',
    due_date: escrow.due_date || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Only show if modification was requested and seller hasn't accepted yet
  if (escrow.status !== 'modification_requested' || !isBuyer) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate({
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'pending_seller_acceptance',
        modification_request: null
      });

      // Notify seller
      await base44.entities.Notification.create({
        user_email: escrow.seller_email,
        type: 'escrow_accepted',
        escrow_id: escrow.id,
        title: 'Transaction updated by buyer',
        message: `${escrow.buyer_name || escrow.buyer_email} has updated the transaction details. Please review and accept.`,
        action_url: `/EscrowView?id=${escrow.id}`
      });

      await base44.functions.invoke('sendEmail', {
        to: escrow.seller_email,
        subject: `Transaction Updated - ${escrow.title}`,
        body: `<h2>Transaction Has Been Updated</h2><p><strong>${escrow.buyer_name || escrow.buyer_email}</strong> has updated the transaction details in response to your modification request.</p><p><strong>Updated Title:</strong> ${formData.title}</p><p><strong>Updated Amount:</strong> R${parseFloat(formData.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}<p>Please review and accept or request further changes.</p><p><a href="${window.location.origin}/EscrowView?id=${escrow.id}">Review transaction</a></p>`
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Modification submit failed:', err);
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-orange-50 border border-orange-200 rounded-2xl p-6"
    >
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900">Seller Requested Modifications</h3>
          {escrow.modification_request?.reason && (
            <p className="text-sm text-orange-700 mt-1">
              <strong>Reason:</strong> {escrow.modification_request.reason}
            </p>
          )}
          {escrow.modification_request?.requested_changes && (
            <p className="text-sm text-orange-700 mt-1">
              <strong>Requested changes:</strong> {escrow.modification_request.requested_changes}
            </p>
          )}
        </div>
      </div>

      {!isEditing ? (
        <Button
          onClick={() => setIsEditing(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Update Transaction Details
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <Label>Transaction Title</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="Title"
              />
            </div>
            <div className="space-y-1">
              <Label>Amount ({currency.code})</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the updated terms..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title || !formData.amount}
              className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Submit Updated Transaction
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}