import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileText,
  Lock,
  Users,
  Scale,
  Calculator,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Percent,
  Copy,
  Code,
  BookOpen
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";
const TERMS_PDF_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/f1c20a61e_Terms_Conditions_PolicyEscropay.pdf";

const feeTiers = [
  { min: 0, max: 100000, rate: 1.00, label: 'R0 - R100,000' },
  { min: 100001, max: 500000, rate: 0.85, label: 'R100,001 - R500,000' },
  { min: 500001, max: 1000000, rate: 0.65, label: 'R500,001 - R1,000,000' },
  { min: 1000001, max: 5000000, rate: 0.45, label: 'R1,000,001 - R5,000,000' },
  { min: 5000001, max: 10000000, rate: 0.35, label: 'R5,000,001 - R10,000,000' },
  { min: 10000001, max: Infinity, rate: 0.25, label: 'Greater than R10,000,000' }
];

const feePayerOptions = [
  { id: 'buyer', label: 'Buyer pays 100%' },
  { id: 'seller', label: 'Seller pays 100%' },
  { id: 'agent', label: 'Agent pays 100%' },
  { id: 'split_buyer_seller', label: 'Split: Buyer & Seller (50/50)' },
  { id: 'split_all', label: 'Split: Buyer, Seller & Agent (33/33/33)' }
];

