import { NextRequest, NextResponse } from 'next/server';

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '268609';
const POSTHOG_HOST = 'https://us.posthog.com';

async function posthogQuery(query: object): Promise<any> {
  const response = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PostHog API error: ${response.status} - ${error}`);
  }

  return response.json();
}

function getDateRange(range: string): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = now.toISOString().split('T')[0];

  let daysBack = 7;
  if (range === '14d') daysBack = 14;
  if (range === '30d') daysBack = 30;

  const from = new Date(now);
  from.setDate(from.getDate() - daysBack);
  const dateFrom = from.toISOString().split('T')[0];

  return { dateFrom, dateTo };
}

export async function GET(request: NextRequest) {
  if (!POSTHOG_API_KEY) {
    return NextResponse.json(
      { error: 'PostHog API key not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '7d';
  const { dateFrom, dateTo } = getDateRange(range);

  try {
    // Query for DAU (unique users today)
    const dauQuery = {
      kind: 'HogQLQuery',
      query: `
        SELECT count(DISTINCT person_id) as dau
        FROM events
        WHERE event = 'app_opened'
          AND timestamp >= today()
      `,
    };

    // Query for WAU (unique users last 7 days)
    const wauQuery = {
      kind: 'HogQLQuery',
      query: `
        SELECT count(DISTINCT person_id) as wau
        FROM events
        WHERE event = 'app_opened'
          AND timestamp >= now() - INTERVAL 7 DAY
      `,
    };

    // Query for MAU (unique users last 30 days)
    const mauQuery = {
      kind: 'HogQLQuery',
      query: `
        SELECT count(DISTINCT person_id) as mau
        FROM events
        WHERE event = 'app_opened'
          AND timestamp >= now() - INTERVAL 30 DAY
      `,
    };

    // Query for key event counts
    const eventsQuery = {
      kind: 'HogQLQuery',
      query: `
        SELECT
          countIf(event = 'app_opened') as app_opens,
          countIf(event = 'content_shared') as content_shared,
          countIf(event = 'feed_post_viewed') as feed_views,
          countIf(event = 'chat_message_sent') as messages_sent
        FROM events
        WHERE timestamp >= '${dateFrom}'
          AND timestamp <= '${dateTo}'
      `,
    };

    // Query for daily active users trend
    const dailyTrendQuery = {
      kind: 'HogQLQuery',
      query: `
        SELECT
          toDate(timestamp) as date,
          count(DISTINCT person_id) as users
        FROM events
        WHERE event = 'app_opened'
          AND timestamp >= '${dateFrom}'
          AND timestamp <= '${dateTo}'
        GROUP BY date
        ORDER BY date ASC
      `,
    };

    // Query for event breakdown
    const eventBreakdownQuery = {
      kind: 'HogQLQuery',
      query: `
        SELECT
          event as name,
          count() as count
        FROM events
        WHERE timestamp >= '${dateFrom}'
          AND timestamp <= '${dateTo}'
          AND event NOT LIKE '$%'
        GROUP BY event
        ORDER BY count DESC
        LIMIT 6
      `,
    };

    // Query for top events
    const topEventsQuery = {
      kind: 'HogQLQuery',
      query: `
        SELECT
          event,
          count() as count
        FROM events
        WHERE timestamp >= '${dateFrom}'
          AND timestamp <= '${dateTo}'
          AND event NOT LIKE '$%'
        GROUP BY event
        ORDER BY count DESC
        LIMIT 15
      `,
    };

    // Execute all queries in parallel
    const [dauResult, wauResult, mauResult, eventsResult, dailyTrend, eventBreakdown, topEvents] =
      await Promise.all([
        posthogQuery(dauQuery),
        posthogQuery(wauQuery),
        posthogQuery(mauQuery),
        posthogQuery(eventsQuery),
        posthogQuery(dailyTrendQuery),
        posthogQuery(eventBreakdownQuery),
        posthogQuery(topEventsQuery),
      ]);

    // Parse results
    const dau = dauResult.results?.[0]?.[0] || 0;
    const wau = wauResult.results?.[0]?.[0] || 0;
    const mau = mauResult.results?.[0]?.[0] || 0;
    const dauWauRatio = wau > 0 ? Math.round((dau / wau) * 100) : 0;

    const eventCounts = eventsResult.results?.[0] || [0, 0, 0, 0];

    // Format daily trend data
    const dailyActiveData = (dailyTrend.results || []).map((row: any[]) => ({
      date: new Date(row[0]).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      users: row[1],
    }));

    // Format event breakdown
    const eventBreakdownData = (eventBreakdown.results || []).map((row: any[]) => ({
      name: formatEventName(row[0]),
      count: row[1],
    }));

    // Format top events
    const topEventsData = (topEvents.results || []).map((row: any[]) => ({
      event: formatEventName(row[0]),
      count: row[1],
    }));

    return NextResponse.json({
      dau,
      wau,
      mau,
      dauWauRatio,
      appOpens: eventCounts[0],
      contentShared: eventCounts[1],
      feedViews: eventCounts[2],
      messagesSent: eventCounts[3],
      totalEvents: eventCounts.reduce((a: number, b: number) => a + b, 0),
      dailyActiveData,
      eventBreakdown: eventBreakdownData,
      topEvents: topEventsData,
    });
  } catch (error) {
    console.error('PostHog API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper to format event names for display
function formatEventName(event: string): string {
  return event
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace('App ', '')
    .replace('Content ', '')
    .replace('Feed ', '')
    .replace('Chat ', '');
}
