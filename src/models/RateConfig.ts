import mongoose, { Schema, Document } from 'mongoose';

export interface IRateConfig extends Document {
  type: 'mileage' | 'overtime_multiplier';
  value?: number; // For mileage rate
  condition?: { // For overtime multiplier
    dayType?: string;
    designation?: string;
  };
  multiplier?: number; // For overtime multiplier
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RateConfigSchema: Schema = new Schema({
  type: { type: String, required: true, enum: ['mileage', 'overtime_multiplier'] },
  value: { type: Number },
  condition: {
    dayType: { type: String },
    designation: { type: String },
  },
  multiplier: { type: Number },
  effectiveDate: { type: Date, required: true },
}, { timestamps: true });

const RateConfig = mongoose.models.RateConfig || mongoose.model<IRateConfig>('RateConfig', RateConfigSchema);

export default RateConfig;