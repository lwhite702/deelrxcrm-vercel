"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const QueryClientProvider = dynamic(
  () => import("@tanstack/react-query").then((mod) => mod.QueryClientProvider),
  { ssr: false }
);
const Elements = dynamic(
  () => import("@stripe/react-stripe-js").then((m) => m.Elements),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient, setQueryClient] = useState<any>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("../DeelrzCRM/client/src/lib/queryClient").then(
        (m) => m.queryClient
      ),
      import("../DeelrzCRM/client/src/lib/stripe").then((m) => m.stripePromise),
    ])
      .then(([qc, sp]) => {
        if (mounted) {
          setQueryClient(qc);
          setStripePromise(sp);
        }
      })
      .catch((error) => {
        console.error("Failed to load providers:", error);
        // If dynamic imports fail, leave providers unmounted to avoid crashing
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!queryClient || !stripePromise) return <>{children}</>;

  return (
    // @ts-ignore - dynamic imports provide correct components at runtime
    <QueryClientProvider client={queryClient}>
      {/* @ts-ignore */}
      <Elements stripe={stripePromise}>{children}</Elements>
    </QueryClientProvider>
  );
}

export default Providers;
