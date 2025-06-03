import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * API endpoint to check what's in Clerk for a specific user ID
 * This helps debug user/role sync issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from query parameters
    const { searchParams } = new URL(request.url);
    const clerkUserId = searchParams.get('userId');

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 Looking up Clerk user: ${clerkUserId}`);
    
    // Get Clerk client instance
    const client = await clerkClient();
    
    // Get user from Clerk
    const clerkUser = await client.users.getUser(clerkUserId);
    
    const userInfo = {
      id: clerkUser.id,
      emails: clerkUser.emailAddresses.map(e => ({
        email: e.emailAddress,
        verified: e.verification?.status === 'verified'
      })),
      primaryEmail: clerkUser.primaryEmailAddress?.emailAddress || null,
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      username: clerkUser.username || null,
      createdAt: clerkUser.createdAt,
      lastSignInAt: clerkUser.lastSignInAt || null,
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata
    };

    console.log('✅ Found Clerk user:', userInfo);

    return NextResponse.json({
      success: true,
      message: `Successfully retrieved Clerk user ${clerkUserId}`,
      user: userInfo
    });
  } catch (error) {
    console.error('Error checking Clerk user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check Clerk user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}