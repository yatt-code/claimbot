import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { withDB } from '@/lib/server/db';
import User from '@/models/User';

/**
 * Public API endpoint to sync user roles from database to Clerk's public metadata
 * This helps fix role sync issues
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user ID from request body
    const body = await request.json().catch(() => ({}));
    const clerkUserId = body.userId;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 }
      );
    }

    return await withDB(async () => {
      console.log(`🔍 Looking up user in database: ${clerkUserId}`);
      
      // Find the user in the database
      const user = await User.findOne({ clerkId: clerkUserId });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }

      console.log(`✅ Found user in database: ${user.email} with roles: ${user.roles?.join(', ') || 'None'}`);

      // Get Clerk client instance
      const client = await clerkClient();
      
      // Update Clerk's public metadata with the latest roles
      await client.users.updateUser(clerkUserId, {
        publicMetadata: {
          roles: user.roles || []
        }
      });

      console.log(`✅ Successfully synced roles to Clerk for ${user.email}`);

      return NextResponse.json({
        success: true,
        message: `Successfully synced roles for user ${user.email}`,
        userId: clerkUserId,
        email: user.email,
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