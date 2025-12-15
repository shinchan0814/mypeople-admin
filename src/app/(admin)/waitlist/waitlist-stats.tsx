import { Mail, Clock, Send, UserCheck } from 'lucide-react';

interface WaitlistStatsProps {
  stats: {
    total: number;
    pending: number;
    invited: number;
    registered: number;
  };
}

export function WaitlistStats({ stats }: WaitlistStatsProps) {
  const statItems = [
    {
      label: 'Total Signups',
      value: stats.total,
      icon: Mail,
      color: 'bg-[#6366F1]',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-[#F59E0B]',
    },
    {
      label: 'Invited',
      value: stats.invited,
      icon: Send,
      color: 'bg-[#8B5CF6]',
    },
    {
      label: 'Registered',
      value: stats.registered,
      icon: UserCheck,
      color: 'bg-[#10B981]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-4"
        >
          <div className={`${item.color} p-3 rounded-xl`}>
            <item.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0F172A]">{item.value}</p>
            <p className="text-sm text-[#64748B]">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
