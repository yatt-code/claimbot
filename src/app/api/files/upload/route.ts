import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import File from "@/models/File";
import User from "@/models/User"; // Needed to link file to user
import AuditLog from "@/models/AuditLog"; // Import AuditLog model
import path from 'path';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { Types } from 'mongoose'; // Import Types

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the upload directory (relative to the project root)
const uploadDir = path.join(process.cwd(), 'uploads');

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const linkedToCollection = formData.get('linkedToCollection') as string | null;
    const linkedToDocumentId = formData.get('linkedToDocumentId') as string | null;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    if (!linkedToCollection || !linkedToDocumentId) {
        return new NextResponse("Missing linkedToCollection or linkedToDocumentId", { status: 400 });
    }

    // Basic validation for linkedToCollection
    if (linkedToCollection !== 'claims' && linkedToCollection !== 'overtime') {
        return new NextResponse("Invalid linkedToCollection value", { status: 400 });
    }

    // Validate if linkedToDocumentId is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(linkedToDocumentId)) {
      return new NextResponse("Invalid linkedToDocumentId format", { status: 400 });
    }


    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename to prevent conflicts
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const fileExtension = path.extname(file.name);
    const filename = `${file.name.replace(fileExtension, '')}-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Ensure the upload directory exists
    await require('fs/promises').mkdir(uploadDir, { recursive: true });

    // Write the file to the upload directory
    await writeFile(filePath, buffer);

    // Save file metadata to the database
    const newFile = new File({
      filename: file.name,
      mimetype: file.type,
      path: `/uploads/${filename}`, // Store path relative to project root or a public serving path
      uploadedBy: authenticatedUser._id,
      linkedTo: {
        collection: linkedToCollection,
        documentId: new Types.ObjectId(linkedToDocumentId),
      },
    });

    await newFile.save();

    // Basic Audit Logging
    await AuditLog.create({
        userId: authenticatedUser._id,
        action: 'uploaded_file',
        target: { collection: 'files', documentId: newFile._id },
        details: `Uploaded file "${file.name}" linked to ${linkedToCollection} document ${linkedToDocumentId}`,
    });


    return NextResponse.json({ message: 'File uploaded successfully', file: newFile }, { status: 201 });

  } catch (error) {
    console.error("Error uploading file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}