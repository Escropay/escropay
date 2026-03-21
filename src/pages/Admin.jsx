import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  FileText, 
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Eye,
  Banknote,
  Ban,
  ScrollText,
  Bot,
  Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ComplianceQueueTab from '@/components/compliance/ComplianceQueueTab';
import TransactionAlertsTab from '@/components/compliance/TransactionAlertsTab';
import BlacklistTab from '@/components/compliance/BlacklistTab';
import AuditLogTab from '@/components/compliance/AuditLogTab';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  funded: 'bg-cyan-100 text-cyan-700',
  released: 'bg-emerald-100 text-emerald-700',
  disputed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700'
};

const kycColors = {
  not_started: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700'
};

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [escrowSearch, setEscrowSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoadingUser && currentUser && currentUser.role !== 'admin') {
      navigate('/Dashboard', { replace: true }); // createPageUrl removed — direct path used
    }
  }, [currentUser, isLoadingUser, navigate]);

  const { data: escrows = [], isLoading: loadingEscrows } = useQuery({
    queryKey: ['admin-escrows'],
    queryFn: () => base44.entities.Escrow.list('-created_date', 100),
    enabled: !!currentUser && currentUser.role === 'admin'
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    enabled: !!currentUser && currentUser.role === 'admin'
  });

  const updateEscrowMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Escrow.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-escrows'] })
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  // Guard: show spinner while loading or if not admin
  if (isLoadingUser || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const handleKycUpdate = (userId, status) => {
    const data = { kyc_status: status };
    // When admin verifies KYC, also activate the account so user can transact
    if (status === 'verified') data.account_status = 'active';
    updateUserMutation.mutate({ id: userId, data });
  };

  const handleEscrowStatusUpdate = (escrowId, status) => {
    const updates = { status };
    if (status === 'funded') updates.funded_at = new Date().toISOString();
    if (status === 'released') updates.released_at = new Date().toISOString();
    if (status === 'disputed') updates.disputed_at = new Date().toISOString();
    updateEscrowMutation.mutate({ id: escrowId, data: updates });
  };

  const filteredEscrows = escrows.filter(e => {
    const matchesSearch = e.title?.toLowerCase().includes(escrowSearch.toLowerCase()) ||
                          e.buyer_email?.toLowerCase().includes(escrowSearch.toLowerCase()) ||
                          e.seller_email?.toLowerCase().includes(escrowSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const stats = {
    totalVolume: escrows.reduce((sum, e) => sum + (e.amount || 0), 0),
    totalEscrows: escrows.length,
    activeDisputes: escrows.filter(e => e.status === 'disputed').length,
    pendingKyc: users.filter(u => u.kyc_status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/Dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <img src={LOGO_URL} alt="EscroPay" className="h-8" />
              <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Volume</p>
                <p className="text-xl font-bold text-gray-900">R {stats.totalVolume.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <FileText className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Escrows</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalEscrows}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Disputes</p>
                <p className="text-xl font-bold text-gray-900">{stats.activeDisputes}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending KYC</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingKyc}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="compliance" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="compliance" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Shield className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Compliance Queue</span>
              <span className="sm:hidden">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Transaction Alerts</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="blacklist" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
              <Ban className="w-4 h-4 mr-1" />
              Blacklist
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700">
              <ScrollText className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Audit Log</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>
            <TabsTrigger value="escrows" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <FileText className="w-4 h-4 mr-1" />
              Escrows
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Users className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Users & KYC</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
          </TabsList>

          {/* Compliance Queue Tab */}
          <TabsContent value="compliance">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" /> Compliance Review Queue
              </h2>
              <p className="text-sm text-gray-500 mb-5">Review and approve user accounts. No client may transact until compliance approval is granted.</p>
              <ComplianceQueueTab />
            </div>
          </TabsContent>

          {/* Transaction Alerts Tab */}
          <TabsContent value="alerts">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" /> Transaction Monitoring Alerts
              </h2>
              <p className="text-sm text-gray-500 mb-5">Real-time alerts from the compliance rule engine (Rules 1–45). Review and action each alert.</p>
              <TransactionAlertsTab />
            </div>
          </TabsContent>

          {/* Blacklist Tab */}
          <TabsContent value="blacklist">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" /> Blacklist Management
              </h2>
              <p className="text-sm text-gray-500 mb-5">Manage identifiers that are permanently blocked from onboarding or transacting.</p>
              <BlacklistTab />
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-gray-600" /> Audit Trail
              </h2>
              <p className="text-sm text-gray-500 mb-5">Immutable audit log of all compliance events. Retained 5 years per FICA requirements.</p>
              <AuditLogTab />
            </div>
          </TabsContent>

          {/* Escrows Tab */}
          <TabsContent value="escrows">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search escrows..."
                    value={escrowSearch}
                    onChange={(e) => setEscrowSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_seller_acceptance">Pending Acceptance</SelectItem>
                    <SelectItem value="modification_requested">Modification Requested</SelectItem>
                    <SelectItem value="rejected_by_seller">Rejected</SelectItem>
                    <SelectItem value="pending">Pending Funding</SelectItem>
                    <SelectItem value="funded">Funded</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEscrows ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : filteredEscrows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No escrows found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEscrows.map((escrow) => (
                      <TableRow key={escrow.id}>
                        <TableCell className="font-medium">{escrow.title}</TableCell>
                        <TableCell className="text-sm text-gray-600">{escrow.buyer_email}</TableCell>
                        <TableCell className="text-sm text-gray-600">{escrow.seller_email}</TableCell>
                        <TableCell className="font-medium">R {escrow.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[escrow.status]}>{escrow.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {escrow.created_date ? format(new Date(escrow.created_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            {escrow.status === 'released' ? (
                              <Badge className="bg-emerald-100 text-emerald-700">Released</Badge>
                            ) : (
                              <>
                                {escrow.status === 'funded' && (
                                  <div className="flex flex-col gap-1">
                                    {escrow.payout_requested && (
                                      <Badge className="bg-amber-100 text-amber-700 text-xs">Payout Requested</Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => handleEscrowStatusUpdate(escrow.id, 'released')}
                                      disabled={updateEscrowMutation.isPending}
                                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                    >
                                      <Banknote className="w-3 h-3 mr-1" />
                                      Release Funds
                                    </Button>
                                  </div>
                                )}
                                <Select
                                  value={escrow.status}
                                  onValueChange={(value) => handleEscrowStatusUpdate(escrow.id, value)}
                                >
                                  <SelectTrigger className="w-28 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="funded">Funded</SelectItem>
                                    <SelectItem value="disputed">Disputed</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                        <TableCell className="text-sm text-gray-600">{user.company || '-'}</TableCell>
                        <TableCell>
                          <Badge className={kycColors[user.kyc_status || 'not_started']}>
                            {user.kyc_status || 'not_started'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {user.created_date ? format(new Date(user.created_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.kyc_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleKycUpdate(user.id, 'verified')}
                                  className="h-7 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleKycUpdate(user.id, 'rejected')}
                                  className="h-7 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {user.kyc_documents?.length > 0 && (
                              <Button size="sm" variant="ghost" className="h-7">
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}