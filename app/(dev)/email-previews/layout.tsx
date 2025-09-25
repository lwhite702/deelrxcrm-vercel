import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

export default function EmailPreviewsLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <div className="min-h-screen bg-muted/20">{children}</div>;
}
