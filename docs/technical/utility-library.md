# ClaimBot: Utility Library Reference

**Version**: 1.0  
**Last Updated**: June 6, 2025  
**Status**: Production Ready

This document provides an overview of the utility modules found within the `src/lib/` directory, detailing their purpose, key functions, and integrations.

## General Notes

*   Modules related to RBAC and Authentication (`auth-utils.ts`, `rbac.ts`, `roles.ts`) are covered in more depth in the [RBAC and Authentication Deep Dive](rbac-and-auth.md) document.
*   Database connection logic (`server/db.ts`) is also foundational and has been touched upon in various sections.

---

## 1. Clerk Integration (`clerk.ts`)

**File:** [`src/lib/clerk.ts`](../../src/lib/clerk.ts:1)  
**Purpose:** Provides utility functions for interacting with the Clerk authentication service, particularly for synchronizing data between the local database and Clerk.

### Key Functions

#### `syncUserRolesToClerk(userId: string): Promise<boolean>`
*   **Description:** Synchronizes a user's roles from the local MongoDB `User` model to the `publicMetadata.roles` field in their Clerk user object. This is crucial for keeping Clerk's session claims consistent with the application's database.
*   **Process:**
    1.  Connects to the DB.
    2.  Finds the local `User` by `clerkId`.
    3.  Uses `clerkClient().users.updateUser()` to update Clerk's `publicMetadata`.
*   **Returns:** `true` on success, `false` on error (logs error to console).

#### `getCurrentUser(): Promise<object | null>`
*   **Description:** Retrieves details for the currently authenticated Clerk user, including their roles from `publicMetadata`. This function is suitable for use in API routes or server components.
*   **Process:**
    1.  Uses `auth()` from `@clerk/nextjs/server` to get `userId`.
    2.  Uses `clerkClient().users.getUser()` to fetch the Clerk user object.
    3.  Extracts roles from `publicMetadata`.
*   **Returns:** An object containing user `id`, `email`, `firstName`, `lastName`, `roles`, and helper methods `isSuperadmin`, `hasRole`, `hasAnyRole` (these helpers in `getCurrentUser` are simpler checks and do not use the full hierarchy from `rbac.ts`). Returns `null` if not authenticated or on error.

### Dependencies
*   `@clerk/nextjs/server`
*   [`models/User`](../../src/models/User.ts:1)
*   [`lib/server/db.ts`](../../src/lib/server/db.ts:1)

---

## 2. Google Maps Integration (`google-maps.ts`)

**File:** [`src/lib/google-maps.ts`](../../src/lib/google-maps.ts:1)  
**Purpose:** Contains utility functions for interacting with Google Maps APIs, primarily for distance calculation, geocoding, and retrieving office location.

### Configuration
Requires `GOOGLE_MAPS_API_KEY` environment variable. Warns if not set.

### Key Functions

#### `getDistanceInKM(origin: string | LocationCoordinates, destination: string | LocationCoordinates): Promise<number>`
*   **Description:** Calculates the driving distance in kilometers between two locations using the Google Maps Directions API.
*   **Parameters:** `origin` and `destination` can be string addresses or `LocationCoordinates` objects (`{ lat: number; lng: number }`).
*   **Returns:** Distance in kilometers, rounded to 2 decimal places. Throws an error on API failure or if no route is found.
*   **Includes:** Debug logging for API calls and responses.

#### `geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string }>`
*   **Description:** Converts a string address into geographic coordinates (latitude, longitude) and a formatted address using the Google Maps Geocoding API.
*   **Returns:** An object with `lat`, `lng`, and `formattedAddress`. Throws an error on API failure.

#### `getOfficeLocation(): { lat: number; lng: number; name: string }`
*   **Description:** Retrieves the office location (name, latitude, longitude) from environment variables (`OFFICE_LAT`, `OFFICE_LNG`, `OFFICE_NAME`).
*   **Returns:** An object with office details. Throws an error if coordinates are not configured or invalid.

#### `validateCoordinates(lat: number, lng: number): boolean`
*   **Description:** Checks if the given latitude and longitude are within valid numerical ranges.
*   **Returns:** `true` if valid, `false` otherwise.

### Types
Uses `LocationCoordinates`, `GoogleMapsDirectionsResponse`, `GoogleMapsGeocodingResponse` from [`src/types/location.ts`](../../src/types/location.ts:1).

