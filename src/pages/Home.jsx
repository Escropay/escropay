import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Shield, 
  Lock, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Globe,
  Wallet,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

const features = [
  {
    icon: Shield,
    title: 'Secure Escrow',
    description: 'Funds held safely until both parties confirm delivery'
  },
  {
    icon: Lock,
    title: 'Dispute Resolution',
    description: 'Built-in dispute handling for peace of mind'
  },
  {
    icon: Zap,
    title: 'Instant Settlement',
    description: 'Fast fund release upon successful completion'
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Transact securely with anyone, anywhere'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="EscroPay" className="h-8 md:h-10 w-auto" />
          </Link>
          <Link to={createPageUrl('Welcome')}>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
              <span className="hidden sm:inline">Launch App</span>
              <span className="sm:hidden">Login</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-600 text-sm mb-8"
            >
              <Wallet className="w-4 h-4" />
              Enterprise-Grade Escrow Infrastructure
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-gray-900">
                Secure Every
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                Transaction
              </span>
            </h1>
            
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Professional escrow services built for the modern economy. 
              Protect buyers and sellers with automated fund protection and dispute resolution.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Dashboard')}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium text-lg px-8 shadow-lg shadow-purple-500/25 w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 w-full sm:w-auto"
              >
                View Documentation
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 max-w-4xl mx-auto"
          >
            {[
              { value: '$2.5M+', label: 'Protected' },
              { value: '10K+', label: 'Transactions' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-100 bg-gray-50/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Why Choose EscroPay</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Built with security-first architecture and enterprise-grade reliability
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg transition-all duration-300">
                    <div className="p-3 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20 w-fit mb-4">
                      <feature.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-purple-600 to-purple-800 rounded-3xl p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
              <p className="text-purple-200 mb-8 max-w-xl mx-auto">
                Join thousands of businesses using EscroPay for secure transactions
              </p>
              <Link to={createPageUrl('Dashboard')}>
                <Button
                  size="lg"
                  className="bg-white text-purple-700 hover:bg-gray-100 font-medium shadow-lg"
                >
                  Launch Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Contact Us Section */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Contact Us</h2>
              <p className="text-gray-500">Get in touch with our team</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* WhatsApp */}
              <motion.a
                href="https://wa.me/27609292499"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-green-100 rounded-xl w-fit mb-4">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                <p className="text-gray-500 text-sm group-hover:text-purple-600 transition-colors">+27 60 929 2499</p>
              </motion.a>

              {/* Email */}
              <motion.a
                href="mailto:info@escropay.app"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-500 text-sm group-hover:text-purple-600 transition-colors">info@escropay.app</p>
              </motion.a>

              {/* Johannesburg */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-2xl p-6"
              >
                <div className="p-3 bg-cyan-100 rounded-xl w-fit mb-4">
                  <MapPin className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Johannesburg</h3>
                <p className="text-gray-500 text-sm">16 Baker Street, Rosebank, Johannesburg, 2196</p>
              </motion.div>

              {/* Cape Town */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 rounded-2xl p-6"
              >
                <div className="p-3 bg-amber-100 rounded-xl w-fit mb-4">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Cape Town</h3>
                <p className="text-gray-500 text-sm">32 Kloof St, Gardens, Cape Town, 8000</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={LOGO_URL} alt="EscroPay" className="h-8 w-auto" />
            <p className="text-gray-500 text-sm">
              © 2026 EscroPay. Secure escrow for the modern economy.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}