# LocationAutocomplete Component Reference

**Version**: 1.0  
**Last Updated**: June 6, 2025  
**Status**: Production Ready

## Overview

The `LocationAutocomplete` component, located at [`src/components/LocationAutocomplete.tsx`](../../../src/components/LocationAutocomplete.tsx:79), provides a user-friendly input field for searching and selecting locations using the Google Maps Places API. It offers autocomplete suggestions as the user types and can return structured location data (including coordinates) upon selection.

## Purpose

To simplify location input for users, reduce errors, and obtain precise geographic coordinates for addresses. It is primarily used for origin and destination fields in claim submissions.

## Props

The component accepts the following props, defined by the `LocationAutocompleteProps` interface:

### `value?: string` (optional, default: `''`)
*   **Type:** `string`
*   **Description:** The current text value of the input field. Can be used to control the component or set an initial display value.

### `onChange: (value: string) => void` (required)
*   **Type:** `(value: string) => void`
*   **Description:** Callback function that is invoked whenever the text input value changes (e.g., as the user types). It receives the new string value of the input.

### `onLocationSelect?: (locationData: LocationData) => void` (optional)
*   **Type:** `(locationData: LocationData) => void`
*   **Description:** Callback function invoked when a user selects a location from the autocomplete suggestions. It receives a `LocationData` object.
*   **`LocationData` Interface:**
    ```typescript
    export interface LocationData {
      lat: number;
      lng: number;
      formatted_address: string;
    }
    ```

### `placeholder?: string` (optional, default: `'Enter a location...'`)
*   **Type:** `string`
*   **Description:** Placeholder text for the input field.

### `disabled?: boolean` (optional, default: `false`)
*   **Type:** `boolean`
*   **Description:** If true, the input field is disabled.

### `readOnly?: boolean` (optional, default: `false`)
*   **Type:** `boolean`
*   **Description:** If true, the input field is read-only.

### `className?: string` (optional)
*   **Type:** `string`
*   **Description:** Additional CSS classes to apply to the main wrapper `div` of the component. The input field itself also receives some conditional styling.

### `id?: string` (optional)
*   **Type:** `string`
*   **Description:** HTML `id` attribute for the input field.

## Usage Example

```tsx
"use client";

import { LocationAutocomplete, LocationData } from "@/components/LocationAutocomplete";
import { useState } from "react";

export default function MyForm() {
  const [address, setAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const handleLocationSelect = (location: LocationData) => {
    console.log("Selected Location:", location);
    setSelectedLocation(location);
    // The `onChange` prop will update `address` with the formatted address
  };

  return (
    <div>
      <LocationAutocomplete
        value={address}
        onChange={setAddress}
        onLocationSelect={handleLocationSelect}
        placeholder="Search for a destination..."
      />
      {selectedLocation && (
        <p>Coordinates: Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}</p>
      )}
    </div>
  );
}
```

## Key Features & Internal Logic

### Google Maps Places API Integration
*   Dynamically loads the Google Maps Places API script using the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable.
*   Includes error handling and timeout for script loading.
*   Uses the newer `AutocompleteSuggestion` API (`window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions`) if available. It includes a console warning and a graceful degradation path if only the legacy `Autocomplete` API is found (though legacy API integration for dropdowns is noted as problematic).

### Autocomplete Suggestions
*   Fetches suggestions as the user types (debounced, typically after 2-3 characters).
*   Uses a `sessionToken` for Google Maps API calls to manage billing sessions. A new token is generated after a selection.
*   Suggestions are biased towards Malaysia (defined bounds in the API request).
*   Displays suggestions in a dropdown list below the input field.

### Location Selection
*   When a suggestion is clicked, it fetches detailed place information (displayName, formattedAddress, location) using `place.fetchFields()`.
*   Calls the `onChange` prop with the selected place's formatted address.
*   Calls the `onLocationSelect` prop with the `LocationData` object (lat, lng, formatted_address).

### State Management
Uses `useState` for:
*   `isGoogleMapsLoaded`, `isLoadingScript`: Script loading status.
*   `suggestions`, `showSuggestions`: Managing autocomplete suggestions display.
*   `sessionToken`: Google Maps API session token.

### Input Handling
*   Debounces calls to `fetchSuggestions` to avoid excessive API requests while typing.
*   Handles input focus and blur to show/hide the suggestions dropdown appropriately.

