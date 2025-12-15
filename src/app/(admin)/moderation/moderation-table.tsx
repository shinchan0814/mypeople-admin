'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import { Search, Eye, Check, X, Ban, RefreshCw } from 'lucide-react';

interface Report {
  id: string;
  reporter_id: string | null;
  content_type: 'post' | 'message' | 'user' | 'profile';
  content_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  reporter: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
}

interface ModerationTableProps {
  initialData: Report[];
}

export function ModerationTable({ initialData }: ModerationTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const supabase = createClient();

  const filteredData = data.filter((report) => {
    const matchesSearch =
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.content_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAction = async (
    reportId: string,
    action: 'reviewed' | 'action_taken' | 'dismissed',
    actionDetails?: string
  ) => {
    setLoading(reportId);

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('reports')
      .update({
        status: action,
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
        action_taken: actionDetails || null,
      })
      .eq('id', reportId);

    if (!error) {
      setData((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: action,
                reviewed_at: new Date().toISOString(),
                action_taken: actionDetails || null,
              }
            : report
        )
      );
    }

    setLoading(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'reviewed':
        return <Badge variant="default">Reviewed</Badge>;
      case 'action_taken':
        return <Badge variant="success">Action Taken</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'spam':
        return <Badge variant="secondary">Spam</Badge>;
      case 'harassment':
        return <Badge variant="destructive">Harassment</Badge>;
      case 'inappropriate':
        return <Badge variant="warning">Inappropriate</Badge>;
      case 'violence':
        return <Badge variant="destructive">Violence</Badge>;
      default:
        return <Badge variant="outline">{reason}</Badge>;
    }
  };

  const getContentTypeBadge = (type: string) => {
    switch (type) {
      case 'post':
        return <Badge variant="default">Moment</Badge>;
      case 'message':
        return <Badge variant="secondary">Message</Badge>;
      case 'user':
        return <Badge variant="outline">User</Badge>;
      case 'profile':
        return <Badge variant="outline">Profile</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const refreshData = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              placeholder="Search reports..."
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
            <option value="reviewed">Reviewed</option>
            <option value="action_taken">Action Taken</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            <option value="all">All Types</option>
            <option value="post">Moments</option>
            <option value="message">Messages</option>
            <option value="user">Users</option>
            <option value="profile">Profiles</option>
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
                  Report
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Reported
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
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredData.map((report) => (
                  <tr key={report.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#0F172A] text-sm">
                          {report.description?.slice(0, 50) || 'No description'}
                          {(report.description?.length || 0) > 50 ? '...' : ''}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                          By: {report.reporter?.name || report.reporter?.phone || 'Unknown'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getContentTypeBadge(report.content_type)}</td>
                    <td className="px-6 py-4">{getReasonBadge(report.reason)}</td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {formatDateTime(report.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(report.id, 'reviewed')}
                            disabled={loading === report.id}
                            title="Mark as reviewed"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleAction(report.id, 'action_taken', 'Content removed')}
                            disabled={loading === report.id}
                            title="Take action"
                          >
                            {loading === report.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAction(report.id, 'dismissed')}
                            disabled={loading === report.id}
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {report.status !== 'pending' && (
                        <span className="text-sm text-[#64748B]">
                          {report.action_taken || 'No action'}
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
