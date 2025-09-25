'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserAlias {
  id: number;
  alias: string;
  aliasId: string;
  active: boolean;
  note?: string;
  deliveryStatus: string;
  bounceCount: number;
  createdAt: string;
}

interface UserProfile {
  email: string;
  aliases: UserAlias[];
}

/**
 * Renders the account settings page for the user.
 *
 * This component manages the user's profile settings, including loading the profile data, handling alias management, and displaying relevant alerts for errors and success messages. It utilizes hooks to manage loading states and side effects, and it fetches user data from the API. The component also provides functionality to disable aliases and change the email address, ensuring that the user can manage their account effectively.
 *
 * @returns {JSX.Element} The rendered account settings page.
 */
export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  /**
   * Loads the user profile from the API.
   *
   * This function sets the loading state to true, fetches the user profile from the '/api/user/profile' endpoint,
   * and handles the response. If the response is not ok, it throws an error. The profile data is then parsed
   * and set using the setProfile function. In case of an error, it sets an error message. Finally, it resets
   * the loading state to false.
   */
  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Disables an alias by sending a request to the server.
   *
   * This function sets the loading state, clears any previous error or success messages,
   * and attempts to disable the alias by making a POST request to the server.
   * If the request is successful, it updates the success message and reloads the profile
   * to reflect the changes. In case of an error, it captures the error message and sets it
   * in the error state. Finally, it resets the loading state.
   *
   * @param {string} aliasId - The ID of the alias to be disabled.
   * @param {string} alias - The name of the alias to be disabled.
   */
  const disableAlias = async (aliasId: string, alias: string) => {
    setActionLoading(`disable-${aliasId}`);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/alias/disable', {
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
      await loadProfile(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable alias');
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

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load account settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isAliasEmail = profile.aliases.some(alias => alias.alias === profile.email && alias.active);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and privacy settings
        </p>
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

      {/* Current Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Login Email
          </CardTitle>
          <CardDescription>
            Your current login email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {profile.email}
            </code>
            {isAliasEmail && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Alias
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This is the email address you use to sign in to your account.
          </p>
        </CardContent>
      </Card>

      {/* Privacy Aliases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Aliases
          </CardTitle>
          <CardDescription>
            Manage your SimpleLogin privacy aliases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.aliases.length === 0 ? (
            <div className="text-center py-6">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No privacy aliases found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aliases created during signup will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.aliases.map((alias) => (
                <div
                  key={alias.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{alias.alias}</code>
                      <Badge
                        variant={alias.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {alias.active ? "Active" : "Disabled"}
                      </Badge>
                      {alias.deliveryStatus && alias.deliveryStatus !== "unknown" && (
                        <Badge
                          variant={
                            alias.deliveryStatus === "ok"
                              ? "default"
                              : alias.deliveryStatus === "warning"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {alias.deliveryStatus}
                        </Badge>
                      )}
                    </div>
                    {alias.note && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {alias.note}
                      </p>
                    )}
                    {alias.bounceCount > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {alias.bounceCount} bounce{alias.bounceCount !== 1 ? 's' : ''}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {new Date(alias.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {alias.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disableAlias(alias.aliasId, alias.alias)}
                        disabled={actionLoading === `disable-${alias.aliasId}`}
                      >
                        {actionLoading === `disable-${alias.aliasId}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Disable
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Legal Notice */}
          <Alert className="mt-4">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> Using a privacy alias is optional. DeelRxCRM does not guarantee 
              anonymity or deliverability through third-party aliasing. You are responsible for maintaining 
              access to your alias and complying with applicable laws.
            </AlertDescription>
          </Alert>
          
          {/* Disable Warning */}
          {isAliasEmail && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Warning:</strong> Your login email is currently an alias. Disabling this alias 
                will not automatically change your login email. You'll need to update your login email 
                separately if you disable the alias you use to sign in.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle>Change Email Address</CardTitle>
          <CardDescription>
            Update your login email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            To change your login email, you'll need to verify the new address.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/settings/change-email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Change Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}