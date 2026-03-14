import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Scale, FileText, User, BookOpen, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RoleGuard from '@/components/auth/RoleGuard';
import Footer from '@/components/common/Footer';
import CurrencySwitcher from '@/components/common/CurrencySwitcher';
import { useCurrency } from '@/components/common/CurrencyContext';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

function ArbitratorDashboardInner() {
  const { format } = useCurrency();
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [buyerPercent, setBuyerPercent] = useState(50);
  const queryClient = useQueryClient();

  const { data: disputedEscrows = [], isLoading } = useQuery({
    queryKey: ['disputed_escrows'],
    queryFn: () => base44.entities.Escrow.filter({ status: 'disputed' }, '-disputed_at')
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Escrow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputed_escrows'] });
      setSelectedDispute(null);
      setResolution('');
    }
  });

  const handleResolve = (escrow) => {
    const sellerPercent = 100 - buyerPercent;
    resolveMutation.mutate({
      id: escrow.id,
      data: {
        status: 'resolved',
        dispute: {
          ...escrow.dispute,
          resolution,
          resolved_at: new Date().toISOString(),
          arbitrator_notes: resolution,
          resolution_split: {
            buyer_percent: buyerPercent,
            seller_percent: sellerPercent
          }
        }
      }
    });
  };

  return (
    <RoleGuard allowedRoles={['arbitrator', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to={createPageUrl('ArbitratorDashboard')}>
                <img src={LOGO_URL} alt="Escropay" className="h-8 md:h-10 w-auto" />
              </Link>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700">Arbitrator</Badge>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Resolution</h1>
            <p className="text-gray-600">Review and resolve disputed transactions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Active Disputes</div>
              <div className="text-2xl font-bold text-gray-900">{disputedEscrows.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Total Disputed Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {format(disputedEscrows.reduce((sum, e) => sum + (e.amount || 0), 0))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm text-gray-500 mb-1">Pending Review</div>
              <div className="text-2xl font-bold text-red-600">{disputedEscrows.length}</div>
            </div>
          </div>

          {disputedEscrows.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Disputes</h3>
              <p className="text-gray-500">All disputes have been resolved</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputedEscrows.map((escrow) => (
                <div key={escrow.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{escrow.title}</h3>
                        <Badge className="bg-red-100 text-red-700">Disputed</Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1 mb-4">
                        <div>Amount: {format(escrow.amount)}</div>
                        <div>Buyer: {escrow.buyer_name || escrow.buyer_email}</div>
                        <div>Seller: {escrow.seller_name || escrow.seller_email}</div>
                      </div>

                      {escrow.dispute && (
                        <div className="space-y-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-xs text-gray-500 mb-1">Dispute Reason</div>
                            <div className="text-sm text-gray-900">{escrow.dispute.reason}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              Raised by: {escrow.dispute.raised_by}
                            </div>
                          </div>

                          {escrow.dispute.buyer_evidence?.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-xs text-blue-700 mb-2 font-medium">Buyer Evidence</div>
                              <div className="space-y-1">
                                {escrow.dispute.buyer_evidence.map((ev, idx) => (
                                  <div key={idx} className="text-sm text-gray-700">
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    {ev.description || 'Document'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {escrow.dispute.seller_evidence?.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="text-xs text-green-700 mb-2 font-medium">Seller Evidence</div>
                              <div className="space-y-1">
                                {escrow.dispute.seller_evidence.map((ev, idx) => (
                                  <div key={idx} className="text-sm text-gray-700">
                                    <FileText className="w-3 h-3 inline mr-1" />
                                    {ev.description || 'Document'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedDispute === escrow.id && (
                        <div className="space-y-4 border-t border-gray-200 pt-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Resolution Decision
                            </label>
                            <Textarea
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                              placeholder="Explain your decision and reasoning..."
                              className="h-32"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Fund Split - Buyer: {buyerPercent}% / Seller: {100 - buyerPercent}%
                            </label>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={buyerPercent}
                              onChange={(e) => setBuyerPercent(Number(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Buyer: {format(escrow.amount * buyerPercent / 100)}</span>
                              <span>Seller: {format(escrow.amount * (100 - buyerPercent) / 100)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleResolve(escrow)}
                              disabled={!resolution}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Scale className="w-4 h-4 mr-2" />
                              Submit Resolution
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedDispute(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link to={createPageUrl(`EscrowView?id=${escrow.id}`)}>
                        <Button size="sm" variant="outline">
                          View Full Details
                        </Button>
                      </Link>
                      {!selectedDispute && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedDispute(escrow.id)}
                        >
                          Resolve Dispute
                        </Button>
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

export default function ArbitratorDashboard() {
  return <ArbitratorDashboardInner />;
}