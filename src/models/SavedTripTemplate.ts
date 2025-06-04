import mongoose, { Schema, Document } from 'mongoose';
import { Location } from '../types/location';

export interface ISavedTripTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string; // Changed from ObjectId to string to match Clerk's user ID format
  origin: Location;
  destination: Location;
  roundTrip: boolean;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedTripTemplateSchema: Schema = new Schema({
  userId: { type: String, required: true }, // Changed to String type
  origin: {
    address: { type: String, required: true }, // Changed from 'name' to 'address' to match Location type
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  destination: {
    address: { type: String, required: true }, // Changed from 'name' to 'address' to match Location type
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  roundTrip: { type: Boolean, required: true },
  label: { type: String, required: true },
}, {
  timestamps: true,
});

const SavedTripTemplate = mongoose.models.SavedTripTemplate || mongoose.model<ISavedTripTemplate>('SavedTripTemplate', SavedTripTemplateSchema);

export default SavedTripTemplate;