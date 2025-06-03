import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { withDB } from '@/lib/server/db';
import User, { UserRole } from '@/models/User';
import { syncUserRolesToClerk } from '@/lib/clerk';


/**
 * PATCH /api/admin/users/[userId]/roles
 * Updates the roles for a specific user
 * Requires superadmin role
 */
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  return withDB(async () => {
    try {
      const { userId: targetUserId } = params;
      const { userId: currentUserId } = await auth();
      
      if (!currentUserId) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      
      // Get current user to check permissions
      const currentUser = await User.findOne({ clerkId: currentUserId });
      if (!currentUser || !currentUser.roles?.includes('superadmin')) {
        return new NextResponse('Forbidden', { status: 403 });
      }

      // Get the target user
      const targetUser = await User.findOne({ clerkId: targetUserId });
      if (!targetUser) {
        return new NextResponse('User not found', { status: 404 });
      }

      // Update roles
      const { roles } = await request.json();
      if (!Array.isArray(roles)) {
        return new NextResponse('Invalid roles', { status: 400 });
      }

      // Validate roles
      const validRoles: UserRole[] = ['staff', 'manager', 'finance', 'admin', 'superadmin'];
      if (!roles.every((role: string) => validRoles.includes(role as UserRole))) {
        return new NextResponse('Invalid role specified', { status: 400 });
      }

      // Update user roles
      targetUser.roles = roles as UserRole[];
      await targetUser.save();

      // Sync roles to Clerk
      await syncUserRolesToClerk(targetUserId);

      return NextResponse.json({ 
        success: true, 
        user: {
          id: targetUser._id,
          clerkId: targetUser.clerkId,
          email: targetUser.email,
          roles: targetUser.roles,
          name: targetUser.name
        } 
      });
    } catch (error) {
      console.error('Error updating user roles:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  });
}

/**
 * GET /api/admin/users/[userId]/roles
 * Gets the roles for a specific user
 * Requires admin or superadmin role
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  return withDB(async () => {
    try {
      const { userId } = params;
      const { userId: currentUserId } = await auth();
      
      if (!currentUserId) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      
      // Get current user to check permissions
      const currentUser = await User.findOne({ clerkId: currentUserId });
      if (!currentUser || !currentUser.roles?.some((r: string) => 
        ['admin', 'superadmin'].includes(r as string)
      )) {
        return new NextResponse('Forbidden', { status: 403 });
      }

      // Get the target user
      const targetUser = await User.findOne({ clerkId: userId });
      if (!targetUser) {
        return new NextResponse('User not found', { status: 404 });
      }

      return NextResponse.json({ 
        roles: targetUser.roles || [],
        userId: targetUser._id,
        email: targetUser.email
      });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  });
}
