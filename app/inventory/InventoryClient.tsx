"use client";
import React from "react";

export default function InventoryClient() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <AdjustmentsPanel />
    </div>
  );
}

function AdjustmentsPanel() {
  const [tenantId, setTenantId] = React.useState("");
  const [item, setItem] = React.useState("");
  const [qty, setQty] = React.useState(0);
  const [reason, setReason] = React.useState("waste");
  const [note, setNote] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);

  const load = async () => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}/inventory/adjustments`);
    const j = await res.json();
    setRows(j.data || []);
  };

  const createAdj = async () => {
    if (!tenantId || !item) return;
    await fetch(`/api/tenants/${tenantId}/inventory/adjustments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, quantity: qty, reason, note }),
    });
    setItem("");
    setQty(0);
    setNote("");
    await load();
  };

  React.useEffect(() => {
    if (tenantId) load();
  }, [tenantId]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Adjustments</h2>
      <div className="flex gap-2 items-end">
        <input
          className="border p-2"
          placeholder="tenantId"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <input
          className="border p-2"
          type="number"
          placeholder="qty"
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value || "0"))}
        />
        <select
          className="border p-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="waste">waste</option>
          <option value="sample">sample</option>
          <option value="personal">personal</option>
          <option value="recount">recount</option>
        </select>
        <input
          className="border p-2"
          placeholder="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="border px-3 py-2" onClick={createAdj}>
          Add
        </button>
      </div>
      <div className="border rounded">
        {rows.map((r) => (
          <div key={r.id} className="flex justify-between p-2 border-b text-sm">
            <span>{r.item}</span>
            <span>{r.quantity}</span>
            <span>{r.reason}</span>
            <span>{r.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
