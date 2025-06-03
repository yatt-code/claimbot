import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import { canAccessRoute } from '@/lib/rbac';
import type { UserRole } from '@/models/User';

// Helper function to safely extract roles from Clerk user with retry logic
async function extractRolesFromUser(userId: string, retryCount = 0): Promise<UserRole[]> {
  const maxRetries = 2;
  
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const roles = user?.publicMetadata?.roles as UserRole[] | undefined;
    return roles || [];
  } catch (error: unknown) {
    console.error(`Error extracting roles from user (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
    
    // Check if it's a network error and we can retry
    const isNetworkError = error && typeof error === 'object' && (
      ('message' in error && typeof error.message === 'string' && error.message.includes('fetch failed')) ||
      ('errors' in error && Array.isArray(error.errors) && error.errors[0]?.code === 'unexpected_error')
    );
    
    if (retryCount < maxRetries && isNetworkError) {
      console.log(`Retrying role extraction for user ${userId}...`);
      // Wait briefly before retry
      await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
      return extractRolesFromUser(userId, retryCount + 1);
    }
    
    // If all retries failed, return empty array to allow access to basic routes
    console.warn(`Failed to get roles for user ${userId} after ${retryCount + 1} attempts. Allowing basic access.`);
    return [];
  }
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
  '/api/debug(.*)',
  '/favicon.ico',
  '/api/health(.*)'
]);

// Define routes that require authentication but no specific roles
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/submit(.*)',
  '/my-submissions(.*)',
  '/expense(.*)',
  '/overtime(.*)',
  '/profile(.*)',
  '/manager(.*)', // Add manager routes for redirect pages
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
    // Get user roles from Clerk user object with retry logic
    const userRoles = await extractRolesFromUser(session.userId);
    
    // If we couldn't get roles and this is a critical admin route, be more restrictive
    const isCriticalAdminRoute = pathname.includes('/admin') || pathname.includes('/api/users') || pathname.includes('/api/config');
    
    if (userRoles.length === 0 && isCriticalAdminRoute) {
      console.warn(`No roles found for user ${session.userId} accessing critical route ${pathname}. Denying access.`);
      
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Unable to verify permissions. Please try again or contact support.'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const accessDeniedUrl = new URL('/access-denied', req.url);
      accessDeniedUrl.searchParams.set('error', 'Unable to verify permissions');
      return NextResponse.redirect(accessDeniedUrl);
    }
    
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