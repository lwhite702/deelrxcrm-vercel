"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trash2, AlertTriangle, Clock, Activity, Database, FileX, Users, Calendar, Settings, Plus, Play, Pause, X } from "lucide-react";

interface PurgeOperation {
  id: string;
  teamId: string;
  operationType: 'customer_data' | 'transaction_history' | 'full_account' | 'inactive_accounts';
  status: 'requested' | 'scheduled' | 'export_ready' | 'acknowledged' | 'executing' | 'completed' | 'cancelled';
  targetDate?: string;
  retentionDays?: number;
  scheduledFor?: string;
  reason?: string;
  exportUrl?: string;
  completedAt?: string;
  createdAt: string;
}

interface InactivityPolicy {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  thresholdDays: number;
  actions: {
    warnings: number[];
    suspend: boolean;
    purge: boolean;
  };
  isActive: boolean;
  lastRunAt?: string;
  createdAt: string;
}

export default function AdminClient() {
  const router = useRouter();
  const [purgeOperations, setPurgeOperations] = useState<PurgeOperation[]>([]);
  const [inactivityPolicies, setInactivityPolicies] = useState<InactivityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'purge' | 'inactivity' | 'monitoring'>('dashboard');
  const [showPurgeForm, setShowPurgeForm] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);

  // Form states  
  const [purgeForm, setPurgeForm] = useState({
    teamId: '',
    operationType: 'customer_data' as const,
    retentionDays: 365,
    reason: '',
    scheduledFor: '',
  });

  const [policyForm, setPolicyForm] = useState({
    teamId: '',
    name: '',
    description: '',
    thresholdDays: 90,
    warningDays: [30, 60],
    suspendEnabled: false,
    purgeEnabled: false,
  });

  useEffect(() => {
    fetchPurgeOperations();
    fetchInactivityPolicies();
  }, []);

  const fetchPurgeOperations = async () => {
    try {
      const response = await fetch('/api/admin/purge?limit=50');
      if (!response.ok) throw new Error('Failed to fetch purge operations');
      const data = await response.json();
      setPurgeOperations(data.operations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purge operations');
    } finally {
      setLoading(false);
    }
  };

  const fetchInactivityPolicies = async () => {
    try {
      const response = await fetch('/api/admin/inactivity?limit=50');
      if (!response.ok) throw new Error('Failed to fetch inactivity policies');
      const data = await response.json();
      setInactivityPolicies(data.policies || []);
    } catch (err) {
      console.error('Failed to load inactivity policies:', err);
    }
  };

  const handleCreatePurgeOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...purgeForm,
          scheduledFor: purgeForm.scheduledFor ? new Date(purgeForm.scheduledFor).toISOString() : undefined,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create purge operation');
      
      setShowPurgeForm(false);
      setPurgeForm({
        teamId: '',
        operationType: 'customer_data',
        retentionDays: 365,
        reason: '',
        scheduledFor: '',
      });
      await fetchPurgeOperations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purge operation');
    }
  };

  const handleCreateInactivityPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/inactivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: policyForm.teamId,
          name: policyForm.name,  
          description: policyForm.description,
          thresholdDays: policyForm.thresholdDays,
          actions: {
            warnings: policyForm.warningDays,
            suspend: policyForm.suspendEnabled,
            purge: policyForm.purgeEnabled,
          },
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create inactivity policy');
      
      setShowPolicyForm(false);
      setPolicyForm({
        teamId: '',
        name: '',
        description: '',
        thresholdDays: 90,
        warningDays: [30, 60],
        suspendEnabled: false,
        purgeEnabled: false,
      });
      await fetchInactivityPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inactivity policy');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'executing': return 'text-blue-400';
      case 'export_ready': return 'text-yellow-400'; 
      case 'scheduled': return 'text-orange-400';
      case 'requested': return 'text-purple-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getOperationTypeIcon = (type: string) => {
    switch (type) {
      case 'customer_data': return <Users className="w-4 h-4" />;
      case 'transaction_history': return <Database className="w-4 h-4" />;
      case 'full_account': return <FileX className="w-4 h-4" />;
      case 'inactive_accounts': return <Clock className="w-4 h-4" />;
      default: return <Trash2 className="w-4 h-4" />;
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
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: Shield },
          { key: 'purge', label: 'Data Purge', icon: Trash2 },
          { key: 'inactivity', label: 'Inactivity Policies', icon: Clock },
          { key: 'monitoring', label: 'System Monitoring', icon: Activity },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedView(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              selectedView === key 
                ? 'bg-red-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="urban-card bg-red-900 border-red-700">
          <div className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-100 mt-2 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dashboard Tab */}
      {selectedView === 'dashboard' && (
        <>
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="urban-card">
              <div className="flex items-center gap-3 mb-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Purge Operations</h3>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {purgeOperations.length}
              </p>
              <p className="text-sm text-gray-400">
                {purgeOperations.filter(op => op.status === 'executing').length} active
              </p>
            </div>

            <div className="urban-card">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Inactivity Policies</h3>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {inactivityPolicies.length}
              </p>
              <p className="text-sm text-gray-400">
                {inactivityPolicies.filter(p => p.isActive).length} active
              </p>
            </div>

            <div className="urban-card">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">System Health</h3>
              </div>
              <p className="text-2xl font-bold text-green-400">Good</p>
              <p className="text-sm text-gray-400">All systems operational</p>
            </div>

            <div className="urban-card">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Alerts</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-400">0</p>
              <p className="text-sm text-gray-400">No active alerts</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="urban-card">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[...purgeOperations, ...inactivityPolicies.map(p => ({ ...p, type: 'policy' }))]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((item: any, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  {item.type === 'policy' ? (
                    <Clock className="w-5 h-5 text-orange-400" />
                  ) : (
                    getOperationTypeIcon(item.operationType)
                  )}
                  <div className="flex-1">
                    <p className="text-white">
                      {item.type === 'policy' 
                        ? `Inactivity policy "${item.name}" ${item.isActive ? 'activated' : 'created'}`
                        : `Purge operation for ${item.operationType.replace('_', ' ')} ${item.status}`
                      }
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!item.type && (
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Data Purge Tab */}
      {selectedView === 'purge' && (
        <>
          <div className="urban-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Data Purge Operations</h3>
              <button
                onClick={() => setShowPurgeForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Purge Operation
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-2 text-gray-300">Type</th>
                    <th className="pb-2 text-gray-300">Status</th>
                    <th className="pb-2 text-gray-300">Team</th>
                    <th className="pb-2 text-gray-300">Retention</th>
                    <th className="pb-2 text-gray-300">Scheduled</th>
                    <th className="pb-2 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purgeOperations.map((operation) => (
                    <tr key={operation.id} className="border-b border-gray-800">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {getOperationTypeIcon(operation.operationType)}
                          <span className="text-white">
                            {operation.operationType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className={`py-3 font-medium ${getStatusColor(operation.status)}`}>
                        {operation.status.toUpperCase()}
                      </td>
                      <td className="py-3 text-gray-300">{operation.teamId.slice(0, 8)}...</td>
                      <td className="py-3 text-gray-300">
                        {operation.retentionDays ? `${operation.retentionDays} days` : 'N/A'}
                      </td>
                      <td className="py-3 text-gray-300">
                        {operation.scheduledFor 
                          ? new Date(operation.scheduledFor).toLocaleDateString()
                          : 'Immediate'
                        }
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {operation.status === 'scheduled' && (
                            <button className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-xs">
                              <Play className="w-3 h-3" />
                            </button>
                          )}
                          {operation.status === 'executing' && (
                            <button className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-xs">
                              <Pause className="w-3 h-3" />
                            </button>
                          )}
                          <button className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded text-xs">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {purgeOperations.length === 0 && (
              <div className="text-center py-12">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No purge operations found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Inactivity Policies Tab */}
      {selectedView === 'inactivity' && (
        <>
          <div className="urban-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Inactivity Policies</h3>
              <button
                onClick={() => setShowPolicyForm(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Policy
              </button>
            </div>

            <div className="grid gap-4">
              {inactivityPolicies.map((policy) => (
                <div key={policy.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-white font-semibold">{policy.name}</h4>
                      {policy.description && (
                        <p className="text-gray-400 text-sm mt-1">{policy.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        policy.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button className="text-gray-400 hover:text-white">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Threshold</p>
                      <p className="text-white font-medium">{policy.thresholdDays} days</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Warnings</p>
                      <p className="text-white font-medium">
                        {policy.actions.warnings.join(', ')} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Actions</p>
                      <div className="flex gap-1">
                        {policy.actions.suspend && (
                          <span className="bg-yellow-600 text-white px-1 py-0.5 rounded text-xs">Suspend</span>
                        )}
                        {policy.actions.purge && (
                          <span className="bg-red-600 text-white px-1 py-0.5 rounded text-xs">Purge</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400">Last Run</p>
                      <p className="text-white font-medium">
                        {policy.lastRunAt 
                          ? new Date(policy.lastRunAt).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {inactivityPolicies.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No inactivity policies configured</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* System Monitoring Tab */}
      {selectedView === 'monitoring' && (
        <div className="urban-card">
          <h3 className="text-lg font-semibold text-white mb-6">System Monitoring</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Database Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Connection Pool</span>
                  <span className="text-green-400">Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Query Performance</span>
                  <span className="text-green-400">Good</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Storage Usage</span>
                  <span className="text-yellow-400">75%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Background Jobs</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Credit Reminders</span>
                  <span className="text-green-400">Running</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inactivity Scan</span>
                  <span className="text-green-400">Running</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">KB Link Check</span>
                  <span className="text-blue-400">Scheduled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purge Operation Form Modal */}
      {showPurgeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">New Purge Operation</h3>
            <form onSubmit={handleCreatePurgeOperation} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Team ID</label>
                <input
                  type="text"
                  required
                  value={purgeForm.teamId}
                  onChange={(e) => setPurgeForm(prev => ({ ...prev, teamId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter team ID"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Operation Type</label>
                <select
                  value={purgeForm.operationType}
                  onChange={(e) => setPurgeForm(prev => ({ 
                    ...prev, 
                    operationType: e.target.value as any 
                  }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="customer_data">Customer Data</option>
                  <option value="transaction_history">Transaction History</option>
                  <option value="full_account">Full Account</option>
                  <option value="inactive_accounts">Inactive Accounts</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Retention Days</label>
                <input
                  type="number"
                  value={purgeForm.retentionDays}
                  onChange={(e) => setPurgeForm(prev => ({ 
                    ...prev, 
                    retentionDays: parseInt(e.target.value) 
                  }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="3650"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Reason</label>
                <textarea
                  value={purgeForm.reason}
                  onChange={(e) => setPurgeForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Reason for purge operation"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Schedule For (Optional)</label>
                <input
                  type="datetime-local"
                  value={purgeForm.scheduledFor}
                  onChange={(e) => setPurgeForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md"
                >
                  Create Operation
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurgeForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inactivity Policy Form Modal */}
      {showPolicyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">New Inactivity Policy</h3>
            <form onSubmit={handleCreateInactivityPolicy} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Team ID</label>
                <input
                  type="text"
                  required
                  value={policyForm.teamId}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, teamId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter team ID"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Policy Name</label>
                <input
                  type="text"
                  required
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter policy name"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Policy description"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Inactivity Threshold (Days)</label>
                <input
                  type="number"
                  value={policyForm.thresholdDays}
                  onChange={(e) => setPolicyForm(prev => ({ 
                    ...prev, 
                    thresholdDays: parseInt(e.target.value) 
                  }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="3650"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Warning Days (comma-separated)</label>
                <input
                  type="text"
                  value={policyForm.warningDays.join(', ')}
                  onChange={(e) => setPolicyForm(prev => ({ 
                    ...prev, 
                    warningDays: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
                  }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="30, 60, 90"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="suspendEnabled"
                    checked={policyForm.suspendEnabled}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, suspendEnabled: e.target.checked }))}
                    className="rounded bg-gray-800 border-gray-600"
                  />
                  <label htmlFor="suspendEnabled" className="text-gray-300">Enable account suspension</label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="purgeEnabled"
                    checked={policyForm.purgeEnabled}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, purgeEnabled: e.target.checked }))}
                    className="rounded bg-gray-800 border-gray-600"
                  />
                  <label htmlFor="purgeEnabled" className="text-gray-300">Enable account purge</label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-md"
                >
                  Create Policy
                </button>
                <button
                  type="button"
                  onClick={() => setShowPolicyForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-md"
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