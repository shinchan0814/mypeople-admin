import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface ActivityItem {
  id: string;
  primary: string;
  secondary: string;
  timestamp: string;
  avatar?: string | null;
  status?: string;
}

interface RecentActivityProps {
  title: string;
  items: ActivityItem[];
  emptyMessage: string;
  viewAllHref: string;
}

export function RecentActivity({
  title,
  items,
  emptyMessage,
  viewAllHref,
}: RecentActivityProps) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link
          href={viewAllHref}
          className="text-sm text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-[#64748B] py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0"
              >
                <div className="flex items-center gap-3">
                  {item.avatar !== undefined && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A5B4FC] flex items-center justify-center text-white font-medium">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        item.primary.charAt(0).toUpperCase()
                      )}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-[#0F172A]">{item.primary}</p>
                    <p className="text-sm text-[#64748B]">{item.secondary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.status && getStatusBadge(item.status)}
                  <span className="text-xs text-[#94A3B8]">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
