// Temporary no-op middleware to bypass Edge runtime Clerk import issues during migration.
// Clerk protection should be enforced at the API layer or re-enabled here once Edge-compatible.
import { NextResponse } from "next/server";

// Clerk's authMiddleware is not available in current package version.
// Temporary pass-through; enforce auth in route handlers.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
  runtime: "nodejs",
};
