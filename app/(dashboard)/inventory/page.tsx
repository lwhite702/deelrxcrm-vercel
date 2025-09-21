import React from "react";
import InventoryClient from "./InventoryClient";

export default function InventoryPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Manage your products, stock levels, and adjustments</p>
      </div>
      <InventoryClient />
    </div>
  );
}