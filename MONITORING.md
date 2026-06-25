# Monitoring & Logging Guide

**Status**: ✅ Ready to Implement  
**Level**: Production-Grade  
**Updated**: June 21, 2026  

---

## Overview

Complete monitoring solution for NexxoHub platform with multiple layers:

```
┌─────────────────────────────────────────┐
│       Application Monitoring             │
├─────────────────────────────────────────┤
│ ✅ Error Tracking       (Sentry)        │
│ ✅ Performance Monitor  (Web Vitals)    │
│ ✅ Logging              (Winston)       │
│ ✅ Uptime Monitor       (UptimeRobot)   │
│ ✅ Analytics            (Vercel)        │
│ ✅ Database Monitor     (Supabase)      │
│ ✅ Session Replay       (LogRocket)     │
│ ✅ Alerting             (Slack)         │
└─────────────────────────────────────────┘
```

---

## 1. Error Tracking (Sentry)

### Setup

```bash
# Install Sentry
npm install @sentry/nextjs

# Or with Next.js instrumentation
npm install @sentry/nextjs --save
```

### Configure in `next.config.js`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Error filtering
  beforeSend(event) {
    // Filter out certain errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      // Skip network errors in production
      if (error?.value?.includes('Network')) {
        return null;
      }
    }
    return event;
  },
});
```

### Usage in Application

```typescript
// Capture exceptions
try {
  await fetchData();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'UserForm',
      action: 'submit',
    },
  });
}

// Capture messages
Sentry.captureMessage('User logged in', 'info', {
  userId: user.id,
});

// Breadcrumbs for tracking user flow
Sentry.addBreadcrumb({
  message: 'Viewed clinics page',
  category: 'navigation',
  level: 'info',
});
```

### Monitoring Alerts

Set up in Sentry Dashboard:

```
Alerts → New Alert
├─ Event: Crash Free Rate < 95%
├─ Severity: Error
├─ Frequency: Immediately
└─ Action: Notify Slack #alerts
```

### Useful Sentry Features

- ✅ Source maps (auto-uploaded)
- ✅ Release tracking
- ✅ Environment filtering
- ✅ Error grouping
- ✅ Breadcrumb trails
- ✅ Performance monitoring
- ✅ Session replay (paid)

---

## 2. Performance Monitoring

### Web Vitals (Vercel Built-in)

```
Vercel Dashboard → Analytics
```

Metrics tracked:
- **LCP** (Largest Contentful Paint) → Target: < 2.5s
- **FID** (First Input Delay) → Target: < 100ms
- **CLS** (Cumulative Layout Shift) → Target: < 0.1

### Implement Performance Tracking

```typescript
// lib/performance.ts (Already created)
import { reportWebVitals } from '@/lib/performance';

// In app/layout.tsx
import { reportWebVitals } from 'web-vitals';

reportWebVitals(metric => {
  console.log(metric);
  
  // Send to analytics
  if (typeof window !== 'undefined') {
    const body = JSON.stringify(metric);
    navigator.sendBeacon('/api/analytics/vitals', body);
  }
});
```

### Database Performance

```sql
-- View slow queries
SELECT 
  query, 
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Enable query logging
ALTER DATABASE nexxohub SET log_min_duration_statement = 1000;  -- 1 second
```

### API Performance

```typescript
// Measure API calls
export async function measureApiCall<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    
    // Log performance
    console.log(`${name} completed in ${duration}ms`);
    
    // Send to monitoring
    if (duration > 1000) {
      Sentry.captureMessage(`Slow API: ${name} took ${duration}ms`, 'warning');
    }
    
    return result;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

---

## 3. Logging (Winston Setup)

### Install Winston

```bash
npm install winston winston-daily-rotate-file
```

### Configure Logger

```typescript
// lib/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'nexxohub-api' },
  transports: [
    // Console output (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp }) =>
            `${timestamp} [${level}] ${message}`,
        ),
      ),
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    }),
    
    // File output (production)
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '14d',
      level: 'info',
    }),
    
    // Error log file
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '30d',
      level: 'error',
    }),
  ],
});

export default logger;
```

### Usage

```typescript
// In API routes
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    logger.info('Creating clinic', { user: userId });
    
    const result = await createClinic(data);
    
    logger.info('Clinic created successfully', { clinicId: result.id });
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to create clinic', { error });
    throw error;
  }
}
```

### Log Rotation

