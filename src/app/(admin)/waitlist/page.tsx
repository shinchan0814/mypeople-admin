import { createClient } from '@/lib/supabase/server';
import { WaitlistTable } from './waitlist-table';
import { WaitlistStats } from './waitlist-stats';

async function getWaitlistData() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching waitlist:', error);
    return [];
  }

  return data || [];
}

async function getWaitlistStats() {
  const supabase = await createClient();

  const { data: total } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true });

  const { data: pending } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { data: invited } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'invited');

  const { data: registered } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'registered');

  return {
    total: total?.length || 0,
    pending: pending?.length || 0,
    invited: invited?.length || 0,
    registered: registered?.length || 0,
  };
}

export default async function WaitlistPage() {
  const [waitlistData, stats] = await Promise.all([
    getWaitlistData(),
    getWaitlistStats(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Waitlist Management</h1>
        <p className="text-[#64748B] mt-1">
          Manage signups and send invites to early access users
        </p>
      </div>

      {/* Stats */}
      <WaitlistStats stats={stats} />

      {/* Table */}
      <WaitlistTable initialData={waitlistData} />
    </div>
  );
}
