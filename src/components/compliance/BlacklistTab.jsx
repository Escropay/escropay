/**
 * @component BlacklistTab
 * @description Admin view: manage blacklisted identifiers — view, add, deactivate.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ban, Plus, Search, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const reasonColors = {
  fraud_history: 'bg-red-100 text-red-700',
  compliance_termination: 'bg-red-100 text-red-700',
  sanctions_exposure: 'bg-purple-100 text-purple-700',
  chargeback_abuse: 'bg-orange-100 text-orange-700',
  aml_violation: 'bg-red-200 text-red-800',
};

export default function BlacklistTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ identifier_type: 'email', identifier_value: '', reason: 'fraud_history', notes: '' });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['blacklist'],
    queryFn: () => base44.entities.Blacklist.list('-created_date', 200)
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Blacklist.create({ ...data, active: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blacklist'] }); setShowAdd(false); setForm({ identifier_type: 'email', identifier_value: '', reason: 'fraud_history', notes: '' }); }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.Blacklist.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blacklist'] })
  });

  const filtered = entries.filter(e =>
    !search ||
    e.identifier_value?.toLowerCase().includes(search.toLowerCase()) ||
    e.identifier_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search blacklist..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Entry
        </Button>
      </div>

      {showAdd && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-red-800 text-sm">Add Blacklist Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={form.identifier_type} onValueChange={v => setForm(f => ({ ...f, identifier_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="id_number">ID Number</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="company_reg">Company Reg</SelectItem>
                <SelectItem value="ip_address">IP Address</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Identifier value" value={form.identifier_value} onChange={e => setForm(f => ({ ...f, identifier_value: e.target.value }))} />
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fraud_history">Fraud History</SelectItem>
                <SelectItem value="compliance_termination">Compliance Termination</SelectItem>
                <SelectItem value="sanctions_exposure">Sanctions Exposure</SelectItem>
                <SelectItem value="chargeback_abuse">Chargeback Abuse</SelectItem>
                <SelectItem value="aml_violation">AML Violation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => addMutation.mutate(form)} disabled={!form.identifier_value || addMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white">
              {addMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Add to Blacklist
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Ban className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No blacklist entries</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Identifier</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(entry => (
                <TableRow key={entry.id} className={!entry.active ? 'opacity-50' : ''}>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{entry.identifier_type}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{entry.identifier_value}</TableCell>
                  <TableCell><Badge className={reasonColors[entry.reason] || 'bg-gray-100 text-gray-700'}>{entry.reason?.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-sm text-gray-600">{entry.added_by || 'system'}</TableCell>
                  <TableCell className="text-sm text-gray-500">{entry.created_date ? format(new Date(entry.created_date), 'MMM d, yyyy') : '—'}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleMutation.mutate({ id: entry.id, active: !entry.active })}
                      className="text-gray-500 hover:text-purple-600 transition-colors">
                      {entry.active ? <ToggleRight className="w-5 h-5 text-red-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}