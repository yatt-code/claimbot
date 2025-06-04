import { LocationCoordinates, OfficeLocation } from '@/types/location';
import { getDistanceInKM, getOfficeLocation } from './google-maps';

/**
 * Calculate mileage based on trip mode and locations
 * @param origin - Origin coordinates or address
 * @param destination - Destination coordinates or address
 * @param isRoundTrip - Whether the trip is a round trip
 * @returns Distance in kilometers
 */
export async function calculateMileage(
  origin: string | LocationCoordinates | OfficeLocation, // Allow OfficeLocation
  destination: string | LocationCoordinates | OfficeLocation, // Allow OfficeLocation
  isRoundTrip: boolean
): Promise<number> {
  let distance = await getDistanceInKM(origin, destination);
  if (isRoundTrip) {
    distance *= 2;
  }
  return distance;
}

/**
 * Validate trip requirements
 * @param origin - Origin location
 * @param destination - Destination location
 * @returns Validation result with error message if invalid
 */
export function validateTripRequirements(
  origin: string | LocationCoordinates | OfficeLocation | null, // Allow OfficeLocation
  destination: string | LocationCoordinates | OfficeLocation | null // Allow OfficeLocation
): { isValid: boolean; error?: string } {
  if (!origin) {
    return { isValid: false, error: 'Origin is required' };
  }
  if (!destination) {
    return { isValid: false, error: 'Destination is required' };
  }
  return { isValid: true };
}