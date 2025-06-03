# 🐛 ClaimBot Debug List & TODOs

This document tracks known bugs, errors, and pending implementation tasks.

---

## Known Issues

#### ShadCN Select Component Import Error
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#frontend`, `#shadcn`, `#import-error`
- **Description**: Encountered a TypeScript error (`Cannot find module '@/components/ui/select'`) when importing the ShadCN Select component in `src/app/admin/reports/page.tsx`. This was due to the component not being installed in the project.
- **Solution**: Running `npx shadcn@latest add select` resolved the error by installing and setting up the component correctly.
- **Affected File**: `src/app/admin/reports/page.tsx`
- **Related**: See TDL [2025-05-30] Submit Expense Form Implementation


#### Persistent TypeScript Type Errors in Expense Form
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#form`, `#zod`, `#type-error`
- **Description**: Resolved by handling empty string conversion to undefined in input `onChange` and Zod `preprocess` for optional number fields.
- **Affected File**: `src/app/submit/expense/page.tsx`
- **Related**: See TDL [2025-05-30] Submit Expense Form Implementation


#### Persistent TypeScript and Mocking Errors in Backend Tests
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#test`, `#backend`, `#typescript`, `#mocking`
- **Description**: TypeScript type compatibility issues in backend tests have been resolved. The mocking approach was standardized across all test files using proper TypeScript types. All backend test files (`claims.test.ts`, `auth.test.ts`, `userManagement.test.ts`, and `overtime.test.ts`) now use consistent mocking patterns with `jest.MockedFunction` and proper type casting with `as unknown as` for complex type conversions. The `Argument of type 'never'.` errors were resolved by properly typing mock return values and using appropriate type assertions.
- **Solution**: Implemented consistent mocking patterns, removed `as any` usage, added proper TypeScript interfaces, and used `jest.MockedFunction` for better type safety.
- **Affected Files**: 
  - `__tests__/backend/claims.test.ts`
  - `__tests__/backend/auth.test.ts`
  - `__tests__/backend/userManagement.test.ts`
  - `__tests__/backend/overtime.test.ts`
- **Related**: See TDL [2025-05-29] Add Integration Test Scaffolding for API Routes


#### `any` Type Usage in Frontend Data Fetching
- **Status**: Resolved
- **Priority**: Medium
- **Tags**: `#typescript`, `#data-fetching`, `#type-safety`
- **Description**: The data fetching logic in the dashboard and my submissions pages uses `any` types in the `.map()` functions when processing the API responses. This reduces type safety and makes the code harder to maintain. The error handling in the catch blocks also uses `any` for the error type.
- **Affected Files**:
  - `src/app/dashboard/page.tsx`
  - `src/app/my-submissions/page.tsx`

#### `any` Type Usage in Time Picker Components
- **Status**: Resolved (for TimePicker.tsx)
- **Priority**: Low
- **Tags**: `#typescript`, `#component`, `#form`
- **Description**: The `field` prop in `TimePicker.tsx` was typed as `any` but has been updated to use `ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>`. The `any` type still exists in the superseded `TimeRangePicker.tsx`.
- **Affected Files**:
 - `src/components/TimePicker.tsx`
 - `src/components/TimeRangePicker.tsx` (Superseded)


---

## TODOs

#### Implement Time Picker Component
- **Status**: Resolved (Initial implementation using `TimePicker`)
- **Priority**: Medium
- **Tags**: `#ux`, `#component`
- **Description**: Implemented a `TimePicker` component using ShadCN UI. The `TimeRangePicker` component was superseded by using two instances of `TimePicker`.
- **Affected Files**:
  - `src/components/TimePicker.tsx`
  - `src/components/TimeRangePicker.tsx` (Superseded)
  - `src/app/submit/overtime/page.tsx`

#### Refine Time Picker Component
- **Status**: Resolved
- **Priority**: Low
- **Tags**: `#component`, `#ux`, `#typescript`
- **Description**: Refine the `TimePicker` component UI and logic. Address the `any` type for the `field` prop, replacing it with `ControllerRenderProps` from `react-hook-form`.
- **Affected File**: `src/components/TimePicker.tsx`

