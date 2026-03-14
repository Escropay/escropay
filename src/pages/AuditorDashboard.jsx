import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, User, BookOpen, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RoleGuard from '@/components/auth/RoleGuard';
import Footer from '@/components/common/Footer';
import CurrencySwitcher from '@/components/common/CurrencySwitcher';
import { useCurrency } from '@/components/common/CurrencyContext';
import { format } from 'date-fns';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

function AuditorDashboardInner() {
  const { format: formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState('transactions');

  const { data: escrows = [] } = useQuery({
    queryKey: ['all_escrows_audit'],
    queryFn: () => base44.entities.Escrow.list('-created_date')
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 50)
  });

  const { data: walletTransactions = [] } = useQuery({
    queryKey: ['wallet_transactions'],
    queryFn: () => base44.entities.WalletTransaction.list('-created_date', 100)
  });

  const totalValue = escrows.reduce((sum, e) => sum + (e.amount || 0), 0);
  const completedValue = escrows.filter(e => e.status === 'completed').reduce((sum, e) => sum + (e.amount || 0), 0);
  const activeEscrows = escrows.filter(e => e.status === 'funded' || e.status === 'in_progress').length;

  return (
    <RoleGuard allowedRoles={['auditor', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl('AuditorDashboard')}>
                <img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" />
              </Link>
              <div className="flex items-center gap-3">
                <Badge className="bg-slate-100 text-slate-700">
                  <Eye className="w-3 h-3 mr-1" />
                  Auditor (Read-Only)
                </Badge>
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

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit & Oversight Dashboard</h1>
            <p className="text-gray-600">Complete read-only access to platform activity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{escrows.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Total Value</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Active Escrows</div>
              <div className="text-2xl font-bold text-green-600">{activeEscrows}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Completed Value</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(completedValue)}</div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="transactions">All Transactions</TabsTrigger>
              <TabsTrigger value="audit_logs">Audit Logs</TabsTrigger>
              <TabsTrigger value="wallet">Wallet Activity</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {escrows.map((escrow) => (
                <div key={escrow.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{escrow.title}</h3>
                        <Badge>{escrow.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Amount: {formatCurrency(escrow.amount)}</div>
                        <div>Buyer: {escrow.buyer_email}</div>
                        <div>Seller: {escrow.seller_email}</div>
                        <div>Created: {format(new Date(escrow.created_date), 'MMM d, yyyy HH:mm')}</div>
                        {escrow.transaction_hash && (
                          <div className="text-xs text-gray-500 font-mono">
                            Blockchain: {escrow.transaction_hash.substring(0, 16)}...
                          </div>
                        )}
                      </div>
                    </div>
                    <Link to={createPageUrl(`EscrowView?id=${escrow.id}`)}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audit_logs' && (
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">System Audit Trail</h3>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </Button>
              </div>
              <div className="divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{log.action}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          By: {log.actor_email} ({log.actor_role})
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(log.created_date), 'MMM d, yyyy HH:mm:ss')}
                        </div>
                      </div>
                      {log.escrow_id && (
                        <Link to={createPageUrl(`EscrowView?id=${log.escrow_id}`)}>
                          <Button size="sm" variant="ghost">
                            <FileText className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-4">
              {walletTransactions.map((tx) => (
                <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge>{tx.type}</Badge>
                        <Badge variant="outline">{tx.status}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        User: {tx.user_email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(tx.created_date), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(tx.amount)}
                      </div>
                      {tx.blockchain_hash && (
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {tx.blockchain_hash.substring(0, 12)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer minimal />
      </div>
    </RoleGuard>
  );
}

export default function AuditorDashboard() {
  return <AuditorDashboardInner />;
}