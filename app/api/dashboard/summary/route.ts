import { NextRequest, NextResponse } from 'next/server';
import { requireNexxoHubRole } from '../../../../lib/nexxohub-context';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, membership } = await requireNexxoHubRole([
      'nexxohub_admin',
      'nexxohub_finance',
      'nexxohub_operator',
    ]);

    const requestedDays = Number(request.nextUrl.searchParams.get('days') || 30);
    const days = Number.isFinite(requestedDays)
      ? Math.min(Math.max(Math.trunc(requestedDays), 7), 365)
      : 30;
    const periodStart = new Date();
    periodStart.setUTCDate(periodStart.getUTCDate() - days);

    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const [
      companies,
      clinics,
      employees,
      snapshots,
      alerts,
      insights,
      activities,
      notifications,
      contracts,
    ] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('clinics').select('id', { count: 'exact', head: true }),
      supabase.from('employees').select('id', { count: 'exact', head: true }),
      supabase
        .from('psychosocial_index_snapshots')
        .select('score, period_end, sample_size')
        .gte('period_end', periodStart.toISOString().slice(0, 10))
        .order('period_end', { ascending: true }),
      supabase
        .from('smart_alerts')
        .select('id, title, description, severity, status, detected_at')
        .eq('status', 'open')
        .order('detected_at', { ascending: false })
        .limit(3),
      supabase
        .from('ai_insights')
        .select('id, title, summary, recommendation, generated_at')
        .eq('status', 'active')
        .order('generated_at', { ascending: false })
        .limit(1),
      supabase
        .from('activity_events')
        .select('id, event_type, title, description, occurred_at')
        .order('occurred_at', { ascending: false })
        .limit(4),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null),
      supabase.from('contracts').select('status, expected_platform_revenue'),
    ]);

    const indexSeries = snapshots.error ? [] : snapshots.data || [];
    const currentIndex =
      indexSeries.length > 0 ? Number(indexSeries[indexSeries.length - 1].score) : null;

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            name: profile?.full_name || user.email || 'Usuário',
            role: membership.role,
            email: user.email,
          },
          period: { days, start: periodStart.toISOString() },
          metrics: {
            activeCompanies: companies.count || 0,
            activeClinics: clinics.count || 0,
            monitoredEmployees: employees.count || 0,
            psychosocialIndex: currentIndex,
          },
          indexSeries,
          alerts: alerts.error ? [] : alerts.data || [],
          insight: insights.error ? null : insights.data?.[0] || null,
          activities: activities.error ? [] : activities.data || [],
          unreadNotifications: notifications.count || 0,
          finance: {
            activeContracts:
              contracts.data?.filter((contract) => contract.status === 'active').length || 0,
            expectedRevenue:
              contracts.data?.reduce(
                (total, contract) => total + Number(contract.expected_platform_revenue || 0),
                0
              ) || 0,
          },
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Acesso negado' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
