import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  TrendingUp,
  AlertTriangle,
  Info,
  ChevronRight,
  Wallet,
  Clock,
  Percent
} from 'lucide-react';
import { cn } from "@/lib/utils";

const TERM_FEES = { 30: 0.03, 60: 0.06, 90: 0.09 };

function calculateCRS(escrows) {
  if (!escrows || escrows.length === 0) return 0;
  const completed = escrows.filter(e => e.status === 'released');
  const disputed = escrows.filter(e => e.status === 'disputed');
  const totalValue = escrows.reduce((s, e) => s + (e.amount || 0), 0);

  const tvScore = Math.min(100, (totalValue / 500000) * 100);
  const tfScore = Math.min(100, (completed.length / 20) * 100);
  const ecrScore = escrows.length > 0 ? ((completed.length / escrows.length) * 100) : 0;
  const cfsScore = Math.min(100, (escrows.length / 10) * 100);
  const wbbScore = Math.min(100, (totalValue / 200000) * 100);
  const ecdScore = 50; // placeholder until bureau integration

  const crs = (tvScore * 0.25) + (tfScore * 0.15) + (ecrScore * 0.20) +
              (cfsScore * 0.20) + (wbbScore * 0.10) + (ecdScore * 0.10);
  return Math.round(crs);
}

