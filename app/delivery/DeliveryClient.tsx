"use client";
import React from "react";

export default function DeliveryClient() {
  const [tenantId, setTenantId] = React.useState("");
  const [method, setMethod] = React.useState("pickup");
  const [cost, setCost] = React.useState(0);
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);
  const load = async () => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}/deliveries`);
    const j = await res.json();
    setRows(j.data || []);
  };
  const createRow = async () => {
    await fetch(`/api/tenants/${tenantId}/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        costCents: cost,
        address: address ? { line1: address } : undefined,
        notes,
      }),
    });
    setNotes("");
    setAddress("");
    setCost(0);
    await load();
  };
  React.useEffect(() => {
    if (tenantId) load();
  }, [tenantId]);
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-semibold">Deliveries</h1>
      <div className="flex gap-2 items-end">
        <input
          className="border p-2"
          placeholder="tenantId"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        <select
          className="border p-2"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="pickup">pickup</option>
          <option value="local">local</option>
          <option value="mail">mail</option>
        </select>
        <input
          className="border p-2"
          type="number"
          placeholder="cost cents"
          value={cost}
          onChange={(e) => setCost(parseInt(e.target.value || "0"))}
        />
        <input
          className="border p-2"
          placeholder="address line1"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button className="border px-3 py-2" onClick={createRow}>
          Create
        </button>
      </div>
      <div className="border rounded">
        {rows.map((r) => (
          <div key={r.id} className="flex justify-between p-2 border-b text-sm">
            <span>{r.method}</span>
            <span>{r.costCents}</span>
            <span>{r.address?.line1 || ""}</span>
            <span>{r.notes}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
