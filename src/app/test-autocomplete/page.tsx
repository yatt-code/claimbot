"use client";

import { useState } from 'react';
import LocationAutocomplete, { LocationData } from '@/components/LocationAutocomplete';

export default function TestAutocompletePage() {
  const [location, setLocation] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  return (
    <div className="container mx-auto py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Test Location Autocomplete</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Location Search
          </label>
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            onLocationSelect={setLocationData}
            placeholder="Search for a location..."
          />
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Current Values:</h3>
          <p><strong>Text:</strong> {location || 'None'}</p>
          {locationData && (
            <div className="mt-2">
              <p><strong>Formatted Address:</strong> {locationData.formatted_address}</p>
              <p><strong>Coordinates:</strong> {locationData.lat}, {locationData.lng}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}