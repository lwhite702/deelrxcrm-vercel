import Link from 'next/link';
import { ShieldCheck, Rocket, MailPlus, Activity } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { requireSuperAdmin } from './_auth';

const summaryCards = [
  {
    title: 'Ready Broadcasts',
    description: 'Campaigns queued for delivery',
    value: '3',
    icon: Rocket,
  },
  {
    title: 'Deliverability',
    description: 'Rolling 7-day delivery rate',
    value: '98.4%',
    icon: ShieldCheck,
  },
  {
    title: 'Templates',
    description: 'Transactional templates live',
    value: '5',
    icon: MailPlus,
  },
  {
    title: 'Events (24h)',
    description: 'Webhook events processed today',
    value: '148',
    icon: Activity,
  },
] as const;

const templateCatalog = [
  {
    name: 'Welcome Email',
    slug: 'welcome',
    description: 'Onboarding message with verification CTA.',
    intent: 'User Activation',
  },
  {
    name: 'Password Reset',
    slug: 'password-reset',
    description: 'Secure credential recovery with expiry controls.',
    intent: 'Account Recovery',
  },
  {
    name: 'Payout Confirmation',
    slug: 'payout-confirmation',
    description: 'Payment confirmation for completed settlements.',
    intent: 'Payments',
  },
  {
    name: 'Chargeback Alert',
    slug: 'chargeback-alert',
    description: 'Dispute escalation notice with evidence checklist.',
    intent: 'Risk & Disputes',
  },
  {
    name: 'Export Ready',
    slug: 'export-ready',
    description: 'Data export notifications with secure download.',
    intent: 'Operations',
  },
] as const;

const scheduledBroadcasts = [
  {
    id: 'BRD-2025-03',
    name: 'March Loyalty Drop',
    status: 'Scheduled',
    audience: 'Gold tier customers',
    scheduledFor: 'Mar 01, 2025 · 10:00 AM EST',
  },
  {
    id: 'BRD-2025-OPS',
    name: 'Inventory Sync Notice',
    status: 'Draft',
    audience: 'Ops team • 4 tenants',
    scheduledFor: 'Pending',
  },
] as const;

const recentEvents = [
  {
    id: 'evt_01HZX1',
    providerId: 'email_3a62c4',
    type: 'email.delivered',
    status: 'delivered',
    occurredAt: 'Feb 19, 2025 · 12:42 PM',
  },
  {
    id: 'evt_01HZX0',
    providerId: 'email_9ab22d',
    type: 'email.opened',
    status: 'opened',
    occurredAt: 'Feb 19, 2025 · 12:39 PM',
  },
  {
    id: 'evt_01HZWX',
    providerId: 'email_59ff1c',
    type: 'email.bounced',
    status: 'bounced',
    occurredAt: 'Feb 19, 2025 · 12:05 PM',
  },
] as const;

/**
 * Renders the Admin Email Control Center page for managing email templates and broadcasts.
 */
export default async function AdminEmailPage() {
  const user = await requireSuperAdmin();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Email Control Center
            </h1>
            <Badge variant="outline">Super Admin</Badge>
          </div>
          <p className="text-muted-foreground">
            Manage transactional templates, review broadcast readiness, and
            monitor Resend deliverability for DeelRxCRM tenants.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">
            Signed in as {user.email ?? user.sub}
          </Badge>
          <Button variant="default" asChild>
            <Link href="/email-previews">Open Dev Previews</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border-border/60">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{card.value}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="broadcasts" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
        </TabsList>

        <TabsContent value="broadcasts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Campaign Schedule</CardTitle>
                <CardDescription>
                  Snapshot of programmatic sends targeting tenant segments.
                </CardDescription>
              </div>
              <Button variant="secondary" asChild>
                <Link href="mailto:support@deelrxcrm.app?subject=Email%20Broadcast%20Request">
                  Coordinate Broadcast
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Broadcast</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Scheduled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledBroadcasts.map((broadcast) => (
                    <TableRow key={broadcast.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{broadcast.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {broadcast.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{broadcast.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {broadcast.audience}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {broadcast.scheduledFor}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Transactional Templates</CardTitle>
              <CardDescription>
                Live React email templates with matching plaintext fallbacks.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {templateCatalog.map((template) => (
                <Card key={template.slug} className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.intent}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {template.description}
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="px-0" asChild>
                      <Link href={`/email-previews/${template.slug}`}>
                        Preview template
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Activity</CardTitle>
              <CardDescription>
                Last-known Resend events stored in drizzle email_events.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Event ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider Email</TableHead>
                    <TableHead>Occurred</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs">
                        {event.id}
                      </TableCell>
                      <TableCell className="text-sm">{event.type}</TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'bounced' ? 'destructive' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.providerId}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.occurredAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
