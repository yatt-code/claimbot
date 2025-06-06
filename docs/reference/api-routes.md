# ClaimBot: API Route Reference

**Version**: 1.0  
**Last Updated**: June 6, 2025  
**Status**: Production Ready

This document provides a comprehensive reference for all backend API endpoints in the ClaimBot application, located under `src/app/api/`.

## General Notes

*   **Authentication:** Unless otherwise specified, all routes require user authentication via Clerk. The `auth()` function from `@clerk/nextjs/server` is used.
*   **Authorization (RBAC):** Many routes employ Role-Based Access Control. Specific roles or permissions required are noted. The `protectApiRoute` utility from [`src/lib/auth-utils.ts`](../../src/lib/auth-utils.ts:1) or direct role checks on the `User` model are common.
*   **Database:** All routes that interact with data use `dbConnect()` or `withDB()` from [`src/lib/server/db.ts`](../../src/lib/server/db.ts:1) to connect to MongoDB.
*   **Validation:** Zod schemas are often used for request body validation.
*   **Error Handling:** Standard HTTP status codes are used (400, 401, 403, 404, 500) with JSON error responses.
*   **Audit Logging:** Many state-changing operations create entries in the `AuditLog` model.

---

## 1. Admin Specific APIs (`/api/admin/`)

### 1.1. `/api/admin/check-clerk-user`
*   **File:** [`src/app/api/admin/check-clerk-user/route.ts`](../../src/app/api/admin/check-clerk-user/route.ts:1)
*   **Method:** `GET`
*   **Purpose:** Retrieves and displays detailed information about a specific Clerk user, identified by a `userId` query parameter. Useful for debugging user/role sync issues.
*   **Auth/RBAC:** Implicitly requires admin access to know which `userId` to check; the route itself doesn't have explicit RBAC but is an admin utility.
*   **Request Query Params:**
    *   `userId` (string, required): The Clerk User ID to check.
*   **Response Body (Success - 200):**
    ```json
    {
      "success": true,
      "message": "Successfully retrieved Clerk user {clerkUserId}",
      "user": {
        "id": "string",
        "emails": [{"email": "string", "verified": "boolean"}],
        "primaryEmail": "string | null",
        "firstName": "string | null",
        "lastName": "string | null",
        "username": "string | null",
        "createdAt": "number (timestamp)",
        "lastSignInAt": "number (timestamp) | null",
        "publicMetadata": "object",
        "privateMetadata": "object"
      }
    }
    ```
*   **Key Logic:** Uses `clerkClient().users.getUser()` to fetch data directly from Clerk.

### 1.2. `/api/admin/salary-verification/pending-count`
*   **File:** [`src/app/api/admin/salary-verification/pending-count/route.ts`](../../src/app/api/admin/salary-verification/pending-count/route.ts:1)
*   **Method:** `GET`
*   **Purpose:** Gets the count of users whose salary information is submitted and pending verification.
*   **Auth/RBAC:** Requires 'manager', 'admin', or 'superadmin' role (checked via `protectApiRoute`).
*   **Response Body (Success - 200):**
    ```json
    { "count": "number" }
    ```
*   **Key Logic:** Counts `User` documents where `salaryVerificationStatus` is 'pending' and salary data has been submitted.

### 1.3. `/api/admin/sync-roles`
*   **File:** [`src/app/api/admin/sync-roles/route.ts`](../../src/app/api/admin/sync-roles/route.ts:1)
*   **Method:** `POST`
*   **Purpose:** Synchronizes a user's roles from the local MongoDB database to their Clerk public metadata.
*   **Auth/RBAC:** Requires authenticated user. While not explicitly checking for admin role in this endpoint, its nature suggests it's an admin-triggered utility or a self-service for users if `body.userId` is not provided.
*   **Request Body (JSON):**
    *   `userId` (string, optional): The Clerk User ID of the target user. If not provided, defaults to the current authenticated user's ID.
*   **Response Body (Success - 200):**
    ```json
    {
      "success": true,
      "message": "Successfully synced roles for user {user.email}",
      "userId": "string",
      "roles": ["UserRole"]
    }
    ```
*   **Key Logic:** Fetches user from local DB, then uses `clerkClient().users.updateUser()` to set `publicMetadata.roles`.

