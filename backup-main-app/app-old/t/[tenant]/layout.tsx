import React from "react";

export default function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  // Placeholder: future server call to resolve & authorize tenant
  const { tenant } = params;
  return (
    <div data-tenant={tenant} style={{ padding: 16 }}>
      {children}
    </div>
  );
}
