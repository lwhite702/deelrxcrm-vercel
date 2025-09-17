"use client"

import './globals.css'
import ClerkClientWrapper from './components/ClerkClientWrapper'
import ViteHeader from './components/ViteHeader'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkClientWrapper>
          <ViteHeader />
          {children}
        </ClerkClientWrapper>
      </body>
    </html>
  )
}
