
export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationTemplate {
  _id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OfficeLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface CustomLocation {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface TripCalculation {
  origin?: LocationCoordinates | string;
  destination: LocationCoordinates | string;
  roundTrip: boolean; // Replaced TripMode with a boolean flag
  distanceKm: number;
  estimatedCost?: number;
}

// Google Maps API response types
export interface GoogleMapsDirectionsResponse {
  status: string;
  routes: Array<{
    legs: Array<{
      distance: {
        text: string;
        value: number; // in meters
      };
      duration: {
        text: string;
        value: number; // in seconds
      };
    }>;
  }>;
  error_message?: string;
}

export interface GoogleMapsGeocodingResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  error_message?: string;
}

// Validation schemas for API requests
export interface CreateLocationTemplateRequest {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface UpdateLocationTemplateRequest {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}