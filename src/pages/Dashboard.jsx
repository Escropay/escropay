import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Shield, 
  DollarSign, 
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

import StatsCard from '@/components/dashboard/StatsCard';
import EscrowCard from '@/components/dashboard/EscrowCard';
import CreateEscrowModal from '@/components/dashboard/CreateEscrowModal';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: escrows = [], isLoading } = useQuery({
    queryKey: ['escrows'],
    queryFn: () => base44.entities.Escrow.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Escrow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      setIsModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Escrow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    }
  });

  const handleStatusChange = (id, newStatus) => {
    const updates = { status: newStatus };
    const now = new Date().toISOString();
    
    if (newStatus === 'funded') updates.funded_at = now;
    if (newStatus === 'released') updates.released_at = now;
    if (newStatus === 'disputed') updates.disputed_at = now;
    
    updateMutation.mutate({ id, data: updates });
  };

  // Calculate stats
  const stats = {
    total: escrows.length,
    totalValue: escrows.reduce((sum, e) => sum + (e.amount || 0), 0),
    funded: escrows.filter(e => e.status === 'funded').length,
    fundedValue: escrows.filter(e => e.status === 'funded').reduce((sum, e) => sum + (e.amount || 0), 0),
    released: escrows.filter(e => e.status === 'released').length,
    disputed: escrows.filter(e => e.status === 'disputed').length,
    successRate: escrows.length > 0 
      ? Math.round((escrows.filter(e => e.status === 'released').length / escrows.length) * 100) 
      : 0
  };

  const filteredEscrows = activeFilter === 'all' 
    ? escrows 
    : escrows.filter(e => e.status === activeFilter);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-black/50 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50" />
                  <div className="relative p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Escropay</h1>
                  <p className="text-xs text-zinc-500">Secure Escrow Platform</p>
                </div>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Escrow
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Escrows"
              value={stats.total}
              subtitle={`$${stats.totalValue.toLocaleString()} total value`}
              icon={Shield}
              delay={0}
            />
            <StatsCard
              title="Funds in Escrow"
              value={`$${stats.fundedValue.toLocaleString()}`}
              subtitle={`${stats.funded} active escrows`}
              icon={Wallet}
              trend={12}
              delay={0.1}
            />
            <StatsCard
              title="Successfully Released"
              value={stats.released}
              subtitle="Completed transactions"
              icon={CheckCircle2}
              delay={0.2}
            />
            <StatsCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              subtitle={`${stats.disputed} disputes`}
              icon={TrendingUp}
              delay={0.3}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Escrow List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Escrow Transactions</h2>
                <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                  <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800">All</TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-800">Pending</TabsTrigger>
                    <TabsTrigger value="funded" className="data-[state=active]:bg-zinc-800">Funded</TabsTrigger>
                    <TabsTrigger value="released" className="data-[state=active]:bg-zinc-800">Released</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
              ) : filteredEscrows.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-12 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-300 mb-2">No escrows found</h3>
                  <p className="text-zinc-500 mb-6">Create your first escrow to get started</p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Escrow
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {filteredEscrows.map((escrow, index) => (
                    <EscrowCard
                      key={escrow.id}
                      escrow={escrow}
                      index={index}
                      onAction={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="lg:col-span-1">
              <ActivityTimeline escrows={escrows} />
            </div>
          </div>
        </main>
      </div>

      {/* Create Modal */}
      <CreateEscrowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}