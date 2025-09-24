export default function PaymentsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Manual Reconciliation</h2>
        <p className="text-gray-600 mb-4">
          Manage and reconcile your payment transactions manually.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium">Pending Payments</h3>
            <p className="text-sm text-gray-500">Review pending transactions</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium">Failed Payments</h3>
            <p className="text-sm text-gray-500">Handle failed payment attempts</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium">Reconciliation Tools</h3>
            <p className="text-sm text-gray-500">Manual reconciliation utilities</p>
          </div>
        </div>
      </div>
    </div>
  );
}