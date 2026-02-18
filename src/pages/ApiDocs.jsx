import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Code,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Zap,
  Globe,
  Key,
  BookOpen,
  Terminal,
  ChevronRight
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";
const TERMS_PDF_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/06b03272a_TermsConditionsAMLCTFKYCPrivacyPolicyEscropay.pdf";

const codeExamples = {
  createEscrow: `// Create a new escrow
const response = await fetch('https://api.escropay.app/v1/escrows', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Website Development Project',
    description: 'Full stack web application development',
    amount: 50000, // Amount in ZAR cents (R500.00)
    currency: 'ZAR',
    buyer_email: 'buyer@example.com',
    seller_email: 'seller@example.com',
    due_date: '2026-03-15',
    fee_payer: 'buyer', // buyer, seller, split
    webhook_url: 'https://yoursite.com/webhooks/escropay',
    metadata: {
      order_id: 'ORD-12345',
      product_sku: 'WEB-DEV-001'
    }
  })
});

const escrow = await response.json();
console.log(escrow.id); // esc_abc123...`,

  getEscrow: `// Get escrow details
const response = await fetch('https://api.escropay.app/v1/escrows/esc_abc123', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const escrow = await response.json();
// {
//   id: 'esc_abc123',
//   status: 'funded',
//   amount: 50000,
//   buyer_email: 'buyer@example.com',
//   ...
// }`,

  releaseEscrow: `// Release funds to seller
const response = await fetch('https://api.escropay.app/v1/escrows/esc_abc123/release', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    confirmation_code: 'BUYER_CONFIRMATION_CODE' // Optional
  })
});

const result = await response.json();
// { success: true, status: 'released', released_at: '2026-02-18T...' }`,

  webhook: `// Webhook payload example
{
  "event": "escrow.funded",
  "data": {
    "id": "esc_abc123",
    "status": "funded",
    "amount": 50000,
    "currency": "ZAR",
    "funded_at": "2026-02-18T10:30:00Z",
    "buyer_email": "buyer@example.com",
    "seller_email": "seller@example.com"
  },
  "timestamp": "2026-02-18T10:30:00Z",
  "signature": "sha256_hmac_signature..."
}

// Webhook events:
// - escrow.created
// - escrow.funded
// - escrow.released
// - escrow.disputed
// - escrow.refunded
// - milestone.completed
// - milestone.approved`
};

function CodeBlock({ code, language = 'javascript' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}

export default function ApiDocs() {
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
              <Link to={createPageUrl('Documentation')}>
                <Button variant="outline" className="border-purple-200 text-purple-600">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">
            <Terminal className="w-3 h-3 mr-1" />
            REST API
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escropay API</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Integrate secure escrow payments into your marketplace, e-commerce platform, or any application with our simple REST API.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Shield, title: 'Secure', desc: 'Bank-grade security with encrypted API keys' },
            { icon: Zap, title: 'Fast', desc: 'Low latency API responses under 100ms' },
            { icon: Globe, title: 'Scalable', desc: 'Handle millions of transactions seamlessly' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="p-2 bg-purple-100 rounded-lg w-fit mb-3">
                <feature.icon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Authentication */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Authentication</h2>
          </div>
          <p className="text-gray-600 mb-4">
            All API requests must include your API key in the Authorization header:
          </p>
          <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} />
          <p className="text-sm text-gray-500 mt-4">
            Get your API key from the <Link to={createPageUrl('Profile')} className="text-purple-600 hover:underline">Settings</Link> page in your dashboard. Keep your API key secure and never expose it in client-side code.
          </p>
        </div>

        {/* API Endpoints */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Base URL</h2>
          <CodeBlock code={`https://api.escropay.app/v1`} />
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 flex flex-wrap">
            <TabsTrigger value="create">Create Escrow</TabsTrigger>
            <TabsTrigger value="get">Get Escrow</TabsTrigger>
            <TabsTrigger value="release">Release Funds</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-emerald-100 text-emerald-700">POST</Badge>
                <code className="text-gray-900 font-mono">/escrows</code>
              </div>
              <p className="text-gray-600 mb-6">
                Create a new escrow transaction. The buyer will receive an email with payment instructions.
              </p>
              <CodeBlock code={codeExamples.createEscrow} />

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Request Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500">Parameter</th>
                        <th className="text-left py-2 text-gray-500">Type</th>
                        <th className="text-left py-2 text-gray-500">Required</th>
                        <th className="text-left py-2 text-gray-500">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['title', 'string', 'Yes', 'Title of the escrow transaction'],
                        ['amount', 'integer', 'Yes', 'Amount in ZAR cents'],
                        ['buyer_email', 'string', 'Yes', 'Email of the buyer'],
                        ['seller_email', 'string', 'Yes', 'Email of the seller'],
                        ['description', 'string', 'No', 'Detailed description'],
                        ['due_date', 'string', 'No', 'ISO 8601 date'],
                        ['fee_payer', 'string', 'No', 'buyer, seller, or split'],
                        ['webhook_url', 'string', 'No', 'URL for webhook notifications'],
                        ['metadata', 'object', 'No', 'Custom key-value data']
                      ].map(([param, type, req, desc]) => (
                        <tr key={param} className="border-b border-gray-100">
                          <td className="py-2 font-mono text-purple-600">{param}</td>
                          <td className="py-2 text-gray-600">{type}</td>
                          <td className="py-2">
                            <Badge className={req === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}>
                              {req}
                            </Badge>
                          </td>
                          <td className="py-2 text-gray-600">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="get">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-blue-100 text-blue-700">GET</Badge>
                <code className="text-gray-900 font-mono">/escrows/:id</code>
              </div>
              <p className="text-gray-600 mb-6">
                Retrieve details of a specific escrow transaction.
              </p>
              <CodeBlock code={codeExamples.getEscrow} />
            </div>
          </TabsContent>

          <TabsContent value="release">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-emerald-100 text-emerald-700">POST</Badge>
                <code className="text-gray-900 font-mono">/escrows/:id/release</code>
              </div>
              <p className="text-gray-600 mb-6">
                Release the escrowed funds to the seller. Only the buyer or an authorized party can call this endpoint.
              </p>
              <CodeBlock code={codeExamples.releaseEscrow} />
            </div>
          </TabsContent>

          <TabsContent value="webhooks">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Events</h3>
              <p className="text-gray-600 mb-6">
                Receive real-time notifications about escrow events. Configure your webhook URL when creating an escrow or in your account settings.
              </p>
              <CodeBlock code={codeExamples.webhook} />

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2">Verifying Webhook Signatures</h4>
                <p className="text-sm text-amber-700">
                  Always verify the webhook signature using your webhook secret to ensure the request is from Escropay. The signature is included in the <code className="bg-amber-100 px-1 rounded">X-Escropay-Signature</code> header.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* SDK Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Help Integrating?</h3>
              <p className="text-purple-200">
                Contact our integration team for assistance with your implementation.
              </p>
            </div>
            <a href="mailto:api@escropay.app">
              <Button className="bg-white text-purple-700 hover:bg-gray-100">
                Contact Integration Team
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={LOGO_URL} alt="Escropay" className="h-8" />
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">Terms & Conditions</a>
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">Privacy Policy</a>
            </div>
            <p className="text-sm text-gray-500">© 2026 Escropay Financial Services (Pty) Ltd</p>
          </div>
        </div>
      </footer>
    </div>
  );
}