#### Enhance File Uploader Component
- **Status**: Open
- **Priority**: Medium
- **Tags**: `#component`, `#upload`, `#ux`
- **Description**: Add functionality for file preview and removal in the `FileUploader` component.
- **Affected File**: `src/components/FileUploader.tsx`

#### Implement Full API Integration Details
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#api`, `#ux`, `#feedback`
- **Description**: Add comprehensive error handling, success messages, and redirection logic after form submissions and data fetching.
- **Affected Files**:
  - `src/app/submit/expense/page.tsx`
  - `src/app/submit/overtime/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/my-submissions/page.tsx`
  - `src/app/manager/approvals/[id]/page.tsx`

#### Middleware Refactoring Plan
- **Status**: In Progress
- **Priority**: High
- **Tags**: `#middleware`, `#auth`, `#refactor`
- **Description**: Refactor the authentication and authorization middleware to improve code organization and maintainability.
- **Plan**:
  1. **Phase 1: Core Middleware Structure** (Completed)
     - Implement root-level middleware with role-based access control
     - Define protected routes and their required roles
     - Add superadmin role with full access
  2. **Phase 2: Code Organization**
     - Move route matchers to a separate config file
     - Create middleware utilities for common auth checks
     - Add TypeScript types for route configurations
  3. **Phase 3: Performance Optimization**
     - Implement route-based code splitting for middleware
     - Add caching for user roles to reduce database queries
     - Optimize matcher patterns for better performance
  4. **Phase 4: Testing & Documentation**
     - Add unit tests for middleware functions
     - Document the middleware architecture and usage
     - Create examples for common use cases
- **Affected Files**:
  - `src/middleware.ts`
  - `src/types/middleware.ts` (to be created)
  - `src/lib/middleware-utils.ts` (to be created)
  - `__tests__/middleware/` (to be created)

#### Implement Responsive Design
- **Status**: Open
- **Priority**: Low
- **Tags**: `#responsive`, `#layout`, `#design`
- **Description**: Ensure optimal display and user experience across various desktop and mobile screen sizes.
- **Affected Files**: All frontend component and page files

#### Fetch Actual User Name for Dashboard
- **Status**: Resolved
- **Priority**: Medium
- **Tags**: `#auth`, `#dashboard`, `#clerk`
- **Description**: Replace the placeholder user name on the dashboard with the actual logged-in user's name fetched from Clerk.
- **Affected File**: `src/app/dashboard/page.tsx`

#### Potentially Rename Submission Table Component
- **Status**: Resolved
- **Priority**: Low
- **Tags**: `#naming`, `#refactor`
- **Description**: Renamed `RecentSubmissionsTable` to `SubmissionTable` as it is used for both recent and all submissions.
- **Affected Files**:
  - `src/components/SubmissionTable.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/my-submissions/page.tsx`

#### Missing Overtime Backend Tests
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#test`, `#backend`, `#coverage`
- **Description**: Integration tests for the `/api/overtime/[id]` endpoints (GET, PATCH, DELETE) have been implemented in `__tests__/backend/overtime.test.ts`. The test file now includes comprehensive coverage for all overtime management endpoints with proper TypeScript typing and consistent mocking patterns.
- **Affected File**: `__tests__/backend/overtime.test.ts`

#### Improve Type Safety and Validation Testing in Backend Tests
- **Status**: Resolved
- **Priority**: Medium
- **Tags**: `#test`, `#backend`, `#typescript`, `#validation`
- **Description**: Backend tests have been updated to use proper TypeScript types instead of `any` casts. All test files now use `as unknown as Request` for type safety and include proper interfaces for mock data. The mocking patterns are consistent across all backend test files with better type safety.
- **Affected Files**:
  - `__tests__/backend/userManagement.test.ts`
  - `__tests__/backend/auth.test.ts`
  - `__tests__/backend/claims.test.ts`
  - `__tests__/backend/overtime.test.ts`


---

## Recent Bug Fixes

#### Persistent '0' in Expense Form Number Fields
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#form`, `#input`, `#ux`
- **Description**: Number input fields in `/submit/expense` showed persistent '0' values that couldn't be backspaced to empty. Users were forced to input a number before they could delete the '0'.
- **Solution**:
  - Modified `onChange` handlers to set `undefined` instead of `0` for empty fields
  - Updated value display logic to show empty string when value is `0`, `null`, or `undefined`
  - Changed default form values from `0` to `undefined`
