'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Ban, ShieldCheck, Shield, ShieldOff } from 'lucide-react';

interface User {
  id: string;
  is_admin: boolean;
  is_banned: boolean;
}

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const supabase = createClient();

  const handleBan = async () => {
    setLoading('ban');

    const { error } = await supabase
      .from('users')
      .update({
        is_banned: !user.is_banned,
        banned_at: !user.is_banned ? new Date().toISOString() : null,
        ban_reason: !user.is_banned ? 'Banned by admin' : null,
      })
      .eq('id', user.id);

    if (!error) {
      router.refresh();
    }

    setLoading(null);
  };

  const handleToggleAdmin = async () => {
    setLoading('admin');

    const { error } = await supabase
      .from('users')
      .update({ is_admin: !user.is_admin })
      .eq('id', user.id);

    if (!error) {
      router.refresh();
    }

    setLoading(null);
  };

  return (
    <div className="flex gap-3">
      <Button
        variant={user.is_admin ? 'outline' : 'secondary'}
        onClick={handleToggleAdmin}
        disabled={loading === 'admin'}
      >
        {loading === 'admin' ? (
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
        ) : user.is_admin ? (
          <ShieldOff className="w-4 h-4 mr-2" />
        ) : (
          <Shield className="w-4 h-4 mr-2" />
        )}
        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
      </Button>
      <Button
        variant={user.is_banned ? 'success' : 'destructive'}
        onClick={handleBan}
        disabled={loading === 'ban'}
      >
        {loading === 'ban' ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
        ) : user.is_banned ? (
          <ShieldCheck className="w-4 h-4 mr-2" />
        ) : (
          <Ban className="w-4 h-4 mr-2" />
        )}
        {user.is_banned ? 'Unban User' : 'Ban User'}
      </Button>
    </div>
  );
}
