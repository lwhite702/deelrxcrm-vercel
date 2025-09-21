"use client";

import React from "react";
import ViteHeader from "./ViteHeader";
import Sidebar from "./Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <ViteHeader />
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 0, padding: 16 }}>{children}</main>
      </div>
    </div>
  );
}
