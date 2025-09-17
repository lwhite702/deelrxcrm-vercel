"use client";

import React, { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";

export default function DashboardMount() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    let mounted = true;
    Promise.all([
      import("../../DeelrzCRM/client/src/index.css").catch(() => null),
      import("../../DeelrzCRM/client/src/pages/dashboard").then(
        (m) => m.default
      ),
    ])
      .then(([_, C]) => mounted && setComp(() => C))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <MainLayout>{Comp ? <Comp /> : <div>Loading dashboard...</div>}</MainLayout>
  );
}
