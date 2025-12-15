import { createClient } from '@/lib/supabase/server';
import { ModerationTable } from './moderation-table';
import { ModerationStats } from './moderation-stats';

async function getReportsData() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:reporter_id (
        id,
        name,
        phone
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  return data || [];
}

async function getReportStats() {
  const supabase = await createClient();

  const { count: total } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  const { count: pending } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: reviewed } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'reviewed');

  const { count: actionTaken } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'action_taken');

  return {
    total: total || 0,
    pending: pending || 0,
    reviewed: reviewed || 0,
    actionTaken: actionTaken || 0,
  };
}

export default async function ModerationPage() {
  const [reports, stats] = await Promise.all([getReportsData(), getReportStats()]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Content Moderation</h1>
        <p className="text-[#64748B] mt-1">
          Review and take action on reported content
        </p>
      </div>

      {/* Stats */}
      <ModerationStats stats={stats} />

      {/* Table */}
      <ModerationTable initialData={reports} />
    </div>
  );
}
