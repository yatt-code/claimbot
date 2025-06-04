import mongoose, { Schema, Document } from 'mongoose';
import { Location } from '../types/location';

export interface IAdminTripTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  origin: Location;
  destination: Location;
  roundTrip: boolean;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminTripTemplateSchema: Schema = new Schema({
  origin: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  destination: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  roundTrip: { type: Boolean, required: true },
  label: { type: String, required: true },
}, {
  timestamps: true,
});

const AdminTripTemplate = mongoose.models.AdminTripTemplate || mongoose.model<IAdminTripTemplate>('AdminTripTemplate', AdminTripTemplateSchema);

export default AdminTripTemplate;