function getRiskLevel(crs) {
  if (crs >= 80) return { label: 'Low Risk', multiplier: 0.60, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
  if (crs >= 70) return { label: 'Medium Risk', multiplier: 0.40, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
  if (crs >= 60) return { label: 'Moderate Risk', multiplier: 0.25, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  if (crs >= 50) return { label: 'High Risk', multiplier: 0.10, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
  return { label: 'Not Eligible', multiplier: 0, color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
}

function checkEligibility(user, escrows) {
  const issues = [];
  const completed = escrows.filter(e => e.status === 'released');
  const openDisputes = escrows.filter(e => e.status === 'disputed');

  if (user?.kyc_status !== 'verified') issues.push('KYC verification required');
  if (completed.length < 5) issues.push(`Need ${5 - completed.length} more completed transactions (have ${completed.length})`);

  const accountAge = user?.created_date
    ? Math.floor((Date.now() - new Date(user.created_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  if (accountAge < 60) issues.push(`Account must be 60+ days old (${accountAge} days)`);
  if (openDisputes.length > 0) issues.push('Resolve open disputes first');

  return issues;
}

export default function CreditApplicationModal({ isOpen, onClose, escrow, onCreditApproved }) {
  const [step, setStep] = useState('assess'); // assess, offer, terms, review, complete, ineligible
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [escrows, setEscrows] = useState([]);
  const [crs, setCrs] = useState(0);
  const [creditLimit, setCreditLimit] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [eligibilityIssues, setEligibilityIssues] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep('assess');
    setIsLoading(true);

    Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Escrow.list('-created_date').catch(() => [])
    ]).then(([u, allEscrows]) => {
      setUser(u);
      const userEscrows = allEscrows.filter(e =>
        e.buyer_email === u?.email || e.seller_email === u?.email
      );
      setEscrows(userEscrows);

      const issues = checkEligibility(u, userEscrows);
      setEligibilityIssues(issues);

      if (issues.length === 0) {
        const score = calculateCRS(userEscrows);
        const risk = getRiskLevel(score);
        const completedEscrows = userEscrows.filter(e => e.status === 'released');
        const totalValue = completedEscrows.reduce((s, e) => s + (e.amount || 0), 0);
        const avgMonthly = totalValue / Math.max(1, completedEscrows.length / 2);
        const limit = Math.floor(avgMonthly * risk.multiplier / 1000) * 1000;

        setCrs(score);
        setCreditLimit(limit);

        if (risk.multiplier === 0) {
          setStep('ineligible');
        } else {
          setStep('offer');
        }
      } else {
        setStep('ineligible');
      }
      setIsLoading(false);
    });
  }, [isOpen]);

  const risk = getRiskLevel(crs);
  const fee = selectedAmount && selectedTerm ? selectedAmount * TERM_FEES[selectedTerm] : 0;
  const totalRepayment = selectedAmount + fee;

  const presetAmounts = [
    Math.min(5000, creditLimit),
    Math.min(10000, creditLimit),
    Math.min(20000, creditLimit),
    creditLimit
  ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i);

  const handleApply = async () => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    // Create a payment record for the credit
    await base44.entities.Payment.create({
      escrow_id: escrow.id,
      amount: selectedAmount,
      currency: 'ZAR',
      gateway: 'credit',
      status: 'completed',
      payer_email: user?.email,
      payer_name: user?.full_name,
      gateway_reference: `CREDIT-${Date.now()}`,
      metadata: {
        credit_type: 'escropay_credit',
        crs,
        term_days: selectedTerm,
        service_fee: fee,
        total_repayment: totalRepayment,
        repayment_rate: 0.15
      }
    });
    setIsSubmitting(false);
    setStep('complete');
    if (onCreditApproved) onCreditApproved(selectedAmount);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">EscroPay Credit</h3>
                <p className="text-xs text-gray-500">Transaction-backed lending</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* Loading */}
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Analysing your transaction history...</p>
                <p className="text-sm text-gray-400 mt-1">Calculating Credit Reliability Score</p>
              </motion.div>
            )}

            {/* Ineligible */}
            {step === 'ineligible' && !isLoading && (
              <motion.div key="ineligible" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Not Yet Eligible</h4>
                  <p className="text-sm text-gray-500">Complete the requirements below to unlock EscroPay Credit</p>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'KYC Verified', done: user?.kyc_status === 'verified' },
                    { label: '5+ Completed Transactions', done: escrows.filter(e => e.status === 'released').length >= 5 },
                    { label: 'Account 60+ Days Old', done: user?.created_date && Math.floor((Date.now() - new Date(user.created_date).getTime()) / 86400000) >= 60 },
                    { label: 'No Open Disputes', done: escrows.filter(e => e.status === 'disputed').length === 0 },
                  ].map((req, i) => (
                    <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border", req.done ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
                      {req.done
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                      <span className={cn("text-sm font-medium", req.done ? "text-emerald-700" : "text-red-700")}>{req.label}</span>
                    </div>
                  ))}
                </div>

                <Button onClick={onClose} variant="outline" className="w-full mt-4">Got it</Button>
              </motion.div>
            )}

            {/* Offer */}
            {step === 'offer' && (
              <motion.div key="offer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* CRS Score */}
                <div className={cn("p-4 rounded-xl border", risk.bg)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Credit Reliability Score (CRS)</span>
                    <Badge className={cn("font-bold", risk.color, risk.bg, "border")}>{risk.label}</Badge>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-gray-900">{crs}</span>
                    <span className="text-gray-400 mb-1">/ 100</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-1000"
                      style={{ width: `${crs}%` }}
                    />
                  </div>
                </div>

                {/* Credit Limit */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Available Credit</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-700">
                    R {creditLimit.toLocaleString('en-ZA')}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Based on {risk.multiplier * 100}% of your avg monthly transaction value
                  </p>
                </div>

                {/* Select Amount */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Select Loan Amount</p>
                  <div className="grid grid-cols-2 gap-2">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setSelectedAmount(amt)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center font-semibold",
                          selectedAmount === amt
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        )}
                      >
                        R {amt.toLocaleString('en-ZA')}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setStep('terms')}
                  disabled={!selectedAmount}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Credit is locked to this escrow transaction only. Funds cannot be withdrawn as cash.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Terms */}
            {step === 'terms' && (
              <motion.div key="terms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <button onClick={() => setStep('offer')} className="text-sm text-purple-600 hover:underline">← Back</button>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Select Repayment Term</p>
                  <div className="space-y-2">
                    {Object.entries(TERM_FEES).map(([days, feeRate]) => {
                      const f = selectedAmount * feeRate;
                      return (
                        <button
                          key={days}
                          onClick={() => setSelectedTerm(Number(days))}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between",
                            selectedTerm === Number(days)
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className={cn("w-5 h-5", selectedTerm === Number(days) ? "text-purple-600" : "text-gray-400")} />
                            <div className="text-left">
                              <p className="font-semibold text-gray-900">{days} days</p>
                              <p className="text-xs text-gray-500">Flat fee: {(feeRate * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">Fee: R {f.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-500">Total: R {(selectedAmount + f).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Repayment Method</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Revenue Share:</span> 15% of every incoming payment is automatically deducted until the loan is repaid.
                  </p>
                  <div className="text-xs text-gray-400 space-y-1 pt-1 border-t border-gray-200 mt-2">
                    <p>Example: You receive R10,000 → EscroPay deducts R1,500 → You keep R8,500</p>
                  </div>
                </div>

                <Button
                  onClick={() => setStep('review')}
                  disabled={!selectedTerm}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Review Application <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* Review */}
            {step === 'review' && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => setStep('terms')} className="text-sm text-purple-600 hover:underline">← Back</button>

                <h4 className="font-semibold text-gray-900">Loan Summary</h4>

                <div className="space-y-2 text-sm">
                  {[
                    ['Escrow Transaction', escrow?.title],
                    ['Loan Amount', `R ${selectedAmount?.toLocaleString('en-ZA')}`],
                    ['Repayment Term', `${selectedTerm} days`],
                    ['Service Fee', `R ${fee?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} (${(TERM_FEES[selectedTerm] * 100).toFixed(0)}%)`],
                    ['Total Repayment', `R ${totalRepayment?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`],
                    ['Auto-Deduction Rate', '15% of incoming payments'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    By applying, you agree that funds are locked to this escrow, repayment is auto-deducted from inflows, and missed payments may result in account restrictions.
                  </p>
                </div>

                <Button
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirm & Apply for Credit
                </Button>
              </motion.div>
            )}

            {/* Complete */}
            {step === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-4">
                <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Credit Approved!</h4>
                  <p className="text-gray-500 mt-1">
                    R {selectedAmount?.toLocaleString('en-ZA')} has been applied to your escrow.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loan Amount</span>
                    <span className="font-semibold">R {selectedAmount?.toLocaleString('en-ZA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Repayment</span>
                    <span className="font-semibold">R {totalRepayment?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Auto-deduction</span>
                    <span className="font-semibold">15% of inflows</span>
                  </div>
                </div>
                <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700">Done</Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}