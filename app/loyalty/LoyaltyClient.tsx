"use client";
import React from "react";

export default function LoyaltyClient() {
  const [tenantId, setTenantId] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");
  const [points, setPoints] = React.useState(100);
  const [rows, setRows] = React.useState<any[]>([]);
  const load = async () => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}/loyalty`);
    const j = await res.json();
    setRows(j.data || []);
  };
  const accrue = async () => {
    await fetch(`/api/tenants/${tenantId}/loyalty/accrue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, points }),
    });
    await load();
  };
  const redeem = async () => {
    await fetch(`/api/tenants/${tenantId}/loyalty/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, points }),
    });
    await load();
  };
  React.useEffect(() => {
    if (tenantId) load();
  }, [tenantId]);
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-semibold">Loyalty</h1>
      <div className="flex gap-2 items-end">
        <input
          className="border p-2"
          placeholder="tenantId"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="customerId"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />
        <input
          className="border p-2"
          type="number"
          placeholder="points"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value || "0"))}
        />
        <button className="border px-3 py-2" onClick={accrue}>
          Accrue
        </button>
        <button className="border px-3 py-2" onClick={redeem}>
          Redeem
        </button>
      </div>
      <div className="border rounded">
        {rows.map((r) => (
          <div
            key={r.customerId}
            className="flex justify-between p-2 border-b text-sm"
          >
            <span>{r.customerId}</span>
            <span>{r.balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
