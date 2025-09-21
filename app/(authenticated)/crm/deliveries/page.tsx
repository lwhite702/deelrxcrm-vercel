import { Suspense } from "react";
import DeliveriesClient from "./DeliveriesClient";

export default function DeliveriesPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white neon-glow">
          Delivery Management
        </h1>
        <p className="text-gray-300 mt-2 text-lg">
          Track and manage order deliveries and shipments
        </p>
      </div>
      <Suspense
        fallback={
          <div className="urban-card animate-pulse">
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        }
      >
        <DeliveriesClient />
      </Suspense>
    </div>
  );
}