import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import File from "@/models/File";
import User from "@/models/User"; // Needed for authorization checks
import mongoose, { Types } from 'mongoose';
import path from 'path';
import { readFile } from 'fs/promises';
import mime from 'mime-types'; // To determine content type

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return new NextResponse("User not found in database", { status: 404 });
    }

    const { id } = params;

    if (!Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid file ID format", { status: 400 });
    }

    const fileMetadata = await File.findById(id);

    if (!fileMetadata) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Authorization check:
    // For simplicity, allow admins/finance to view any file.
    // Staff/Managers can only view files linked to claims/overtime they are involved with.
    // This requires fetching the linked claim/overtime and checking user's role/association.
    // Deferring complex authorization for later; for now, a basic check:
    // Allow if admin/finance/superadmin OR if the file is uploaded by the authenticated user.
    if (!authenticatedUser.hasAnyRole(['admin', 'finance', 'superadmin']) && fileMetadata.uploadedBy.toString() !== authenticatedUser._id.toString()) {
         // TODO: Implement more granular authorization based on linked claim/overtime
         return new NextResponse("Forbidden", { status: 403 });
    }


    const filePath = path.join(process.cwd(), fileMetadata.path);

    try {
        const fileContent = await readFile(filePath);
        const contentType = mime.lookup(filePath) || 'application/octet-stream';

        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileMetadata.filename}"`,
            },
        });

    } catch (fileReadError) {
        console.error("Error reading file from disk:", fileReadError);
        return new NextResponse("Error retrieving file content", { status: 500 });
    }


  } catch (error) {
    console.error("Error fetching file metadata:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}