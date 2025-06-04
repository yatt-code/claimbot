import mongoose, { Schema, Document } from 'mongoose';
import { Location } from '../types/location';

export interface ISavedTripTemplate extends Document {
  userId: mongoose.Types.ObjectId;
  origin: Location;
  destination: Location;
  roundTrip: boolean;
  label: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedTripTemplateSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  origin: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  destination: {
    name: { type: String, required: true },
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