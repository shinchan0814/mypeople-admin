'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import { Search, Ban, ShieldCheck, Eye, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  phone: string;
  profile_photo_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
  status: string | null;
  connection_count: number;
  post_count: number;
}

interface UsersTableProps {
  initialData: User[];
}

export function UsersTable({ initialData }: UsersTableProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const supabase = createClient();

  const filteredData = data.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'banned' && user.is_banned) ||
      (statusFilter === 'admin' && user.is_admin) ||
      (statusFilter === 'active' && !user.is_banned);
    return matchesSearch && matchesStatus;
  });

  const handleBan = async (userId: string, currentBanned: boolean) => {
    setLoading(userId);

    const { error } = await supabase
      .from('users')
      .update({
        is_banned: !currentBanned,
        banned_at: !currentBanned ? new Date().toISOString() : null,
        ban_reason: !currentBanned ? 'Banned by admin' : null,
      })
      .eq('id', userId);

    if (!error) {
      setData((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_banned: !currentBanned,
                ban_reason: !currentBanned ? 'Banned by admin' : null,
              }
            : user
        )
      );
    }

    setLoading(null);
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    setLoading(userId);

    const { error } = await supabase
      .from('users')
      .update({ is_admin: !currentAdmin })
      .eq('id', userId);

    if (!error) {
      setData((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_admin: !currentAdmin } : user
        )
      );
    }

    setLoading(null);
  };

  const refreshData = async () => {
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
              placeholder="Search by name or phone..."
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
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="admin">Admins</option>
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
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Connections
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Moments
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                  Joined
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
                    No users found
                  </td>
                </tr>
              ) : (
                filteredData.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A5B4FC] flex items-center justify-center text-white font-medium overflow-hidden">
                          {user.profile_photo_url ? (
                            <img
                              src={user.profile_photo_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (user.name?.charAt(0) || user.phone.charAt(0)).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">
                            {user.name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-[#64748B]">{user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.is_admin && <Badge variant="default">Admin</Badge>}
                        {user.is_banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#334155]">
                      {user.connection_count}/7
                    </td>
                    <td className="px-6 py-4 text-[#334155]">{user.post_count}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/users/${user.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={user.is_banned ? 'success' : 'destructive'}
                          onClick={() => handleBan(user.id, user.is_banned)}
                          disabled={loading === user.id}
                        >
                          {loading === user.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : user.is_banned ? (
                            <ShieldCheck className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
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
