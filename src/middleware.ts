import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that are only for non-authenticated users
const authRoutes = ['/login', '/register'];

/**
 * Next.js Middleware — Route Protection
 *
 * Checks for auth tokens in localStorage and redirects accordingly.
 * Note: This provides basic client-side routing protection.
 * Server-side API calls rely on the backend JWT validation.
 */
/**
 * Next.js Middleware
 *
 * Auth protection is handled client-side via Redux state (localStorage tokens)
 * and the dashboard layout's auth guard. The backend is on a different domain
 * (localhost:5000), so httpOnly cookies set by the backend are not readable
 * by this middleware running on the frontend domain (localhost:3000).
 *
 * This middleware passes through all requests. Client-side auth guards
 * (in the dashboard layout, login page, register page, and home page)
 * handle all redirects based on Redux auth state.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
