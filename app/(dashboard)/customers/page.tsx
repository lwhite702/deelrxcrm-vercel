import React from "react";
import CustomersClient from "./CustomersClient";

export default function CustomersPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Customer Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your customer database and information
        </p>
      </div>
      <CustomersClient />
    </div>
  );
}