### 1.4. `/api/admin/trip-templates`
*   **File:** [`src/app/api/admin/trip-templates/route.ts`](../../src/app/api/admin/trip-templates/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves all admin-defined trip templates.
    *   **Auth/RBAC:** Authenticated user (no explicit role check in GET, but POST requires 'admin'). Implicitly admin-focused.
    *   **Response Body (Success - 200):** Array of `AdminTripTemplate` objects.
*   **Method:** `POST`
    *   **Purpose:** Creates a new admin-defined trip template.
    *   **Auth/RBAC:** Requires 'admin' role (checked using `hasRole` on session claims).
    *   **Request Body (JSON):** `origin` (Location object), `destination` (Location object), `roundTrip` (boolean), `label` (string).
    *   **Response Body (Success - 201):** The created `AdminTripTemplate` object.
    *   **Key Logic:** Audit logs the creation using a custom `auditLog` function from `logger.ts`.

### 1.5. `/api/admin/trip-templates/[id]`
*   **File:** [`src/app/api/admin/trip-templates/[id]/route.ts`](../../src/app/api/admin/trip-templates/[id]/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves a specific admin-defined trip template by its ID.
    *   **Auth/RBAC:** Requires 'admin' role.
    *   **Response Body (Success - 200):** The `AdminTripTemplate` object.
*   **Method:** `PUT`
    *   **Purpose:** Updates a specific admin-defined trip template.
    *   **Auth/RBAC:** Requires 'admin' role.
    *   **Request Body (JSON):** `origin` (Location object), `destination` (Location object), `roundTrip` (boolean), `label` (string).
    *   **Response Body (Success - 200):** The updated `AdminTripTemplate` object.
    *   **Key Logic:** Audit logs the update.
*   **Method:** `DELETE`
    *   **Purpose:** Deletes a specific admin-defined trip template.
    *   **Auth/RBAC:** Requires 'admin' role.
    *   **Response Body (Success - 200):** `{ "message": "Template deleted successfully" }` (Note: Should be 204 No Content for DELETE ideally).
    *   **Key Logic:** Audit logs the deletion.

### 1.6. `/api/admin/users/[userId]/roles` (Note: `userId` here is Clerk User ID)
*   **File:** [`src/app/api/admin/users/userId/roles/route.ts`](../../src/app/api/admin/users/userId/roles/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Gets the roles for a specific user identified by Clerk ID.
    *   **Auth/RBAC:** Requires current user to be 'admin' or 'superadmin'.
    *   **Response Body (Success - 200):** `{ "roles": ["UserRole"], "userId": "mongoDbId", "email": "string" }`
*   **Method:** `PATCH`
    *   **Purpose:** Updates the roles for a specific user identified by Clerk ID.
    *   **Auth/RBAC:** Requires current user to be 'superadmin'.
    *   **Request Body (JSON):** `{ "roles": ["UserRole"] }`
    *   **Response Body (Success - 200):** `{ "success": true, "user": { ...user object with updated roles... } }`
    *   **Key Logic:** Updates roles in local MongoDB `User` model and then calls `syncUserRolesToClerk()` (from `lib/clerk.ts`) to update Clerk's public metadata.

---

## 2. Audit Log APIs (`/api/audit-logs/`)

### 2.1. `/api/audit-logs`
*   **File:** [`src/app/api/audit-logs/route.ts`](../../src/app/api/audit-logs/route.ts:1)
*   **Method:** `GET`
*   **Purpose:** Fetches all audit log entries, sorted by timestamp descending.
*   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
*   **Response Body (Success - 200):** Array of `AuditLog` objects.

---

## 3. Authentication Related APIs (`/api/auth/`)

### 3.1. `/api/auth/profile`
*   **File:** [`src/app/api/auth/profile/route.ts`](../../src/app/api/auth/profile/route.ts:1)
*   **Method:** `GET`
*   **Purpose:** Retrieves the profile of the currently authenticated user, including salary status and monthly OT hours remaining.
*   **Auth/RBAC:** Authenticated user.
*   **Response Body (Success - 200):**
    ```json
    {
      "_id": "mongoDbId",
      "clerkId": "string",
      "name": "string",
      "email": "string",
      "salaryStatus": "'pending' | 'verified' | 'rejected' | 'not_submitted'",
      "salaryData": { "monthlySalary": "number", "hourlyRate": "number" } | undefined,
      "monthlyOtHoursRemaining": "number"
    }
    ```
*   **Key Logic:** Uses direct `User.collection.findOne()` to avoid Mongoose caching issues. Calculates `monthlyOtHoursRemaining` (cap at 18 hours).
*   **Note:** `PUT` for updating profile is not implemented in this file but would typically reside here.

---

## 4. Claim APIs (`/api/claims/`)

### 4.1. `/api/claims`
*   **File:** [`src/app/api/claims/route.ts`](../../src/app/api/claims/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Fetches claims for the currently authenticated user.
    *   **Auth/RBAC:** Authenticated user.
    *   **Response Body (Success - 200):** Array of `Claim` objects, with `totalClaim` potentially calculated on the fly.
    *   **Key Logic:** Auto-creates a basic `User` document in MongoDB if one doesn't exist for the Clerk `userId`. Calculates `totalClaim` using a hardcoded `mileageRate` of 0.5 if not already present.
*   **Method:** `POST`
    *   **Purpose:** Creates a new expense claim.
    *   **Auth/RBAC:** Requires 'staff', 'manager', 'admin', or 'superadmin' role.
    *   **Request Body (JSON):** Validated by `createClaimSchema` (includes date, project, description, trip details, expenses).
    *   **Response Body (Success - 201):** The created `Claim` object.
    *   **Key Logic:** Validates with Zod. Calculates `totalClaim` using a hardcoded `mileageRate` of 0.5. Sets default status to 'draft'. Audit logs the creation. Attachments are handled separately.

### 4.2. `/api/claims/[id]`
*   **File:** [`src/app/api/claims/[id]/route.ts`](../../src/app/api/claims/[id]/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves a specific claim by its ID.
    *   **Auth/RBAC:**
        *   Staff: Can only view their own claims.
        *   Manager, Finance, Admin, Superadmin: Can view any claim (TODO: Manager specific view for direct reports).
    *   **Response Body (Success - 200):** The `Claim` object, with `totalClaim` potentially calculated on the fly.
    *   **Key Logic:** Populates `userId` with basic user info. Calculates `totalClaim` if not present.
*   **Method:** `PATCH`
    *   **Purpose:** Updates an existing claim.
    *   **Auth/RBAC:**
        *   Staff: Can only update their own claims if status is 'draft'.
        *   Admin, Finance, Superadmin: Can update claims (field restrictions might apply).
    *   **Request Body (JSON):** Validated by `updateClaimSchema` (subset of claim fields, allows status update to 'submitted').
    *   **Response Body (Success - 200):** The updated `Claim` object.
    *   **Key Logic:** Validates with Zod. Recalculates `totalClaim` if expenses are updated (uses hardcoded mileage rate). Audit logs the update.
*   **Method:** `DELETE`
    *   **Purpose:** Deletes a specific claim.
    *   **Auth/RBAC:**
        *   Staff: Can only delete their own claims if status is 'draft'.
        *   Admin, Superadmin: Can delete claims.
    *   **Response Body (Success - 200):** `{ "message": "Claim deleted successfully" }` (Note: Should be 204 No Content).
    *   **Key Logic:** Audit logs the deletion.

### 4.3. `/api/claims/[id]/approve`
*   **File:** [`src/app/api/claims/[id]/approve/route.ts`](../../src/app/api/claims/[id]/approve/route.ts:1)
*   **Method:** `POST`
*   **Purpose:** Approves or rejects a specific claim.
*   **Auth/RBAC:** Requires 'manager', 'finance', or 'admin' role (via `protectApiRoute`).
*   **Request Body (JSON):** Validated by `approveClaimSchema` (`status`: 'approved' or 'rejected', `remarks` (optional)).
*   **Response Body (Success - 200):** The updated `Claim` object.
*   **Key Logic:** Claim must be in 'submitted' status. Updates `status`, `approvedBy`, `approvedAt`, `remarks`. Audit logs the action.

---

## 5. Configuration APIs (`/api/config/`)

### 5.1. `/api/config/rates`
*   **File:** [`src/app/api/config/rates/route.ts`](../../src/app/api/config/rates/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves all rate configurations.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Response Body (Success - 200):** Array of `RateConfig` objects.
*   **Method:** `POST`
    *   **Purpose:** Creates a new rate configuration.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Request Body (JSON):** `type` ('mileage' or 'overtime_multiplier'), `value` (number, for mileage), `condition` (object: `dayType`, `designation`), `multiplier` (number, for overtime), `effectiveDate` (date string).
    *   **Response Body (Success - 201):** The created `RateConfig` object.
    *   **Key Logic:** Validates required fields based on `type`.
*   **Method:** `PATCH`
    *   **Purpose:** Updates the `value` of a specific rate configuration.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Request Query Params:** `id` (string, required): The ID of the `RateConfig` to update.
    *   **Request Body (JSON):** `{ "rate": "number" }` (this `rate` corresponds to the `value` field in the model).
    *   **Response Body (Success - 200):** The updated `RateConfig` object.

### 5.2. `/api/config/rates/[id]`
*   **File:** [`src/app/api/config/rates/[id]/route.ts`](../../src/app/api/config/rates/[id]/route.ts:1)
*   **Method:** `PATCH`
    *   **Purpose:** Updates the `rate` (which maps to the `value` field in the `RateConfig` model) of a specific rate configuration by its ID.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Request Body (JSON):** `{ "rate": "number" }`
    *   **Response Body (Success - 200):** The updated `RateConfig` object.
*   **Note:** A `GET` handler for a single rate by ID is commented out but could be implemented. `DELETE` is not present.

---

## 6. File APIs (`/api/files/`)

### 6.1. `/api/files/[id]`
*   **File:** [`src/app/api/files/[id]/route.ts`](../../src/app/api/files/[id]/route.ts:1)
*   **Method:** `GET`
*   **Purpose:** Downloads a specific file by its metadata ID.
*   **Auth/RBAC:** Authenticated user. Basic authorization: Admin/Finance/Superadmin or uploader of the file. (TODO noted for more granular auth based on linked claim/overtime).
*   **Response Body (Success - 200):** The file content with appropriate `Content-Type` and `Content-Disposition` headers.
*   **Key Logic:** Reads file from the local filesystem path stored in the `File` model.

### 6.2. `/api/files/upload`
*   **File:** [`src/app/api/files/upload/route.ts`](../../src/app/api/files/upload/route.ts:1)
*   **Method:** `POST`
*   **Purpose:** Uploads a file and links it to a specific collection and document (e.g., a claim or overtime request).
*   **Auth/RBAC:** Authenticated user.
*   **Request Body (FormData):**
    *   `file`: The file to upload.
    *   `linkedToCollection` (string, required): 'claims' or 'overtime'.
    *   `linkedToDocumentId` (string, required): MongoDB ObjectId of the claim/overtime document.
*   **Response Body (Success - 201):** `{ "message": "File uploaded successfully", "file": "newFileObject" }`
*   **Key Logic:** Saves file to local `uploads/` directory with a unique name. Creates a `File` metadata document in MongoDB. Audit logs the upload.

---

## 7. Overtime APIs (`/api/overtime/`)

### 7.1. `/api/overtime`
*   **File:** [`src/app/api/overtime/route.ts`](../../src/app/api/overtime/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Fetches overtime requests for the currently authenticated user.
    *   **Auth/RBAC:** Authenticated user.
    *   **Response Body (Success - 200):** Array of `Overtime` objects.
    *   **Key Logic:** Auto-creates a basic `User` document if one doesn't exist.
*   **Method:** `POST`
    *   **Purpose:** Creates a new overtime request.
    *   **Auth/RBAC:** Requires 'staff', 'manager', 'admin', or 'superadmin' role. User's salary must be 'verified'.
    *   **Request Body (JSON):** Validated by `createOvertimeSchema` (`date`, `startTime`, `endTime`, `reason`/`justification`).
    *   **Response Body (Success - 201):** The created `Overtime` object.
    *   **Key Logic:** Validates with Zod, including weekday start time rule (after 8 PM). Calculates `hoursWorked`. Validates against monthly OT cap (18 hours). Fetches `rateMultiplier` from `RateConfig` based on day type and user designation. Calculates `totalPayout`. Updates user's `monthlyOvertimeHours`. Audit logs the creation.

### 7.2. `/api/overtime/[id]/approve`
*   **File:** [`src/app/api/overtime/[id]/approve/route.ts`](../../src/app/api/overtime/[id]/approve/route.ts:1)
*   **Method:** `POST`
*   **Purpose:** Approves or rejects a specific overtime request.
*   **Auth/RBAC:** Requires 'manager', 'finance', or 'admin' role (via `protectApiRoute`).
*   **Request Body (JSON):** Validated by `approveOvertimeSchema` (`status`: 'approved' or 'rejected', `remarks` (optional)).
*   **Response Body (Success - 200):** The updated `Overtime` object.
*   **Key Logic:** Overtime request must be in 'submitted' status. Updates `status`, `approvedBy`, `approvedAt`, `remarks`. Audit logs the action.

---

## 8. User APIs (`/api/users/`)

### 8.1. `/api/users`
*   **File:** [`src/app/api/users/route.ts`](../../src/app/api/users/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves a list of all users.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role and 'users:read:all' permission (via `protectApiRoute`).
    *   **Response Body (Success - 200):** Array of `User` objects (excluding `__v`).
*   **Method:** `POST`
    *   **Purpose:** Creates a new user.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role and 'users:create' permission (via `protectApiRoute`).
    *   **Request Body (JSON):** Validated by `createUserSchema` (`clerkId`, `email`, optional `name`, `department`, `designation`, `roles`, `salary`).
    *   **Response Body (Success - 201):** The created `User` object (sensitive data like full salary details might be omitted).
    *   **Key Logic:** Validates with Zod. Checks for existing user by `clerkId` or `email`. Calculates `hourlyRate` if `salary` is provided (assuming 173 hours/month).

### 8.2. `/api/users/[id]` (Note: `id` here is MongoDB `_id`)
*   **File:** [`src/app/api/users/[id]/route.ts`](../../src/app/api/users/[id]/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves a specific user by their MongoDB `_id`.
    *   **Auth/RBAC:** Requires 'admin' or 'manager' role (via `protectApiRoute`).
    *   **Response Body (Success - 200):** The `User` object.
*   **Method:** `PATCH`
    *   **Purpose:** Updates a specific user.
    *   **Auth/RBAC:** Requires 'admin' role (via `protectApiRoute`).
    *   **Request Body (JSON):** Partial `User` object (allows updating `name`, `department`, `designation`, `role` (singular, likely should be `roles` array), `salary`, `isActive`).
    *   **Response Body (Success - 200):** The updated `User` object.
    *   **Key Logic:** Recalculates `hourlyRate` if `salary` is updated (assuming 173 hours/month).
*   **Method:** `DELETE`
    *   **Purpose:** Deletes a specific user.
    *   **Auth/RBAC:** Requires 'admin' role (via `protectApiRoute`).
    *   **Response Body (Success - 200):** `{ "message": "User deleted successfully" }` (Note: Should be 204 No Content).

### 8.3. `/api/users/salary`
*   **File:** [`src/app/api/users/salary/route.ts`](../../src/app/api/users/salary/route.ts:1)
*   **Method:** `POST`
*   **Purpose:** Allows a user to submit their salary information for verification.
*   **Auth/RBAC:** Authenticated user.
*   **Request Body (JSON):** Validated by `SalarySubmissionSchema` (`monthlySalary` and/or `hourlyRate`).
*   **Response Body (Success - 200):** Success message with updated user data.
*   **Key Logic:** Validates eligibility (`canReviewSalary`), updates user salary fields, sets status to 'pending', creates audit log.

### 8.4. `/api/users/salary/status`
*   **File:** [`src/app/api/users/salary/status/route.ts`](../../src/app/api/users/salary/status/route.ts:1)
*   **Method:** `GET`
*   **Purpose:** Gets the current user's salary verification status and eligibility.
*   **Auth/RBAC:** Authenticated user.
*   **Response Body (Success - 200):** Object containing salary status, eligibility, and current salary data.

### 8.5. `/api/users/[id]/salary/verify` (Note: `id` here is MongoDB `_id` of target user)
*   **File:** [`src/app/api/users/[id]/salary/verify/route.ts`](../../src/app/api/users/[id]/salary/verify/route.ts:1)
*   **Method:** `PUT`
*   **Purpose:** Verifies or rejects a target user's salary submission.
*   **Auth/RBAC:** Requires 'manager', 'admin', or 'superadmin' role (via `protectApiRoute`).
*   **Request Body (JSON):** Validated by `SalaryVerificationSchema` (`status`: 'verified' or 'rejected', optional `reason`).
*   **Response Body (Success - 200):** Success message with updated user data.
*   **Key Logic:** Updates target user's verification status, sets verifier information, creates audit log.

---

## 9. Mileage APIs (`/api/mileage/`)

### 9.1. `/api/mileage/calculate`
*   **File:** [`src/app/api/mileage/calculate/route.ts`](../../src/app/api/mileage/calculate/route.ts:1)
*   **Method:** `POST`
    *   **Purpose:** Calculates mileage between an origin and destination.
    *   **Auth/RBAC:** Authenticated user.
    *   **Request Body (JSON):** Validated by `CalculateMileageSchema` (`origin` (string or lat/lng object), `destination` (string or lat/lng object), `isRoundTrip` (boolean)).
    *   **Response Body (Success - 200):**
        ```json
        {
          "distance": "number (meters)",
          "distanceKm": "number (kilometers)",
          "hasWarning": "boolean (if distance > 100km)",
          "warningMessage": "string | undefined",
          "calculatedAt": "ISO date string"
        }
        ```
    *   **Key Logic:** Uses `calculateMileage` and `validateTripRequirements` from [`@/lib/mileage-calculator`](../../src/lib/mileage-calculator.ts:1), which in turn likely uses Google Maps API.
*   **Method:** `GET`
    *   **Purpose:** Retrieves the configured office location.
    *   **Auth/RBAC:** Authenticated user.
    *   **Response Body (Success - 200):** `{ "office": { "name": "string", "address": "string", "lat": "number", "lng": "number" } | null, "available": "boolean", "error": "string | undefined" }`
    *   **Key Logic:** Uses `getOfficeLocation` from [`@/lib/google-maps`](../../src/lib/google-maps.ts:1).

---

## 10. Location Template APIs (`/api/location-templates/`)

### 10.1. `/api/location-templates`
*   **File:** [`src/app/api/location-templates/route.ts`](../../src/app/api/location-templates/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves all location templates.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Response Body (Success - 200):** Array of `LocationTemplate` objects.
*   **Method:** `POST`
    *   **Purpose:** Creates a new location template.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Request Body (JSON):** Validated by `CreateLocationTemplateSchema` (`name`, `address`, `lat`, `lng`).
    *   **Response Body (Success - 201):** The created `LocationTemplate` object.
    *   **Key Logic:** Validates with Zod and `validateCoordinates`. Checks for duplicate names (case-insensitive). Audit logs the creation.

### 10.2. `/api/location-templates/[id]`
*   **File:** [`src/app/api/location-templates/[id]/route.ts`](../../src/app/api/location-templates/[id]/route.ts:1)
*   **Method:** `PATCH`
    *   **Purpose:** Updates an existing location template.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Request Body (JSON):** Validated by `UpdateLocationTemplateSchema` (optional `name`, `address`, `lat`, `lng`).
    *   **Response Body (Success - 200):** The updated `LocationTemplate` object.
    *   **Key Logic:** Validates with Zod and `validateCoordinates`. Checks for name conflicts if name is updated. Audit logs the update.
*   **Method:** `DELETE`
    *   **Purpose:** Deletes a location template.
    *   **Auth/RBAC:** Requires 'admin' or 'superadmin' role.
    *   **Response Body (Success - 204):** No content.
    *   **Key Logic:** Audit logs the deletion.

---

## 11. Saved Trip Template APIs (`/api/saved-trip-templates/`)

### 11.1. `/api/saved-trip-templates`
*   **File:** [`src/app/api/saved-trip-templates/route.ts`](../../src/app/api/saved-trip-templates/route.ts:1)
*   **Method:** `GET`
    *   **Purpose:** Retrieves all saved trip templates for the currently authenticated user.
    *   **Auth/RBAC:** Authenticated user.
    *   **Response Body (Success - 200):** Array of `SavedTripTemplate` objects.
*   **Method:** `POST`
    *   **Purpose:** Creates a new saved trip template for the currently authenticated user.
    *   **Auth/RBAC:** Authenticated user.
    *   **Request Body (JSON):** `origin` (Location object), `destination` (Location object), `roundTrip` (boolean), `label` (string).
    *   **Response Body (Success - 201):** The created `SavedTripTemplate` object.
    *   **Key Logic:** Audit logs the creation.

### 11.2. `/api/saved-trip-templates/[id]`
*   **File:** [`src/app/api/saved-trip-templates/[id]/route.ts`](../../src/app/api/saved-trip-templates/[id]/route.ts:1)