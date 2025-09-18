import React from "react";
export default function NotFound() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist.
      </p>
    </div>
  );
}
