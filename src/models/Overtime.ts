import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOvertime extends Document {
  userId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  hoursWorked?: number;
  rateMultiplier?: number;
  hourlyRate?: number;
  totalPayout?: number;
  attachments: Types.ObjectId[];
  status: 'submitted' | 'approved' | 'rejected' | 'paid';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OvertimeSchema: Schema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  reason: { type: String, required: true },
  hoursWorked: { type: Number },
  rateMultiplier: { type: Number },
  hourlyRate: { type: Number },
  totalPayout: { type: Number },
  attachments: [{ type: Types.ObjectId, ref: 'File' }],
  status: { type: String, required: true, enum: ['submitted', 'approved', 'rejected', 'paid'], default: 'submitted' },
  approvedBy: { type: Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  remarks: { type: String },
}, { timestamps: true });

const Overtime = mongoose.models.Overtime || mongoose.model<IOvertime>('Overtime', OvertimeSchema);

export default Overtime;