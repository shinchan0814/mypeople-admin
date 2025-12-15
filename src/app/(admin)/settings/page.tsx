import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuditLogTable } from './audit-log-table';

async function getAuditLogs() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      admin:admin_id (
        id,
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

async function getAdminUser() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  return data;
}

export default async function SettingsPage() {
  const [auditLogs, adminUser] = await Promise.all([getAuditLogs(), getAdminUser()]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-[#64748B] mt-1">
          Admin panel settings and audit logs
        </p>
      </div>

      {/* Admin Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Admin Account</CardTitle>
          <CardDescription>Currently logged in admin user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#A5B4FC] flex items-center justify-center text-white font-bold text-xl overflow-hidden">
              {adminUser?.profile_photo_url ? (
                <img
                  src={adminUser.profile_photo_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                (adminUser?.name?.charAt(0) || adminUser?.phone?.charAt(0) || 'A').toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A]">
                {adminUser?.name || 'Admin User'}
              </h3>
              <p className="text-[#64748B]">{adminUser?.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Common admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/waitlist"
              className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#6366F1] hover:bg-[#6366F1]/5 transition-colors"
            >
              <h4 className="font-medium text-[#0F172A]">Manage Waitlist</h4>
              <p className="text-sm text-[#64748B] mt-1">
                Invite users from the waitlist
              </p>
            </a>
            <a
              href="/users"
              className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#6366F1] hover:bg-[#6366F1]/5 transition-colors"
            >
              <h4 className="font-medium text-[#0F172A]">User Management</h4>
              <p className="text-sm text-[#64748B] mt-1">
                View and manage all users
              </p>
            </a>
            <a
              href="/moderation"
              className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#6366F1] hover:bg-[#6366F1]/5 transition-colors"
            >
              <h4 className="font-medium text-[#0F172A]">Content Moderation</h4>
              <p className="text-sm text-[#64748B] mt-1">
                Review reported content
              </p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Recent admin actions (last 50)</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={auditLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
