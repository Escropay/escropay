import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Code, Copy, CheckCircle2, Shield, Zap, Globe, Key,
  BookOpen, Terminal, ChevronRight, AlertTriangle, ArrowRight,
  Wallet, FileText, RefreshCw, Lock
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";
const TERMS_PDF_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/06b03272a_TermsConditionsAMLCTFKYCPrivacyPolicyEscropay.pdf";

const BASE_URL = 'https://api.escropay.app/v1';

// ─── Code Examples ───────────────────────────────────────────────────────────

const examples = {
  createEscrow: `// POST /v1/escrows — Create a new escrow
const response = await fetch('${BASE_URL}/escrows', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Website Development Project',
    description: 'Full stack web application, 8 weeks delivery',
    amount: 50000,          // Amount in ZAR (whole rands, e.g. R 50,000.00)
    currency: 'ZAR',
    buyer_email: 'buyer@example.com',
    buyer_name: 'Acme Corp',
    seller_email: 'seller@example.com',
    seller_name: 'Dev Studio',
    due_date: '2026-06-15', // ISO 8601 date
    fee_payer: 'buyer',     // buyer | seller | split_buyer_seller
    webhook_url: 'https://yoursite.com/webhooks/escropay',
    metadata: {
      order_id: 'ORD-12345',
      platform: 'your_marketplace'
    }
  })
});

const escrow = await response.json();
// Response:
// {
//   "id": "69abc123...",
//   "transaction_id": "ESC-20260315-001",
//   "status": "pending_seller_acceptance",
//   "amount": 50000,
//   "fee_amount": 500,
//   "title": "Website Development Project",
//   "buyer_email": "buyer@example.com",
//   "seller_email": "seller@example.com",
//   "created_date": "2026-03-15T08:00:00Z"
// }`,

  listEscrows: `// GET /v1/escrows — List all escrows for your merchant account
const response = await fetch(
  '${BASE_URL}/escrows?status=funded&limit=20&offset=0',
  {
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
  }
);

const { escrows, total, limit, offset } = await response.json();
// Supported status filters:
//   pending_seller_acceptance | pending | funded |
//   released | disputed | refunded | rejected_by_seller`,

  getEscrow: `// GET /v1/escrows/:id — Get a single escrow
const response = await fetch('${BASE_URL}/escrows/69abc123', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

const escrow = await response.json();
// {
//   "id": "69abc123",
//   "status": "funded",
//   "amount": 50000,
//   "fee_amount": 500,
//   "currency": "ZAR",
//   "buyer_email": "buyer@example.com",
//   "seller_email": "seller@example.com",
//   "funded_at": "2026-03-16T10:00:00Z",
//   "milestones": [],
//   "metadata": { "order_id": "ORD-12345" }
// }`,

  releaseEscrow: `// POST /v1/escrows/:id/release — Release funds to seller
// Only callable when status === 'funded'
const response = await fetch('${BASE_URL}/escrows/69abc123/release', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notes: 'Delivery confirmed by buyer'  // optional
  })
});

const result = await response.json();
// {
//   "success": true,
//   "status": "released",
//   "released_at": "2026-03-20T14:00:00Z"
// }`,

  disputeEscrow: `// POST /v1/escrows/:id/dispute — Raise a dispute
// Only callable when status === 'funded'
const response = await fetch('${BASE_URL}/escrows/69abc123/dispute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Goods not delivered as described',
    raised_by: 'buyer@example.com'
  })
});

const result = await response.json();
// { "success": true, "status": "disputed", "disputed_at": "..." }`,

  milestones: `// Create escrow with milestones
const response = await fetch('${BASE_URL}/escrows', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'App Development — 3 Milestones',
    amount: 120000,
    buyer_email: 'buyer@example.com',
    seller_email: 'seller@example.com',
    fee_payer: 'buyer',
    milestones: [
      {
        title: 'UI/UX Design',
        description: 'Wireframes and final design approved',
        amount: 30000,
        due_date: '2026-04-01'
      },
      {
        title: 'Backend Development',
        description: 'API and database complete',
        amount: 60000,
        due_date: '2026-05-15'
      },
      {
        title: 'Testing & Launch',
        description: 'QA, bug fixes, go-live',
        amount: 30000,
        due_date: '2026-06-15'
      }
    ]
  })
});`,

  webhook: `// Webhook payload — example: escrow.funded
{
  "event": "escrow.funded",
  "api_version": "v1",
  "timestamp": "2026-03-16T10:00:00Z",
  "signature": "sha256=abc123...",
  "data": {
    "id": "69abc123",
    "transaction_id": "ESC-20260316-002",
    "status": "funded",
    "amount": 50000,
    "fee_amount": 500,
    "currency": "ZAR",
    "funded_at": "2026-03-16T10:00:00Z",
    "buyer_email": "buyer@example.com",
    "seller_email": "seller@example.com",
    "metadata": { "order_id": "ORD-12345" }
  }
}`,

  webhookVerify: `// Verify webhook signature (Node.js)
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

// In your webhook handler:
app.post('/webhooks/escropay', (req, res) => {
  const sig = req.headers['x-escropay-signature'];
  const raw = req.rawBody; // unparsed body string

  if (!verifyWebhook(raw, sig, process.env.ESCROPAY_WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }

  const { event, data } = req.body;

  switch (event) {
    case 'escrow.funded':
      // Unlock delivery workflow
      break;
    case 'escrow.released':
      // Trigger payout / mark order complete
      break;
    case 'escrow.disputed':
      // Flag order, pause workflow
      break;
    case 'escrow.refunded':
      // Process refund in your system
      break;
  }

  res.status(200).send('OK');
});`,

  errors: `// Error response format
{
  "error": {
    "code": "invalid_status_transition",
    "message": "Cannot release an escrow that is not in 'funded' status",
    "param": "status",
    "doc_url": "https://escropay.app/ApiDocs"
  }
}

// HTTP Status Codes:
// 200 OK              — Success
// 201 Created         — Escrow created
// 400 Bad Request     — Invalid parameters
// 401 Unauthorized    — Missing or invalid API key
// 403 Forbidden       — Insufficient permissions
// 404 Not Found       — Escrow not found
// 409 Conflict        — Invalid status transition
// 422 Unprocessable   — Validation error
// 429 Too Many Requests — Rate limit exceeded
// 500 Internal Error  — Contact support`
};