function FeeCalculator() {
  const [amount, setAmount] = useState('');
  const [feePayer, setFeePayer] = useState('buyer');

  const calculateFee = (val) => {
    const numVal = parseFloat(val) || 0;
    const tier = feeTiers.find(t => numVal >= t.min && numVal <= t.max);
    if (!tier) return { fee: 0, rate: 0 };
    const fee = numVal * (tier.rate / 100);
    return { fee, rate: tier.rate };
  };

  const { fee, rate } = calculateFee(amount);

  const getFeeBreakdown = () => {
    switch (feePayer) {
      case 'buyer': return { buyer: fee, seller: 0, agent: 0 };
      case 'seller': return { buyer: 0, seller: fee, agent: 0 };
      case 'agent': return { buyer: 0, seller: 0, agent: fee };
      case 'split_buyer_seller': return { buyer: fee / 2, seller: fee / 2, agent: 0 };
      case 'split_all': return { buyer: fee / 3, seller: fee / 3, agent: fee / 3 };
      default: return { buyer: fee, seller: 0, agent: 0 };
    }
  };

  const breakdown = getFeeBreakdown();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Calculator className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Fee Calculator</h3>
          <p className="text-sm text-gray-500">Calculate escrow fees for your transaction</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Transaction Amount (ZAR)</label>
          <Input
            type="number"
            placeholder="Enter amount in Rands"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Fee Paid By</label>
          <div className="grid grid-cols-1 gap-2">
            {feePayerOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFeePayer(option.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  feePayer === option.id
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {amount && parseFloat(amount) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Fee Rate</span>
              <span className="font-semibold text-purple-600">{rate}%</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Total Fee</span>
              <span className="text-xl font-bold text-gray-900">R {fee.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
              {breakdown.buyer > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Buyer pays</span>
                  <span className="text-gray-900">R {breakdown.buyer.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {breakdown.seller > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Seller pays</span>
                  <span className="text-gray-900">R {breakdown.seller.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {breakdown.agent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Agent pays</span>
                  <span className="text-gray-900">R {breakdown.agent.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function Documentation() {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')}>
              <img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('ApiDocs')}>
                <Button variant="outline" className="border-purple-200 text-purple-600">
                  <Code className="w-4 h-4 mr-2" />
                  API Docs
                </Button>
              </Link>
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="bg-purple-100 text-purple-700 mb-4">Documentation</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escropay Documentation</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about using Escropay's secure escrow platform for your transactions.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white border border-gray-200 p-1 flex flex-wrap justify-center">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fees">Fees & Pricing</TabsTrigger>
            <TabsTrigger value="kyc">KYC & Compliance</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">What is Escropay?</h2>
                  <p className="text-gray-600 mb-4">
                    Escropay provides a digital escrow facilitation platform that enables parties to enter into conditional payment agreements. We hold funds securely until both parties confirm delivery.
                  </p>
                  <div className="space-y-3">
                    {[
                      'Facilitates escrow arrangements between users',
                      'Holds funds pending fulfillment of agreed conditions',
                      'Administers dispute resolution processes',
                      'Facilitates payout upon agreed release conditions'
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Registered Name</p>
                        <p className="font-medium">Escropay Financial Services (Pty) Ltd</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">CIPC Registration</p>
                        <p className="font-medium">2026/128185/07</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Jurisdiction</p>
                        <p className="font-medium">Republic of South Africa</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
                  <div className="space-y-4">
                    {[
                      { step: '1', title: 'Create Escrow', desc: 'Buyer creates an escrow with transaction details' },
                      { step: '2', title: 'Seller Accepts', desc: 'Seller reviews and accepts the escrow terms' },
                      { step: '3', title: 'Fund Escrow', desc: 'Buyer deposits funds into secure escrow account' },
                      { step: '4', title: 'Deliver & Confirm', desc: 'Seller delivers, buyer confirms satisfaction' },
                      { step: '5', title: 'Release Funds', desc: 'Funds released to seller upon confirmation' }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
                  <h3 className="font-semibold mb-2">Ready to integrate?</h3>
                  <p className="text-purple-200 text-sm mb-4">
                    Use our API to integrate Escropay into your marketplace or e-commerce platform.
                  </p>
                  <Link to={createPageUrl('ApiDocs')}>
                    <Button className="bg-white text-purple-700 hover:bg-gray-100">
                      View API Documentation
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Percent className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Fee Structure</h3>
                      <p className="text-sm text-gray-500">Tiered pricing based on transaction value</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-500">Transaction Range</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-500">Fee Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeTiers.map((tier, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-3 text-gray-900">{tier.label}</td>
                            <td className="py-3 text-right">
                              <Badge className="bg-purple-100 text-purple-700">{tier.rate}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">Fee Payment Options</h4>
                    <p className="text-sm text-gray-600">
                      Fees can be paid by the buyer, seller, agent (if applicable), or split equally between parties.
                    </p>
                  </div>
                </div>
              </div>

              <FeeCalculator />
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">KYC Requirements</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">For Individuals</h4>
                    <ul className="space-y-2">
                      {[
                        'Valid South African ID, passport, or driver\'s license',
                        'Proof of residential address (utility bill, bank statement - not older than 3 months)',
                        'Contact information (phone and email)'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">For Businesses</h4>
                    <ul className="space-y-2">
                      {[
                        'Certificate of Incorporation or CIPC registration',
                        'Memorandum and Articles of Association',
                        'Proof of physical business address',
                        'List of directors/beneficial owners with their IDs'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">AML/CTF Compliance</h3>
                </div>

                <p className="text-gray-600 mb-4">
                  Escropay complies with the Financial Intelligence Centre Act (FICA) and implements a risk-based AML framework including:
                </p>

                <ul className="space-y-2">
                  {[
                    'Customer Due Diligence (CDD)',
                    'Enhanced Due Diligence (EDD) for high-risk customers',
                    'Politically Exposed Person (PEP) screening',
                    'Sanctions screening',
                    'Ongoing transaction monitoring',
                    'Suspicious Transaction Reporting (STR)'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Lock className="w-4 h-4 text-purple-600 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <a
                href={TERMS_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600">Terms & Conditions</h3>
                <p className="text-sm text-gray-500">
                  Complete terms governing the use of Escropay platform.
                </p>
                <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                  View PDF <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </a>

              <a
                href={TERMS_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-cyan-100 rounded-xl w-fit mb-4">
                  <Lock className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600">Privacy Policy</h3>
                <p className="text-sm text-gray-500">
                  How we collect, use, and protect your personal information.
                </p>
                <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                  View PDF <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </a>

              <a
                href={TERMS_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-emerald-100 rounded-xl w-fit mb-4">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600">AML/CTF/KYC Policy</h3>
                <p className="text-sm text-gray-500">
                  Anti-money laundering and know-your-customer procedures.
                </p>
                <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
                  View PDF <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </a>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={LOGO_URL} alt="Escropay" className="h-8" />
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">Terms & Conditions</a>
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">Privacy Policy</a>
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">AML/KYC Policy</a>
            </div>
            <p className="text-sm text-gray-500">© 2026 Escropay Financial Services (Pty) Ltd</p>
          </div>
        </div>
      </footer>
    </div>
  );
}