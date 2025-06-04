import { GoogleMapsDirectionsResponse, GoogleMapsGeocodingResponse, LocationCoordinates } from '@/types/location';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('GOOGLE_MAPS_API_KEY is not set. Google Maps functionality will not work.');
}

/**
 * Get distance in kilometers between two locations using Google Maps Directions API
 * @param origin - Origin location (string address or lat,lng coordinates)
 * @param destination - Destination location (string address or lat,lng coordinates)
 * @returns Distance in kilometers
 */
export async function getDistanceInKM(
  origin: string | LocationCoordinates,
  destination: string | LocationCoordinates
): Promise<number> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    // Format coordinates for API
    const formatLocation = (location: string | LocationCoordinates): string => {
      if (typeof location === 'string') {
        return encodeURIComponent(location);
      }
      return `${location.lat},${location.lng}`;
    };

    const originParam = formatLocation(origin);
    const destinationParam = formatLocation(destination);

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originParam}&destination=${destinationParam}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GoogleMapsDirectionsResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found between the specified locations');
    }

    if (!data.routes[0].legs || data.routes[0].legs.length === 0) {
      throw new Error('No route legs found in the response');
    }

    // Get distance in meters and convert to kilometers
    const distanceInMeters = data.routes[0].legs[0].distance.value;
    const distanceInKm = distanceInMeters / 1000;

    return Math.round(distanceInKm * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw new Error(`Failed to calculate distance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Geocode an address to get coordinates using Google Maps Geocoding API
 * @param address - Address to geocode
 * @returns Coordinates and formatted address
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
}> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured');
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps Geocoding API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GoogleMapsGeocodingResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps Geocoding API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for the specified address');
    }

    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get office location from environment variables
 * @returns Office location coordinates and name
 */
export function getOfficeLocation(): {
  lat: number;
  lng: number;
  name: string;
} {
  const officeLat = process.env.OFFICE_LAT;
  const officeLng = process.env.OFFICE_LNG;
  const officeName = process.env.OFFICE_NAME || 'Main Office';

  if (!officeLat || !officeLng) {
    throw new Error('Office location coordinates (OFFICE_LAT, OFFICE_LNG) are not configured in environment variables');
  }

  const lat = parseFloat(officeLat);
  const lng = parseFloat(officeLng);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid office location coordinates in environment variables');
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Office location coordinates are out of valid range');
  }

  return {
    lat,
    lng,
    name: officeName
  };
}

/**
 * Validate coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns True if coordinates are valid
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}