import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/admin/stats-card';
import { Users, Mail, Image, MessageSquare, UserPlus, Shield } from 'lucide-react';
import { DashboardCharts } from './charts';
import { RecentActivity } from './recent-activity';

async function getDashboardStats() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

  if (error) {
    console.error('Error fetching stats:', error);
    return null;
  }

  return data;
}

async function getRecentUsers() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('users')
    .select('id, name, phone, created_at, profile_photo_url')
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
}

async function getRecentWaitlist() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('waitlist')
    .select('id, email, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return data || [];
}

export default async function DashboardPage() {
  const [stats, recentUsers, recentWaitlist] = await Promise.all([
    getDashboardStats(),
    getRecentUsers(),
    getRecentWaitlist(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
        <p className="text-[#64748B] mt-1">Overview of your MyPeople app</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          change={`${stats?.active_users_today || 0} active today`}
          changeType="neutral"
          icon={Users}
          iconColor="bg-[#6366F1]"
        />
        <StatsCard
          title="Waitlist"
          value={stats?.waitlist_pending || 0}
          change={`${stats?.waitlist_total || 0} total signups`}
          changeType="neutral"
          icon={Mail}
          iconColor="bg-[#F59E0B]"
        />
        <StatsCard
          title="Moments"
          value={stats?.total_posts || 0}
          change={`${stats?.posts_today || 0} today`}
          changeType="positive"
          icon={Image}
          iconColor="bg-[#EC4899]"
        />
        <StatsCard
          title="Messages"
          value={stats?.total_messages || 0}
          change={`${stats?.messages_today || 0} today`}
          changeType="positive"
          icon={MessageSquare}
          iconColor="bg-[#10B981]"
        />
        <StatsCard
          title="Connections"
          value={stats?.total_connections || 0}
          change="Total connections"
          changeType="neutral"
          icon={UserPlus}
          iconColor="bg-[#8B5CF6]"
        />
        <StatsCard
          title="Reports"
          value={stats?.pending_reports || 0}
          change={`${stats?.banned_users || 0} banned users`}
          changeType={stats?.pending_reports > 0 ? 'negative' : 'neutral'}
          icon={Shield}
          iconColor="bg-[#EF4444]"
        />
      </div>

      {/* Charts */}
      <DashboardCharts />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity
          title="Recent Users"
          items={recentUsers.map((user) => ({
            id: user.id,
            primary: user.name || 'Unnamed User',
            secondary: user.phone,
            timestamp: user.created_at,
            avatar: user.profile_photo_url,
          }))}
          emptyMessage="No users yet"
          viewAllHref="/users"
        />
        <RecentActivity
          title="Recent Waitlist"
          items={recentWaitlist.map((item) => ({
            id: item.id,
            primary: item.email,
            secondary: item.status,
            timestamp: item.created_at,
            status: item.status,
          }))}
          emptyMessage="No waitlist signups yet"
          viewAllHref="/waitlist"
        />
      </div>
    </div>
  );
}
