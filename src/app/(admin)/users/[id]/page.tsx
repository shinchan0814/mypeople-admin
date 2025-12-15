import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { UserActions } from './user-actions';
import { ArrowLeft, Users, Image, MessageSquare, Calendar } from 'lucide-react';
import Link from 'next/link';

async function getUserData(id: string) {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) {
    return null;
  }

  // Get connections
  const { data: connections } = await supabase
    .from('connections')
    .select(`
      id,
      created_at,
      connected_user:connected_user_id (
        id,
        name,
        phone,
        profile_photo_url
      )
    `)
    .eq('user_id', id);

  // Get posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, media_url, media_type, created_at')
    .eq('author_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get message count
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', id);

  // Get reports about this user
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('content_type', 'user')
    .eq('content_id', id);

  return {
    user,
    connections: connections || [],
    posts: posts || [],
    messageCount: messageCount || 0,
    reports: reports || [],
  };
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getUserData(id);

  if (!data) {
    notFound();
  }

  const { user, connections, posts, messageCount, reports } = data;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/users"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#334155]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#A5B4FC] flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
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
              <h1 className="text-2xl font-bold text-[#0F172A]">
                {user.name || 'Unnamed User'}
              </h1>
              <p className="text-[#64748B]">{user.phone}</p>
              <div className="flex gap-2 mt-2">
                {user.is_admin && <Badge variant="default">Admin</Badge>}
                {user.is_banned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
            </div>
          </div>
          <UserActions user={user} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#6366F1]/10">
              <Users className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">{connections.length}/7</p>
              <p className="text-sm text-[#64748B]">Connections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#EC4899]/10">
              <Image className="w-5 h-5 text-[#EC4899]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">{posts.length}</p>
              <p className="text-sm text-[#64748B]">Moments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#10B981]/10">
              <MessageSquare className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">{messageCount}</p>
              <p className="text-sm text-[#64748B]">Messages Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#F59E0B]/10">
              <Calendar className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">
                {user.birthday ? new Date(user.birthday).toLocaleDateString() : '—'}
              </p>
              <p className="text-sm text-[#64748B]">Birthday</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Connections ({connections.length}/7)</CardTitle>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <p className="text-[#64748B] text-center py-4">No connections yet</p>
            ) : (
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {connections.map((conn: any) => {
                  const connectedUser = conn.connected_user;
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A5B4FC] flex items-center justify-center text-white font-medium overflow-hidden">
                          {connectedUser?.profile_photo_url ? (
                            <img
                              src={connectedUser.profile_photo_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (connectedUser?.name?.charAt(0) || connectedUser?.phone?.charAt(0) || '?').toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">
                            {connectedUser?.name || 'Unnamed'}
                          </p>
                          <p className="text-sm text-[#64748B]">{connectedUser?.phone}</p>
                        </div>
                      </div>
                      <Link
                        href={`/users/${connectedUser?.id}`}
                        className="text-sm text-[#6366F1] hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Reports Against User ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-[#64748B] text-center py-4">No reports</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report: { id: string; reason: string; status: string; created_at: string; description: string | null }) => (
                  <div
                    key={report.id}
                    className="p-3 bg-[#FEF2F2] rounded-lg border border-red-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">{report.reason}</Badge>
                      <span className="text-xs text-[#64748B]">
                        {formatDateTime(report.created_at)}
                      </span>
                    </div>
                    {report.description && (
                      <p className="text-sm text-[#334155]">{report.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-[#64748B]">User ID</dt>
              <dd className="font-mono text-sm text-[#334155]">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-[#64748B]">Created</dt>
              <dd className="text-[#334155]">{formatDateTime(user.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm text-[#64748B]">Last Updated</dt>
              <dd className="text-[#334155]">{formatDateTime(user.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-sm text-[#64748B]">Current Status</dt>
              <dd className="text-[#334155]">{user.status || 'No status set'}</dd>
            </div>
            {user.is_banned && (
              <>
                <div>
                  <dt className="text-sm text-[#64748B]">Banned At</dt>
                  <dd className="text-[#334155]">
                    {user.banned_at ? formatDateTime(user.banned_at) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-[#64748B]">Ban Reason</dt>
                  <dd className="text-[#334155]">{user.ban_reason || '—'}</dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
