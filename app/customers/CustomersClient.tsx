"use client";
import React from "react";

export default function CustomersClient() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <ReferralsPanel />
    </div>
  );
}

function ReferralsPanel() {
  const [tenantId, setTenantId] = React.useState("");
  const [referrer, setReferrer] = React.useState("");
  const [referred, setReferred] = React.useState("");
  const [note, setNote] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);

  const load = async () => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}/referrals`);
    const j = await res.json();
    setRows(j.data || []);
  };
  const createRef = async () => {
    await fetch(`/api/tenants/${tenantId}/referrals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrer, referred, note }),
    });
    setReferrer("");
    setReferred("");
    setNote("");
    await load();
  };
  React.useEffect(() => {
    if (tenantId) load();
  }, [tenantId]);
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Referrals</h2>
      <div className="flex gap-2 items-end">
        <input
          className="border p-2"
          placeholder="tenantId"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="referrer"
          value={referrer}
          onChange={(e) => setReferrer(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="referred"
          value={referred}
          onChange={(e) => setReferred(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="border px-3 py-2" onClick={createRef}>
          Add
        </button>
      </div>
      <div className="border rounded">
        {rows.map((r: any) => (
          <div key={r.id} className="flex justify-between p-2 border-b text-sm">
            <span>{r.referrer}</span>
            <span>{r.referred}</span>
            <span>{r.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
