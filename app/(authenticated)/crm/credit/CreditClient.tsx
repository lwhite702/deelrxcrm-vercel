"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  History,
  Settings,
} from "lucide-react";

interface CreditAccount {
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  status: "active" | "suspended" | "closed" | "defaulted";
  customerId?: string;
  recentTransactions: CreditTransaction[];
}

interface CreditTransaction {
  id: string;
  transactionType: "charge" | "payment" | "fee" | "adjustment";
  amount: number;
  description?: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded";
  createdAt: string;
  orderId?: string;
  dueDate?: string;
}

export default function CreditClient() {
  const router = useRouter();
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(
    null
  );
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupIntent, setShowSetupIntent] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedView, setSelectedView] = useState<
    "overview" | "transactions" | "settings"
  >("overview");

  // TODO: Get teamId from auth context
  const teamId = "placeholder-team-id";

  // Form state for new transactions
  const [transactionForm, setTransactionForm] = useState({
    transactionType: "charge" as const,
    amount: "",
    description: "",
    orderId: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchCreditAccount();
    fetchTransactions();
  }, []);

  const fetchCreditAccount = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/credit`);
      if (!response.ok) throw new Error("Failed to fetch credit account");
      const data = await response.json();
      setCreditAccount(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load credit account"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `/api/teams/${teamId}/credit/transactions?limit=50`
      );
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  };

  const handleCreateSetupIntent = async () => {
    // TODO: Implement Stripe SetupIntent creation
    setShowSetupIntent(true);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/teams/${teamId}/credit/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transactionForm,
          amount: parseInt(transactionForm.amount) * 100, // Convert to cents
          creditId: creditAccount?.customerId, // TODO: Get actual credit ID
        }),
      });

      if (!response.ok) throw new Error("Failed to create transaction");

      setShowTransactionForm(false);
      setTransactionForm({
        transactionType: "charge",
        amount: "",
        description: "",
        orderId: "",
        dueDate: "",
      });
      await fetchTransactions();
      await fetchCreditAccount();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction"
      );
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "completed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "processing":
        return "text-blue-400";
      case "failed":
        return "text-red-400";
      case "suspended":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="urban-card animate-pulse">
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="urban-card">
        <div className="text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { key: "overview", label: "Overview", icon: CreditCard },
          { key: "transactions", label: "Transactions", icon: History },
          { key: "settings", label: "Settings", icon: Settings },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedView(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              selectedView === key
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedView === "overview" && (
        <>
          {/* Credit Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="urban-card">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  Credit Limit
                </h3>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(creditAccount?.creditLimit || 0)}
              </p>
            </div>

            <div className="urban-card">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Current Balance
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {formatCurrency(creditAccount?.currentBalance || 0)}
              </p>
            </div>

            <div className="urban-card">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Available Credit
                </h3>
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {formatCurrency(creditAccount?.availableCredit || 0)}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="urban-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Account Status
                </h3>
                <p
                  className={`${getStatusColor(
                    creditAccount?.status || ""
                  )} font-medium`}
                >
                  {creditAccount?.status?.toUpperCase() || "UNKNOWN"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateSetupIntent}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Setup Payment Method
                </button>
                <button
                  onClick={() => setShowTransactionForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Transaction
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="urban-card">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Transactions
            </h3>
            <div className="space-y-2">
              {creditAccount?.recentTransactions?.length === 0 ? (
                <p className="text-gray-400">No recent transactions</p>
              ) : (
                creditAccount?.recentTransactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 bg-gray-800 rounded"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {transaction.transactionType.toUpperCase()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {transaction.description || "No description"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.transactionType === "payment"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.transactionType === "payment" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p
                        className={`text-sm ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Transactions Tab */}
      {selectedView === "transactions" && (
        <div className="urban-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              All Transactions
            </h3>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Transaction
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-2 text-gray-300">Type</th>
                  <th className="pb-2 text-gray-300">Amount</th>
                  <th className="pb-2 text-gray-300">Status</th>
                  <th className="pb-2 text-gray-300">Description</th>
                  <th className="pb-2 text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-800">
                    <td className="py-3 text-white font-medium">
                      {transaction.transactionType.toUpperCase()}
                    </td>
                    <td
                      className={`py-3 font-bold ${
                        transaction.transactionType === "payment"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.transactionType === "payment" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td
                      className={`py-3 ${getStatusColor(transaction.status)}`}
                    >
                      {transaction.status.toUpperCase()}
                    </td>
                    <td className="py-3 text-gray-300">
                      {transaction.description || "No description"}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {selectedView === "settings" && (
        <div className="urban-card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Credit Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Credit Limit</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                defaultValue={
                  creditAccount?.creditLimit
                    ? creditAccount.creditLimit / 100
                    : 0
                }
                placeholder="Enter credit limit"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Account Status</label>
              <select
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                defaultValue={creditAccount?.status}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="closed">Closed</option>
                <option value="defaulted">Defaulted</option>
              </select>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md">
              Update Settings
            </button>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              New Transaction
            </h3>
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">
                  Transaction Type
                </label>
                <select
                  value={transactionForm.transactionType}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      transactionType: e.target.value as any,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="charge">Charge</option>
                  <option value="payment">Payment</option>
                  <option value="fee">Fee</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md"
                >
                  Create Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