### Dependencies
Google Maps API (external).

### Usage Example
```typescript
import { getDistanceInKM, geocodeAddress } from '@/lib/google-maps';

// Calculate distance between two addresses
const distance = await getDistanceInKM(
  "Kuala Lumpur, Malaysia",
  "Petaling Jaya, Malaysia"
);

// Geocode an address
const location = await geocodeAddress("KLCC, Kuala Lumpur");
console.log(location); // { lat: 3.1578, lng: 101.7123, formattedAddress: "..." }
```

---

## 3. Logging System (`logger.ts`)

**File:** [`src/lib/logger.ts`](../../src/lib/logger.ts:1)  
**Purpose:** Provides a configured Winston logger instance for application-wide logging. Also includes a basic `auditLog` function.

### Configuration
*   Log level is 'debug' in development, 'info' in production.
*   Formats logs with timestamp, error stack (if any), and JSON structure.
*   Console transport uses colorized, simple format.
*   Placeholder for file transports in production.

### Key Exports

#### `logger`
The configured Winston logger instance.
*   **Usage:** `logger.info('Message')`, `logger.error('Error message', errorObject)`.

#### `auditLog(params: AuditLogParams): Promise<void>`
*   **`AuditLogParams`**: `{ userId: string; action: string; entity: string; entityId?: string; details?: string; }`
*   **Description:** A simplified audit logging function that currently logs audit events using the Winston logger.
*   **Note:** The comment "In a real application, you would save this to a database" indicates this is a placeholder and actual audit events are saved to the `AuditLog` model directly in API routes. This function might be for general purpose logging that *resembles* an audit log entry but isn't the primary mechanism for persistent audit trails.

### Dependencies
`winston`.

### Usage Example
```typescript
import { logger, auditLog } from '@/lib/logger';

// Standard logging
logger.info('User logged in', { userId: 'user123' });
logger.error('Database connection failed', error);

// Audit logging
await auditLog({
  userId: 'user123',
  action: 'created_claim',
  entity: 'claim',
  entityId: 'claim456',
  details: 'Created new expense claim'
});
```

---

## 4. Mileage Calculator (`mileage-calculator.ts`)

**File:** [`src/lib/mileage-calculator.ts`](../../src/lib/mileage-calculator.ts:1)  
**Purpose:** Provides functions to calculate mileage for trips and validate trip inputs.

### Key Functions

#### `calculateMileage(origin: string | LocationCoordinates | OfficeLocation, destination: string | LocationCoordinates | OfficeLocation, isRoundTrip: boolean): Promise<number>`
*   **Description:** Calculates trip distance.
*   **Process:** Calls `getDistanceInKM` from [`google-maps.ts`](../../src/lib/google-maps.ts:1) for one-way distance, then doubles it if `isRoundTrip` is true.
*   **Returns:** Distance in kilometers.

#### `validateTripRequirements(origin, destination): { isValid: boolean; error?: string }`
*   **Description:** Simple validation to check if origin and destination are provided.

### Types
Uses `LocationCoordinates`, `OfficeLocation` from [`src/types/location.ts`](../../src/types/location.ts:1).

### Dependencies
[`lib/google-maps.ts`](../../src/lib/google-maps.ts:1).

### Usage Example
```typescript
import { calculateMileage, validateTripRequirements } from '@/lib/mileage-calculator';

// Validate trip inputs
const validation = validateTripRequirements(origin, destination);
if (!validation.isValid) {
  throw new Error(validation.error);
}

// Calculate mileage
const distance = await calculateMileage(
  { lat: 3.1390, lng: 101.6869 }, // KL Sentral
  { lat: 3.1478, lng: 101.6953 }, // KLCC
  true // Round trip
);
```

---

## 5. Role Management (`role-management.ts`)

**File:** [`src/lib/role-management.ts`](../../src/lib/role-management.ts:1)  
**Purpose:** Provides utility functions specifically for managing and presenting role information, likely for admin UIs related to user role assignment. It builds upon the core RBAC logic.

### Key Functions

