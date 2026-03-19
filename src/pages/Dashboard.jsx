import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Shield, TrendingUp, Wallet, CheckCircle2, RefreshCw } from 'lucide-react';
import { User, Clock, LayoutList, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatsCard from '@/components/dashboard/StatsCard';
import EscrowCard from '@/components/dashboard/EscrowCard';
import CreateEscrowModal from '@/components/dashboard/CreateEscrowModal';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import TimelineView from '@/components/dashboard/TimelineView';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import Footer from '@/components/common/Footer';
import CurrencySwitcher from '@/components/common/CurrencySwitcher';
import { useCurrency } from '@/components/common/CurrencyContext';
import { EmailService } from '@/components/utils/EmailService';
import ComplianceBanner from '@/components/compliance/ComplianceBanner';
import { useComplianceGuard } from '@/hooks/useComplianceGuard';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

function DashboardInner() {
  const { format } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'timeline'
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { canUseEscrow } = useComplianceGuard(currentUser);

  const { data: escrows = [], isLoading } = useQuery({
    queryKey: ['escrows'],
    queryFn: () => {
      if (!currentUser?.email) return [];
      // Filter escrows for current user only
      return base44.entities.Escrow.filter({
        $or: [
          { buyer_email: currentUser.email },
          { seller_email: currentUser.email }
        ]
      }, '-created_date');
    },
    enabled: !!currentUser?.email
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Escrow.create(data),
    onSuccess: (createdEscrow) => {
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      setIsModalOpen(false);
      // Send invitation email to seller (the other party who needs to accept/reject)
      EmailService.sendEscrowInvitationEmail(createdEscrow).catch(console.error);
      // Also notify buyer with confirmation
      EmailService.sendEscrowCreatedEmail(createdEscrow, 'buyer').catch(console.error);
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

  const handleEscrowUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-200 backdrop-blur-xl bg-white/80 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl('Dashboard')}>
                <img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" />
              </Link>
              <div className="flex items-center gap-2 md:gap-3">
                                    <Link to={createPageUrl('Documentation')}>
                                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-purple-600">
                                            <BookOpen className="w-4 h-4 md:mr-1" />
                                            <span className="hidden md:inline">Docs</span>
                                          </Button>
                                        </Link>
                                        <CurrencySwitcher />
                                        <NotificationCenter userEmail={currentUser?.email} />
                                    <Link to={createPageUrl('Profile')}>
                                      <Button variant="outline" size="icon" className="rounded-full">
                                        <User className="w-4 h-4" />
                                      </Button>
                                    </Link>
                                    <Button
                                    onClick={() => canUseEscrow && setIsModalOpen(true)}
                                    disabled={!canUseEscrow}
                                    title={!canUseEscrow ? 'Your account is suspended or terminated' : ''}
                                     className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="w-4 h-4 md:mr-2" />
                                      <span className="hidden md:inline">New Escrow</span>
                                    </Button>
                                  </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Compliance Banner */}
          <ComplianceBanner accountStatus={currentUser?.account_status} />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Escrows"
              value={stats.total}
              subtitle={`${format(stats.totalValue)} total value`}
              icon={Shield}
              delay={0}
              linkToAnalytics
            />
            <StatsCard
              title="Funds in Escrow"
              value={format(stats.fundedValue)}
              subtitle={`${stats.funded} active escrows`}
              icon={Wallet}
              trend={12}
              delay={0.1}
              linkToAnalytics
            />
            <StatsCard
              title="Successfully Released"
              value={stats.released}
              subtitle="Completed transactions"
              icon={CheckCircle2}
              delay={0.2}
              linkToAnalytics
            />
            <StatsCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              subtitle={`${stats.disputed} disputes`}
              icon={TrendingUp}
              delay={0.3}
              linkToAnalytics
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Escrow List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                      <h2 className="text-xl font-semibold text-gray-900">Escrow Transactions</h2>
                                      <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                                        <button
                                          onClick={() => setViewMode('cards')}
                                          className={`p-2 rounded ${viewMode === 'cards' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                          <LayoutList className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setViewMode('timeline')}
                                          className={`p-2 rounded ${viewMode === 'timeline' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                          <Clock className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                                      <TabsList className="bg-white border border-gray-200">
                                        <TabsTrigger value="all" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">All</TabsTrigger>
                                        <TabsTrigger value="pending" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Pending</TabsTrigger>
                                        <TabsTrigger value="funded" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Funded</TabsTrigger>
                                        <TabsTrigger value="released" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Released</TabsTrigger>
                                      </TabsList>
                                    </Tabs>
                                  </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
              ) : filteredEscrows.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No escrows found</h3>
                  <p className="text-gray-500 mb-6">Create your first escrow to get started</p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    className="border-purple-500/30 text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Escrow
                  </Button>
                </motion.div>
              ) : viewMode === 'timeline' ? (
                                    <TimelineView escrows={filteredEscrows} />
                                  ) : (
                                    <div className="space-y-4">
                                      {filteredEscrows.map((escrow, index) => (
                                        <EscrowCard
                                          key={escrow.id}
                                          escrow={escrow}
                                          index={index}
                                          onAction={handleStatusChange}
                                          onUpdate={handleEscrowUpdate}
                                          currentUser={currentUser}
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
      
      <Footer minimal />
    </div>
  );
}

export default function Dashboard() {
  return <DashboardInner />;
}