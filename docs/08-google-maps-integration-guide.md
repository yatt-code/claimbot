# 🗺️ Google Maps & Places API Integration Guide

## Project Information
- **Document Type**: Google Maps API Integration & Setup Guide
- **Version**: 1.0
- **Last Updated**: June 5, 2025
- **Audience**: Developers, DevOps Engineers, System Administrators

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Google Cloud Console Setup](#-google-cloud-console-setup)
- [Environment Configuration](#-environment-configuration)
- [Code Integration Examples](#-code-integration-examples)
- [Frontend Integration](#-frontend-integration)
- [Backend API Implementation](#-backend-api-implementation)
- [Testing and Validation](#-testing-and-validation)
- [Production Considerations](#-production-considerations)
- [Troubleshooting](#-troubleshooting)
- [Cost Optimization](#-cost-optimization)

---

## 🌟 Overview

The ClaimBot system integrates with Google Maps APIs to provide automated distance calculation for expense claims. This integration enables:

- **Automatic mileage calculation** between locations
- **Address validation and geocoding**
- **Route optimization** for multi-stop trips
- **Real-time distance calculation** using Google Directions API

### Current Implementation Status

✅ **Implemented Features:**
- [`getDistanceInKM()`](src/lib/google-maps.ts:15) utility function
- [`geocodeAddress()`](src/lib/google-maps.ts:73) for address-to-coordinates conversion
- [`calculateMileage()`](src/lib/mileage-calculator.ts:11) for trip calculations
- [Mileage calculation API endpoint](src/app/api/mileage/calculate/route.ts:27)
- Office location configuration support
- Error handling and validation

### Required Google APIs

| API Service | Purpose | Implementation |
|-------------|---------|----------------|
| **Directions API** | Distance calculation between locations | [`getDistanceInKM()`](src/lib/google-maps.ts:15) |
| **Geocoding API** | Convert addresses to coordinates | [`geocodeAddress()`](src/lib/google-maps.ts:73) |
| **Maps JavaScript API** | Frontend map display (future enhancement) | Not yet implemented |
| **Places API** | Address autocomplete (future enhancement) | Not yet implemented |

---

## ☁️ Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. **Access Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Project name: `claimbot-maps-api`
   - Organization: Your organization
   - Location: Default or specific folder
   - Click "Create"

3. **Enable Billing Account**
   - Go to "Billing" in the navigation menu
   - Link a billing account (required for API usage)
   - Set up billing alerts (recommended)

### Step 2: Enable Required APIs

Navigate to **APIs & Services** → **Library** and enable:

```bash
# Required APIs for current implementation
✅ Directions API          # For distance calculations
✅ Geocoding API          # For address conversion
✅ Maps JavaScript API    # For frontend maps (future)
✅ Places API            # For autocomplete (future)
```

**API Activation Commands** (using gcloud CLI):
```bash
gcloud services enable directions-backend.googleapis.com
gcloud services enable geocoding-backend.googleapis.com
gcloud services enable maps-backend.googleapis.com
gcloud services enable places-backend.googleapis.com
```

### Step 3: Create API Credentials

1. **Go to APIs & Services** → **Credentials**

2. **Create API Key**
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key immediately
   - Click "Restrict Key" (highly recommended)

3. **Configure API Key Restrictions**

   **Application Restrictions:**
   ```
   # For Development
   HTTP referrers (web sites)
   - http://localhost:3000/*
   - https://localhost:3000/*
   
   # For Production
   HTTP referrers (web sites)
   - https://yourdomain.com/*
   - https://*.yourdomain.com/*
   ```

   **API Restrictions:**
   ```
   Restrict key to specific APIs:
   ✅ Directions API
   ✅ Geocoding API
   ✅ Maps JavaScript API
   ✅ Places API
   ```

### Step 4: Set Usage Quotas and Limits

1. **Go to APIs & Services** → **Quotas**

2. **Configure Daily Quotas** (recommended for cost control):
   ```
   Directions API: 1,000 requests/day
   Geocoding API: 500 requests/day
   Maps JavaScript API: 1,000 loads/day
   Places API: 500 requests/day
   ```

3. **Set Up Alerts**
   - Go to "Billing" → "Budgets & alerts"
   - Create budget alerts at 50%, 75%, 90% usage

---

## 🔧 Environment Configuration

### Required Environment Variables

Add these variables to your environment configuration:

```env
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Office Location (for default origin/destination)
OFFICE_LAT=3.1390
OFFICE_LNG=101.6869
OFFICE_NAME=Main Office Kuala Lumpur

# Optional: API Configuration
GOOGLE_MAPS_API_TIMEOUT=10000
GOOGLE_MAPS_CACHE_TTL=3600
```

### Development vs Production Configuration

#### Development (`.env.local`)
```env
# Development API Key (with localhost restrictions)
GOOGLE_MAPS_API_KEY=AIza...dev_key_here
OFFICE_LAT=3.1390
OFFICE_LNG=101.6869
OFFICE_NAME=Development Office

# Development settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Production (`.env.production`)
```env
# Production API Key (with domain restrictions)
GOOGLE_MAPS_API_KEY=AIza...prod_key_here
OFFICE_LAT=3.1390
OFFICE_LNG=101.6869
OFFICE_NAME=Company Headquarters

# Production settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://claimbot.yourdomain.com
```

### Security Best Practices

✅ **DO:**
- Use separate API keys for development and production
- Implement API key restrictions (referrer/IP restrictions)
- Store API keys in secure environment variables
- Rotate API keys regularly
- Monitor API usage and set alerts

❌ **DON'T:**
- Commit API keys to version control
- Use unrestricted API keys
- Share API keys between environments
- Use the same key for frontend and backend

---

## 💻 Code Integration Examples

### Core Google Maps Utility Implementation

The [`google-maps.ts`](src/lib/google-maps.ts) utility provides the foundation:

```typescript
// Distance calculation between two locations
import { getDistanceInKM } from '@/lib/google-maps';

const distance = await getDistanceInKM(
  "KPKT, Putrajaya",           // Origin (string)
  { lat: 3.1390, lng: 101.6869 } // Destination (coordinates)
);
console.log(`Distance: ${distance}km`);
```

### Mileage Calculator Implementation

The [`mileage-calculator.ts`](src/lib/mileage-calculator.ts) handles trip calculations:

```typescript
import { calculateMileage } from '@/lib/mileage-calculator';
import { getOfficeLocation } from '@/lib/google-maps';

// Calculate office to destination trip
const office = getOfficeLocation();
const destination = "KPKT, Putrajaya";
const isRoundTrip = true;

const totalDistance = await calculateMileage(
  office,
  destination,
  isRoundTrip
);

console.log(`Total trip distance: ${totalDistance}km`);
```

### Error Handling Implementation

```typescript
try {
  const distance = await getDistanceInKM(origin, destination);
  return { success: true, distance };
} catch (error) {
  console.error('Distance calculation failed:', error);
  
  if (error.message.includes('Google Maps API key')) {
    return { 
      success: false, 
      error: 'API configuration error',
      userMessage: 'Please contact system administrator'
    };
  }
  
  if (error.message.includes('No routes found')) {
    return { 
      success: false, 
      error: 'Route not found',
      userMessage: 'Unable to find route between locations'
    };
  }
  
  return { 
    success: false, 
    error: 'Calculation failed',
    userMessage: 'Please try again later'
  };
}
```

### Caching Implementation (Recommended)

```typescript
// Simple in-memory cache for distance calculations
const distanceCache = new Map<string, { distance: number; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getCachedDistance(
  origin: string | LocationCoordinates,
  destination: string | LocationCoordinates
): Promise<number> {
  const cacheKey = `${JSON.stringify(origin)}-${JSON.stringify(destination)}`;
  const cached = distanceCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.distance;
  }
  
  const distance = await getDistanceInKM(origin, destination);
  distanceCache.set(cacheKey, { distance, timestamp: Date.now() });
  
  return distance;
}
```

---

## 🖥️ Frontend Integration

### Current Implementation Status

Currently, the frontend uses server-side calculation through the API. Future enhancements will include:

### Map Display Component (Future Enhancement)

```typescript
// components/LocationMap.tsx
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';

interface LocationMapProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

export function LocationMap({ origin, destination }: LocationMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places']
  });

  // Implementation details...
}
```

### Places Autocomplete Component (Future Enhancement)

```typescript
// components/PlacesAutocomplete.tsx
import { Autocomplete } from '@react-google-maps/api';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export function PlacesAutocomplete({ onPlaceSelect }: PlacesAutocompleteProps) {
  // Implementation details...
}
```

### Current Form Integration

The expense form currently uses the mileage calculation API:

```typescript
// Form submission with automatic mileage calculation
const handleCalculateMileage = async () => {
  try {
    const response = await fetch('/api/mileage/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: formData.origin,
        destination: formData.destination,
        isRoundTrip: formData.isRoundTrip
      })
    });

    const result = await response.json();
    
    if (result.distanceKm) {
      setFormData(prev => ({
        ...prev,
        mileage: result.distanceKm
      }));
    }
  } catch (error) {
    console.error('Mileage calculation failed:', error);
  }
};
```

---

## 🔗 Backend API Implementation

### Mileage Calculation Endpoint

The [`/api/mileage/calculate`](src/app/api/mileage/calculate/route.ts) endpoint provides:

**POST Request:**
```typescript
// Request body
{
  "origin": "Main Office KL" | { "lat": 3.1390, "lng": 101.6869 },
  "destination": "KPKT, Putrajaya" | { "lat": 2.9264, "lng": 101.6964 },
  "isRoundTrip": true
}

// Response
{
  "distanceKm": 45.2,
  "hasWarning": false,
  "warningMessage": null,
  "calculatedAt": "2025-06-05T07:20:00.000Z"
}
```

**GET Request:** Returns office location configuration
```typescript
// Response
{
  "office": {
    "lat": 3.1390,
    "lng": 101.6869,
    "name": "Main Office Kuala Lumpur"
  },
  "available": true
}
```

### Rate Limiting Implementation

```typescript
// utils/rateLimiter.ts
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, maxRequests = 100): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const userLimit = rateLimiter.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}
```

### Batch Distance Calculation (Future Enhancement)

```typescript
// API endpoint for calculating multiple distances
export async function POST(request: Request) {
  const { routes } = await request.json();
  
  const calculations = await Promise.allSettled(
    routes.map(async (route: any) => ({
      id: route.id,
      distance: await calculateMileage(
        route.origin,
        route.destination,
        route.isRoundTrip
      )
    }))
  );
  
  return NextResponse.json({ calculations });
}
```

---

## 🧪 Testing and Validation

### API Key Validation

```bash
# Test API key with a simple request
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Kuala+Lumpur&key=YOUR_API_KEY"

# Expected response
{
  "results": [...],
  "status": "OK"
}
```

### Distance Calculation Testing

```typescript
// __tests__/google-maps.test.ts
describe('Google Maps Integration', () => {
  test('calculates distance between known locations', async () => {
    const distance = await getDistanceInKM(
      { lat: 3.1390, lng: 101.6869 }, // KL
      { lat: 2.9264, lng: 101.6964 }  // Putrajaya
    );
    
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThan(30);
  });

  test('handles invalid locations gracefully', async () => {
    await expect(
      getDistanceInKM('Invalid Location', 'Another Invalid Location')
    ).rejects.toThrow();
  });
});
```

### Performance Testing

```typescript
// Load testing script
async function performanceTest() {
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(getDistanceInKM(
      { lat: 3.1390, lng: 101.6869 },
      { lat: 2.9264, lng: 101.6964 }
    ));
  }
  
  await Promise.all(promises);
  const endTime = Date.now();
  
  console.log(`10 concurrent requests took: ${endTime - startTime}ms`);
}
```

### Common Test Locations (Malaysia)

```typescript
export const TEST_LOCATIONS = {
  KL_OFFICE: { lat: 3.1390, lng: 101.6869, name: "Kuala Lumpur Office" },
  PUTRAJAYA: { lat: 2.9264, lng: 101.6964, name: "Putrajaya" },
  CYBERJAYA: { lat: 2.9213, lng: 101.6559, name: "Cyberjaya" },
  PETALING_JAYA: { lat: 3.1073, lng: 101.6067, name: "Petaling Jaya" },
  SHAH_ALAM: { lat: 3.0733, lng: 101.5185, name: "Shah Alam" }
};
```

---

## 🏭 Production Considerations

### API Quota Management

**Recommended Daily Limits:**
```
Small Team (10-50 users):    1,000 requests/day
Medium Team (50-200 users):  5,000 requests/day
Large Team (200+ users):     10,000+ requests/day
```

**Quota Monitoring:**
```typescript
// Monitor API usage
export async function trackApiUsage(endpoint: string, userId: string) {
  await logApiCall({
    endpoint,
    userId,
    timestamp: new Date(),
    quotaRemaining: await getQuotaRemaining()
  });
}
```

### Caching Strategies

**1. Application-Level Caching:**
```typescript
// Redis cache implementation
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedDistance(origin: string, destination: string) {
  const cacheKey = `distance:${origin}:${destination}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const distance = await getDistanceInKM(origin, destination);
  await redis.setex(cacheKey, 3600, JSON.stringify(distance)); // 1 hour TTL
  
  return distance;
}
```

**2. Database Caching:**
```typescript
// Store calculated distances for reuse
interface DistanceCache {
  origin: string;
  destination: string;
  distance: number;
  calculatedAt: Date;
  expiresAt: Date;
}
```

### Monitoring and Alerting

**API Health Monitoring:**
```typescript
// Health check endpoint
export async function GET() {
  try {
    const testDistance = await getDistanceInKM(
      { lat: 3.1390, lng: 101.6869 },
      { lat: 3.1400, lng: 101.6870 }
    );
    
    return NextResponse.json({
      status: 'healthy',
      apiResponsive: true,
      lastCheck: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      apiResponsive: false,
      error: error.message
    }, { status: 503 });
  }
}
```

### Backup and Fallback Options

```typescript
// Fallback distance calculation using airline distance
function calculateAirlineDistance(
  origin: LocationCoordinates,
  destination: LocationCoordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (destination.lat - origin.lat) * Math.PI / 180;
  const dLon = (destination.lng - origin.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. API Key Not Working

**Symptoms:**
- 403 Forbidden errors
- "API key not valid" messages

**Solutions:**
```bash
# Check API key restrictions
1. Verify API key has correct API restrictions enabled
2. Check HTTP referrer restrictions
3. Ensure billing is enabled on Google Cloud project
4. Verify API key hasn't expired
```

#### 2. OVER_QUERY_LIMIT Errors

**Symptoms:**
- 429 status codes
- "Quota exceeded" messages

**Solutions:**
```typescript
// Implement exponential backoff
async function retryWithBackoff(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('OVER_QUERY_LIMIT') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

#### 3. ZERO_RESULTS Errors

**Symptoms:**
- No routes found between locations
- Invalid addresses

**Solutions:**
```typescript
// Address validation before API call
function validateAddress(address: string): boolean {
  return address.length > 3 && 
         !address.includes('undefined') && 
         address.trim() !== '';
}

// Fuzzy address matching
async function findBestMatch(address: string): Promise<string> {
  const suggestions = await geocodeAddress(address);
  return suggestions.formattedAddress;
}
```

#### 4. Network Connectivity Issues

**Symptoms:**
- Timeout errors
- Connection refused

**Solutions:**
```typescript
// Configure request timeout and retry
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};
```

### Debug Tools and Commands

```bash
# Test API connectivity
curl -v "https://maps.googleapis.com/maps/api/directions/json?origin=KL&destination=Putrajaya&key=YOUR_KEY"

# Monitor API usage
gcloud logging read "resource.type=api AND protoPayload.serviceName=maps-backend.googleapis.com" --limit=50

# Check quota usage
gcloud services quota list --service=maps-backend.googleapis.com
```

### Logging Configuration

```typescript
// Enhanced logging for Google Maps operations
import { logger } from '@/lib/logger';

export async function getDistanceInKM(origin: string, destination: string) {
  const startTime = Date.now();
  
  try {
    logger.info('Distance calculation started', {
      origin: typeof origin === 'string' ? origin : 'coordinates',
      destination: typeof destination === 'string' ? destination : 'coordinates'
    });
    
    const distance = await calculateDistance(origin, destination);
    
    logger.info('Distance calculation completed', {
      distance,
      duration: Date.now() - startTime
    });
    
    return distance;
  } catch (error) {
    logger.error('Distance calculation failed', {
      error: error.message,
      duration: Date.now() - startTime,
      origin,
      destination
    });
    throw error;
  }
}
```

---

## 💰 Cost Optimization

### Pricing Overview (as of 2025)

| API | Free Tier | Cost per 1000 requests |
|-----|-----------|------------------------|
| **Directions API** | $200 credit | $5.00 |
| **Geocoding API** | $200 credit | $5.00 |
| **Maps JavaScript API** | $200 credit | $7.00 per 1000 loads |
| **Places API** | $200 credit | $17.00 (Place Details) |

### Cost Estimation Tool

```typescript
// Calculate monthly API costs
interface ApiUsage {
  directions: number;
  geocoding: number;
  mapsLoads: number;
  placesDetails: number;
}

function calculateMonthlyCost(usage: ApiUsage): number {
  const rates = {
    directions: 5.00 / 1000,
    geocoding: 5.00 / 1000,
    mapsLoads: 7.00 / 1000,
    placesDetails: 17.00 / 1000
  };
  
  const cost = (
    usage.directions * rates.directions +
    usage.geocoding * rates.geocoding +
    usage.mapsLoads * rates.mapsLoads +
    usage.placesDetails * rates.placesDetails
  );
  
  // Apply $200 free tier credit
  return Math.max(0, cost - 200);
}
```

### Optimization Strategies

**1. Implement Aggressive Caching:**
```typescript
// Cache distances for common routes
const COMMON_ROUTES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const REGULAR_CACHE_TTL = 1 * 60 * 60 * 1000; // 1 hour
```

**2. Batch API Requests:**
```typescript
// Process multiple distance calculations together
async function batchCalculateDistances(requests: DistanceRequest[]) {
  // Group requests by similarity
  // Use Distance Matrix API for multiple destinations
}
```

**3. Use Alternative APIs for Simple Cases:**
```typescript
// Use airline distance for rough estimates
function shouldUseAirlineDistance(distance: number): boolean {
  return distance < 5; // For very short distances
}
```

**4. Monitor and Alert on Usage:**
```typescript
// Set up usage monitoring
async function checkDailyUsage() {
  const usage = await getApiUsageStats();
  if (usage.directions > 800) { // 80% of 1000 daily limit
    await sendAlert('High API usage detected');
  }
}
```

---

## 📚 Related Documentation

- [Technical Architecture Guide](06-technical-architecture.md) - System architecture overview
- [Deployment Guide](07-deployment-guide.md) - Production deployment instructions
- [Location System Implementation](location-system-implementation.md) - Feature implementation details

---

## 📞 Support and Resources

### Google Maps Platform Resources
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [Support Center](https://developers.google.com/maps/support/)

### ClaimBot Implementation Files
- [`src/lib/google-maps.ts`](src/lib/google-maps.ts) - Core Google Maps utilities
- [`src/lib/mileage-calculator.ts`](src/lib/mileage-calculator.ts) - Distance calculation logic
- [`src/app/api/mileage/calculate/route.ts`](src/app/api/mileage/calculate/route.ts) - API endpoint
- [`src/types/location.ts`](src/types/location.ts) - TypeScript definitions

---

**Last Updated:** June 5, 2025 | **Next Review:** July 5, 2025