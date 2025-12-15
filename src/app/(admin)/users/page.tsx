import { createClient } from '@/lib/supabase/server';
import { UsersTable } from './users-table';

async function getUsersData() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      phone,
      profile_photo_url,
      is_admin,
      is_banned,
      ban_reason,
      created_at,
      updated_at,
      status
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  // Get connection counts for each user
  const usersWithCounts = await Promise.all(
    (data || []).map(async (user) => {
      const { count: connectionCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id);

      return {
        ...user,
        connection_count: connectionCount || 0,
        post_count: postCount || 0,
      };
    })
  );

  return usersWithCounts;
}

export default async function UsersPage() {
  const users = await getUsersData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">User Management</h1>
        <p className="text-[#64748B] mt-1">
          View and manage all registered users
        </p>
      </div>

      {/* Table */}
      <UsersTable initialData={users} />
    </div>
  );
}
