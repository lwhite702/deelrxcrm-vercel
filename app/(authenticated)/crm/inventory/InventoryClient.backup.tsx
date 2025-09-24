"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  category: string;
}

interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  adjustmentType: string;
  quantity: number;
  reason: string;
  notes: string;
  previousQuantity: number;
  newQuantity: number;
  createdAt: string;
}

/**
 * Manages the inventory client interface, including product display and stock adjustments.
 *
 * This component fetches products and adjustments from the API on mount, manages the state for products, adjustments, and the adjustment form, and handles the submission of stock adjustments. It also provides visual feedback for stock status and allows users to view recent adjustments.
 *
 * @returns {JSX.Element} The rendered inventory client component.
 */
export default function InventoryClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showAdjustmentsPanel, setShowAdjustmentsPanel] = useState(false);

  // Form state for adjustments
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: "increase" as "increase" | "decrease" | "correction",
    quantity: "",
    reason: "other" as
      | "waste"
      | "sample"
      | "personal"
      | "recount"
      | "damage"
      | "theft"
      | "expired"
      | "other",
    notes: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchAdjustments();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/teams/1/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async () => {
    try {
      const response = await fetch("/api/teams/1/adjustments");
      if (response.ok) {
        const data = await response.json();
        setAdjustments(data.adjustments || []);
      }
    } catch (error) {
      console.error("Failed to fetch adjustments:", error);
    }
  };

  /**
   * Handles the submission of an adjustment form.
   *
   * This function prevents the default form submission behavior, checks if a product is selected, and then sends a POST request to create an adjustment.
   * If the request is successful, it refreshes the product and adjustment data, resets the form, and updates the UI state.
   * In case of an error, it alerts the user with the error message.
   *
   * @param e - The event object from the form submission.
   */
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const response = await fetch("/api/teams/1/adjustments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustmentType: adjustmentForm.adjustmentType,
          quantity: parseInt(adjustmentForm.quantity),
          reason: adjustmentForm.reason,
          notes: adjustmentForm.notes,
        }),
      });

      if (response.ok) {
        // Refresh data
        await fetchProducts();
        await fetchAdjustments();

        // Reset form
        setAdjustmentForm({
          adjustmentType: "increase",
          quantity: "",
          reason: "other",
          notes: "",
        });
        setShowAdjustmentForm(false);
        setSelectedProduct(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to create adjustment"}`);
      }
    } catch (error) {
      console.error("Failed to create adjustment:", error);
      alert("Failed to create adjustment");
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStockStatus = (product: Product): 'out-of-stock' | 'low-stock' | 'in-stock' => {
    if (product.stockQuantity <= 0) return "out-of-stock";
    if (product.stockQuantity <= product.lowStockThreshold) return "low-stock";
    return "in-stock";
  };

  /**
   * Determines the CSS class for stock status color based on the provided status.
   *
   * The function evaluates the input `status` string and returns a corresponding CSS class
   * for styling. It checks for "out-of-stock" and "low-stock" statuses, returning specific
   * classes for each, while defaulting to a class indicating that the stock is available.
   *
   * @param {string} status - The stock status to evaluate, which can be "out-of-stock",
   * "low-stock", or any other string indicating available stock.
   */
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return "text-red-400";
      case "low-stock":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  if (loading) {
    return (
      <div className="urban-card animate-pulse">
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Button
            onClick={() => setShowAdjustmentsPanel(!showAdjustmentsPanel)}
            variant={showAdjustmentsPanel ? "default" : "secondary"}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Adjustments History
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Products</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const status = getStockStatus(product);
            return (
              <Card key={product.id} className="bg-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(product.priceCents)}
                      </p>
                    </div>
                  </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p
                      className={`text-sm font-medium ${getStockStatusColor(
                        status
                      )}`}
                    >
                      Stock: {product.stockQuantity}
                    </p>
                    <p className="text-xs text-gray-500">
                      Low Stock: {product.lowStockThreshold}
                    </p>
                  </div>
                  {product.category && (
                    <span className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300">
                      {product.category}
                    </span>
                  )}
                </div>

                                  <Button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowAdjustmentForm(true);
                    }}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Adjust Stock
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No products found</p>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Adjustments Panel */}
      {showAdjustmentsPanel && (
        <div className="urban-card">
          <h2 className="text-2xl font-bold text-white mb-6">
            Recent Adjustments
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Product</th>
                  <th className="text-left py-3 px-4 text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 text-gray-300">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300">Reason</th>
                  <th className="text-left py-3 px-4 text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id} className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">
                          {adjustment.productName}
                        </p>
                        {adjustment.productSku && (
                          <p className="text-sm text-gray-400">
                            {adjustment.productSku}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {adjustment.adjustmentType === "increase" && (
                          <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                        )}
                        {adjustment.adjustmentType === "decrease" && (
                          <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                        )}
                        {adjustment.adjustmentType === "correction" && (
                          <RotateCcw className="h-4 w-4 text-blue-400 mr-1" />
                        )}
                        <span className="text-gray-300 capitalize">
                          {adjustment.adjustmentType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white">
                        <p>{adjustment.quantity}</p>
                        <p className="text-xs text-gray-400">
                          {adjustment.previousQuantity} →{" "}
                          {adjustment.newQuantity}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300 capitalize">
                        {adjustment.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(adjustment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {adjustments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No adjustments found</p>
            </div>
          )}
        </div>
      )}

      {/* Adjustment Form Modal */}
      {showAdjustmentForm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Adjust Stock: {selectedProduct.name}
            </h3>
            <p className="text-gray-400 mb-4">
              Current Stock: {selectedProduct.stockQuantity}
            </p>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adjustment Type
                </label>
                <select
                  value={adjustmentForm.adjustmentType}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      adjustmentType: e.target.value as any,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                  <option value="correction">Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {adjustmentForm.adjustmentType === "correction"
                    ? "New Quantity"
                    : "Quantity"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentForm.quantity}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason
                </label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      reason: e.target.value as any,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="waste">Waste</option>
                  <option value="sample">Sample</option>
                  <option value="personal">Personal</option>
                  <option value="recount">Recount</option>
                  <option value="damage">Damage</option>
                  <option value="theft">Theft</option>
                  <option value="expired">Expired</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 urban-btn bg-blue-600">
                  Create Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustmentForm(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 urban-btn bg-gray-700"
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
