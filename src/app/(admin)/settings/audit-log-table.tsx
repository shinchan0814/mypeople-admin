'use client';

import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
}

interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const getActionBadge = (action: string) => {
    if (action.includes('ban')) return <Badge variant="destructive">{action}</Badge>;
    if (action.includes('invite')) return <Badge variant="success">{action}</Badge>;
    if (action.includes('update')) return <Badge variant="warning">{action}</Badge>;
    if (action.includes('create')) return <Badge variant="default">{action}</Badge>;
    return <Badge variant="secondary">{action}</Badge>;
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-[#64748B]">
        No audit logs yet. Admin actions will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Entity
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Admin
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-[#F8FAFC]">
              <td className="px-4 py-3">{getActionBadge(log.action)}</td>
              <td className="px-4 py-3">
                <span className="text-sm text-[#334155]">
                  {log.entity_type}
                  {log.entity_id && (
                    <span className="text-[#94A3B8] ml-1">
                      ({log.entity_id.slice(0, 8)}...)
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-[#64748B]">
                {log.admin?.name || log.admin?.phone || 'System'}
              </td>
              <td className="px-4 py-3 text-sm text-[#64748B]">
                {formatDateTime(log.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
