import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import AdminTripTemplate from '@/models/AdminTripTemplate';
import { connectDB } from '@/lib/server/db';
import { auditLog } from '@/lib/logger';
import { hasRole } from '@/lib/rbac';
import { UserRole } from '@/models/User';

// GET /api/admin/trip-templates
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const templates = await AdminTripTemplate.find({}).sort({ createdAt: -1 });

    const response = templates.map(template => ({
      ...template.toObject(),
      _id: template._id.toString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/admin/trip-templates:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/trip-templates
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const authResult = await auth();
    const { userId, sessionClaims } = authResult;
    const userRoles = sessionClaims?.roles as UserRole[] || [];

    if (!userId || !hasRole(userRoles, 'admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, roundTrip, label } = await req.json();

    if (!origin || !destination || typeof roundTrip !== 'boolean' || !label) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newTemplate = await AdminTripTemplate.create({
      origin,
      destination,
      roundTrip,
      label,
    });

    await auditLog({
      userId,
      action: 'CREATE',
      entity: 'AdminTripTemplate',
      entityId: newTemplate._id,
      details: `Admin created trip template: ${label}`,
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating admin trip template:', error);
    return NextResponse.json({ message: 'Error creating admin trip template' }, { status: 500 });
  }
}