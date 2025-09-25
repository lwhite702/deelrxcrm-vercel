import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { chargebackAlertEmailText } from '@/emails/templates/ChargebackAlertEmail.text';
import { ChargebackAlertEmail } from '@/emails/templates/ChargebackAlertEmail';
import { exportReadyEmailText } from '@/emails/templates/ExportReadyEmail.text';
import { ExportReadyEmail } from '@/emails/templates/ExportReadyEmail';
import { PasswordResetEmail } from '@/emails/templates/PasswordResetEmail';
import { passwordResetEmailText } from '@/emails/templates/PasswordResetEmail.text';
import { PayoutConfirmationEmail } from '@/emails/templates/PayoutConfirmationEmail';
import { payoutConfirmationEmailText } from '@/emails/templates/PayoutConfirmationEmail.text';
import { WelcomeEmail } from '@/emails/templates/WelcomeEmail';
import { welcomeEmailText } from '@/emails/templates/WelcomeEmail.text';

const previewCatalog = {
  'welcome': () => {
    const payload = {
      userName: 'Alicia Rivers',
      verifyUrl: 'https://deelrxcrm.app/verify?token=welcome-dev-token',
    } as const;

    return {
      name: 'Welcome Email',
      description: 'Greets a new DeelRxCRM admin and confirms email ownership.',
      html: <WelcomeEmail {...payload} />,
      text: welcomeEmailText(payload),
      payload,
    };
  },
  'password-reset': () => {
    const payload = {
      userName: 'Andre Carter',
      resetUrl: 'https://deelrxcrm.app/reset?token=reset-dev-token',
      expiresIn: '24 hours',
    } as const;

    return {
      name: 'Password Reset',
      description: 'Secure credential recovery email with time-boxed action.',
      html: <PasswordResetEmail {...payload} />,
      text: passwordResetEmailText(payload),
      payload,
    };
  },
  'payout-confirmation': () => {
    const payload = {
      userName: 'Chanel Ortiz',
      amount: '12,500.00',
      currency: 'USD',
      paymentMethod: 'ACH • Bank of North America',
      expectedDate: 'Feb 20, 2025',
      transactionId: 'txn_2JX449',
    } as const;

    return {
      name: 'Payout Confirmation',
      description: 'Finance payout notification with reconciliation metadata.',
      html: <PayoutConfirmationEmail {...payload} />,
      text: payoutConfirmationEmailText(payload),
      payload,
    };
  },
  'chargeback-alert': () => {
    const payload = {
      userName: 'Security Desk',
      amount: '842.00',
      currency: 'USD',
      caseId: 'cbk_88AS9K',
      disputeUrl: 'https://deelrxcrm.app/disputes/cbk_88AS9K',
      dueDate: 'Feb 22, 2025',
      customerInfo: 'Alex Johnson · alex.johnson@example.com',
    } as const;

    return {
      name: 'Chargeback Alert',
      description: 'Risk operations alert requiring evidence upload.',
      html: <ChargebackAlertEmail {...payload} />,
      text: chargebackAlertEmailText(payload),
      payload,
    };
  },
  'export-ready': () => {
    const payload = {
      userName: 'Ops Squad',
      exportType: 'Loyalty Transactions',
      downloadUrl: 'https://deelrxcrm.app/exports/loyalty?token=export-dev-token',
      expiresIn: '7 days',
      recordCount: 1250,
      dateRange: 'Jan 01 – Feb 19, 2025',
    } as const;

    return {
      name: 'Export Ready',
      description: 'Operational export ready for download with security notes.',
      html: <ExportReadyEmail {...payload} />,
      text: exportReadyEmailText(payload),
      payload,
    };
  },
} as const;

export default function EmailTemplatePreviewPage({
  params,
}: {
  params: { template: string };
}) {
  const builder =
    previewCatalog[params.template as keyof typeof previewCatalog];

  if (!builder) {
    notFound();
  }

  const preview = builder();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <Badge variant="outline" className="w-fit">Development Preview</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          {preview.name}
        </h1>
        <p className="text-muted-foreground">{preview.description}</p>
      </header>

      <Tabs defaultValue="html" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="text">Plaintext</TabsTrigger>
          <TabsTrigger value="payload">Sample Payload</TabsTrigger>
        </TabsList>

        <TabsContent value="html">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Rendered React Email</CardTitle>
              <CardDescription>
                Inline-styled markup as sent via Resend.
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-background">
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                {preview.html}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Plaintext Fallback</CardTitle>
              <CardDescription>
                Mirrors the HTML content for clients without rich rendering.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm">
                {preview.text}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payload">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Props Snapshot</CardTitle>
              <CardDescription>
                Data passed into the React template and plaintext generator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm">
                {JSON.stringify(preview.payload, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
