import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { withDB } from '@/lib/server/db';
import User from '@/models/User';

/**
 * API endpoint to sync user roles from database to Clerk's public metadata
 * This is useful when roles are updated in the database but not reflected in Clerk
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current user's session
    const session = await auth();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the target user ID from request body (optional, defaults to current user)
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.userId || session.userId;

    return await withDB(async () => {
      // Find the user in the database
      const user = await User.findOne({ clerkId: targetUserId });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }

      // Get Clerk client instance
      const client = await clerkClient();
      
      // Update Clerk's public metadata with the latest roles
      await client.users.updateUser(targetUserId, {
        publicMetadata: {
          roles: user.roles || []
        }
      });

      return NextResponse.json({
        success: true,
        message: `Successfully synced roles for user ${user.email}`,
        userId: targetUserId,
        roles: user.roles || []
      });
    });
  } catch (error) {
    console.error('Error syncing roles:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}