#### `getAvailableRoles(managerRoles: UserRole[]): RoleOption[]`
*   **`RoleOption`**: `{ value: UserRole; label: string; description: string; disabled?: boolean; }`
*   **Description:** Returns a list of all `UserRole`s, formatted for UI display (e.g., in a dropdown). Each role option includes a `disabled` flag based on whether the `managerRoles` (roles of the admin performing the action) permit managing/assigning that target role (uses `canManageRole` from `rbac.ts`).

#### `getCommonRoleCombinations(): { roles: UserRole[]; label: string; description: string }[]`
*   **Description:** Provides a predefined list of common or sensible role combinations (e.g., "Team Manager" having 'staff' and 'manager' roles) with labels and descriptions. Useful for UI presets.

#### `validateRoleAssignment(assignedRoles: UserRole[], managerRoles: UserRole[]): { valid: boolean; errors: string[] }`
*   **Description:** Validates a proposed set of `assignedRoles` against business rules and the `managerRoles`' permissions.
*   **Checks:**
    *   If roles are valid `UserRole`s.
    *   If the manager `canManageRole` for each assigned role.
    *   Ensures at least one role is assigned.
    *   Enforces that 'staff' role is always included.
    *   Checks for redundant combinations (e.g., 'superadmin' and 'admin' together).
*   **Returns:** Validation result with an array of error messages if invalid.

#### `suggestRoles(currentRoles: UserRole[]): { suggested: UserRole[]; reason: string }`
*   **Description:** Suggests an optimized or corrected set of roles based on `currentRoles`. For example, if 'superadmin' is present, it suggests just 'staff' and 'superadmin'. If 'admin' is present, suggests 'staff' and 'admin' (as admin implies manager/finance). Ensures 'staff' is always included.

#### `getRoleHierarchyInfo()`
*   **Description:** Returns an object describing the role hierarchy levels and a note about inheritance. Useful for displaying help text in UIs.

### Dependencies
*   [`models/User`](../../src/models/User.ts:1) (for `UserRole` type)
*   [`lib/rbac.ts`](../../src/lib/rbac.ts:1) (for `canManageRole`, `getRoleDisplayName`, `validateRoles`)

### Usage Example
```typescript
import { getAvailableRoles, validateRoleAssignment } from '@/lib/role-management';

// Get roles available for assignment by current user
const availableRoles = getAvailableRoles(['admin']);

// Validate role assignment
const validation = validateRoleAssignment(['staff', 'manager'], ['admin']);
if (!validation.valid) {
  console.error('Invalid role assignment:', validation.errors);
}
```

---

## 6. Utilities (`utils.ts`)

**File:** [`src/lib/utils.ts`](../../src/lib/utils.ts:1)  
**Purpose:** A general-purpose utility module. Currently, its primary function is for constructing CSS class names.

### Key Functions

#### `cn(...inputs: ClassValue[]): string`
*   **Description:** A common utility in Tailwind CSS projects. It combines `clsx` (for conditional class names) and `tailwind-merge` (to intelligently merge Tailwind classes, resolving conflicts).
*   **Usage:** `className={cn("base-class", { "conditional-class": condition }, "another-class")}`

### Dependencies
*   `clsx`
*   `tailwind-merge`

### Usage Example
```typescript
import { cn } from '@/lib/utils';

// Basic usage
const className = cn("px-4 py-2", "bg-blue-500", "text-white");

// Conditional classes
const buttonClass = cn(
  "px-4 py-2 rounded",
  {
    "bg-blue-500": variant === 'primary',
    "bg-gray-500": variant === 'secondary',
    "opacity-50": disabled
  }
);

// Merge conflicting classes (tailwind-merge resolves conflicts)
const mergedClass = cn("px-2 px-4"); // Results in "px-4"
```

---

## 7. User Validation (`validation/user.ts`)

**File:** [`src/lib/validation/user.ts`](../../src/lib/validation/user.ts:1)  
**Purpose:** Contains Zod schemas for validating user-related data, specifically for salary operations.

### Key Schemas

#### `SalarySubmissionSchema`
*   Validates `monthlySalary` (number, >=0) and `hourlyRate` (number, >=0).
*   Uses `.refine()` to ensure at least one of `monthlySalary` or `hourlyRate` is provided and is greater than 0.

#### `SalaryVerificationSchema`
*   Validates `status` (enum: 'verified', 'rejected', required).
*   Validates `reason` (string, optional, for rejections).

