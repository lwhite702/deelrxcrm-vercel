import { Suspense } from "react";
import LoyaltyClient from "./LoyaltyClient";

export default function LoyaltyPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white neon-glow">
          Loyalty Programs
        </h1>
        <p className="text-gray-300 mt-2 text-lg">
          Manage customer loyalty programs and point transactions
        </p>
      </div>
      <Suspense
        fallback={
          <div className="urban-card animate-pulse">
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        }
      >
        <LoyaltyClient />
      </Suspense>
    </div>
  );
}
