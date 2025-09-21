"use client";

import { useState, useEffect } from "react";
import { Plus, Star, TrendingUp, TrendingDown, Users, Gift } from "lucide-react";

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  pointsPerDollar: number;
  dollarsPerPoint: number;
  minimumRedemption: number;
  expirationMonths: number | null;
  createdAt: string;
}

interface LoyaltyAccount {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  programId: string;
  programName: string;
  currentPoints: number;
  lifetimePoints: number;
  lifetimeRedeemed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function LoyaltyClient() {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showPointsForm, setShowPointsForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<LoyaltyAccount | null>(null);
  const [activeTab, setActiveTab] = useState<"programs" | "accounts">("programs");

  // Form states
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    isActive: true,
    pointsPerDollar: "1",
    dollarsPerPoint: "100",
    minimumRedemption: "100",
    expirationMonths: "",
  });

  const [pointsForm, setPointsForm] = useState({
    action: "accrue" as "accrue" | "redeem",
    customerId: "",
    programId: "",
    points: "",
    description: "",
  });

  useEffect(() => {
    fetchPrograms();
    fetchAccounts();
    fetchCustomers();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch("/api/teams/1/loyalty/programs");
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/teams/1/loyalty/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/teams/1/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/teams/1/loyalty/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...programForm,
          pointsPerDollar: parseInt(programForm.pointsPerDollar),
          dollarsPerPoint: parseInt(programForm.dollarsPerPoint),
          minimumRedemption: parseInt(programForm.minimumRedemption),
          expirationMonths: programForm.expirationMonths 
            ? parseInt(programForm.expirationMonths) 
            : null,
        }),
      });

      if (response.ok) {
        await fetchPrograms();
        setShowProgramForm(false);
        resetProgramForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to create program"}`);
      }
    } catch (error) {
      console.error("Failed to create program:", error);
      alert("Failed to create program");
    }
  };

  const handlePointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/teams/1/loyalty/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: pointsForm.action,
          customerId: pointsForm.customerId,
          programId: pointsForm.programId,
          points: parseInt(pointsForm.points),
          description: pointsForm.description,
        }),
      });

      if (response.ok) {
        await fetchAccounts();
        setShowPointsForm(false);
        resetPointsForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to process points"}`);
      }
    } catch (error) {
      console.error("Failed to process points:", error);
      alert("Failed to process points");
    }
  };

  const resetProgramForm = () => {
    setProgramForm({
      name: "",
      description: "",
      isActive: true,
      pointsPerDollar: "1",
      dollarsPerPoint: "100",
      minimumRedemption: "100",
      expirationMonths: "",
    });
  };

  const resetPointsForm = () => {
    setPointsForm({
      action: "accrue",
      customerId: "",
      programId: "",
      points: "",
      description: "",
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
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
          <button
            onClick={() => setActiveTab("programs")}
            className={`urban-btn ${activeTab === "programs" ? "bg-blue-600" : "bg-gray-700"}`}
          >
            <Star className="h-4 w-4 mr-2" />
            Programs
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`urban-btn ${activeTab === "accounts" ? "bg-blue-600" : "bg-gray-700"}`}
          >
            <Users className="h-4 w-4 mr-2" />
            Customer Accounts
          </button>
        </div>
        <div className="flex space-x-2">
          {activeTab === "programs" && (
            <button 
              onClick={() => setShowProgramForm(true)}
              className="urban-btn bg-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </button>
          )}
          {activeTab === "accounts" && (
            <button 
              onClick={() => setShowPointsForm(true)}
              className="urban-btn bg-green-600"
            >
              <Gift className="h-4 w-4 mr-2" />
              Manage Points
            </button>
          )}
        </div>
      </div>

      {/* Programs Tab */}
      {activeTab === "programs" && (
        <div className="urban-card">
          <h2 className="text-2xl font-bold text-white mb-6">Loyalty Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div key={program.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{program.name}</h3>
                    {program.description && (
                      <p className="text-sm text-gray-400 mt-1">{program.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    program.isActive 
                      ? "bg-green-800 text-green-200" 
                      : "bg-red-800 text-red-200"
                  }`}>
                    {program.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Points per $:</span>
                    <span className="text-white">{program.pointsPerDollar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Point value:</span>
                    <span className="text-white">{formatCurrency(program.dollarsPerPoint)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min redemption:</span>
                    <span className="text-white">{program.minimumRedemption} pts</span>
                  </div>
                  {program.expirationMonths && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expires:</span>
                      <span className="text-white">{program.expirationMonths} months</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(program.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {programs.length === 0 && (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No loyalty programs found</p>
            </div>
          )}
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === "accounts" && (
        <div className="urban-card">
          <h2 className="text-2xl font-bold text-white mb-6">Customer Loyalty Accounts</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-300">Program</th>
                  <th className="text-left py-3 px-4 text-gray-300">Current Points</th>
                  <th className="text-left py-3 px-4 text-gray-300">Lifetime Points</th>
                  <th className="text-left py-3 px-4 text-gray-300">Redeemed</th>
                  <th className="text-left py-3 px-4 text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b border-gray-800">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{account.customerName}</p>
                        <p className="text-sm text-gray-400">{account.customerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white">{account.programName}</td>
                    <td className="py-3 px-4">
                      <span className="text-green-400 font-bold">
                        {account.currentPoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {account.lifetimePoints.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {account.lifetimeRedeemed.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        account.isActive 
                          ? "bg-green-800 text-green-200" 
                          : "bg-red-800 text-red-200"
                      }`}>
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {accounts.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No customer accounts found</p>
            </div>
          )}
        </div>
      )}

      {/* Create Program Modal */}
      {showProgramForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Create Loyalty Program</h3>

            <form onSubmit={handleProgramSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Program Name
                </label>
                <input
                  type="text"
                  value={programForm.name}
                  onChange={(e) => setProgramForm(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={programForm.description}
                  onChange={(e) => setProgramForm(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Points per Dollar
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={programForm.pointsPerDollar}
                    onChange={(e) => setProgramForm(prev => ({
                      ...prev,
                      pointsPerDollar: e.target.value
                    }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Point Value (cents)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={programForm.dollarsPerPoint}
                    onChange={(e) => setProgramForm(prev => ({
                      ...prev,
                      dollarsPerPoint: e.target.value
                    }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Redemption
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={programForm.minimumRedemption}
                    onChange={(e) => setProgramForm(prev => ({
                      ...prev,
                      minimumRedemption: e.target.value
                    }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expires (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={programForm.expirationMonths}
                    onChange={(e) => setProgramForm(prev => ({
                      ...prev,
                      expirationMonths: e.target.value
                    }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Never expires"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={programForm.isActive}
                  onChange={(e) => setProgramForm(prev => ({
                    ...prev,
                    isActive: e.target.checked
                  }))}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Active program
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 urban-btn bg-blue-600"
                >
                  Create Program
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProgramForm(false);
                    resetProgramForm();
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

      {/* Points Management Modal */}
      {showPointsForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Manage Customer Points</h3>

            <form onSubmit={handlePointsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Action
                </label>
                <select
                  value={pointsForm.action}
                  onChange={(e) => setPointsForm(prev => ({
                    ...prev,
                    action: e.target.value as any
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="accrue">Award Points</option>
                  <option value="redeem">Redeem Points</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Customer
                </label>
                <select
                  value={pointsForm.customerId}
                  onChange={(e) => setPointsForm(prev => ({
                    ...prev,
                    customerId: e.target.value
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Program
                </label>
                <select
                  value={pointsForm.programId}
                  onChange={(e) => setPointsForm(prev => ({
                    ...prev,
                    programId: e.target.value
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="">Select a program</option>
                  {programs.filter(p => p.isActive).map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={pointsForm.points}
                  onChange={(e) => setPointsForm(prev => ({
                    ...prev,
                    points: e.target.value
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={pointsForm.description}
                  onChange={(e) => setPointsForm(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder={`${pointsForm.action === "accrue" ? "Earned" : "Redeemed"} ${pointsForm.points} points`}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 urban-btn ${
                    pointsForm.action === "accrue" ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {pointsForm.action === "accrue" ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Award Points
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Redeem Points
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPointsForm(false);
                    resetPointsForm();
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