### Dependencies
`zod`.

### Usage
These schemas are typically used in API route handlers (e.g., [`/api/users/salary/route.ts`](../../src/app/api/users/salary/route.ts:1), [`/api/users/[id]/salary/verify/route.ts`](../../src/app/api/users/[id]/salary/verify/route.ts:1)) to validate incoming request bodies.

### Usage Example
```typescript
import { SalarySubmissionSchema, SalaryVerificationSchema } from '@/lib/validation/user';

// Validate salary submission
try {
  const validatedData = SalarySubmissionSchema.parse({
    monthlySalary: 5000,
    hourlyRate: 28.85
  });
} catch (error) {
  console.error('Validation failed:', error.errors);
}

// Validate salary verification
const verificationData = SalaryVerificationSchema.parse({
  status: 'verified'
});
```

---

## 8. Database Connection (`server/db.ts`)

**File:** [`src/lib/server/db.ts`](../../src/lib/server/db.ts:1)  
**Purpose:** Manages MongoDB connection using Mongoose, with connection caching for serverless environments.

### Key Functions

#### `dbConnect(): Promise<typeof mongoose>`
*   **Description:** Establishes connection to MongoDB with caching to prevent multiple connections in serverless environments.
*   **Features:**
    *   Connection caching for performance
    *   Error handling and logging
    *   Automatic reconnection logic
    *   Environment-specific configuration

### Configuration
*   Uses `MONGODB_URI` environment variable
*   Configures Mongoose options for production optimization
*   Includes connection event listeners for monitoring

### Usage Example
```typescript
import { dbConnect } from '@/lib/server/db';

// In API routes or server components
export async function GET() {
  await dbConnect();
  // Now you can use Mongoose models
  const users = await User.find({});
  return Response.json(users);
}
```

---

## 9. AI Directory (`ai/`)

**Path:** `src/lib/ai/`  
**Status:** Currently empty. This directory was likely created as a placeholder for future AI-related functionalities or integrations.

---

## Environment Variables Reference

### Required Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/claimbot

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Office Location
OFFICE_LAT=3.1390
OFFICE_LNG=101.6869
OFFICE_NAME=Main Office
NEXT_PUBLIC_OFFICE_LAT=3.1390
NEXT_PUBLIC_OFFICE_LNG=101.6869
NEXT_PUBLIC_OFFICE_NAME=Main Office

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Optional Variables
```bash
# Logging
LOG_LEVEL=info

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

## Best Practices

### Error Handling
```typescript
import { logger } from '@/lib/logger';

try {
  const result = await someOperation();
  logger.info('Operation successful', { result });
} catch (error) {
  logger.error('Operation failed', { error: error.message, stack: error.stack });
  throw error;
}
```

### Type Safety
```typescript
// Always use proper TypeScript types
import type { LocationCoordinates } from '@/types/location';

const coordinates: LocationCoordinates = {
  lat: 3.1390,
  lng: 101.6869
};
```

### Performance Optimization
```typescript
// Cache expensive operations
const memoizedCalculation = useMemo(() => {
  return calculateMileage(origin, destination, isRoundTrip);
}, [origin, destination, isRoundTrip]);
```

## Testing Utilities

### Mock Functions
```typescript
// For testing Google Maps functions
jest.mock('@/lib/google-maps', () => ({
  getDistanceInKM: jest.fn().mockResolvedValue(10.5),
  geocodeAddress: jest.fn().mockResolvedValue({
    lat: 3.1390,
    lng: 101.6869,
    formattedAddress: 'Test Address'
  })
}));
```

### Test Helpers
```typescript
// Database test setup
import { dbConnect } from '@/lib/server/db';

beforeAll(async () => {
  await dbConnect();
});

afterAll(async () => {
  await mongoose.connection.close();
});
```

## Related Documentation

- **[RBAC and Authentication](rbac-and-auth.md)** - Security and authorization utilities
- **[Data Models](../reference/data-models.md)** - Database models and schemas
- **[API Reference](../reference/api-routes.md)** - How utilities are used in APIs
- **[Google Maps Integration Guide](../guides/google-maps-integration-guide.md)** - Complete Google Maps setup

---

**Next Steps**: Review the [RBAC and Authentication](rbac-and-auth.md) documentation for detailed security implementation using these utilities.