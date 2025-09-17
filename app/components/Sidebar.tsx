"use client";

import React from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/sales-pos", label: "Sales POS" },
  { href: "/delivery", label: "Delivery" },
  { href: "/loyalty", label: "Loyalty" },
  { href: "/credit", label: "Credit" },
  { href: "/payments", label: "Payments" },
];

export default function Sidebar() {
  return (
    <nav
      style={{
        width: 240,
        background: "#fff",
        borderRight: "1px solid #e6e6e6",
        paddingTop: 16,
      }}
    >
      <div style={{ padding: "0 12px" }}>
        {navItems.map((item) => (
          <div key={item.href} style={{ marginBottom: 8 }}>
            <a
              href={item.href}
              style={{ color: "#111827", textDecoration: "none" }}
            >
              {item.label}
            </a>
          </div>
        ))}
      </div>
    </nav>
  );
}
