'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, Search, Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface AliasRecord {
  id: number;
  userId: number;
  userEmail: string;
  alias: string;
  aliasId: string;
  active: boolean;
  note?: string;
  deliveryStatus: string;
  bounceCount: number;
  createdAt: string;
  deactivatedAt?: string;
}

interface AliasData {
  aliases: AliasRecord[];
  totalCount: number;
}

/**
 * Admin page for managing user privacy aliases.
 *
 * This component handles the loading, displaying, and management of user privacy aliases. It fetches alias data from the server, allows searching through aliases, and provides functionality to disable aliases and export the alias data to a CSV file. The component maintains loading states and error/success messages to inform the user of the current operation status.
 *
 * @returns {JSX.Element} The rendered AdminAliasesPage component.
 */
export default function AdminAliasesPage() {
  const [data, setData] = useState<AliasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAliases, setFilteredAliases] = useState<AliasRecord[]>([]);

  useEffect(() => {
    loadAliases();
  }, []);

  useEffect(() => {
    if (data) {
      const filtered = data.aliases.filter(alias =>
        alias.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alias.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alias.userId.toString().includes(searchTerm) ||
        (alias.note && alias.note.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAliases(filtered);
    }
  }, [data, searchTerm]);

  /**
   * Loads aliases from the server and updates the application state.
   *
   * This function sets the loading state to true, fetches alias data from the '/api/admin/aliases' endpoint,
   * and handles the response. If the response is not ok, it throws an error. The fetched data is then parsed
   * and stored using setData. In case of an error during the fetch, it sets an error message. Finally,
   * it resets the loading state to false.
   */
  const loadAliases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/aliases');
      if (!response.ok) {
        throw new Error('Failed to load aliases');
      }
      const aliasData = await response.json();
      setData(aliasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load aliases');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disables a specified alias by sending a request to the server.
   *
   * This function sets the loading state, clears any previous error or success messages,
   * and attempts to disable the alias by making a POST request to the server.
   * If the request is successful, it updates the success message and reloads the aliases.
   * In case of an error, it captures the error message and sets it accordingly,
   * ensuring the loading state is reset at the end of the process.
   *
   * @param {string} aliasId - The ID of the alias to be disabled.
   * @param {string} alias - The name of the alias to be displayed in success messages.
   */
  const disableAlias = async (aliasId: string, alias: string) => {
    setActionLoading(`disable-${aliasId}`);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/admin/aliases/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aliasId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to disable alias' }));
        throw new Error(errorData.error);
      }
      
      setSuccess(`Alias ${alias} has been disabled`);
      await loadAliases(); // Reload data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable alias');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Exports data to a CSV file.
   *
   * This function initiates the export process by setting the action loading state. It fetches data from the '/api/admin/aliases/export' endpoint and checks for a successful response. If successful, it creates a downloadable CSV file and triggers the download. In case of an error, it sets an error message. Finally, it resets the action loading state.
   */
  const exportToCsv = async () => {
    setActionLoading('export');
    try {
      const response = await fetch('/api/admin/aliases/export');
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aliases-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Export completed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alias Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage user privacy aliases
          </p>
        </div>
        <Button
          onClick={exportToCsv}
          disabled={actionLoading === 'export' || !data}
          variant="outline"
        >
          {actionLoading === 'export' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Aliases
            {data && (
              <Badge variant="secondary" className="ml-2">
                {data.totalCount} total
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            All user privacy aliases in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search aliases
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by alias, user email, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {data && data.aliases.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alias</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Bounces</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAliases.map((alias) => (
                    <TableRow key={alias.id}>
                      <TableCell>
                        <code className="text-sm">{alias.alias}</code>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{alias.userEmail}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {alias.userId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={alias.active ? "default" : "secondary"}
                        >
                          {alias.active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alias.deliveryStatus && alias.deliveryStatus !== "unknown" ? (
                          <Badge
                            variant={
                              alias.deliveryStatus === "ok"
                                ? "default"
                                : alias.deliveryStatus === "warning"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {alias.deliveryStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alias.bounceCount > 0 ? (
                          <span className="text-red-600 font-medium">
                            {alias.bounceCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {new Date(alias.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alias.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alias.note ? (
                          <span className="text-sm">{alias.note}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {alias.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disableAlias(alias.aliasId, alias.alias)}
                            disabled={actionLoading === `disable-${alias.aliasId}`}
                          >
                            {actionLoading === `disable-${alias.aliasId}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            <span className="sr-only">Disable alias</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredAliases.length === 0 && searchTerm && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No aliases found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No privacy aliases found</p>
              <p className="text-sm text-muted-foreground mt-1">
                User aliases will appear here when they sign up with privacy aliases
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Privacy Notice:</strong> This page contains user privacy aliases. 
          Handle this information with care and in accordance with your privacy policy. 
          Alias management should be done only when necessary for system administration 
          or user support purposes.
        </AlertDescription>
      </Alert>
    </div>
  );
}