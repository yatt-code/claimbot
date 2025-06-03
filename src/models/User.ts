import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'staff' | 'manager' | 'finance' | 'admin' | 'superadmin';

export interface IUser extends Document {
  clerkId: string;
  name?: string;
  email: string;
  department?: string;
  designation?: string;
  roles: UserRole[];
  salary?: number;
  hourlyRate?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

// For backward compatibility with the old 'role' field
interface IUserDocument extends IUser {
  role?: string;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  department: { type: String },
  designation: { type: String },
  // For backward compatibility, we'll keep the role field but it's not used in new code
  role: { 
    type: String, 
    enum: ['staff', 'manager', 'finance', 'admin'],
    default: 'staff'
  },
  roles: { 
    type: [{
      type: String, 
      enum: ['staff', 'manager', 'finance', 'admin', 'superadmin'],
      required: true 
    }],
    default: ['staff']
  },
  salary: { type: Number },
  hourlyRate: { type: Number },
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true,
  methods: {
    hasRole(role: UserRole): boolean {
      // Superadmin has all roles
      if (this.roles.includes('superadmin')) return true;
      return this.roles.includes(role);
    },
    hasAnyRole(roles: UserRole[]): boolean {
      // Superadmin has all roles
      if (this.roles.includes('superadmin')) return true;
      return this.roles.some(role => roles.includes(role as UserRole));
    }
  }
});

// Add a pre-save hook to sync the legacy role field with the roles array
UserSchema.pre('save', function(next) {
  const user = this as IUserDocument;
  
  // If roles is empty but role is set, initialize roles from role
  if ((!user.roles || user.roles.length === 0) && user.role) {
    user.roles = [user.role as UserRole];
  }
  
  // Ensure staff role is included for all users
  if (!user.roles.includes('staff')) {
    user.roles.push('staff');
  }
  
  next();
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;