import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  CreditCard, 
  Building2, 
  Wallet,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Copy,
  Shield
} from 'lucide-react';
import { cn } from "@/lib/utils";

const paymentGateways = [
  {
    id: 'zaru',
    name: 'ZARU',
    description: 'Rand Stablecoin (via Luno)',
    icon: '🇿🇦',
    color: 'bg-emerald-100 border-emerald-200 hover:border-emerald-400',
    featured: true,
    instructions: 'Pay using ZARU stablecoin through Luno exchange. 1:1 with South African Rand.'
  },
  {
    id: 'stripe',
    name: 'Card Payment',
    description: 'Visa, Mastercard, Amex',
    icon: CreditCard,
    color: 'bg-blue-100 border-blue-200 hover:border-blue-400'
  },
  {
    id: 'payfast',
    name: 'PayFast',
    description: 'EFT, Credit Card, Mobicred',
    icon: '💳',
    color: 'bg-purple-100 border-purple-200 hover:border-purple-400'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'PayPal Balance or Card',
    icon: '🅿️',
    color: 'bg-indigo-100 border-indigo-200 hover:border-indigo-400'
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct EFT Payment',
    icon: Building2,
    color: 'bg-gray-100 border-gray-200 hover:border-gray-400'
  }
];

const bankDetails = {
  bankName: 'First National Bank',
  accountName: 'EscroPay Trust Account',
  accountNumber: '62XXXXXXXX',
  branchCode: '250655',
  reference: '' // Will be set dynamically
};

export default function PaymentModal({ isOpen, onClose, escrow, onPaymentComplete }) {
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [step, setStep] = useState('select'); // select, process, complete
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGatewaySelect = (gateway) => {
    setSelectedGateway(gateway);
    setStep('process');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);

    try {
      // Create payment record
      const payment = await base44.entities.Payment.create({
        escrow_id: escrow.id,
        amount: escrow.amount,
        currency: 'ZAR',
        gateway: selectedGateway.id,
        status: selectedGateway.id === 'bank_transfer' || selectedGateway.id === 'zaru' ? 'pending' : 'processing',
        payer_email: escrow.buyer_email,
        payer_name: escrow.buyer_name,
        gateway_reference: `PAY-${Date.now()}`
      });

      // Simulate gateway redirect for card payments
      if (selectedGateway.id === 'stripe' || selectedGateway.id === 'payfast' || selectedGateway.id === 'paypal') {
        // In production, redirect to actual gateway
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update payment as completed (simulated)
        await base44.entities.Payment.update(payment.id, { status: 'completed' });
      }

      setStep('complete');
      
      if (onPaymentComplete) {
        onPaymentComplete(payment);
      }
    } catch (err) {
      console.error('Payment failed:', err);
    }

    setIsProcessing(false);
  };

  const handleClose = () => {
    setSelectedGateway(null);
    setStep('select');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fund Escrow</h3>
              <p className="text-sm text-gray-500">{escrow?.title}</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="mt-4 p-3 bg-purple-50 rounded-xl flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount to pay</span>
            <span className="text-xl font-bold text-purple-600">
              R {escrow?.amount?.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Gateway */}
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <p className="text-sm text-gray-500 mb-4">Select payment method</p>
                {paymentGateways.map((gateway) => {
                  const Icon = typeof gateway.icon === 'string' ? null : gateway.icon;
                  return (
                    <button
                      key={gateway.id}
                      onClick={() => handleGatewaySelect(gateway)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left",
                        gateway.color
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-2xl shadow-sm">
                        {Icon ? <Icon className="w-6 h-6 text-gray-700" /> : gateway.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{gateway.name}</span>
                          {gateway.featured && (
                            <Badge className="bg-emerald-500 text-white text-xs">Recommended</Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{gateway.description}</span>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Step 2: Process Payment */}
            {step === 'process' && selectedGateway && (
              <motion.div
                key="process"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setStep('select')}
                  className="text-sm text-purple-600 hover:underline"
                >
                  ← Change payment method
                </button>

                {/* ZARU Instructions */}
                {selectedGateway.id === 'zaru' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <h4 className="font-medium text-emerald-800 mb-2">Pay with ZARU Stablecoin</h4>
                      <p className="text-sm text-emerald-700 mb-4">
                        ZARU is South Africa's Rand-pegged stablecoin. Send ZARU tokens via Luno to complete your payment.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Amount</span>
                          <span className="font-mono font-medium">{escrow?.amount} ZARU</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Wallet Address</span>
                          <button
                            onClick={() => handleCopy('0x1234...escropay')}
                            className="flex items-center gap-1 text-purple-600 hover:underline"
                          >
                            <span className="font-mono text-xs">0x1234...escropay</span>
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex justify-between p-2 bg-white rounded-lg">
                          <span className="text-gray-600">Reference</span>
                          <span className="font-mono text-xs">{escrow?.id}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href="https://www.luno.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-purple-600 hover:underline"
                    >
                      Open Luno <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Bank Transfer Instructions */}
                {selectedGateway.id === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3">Bank Transfer Details</h4>
                      <div className="space-y-2 text-sm">
                        {Object.entries({
                          'Bank': bankDetails.bankName,
                          'Account Name': bankDetails.accountName,
                          'Account Number': bankDetails.accountNumber,
                          'Branch Code': bankDetails.branchCode,
                          'Reference': escrow?.id
                        }).map(([label, value]) => (
                          <div key={label} className="flex justify-between items-center p-2 bg-white rounded-lg">
                            <span className="text-gray-600">{label}</span>
                            <button
                              onClick={() => handleCopy(value)}
                              className="flex items-center gap-1 font-mono text-gray-900 hover:text-purple-600"
                            >
                              {value}
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    {copied && (
                      <p className="text-center text-sm text-emerald-600">Copied to clipboard!</p>
                    )}
                  </div>
                )}

                {/* Card/Online Payments */}
                {(selectedGateway.id === 'stripe' || selectedGateway.id === 'payfast' || selectedGateway.id === 'paypal') && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      You'll be redirected to {selectedGateway.name} to complete your payment securely.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {selectedGateway.id === 'bank_transfer' || selectedGateway.id === 'zaru'
                    ? 'I\'ve Made the Payment'
                    : `Pay R ${escrow?.amount?.toLocaleString()}`}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedGateway?.id === 'bank_transfer' || selectedGateway?.id === 'zaru'
                    ? 'Payment Submitted'
                    : 'Payment Successful'}
                </h4>
                <p className="text-gray-500 mb-6">
                  {selectedGateway?.id === 'bank_transfer' || selectedGateway?.id === 'zaru'
                    ? 'Your payment is being verified. The escrow will be funded once confirmed.'
                    : 'The escrow has been funded successfully.'}
                </p>
                <Button onClick={handleClose} variant="outline">
                  Close
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}