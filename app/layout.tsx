"use client";

import "./globals.css";
import "../DeelrzCRM/client/src/index.css";
import ClerkClientWrapper from "./components/ClerkClientWrapper";
import ViteHeader from "./components/ViteHeader";
import { Providers } from "./providers";

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
            <ViteHeader />
            {children}
          </ClerkClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
