"use client";

import React from "react";

export default function ViteHeader({ tenantName }: { tenantName?: string }) {
  return (
    <header style={{ borderBottom: "1px solid #e6e6e6", padding: "8px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#111827",
              borderRadius: 8,
            }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{tenantName || "DeelRxCRM"}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>CRM</div>
          </div>
        </div>
        <div>
          <button style={{ marginRight: 8 }}>Help</button>
          <button>Notifications</button>
        </div>
      </div>
    </header>
  );
}