```bash
# View logs
tail -f logs/application-2026-06-21.log

# Archive old logs
gzip logs/application-*.log
```

---

## 4. Uptime Monitoring

### Setup with UptimeRobot

1. **Go to** https://uptimerobot.com
2. **Create Account** (free tier available)
3. **Add Monitor**:
   ```
   Name: NexxoHub API
   Type: HTTP(S)
   URL: https://app.nexxohub.com/api/health
   Interval: 5 minutes
   Alerting: Email + Slack
   ```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    const { data: result } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      auth: 'connected',
      version: process.env.NEXT_PUBLIC_APP_VERSION,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

### Monitoring Alerts

```
Uptime Robot → Alert Contacts
├─ Email: devops@nexxohub.com
├─ Slack: #alerts channel
├─ SMS: Emergency numbers
└─ Webhook: Custom alerts
```

---

## 5. Database Monitoring (Supabase)

### Connection Pool Status

```sql
-- Check active connections
SELECT 
  count(*) as total_connections,
  sum(case when state = 'active' then 1 else 0 end) as active,
  sum(case when state = 'idle' then 1 else 0 end) as idle
FROM pg_stat_activity;

-- Max connections
SHOW max_connections;  -- Usually 20 (free) or higher (pro)
```

### Query Performance

```
Supabase Dashboard → Database → Monitoring
├─ Connection Pool
├─ Query Performance
├─ Cache Hit Ratio
└─ Disk Usage
```

### Backup Status

```
Supabase Dashboard → Settings → Backups
├─ Status: Active
├─ Frequency: Daily
├─ Retention: 7-30 days
└─ Download: On demand
```

---

## 6. Application Monitoring (Vercel)

### Analytics Dashboard

```
Vercel → Project → Analytics
```

Shows:
- ✅ Core Web Vitals distribution
- ✅ Edge function performance
- ✅ Cache effectiveness
- ✅ Deployment performance
- ✅ FCP, LCP, CLS trends

### Real-time Monitor

```
Vercel → Project → Monitor
```

Displays:
- Build status
- Deployment status
- Function invocations
- Edge cache hits
- Error rate

---

## 7. Custom Dashboard

### Create Monitoring Dashboard

