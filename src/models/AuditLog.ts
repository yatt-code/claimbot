import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: string;
  target: {
    collection: string;
    documentId: Types.ObjectId;
  };
  details?: string;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  target: {
    collection: { type: String, required: true },
    documentId: { type: Types.ObjectId, required: true },
  },
  details: { type: String },
  timestamp: { type: Date, required: true, default: Date.now },
});

const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;