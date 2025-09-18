<<<<<<< HEAD
import React from "react";
import dynamic from "next/dynamic";

const SuperAdminClient = dynamic(() => import("./SuperAdminClient"), { ssr: false });

export default function SuperAdminPage() { return <SuperAdminClient />; }
=======
"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const SuperAdminClient = dynamic(() => import("./SuperAdminClient"), {
  ssr: false,
});

export default function SuperAdminPage() {
  const { user } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!user) return; // wait for user load
    const allow = (process.env.NEXT_PUBLIC_SUPER_ADMIN_USER_IDS || "")
      .split(/[,\s]+/)
      .filter(Boolean);
    if (allow.includes(user.id)) {
      setAuthorized(true);
    } else {
      router.replace("/404");
    }
  }, [user, router]);

  return (
    <>
      <SignedOut>
        <div className="p-4">Redirecting to login...</div>
      </SignedOut>
      <SignedIn>{authorized ? <SuperAdminClient /> : null}</SignedIn>
    </>
  );
}
>>>>>>> feat/next-final-migration-cleanup
