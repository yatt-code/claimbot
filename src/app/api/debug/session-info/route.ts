import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.userId) {
      return NextResponse.json({
        success: false,
        message: 'No session found'
      });
    }

    // Log the full session structure for debugging
    console.log('🔍 Full session object:', JSON.stringify(session, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Session info retrieved',
      session: {
        userId: session.userId,
        sessionClaims: session.sessionClaims,
        // Include any other properties that might contain roles
        fullSession: session
      }
    });
  } catch (error) {
    console.error('❌ Error getting session info:', error);
    return NextResponse.json({
      success: false,
      message: 'Error getting session info',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}