"use client";

import "./globals.css";
import "../DeelrzCRM/client/src/index.css";
import ClerkClientWrapper from "./components/ClerkClientWrapper";
import dyn from "next/dynamic";
import { Providers } from "./providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GlobalHeader = dyn(() => import("./components/GlobalHeader"), { ssr: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ClerkClientWrapper>
            <GlobalHeader />
            {children}
          </ClerkClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
