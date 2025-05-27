import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  name?: string;
  email: string;
  department?: string;
  designation?: string;
  role: 'staff' | 'manager' | 'finance' | 'admin';
  salary?: number;
  hourlyRate?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  department: { type: String },
  designation: { type: String },
  role: { type: String, required: true, enum: ['staff', 'manager', 'finance', 'admin'] },
  salary: { type: Number },
  hourlyRate: { type: Number },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;