// ─── Components ──────────────────────────────────────────────────────────────

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
      </button>
    </div>
  );
}

function ParamRow({ name, type, required, description }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2.5 pr-4 font-mono text-purple-600 text-sm whitespace-nowrap">{name}</td>
      <td className="py-2.5 pr-4 text-gray-500 text-sm">{type}</td>
      <td className="py-2.5 pr-4">
        <Badge className={required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}>
          {required ? 'Required' : 'Optional'}
        </Badge>
      </td>
      <td className="py-2.5 text-gray-600 text-sm">{description}</td>
    </tr>
  );
}

function ParamTable({ rows }) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 text-gray-500 font-medium">Parameter</th>
            <th className="text-left py-2 text-gray-500 font-medium">Type</th>
            <th className="text-left py-2 text-gray-500 font-medium">Required</th>
            <th className="text-left py-2 text-gray-500 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => <ParamRow key={r[0]} name={r[0]} type={r[1]} required={r[2]} description={r[3]} />)}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" /></Link>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Documentation')}>
              <Button variant="outline" size="sm" className="border-purple-200 text-purple-600">
                <BookOpen className="w-4 h-4 mr-1" /> Docs
              </Button>
            </Link>
            <Link to="/Dashboard">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">
            <Terminal className="w-3 h-3 mr-1" /> REST API v1
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escropay Merchant API</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Integrate secure, FICA-compliant escrow payments into your marketplace, e-commerce platform, or B2B application with our REST API.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <a href="mailto:api@escropay.app">
              <Button className="bg-purple-600 hover:bg-purple-700">Get API Access</Button>
            </a>
            <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">View Terms</Button>
            </a>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {[
            { icon: Shield, title: 'FICA / AML Compliant', desc: 'Built-in KYC, AML screening and compliance engine. We handle regulatory obligations.' },
            { icon: Zap, title: 'Instant Integration', desc: 'Go live in under a day. Webhook-driven, idempotent API designed for production use.' },
            { icon: Globe, title: 'ZAR-native', desc: 'Designed for South African markets. Supports EFT, card, ZARU stablecoin payments.' }
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="p-2 bg-purple-100 rounded-lg w-fit mb-3">
                <f.icon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Merchant Onboarding Steps */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" /> Merchant Onboarding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Apply for Access', desc: 'Email api@escropay.app with your company details and use case.', icon: Key },
              { step: '02', title: 'Complete KYC / FICA', desc: 'Submit CIPC cert, director IDs, and proof of address for compliance review.', icon: Shield },
              { step: '03', title: 'Receive API Keys', desc: 'Get sandbox and production keys after compliance approval (1–3 business days).', icon: Terminal },
              { step: '04', title: 'Go Live', desc: 'Test in sandbox, then switch to your production key. We are here to help.', icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-start p-4 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-xs font-bold text-purple-400 mb-2">STEP {s.step}</span>
                <s.icon className="w-5 h-5 text-purple-600 mb-2" />
                <p className="font-semibold text-gray-900 text-sm mb-1">{s.title}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Sandbox Environment:</strong> Use <code className="bg-amber-100 px-1 rounded">https://sandbox.api.escropay.app/v1</code> for testing.
            Sandbox API keys begin with <code className="bg-amber-100 px-1 rounded">sk_test_</code>. Production keys begin with <code className="bg-amber-100 px-1 rounded">sk_live_</code>.
            No real funds are moved in sandbox.
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg"><Key className="w-5 h-5 text-amber-600" /></div>
            <h2 className="text-xl font-semibold text-gray-900">Authentication</h2>
          </div>
          <p className="text-gray-600 mb-4">All API requests must include your API key in the Authorization header. Never expose your key in client-side code.</p>
          <CodeBlock code={`Authorization: Bearer sk_live_YOUR_API_KEY`} />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-sm">
              <p className="font-medium text-gray-800 mb-1">Rate Limits</p>
              <ul className="text-gray-600 space-y-1">
                <li>• <strong>100 requests/minute</strong> per API key (standard)</li>
                <li>• <strong>1,000 requests/minute</strong> for enterprise plans</li>
                <li>• Returns <code className="bg-gray-200 px-1 rounded">429</code> when exceeded</li>
                <li>• Use <code className="bg-gray-200 px-1 rounded">X-RateLimit-Remaining</code> header to track</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-sm">
              <p className="font-medium text-gray-800 mb-1">Idempotency</p>
              <p className="text-gray-600">For POST requests, pass an <code className="bg-gray-200 px-1 rounded">Idempotency-Key</code> header to safely retry failed requests without creating duplicates.</p>
              <CodeBlock code={`Idempotency-Key: order_ORD-12345_attempt_1`} />
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Base URL</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-2">PRODUCTION</p>
              <CodeBlock code={`https://api.escropay.app/v1`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-2">SANDBOX</p>
              <CodeBlock code={`https://sandbox.api.escropay.app/v1`} />
            </div>
          </div>
        </div>

        {/* Escrow Lifecycle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-600" /> Escrow Lifecycle
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {[
              { status: 'pending_seller_acceptance', color: 'bg-purple-100 text-purple-700', desc: 'Awaiting seller response' },
              { status: 'pending', color: 'bg-amber-100 text-amber-700', desc: 'Awaiting buyer funding' },
              { status: 'funded', color: 'bg-cyan-100 text-cyan-700', desc: 'Funds secured in escrow' },
              { status: 'released', color: 'bg-emerald-100 text-emerald-700', desc: 'Funds paid to seller' },
              { status: 'disputed', color: 'bg-red-100 text-red-700', desc: 'Frozen — under review' },
              { status: 'refunded', color: 'bg-gray-100 text-gray-700', desc: 'Funds returned to buyer' },
              { status: 'rejected_by_seller', color: 'bg-red-100 text-red-700', desc: 'Seller declined' },
              { status: 'modification_requested', color: 'bg-orange-100 text-orange-700', desc: 'Seller requested changes' },
            ].map((s) => (
              <div key={s.status} className="flex flex-col items-center gap-1">
                <Badge className={s.color}>{s.status}</Badge>
                <span className="text-xs text-gray-400">{s.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <strong>Typical flow:</strong> <code>pending_seller_acceptance</code> → <code>pending</code> → <code>funded</code> → <code>released</code>
          </div>
        </div>

        {/* API Endpoints */}
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="create" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Create Escrow</TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">List Escrows</TabsTrigger>
            <TabsTrigger value="get" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Get Escrow</TabsTrigger>
            <TabsTrigger value="release" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Release Funds</TabsTrigger>
            <TabsTrigger value="dispute" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Dispute</TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Milestones</TabsTrigger>
            <TabsTrigger value="webhooks" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Webhooks</TabsTrigger>
            <TabsTrigger value="errors" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Errors</TabsTrigger>
          </TabsList>

          {/* CREATE */}
          <TabsContent value="create">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 font-mono">POST</Badge>
                  <code className="text-gray-900 font-mono text-sm">/escrows</code>
                </div>
                <p className="text-gray-600 text-sm">
                  Creates a new escrow. The seller receives an email invitation to accept or reject the terms.
                  The buyer can fund the escrow once the seller accepts.
                </p>
              </div>
              <CodeBlock code={examples.createEscrow} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Request Parameters</h4>
                <ParamTable rows={[
                  ['title', 'string', true, 'Title of the escrow transaction (max 200 chars)'],
                  ['amount', 'number', true, 'Amount in ZAR (whole rands). E.g. 50000 = R 50,000.00'],
                  ['buyer_email', 'string', true, 'Email address of the buyer'],
                  ['seller_email', 'string', true, 'Email address of the seller'],
                  ['buyer_name', 'string', false, 'Full name or company name of the buyer'],
                  ['seller_name', 'string', false, 'Full name or company name of the seller'],
                  ['description', 'string', false, 'Description of the goods or services (max 2000 chars)'],
                  ['currency', 'string', false, 'Currency code — currently only ZAR is supported'],
                  ['due_date', 'string', false, 'Expected completion date in ISO 8601 format (YYYY-MM-DD)'],
                  ['fee_payer', 'string', false, 'Who pays the Escropay fee: buyer | seller | split_buyer_seller. Default: buyer'],
                  ['milestones', 'array', false, 'Array of milestone objects (see Milestones tab)'],
                  ['webhook_url', 'string', false, 'HTTPS URL to receive webhook event notifications'],
                  ['metadata', 'object', false, 'Custom key-value pairs (up to 20 keys, values up to 500 chars each)'],
                ]} />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <strong>Note:</strong> <code>amount</code> is in <strong>whole ZAR rands</strong> (not cents).
                R 50,000.00 is represented as <code>50000</code>.
                Escropay fees are calculated automatically based on the transaction amount tier.
              </div>
            </div>
          </TabsContent>

          {/* LIST */}
          <TabsContent value="list">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-blue-100 text-blue-700 font-mono">GET</Badge>
                  <code className="text-gray-900 font-mono text-sm">/escrows</code>
                </div>
                <p className="text-gray-600 text-sm">Returns a paginated list of escrows associated with your merchant account.</p>
              </div>
              <CodeBlock code={examples.listEscrows} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Query Parameters</h4>
                <ParamTable rows={[
                  ['status', 'string', false, 'Filter by status: pending_seller_acceptance | pending | funded | released | disputed | refunded'],
                  ['buyer_email', 'string', false, 'Filter by buyer email'],
                  ['seller_email', 'string', false, 'Filter by seller email'],
                  ['limit', 'integer', false, 'Number of results per page (default: 20, max: 100)'],
                  ['offset', 'integer', false, 'Pagination offset (default: 0)'],
                  ['sort', 'string', false, 'Sort field: created_date | updated_date | amount (prefix with - for descending)'],
                ]} />
              </div>
            </div>
          </TabsContent>

          {/* GET */}
          <TabsContent value="get">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-blue-100 text-blue-700 font-mono">GET</Badge>
                  <code className="text-gray-900 font-mono text-sm">/escrows/:id</code>
                </div>
                <p className="text-gray-600 text-sm">Retrieve the full details of a specific escrow transaction.</p>
              </div>
              <CodeBlock code={examples.getEscrow} />
              <div className="p-4 bg-gray-50 rounded-xl text-sm">
                <p className="font-semibold text-gray-800 mb-2">Response Fields</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
                  {[
                    ['id', 'Unique escrow identifier'],
                    ['transaction_id', 'Human-readable reference (ESC-YYYYMMDD-NNN)'],
                    ['status', 'Current lifecycle status'],
                    ['amount', 'Escrow amount in ZAR'],
                    ['fee_amount', 'Escropay service fee in ZAR'],
                    ['funded_at', 'Timestamp when funds were received'],
                    ['released_at', 'Timestamp when funds were released'],
                    ['milestones', 'Array of milestone objects'],
                    ['seller_banking_details', 'Banking details submitted by seller'],
                    ['metadata', 'Your custom metadata'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <code className="text-purple-600 text-xs whitespace-nowrap">{k}</code>
                      <span className="text-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* RELEASE */}
          <TabsContent value="release">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 font-mono">POST</Badge>
                  <code className="text-gray-900 font-mono text-sm">/escrows/:id/release</code>
                </div>
                <p className="text-gray-600 text-sm">
                  Release escrowed funds to the seller. The escrow must be in <code>funded</code> status.
                  Only callable by the buyer or an authorized merchant API key.
                </p>
              </div>
              <CodeBlock code={examples.releaseEscrow} />
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                <strong>After release:</strong> Funds are queued for disbursement to the seller's registered bank account within 1–3 business days,
                subject to Escropay's AML checks and the seller having submitted valid banking details.
              </div>
              <ParamTable rows={[
                ['notes', 'string', false, 'Optional release confirmation note (logged in audit trail)'],
              ]} />
            </div>
          </TabsContent>

          {/* DISPUTE */}
          <TabsContent value="dispute">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-red-100 text-red-700 font-mono">POST</Badge>
                  <code className="text-gray-900 font-mono text-sm">/escrows/:id/dispute</code>
                </div>
                <p className="text-gray-600 text-sm">
                  Raise a dispute on a funded escrow. Funds are immediately frozen pending Escropay's compliance team review.
                  Both buyer and seller may raise disputes.
                </p>
              </div>
              <CodeBlock code={examples.disputeEscrow} />
              <ParamTable rows={[
                ['reason', 'string', true, 'Description of the dispute (min 20 chars)'],
                ['raised_by', 'string', true, 'Email of the party raising the dispute (must be buyer or seller email)'],
                ['evidence_urls', 'array', false, 'Array of publicly accessible URLs to supporting evidence files'],
              ]} />
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                <strong>Dispute Resolution:</strong> Our compliance team reviews all disputes. AI-assisted analysis is provided to both parties.
                Resolution typically takes 3–10 business days. Contact <a href="mailto:disputes@escropay.app" className="underline">disputes@escropay.app</a> for urgent cases.
              </div>
            </div>
          </TabsContent>

          {/* MILESTONES */}
          <TabsContent value="milestones">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Milestone-Based Escrow</h3>
                <p className="text-gray-600 text-sm">
                  For larger projects, split the escrow into milestones. The total of all milestone amounts must equal the escrow amount.
                  Funds are released per milestone as the seller completes and the buyer approves each stage.
                </p>
              </div>
              <CodeBlock code={examples.milestones} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Milestone Object Fields</h4>
                <ParamTable rows={[
                  ['title', 'string', true, 'Milestone name'],
                  ['description', 'string', false, 'Deliverables for this milestone'],
                  ['amount', 'number', true, 'Amount in ZAR for this milestone'],
                  ['due_date', 'string', false, 'Target completion date (YYYY-MM-DD)'],
                ]} />
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800">
                <strong>Milestone statuses:</strong> <code>pending</code> → <code>in_progress</code> → <code>completed</code> (by seller) → <code>approved</code> (by buyer, triggers release)
              </div>
            </div>
          </TabsContent>

          {/* WEBHOOKS */}
          <TabsContent value="webhooks">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Webhook Events</h3>
                <p className="text-gray-600 text-sm">
                  Configure a webhook URL to receive real-time event notifications. Your endpoint must respond with HTTP 200 within 5 seconds.
                  Failed deliveries are retried up to 5 times with exponential backoff.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500">Event</th>
                      <th className="text-left py-2 text-gray-500">Trigger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['escrow.created', 'New escrow transaction created'],
                      ['escrow.accepted', 'Seller accepted the escrow terms'],
                      ['escrow.rejected', 'Seller rejected the escrow'],
                      ['escrow.modification_requested', 'Seller requested changes to terms'],
                      ['escrow.funded', 'Buyer payment received and funds secured'],
                      ['escrow.released', 'Funds released to seller'],
                      ['escrow.disputed', 'Dispute raised — funds frozen'],
                      ['escrow.refunded', 'Funds refunded to buyer'],
                      ['escrow.payout_requested', 'Seller requested payout disbursement'],
                      ['milestone.completed', 'Seller marked a milestone complete'],
                      ['milestone.approved', 'Buyer approved a milestone (partial release)'],
                    ].map(([event, trigger]) => (
                      <tr key={event} className="border-b border-gray-100">
                        <td className="py-2 font-mono text-purple-600 text-xs pr-4">{event}</td>
                        <td className="py-2 text-gray-600 text-sm">{trigger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Example Payload</h4>
                <CodeBlock code={examples.webhook} />
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Verifying Signatures</h4>
                <p className="text-sm text-gray-600 mb-3">
                  All webhook requests include an <code className="bg-gray-100 px-1 rounded">X-Escropay-Signature</code> header.
                  Always verify this before processing the payload.
                </p>
                <CodeBlock code={examples.webhookVerify} />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <strong>Security:</strong> Your webhook secret is generated when you configure your endpoint. Store it securely — treat it like a password.
                Always use HTTPS endpoints. Plain HTTP webhook URLs are rejected.
              </div>
            </div>
          </TabsContent>

          {/* ERRORS */}
          <TabsContent value="errors">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Handling</h3>
                <p className="text-gray-600 text-sm">
                  Escropay uses standard HTTP status codes. All error responses include a structured JSON body.
                </p>
              </div>
              <CodeBlock code={examples.errors} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Common Error Codes</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500">Code</th>
                        <th className="text-left py-2 text-gray-500">HTTP</th>
                        <th className="text-left py-2 text-gray-500">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['invalid_api_key', '401', 'API key is missing, malformed, or revoked'],
                        ['insufficient_permissions', '403', 'Your API key does not have access to this resource'],
                        ['escrow_not_found', '404', 'No escrow exists with the provided ID under your account'],
                        ['invalid_status_transition', '409', 'The requested action is not valid for the current escrow status'],
                        ['amount_mismatch', '422', 'Milestone amounts do not sum to the escrow total amount'],
                        ['invalid_email', '422', 'buyer_email or seller_email is not a valid email address'],
                        ['same_party', '422', 'buyer_email and seller_email cannot be the same address'],
                        ['rate_limit_exceeded', '429', 'Too many requests — slow down and retry after the indicated delay'],
                        ['merchant_not_approved', '403', 'Your merchant account is pending compliance approval'],
                      ].map(([code, http, desc]) => (
                        <tr key={code} className="border-b border-gray-100">
                          <td className="py-2 font-mono text-red-600 text-xs pr-3">{code}</td>
                          <td className="py-2 text-gray-500 pr-3">{http}</td>
                          <td className="py-2 text-gray-600 text-sm">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to Integrate?</h3>
              <p className="text-purple-200">Email our integration team and we'll get your merchant account set up within 1–3 business days.</p>
              <p className="text-purple-300 text-sm mt-1">api@escropay.app · integration support available Mon–Fri 08:00–17:00 SAST</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a href="mailto:api@escropay.app">
                <Button className="bg-white text-purple-700 hover:bg-gray-100 font-semibold">
                  Get API Access <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <Link to={createPageUrl('Documentation')}>
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  Full Docs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={LOGO_URL} alt="Escropay" className="h-8" />
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">Terms & Conditions</a>
            <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">Privacy Policy</a>
            <a href="mailto:api@escropay.app" className="hover:text-purple-600">API Support</a>
          </div>
          <p className="text-sm text-gray-500">© 2026 Escropay Financial Services (Pty) Ltd · CIPC: 2026/128185/07</p>
        </div>
      </footer>
    </div>
  );
}