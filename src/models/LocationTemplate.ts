import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationTemplate extends Document {
  name: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocationTemplateSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  address: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  lat: { 
    type: Number, 
    required: true,
    min: -90,
    max: 90
  },
  lng: { 
    type: Number, 
    required: true,
    min: -180,
    max: 180
  }
}, { 
  timestamps: true
});

// Create indexes for better query performance
LocationTemplateSchema.index({ name: 1 });
LocationTemplateSchema.index({ lat: 1, lng: 1 });

// Add a compound index for geospatial queries if needed in the future
LocationTemplateSchema.index({ lat: 1, lng: 1 }, { name: 'location_2d' });

const LocationTemplate = mongoose.models.LocationTemplate || 
  mongoose.model<ILocationTemplate>('LocationTemplate', LocationTemplateSchema);

export default LocationTemplate;