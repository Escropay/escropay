import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Shield, 
  LogIn, 
  UserPlus,
  User,
  ArrowRight,
  Lock,
  Zap,
  Globe
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

export default function Welcome() {
  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  const handleSignup = () => {
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link to={createPageUrl('Home')}>
          <img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
            {/* Logo Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl border border-purple-500/20">
                <Shield className="w-10 h-10 text-purple-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Welcome to Escropay
            </h1>
            <p className="text-gray-500 text-center mb-8">
              Secure escrow transactions made simple
            </p>

            <div className="space-y-3">
              {/* Login Button */}
              <Button
                onClick={handleLogin}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium text-base"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </Button>

              {/* Signup Button */}
              <Button
                onClick={handleSignup}
                variant="outline"
                className="w-full h-12 border-purple-300 text-purple-700 hover:bg-purple-50 font-medium text-base"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create Account
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Guest Button */}
              <Link to={createPageUrl('Dashboard')} className="block">
                <Button
                  variant="ghost"
                  className="w-full h-12 text-gray-600 hover:bg-gray-100 font-medium text-base"
                >
                  <User className="w-5 h-5 mr-2" />
                  Continue as Guest
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              By continuing, you agree to our{' '}
              <a 
                href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/9cdcac727_Terms_Conditions_PolicyEscropay.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                Terms of Service
              </a>{' '}and{' '}
              <a 
                href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/9cdcac727_Terms_Conditions_PolicyEscropay.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Secure', icon: Lock, color: 'text-purple-600' },
              { label: 'Fast', icon: Zap, color: 'text-cyan-600' },
              { label: 'Global', icon: Globe, color: 'text-emerald-600' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center bg-white/60 backdrop-blur rounded-xl p-3"
              >
                <item.icon className={`w-6 h-6 mx-auto mb-1 ${item.color}`} />
                <div className="text-sm text-gray-600">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-sm text-gray-400">
          © 2026 Escropay Financial Services (Pty) Ltd
        </p>
      </footer>
    </div>
  );
}