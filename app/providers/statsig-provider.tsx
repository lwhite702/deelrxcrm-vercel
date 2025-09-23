"use client";

import { StatsigProvider, StatsigUser } from "statsig-react";
import { ReactNode, useEffect, useState } from "react";

interface StatsigClientProviderProps {
  children: ReactNode;
}

interface SessionUser {
  id: number;
  email: string;
  name?: string;
  role: string;
}

/**
 * Provides the Statsig client context to its children components.
 *
 * This function retrieves the session user from an API endpoint and constructs a StatsigUser object.
 * If the Statsig client key is not configured, it warns the user and renders the children without Statsig context.
 * The StatsigProvider is then initialized with the user information and environment settings.
 *
 * @param children - The child components to be wrapped by the StatsigProvider.
 * @returns A JSX element that wraps the children with the StatsigProvider.
 */
export function StatsigClientProvider({ children }: StatsigClientProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  
  useEffect(() => {
    // Get user from session cookie
    /**
     * Retrieves the current session user from the server.
     *
     * This function makes an asynchronous request to the '/api/auth/me' endpoint to fetch user data.
     * If the response is successful, it parses the JSON and updates the user state using the setUser function.
     * In case of an error during the fetch operation, it logs the error to the console.
     */
    async function getSessionUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Failed to get session user:', error);
      }
    }
    
    getSessionUser();
  }, []);
  
  if (!process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY) {
    console.warn("NEXT_PUBLIC_STATSIG_CLIENT_KEY not configured, feature gates disabled");
    return <>{children}</>;
  }

  const statsigUser: StatsigUser = {
    userID: user?.id.toString() || "anonymous",
    email: user?.email,
    custom: {
      user_id: user?.id,
      role: user?.role,
      name: user?.name,
    },
  };

  return (
    <StatsigProvider
      sdkKey={process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY}
      user={statsigUser}
      waitForInitialization={false}
      options={{
        environment: { tier: process.env.NODE_ENV === "production" ? "production" : "development" },
      }}
    >
      {children}
    </StatsigProvider>
  );
}