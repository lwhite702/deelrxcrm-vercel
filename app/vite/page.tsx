"use client"

import React, { useEffect, useState } from 'react'

export default function ViteMount() {
  const [AppComponent, setAppComponent] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    let mounted = true

    // Dynamically import the Vite app and its CSS only on the client
    Promise.all([
      import('../../DeelrzCRM/client/src/index.css').catch(() => null),
      import('../../DeelrzCRM/client/src/App').then(m => m.default),
    ])
      .then(([_, App]) => {
        if (mounted) setAppComponent(() => App)
      })
      .catch(() => {
        // ignore errors during dynamic client import
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div id="vite-root" style={{ height: '100%' }}>
      {AppComponent ? <AppComponent /> : <div>Loading Vite app...</div>}
    </div>
  )
}
