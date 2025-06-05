"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Updated Google Maps types for new Places API
interface GoogleMapsPlacePrediction {
  text: { text: string };
  toPlace(): GoogleMapsPlace;
}

interface GoogleMapsPlace {
  displayName?: string;
  formattedAddress?: string;
  location?: {
    lat(): number;
    lng(): number;
  };
  fetchFields(options: { fields: string[] }): Promise<void>;
}

interface GoogleMapsSuggestion {
  placePrediction: GoogleMapsPlacePrediction;
}

interface GoogleMapsSessionToken {
  // Google Maps session token - opaque object
  toString(): string;
}

interface AutocompleteSuggestionRequest {
  input: string;
  sessionToken?: GoogleMapsSessionToken;
  locationBias?: {
    west: number;
    north: number;
    east: number;
    south: number;
  };
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          // Legacy API (still supported but deprecated)
          Autocomplete?: unknown;
          // New API
          AutocompleteSuggestion?: {
            fetchAutocompleteSuggestions(request: AutocompleteSuggestionRequest): Promise<{ suggestions: GoogleMapsSuggestion[] }>;
          };
          AutocompleteSessionToken?: new () => GoogleMapsSessionToken;
        };
      };
    };
    initGoogleMaps?: () => void;
  }
}

export interface LocationData {
  lat: number;
  lng: number;
  formatted_address: string;
}

interface LocationAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  onLocationSelect?: (locationData: LocationData) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  id?: string;
}

export function LocationAutocomplete({
  value = '',
  onChange,
  onLocationSelect,
  placeholder = 'Enter a location...',
  disabled = false,
  readOnly = false,
  className,
  id,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [suggestions, setSuggestions] = useState<GoogleMapsSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionToken, setSessionToken] = useState<GoogleMapsSessionToken | null>(null);

  // Load Google Maps Places API with improved error handling
  const loadGoogleMaps = useCallback(async () => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsGoogleMapsLoaded(true);
      setIsLoadingScript(false);
      return;
    }

    if (isLoadingScript) {
      return;
    }

    setIsLoadingScript(true);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key is not configured');
        setIsLoadingScript(false);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, wait for it to load
        const checkLoaded = () => {
          if (window.google?.maps?.places) {
            setIsGoogleMapsLoaded(true);
            setIsLoadingScript(false);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Create callback function
      window.initGoogleMaps = () => {
        console.log('🗺️ Google Maps API loaded successfully');
        setIsGoogleMapsLoaded(true);
        setIsLoadingScript(false);
        
        // Initialize session token if new API is available
        if (window.google?.maps?.places?.AutocompleteSessionToken) {
          setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
      };

      // Handle script load error
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setIsLoadingScript(false);
      };

      // Set timeout to prevent infinite loading
      setTimeout(() => {
        if (isLoadingScript && !window.google?.maps?.places) {
          console.warn('Google Maps API load timeout');
          setIsLoadingScript(false);
        }
      }, 10000);

      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Google Maps API:', error);
      setIsLoadingScript(false);
    }
  }, [isLoadingScript]);

  // Fetch autocomplete suggestions using new API
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!isGoogleMapsLoaded || !input.trim() || input.length < 2 || disabled || readOnly) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Use new AutocompleteSuggestion API if available, fallback to legacy
      if (window.google?.maps?.places?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
        console.log('🆕 Using new Google Places API');
        
        const request: AutocompleteSuggestionRequest = {
          input: input,
          sessionToken: sessionToken || undefined,
          locationBias: {
            // Malaysia bounds
            west: 99.0,
            north: 7.5,
            east: 120.0,
            south: 0.5,
          },
        };

        const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        setSuggestions(suggestions);
        setShowSuggestions(true);
      } else if (window.google?.maps?.places?.Autocomplete) {
        console.log('⚠️ New Google Places API not available, using legacy autocomplete with deprecation warning');
        // Show deprecation warning but continue with legacy functionality
        console.warn('Google Places Autocomplete is deprecated. Please update to PlaceAutocompleteElement when available.');
        // Note: Legacy autocomplete requires DOM element binding, which doesn't work well with our dropdown approach
        // For now, we'll disable suggestions but still allow manual input
        setShowSuggestions(false);
      } else {
        console.error('No Google Places API available');
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isGoogleMapsLoaded, sessionToken]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion: GoogleMapsSuggestion) => {
    try {
      const place = suggestion.placePrediction.toPlace();
      
      // Fetch place details
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location']
      });

      const locationData: LocationData = {
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0,
        formatted_address: place.formattedAddress || suggestion.placePrediction.text.text
      };

      // Update input value
      onChange(place.formattedAddress || suggestion.placePrediction.text.text);
      
      // Call location select callback
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }

      // Hide suggestions
      setShowSuggestions(false);
      setSuggestions([]);

      // Create new session token for next search
      if (window.google?.maps?.places?.AutocompleteSessionToken) {
        setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
      }
    } catch (error) {
      console.error('Error handling suggestion selection:', error);
    }
  }, [onChange, onLocationSelect]);

  // Load Google Maps on component mount
  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  // Reset loading state when disabled/readOnly props change
  useEffect(() => {
    if (disabled || readOnly) {
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      // Force reload Google Maps API check when field becomes enabled
      if (!isGoogleMapsLoaded && !isLoadingScript) {
        loadGoogleMaps();
      }
    }
  }, [disabled, readOnly, isGoogleMapsLoaded, isLoadingScript, loadGoogleMaps]);

  // Handle input changes and debounced suggestion fetching
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Only fetch suggestions if not disabled/readonly
    if (!disabled && !readOnly) {
      // Debounce suggestions fetching
      const timeoutId = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (delayed to allow for suggestion clicks)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "w-full",
          isLoadingScript && !disabled && !readOnly && "opacity-50",
          disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
          readOnly && "bg-gray-50",
          className
        )}
        autoComplete="off"
      />
      
      {isLoadingScript && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
      
      {!isGoogleMapsLoaded && !isLoadingScript && !disabled && !readOnly && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          Maps loading...
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="text-sm text-gray-900">
                {suggestion.placePrediction.text.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;