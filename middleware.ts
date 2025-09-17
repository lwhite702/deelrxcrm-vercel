import { NextRequest, NextResponse } from "next/server";

// Dev-safety: allow skipping Clerk middleware when keys are not present
// or when SKIP_CLERK_MIDDLEWARE=1 is set in env. This makes local dev
// smoother when you don't want to provide real Clerk keys. Ensure this
// is NOT enabled in production.
const skip =
  Boolean(process.env.SKIP_CLERK_MIDDLEWARE) ||
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  !process.env.CLERK_SECRET_KEY;

let _defaultMiddleware: (
  req: NextRequest
) => NextResponse | Promise<NextResponse>;

if (skip) {
  // No-op middleware for local development
  _defaultMiddleware = function _devNoopMiddleware(_req: NextRequest) {
    return NextResponse.next();
  };
} else {
  // Lazy import so the server doesn't try to initialize Clerk when keys are missing
  const { clerkMiddleware } = require("@clerk/nextjs/server");
  _defaultMiddleware = clerkMiddleware();
}

export default _defaultMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
