import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import SavedTripTemplate from '@/models/SavedTripTemplate';
import { connectDB } from '@/lib/server/db';
import { auditLog } from '@/lib/logger';

// GET /api/saved-trip-templates
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const templates = await SavedTripTemplate.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching saved trip templates:', error);
    return NextResponse.json({ message: 'Error fetching saved trip templates' }, { status: 500 });
  }
}

// POST /api/saved-trip-templates
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await auth();

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