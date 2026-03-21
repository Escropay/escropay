/**
 * @component TransactionAlertsTab
 * @description Admin view: live feed of transaction monitoring alerts with review actions.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle, CheckCircle2, Search, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Zap, Clock, XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const severityConfig = {
  low: { color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  medium: { color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  high: { color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  critical: { color: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
};

const statusConfig = {
  open: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  under_review: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  resolved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  escalated: { color: 'bg-purple-100 text-purple-700', icon: Zap },
  false_positive: { color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

function AlertRow({ alert, onUpdate, isUpdating }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(alert.resolution_notes || '');

  const sev = severityConfig[alert.severity] || severityConfig.medium;
  const stat = statusConfig[alert.status] || statusConfig.open;
  const StatIcon = stat.icon;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-gray-500">{alert.rule_id}</span>
            <Badge className={sev.color}>{alert.severity}</Badge>
            <Badge className={stat.color}><StatIcon className="w-3 h-3 mr-0.5" />{alert.status}</Badge>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 truncate">{alert.description}</p>
          <p className="text-xs text-gray-400 mt-0.5">{alert.user_email} · {alert.triggered_at ? format(new Date(alert.triggered_at), 'MMM d, HH:mm') : '—'}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
          {alert.automated_action_taken && (
            <p className="text-xs bg-orange-50 text-orange-700 border border-orange-100 rounded-lg px-3 py-2">
              ⚡ Automated action: {alert.automated_action_taken}
            </p>
          )}
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Resolution notes..."
            className="text-sm h-16"
          />
          <div className="flex flex-wrap gap-2">
            {alert.status === 'open' && (
              <Button size="sm" variant="outline" onClick={() => onUpdate(alert.id, 'under_review', notes)}
                disabled={isUpdating} className="text-amber-600 border-amber-300 hover:bg-amber-50">
                <Clock className="w-3 h-3 mr-1" /> Start Review
              </Button>
            )}
            <Button size="sm" onClick={() => onUpdate(alert.id, 'resolved', notes)}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Resolve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onUpdate(alert.id, 'escalated', notes)}
              disabled={isUpdating} className="text-purple-600 border-purple-300 hover:bg-purple-50">
              <Zap className="w-3 h-3 mr-1" /> Escalate
            </Button>
            <Button size="sm" variant="outline" onClick={() => onUpdate(alert.id, 'false_positive', notes)}
              disabled={isUpdating} className="text-gray-600 border-gray-300">
              <XCircle className="w-3 h-3 mr-1" /> False Positive
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionAlertsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['transaction-alerts'],
    queryFn: () => base44.entities.TransactionAlert.list('-triggered_at', 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes, reviewedBy }) => base44.entities.TransactionAlert.update(id, {
      status,
      resolution_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transaction-alerts'] })
  });

  const runMonitoringMutation = useMutation({
    mutationFn: () => base44.functions.invoke('runTransactionMonitoring', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transaction-alerts'] })
  });

  const filtered = alerts.filter(a => {
    const matchSearch = !search ||
      a.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      a.rule_id?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === 'all' || a.severity === severityFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchSev && matchStatus;
  });

  const openCount = alerts.filter(a => a.status === 'open').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'open').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-700">{criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <span className="text-sm text-gray-600">{openCount} open · {alerts.length} total</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => runMonitoringMutation.mutate()}
          disabled={runMonitoringMutation.isPending} className="ml-auto">
          {runMonitoringMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Run Monitoring Now
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>No alerts matching filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onUpdate={(id, status, notes) => updateMutation.mutate({ id, status, notes })}
              isUpdating={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}