import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// Public paths that do NOT require authentication
const publicRoutes: RegExp[] = [
  /^\/$/, // root landing
  /^\/landing$/, // marketing landing
  /^\/api\/clerk\/webhooks/, // webhook endpoint
];

// Helper to test if path is public
function isPublicPath(pathname: string) {
  return publicRoutes.some((r) => r.test(pathname));
}

export default authMiddleware({
  publicRoutes: (req) => isPublicPath(req.nextUrl.pathname),
  afterAuth(auth, req) {
    // Allow public routes
    if (isPublicPath(req.nextUrl.pathname)) return NextResponse.next();

    // If not signed in redirect to login (preserve redirect url)
    if (!auth.userId) {
      const login = new URL("/login", req.url);
      login.searchParams.set(
        "redirect_url",
        req.nextUrl.pathname + req.nextUrl.search
      );
      return NextResponse.redirect(login);
    }

    // Super admin gate (optional short-circuit) — rely on page-level check too.
    if (req.nextUrl.pathname.startsWith("/super-admin")) {
      const allow = (process.env.NEXT_PUBLIC_SUPER_ADMIN_USER_IDS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!allow.includes(auth.userId)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    // Exclude _next/static, _next/image, assets, and favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
