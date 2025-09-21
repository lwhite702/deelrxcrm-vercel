"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface Payment {
  id: string;
  orderId: string;
  stripePaymentIntentId: string;
  amount: number;
  status:
    | "pending"
    | "processing"
    | "succeeded"
    | "failed"
    | "canceled"
    | "refunded"
    | "partially_refunded";
  method: "card" | "bank_transfer" | "cash" | "other";
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface RefundRequest {
  paymentId: string;
  amount: number;
  reason?: string;
}

export default function PaymentsClient() {
  const { user } = useUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  // Get tenant ID (simplified - in real app this would come from context/params)
  const tenantId = "demo-tenant"; // TODO: Get from URL params or context

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(
        `/api/tenants/${tenantId}/payments?${params}`
      );
      if (!response.ok) {
        throw new Error(`Failed to load payments: ${response.statusText}`);
      }
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPayments();
  };

  const openRefundModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount - (payment.refundAmount || 0));
    setRefundReason("");
    setShowRefundModal(true);
  };

  const closeRefundModal = () => {
    setShowRefundModal(false);
    setSelectedPayment(null);
    setRefundAmount(0);
    setRefundReason("");
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment || refundAmount <= 0) return;

    try {
      setIsRefunding(true);
      setError(null);

      const response = await fetch(`/api/tenants/${tenantId}/refund-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          amount: refundAmount,
          reason: refundReason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to process refund: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Close modal and reload payments
      closeRefundModal();
      await loadPayments();

      alert(`Refund processed successfully! Refund ID: ${result.refund.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "succeeded":
        return "text-green-600 bg-green-100";
      case "processing":
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
      case "canceled":
        return "text-red-600 bg-red-100";
      case "refunded":
        return "text-purple-600 bg-purple-100";
      case "partially_refunded":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const canRefund = (payment: Payment) => {
    return (
      payment.status === "succeeded" &&
      (payment.refundAmount || 0) < payment.amount
    );
  };

  const getRefundableAmount = (payment: Payment) => {
    return payment.amount - (payment.refundAmount || 0);
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  // Auto-search after 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) loadPayments();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  if (!user) {
    return <div className="p-4">Please sign in to view payments.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading payments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <div className="text-sm text-gray-600">
          {payments.length} payments total
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
          <button
            onClick={loadPayments}
            className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search payments (Order ID, Payment Intent ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially Refunded</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {payment.id.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {payment.stripePaymentIntentId.slice(0, 20)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment.orderId.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.refundAmount && payment.refundAmount > 0 && (
                        <div className="text-xs text-red-600">
                          Refunded: {formatCurrency(payment.refundAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {payment.method.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {canRefund(payment) && (
                        <button
                          onClick={() => openRefundModal(payment)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Process Refund</h3>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Payment Details:</div>
              <div className="font-mono text-sm">
                ID: {selectedPayment.id.slice(0, 12)}...
              </div>
              <div className="text-sm">
                Original Amount: {formatCurrency(selectedPayment.amount)}
              </div>
              <div className="text-sm">
                Refundable:{" "}
                {formatCurrency(getRefundableAmount(selectedPayment))}
              </div>
            </div>

            <form onSubmit={handleRefund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0.01"
                    max={getRefundableAmount(selectedPayment) / 100}
                    step="0.01"
                    value={refundAmount / 100}
                    onChange={(e) =>
                      setRefundAmount(
                        Math.round(parseFloat(e.target.value || "0") * 100)
                      )
                    }
                    className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for refund..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isRefunding || refundAmount <= 0}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-300"
                >
                  {isRefunding ? "Processing..." : "Process Refund"}
                </button>
                <button
                  type="button"
                  onClick={closeRefundModal}
                  disabled={isRefunding}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
