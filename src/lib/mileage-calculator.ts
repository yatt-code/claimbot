import { TripMode, LocationCoordinates, OfficeLocation } from '@/types/location';
import { getDistanceInKM, getOfficeLocation } from './google-maps';

/**
 * Calculate mileage based on trip mode and locations
 * @param tripMode - The type of trip being calculated
 * @param destination - Destination coordinates or address
 * @param origin - Origin coordinates or address (required for custom modes)
 * @returns Distance in kilometers
 */
export async function calculateMileage(
  tripMode: TripMode,
  destination: string | LocationCoordinates,
  origin?: string | LocationCoordinates
): Promise<number> {
  let office: OfficeLocation;
  
  try {
    office = getOfficeLocation();
  } catch (error) {
    throw new Error(`Office location not configured: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  switch (tripMode) {
    case TripMode.OFFICE_TO_DEST:
      return await getDistanceInKM(office, destination);

    case TripMode.OFFICE_TO_DEST_AND_BACK:
      const oneWayDistance = await getDistanceInKM(office, destination);
      return oneWayDistance * 2;

    case TripMode.CUSTOM_ORIGIN_TO_DEST:
      if (!origin) {
        throw new Error('Origin is required for CUSTOM_ORIGIN_TO_DEST trip mode');
      }
      return await getDistanceInKM(origin, destination);

    case TripMode.CUSTOM_ORIGIN_TO_DEST_AND_BACK:
      if (!origin) {
        throw new Error('Origin is required for CUSTOM_ORIGIN_TO_DEST_AND_BACK trip mode');
      }
      const customOneWayDistance = await getDistanceInKM(origin, destination);
      return customOneWayDistance * 2;

    case TripMode.CUSTOM_A_TO_B:
      if (!origin) {
        throw new Error('Origin is required for CUSTOM_A_TO_B trip mode');
      }
      return await getDistanceInKM(origin, destination);

    case TripMode.CUSTOM_A_TO_B_AND_BACK:
      if (!origin) {
        throw new Error('Origin is required for CUSTOM_A_TO_B_AND_BACK trip mode');
      }
      const customRoundTripDistance = await getDistanceInKM(origin, destination);
      return customRoundTripDistance * 2;

    default:
      throw new Error(`Unsupported trip mode: ${tripMode}`);
  }
}

/**
 * Validate trip mode requirements
 * @param tripMode - The trip mode to validate
 * @param destination - Destination location
 * @param origin - Origin location (optional)
 * @returns Validation result with error message if invalid
 */
export function validateTripModeRequirements(
  tripMode: TripMode,
  destination: string | LocationCoordinates | null,
  origin?: string | LocationCoordinates | null
): { isValid: boolean; error?: string } {
  // Check if destination is provided
  if (!destination) {
    return { isValid: false, error: 'Destination is required for all trip modes' };
  }

  // Check origin requirements for custom modes
  const customModes = [
    TripMode.CUSTOM_ORIGIN_TO_DEST,
    TripMode.CUSTOM_ORIGIN_TO_DEST_AND_BACK,
    TripMode.CUSTOM_A_TO_B,
    TripMode.CUSTOM_A_TO_B_AND_BACK
  ];

  if (customModes.includes(tripMode) && !origin) {
    return { isValid: false, error: `Origin is required for ${tripMode} trip mode` };
  }

  return { isValid: true };
}

/**
 * Get trip mode display name
 * @param tripMode - The trip mode
 * @returns Human-readable display name
 */
export function getTripModeDisplayName(tripMode: TripMode): string {
  const displayNames: Record<TripMode, string> = {
    [TripMode.OFFICE_TO_DEST]: 'Office to Destination',
    [TripMode.OFFICE_TO_DEST_AND_BACK]: 'Office to Destination (Round Trip)',
    [TripMode.CUSTOM_ORIGIN_TO_DEST]: 'Custom Origin to Destination',
    [TripMode.CUSTOM_ORIGIN_TO_DEST_AND_BACK]: 'Custom Origin to Destination (Round Trip)',
    [TripMode.CUSTOM_A_TO_B]: 'Custom Point A to Point B',
    [TripMode.CUSTOM_A_TO_B_AND_BACK]: 'Custom Point A to Point B (Round Trip)'
  };

  return displayNames[tripMode] || tripMode;
}

/**
 * Check if trip mode requires custom origin
 * @param tripMode - The trip mode to check
 * @returns True if custom origin is required
 */
export function requiresCustomOrigin(tripMode: TripMode): boolean {
  return [
    TripMode.CUSTOM_ORIGIN_TO_DEST,
    TripMode.CUSTOM_ORIGIN_TO_DEST_AND_BACK,
    TripMode.CUSTOM_A_TO_B,
    TripMode.CUSTOM_A_TO_B_AND_BACK
  ].includes(tripMode);
}

/**
 * Check if trip mode is round trip
 * @param tripMode - The trip mode to check
 * @returns True if it's a round trip mode
 */
export function isRoundTrip(tripMode: TripMode): boolean {
  return [
    TripMode.OFFICE_TO_DEST_AND_BACK,
    TripMode.CUSTOM_ORIGIN_TO_DEST_AND_BACK,
    TripMode.CUSTOM_A_TO_B_AND_BACK
  ].includes(tripMode);
}

/**
 * Get all available trip modes with their metadata
 * @returns Array of trip modes with metadata
 */
export function getAllTripModes(): Array<{
  value: TripMode;
  label: string;
  requiresOrigin: boolean;
  isRoundTrip: boolean;
}> {
  return Object.values(TripMode).map(mode => ({
    value: mode,
    label: getTripModeDisplayName(mode),
    requiresOrigin: requiresCustomOrigin(mode),
    isRoundTrip: isRoundTrip(mode)
  }));
}