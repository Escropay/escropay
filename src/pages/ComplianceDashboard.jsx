import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, UserX, CheckCircle, AlertTriangle, User, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RoleGuard from '@/components/auth/RoleGuard';
import Footer from '@/components/common/Footer';
import CurrencySwitcher from '@/components/common/CurrencySwitcher';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

function ComplianceDashboardInner() {
  const [activeTab, setActiveTab] = useState('kyc');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['all_users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: escrows = [] } = useQuery({
    queryKey: ['high_value_escrows'],
    queryFn: () => base44.entities.Escrow.list('-amount')
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_users'] });
    }
  });

  const updateEscrowMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Escrow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['high_value_escrows'] });
    }
  });

  const handleKYCApproval = (userId, status) => {
    updateUserMutation.mutate({ id: userId, data: { kyc_status: status } });
  };

  const handleFreezeAccount = (userId, freeze) => {
    updateUserMutation.mutate({ id: userId, data: { account_frozen: freeze } });
  };

  const handleApproveHighValue = (escrowId) => {
    updateEscrowMutation.mutate({
      id: escrowId,
      data: {
        compliance_review: {
          status: 'approved',
          reviewed_at: new Date().toISOString()
        }
      }
    });
  };

  const pendingKYC = users.filter(u => u.kyc_status === 'pending');
  const frozenAccounts = users.filter(u => u.account_frozen);
  const flaggedUsers = users.filter(u => u.aml_flags?.length > 0);
  const highValueEscrows = escrows.filter(e => e.amount > 100000);

  return (
    <RoleGuard allowedRoles={['compliance', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl('ComplianceDashboard')}>
                <img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" />
              </Link>
              <div className="flex items-center gap-3">
                <Badge className="bg-red-100 text-red-700">Compliance</Badge>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance & Risk Management</h1>
            <p className="text-gray-600">Monitor KYC, AML, and high-value transactions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Pending KYC</div>
              <div className="text-2xl font-bold text-amber-600">{pendingKYC.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">AML Flags</div>
              <div className="text-2xl font-bold text-red-600">{flaggedUsers.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Frozen Accounts</div>
              <div className="text-2xl font-bold text-gray-900">{frozenAccounts.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">High-Value Transactions</div>
              <div className="text-2xl font-bold text-purple-600">{highValueEscrows.length}</div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="kyc">KYC Review</TabsTrigger>
              <TabsTrigger value="aml">AML Flags</TabsTrigger>
              <TabsTrigger value="high_value">High-Value Transactions</TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'kyc' && (
            <div className="space-y-4">
              {pendingKYC.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{user.full_name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Email: {user.email}</div>
                        <div>Company: {user.company || 'N/A'}</div>
                        <div>Country: {user.country || 'N/A'}</div>
                        <div>Documents: {user.kyc_documents?.length || 0}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleKYCApproval(user.id, 'verified')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleKYCApproval(user.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingKYC.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No pending KYC reviews</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'aml' && (
            <div className="space-y-4">
              {flaggedUsers.map((user) => (
                <div key={user.id} className="bg-white border border-red-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                        <Badge className="bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          AML Flag
                        </Badge>
                        {user.account_frozen && (
                          <Badge className="bg-gray-800 text-white">Frozen</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{user.email}</div>
                      <div className="space-y-2">
                        {user.aml_flags?.map((flag, idx) => (
                          <div key={idx} className="bg-red-50 rounded-lg p-3">
                            <div className="text-xs text-red-700 font-medium">{flag.type}</div>
                            <div className="text-sm text-gray-700">{flag.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      {user.account_frozen ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFreezeAccount(user.id, false)}
                        >
                          Unfreeze Account
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleFreezeAccount(user.id, true)}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Freeze Account
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {flaggedUsers.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <ShieldAlert className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No AML flags</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'high_value' && (
            <div className="space-y-4">
              {highValueEscrows.map((escrow) => (
                <div key={escrow.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{escrow.title}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="text-xl font-bold text-purple-600 mb-2">R {escrow.amount?.toLocaleString()}</div>
                        <div>Buyer: {escrow.buyer_email}</div>
                        <div>Seller: {escrow.seller_email}</div>
                        <div>Status: <Badge>{escrow.status}</Badge></div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!escrow.compliance_review?.status || escrow.compliance_review.status === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => handleApproveHighValue(escrow.id)}
                        >
                          Approve Transaction
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                      <Link to={createPageUrl(`EscrowView?id=${escrow.id}`)}>
                        <Button size="sm" variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
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

export default function ComplianceDashboard() {
  return <ComplianceDashboardInner />;
}