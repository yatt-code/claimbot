import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'staff' | 'manager' | 'finance' | 'admin' | 'superadmin';

export interface IUser extends Document {
  clerkId: string;
  name?: string;
  email: string;
  department?: string;
  designation?: string;
  roles: UserRole[];
  monthlySalary?: number;
  hourlyRate?: number;
  salaryVerificationStatus?: 'pending' | 'verified' | 'rejected';
  salarySubmittedAt?: Date;
  salaryVerifiedAt?: Date;
  salaryVerifiedBy?: string; // Clerk ID of the verifier
  monthlyOvertimeHours?: Map<string, number>; // Map<YYYY-MM, totalHours>
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}


const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  department: { type: String },
  designation: { type: String },
  roles: { 
    type: [{
      type: String, 
      enum: ['staff', 'manager', 'finance', 'admin', 'superadmin'],
      required: true 
    }],
    default: ['staff']
  },
  monthlySalary: { type: Number },
  hourlyRate: { type: Number },
  salaryVerificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  salarySubmittedAt: { type: Date },
  salaryVerifiedAt: { type: Date },
  salaryVerifiedBy: { type: String },
  monthlyOvertimeHours: { type: Map, of: Number, default: {} }, // Store as Map<string, number>
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  methods: {
    hasRole(this: IUser, role: UserRole): boolean {
      // Superadmin has all roles
      if (this.roles.includes('superadmin')) return true;
      return this.roles.includes(role);
    },
    hasAnyRole(this: IUser, roles: UserRole[]): boolean {
      // Superadmin has all roles
      if (this.roles.includes('superadmin')) return true;
      return this.roles.some((userRole: UserRole) => roles.includes(userRole));
    }
  }
});

// Add a pre-save hook to ensure staff role is included for all users
UserSchema.pre('save', function(this: IUser, next) {
  // Ensure staff role is included for all users
  if (!this.roles.includes('staff')) {
    this.roles.push('staff');
  }
  
  next();
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;