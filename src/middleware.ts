import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import { canAccessRoute } from '@/lib/rbac';
import type { UserRole } from '@/models/User';

// Type definition for Clerk session claims with our custom metadata
interface ClerkSessionClaims {
  publicMetadata?: {
    roles?: UserRole[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Helper function to safely extract roles from session
function extractRolesFromSession(sessionClaims: unknown): UserRole[] {
  const claims = sessionClaims as ClerkSessionClaims;
  return claims?.publicMetadata?.roles || [];
}

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/login(.*)',
  '/auth/register(.*)',
  '/access-denied',
  '/api/auth(.*)',
  '/_next(.*)',
  '/api/trpc(.*)',
  '/api/public(.*)',
  '/favicon.ico',
  '/api/health(.*)'
]);

// Define routes that require authentication but no specific roles
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/submit(.*)',
  '/my-submissions(.*)',
  '/profile(.*)',
  '/api/claims(.*)',
  '/api/overtime(.*)',
  '/api/files(.*)',
]);

/**
 * Enhanced middleware with improved RBAC checking
 */
export default clerkMiddleware(async (auth, req) => {
  const { pathname } = new URL(req.url);
  
  // Skip middleware for public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Get the session
  const session = await auth();
  
  // If there's no session for protected routes, redirect to sign-in
  if (!session || !session.userId) {
    const signInUrl = new URL('/auth/login', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // For basic protected routes, just verify authentication
  if (isProtectedRoute(req)) {
    return NextResponse.next();
  }
  
  // For role-protected routes, check permissions
  const isApiRoute = pathname.startsWith('/api/');
  
  try {
    // Get user roles from session
    const userRoles = extractRolesFromSession(session.sessionClaims);
    
    // Check if user has access to the requested path
    const hasAccess = canAccessRoute(userRoles, pathname);
    
    if (!hasAccess) {
      console.warn(`Access denied for user ${session.userId} to path ${pathname}. Roles: ${userRoles.join(', ')}`);
      
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: 'Insufficient permissions to access this resource' 
          }), 
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // For non-API routes, redirect to access denied page
      const accessDeniedUrl = new URL('/access-denied', req.url);
      return NextResponse.redirect(accessDeniedUrl);
    }
    
    // Add user context to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('X-User-Id', session.userId);
    response.headers.set('X-User-Roles', JSON.stringify(userRoles));
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while processing your request' 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For non-API routes, redirect to access denied page (will show appropriate error)
    const errorUrl = new URL('/access-denied', req.url);
    return NextResponse.redirect(errorUrl);
  }
});

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Skip all internal paths (_next/static, _next/image, favicon.ico)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Always run for API routes
    '/api/(.*)',
  ],
};