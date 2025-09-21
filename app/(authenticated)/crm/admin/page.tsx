import { Suspense } from "react";
import AdminClient from "./AdminClient";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white neon-glow">
          Admin Operations
        </h1>
        <p className="text-gray-300 mt-2 text-lg">
          System administration, data purge operations, and inactivity policies
        </p>
      </div>
      <Suspense
        fallback={
          <div className="urban-card animate-pulse">
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        }
      >
        <AdminClient />
      </Suspense>
    </div>
  );
}