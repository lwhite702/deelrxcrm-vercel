"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface DashboardKPIs {
  totalSales: number;
  totalCustomers: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
    customerName?: string;
  }>;
}

export default function DashboardClient({ initialKPIs }: { initialKPIs?: DashboardKPIs }) {
  const { user } = useUser();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(initialKPIs || null);
  const [loading, setLoading] = useState(!initialKPIs);
  const [error, setError] = useState<string | null>(null);

  // Get tenant ID (simplified - in real app this would come from context/params)
  const tenantId = "demo-tenant"; // TODO: Get from URL params or context

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenants/${tenantId}/dashboard/kpis`);
      if (!response.ok) {
        throw new Error(`Failed to load KPIs: ${response.statusText}`);
      }
      const data = await response.json();
      setKpis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  useEffect(() => {
    if (user && !initialKPIs) {
      loadKPIs();
    }
  }, [user]);

  if (!user) {
    return <div className="p-4">Please sign in to view the dashboard.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
        <button
          onClick={loadKPIs}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your CRM performance</p>
        </div>
        <button
          onClick={loadKPIs}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpis ? formatCurrency(kpis.totalSales) : "$0.00"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpis?.totalCustomers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpis?.totalOrders || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpis?.totalProducts || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {kpis && kpis.lowStockProducts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Stock Alert
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {kpis.lowStockProducts} products are running low on stock. 
                  <a href="/inventory" className="font-medium underline hover:text-yellow-600 ml-1">
                    View inventory →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {kpis?.recentOrders && kpis.recentOrders.length > 0 ? (
            kpis.recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Order #{order.id.slice(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.customerName || "Walk-in customer"} • {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === "completed" ? "text-green-600 bg-green-100" :
                    order.status === "pending" ? "text-yellow-600 bg-yellow-100" :
                    "text-gray-600 bg-gray-100"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No recent orders found.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/sales-pos"
              className="flex flex-col items-center p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mb-2">🛒</span>
              <span className="text-sm font-medium text-gray-700">New Sale</span>
            </a>
            <a
              href="/inventory"
              className="flex flex-col items-center p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mb-2">📦</span>
              <span className="text-sm font-medium text-gray-700">Inventory</span>
            </a>
            <a
              href="/customers"
              className="flex flex-col items-center p-4 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm font-medium text-gray-700">Customers</span>
            </a>
            <a
              href="/payments"
              className="flex flex-col items-center p-4 text-center bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-2xl mb-2">💳</span>
              <span className="text-sm font-medium text-gray-700">Payments</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
