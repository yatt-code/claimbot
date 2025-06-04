import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import SavedTripTemplate from '@/models/SavedTripTemplate';
import { connectDB } from '@/lib/server/db';
import { auditLog } from '@/lib/logger';

// DELETE /api/saved-trip-templates/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { userId } = await auth();
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: 'Template ID is required' }, { status: 400 });
    }

    const template = await SavedTripTemplate.findOne({ where: { id, userId } });

    if (!template) {
      return NextResponse.json({ message: 'Template not found or unauthorized' }, { status: 404 });
    }

    await template.destroy();

    await auditLog({
      userId,
      action: 'DELETE',
      entity: 'SavedTripTemplate',
      entityId: id,
      details: `Deleted saved trip template: ${template.label}`,
    });

    return NextResponse.json({ message: 'Template deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting saved trip template:', error);
    return NextResponse.json({ message: 'Error deleting saved trip template' }, { status: 500 });
  }
}