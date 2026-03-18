/**
 * @component AuditLogTab
 * @description Admin view: immutable audit trail with filtering and export.
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';

const eventTypeColors = {
  account_activated: 'bg-emerald-100 text-emerald-700',
  account_restricted: 'bg-orange-100 text-orange-700',
  account_suspended: 'bg-red-100 text-red-700',
  account_terminated: 'bg-red-200 text-red-900',
  kyc_approved: 'bg-emerald-100 text-emerald-700',
  kyc_rejected: 'bg-red-100 text-red-700',
  risk_score_calculated: 'bg-blue-100 text-blue-700',
  blacklist_match_found: 'bg-red-100 text-red-700',
  edd_triggered: 'bg-orange-100 text-orange-700',
  escrow_funded: 'bg-cyan-100 text-cyan-700',
  escrow_released: 'bg-emerald-100 text-emerald-700',
  escrow_disputed: 'bg-red-100 text-red-700',
  cdd_approved: 'bg-emerald-100 text-emerald-700',
  cdd_rejected: 'bg-red-100 text-red-700',
  admin_action_taken: 'bg-purple-100 text-purple-700',
};

const actorColors = {
  admin: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-600',
  user: 'bg-blue-100 text-blue-700',
};

export default function AuditLogTab() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 500)
  });

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_id?.toLowerCase().includes(search.toLowerCase());
    const matchEntity = entityFilter === 'all' || l.entity_type === entityFilter;
    const matchActor = actorFilter === 'all' || l.actor_role === actorFilter;
    return matchSearch && matchEntity && matchActor;
  });

  const handleExport = () => {
    const headers = ['Date', 'Event', 'Entity Type', 'Entity ID', 'Actor', 'Role', 'Description'];
    const rows = filtered.map(l => [
      l.created_date ? format(new Date(l.created_date), 'yyyy-MM-dd HH:mm:ss') : '',
      l.event_type,
      l.entity_type,
      l.entity_id,
      l.actor_email,
      l.actor_role,
      `"${(l.description || '').replace(/"/g, "'")}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escropay_audit_log_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Escrow">Escrow</SelectItem>
            <SelectItem value="TransactionAlert">Alert</SelectItem>
            <SelectItem value="ComplianceRecord">Compliance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actorFilter} onValueChange={setActorFilter}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Actor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actors</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="text-xs text-gray-400 flex items-center gap-1">
        <Shield className="w-3 h-3" /> {filtered.length} log entries · Immutable audit trail · Retained 5 years per FICA
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No audit log entries</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {filtered.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50">
              <div className="flex-shrink-0 pt-0.5">
                <Badge className={eventTypeColors[log.event_type] || 'bg-gray-100 text-gray-600'} style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {log.event_type?.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{log.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={actorColors[log.actor_role] || 'bg-gray-100 text-gray-600'} style={{ fontSize: '10px', padding: '1px 5px' }}>
                    {log.actor_role}
                  </Badge>
                  <span className="text-xs text-gray-400">{log.actor_email}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{log.entity_type} #{log.entity_id?.slice(-6)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-xs text-gray-400">
                {log.created_date ? format(new Date(log.created_date), 'MMM d, HH:mm') : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}