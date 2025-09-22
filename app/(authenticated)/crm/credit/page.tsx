import { Suspense } from "react";
import CreditClient from "./CreditClient";

export default function CreditPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white neon-glow">
          Credit Management
        </h1>
        <p className="text-gray-300 mt-2 text-lg">
          Manage credit accounts, transactions, and payment methods
        </p>
      </div>
      <Suspense
        fallback={
          <div className="urban-card animate-pulse">
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        }
      >
        <CreditClient />
      </Suspense>
    </div>
  );
}
