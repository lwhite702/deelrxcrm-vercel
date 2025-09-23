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

export function StatsigClientProvider({ children }: StatsigClientProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  
  useEffect(() => {
    // Get user from session cookie
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