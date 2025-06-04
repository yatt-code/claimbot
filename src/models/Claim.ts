import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IClaim extends Document {
  userId: Types.ObjectId;
  date: Date;
  project?: string;
  description?: string;
  tripMode?: 'ONE_WAY' | 'RETURN' | 'CUSTOM';
  origin?: string;
  destination?: string;
  calculatedMileage?: number;
  expenses: {
    mileage?: number;
    toll?: number;
    petrol?: number;
    meal?: number;
    others?: number;
  };
  mileageRate?: number;
  totalClaim?: number;
  attachments: Types.ObjectId[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submittedAt?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema: Schema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  project: { type: String },
  description: { type: String },
  tripMode: { type: String, enum: ['ONE_WAY', 'RETURN', 'CUSTOM'] },
  origin: { type: String },
  destination: { type: String },
  calculatedMileage: { type: Number },
  expenses: {
    mileage: { type: Number },
    toll: { type: Number },
    petrol: { type: Number },
    meal: { type: Number },
    others: { type: Number },
  },
  mileageRate: { type: Number },
  totalClaim: { type: Number },
  attachments: [{ type: Types.ObjectId, ref: 'File' }],
  status: { type: String, required: true, enum: ['draft', 'submitted', 'approved', 'rejected', 'paid'], default: 'draft' },
  submittedAt: { type: Date },
  approvedBy: { type: Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  remarks: { type: String },
}, { timestamps: true });

const Claim = mongoose.models.Claim || mongoose.model<IClaim>('Claim', ClaimSchema);

export default Claim;