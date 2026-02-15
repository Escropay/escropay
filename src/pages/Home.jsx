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
  Wallet
} from 'lucide-react';

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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50" />
              <div className="relative p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">Escropay</span>
          </div>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10">
              Launch App
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm mb-8"
            >
              <Wallet className="w-4 h-4" />
              Enterprise-Grade Escrow Infrastructure
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                Secure Every
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Transaction
              </span>
            </h1>
            
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Professional escrow services built for the modern economy. 
              Protect buyers and sellers with automated fund protection and dispute resolution.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Dashboard')}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium text-lg px-8 shadow-lg shadow-cyan-500/25 w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 text-lg px-8 w-full sm:w-auto"
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
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-zinc-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section className="border-t border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Escropay</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 hover:border-zinc-700/50 transition-all duration-300">
                    <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20 w-fit mb-4">
                      <feature.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-zinc-500 text-sm">{feature.description}</p>
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
            className="relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                Join thousands of businesses using Escropay for secure transactions
              </p>
              <Link to={createPageUrl('Dashboard')}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/25"
                >
                  Launch Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold">Escropay</span>
            </div>
            <p className="text-zinc-500 text-sm">
              © 2026 Escropay. Secure escrow for the modern economy.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}