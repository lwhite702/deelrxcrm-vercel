import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const templateCatalog = [
  {
    name: 'Welcome Email',
    slug: 'welcome',
    description: 'Greets new users and verifies email ownership.',
  },
  {
    name: 'Password Reset',
    slug: 'password-reset',
    description: 'Secure reset link with expiry guidance.',
  },
  {
    name: 'Payout Confirmation',
    slug: 'payout-confirmation',
    description: 'Confirms settlement details for finance teams.',
  },
  {
    name: 'Chargeback Alert',
    slug: 'chargeback-alert',
    description: 'High-priority dispute notification with checklist.',
  },
  {
    name: 'Export Ready',
    slug: 'export-ready',
    description: 'Announces that operational exports are available.',
  },
] as const;

export default function EmailPreviewsIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <header className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Development Preview Sandbox
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Email Template Previews
        </h1>
        <p className="text-muted-foreground">
          Render React + plaintext templates side-by-side. These routes are
          removed from production deployments and rely on mocked data.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {templateCatalog.map((template) => (
          <Card key={template.slug} className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href={`/email-previews/${template.slug}`}>
                  Open preview
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
