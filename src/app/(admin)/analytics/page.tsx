'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/admin/stats-card';
import {
  Activity,
  Users,
  TrendingUp,
  Camera,
  MessageSquare,
  UserPlus,
  Eye,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  dau: number;
  wau: number;
  mau: number;
  dauWauRatio: number;
  totalEvents: number;
  contentShared: number;
  feedViews: number;
  messagesSent: number;
  appOpens: number;
  dailyActiveData: { date: string; users: number }[];
  eventBreakdown: { name: string; count: number }[];
  topEvents: { event: string; count: number }[];
}

const COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?range=${dateRange}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Analytics</h1>
          <p className="text-[#64748B] mt-1">PostHog metrics and insights</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#6366F1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Analytics</h1>
          <p className="text-[#64748B] mt-1">PostHog metrics and insights</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <p className="text-[#64748B] text-sm">
                Make sure PostHog API key is configured in environment variables.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Analytics</h1>
          <p className="text-[#64748B] mt-1">PostHog metrics and insights</p>
        </div>
        <div className="flex gap-2">
          {['7d', '14d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Daily Active Users"
          value={data?.dau || 0}
          change="Today"
          changeType="neutral"
          icon={Users}
          iconColor="bg-[#6366F1]"
        />
        <StatsCard
          title="Weekly Active Users"
          value={data?.wau || 0}
          change="Last 7 days"
          changeType="neutral"
          icon={Activity}
          iconColor="bg-[#10B981]"
        />
        <StatsCard
          title="Monthly Active Users"
          value={data?.mau || 0}
          change="Last 30 days"
          changeType="neutral"
          icon={TrendingUp}
          iconColor="bg-[#F59E0B]"
        />
        <StatsCard
          title="Stickiness (DAU/WAU)"
          value={`${data?.dauWauRatio || 0}%`}
          change="User engagement"
          changeType={data?.dauWauRatio && data.dauWauRatio > 40 ? 'positive' : 'neutral'}
          icon={Zap}
          iconColor="bg-[#EC4899]"
        />
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="App Opens"
          value={data?.appOpens || 0}
          change={`Last ${dateRange === '7d' ? '7' : dateRange === '14d' ? '14' : '30'} days`}
          changeType="neutral"
          icon={Eye}
          iconColor="bg-[#8B5CF6]"
        />
        <StatsCard
          title="Content Shared"
          value={data?.contentShared || 0}
          change="Posts & moments"
          changeType="positive"
          icon={Camera}
          iconColor="bg-[#EC4899]"
        />
        <StatsCard
          title="Feed Views"
          value={data?.feedViews || 0}
          change="Post impressions"
          changeType="neutral"
          icon={Activity}
          iconColor="bg-[#10B981]"
        />
        <StatsCard
          title="Messages Sent"
          value={data?.messagesSent || 0}
          change="Chat messages"
          changeType="positive"
          icon={MessageSquare}
          iconColor="bg-[#F59E0B]"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyActiveData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ fill: '#6366F1', strokeWidth: 2 }}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Event Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.eventBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {data?.eventBreakdown?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.topEvents?.slice(0, 10) || []}
                layout="vertical"
                margin={{ left: 150 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis
                  dataKey="event"
                  type="category"
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Link to PostHog */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#0F172A]">View Full Analytics</h3>
              <p className="text-sm text-[#64748B]">
                Access detailed funnels, cohorts, and session recordings in PostHog
              </p>
            </div>
            <a
              href="https://us.posthog.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#6366F1] text-white rounded-lg text-sm font-medium hover:bg-[#4F46E5] transition-colors"
            >
              Open PostHog Dashboard
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
