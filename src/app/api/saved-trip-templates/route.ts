import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import SavedTripTemplate from '@/models/SavedTripTemplate';
import { connectDB } from '@/lib/server/db';
import { auditLog } from '@/lib/logger';

// GET /api/saved-trip-templates
export async function GET(req: NextRequest) {
  try {
    // Connect to database first
    await connectDB();
    
    // Get authentication info
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({
        message: 'Unauthorized - No user session found'
      }, { status: 401 });
    }

    const templates = await SavedTripTemplate.find({ userId }).sort({ createdAt: -1 });

    // Convert MongoDB documents to plain objects and ensure _id is a string
    const response = templates.map(template => ({
      ...template.toObject(),
      _id: template._id.toString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/saved-trip-templates:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        undefined
    }, { status: 500 });
  }
}

// POST /api/saved-trip-templates
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const authResult = await auth();
    const { userId } = authResult;
    
    console.log('Auth result in POST /api/saved-trip-templates:', { 
      userId,
      sessionId: authResult.sessionId,
      orgId: authResult.orgId 
    });

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, roundTrip, label } = await req.json();

    if (!origin || !destination || typeof roundTrip !== 'boolean' || !label) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newTemplate = await SavedTripTemplate.create({
      userId,
      origin,
      destination,
      roundTrip,
      label,
    });

    await auditLog({
      userId,
      action: 'CREATE',
      entity: 'SavedTripTemplate',
      entityId: newTemplate._id,
      details: `Created saved trip template: ${label}`,
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating saved trip template:', error);
    return NextResponse.json({ message: 'Error creating saved trip template' }, { status: 500 });
  }
}