import type { ReactNode } from 'react';

import { requireSuperAdmin } from './_auth';

/**
 * Renders the admin email layout with required super admin check.
 */
export default async function AdminEmailLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 p-6">
      {children}
    </div>
  );
}
