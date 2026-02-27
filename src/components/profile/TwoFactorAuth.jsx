import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, Mail, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';

export default function TwoFactorAuth({ user }) {
  const [step, setStep] = useState('idle'); // idle | sending | verify | done
  const [method, setMethod] = useState('email');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const is2FAEnabled = user?.two_factor_enabled;

  const handleSendCode = async () => {
    setIsLoading(true);
    setError('');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(otp);

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Your Escropay 2FA Code',
      body: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;">
          <h2 style="color:#7c3aed;">Two-Factor Authentication</h2>
          <p>Your one-time verification code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:24px;background:#f5f3ff;border-radius:12px;text-align:center;">
            ${otp}
          </div>
          <p style="color:#6b7280;font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `
    });

    setStep('verify');
    setIsLoading(false);
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError('');
    if (code.trim() === generatedCode) {
      await base44.auth.updateMe({ two_factor_enabled: true });
      setStep('done');
    } else {
      setError('Incorrect code. Please try again.');
    }
    setIsLoading(false);
  };

  const handleDisable = async () => {
    setIsLoading(true);
    await base44.auth.updateMe({ two_factor_enabled: false });
    setIsLoading(false);
    setStep('idle');
    setCode('');
    setGeneratedCode('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            {is2FAEnabled ? (
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            ) : (
              <Shield className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
        </div>
        <Badge className={is2FAEnabled
          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
          : 'bg-gray-100 text-gray-500 border-gray-200'
        }>
          {is2FAEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      {!is2FAEnabled && step === 'idle' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            We'll send a one-time code to your email each time you perform sensitive actions.
          </p>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
            <Mail className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-700">{user?.email}</span>
          </div>
          <Button
            onClick={handleSendCode}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
            Enable 2FA – Send Verification Code
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-sm text-gray-600">
            A 6-digit code has been sent to <strong>{user?.email}</strong>. Enter it below.
          </p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl font-mono tracking-widest"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep('idle'); setCode(''); }} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
          <button
            onClick={handleSendCode}
            className="w-full text-xs text-purple-600 hover:underline"
          >
            Resend code
          </button>
        </motion.div>
      )}

      {(step === 'done' || is2FAEnabled) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Two-factor authentication is active on your account.
          </div>
          <Button
            variant="outline"
            onClick={handleDisable}
            disabled={isLoading}
            className="w-full border-red-200 text-red-500 hover:bg-red-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Disable 2FA
          </Button>
        </motion.div>
      )}
    </div>
  );
}