import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  ArrowRight,
  User,
  Calendar,
  Building2,
  CreditCard,
  Loader2,
  RefreshCw,
  Lock,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { EmailService } from '@/components/utils/EmailService';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

const statusConfig = {
  pending: { label: 'Pending Funding', color: 'bg-amber-100 text-amber-700', icon: Clock, description: 'Waiting for the buyer to fund this escrow.' },
  funded: { label: 'Funded – In Progress', color: 'bg-cyan-100 text-cyan-700', icon: Wallet, description: 'Funds are secured. Proceed with delivery.' },
  released: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, description: 'Funds have been released to the seller.' },
  disputed: { label: 'Disputed', color: 'bg-red-100 text-red-700', icon: AlertTriangle, description: 'A dispute has been raised. Funds are frozen.' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700', icon: ArrowRight, description: 'Funds have been refunded to the buyer.' }
};

const timelineSteps = [
  { key: 'created', label: 'Escrow Created', icon: Shield },
  { key: 'accepted', label: 'Recipient Accepted', icon: CheckCircle2 },
  { key: 'funded', label: 'Funds Deposited', icon: Wallet },
  { key: 'released', label: 'Funds Released', icon: CheckCircle2 }
];

function getActiveStep(escrow) {
  if (escrow.status === 'released') return 3;
  if (escrow.status === 'funded') return 2;
  if (escrow.recipient_accepted) return 1;
  return 0;
}

