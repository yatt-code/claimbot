import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFile extends Document {
  filename: string;
  mimetype?: string;
  path: string;
  uploadedBy: Types.ObjectId;
  linkedTo: {
    collection: 'claims' | 'overtime';
    documentId: Types.ObjectId;
  };
  uploadedAt: Date;
}

const FileSchema: Schema = new Schema({
  filename: { type: String, required: true },
  mimetype: { type: String },
  path: { type: String, required: true },
  uploadedBy: { type: Types.ObjectId, ref: 'User', required: true },
  linkedTo: {
    collection: { type: String, required: true, enum: ['claims', 'overtime'] },
    documentId: { type: Types.ObjectId, required: true },
  },
}, { timestamps: true }); // Timestamps will add createdAt and updatedAt

const File = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);

export default File;