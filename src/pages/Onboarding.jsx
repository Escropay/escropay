import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from '@/api/base44Client';
import { 
  Shield, CheckCircle2, ArrowRight, ArrowLeft, User, Building2, 
  Phone, MapPin, FileText, Lock, Zap, Globe, Loader2, Upload
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";
const TERMS_PDF_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/f1c20a61e_Terms_Conditions_PolicyEscropay.pdf";

const STEPS = [
  { id: 'welcome',    title: 'Welcome',         icon: Shield },
  { id: 'profile',   title: 'Your Profile',    icon: User },
  { id: 'account',   title: 'Account Type',    icon: Building2 },
  { id: 'kyc',       title: 'Verify Identity', icon: FileText },
  { id: 'terms',     title: 'Terms & Policy',  icon: Lock },
  { id: 'complete',  title: 'All Done!',       icon: CheckCircle2 },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    company: '',
    city: '',
    country: 'South Africa',
    account_type: 'individual', // individual | business
    kyc_documents: [],
    agreed_terms: false,
    agreed_privacy: false,
    agreed_aml: false,
    onboarding_complete: true,
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleDocUpload = async (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(docType);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = form.kyc_documents.filter(d => d.type !== docType);
    update('kyc_documents', [...existing, { type: docType, url: file_url, uploaded_at: new Date().toISOString(), status: 'pending' }]);
    setUploadingDoc(null);
  };

  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setLoading(true);
    // Set account to PENDING_COMPLIANCE_APPROVAL — no transacting until approved
    await base44.auth.updateMe({
      ...form,
      kyc_status: form.kyc_documents.length > 0 ? 'pending' : 'not_started',
      account_status: 'pending_compliance_approval',
      onboarding_complete: true,
    });
    // Trigger compliance engine to run initial risk scoring
    const user = await base44.auth.me();
    if (user?.id) {
      base44.functions.invoke('runOnboardingCompliance', {
        user_id: user.id,
        user_email: user.email
      }).catch(() => {}); // fire-and-forget
    }
    window.location.href = '/Dashboard';
  };

  const canProceed = () => {
    if (step === 1) return form.full_name.trim().length > 1;
    if (step === 4) return form.agreed_terms && form.agreed_privacy && form.agreed_aml;
    return true;
  };

  const individualDocs = [
    { id: 'national_id', label: 'SA ID / Passport', desc: 'Clear copy of your ID or passport' },
    { id: 'proof_of_address', label: 'Proof of Address', desc: 'Utility bill or bank statement (< 3 months)' },
  ];
  const businessDocs = [
    { id: 'cipc_cert', label: 'CIPC Certificate', desc: 'Certificate of Incorporation' },
    { id: 'proof_of_address', label: 'Business Address Proof', desc: 'Utility bill or lease agreement' },
    { id: 'director_id', label: "Director's ID", desc: "Valid ID of all directors/beneficial owners" },
  ];
  const kycDocs = form.account_type === 'business' ? businessDocs : individualDocs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex flex-col">
      {/* BG blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex items-center justify-between">
        <img src={LOGO_URL} alt="EscroPay" className="h-8 md:h-10 w-auto" />
        <span className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}</span>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 px-6 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={s.id} className={`text-xs hidden sm:block ${i === step ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
                {s.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
            >
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-purple-500/20">
                    <Shield className="w-10 h-10 text-purple-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to EscroPay!</h1>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    South Africa's most trusted digital escrow platform. Let's set up your account in just a few minutes — it's quick, secure, and FICA-compliant.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { icon: Shield, label: 'Secure Escrow', color: 'bg-purple-100 text-purple-600' },
                      { icon: Zap, label: 'Fast Release', color: 'bg-cyan-100 text-cyan-600' },
                      { icon: Globe, label: 'SA Regulated', color: 'bg-emerald-100 text-emerald-600' },
                    ].map((item, i) => (
                      <div key={i} className={`p-3 rounded-xl ${item.color} text-center`}>
                        <item.icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Operated by Escropay Financial Services (Pty) Ltd · COR: 2026/128185/07 · KYC | AML | FICA compliant
                  </p>
                </div>
              )}

              {/* Step 1: Profile */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl"><User className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
                      <p className="text-sm text-gray-500">Tell us a bit about yourself</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="As on your ID document" className="mt-1" />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+27 60 929 2499" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>City</Label>
                        <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Johannesburg" className="mt-1" />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input value={form.country} onChange={e => update('country', e.target.value)} placeholder="South Africa" className="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Account Type */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl"><Building2 className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Account Type</h2>
                      <p className="text-sm text-gray-500">How will you primarily use EscroPay?</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'individual', label: 'Individual', desc: 'Personal transactions, buying/selling goods or services', icon: User },
                      { id: 'business', label: 'Business', desc: 'Company transactions, marketplaces, contracts', icon: Building2 },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => update('account_type', opt.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${
                          form.account_type === opt.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${form.account_type === opt.id ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <opt.icon className={`w-5 h-5 ${form.account_type === opt.id ? 'text-purple-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className={`font-semibold ${form.account_type === opt.id ? 'text-purple-700' : 'text-gray-900'}`}>{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.desc}</p>
                        </div>
                        {form.account_type === opt.id && <CheckCircle2 className="w-5 h-5 text-purple-600 ml-auto mt-0.5" />}
                      </button>
                    ))}
                    {form.account_type === 'business' && (
                      <div className="mt-2">
                        <Label>Company Name</Label>
                        <Input value={form.company} onChange={e => update('company', e.target.value)} placeholder="Company (Pty) Ltd" className="mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: KYC */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-purple-100 rounded-xl"><FileText className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Verify Your Identity</h2>
                      <p className="text-sm text-gray-500">Required by FICA regulations (you can also do this later)</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
                    Your documents are encrypted and reviewed by our compliance team only. We comply with POPIA data protection laws.
                  </p>
                  <div className="space-y-3">
                    {kycDocs.map(doc => {
                      const uploaded = form.kyc_documents.find(d => d.type === doc.id);
                      return (
                        <div key={doc.id} className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${uploaded ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'}`}>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{doc.label}</p>
                            <p className="text-xs text-gray-500">{doc.desc}</p>
                          </div>
                          {uploaded ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <label className="cursor-pointer">
                              <input type="file" accept="image/*,.pdf" onChange={e => handleDocUpload(doc.id, e)} className="hidden" />
                              <span className="flex items-center gap-1 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">
                                {uploadingDoc === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Upload
                              </span>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">You can skip this step and complete KYC later in your Profile settings.</p>
                </div>
              )}

              {/* Step 4: Terms */}
              {step === 4 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl"><Lock className="w-5 h-5 text-purple-600" /></div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Terms & Policies</h2>
                      <p className="text-sm text-gray-500">Please read and accept before continuing</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm text-gray-600 space-y-2 max-h-40 overflow-y-auto border border-gray-200">
                    <p className="font-semibold text-gray-800">Key highlights from our Terms (Updated: 16/02/2026):</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Escropay holds funds securely in segregated accounts with ABSA, FNB, Nedbank, Standard Bank, Capitec & Investec.</li>
                      <li>You must be 18+ with legal capacity to contract.</li>
                      <li>Fees are disclosed before each escrow is created and are non-refundable.</li>
                      <li>Disputes are handled by Escropay — decisions are final unless required by law.</li>
                      <li>Your data is protected under POPIA and retained for 5 years as required by FICA.</li>
                      <li>Governed by the laws of the Republic of South Africa.</li>
                    </ul>
                    <p className="text-xs">Escropay Financial Services (Pty) Ltd · CIPC: 2026/128185/07</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { key: 'agreed_terms', label: 'I have read and agree to the', link: 'Terms & Conditions', url: TERMS_PDF_URL },
                      { key: 'agreed_privacy', label: 'I agree to the', link: 'Privacy Policy (POPIA)', url: TERMS_PDF_URL },
                      { key: 'agreed_aml', label: 'I understand the', link: 'AML / KYC / CTF / FICA requirements', url: TERMS_PDF_URL },
                    ].map(item => (
                      <div key={item.key} className="flex items-start gap-3">
                        <Checkbox
                          checked={form[item.key]}
                          onCheckedChange={val => update(item.key, val)}
                          className="mt-0.5"
                        />
                        <label className="text-sm text-gray-700 cursor-pointer" onClick={() => update(item.key, !form[item.key])}>
                          {item.label}{' '}
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline" onClick={e => e.stopPropagation()}>
                            {item.link}
                          </a>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Complete */}
              {step === 5 && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set, {form.full_name.split(' ')[0] || 'there'}! 🎉</h2>
                  <p className="text-gray-500 mb-6 leading-relaxed">
                    Your EscroPay account is ready. Start creating secure escrow transactions right away.
                  </p>
                  {form.kyc_documents.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                      <p className="text-sm text-amber-700 font-medium">⚠️ KYC not yet submitted</p>
                      <p className="text-xs text-amber-600 mt-1">You can complete your identity verification in your Profile settings. High-value transactions may be limited until KYC is approved.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3 text-center text-sm mb-2">
                    {[
                      { label: 'Create Escrow', desc: 'Set up your first transaction' },
                      { label: 'Invite Parties', desc: 'Add buyers & sellers' },
                      { label: 'Track Progress', desc: 'Monitor milestones' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="font-semibold text-purple-700 text-xs">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className={`flex gap-3 mt-8 ${step === 0 ? 'justify-center' : 'justify-between'}`}>
                {step > 0 && step < 5 && (
                  <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Button>
                )}
                {step < 4 && (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2 ${step === 0 ? 'px-10' : 'flex-1'}`}
                  >
                    {step === 0 ? 'Get Started' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                {step === 4 && (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2"
                  >
                    Accept & Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                {step === 5 && (
                  <Button
                    onClick={handleFinish}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg py-3"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
              {step === 3 && (
                <button onClick={handleNext} className="w-full text-center text-sm text-gray-400 hover:text-purple-600 mt-3">
                  Skip for now →
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}