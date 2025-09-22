"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerLastName: string;
  method: string;
  status: string;
  costCents: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  instructions: string;
  trackingNumber: string;
  estimatedDeliveryAt: string;
  actualDeliveryAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  totalCents: number;
}

/**
 * Manages the delivery and order functionalities for the client interface.
 *
 * This component handles the state for deliveries and orders, including fetching data from the API, creating new deliveries, and updating existing ones. It utilizes hooks to manage form states and loading indicators, and renders the UI for displaying deliveries, including their statuses and associated actions. The component also provides modals for creating and updating deliveries, ensuring a seamless user experience.
 *
 * @returns {JSX.Element} The rendered component for managing deliveries and orders.
 */
export default function DeliveriesClient() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null
  );
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  // Form state
  const [deliveryForm, setDeliveryForm] = useState({
    orderId: "",
    method: "standard_delivery" as
      | "pickup"
      | "standard_delivery"
      | "express_delivery"
      | "overnight"
      | "courier"
      | "postal",
    costCents: "",
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
    },
    instructions: "",
    trackingNumber: "",
    estimatedDeliveryAt: "",
    notes: "",
  });

  const [updateForm, setUpdateForm] = useState({
    status: "pending" as
      | "pending"
      | "assigned"
      | "in_transit"
      | "delivered"
      | "failed"
      | "returned",
    trackingNumber: "",
    actualDeliveryAt: "",
    notes: "",
  });

  useEffect(() => {
    fetchDeliveries();
    fetchOrders();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch("/api/teams/1/deliveries");
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/teams/1/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  /**
   * Handles the submission of the delivery creation form.
   *
   * This function prevents the default form submission behavior, sends a POST request to create a new delivery with the provided data, and handles the response. If the request is successful, it fetches the updated deliveries, hides the form, and resets the form fields. In case of an error, it alerts the user with the error message.
   *
   * @param e - The event object from the form submission.
   * @returns void
   * @throws Error If the fetch request fails or if the response is not ok.
   */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/teams/1/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...deliveryForm,
          costCents: parseInt(deliveryForm.costCents) || 0,
          estimatedDeliveryAt: deliveryForm.estimatedDeliveryAt || undefined,
        }),
      });

      if (response.ok) {
        await fetchDeliveries();
        setShowCreateForm(false);
        resetCreateForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to create delivery"}`);
      }
    } catch (error) {
      console.error("Failed to create delivery:", error);
      alert("Failed to create delivery");
    }
  };

  /**
   * Handles the submission of the update form for a delivery.
   *
   * This function prevents the default form submission behavior, checks if a delivery is selected, and constructs an updateData object with the new status, notes, and optional tracking number and actual delivery date. It then sends a PATCH request to update the delivery on the server. If the update is successful, it fetches the updated deliveries and resets the form state. In case of an error, it alerts the user with the error message.
   *
   * @param e - The form event triggered by the submission.
   * @returns void
   * @throws Error If the fetch request fails or the response is not ok.
   */
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      const updateData: any = {
        status: updateForm.status,
        notes: updateForm.notes,
      };

      if (updateForm.trackingNumber) {
        updateData.trackingNumber = updateForm.trackingNumber;
      }

      if (updateForm.actualDeliveryAt) {
        updateData.actualDeliveryAt = new Date(
          updateForm.actualDeliveryAt
        ).toISOString();
      }

      const response = await fetch(
        `/api/teams/1/deliveries/${selectedDelivery.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        await fetchDeliveries();
        setShowUpdateForm(false);
        setSelectedDelivery(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to update delivery"}`);
      }
    } catch (error) {
      console.error("Failed to update delivery:", error);
      alert("Failed to update delivery");
    }
  };

  const resetCreateForm = () => {
    setDeliveryForm({
      orderId: "",
      method: "standard_delivery",
      costCents: "",
      deliveryAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
      },
      instructions: "",
      trackingNumber: "",
      estimatedDeliveryAt: "",
      notes: "",
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  /**
   * Get the appropriate status icon based on the provided status string.
   *
   * The function uses a switch statement to determine which icon to return based on the input status.
   * It handles various statuses such as "pending", "assigned", "in_transit", "delivered", "failed", and "returned",
   * returning a default icon for any unrecognized status.
   *
   * @param status - A string representing the current status.
   * @returns A JSX element representing the corresponding status icon.
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "assigned":
        return <Package className="h-4 w-4 text-blue-400" />;
      case "in_transit":
        return <Truck className="h-4 w-4 text-purple-400" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "returned":
        return <XCircle className="h-4 w-4 text-orange-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  /**
   * Get the corresponding color class for a given status.
   *
   * The function maps specific status strings to their associated color classes. It uses a switch statement to determine the color based on the input status. If the status does not match any predefined cases, a default gray color class is returned.
   *
   * @param status - A string representing the status to evaluate.
   * @returns A string representing the corresponding color class for the given status.
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400";
      case "assigned":
        return "text-blue-400";
      case "in_transit":
        return "text-purple-400";
      case "delivered":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      case "returned":
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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="text-sm text-gray-400">
            Total Deliveries: {deliveries.length}
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="urban-btn bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Delivery
        </button>
      </div>

      {/* Deliveries List */}
      <div className="urban-card">
        <h2 className="text-2xl font-bold text-white mb-6">Deliveries</h2>
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getStatusIcon(delivery.status)}
                    <h3 className="text-lg font-semibold text-white ml-2">
                      Order #{delivery.orderNumber}
                    </h3>
                    <span
                      className={`ml-2 px-2 py-1 bg-gray-700 text-xs rounded capitalize ${getStatusColor(
                        delivery.status
                      )}`}
                    >
                      {delivery.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Customer</p>
                      <p className="text-white">
                        {delivery.customerName} {delivery.customerLastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Method</p>
                      <p className="text-white capitalize">
                        {delivery.method.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Cost</p>
                      <p className="text-white">
                        {formatCurrency(delivery.costCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="text-white text-sm">
                        {delivery.deliveryAddress.street},{" "}
                        {delivery.deliveryAddress.city},{" "}
                        {delivery.deliveryAddress.state}{" "}
                        {delivery.deliveryAddress.zipCode}
                      </p>
                    </div>
                    {delivery.trackingNumber && (
                      <div>
                        <p className="text-sm text-gray-400">Tracking</p>
                        <p className="text-white font-mono text-sm">
                          {delivery.trackingNumber}
                        </p>
                      </div>
                    )}
                    {delivery.estimatedDeliveryAt && (
                      <div>
                        <p className="text-sm text-gray-400">
                          Estimated Delivery
                        </p>
                        <p className="text-white text-sm">
                          {new Date(
                            delivery.estimatedDeliveryAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {delivery.instructions && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400">Instructions</p>
                      <p className="text-white text-sm">
                        {delivery.instructions}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setUpdateForm({
                      status: delivery.status as any,
                      trackingNumber: delivery.trackingNumber || "",
                      actualDeliveryAt: delivery.actualDeliveryAt
                        ? new Date(delivery.actualDeliveryAt)
                            .toISOString()
                            .slice(0, 16)
                        : "",
                      notes: delivery.notes || "",
                    });
                    setShowUpdateForm(true);
                  }}
                  className="urban-btn bg-gray-700 ml-4"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>

        {deliveries.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No deliveries found</p>
          </div>
        )}
      </div>

      {/* Create Delivery Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Create Delivery
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order
                </label>
                <select
                  value={deliveryForm.orderId}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      orderId: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="">Select an order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.orderNumber} - {formatCurrency(order.totalCents)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Method
                  </label>
                  <select
                    value={deliveryForm.method}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        method: e.target.value as any,
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    <option value="pickup">Pickup</option>
                    <option value="standard_delivery">Standard Delivery</option>
                    <option value="express_delivery">Express Delivery</option>
                    <option value="overnight">Overnight</option>
                    <option value="courier">Courier</option>
                    <option value="postal">Postal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cost (cents)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryForm.costCents}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        costCents: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">
                  Delivery Address
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.deliveryAddress.street}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        deliveryAddress: {
                          ...prev.deliveryAddress,
                          street: e.target.value,
                        },
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.deliveryAddress.city}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          deliveryAddress: {
                            ...prev.deliveryAddress,
                            city: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.deliveryAddress.state}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          deliveryAddress: {
                            ...prev.deliveryAddress,
                            state: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.deliveryAddress.zipCode}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          deliveryAddress: {
                            ...prev.deliveryAddress,
                            zipCode: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.deliveryAddress.country}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          deliveryAddress: {
                            ...prev.deliveryAddress,
                            country: e.target.value,
                          },
                        }))
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Instructions
                </label>
                <textarea
                  value={deliveryForm.instructions}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.trackingNumber}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        trackingNumber: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estimated Delivery
                  </label>
                  <input
                    type="datetime-local"
                    value={deliveryForm.estimatedDeliveryAt}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        estimatedDeliveryAt: e.target.value,
                      }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={deliveryForm.notes}
                  onChange={(e) =>
                    setDeliveryForm((prev) => ({
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
                  Create Delivery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetCreateForm();
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

      {/* Update Delivery Modal */}
      {showUpdateForm && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Update Delivery: #{selectedDelivery.orderNumber}
            </h3>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={updateForm.status}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      status: e.target.value as any,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={updateForm.trackingNumber}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Actual Delivery Date
                </label>
                <input
                  type="datetime-local"
                  value={updateForm.actualDeliveryAt}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      actualDeliveryAt: e.target.value,
                    }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) =>
                    setUpdateForm((prev) => ({
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
                  Update Delivery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedDelivery(null);
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
