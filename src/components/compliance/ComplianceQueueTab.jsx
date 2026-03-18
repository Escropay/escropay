/**
 * @component ComplianceQueueTab
 * @description Admin view: users pending compliance approval with full CDD review actions.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Search,
  Eye, Shield, User, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

const riskColors = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  PROHIBITED: 'bg-red-100 text-red-700',
};

const statusColors = {
  pending_compliance_approval: 'bg-amber-100 text-amber-700',
  restricted: 'bg-orange-100 text-orange-700',
  suspended: 'bg-red-100 text-red-700',
  terminated: 'bg-red-200 text-red-900',
  active: 'bg-emerald-100 text-emerald-700',
  blacklisted: 'bg-red-300 text-red-900',
};

function UserReviewPanel({ user, complianceRecord, onAction, isLoading }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionPending, setActionPending] = useState(null);

  const handleAction = (action) => {
    setActionPending(action);
    onAction(user.id, action, notes);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{user.full_name || '—'}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {complianceRecord?.risk_rating && (
            <Badge className={riskColors[complianceRecord.risk_rating]}>
              {complianceRecord.risk_rating}
            </Badge>
          )}
          <Badge className={statusColors[user.account_status] || 'bg-gray-100 text-gray-700'}>
            {user.account_status?.replace(/_/g, ' ') || 'pending'}
          </Badge>
          <Badge className="bg-gray-100 text-gray-700">{user.kyc_status || 'not_started'}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-xs text-gray-500">Country</p><p className="font-medium">{user.country || '—'}</p></div>
            <div><p className="text-xs text-gray-500">Country Risk</p>
              <p className={`font-medium ${user.country_risk === 'sanctioned' ? 'text-red-600' : user.country_risk === 'high' ? 'text-orange-600' : 'text-gray-900'}`}>
                {user.country_risk || 'unknown'}
              </p>
            </div>
            <div><p className="text-xs text-gray-500">Risk Score</p><p className="font-medium">{complianceRecord?.risk_score ?? '—'}/100</p></div>
            <div><p className="text-xs text-gray-500">Account Type</p><p className="font-medium capitalize">{user.account_type || 'individual'}</p></div>
            <div><p className="text-xs text-gray-500">Industry</p><p className="font-medium">{user.industry || '—'}</p></div>
            <div><p className="text-xs text-gray-500">Source of Funds</p><p className="font-medium">{user.source_of_funds || '—'}</p></div>
            <div><p className="text-xs text-gray-500">PEP Status</p>
              <p className={`font-medium ${user.pep_declaration?.is_pep ? 'text-red-600' : 'text-gray-900'}`}>
                {user.pep_declaration?.is_pep ? `YES — ${user.pep_declaration.pep_type}` : 'No'}
              </p>
            </div>
            <div><p className="text-xs text-gray-500">Sanctions Screen</p>
              <p className="font-medium">{complianceRecord?.sanctions_status || 'not_run'}</p>
            </div>
          </div>

          {/* KYC Docs */}
          {user.kyc_documents?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">KYC Documents</p>
              <div className="flex flex-wrap gap-2">
                {user.kyc_documents.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-600 hover:underline bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                    <Eye className="w-3 h-3" />
                    {doc.type} — {doc.status}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Risk Breakdown */}
          {complianceRecord?.risk_breakdown && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Risk Score Breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(complianceRecord.risk_breakdown).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-xs bg-white rounded-lg p-2 border border-gray-100">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{val.weighted?.toFixed(1) ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Panel */}
          {user.account_status !== 'active' && user.account_status !== 'terminated' && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <Textarea
                placeholder="Compliance notes (required for reject/terminate actions)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-sm h-20"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleAction('approve')}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isLoading && actionPending === 'approve' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  Approve & Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction('require_edd')}
                  disabled={isLoading}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Require EDD
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction('suspend')}
                  disabled={isLoading}
                  className="border-amber-300 text-amber-600 hover:bg-amber-50">
                  <Clock className="w-3 h-3 mr-1" /> Suspend
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction('terminate')}
                  disabled={isLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50">
                  <XCircle className="w-3 h-3 mr-1" /> Terminate & Blacklist
                </Button>
              </div>
            </div>
          )}
          {user.account_status === 'active' && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Account is active and compliant.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComplianceQueueTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['compliance-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200)
  });

  const { data: complianceRecords = [] } = useQuery({
    queryKey: ['compliance-records'],
    queryFn: () => base44.entities.ComplianceRecord.list('-created_date', 200)
  });

  const actionMutation = useMutation({
    mutationFn: ({ user_id, action, notes }) =>
      base44.functions.invoke('approveCompliance', { user_id, action, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-users'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const runComplianceMutation = useMutation({
    mutationFn: ({ user_id, user_email }) =>
      base44.functions.invoke('runOnboardingCompliance', { user_id, user_email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-users'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-records'] });
    }
  });

  const pendingUsers = allUsers.filter(u =>
    ['pending_compliance_approval', 'restricted', 'suspended'].includes(u.account_status)
  );

  const filtered = pendingUsers.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRecord = (userId) => complianceRecords.find(r => r.user_id === userId);

  const stats = {
    pending: allUsers.filter(u => u.account_status === 'pending_compliance_approval').length,
    restricted: allUsers.filter(u => u.account_status === 'restricted').length,
    suspended: allUsers.filter(u => u.account_status === 'suspended').length,
    active: allUsers.filter(u => u.account_status === 'active').length,
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Approval', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'EDD / Restricted', value: stats.restricted, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Active & Approved', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-gray-100`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Queue */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No users pending compliance review</p>
          </div>
        ) : (
          filtered.map(user => (
            <UserReviewPanel
              key={user.id}
              user={user}
              complianceRecord={getRecord(user.id)}
              onAction={(userId, action, notes) => actionMutation.mutate({ user_id: userId, action, notes })}
              isLoading={actionMutation.isPending}
            />
          ))
        )}
      </div>

      {/* Run compliance on all pending */}
      <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
        <Button variant="outline" size="sm"
          onClick={() => {
            allUsers.filter(u => !u.risk_rating).forEach(u =>
              runComplianceMutation.mutate({ user_id: u.id, user_email: u.email })
            );
          }}
          disabled={runComplianceMutation.isPending}>
          {runComplianceMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
          Run Risk Scoring on Unscored Users
        </Button>
      </div>
    </div>
  );
}