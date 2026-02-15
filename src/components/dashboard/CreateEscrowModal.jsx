import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Shield, DollarSign, User, Mail, Calendar } from 'lucide-react';

export default function CreateEscrowModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    buyer_email: '',
    buyer_name: '',
    seller_email: '',
    seller_name: '',
    due_date: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-8 pt-8 pb-6 border-b border-zinc-800">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/20">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Escrow</h2>
                  <p className="text-zinc-500 text-sm">Secure your transaction with escrow protection</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-300">Transaction Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Website Development Project"
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe the terms and deliverables..."
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    Amount (USD)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0.00"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleChange('due_date', e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Buyer Details
                  </h4>
                  <Input
                    value={formData.buyer_name}
                    onChange={(e) => handleChange('buyer_name', e.target.value)}
                    placeholder="Buyer Name"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  />
                  <Input
                    type="email"
                    value={formData.buyer_email}
                    onChange={(e) => handleChange('buyer_email', e.target.value)}
                    placeholder="buyer@email.com"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Seller Details
                  </h4>
                  <Input
                    value={formData.seller_name}
                    onChange={(e) => handleChange('seller_name', e.target.value)}
                    placeholder="Seller Name"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  />
                  <Input
                    type="email"
                    value={formData.seller_email}
                    onChange={(e) => handleChange('seller_email', e.target.value)}
                    placeholder="seller@email.com"
                    className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    'Create Escrow'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}