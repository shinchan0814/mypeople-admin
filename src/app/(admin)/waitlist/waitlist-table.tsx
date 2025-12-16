'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import { Search, Send, Check, X, Copy, RefreshCw } from 'lucide-react';

interface WaitlistItem {
  id: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'invited' | 'registered' | 'declined';
  source: string;
  invite_code: string | null;
  invited_at: string | null;
  registered_at: string | null;
  notes: string | null;
  created_at: string;
}

interface WaitlistTableProps {
  initialData: WaitlistItem[];
}

export function WaitlistTable({ initialData }: WaitlistTableProps) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const supabase = createClient();

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesEmail = (item.email || '').toLowerCase().includes(searchLower);
    const matchesPhone = (item.phone || '').toLowerCase().includes(searchLower);
    const matchesSearch = matchesEmail || matchesPhone;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInvite = async (id: string) => {
    setLoading(id);

    const { data: inviteCode, error } = await supabase.rpc('invite_from_waitlist', {
      waitlist_id: id,
    });

    if (!error && inviteCode) {
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'invited' as const, invite_code: inviteCode, invited_at: new Date().toISOString() }
            : item
        )
      );
    }

    setLoading(null);
  };

  const handleDecline = async (id: string) => {
    setLoading(id);

    const { error } = await supabase
      .from('waitlist')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'declined' as const } : item
        )
      );
    }

    setLoading(null);
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'invited':
        return <Badge variant="default">Invited</Badge>;
      case 'registered':
        return <Badge variant="success">Registered</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const refreshData = async () => {
    const { data: newData } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (newData) {
      setData(newData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              placeholder="Search by email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="invited">Invited</option>
            <option value="registered">Registered</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Invite Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Signed Up
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#64748B]">
                    No waitlist entries found
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4">
                      <span className="font-medium text-[#0F172A]">{item.email || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#334155]">{item.phone || '—'}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">
                      {item.invite_code ? (
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-[#F1F5F9] rounded text-sm font-mono">
                            {item.invite_code}
                          </code>
                          <button
                            onClick={() => copyInviteCode(item.invite_code!)}
                            className="p-1 hover:bg-[#F1F5F9] rounded"
                          >
                            {copiedCode === item.invite_code ? (
                              <Check className="w-4 h-4 text-[#10B981]" />
                            ) : (
                              <Copy className="w-4 h-4 text-[#64748B]" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleInvite(item.id)}
                            disabled={loading === item.id}
                          >
                            {loading === item.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-1" />
                                Invite
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDecline(item.id)}
                            disabled={loading === item.id}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {item.status === 'invited' && (
                        <span className="text-sm text-[#64748B]">
                          Invited {item.invited_at ? formatDateTime(item.invited_at) : ''}
                        </span>
                      )}
                      {item.status === 'registered' && (
                        <span className="text-sm text-[#10B981]">
                          Registered {item.registered_at ? formatDateTime(item.registered_at) : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