- **Affected File**: `src/app/submit/expense/page.tsx`
- **Fixed**: 2025-06-04

#### Role-Based Data Filtering Issues
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#rbac`, `#permissions`, `#api`
- **Description**: Users (including superadmin and manager) could see all submissions instead of only their own when browsing `/dashboard` or `/my-submissions`. The correct behavior is that these user-facing pages should only show the current user's own submissions, while admin functions for viewing all data should be accessed via `/admin` routes.
- **Solution**:
  - Updated claims API: All users (including superadmin) see only their own claims via `/api/claims`
  - Updated overtime API: All users (including superadmin) see only their own requests via `/api/overtime`
  - Admin functions for viewing all submissions should use dedicated admin API routes
  - Fixed inconsistent role checking (was using deprecated `role` field instead of `roles` array)
- **Affected Files**:
  - `src/app/api/claims/route.ts`
  - `src/app/api/overtime/route.ts`
- **Fixed**: 2025-06-04

#### Submission Permission Restrictions
- **Status**: Resolved
- **Priority**: Medium
- **Tags**: `#rbac`, `#permissions`, `#api`
- **Description**: Only staff users could submit expense claims and overtime requests, but business requirements dictate that superadmin, admin, and manager roles should also be able to submit on behalf of themselves.
- **Solution**:
  - Updated both claims and overtime APIs to allow submissions from staff, manager, admin, and superadmin roles
  - Used proper `hasAnyRole()` method for consistent role checking across both endpoints
  - Added clearer error messages for forbidden access
- **Affected Files**:
  - `src/app/api/claims/route.ts`
  - `src/app/api/overtime/route.ts`
- **Fixed**: 2025-06-04

#### Deprecated Role Field Cleanup
- **Status**: Resolved
- **Priority**: Medium
- **Tags**: `#migration`, `#database`, `#cleanup`
- **Description**: Removed the deprecated `role` field from the User model and all API routes. The system now exclusively uses the new `roles` array for role-based access control, improving consistency and eliminating confusion between old and new role checking methods.
- **Solution**:
  - Removed deprecated `role` field from User model schema
  - Updated all API routes to use `hasRole()` and `hasAnyRole()` methods consistently
  - Fixed TypeScript type issues in User model methods
  - Created migration script to remove `role` field from existing database documents
  - Updated auth profile endpoint to return `roles` array instead of deprecated `role` field
- **Affected Files**:
  - `src/models/User.ts` - Removed deprecated field and fixed typing
  - `src/app/api/reports/route.ts` - Updated role checking
  - `src/app/api/overtime/[id]/route.ts` - Updated role checking
  - `src/app/api/audit-logs/route.ts` - Updated role checking
  - `src/app/api/files/[id]/route.ts` - Updated role checking
  - `src/app/api/config/rates/route.ts` - Updated role checking
  - `src/app/api/config/rates/[id]/route.ts` - Updated role checking
  - `src/app/api/auth/profile/route.ts` - Updated response format
  - `src/app/api/admin/users/userId/roles/route.ts` - Fixed auth usage
  - `scripts/migrations/removeDeprecatedRoleField.ts` - Database cleanup script
- **Fixed**: 2025-06-04

---

#### Expense Form Data Not Saving for New Submissions
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#form`, `#api`, `#data-structure`
- **Description**: When creating new expense claims via "Save as Draft" or "Submit Claim" buttons, the expense values (mileage, toll, petrol, meal, others) were not being saved correctly and showed as 0.00 in the submissions list. However, editing existing claims worked correctly.
- **Root Cause**: The form was sending expense data in a flat structure `{mileage: 5, toll: 10, ...}` for new submissions, but the API expected a nested structure `{expenses: {mileage: 5, toll: 10, ...}}`.
- **Solution**:
  - Fixed form submission logic to properly structure expense data for new claims
  - Ensured both new submissions and edits use the same nested data structure
  - Maintained proper `?? 0` fallback to convert `undefined` values to `0` for calculations
- **Affected File**: `src/app/submit/expense/page.tsx`
- **Fixed**: 2025-06-04

---

_Document Version: 1.12 • Last updated: 2025-06-04 by Code Mode_