```typescript
// app/admin/monitoring/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    uptime: 99.9,
    errorRate: 0.1,
    avgResponseTime: 145,
    activeUsers: 245,
  });

  useEffect(() => {
    // Fetch metrics every minute
    const interval = setInterval(async () => {
      const res = await fetch('/api/monitoring/metrics');
      const data = await res.json();
      setMetrics(data);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{metrics.uptime}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">{metrics.errorRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avg Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{metrics.avgResponseTime}ms</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{metrics.activeUsers}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### API Endpoint

```typescript
// app/api/monitoring/metrics/route.ts
export async function GET() {
  try {
    // Fetch from various sources
    const [uptime, errors, performance] = await Promise.all([
      getUptimeMetrics(),
      getErrorMetrics(),
      getPerformanceMetrics(),
    ]);

    return NextResponse.json({
      uptime,
      errorRate: (errors.total / errors.requests) * 100,
      avgResponseTime: performance.avg,
      activeUsers: await getActiveUsers(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 8. Alerting Strategy

### Alert Channels

| Channel | Use Case | Urgency |
|---------|----------|---------|
| Slack #alerts | Critical issues | Immediate |
| Email | Important events | Within 1 hour |
| SMS | Outages | Immediate |
| PagerDuty | On-call escalation | Immediate |
| Webhooks | Custom integrations | Variable |

### Alert Rules

```yaml
Alerts:
  - Name: High Error Rate
    Condition: error_rate > 5%
    Action: Post to #alerts, notify on-call

  - Name: Slow Response Time
    Condition: avg_response_time > 2000ms
    Action: Log warning, check database

  - Name: Database Connection Pool Full
    Condition: available_connections < 2
    Action: Alert ops team, trigger auto-scale

  - Name: Disk Usage Critical
    Condition: disk_usage > 95%
    Action: Email backup team, notify Slack

  - Name: Daily Backup Failed
    Condition: last_backup_age > 25 hours
    Action: Page on-call engineer

  - Name: SSL Certificate Expiring
    Condition: certificate_expires_in < 30 days
    Action: Remind team to renew

  - Name: Deployment Failed
    Condition: deployment_status = failed
    Action: Post to #deployments, notify author
```

### Slack Integration

```typescript
// app/api/alerts/slack/route.ts
import { Webhook } from 'discord-api-types/v10';

export async function POST(req: Request) {
  const alert = await req.json();

  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 ${alert.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.title}*\n${alert.description}`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Severity*\n${alert.severity}` },
            { type: 'mrkdwn', text: `*Time*\n${new Date().toISOString()}` },
          ],
        },
      ],
    }),
  });

  return NextResponse.json({ ok: true });
}
```

---

## 9. Incident Response

### Incident Checklist

```
1. DETECT
   ├─ Automated alert triggered
   ├─ Team member reports issue
   └─ User reports problem

2. ASSESS
   ├─ Check Sentry for errors
   ├─ Check Vercel logs
   ├─ Check database status
   └─ Determine severity

3. RESPOND
   ├─ Notify team in #alerts
   ├─ Create incident in PagerDuty
   ├─ Begin investigation
   └─ Prepare rollback if needed

4. RESOLVE
   ├─ Apply hotfix or rollback
   ├─ Verify fix in production
   ├─ Notify team of resolution
   └─ Update status page

5. POSTMORTEM
   ├─ Document what happened
   ├─ Identify root cause
   ├─ Implement preventive measures
   └─ Schedule follow-up
```

### Escalation Levels

| Level | Threshold | Action |
|-------|-----------|--------|
| Info | Normal event | Log only |
| Warning | Minor issue | Notify team |
| Alert | Service degraded | Page on-call |
| Critical | Service down | All hands on deck |

---

## 10. Retention Policies

```
Logs:           14 days
Metrics:        30 days
Errors (Sentry): 90 days
Backups:        7-30 days
Analytics:      24 months
```

---

## 11. Security Monitoring

### Audit Logging

```sql
-- Create audit log table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action varchar(255),
  resource_type varchar(100),
  resource_id uuid,
  changes jsonb,
  created_at timestamp DEFAULT now()
);

-- Enable row-level security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Track all changes
CREATE TRIGGER audit_clinics
AFTER INSERT OR UPDATE OR DELETE ON clinics
FOR EACH ROW
EXECUTE FUNCTION audit_log();
```

### Security Alerts

```
Security Alerts:
├─ Failed login attempts > 5 per user
├─ Unusual API usage patterns
├─ Access from new locations
├─ Permission changes
└─ Data export requests
```

---

## 12. Recommended Tools Summary

| Tool | Purpose | Cost | Status |
|------|---------|------|--------|
| Vercel | Hosting + Analytics | Included | ✅ In use |
| Supabase | Database | Free/Pro | ✅ In use |
| Sentry | Error tracking | Free/Pro | ⏳ Ready |
| UptimeRobot | Uptime monitoring | Free | ⏳ Ready |
| Slack | Notifications | Free | ✅ Available |
| PagerDuty | Incident management | Free/Pro | ⏳ Ready |
| LogRocket | Session replay | Paid | ⏳ Optional |
| Datadog | Full monitoring | Paid | ⏳ Enterprise |

---

## Implementation Checklist

### Phase 1 (Ready Now)
- [ ] Configure Sentry
- [ ] Setup health check endpoint
- [ ] Enable Vercel Analytics
- [ ] Configure UptimeRobot

### Phase 2 (Next Week)
- [ ] Implement Winston logging
- [ ] Add Slack webhooks
- [ ] Setup monitoring dashboard
- [ ] Configure alert rules

### Phase 3 (Later)
- [ ] Integrate PagerDuty
- [ ] Add advanced analytics
- [ ] Setup session replay
- [ ] Implement custom dashboards

---

## Quick Setup Command

```bash
# Install all monitoring dependencies
npm install \
  @sentry/nextjs \
  winston \
  winston-daily-rotate-file \
  pino \
  pino-pretty

# Configure environment variables
cp .env.example .env.local

# Add your keys:
# NEXT_PUBLIC_SENTRY_DSN=...
# SLACK_WEBHOOK_URL=...
```

---

## Support & Resources

- [Sentry Docs](https://docs.sentry.io/)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Winston Logger Docs](https://github.com/winstonjs/winston)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/monitoring)
- [UptimeRobot Docs](https://uptimerobot.com/api)

---

**Status**: ✅ Ready for Implementation  
**Next Step**: Setup Sentry, Configure UptimeRobot  
**Support**: Check documentation or contact team  

---

Version: 1.0.0  
Last Updated: June 21, 2026  
Maintained By: DevOps & SRE Team