### Styling
Uses [`cn`](../../../src/lib/utils.ts:1) utility for conditional class names and applies some basic styling for loading and disabled states.

## Configuration

### Environment Variables
*   **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`**: This environment variable **must** be set in your `.env.local` (or other environment configuration) for the component to function correctly.

### Google Cloud Console Setup
1. Enable the Places API in your Google Cloud Console
2. Create an API key with appropriate restrictions
3. Add the API key to your environment variables

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Advanced Usage

### Form Integration with React Hook Form
```tsx
import { useForm, Controller } from "react-hook-form";

interface FormData {
  origin: string;
  originLocation?: LocationData;
}

export default function ClaimForm() {
  const { control, setValue, watch } = useForm<FormData>();

  return (
    <Controller
      name="origin"
      control={control}
      render={({ field }) => (
        <LocationAutocomplete
          value={field.value}
          onChange={field.onChange}
          onLocationSelect={(location) => {
            setValue("originLocation", location);
          }}
          placeholder="Enter origin location..."
        />
      )}
    />
  );
}
```

### Custom Styling
```tsx
<LocationAutocomplete
  value={address}
  onChange={setAddress}
  onLocationSelect={handleLocationSelect}
  className="w-full max-w-md"
  placeholder="Search locations..."
/>
```

### Validation Integration
```tsx
const [address, setAddress] = useState("");
const [isValid, setIsValid] = useState(false);

const handleLocationSelect = (location: LocationData) => {
  setIsValid(true);
  // Store location data for form submission
};

const handleAddressChange = (value: string) => {
  setAddress(value);
  setIsValid(false); // Reset validation when user types
};
```

## API Integration Details

### Session Token Management
The component automatically manages Google Maps API session tokens to optimize billing:
- A new token is created when the component mounts
- The same token is used for all autocomplete requests in a session
- A new token is generated after a place is selected

### Request Bounds
Autocomplete requests are biased towards Malaysia with these bounds:
```typescript
const bounds = {
  north: 7.5,
  south: 0.5,
  east: 120.0,
  west: 99.0
};
```

### Error Handling
The component includes comprehensive error handling for:
- Google Maps API script loading failures
- Network errors during autocomplete requests
- Invalid API responses
- Missing or invalid API keys

## Performance Considerations

### Debouncing
Input changes are debounced to prevent excessive API calls:
- Minimum 2-3 characters before triggering suggestions
- 300ms delay between keystrokes

### Memory Management
- Event listeners are properly cleaned up on component unmount
- API requests are cancelled if component unmounts during request

### Caching
- Google Maps API script is loaded once and cached
- Session tokens are reused within the same session

## Troubleshooting

### Common Issues

1. **No suggestions appearing:**
   - Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
   - Verify the API key has Places API enabled
   - Check browser console for API errors

2. **API quota exceeded:**
   - Monitor your Google Cloud Console usage
   - Implement request throttling if needed
   - Consider caching frequent locations

3. **Incorrect location bounds:**
   - Modify the bounds in the component for different regions
   - Consider making bounds configurable via props

### Debug Mode
Enable debug logging by adding this to your component:
```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('LocationAutocomplete state:', {
    isGoogleMapsLoaded,
    suggestions: suggestions.length,
    showSuggestions
  });
}
```

## Dependencies

*   `react`
*   [`Input`](../../../src/components/ui/input.tsx:1) component from `src/components/ui/`.
*   [`cn`](../../../src/lib/utils.ts:1) utility from `src/lib/utils.ts`.
*   Google Maps Places API (loaded externally).

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires JavaScript enabled
- Works with all major browsers (Chrome, Firefox, Safari, Edge)

## Security Considerations

- API key should be restricted to specific domains in production
- Consider implementing rate limiting for API requests
- Validate location data on the server side

## Related Components

- **[DataTable](datatable.md)** - For displaying location-based data
- **[Form Components](../ui/)** - Base form input components

## Related Documentation

- **[Google Maps Integration Guide](../../guides/google-maps-integration-guide.md)** - Complete setup guide
- **[Mileage Calculator](../../technical/utility-library.md#mileage-calculator)** - Location-based calculations
- **[API Reference](../api-routes.md#mileage-apis)** - Mileage calculation endpoints

---

**Next Steps**: Review the [Google Maps Integration Guide](../../guides/google-maps-integration-guide.md) for complete API setup and configuration details.