import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import SavedTripTemplate from '@/models/SavedTripTemplate';
import { connectDB } from '@/lib/server/db';
import { auditLog } from '@/lib/logger';

// DELETE /api/saved-trip-templates/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Get authentication info with debug logging
    const authResult = await auth();
    const { userId } = authResult;
    const { id } = params;

    console.log('Auth result in DELETE /api/saved-trip-templates/[id]:', { 
      userId,
      templateId: id,
      sessionId: authResult.sessionId 
    });

    if (!userId) {
      console.error('No user ID found in session');
      return NextResponse.json({ 
        message: 'Unauthorized - No user session found' 
      }, { status: 401 });
    }

    if (!id) {
      console.error('No template ID provided');
      return NextResponse.json({ 
        message: 'Template ID is required' 
      }, { status: 400 });
    }

    console.log(`Looking up template ${id} for user ${userId}`);
    const template = await SavedTripTemplate.findOne({ _id: id, userId });

    if (!template) {
      console.error(`Template ${id} not found for user ${userId}`);
      return NextResponse.json({ 
        message: 'Template not found or unauthorized' 
      }, { status: 404 });
    }

    console.log(`Deleting template: ${template.label} (${id})`);
    await SavedTripTemplate.deleteOne({ _id: id, userId });

    await auditLog({
      userId,
      action: 'DELETE',
      entity: 'SavedTripTemplate',
      entityId: id,
      details: `Deleted saved trip template: ${template.label}`,
    });

    console.log(`Successfully deleted template ${id}`);
    return NextResponse.json({ 
      message: 'Template deleted successfully' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in DELETE /api/saved-trip-templates/[id]:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params,
      userId: (error as any)?.userId,
    });
    
    return NextResponse.json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        undefined
    }, { status: 500 });
  }
}