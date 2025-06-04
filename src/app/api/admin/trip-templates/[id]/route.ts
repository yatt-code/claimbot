import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import AdminTripTemplate from '@/models/AdminTripTemplate';
import { connectDB } from '@/lib/server/db';
import { auditLog } from '@/lib/logger';
import { hasRole } from '@/lib/rbac';
import { UserRole } from '@/models/User';

// GET /api/admin/trip-templates/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const authResult = await auth();
    const { userId, sessionClaims } = authResult;
    const userRoles = sessionClaims?.roles as UserRole[] || [];

    if (!userId || !hasRole(userRoles, 'admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 });
    }

    const template = await AdminTripTemplate.findById(id);

    if (!template) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error in GET /api/admin/trip-templates/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/trip-templates/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const authResult = await auth();
    const { userId, sessionClaims } = authResult;
    const userRoles = sessionClaims?.roles as UserRole[] || [];

    if (!userId || !hasRole(userRoles, 'admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 });
    }

    const { origin, destination, roundTrip, label } = await req.json();

    if (!origin || !destination || typeof roundTrip !== 'boolean' || !label) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const updatedTemplate = await AdminTripTemplate.findByIdAndUpdate(
      id,
      { origin, destination, roundTrip, label },
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    await auditLog({
      userId,
      action: 'UPDATE',
      entity: 'AdminTripTemplate',
      entityId: updatedTemplate._id,
      details: `Admin updated trip template: ${label}`,
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating admin trip template:', error);
    return NextResponse.json({ message: 'Error updating admin trip template' }, { status: 500 });
  }
}

// DELETE /api/admin/trip-templates/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const authResult = await auth();
    const { userId, sessionClaims } = authResult;
    const userRoles = sessionClaims?.roles as UserRole[] || [];

    if (!userId || !hasRole(userRoles, 'admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 });
    }

    const deletedTemplate = await AdminTripTemplate.findByIdAndDelete(id);

    if (!deletedTemplate) {
      return NextResponse.json({ message: 'Template not found' }, { status: 404 });
    }

    await auditLog({
      userId,
      action: 'DELETE',
      entity: 'AdminTripTemplate',
      entityId: id,
      details: `Admin deleted trip template: ${deletedTemplate.label}`,
    });

    return NextResponse.json({ message: 'Template deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting admin trip template:', error);
    return NextResponse.json({ message: 'Error deleting admin trip template' }, { status: 500 });
  }
}