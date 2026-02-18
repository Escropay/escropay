import React from 'react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";
const TERMS_PDF_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/06b03272a_TermsConditionsAMLCTFKYCPrivacyPolicyEscropay.pdf";

export default function Footer({ minimal = false }) {
  if (minimal) {
    return (
      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <span>© 2026 Escropay Financial Services (Pty) Ltd | CIPC: 2026/128185/07</span>
            <div className="flex items-center gap-4">
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                Terms & Conditions
              </a>
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                Privacy Policy
              </a>
              <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600">
                AML/KYC Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={LOGO_URL} alt="Escropay" className="h-8" />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors">
              Terms & Conditions
            </a>
            <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors">
              Privacy Policy
            </a>
            <a href={TERMS_PDF_URL} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors">
              AML/CTF/KYC Policy
            </a>
          </div>
          <p className="text-sm text-gray-500">© 2026 Escropay Financial Services (Pty) Ltd</p>
        </div>
      </div>
    </footer>
  );
}