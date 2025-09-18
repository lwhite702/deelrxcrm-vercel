// Temporary no-op middleware to bypass Edge runtime Clerk import issues during migration.
// Clerk protection should be enforced at the API layer or re-enabled here once Edge-compatible.
import { NextResponse } from "next/server";

export default function noopMiddleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