export default function EscrowView() {
  const urlParams = new URLSearchParams(window.location.search);
  const escrowId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [bankingForm, setBankingForm] = useState({
    account_holder: '',
    bank_name: '',
    account_number: '',
    branch_code: '',
    account_type: 'cheque'
  });
  const [showBankingForm, setShowBankingForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: escrow, isLoading } = useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: () => base44.entities.Escrow.get(escrowId),
    enabled: !!escrowId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Escrow.update(escrowId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] })
  });

  const handleAccept = () => {
    updateMutation.mutate({
      recipient_accepted: true,
      recipient_accepted_at: new Date().toISOString()
    });
  };

  const handleSaveBanking = async () => {
    setIsSavingBank(true);
    await updateMutation.mutateAsync({
      seller_banking_details: {
        ...bankingForm,
        submitted_at: new Date().toISOString()
      }
    });
    setIsSavingBank(false);
    setShowBankingForm(false);
  };

  const handleDispute = async () => {
    await updateMutation.mutateAsync({
      status: 'disputed',
      disputed_at: new Date().toISOString(),
      dispute_reason: disputeReason
    });
    // Notify both parties
    if (escrow) {
      EmailService.sendDisputeEmail(escrow, 'buyer').catch(() => {});
      EmailService.sendDisputeEmail(escrow, 'seller').catch(() => {});
    }
    setShowDisputeForm(false);
  };

  if (!escrowId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No escrow ID provided.</p>
          <Link to={createPageUrl('Dashboard')}><Button className="mt-4">Go to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Escrow not found.</p>
          <Link to={createPageUrl('Dashboard')}><Button className="mt-4">Go to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[escrow.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const activeStep = getActiveStep(escrow);
  const isSeller = currentUser?.email === escrow.seller_email;
  const isBuyer = currentUser?.email === escrow.buyer_email;
  const hasBanking = !!escrow.seller_banking_details?.account_number;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <img src={LOGO_URL} alt="EscroPay" className="h-8" />
          </Link>
          {currentUser ? (
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
            >
              Sign in to Manage
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Title + Status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{escrow.title}</h1>
              {escrow.description && <p className="text-gray-500 mt-1">{escrow.description}</p>}
            </div>
            <Badge className={`${status.color} text-sm px-3 py-1`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="text-xl font-bold text-purple-600">R {escrow.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-gray-400">Buyer</p>
              <p className="font-medium text-gray-800">{escrow.buyer_name || escrow.buyer_email}</p>
            </div>
            <div>
              <p className="text-gray-400">Seller</p>
              <p className="font-medium text-gray-800">{escrow.seller_name || escrow.seller_email}</p>
            </div>
            {escrow.due_date && (
              <div>
                <p className="text-gray-400">Due Date</p>
                <p className="font-medium text-gray-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(escrow.due_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Transaction Timeline</h2>
          <div className="relative">
            {timelineSteps.map((step, i) => {
              const done = i <= activeStep;
              const active = i === activeStep;
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex gap-4 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-200'}`}>
                      <StepIcon className={`w-4 h-4 ${done ? 'text-white' : 'text-gray-300'}`} />
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-1 ${i < activeStep ? 'bg-purple-400' : 'bg-gray-100'}`} style={{ minHeight: 24 }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                    {active && (
                      <p className="text-sm text-purple-600 mt-0.5">{status.description}</p>
                    )}
                    {step.key === 'created' && escrow.created_date && (
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(escrow.created_date), 'MMM d, yyyy • h:mm a')}</p>
                    )}
                    {step.key === 'accepted' && escrow.recipient_accepted_at && (
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(escrow.recipient_accepted_at), 'MMM d, yyyy • h:mm a')}</p>
                    )}
                    {step.key === 'funded' && escrow.funded_at && (
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(escrow.funded_at), 'MMM d, yyyy • h:mm a')}</p>
                    )}
                    {step.key === 'released' && escrow.released_at && (
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(escrow.released_at), 'MMM d, yyyy • h:mm a')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Seller Actions */}
        {isSeller && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            
            {/* Accept Escrow */}
            {!escrow.recipient_accepted && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Accept Escrow Agreement
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  By accepting, you agree to deliver the goods or services described and acknowledge that funds will only be released upon buyer confirmation.
                </p>
                <Button
                  onClick={handleAccept}
                  disabled={updateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Accept Escrow Agreement
                </Button>
              </div>
            )}

            {/* Banking Details */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Banking Details for Disbursement
                </h3>
                {hasBanking && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Submitted
                  </Badge>
                )}
              </div>

              {hasBanking && !showBankingForm ? (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-gray-400">Account Holder</p><p className="font-medium">{escrow.seller_banking_details.account_holder}</p></div>
                    <div><p className="text-gray-400">Bank</p><p className="font-medium">{escrow.seller_banking_details.bank_name}</p></div>
                    <div><p className="text-gray-400">Account Number</p><p className="font-medium">{'•'.repeat(escrow.seller_banking_details.account_number?.length - 4)}{escrow.seller_banking_details.account_number?.slice(-4)}</p></div>
                    <div><p className="text-gray-400">Branch Code</p><p className="font-medium">{escrow.seller_banking_details.branch_code}</p></div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowBankingForm(true)}>Update Details</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Provide your bank account details so funds can be transferred when released.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Account Holder Name</Label>
                      <Input value={bankingForm.account_holder} onChange={e => setBankingForm(p => ({ ...p, account_holder: e.target.value }))} placeholder="Full legal name" />
                    </div>
                    <div className="space-y-1">
                      <Label>Bank Name</Label>
                      <Input value={bankingForm.bank_name} onChange={e => setBankingForm(p => ({ ...p, bank_name: e.target.value }))} placeholder="e.g. FNB, ABSA, Standard Bank" />
                    </div>
                    <div className="space-y-1">
                      <Label>Account Number</Label>
                      <Input value={bankingForm.account_number} onChange={e => setBankingForm(p => ({ ...p, account_number: e.target.value }))} placeholder="Account number" />
                    </div>
                    <div className="space-y-1">
                      <Label>Branch Code</Label>
                      <Input value={bankingForm.branch_code} onChange={e => setBankingForm(p => ({ ...p, branch_code: e.target.value }))} placeholder="e.g. 250655" />
                    </div>
                    <div className="space-y-1">
                      <Label>Account Type</Label>
                      <select
                        value={bankingForm.account_type}
                        onChange={e => setBankingForm(p => ({ ...p, account_type: e.target.value }))}
                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm"
                      >
                        <option value="cheque">Cheque / Current</option>
                        <option value="savings">Savings</option>
                        <option value="transmission">Transmission</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {hasBanking && <Button variant="outline" onClick={() => setShowBankingForm(false)}>Cancel</Button>}
                    <Button
                      onClick={handleSaveBanking}
                      disabled={isSavingBank || !bankingForm.account_holder || !bankingForm.bank_name || !bankingForm.account_number}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSavingBank ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      Save Banking Details
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Dispute Button for funded escrows */}
            {escrow.status === 'funded' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Raise a Dispute
                </h3>
                {showDisputeForm ? (
                  <div className="space-y-3">
                    <Textarea
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowDisputeForm(false)}>Cancel</Button>
                      <Button
                        onClick={handleDispute}
                        disabled={!disputeReason || updateMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                        Submit Dispute
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">If there's an issue with this transaction, you can raise a dispute to freeze funds pending resolution.</p>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setShowDisputeForm(true)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Raise a Dispute
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Buyer info card */}
        {isBuyer && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <User className="w-5 h-5 text-cyan-600" />
              Buyer View
            </h3>
            <p className="text-sm text-gray-600">
              You can manage and take action on this escrow from your <Link to={createPageUrl('Dashboard')} className="text-purple-600 underline">Dashboard</Link>.
            </p>
          </motion.div>
        )}

        {/* Unauthenticated prompt */}
        {!currentUser && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center">
            <Shield className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Sign in to Manage This Escrow</h3>
            <p className="text-sm text-gray-500 mb-4">Create or sign in to your EscroPay account to accept the agreement and manage this transaction.</p>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
            >
              Sign In / Create Account
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}