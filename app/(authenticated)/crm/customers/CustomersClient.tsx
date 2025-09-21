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

/**
 * A React component for managing and displaying a list of customers.
 *
 * This component fetches customer data from an API based on a team ID, handles loading and error states,
 * and provides a form for adding new customers. It also includes functionality for searching customers
 * with a debounce effect and displays customer details in a table format.
 *
 * @returns {JSX.Element} The rendered component.
 */
export default function CustomersClient() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Get team ID from URL or context - for now using placeholder
  const teamId = "1"; // TODO: Get from URL params or team context

  /**
   * Load customers from the API based on the provided team ID and search term.
   *
   * The function sets a loading state, constructs query parameters for the API request, and fetches customer data.
   * It handles errors by setting an error message and ensures the loading state is reset after the operation completes.
   *
   * @param searchTerm - The term to filter customers by.
   * @param teamId - The ID of the team whose customers are to be loaded.
   * @returns Promise<void> - A promise that resolves when the operation is complete.
   * @throws Error If the response from the API is not ok.
   */
  const loadCustomers = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    loadCustomers();
  }, []);

  // Auto-search after 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        <button
          onClick={loadCustomers}
          className="mt-4 btn-neon neon-glow hover:neon-glow-strong"
        >
          Retry
        </button>
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
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Created
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
