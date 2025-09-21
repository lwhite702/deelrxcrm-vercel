import { Suspense } from 'react';
import CustomersClient from './CustomersClient';

/**
 * Renders the Customers page for managing customer information.
 */
export default function CustomersPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white neon-glow">
          Customer Management
        </h1>
        <p className="text-gray-300 mt-2 text-lg">
          Manage your customer database and information
        </p>
      </div>
      <Suspense 
        fallback={
          <div className="urban-card animate-pulse">
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        }
      >
        <CustomersClient />
      </Suspense>
    </div>
  );
}