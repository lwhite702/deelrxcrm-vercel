"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  createdAt: string;
}

export default function CustomersClient() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReferralsPanel, setShowReferralsPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // Referral form state
  const [referralForm, setReferralForm] = useState({
    referredEmail: "",
    referredPhone: "",
    rewardAmount: "0",
    notes: "",
    expiresAt: "",
  });

  // Get team ID from API
  const [teamId, setTeamId] = useState<string | null>(null);

  const loadTeam = async () => {
    try {
      const response = await fetch("/api/team");
      if (!response.ok) {
        throw new Error(`Failed to load team: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.team && data.team.id) {
        setTeamId(data.team.id.toString());
      } else {
        throw new Error("No team found for user");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load team information"
      );
    }
  };

  const loadCustomers = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(`/api/teams/${teamId}/customers?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to load customers: ${response.statusText}`);
      }
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const loadReferrals = async () => {
    if (!teamId) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/referrals`);
      if (!response.ok) {
        throw new Error(`Failed to load referrals: ${response.statusText}`);
      }
      const data = await response.json();
      setReferrals(data.referrals || []);
    } catch (err) {
      console.error("Error loading referrals:", err);
    }
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !selectedCustomer) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/referrals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referrerCustomerId: selectedCustomer.id,
          referredEmail: referralForm.referredEmail,
          referredPhone: referralForm.referredPhone,
          rewardAmount: parseInt(referralForm.rewardAmount),
          notes: referralForm.notes,
          expiresAt: referralForm.expiresAt || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create referral: ${response.statusText}`);
      }

      // Reset form and close modal
      setReferralForm({
        referredEmail: "",
        referredPhone: "",
        rewardAmount: "0",
        notes: "",
        expiresAt: "",
      });
      setShowReferralForm(false);
      setSelectedCustomer(null);

      // Reload referrals
      await loadReferrals();
    } catch (err) {
      console.error("Error creating referral:", err);
      alert(err instanceof Error ? err.message : "Failed to create referral");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create customer: ${response.statusText}`);
      }

      // Reset form and reload customers
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
      });
      setShowAddForm(false);
      await loadCustomers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create customer"
      );
    }
  };

  const formatFullName = (customer: Customer) => {
    return [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  };

  const formatAddress = (address?: Customer["address"]) => {
    if (!address) return "";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
    ].filter(Boolean);
    return parts.join(", ") || "";
  };

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    if (teamId) {
      loadCustomers();
      loadReferrals();
    }
  }, [teamId]);

  // Auto-search after 500ms delay
  useEffect(() => {
    if (teamId) {
      const timer = setTimeout(() => {
        loadCustomers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, teamId]);

  if (loading) {
    return (
      <div className="urban-card">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="urban-card">
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded neon-focus">
          <strong>Error:</strong> {error}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-gray-400 text-sm">This could be due to:</p>
          <ul className="text-gray-400 text-sm list-disc list-inside space-y-1">
            <li>Database connection issues</li>
            <li>Authentication/session expired</li>
            <li>Team setup not completed</li>
          </ul>
        </div>
        <div className="mt-4 space-x-3">
          <button
            onClick={() => {
              setError(null);
              loadTeam();
            }}
            className="btn-neon neon-glow hover:neon-glow-strong"
          >
            Retry
          </button>
          {!teamId && (
            <button
              onClick={() => {
                setError(null);
                setTeamId("demo");
                setCustomers([
                  {
                    id: "demo-1",
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    phone: "(555) 123-4567",
                    address: {
                      street: "123 Main St",
                      city: "San Francisco",
                      state: "CA",
                      zipCode: "94102",
                      country: "USA",
                    },
                    isActive: true,
                    createdAt: new Date().toISOString(),
                  },
                ]);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 neon-focus"
            >
              View Demo Data
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="urban-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {customers.length} customers total
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
              />
              <button
                onClick={() => loadCustomers()}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 neon-focus border border-gray-600"
              >
                Search
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-neon neon-glow hover:neon-glow-strong"
            >
              {showAddForm ? "Cancel" : "Add Customer"}
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <div className="urban-card neon-focus">
          <h3 className="text-xl font-semibold mb-6 text-white neon-glow">
            Add New Customer
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
              />
            </div>
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-gray-300 mb-3 neon-glow">
                Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          street: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          zipCode: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Country"
                    value={formData.address.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          country: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="btn-neon neon-glow hover:neon-glow-strong"
              >
                Add Customer
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 neon-focus border border-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Table */}
      <div className="urban-card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No customers found. Add your first customer to get started.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white neon-glow">
                        {formatFullName(customer)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {customer.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {customer.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="max-w-xs truncate">
                        {formatAddress(customer.address) || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          customer.isActive
                            ? "text-green-300 bg-green-900/30 border border-green-500/30"
                            : "text-red-300 bg-red-900/30 border border-red-500/30"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowReferralsPanel(true);
                          }}
                          className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 neon-focus"
                        >
                          Referrals
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowReferralForm(true);
                          }}
                          className="px-3 py-1 text-xs bg-neon-cyan text-gray-900 rounded-lg hover:bg-cyan-400 neon-focus"
                        >
                          + Refer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referrals Panel */}
      {showReferralsPanel && selectedCustomer && (
        <div className="urban-card neon-focus">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white neon-glow">
              Referrals for {formatFullName(selectedCustomer)}
            </h3>
            <button
              onClick={() => {
                setShowReferralsPanel(false);
                setSelectedCustomer(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {referrals
              .filter(r => r.referrerCustomerId === selectedCustomer.id)
              .length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No referrals found for this customer.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Referred Email/Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Reward
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {referrals
                      .filter(r => r.referrerCustomerId === selectedCustomer.id)
                      .map((referral) => (
                        <tr key={referral.id} className="hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm text-white">
                            {referral.referredEmail || referral.referredPhone || "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                referral.status === "converted"
                                  ? "text-green-300 bg-green-900/30 border border-green-500/30"
                                  : referral.status === "expired"
                                  ? "text-red-300 bg-red-900/30 border border-red-500/30"
                                  : "text-yellow-300 bg-yellow-900/30 border border-yellow-500/30"
                              }`}
                            >
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            ${referral.rewardAmount}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referral Form Modal */}
      {showReferralForm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="urban-card max-w-md w-full neon-focus">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white neon-glow">
                Create Referral for {formatFullName(selectedCustomer)}
              </h3>
              <button
                onClick={() => {
                  setShowReferralForm(false);
                  setSelectedCustomer(null);
                }}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReferralSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Referred Email
                </label>
                <input
                  type="email"
                  value={referralForm.referredEmail}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, referredEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  placeholder="Enter referred person's email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Referred Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={referralForm.referredPhone}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, referredPhone: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  placeholder="Enter referred person's phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reward Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={referralForm.rewardAmount}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, rewardAmount: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={referralForm.notes}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                  placeholder="Any additional notes about this referral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={referralForm.expiresAt}
                  onChange={(e) =>
                    setReferralForm({ ...referralForm, expiresAt: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 neon-focus focus:border-neon-cyan"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReferralForm(false);
                    setSelectedCustomer(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 neon-focus border border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-neon neon-glow hover:neon-glow-strong"
                >
                  Create Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
