import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Unlock, Pause, Play, AlertCircle, User, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RoleGuard from '@/components/auth/RoleGuard';
import Footer from '@/components/common/Footer';
import CurrencySwitcher from '@/components/common/CurrencySwitcher';
import { useCurrency } from '@/components/common/CurrencyContext';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

function AgentDashboardInner() {
  const { format } = useCurrency();
  const [activeFilter, setActiveFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: escrows = [], isLoading } = useQuery({
    queryKey: ['all_escrows'],
    queryFn: () => base44.entities.Escrow.list('-created_date')
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Escrow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_escrows'] });
    }
  });

  const handleLockFunds = (escrowId) => {
    updateMutation.mutate({ id: escrowId, data: { locked: true } });
  };

  const handleUnlockFunds = (escrowId) => {
    updateMutation.mutate({ id: escrowId, data: { locked: false } });
  };

  const handleManualRelease = (escrowId) => {
    updateMutation.mutate({ 
      id: escrowId, 
      data: { 
        status: 'released',
        released_at: new Date().toISOString()
      } 
    });
  };

  const stats = {
    total: escrows.length,
    totalValue: escrows.reduce((sum, e) => sum + (e.amount || 0), 0),
    funded: escrows.filter(e => e.status === 'funded').length,
    disputed: escrows.filter(e => e.status === 'disputed').length,
    locked: escrows.filter(e => e.locked).length
  };

  const filteredEscrows = activeFilter === 'all'
    ? escrows
    : activeFilter === 'locked'
    ? escrows.filter(e => e.locked)
    : escrows.filter(e => e.status === activeFilter);

  return (
    <RoleGuard allowedRoles={['agent', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl('AgentDashboard')}>
                <img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" />
              </Link>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-100 text-purple-700">Agent</Badge>
                <Link to={createPageUrl('Documentation')}>
                  <Button variant="ghost" size="sm">
                    <BookOpen className="w-4 h-4 md:mr-1" />
                    <span className="hidden md:inline">Docs</span>
                  </Button>
                </Link>
                <CurrencySwitcher />
                <Link to={createPageUrl('Profile')}>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Control Panel</h1>
            <p className="text-gray-600">Monitor and manage all escrow transactions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Total Escrows</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Total Value</div>
              <div className="text-2xl font-bold text-gray-900">{format(stats.totalValue)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Active (Funded)</div>
              <div className="text-2xl font-bold text-green-600">{stats.funded}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Disputed</div>
              <div className="text-2xl font-bold text-red-600">{stats.disputed}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Locked</div>
              <div className="text-2xl font-bold text-amber-600">{stats.locked}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <Tabs value={activeFilter} onValueChange={setActiveFilter}>
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="funded">Funded</TabsTrigger>
                <TabsTrigger value="disputed">Disputed</TabsTrigger>
                <TabsTrigger value="locked">Locked</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Escrow List */}
          <div className="space-y-4">
            {filteredEscrows.map((escrow) => (
              <div key={escrow.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{escrow.title}</h3>
                      {escrow.locked && (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Buyer: {escrow.buyer_name || escrow.buyer_email}</div>
                      <div>Seller: {escrow.seller_name || escrow.seller_email}</div>
                      <div>Amount: {format(escrow.amount)}</div>
                      <div>Status: <Badge>{escrow.status}</Badge></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {escrow.locked ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnlockFunds(escrow.id)}
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Unlock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLockFunds(escrow.id)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Lock
                      </Button>
                    )}
                    {escrow.status === 'funded' && !escrow.locked && (
                      <Button
                        size="sm"
                        onClick={() => handleManualRelease(escrow.id)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Manual Release
                      </Button>
                    )}
                    <Link to={createPageUrl(`EscrowView?id=${escrow.id}`)}>
                      <Button size="sm" variant="ghost" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <Footer minimal />
      </div>
    </RoleGuard>
  );
}

export default function AgentDashboard() {
  return <AgentDashboardInner />;
}