import { auth, clerkClient } from "@clerk/nextjs/server";
import { UserRole } from "@/models/User";
import User from "@/models/User";
import connectDB from "./mongodb";

/**
 * Sync user roles from database to Clerk's public metadata
 * Call this function after updating user roles in the database
 */
export async function syncUserRolesToClerk(userId: string) {
  try {
    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      throw new Error('User not found in database');
    }

    // Get Clerk client instance
    const client = await clerkClient();
    
    // Update Clerk's public metadata with the latest roles
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: user.roles || []
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error syncing user roles to Clerk:', error);
    return false;
  }
}

/**
 * Get the current user with roles from Clerk's session
 * Can be used in API routes or server components
 */
export async function getCurrentUser() {
  const authResult = await auth();
  const { userId } = authResult;
  
  if (!userId) {
    return null;
  }
  
  try {
    // Get Clerk client instance
    const client = await clerkClient();
    
    // Get user from Clerk
    const clerkUser = await client.users.getUser(userId);
    
    // Get roles from public metadata
    const roles = (clerkUser.publicMetadata.roles || []) as UserRole[];
    
    return {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      roles,
      isSuperadmin: roles.includes('superadmin'),
      hasRole: (role: UserRole) => roles.includes(role) || roles.includes('superadmin'),
      hasAnyRole: (requiredRoles: UserRole[]) =>
        requiredRoles.some(role => roles.includes(role)) || roles.includes('superadmin')
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
