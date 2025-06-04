# 🧠 ClaimBot Technical Decision Log (TDL)

### Format
- **[YYYY-MM-DD] Title**
- **Status**: Proposed | Accepted | Rejected | Deprecated
- **Context**: What problem are we solving?
- **Decision**: What did we choose and why?
- **Consequences**: Tradeoffs, side effects, impact on other areas

### When to log new technical decision entries?

Add a new TDL whenever you:
	•	Switch libraries (e.g., Mongoose → Prisma)
	•	Change core logic (e.g., salary-based rate computation update)
	•	Add optional flows (e.g., async OCR queue)
	•	Reject a proposal (document why not as well)
	•	Modify core schema (e.g., changing claim approval flow)
	•	Make a tradeoff decision (e.g., synchronous vs. async)


---

## Development Phase: 1

### [2025-05-26] Adopt TailwindCSS + ShadCN for UI
- **Status**: Accepted
- **Context**: Needed a scalable, modern frontend with consistent components.
- **Decision**: Chose TailwindCSS for utility-first styling and ShadCN UI for headless component logic.
- **Consequences**: Rapid UI development and flexibility, but requires knowledge of Tailwind conventions.

### [2025-05-27] Use Winston for Logging
- **Status**: Accepted
- **Context**: Required structured logs for debugging, audit trails, and potential production monitoring.
- **Decision**: Integrated Winston with different transports for dev (console) and prod (rotating files).
- **Consequences**: Simplified log tracking; extensible for external services like Datadog or ELK.

### [2025-05-27] Setup Swagger for API Documentation
- **Status**: Accepted
- **Context**: Needed to document internal API for developer clarity and testing.
- **Decision**: Chose Swagger UI with OpenAPI YAML spec served via `/api/docs` endpoint.
- **Consequences**: Easy endpoint testing and visibility, maintained via versioned `docs/swagger.yaml`.

### [2025-05-28] Integrate Clerk for Authentication
- **Status**: Accepted
- **Context**: Initial auth used custom JWT flow; needed secure, robust solution with less overhead.
- **Decision**: Replaced `/auth/login` and `/auth/register` with Clerk's prebuilt flows and middleware. Mapped Clerk user ID (`clerkId`) in internal user model.
- **Consequences**: Removed boilerplate logic; gained password recovery, MFA, and OAuth capabilities. Tied project identity to external provider.

### [2025-05-28] Adopt Next.js 15 with TypeScript
- **Status**: Accepted
- **Context**: Needed a modern, full-stack framework to support API routes, middleware, and frontend integration with Clerk and MongoDB.
- **Decision**: Adopted Next.js version 15 with TypeScript enabled by default for full type safety and seamless integration with React 19.
- **Consequences**: Improved DX and productivity, easier server/client hybrid development. Requires keeping up with new Next.js app router conventions.

### [2025-05-28] Adopt `src` Directory Structure

- **Status**: Accepted
- **Context**: Standardize project structure for better organization and maintainability in a Next.js application.
- **Decision**: Organized application code (app, lib, models) within a top-level `src` directory.
- **Consequences**: Aligns with common Next.js practices; requires updating import paths and `tsconfig.json` aliases.

### [2025-05-28] Choose Jest and Supertest for Backend Testing

- **Status**: Accepted
- **Context**: Needed a framework for unit and integration testing of backend API routes.
- **Decision**: Selected Jest as the test runner and Supertest for making HTTP requests to API endpoints in tests.
- **Consequences**: Provides a robust testing environment for backend logic; requires initial configuration and setup.

---

## Development Phase: 2

### [2025-05-28] Adopt Zod for Data Validation

- **Status**: Accepted
- **Context**: Needed a robust and type-safe library for validating API request payloads and other data structures.
- **Decision**: Integrated Zod to define schemas and validate incoming data in API routes.
- **Consequences**: Ensures data integrity and type safety; requires defining Zod schemas for relevant data structures.
---

### [2025-05-28] Implement Core Data Models
- **Status**: Accepted
- **Context**: Needed to define the structure for claims, overtime, files, and audit logs in MongoDB as per SDS.
- **Decision**: Created Mongoose schemas and models for `Claim`, `Overtime`, `File`, and `AuditLog` collections.
- **Consequences**: Provides a clear data structure for the application; requires maintaining schema definitions.

### [2025-05-28] Integrate Basic Audit Logging
- **Status**: Accepted
- **Context**: Required tracking of key user and system actions for auditability as per BRS.
- **Decision**: Implemented basic audit logging by creating an `AuditLog` Mongoose model and adding logging calls in relevant API routes (create, update, delete, submit, approve/reject for claims/overtime, file upload).
- **Consequences**: Provides a foundational audit trail; more detailed logging or a dedicated logging service might be needed for comprehensive production monitoring.

### [2025-05-29] Implement API Endpoints for Claims and Overtime
- **Status**: Accepted
- **Context**: Required API routes to allow staff to submit claims/overtime and managers to approve them.
- **Decision**: Created RESTful routes under `/api/claims` and `/api/overtime` including actions for `submit` and `approve`. Each action performs validation via Zod and logs to `AuditLog`.
- **Consequences**: Backend logic is now testable and modular. Additional roles and edge-case handling may be added later.

### [2025-05-29] Integrate File Upload and Retrieval System
- **Status**: Accepted
- **Context**: Claims and overtime submissions may include proof documents (receipts, screenshots, etc.).
- **Decision**: Built upload and download endpoints using Next.js API routes and Mongoose `File` model. Files are stored with metadata including MIME type and linked document ID.
- **Consequences**: System now supports file attachments for claims/overtime. Future consideration for cloud/offloaded storage.

### [2025-05-29] Add Integration Test Scaffolding for API Routes
- **Status**: Accepted
- **Context**: Need test coverage for claim and overtime logic as the system scales.
- **Decision**: Used Jest + Supertest to set up API test files and test flows like claim submission and approval.
- **Consequences**: Backend is testable and QA-ready. Requires CI integration in future phases.

---

## Development Phase: 3

### [2025-05-29] Integrate React Hook Form and Zod for Frontend Forms
- **Status**: Accepted
- **Context**: Needed a robust and type-safe solution for managing form state, validation, and submission on the frontend.
- **Decision**: Integrated React Hook Form for form management and used Zod with the `@hookform/resolvers/zod` resolver for schema-based validation.
- **Consequences**: Provides a structured approach to form handling and validation; requires defining Zod schemas for each form. Encountered some complex TypeScript type compatibility issues with optional number inputs that may require further investigation.

### [2025-05-29] Implement Basic Frontend Data Fetching
- **Status**: Accepted
- **Context**: Needed to display dynamic data from the backend APIs on frontend pages (Dashboard, My Submissions).
- **Decision**: Implemented basic data fetching logic using the native `fetch` API within Next.js App Router pages to retrieve claims and overtime data from backend endpoints.
- **Consequences**: Allows frontend to display backend data; requires handling loading states, errors, and potentially implementing a more sophisticated data fetching strategy (e.g., SWR, React Query) for better caching and state management in the future.

### [2025-05-30] Configure TailwindCSS and Initialize ShadCN UI
- **Status**: Accepted
- **Context**: Needed foundational styling and UI components to begin frontend development for staff-facing modules.
- **Decision**: Installed and configured TailwindCSS and initialized ShadCN UI using the CLI. Updated `postcss.config.mjs`, `globals.css`, and added `src/lib/utils.ts` as part of ShadCN setup.
- **Consequences**: Enables consistent, utility-first styling and provides headless UI components compatible with our design approach.

### [2025-05-30] Implement Global UI Components (Button, StatusBadge)
- **Status**: Accepted
- **Context**: Required reusable design tokens for actions and status indicators across the UI.
- **Decision**: Developed `Button` and `StatusBadge` components using ShadCN UI conventions, styled with Tailwind utility classes.
- **Consequences**: Simplifies UI consistency and promotes reusability across different modules and roles.

### [2025-05-30] Build Clerk-based Auth UI (Login, Register, Profile)
- **Status**: Accepted
- **Context**: Needed user-facing authentication interfaces.
- **Decision**: Leveraged Clerk’s prebuilt components to implement `Login`, `Register`, and `Profile` pages.
- **Consequences**: Saved dev time; ensures security best practices via Clerk’s platform. UI matches identity-based flow in SDS.

### [2025-05-30] Develop Staff Dashboard and Submission Listing
- **Status**: Accepted
- **Context**: Needed landing view for staff users with access to submission tools and tracking.
- **Decision**: Built dashboard layout with quick action buttons and integrated `RecentSubmissionsTable` with placeholder and dynamic data fetching from backend.
- **Consequences**: Gives staff a centralized view of recent activity; establishes frontend-backend connectivity.

### [2025-05-30] Create Submit Expense Form (with Validation and Upload)
- **Status**: Accepted
- **Context**: Enable staff to submit expense claims with supporting documentation.
- **Decision**: Designed a structured form using react-hook-form and Zod for validation. Integrated `FileUploader` and placeholder API submission logic.
- **Consequences**: Staff can input and validate claims in a structured format. Backend integration pending final data flow.

### [2025-05-30] Create Submit Overtime Form (with Validation and Upload)
- **Status**: Accepted
- **Context**: Enable staff to request overtime compensation with optional attachments.
- **Decision**: Created a Zod-validated form with `FileUploader`, `TimeInput`, and `Textarea` fields. Uses react-hook-form for logic.
- **Consequences**: Supports data collection for overtime with clear validation and future extensibility for complex conditions.

### [2025-05-30] Implement "My Submissions" Page with Dynamic Data
- **Status**: Accepted
- **Context**: Needed a centralized view for users to track their claim/overtime submission status.
- **Decision**: Created `My Submissions` page by integrating `RecentSubmissionsTable` with backend data fetching.
- **Consequences**: Provides real-time visibility into submission history. Establishes contract with claims/overtime API routes.

### [2025-05-30] Implement DatePicker Component and Integration
- **Status**: Accepted
- **Context**: Needed a user-friendly way for users to select dates in forms.
- **Decision**: Created a reusable `DatePicker` component by composing ShadCN `popover` and `calendar` components and integrated it into the Expense and Overtime submission forms.
- **Consequences**: Improved user experience for date selection; requires potential future enhancement for time selection.

### [2025-05-31] Implement TimePicker Component and Integration
- **Status**: Accepted
- **Context**: Needed a user-friendly way for users to select times in forms, specifically for overtime start and end times.
- **Decision**: Created a reusable `TimePicker` component using ShadCN `popover` and `input` components and integrated it into the Overtime submission form for both start and end times. The component was later refined to address TypeScript `any` type issues by making it generic and correctly typing the `field` prop.
- **Consequences**: Improved user experience for time selection; replaces native HTML time inputs and provides better type safety for form integration.

### [2025-05-31] Enhance File Uploader Component
- **Status**: Accepted
- **Context**: Needed to add file preview and removal functionality to the File Uploader component for better user experience.
- **Decision**: Implemented preview of selected files and a remove button for each file within the `FileUploader` component, integrating with `react-hook-form`'s `field.value` and `field.onChange`.
- **Consequences**: Users can now see and remove selected files before submission. Requires careful handling of `FileList` and `DataTransfer` objects.

### [2025-05-31] Rename Submission Table Component
- **Status**: Accepted
- **Context**: The `RecentSubmissionsTable` component was used for both recent and all submissions, making the name misleading.
- **Decision**: Renamed the component file from `RecentSubmissionsTable.tsx` to `SubmissionTable.tsx` and updated all import paths and component usages.
- **Consequences**: Improved code clarity and maintainability with a more accurate component name.


### [2025-05-31] Finalize Phase 3 and Defer Responsive Design
- **Status**: Accepted
- **Context**: Phase 3 development focused on desktop-first UI. Implementing full responsive design was evaluated as high effort relative to current needs.
- **Decision**: Defer responsive/mobile layout support to a later phase. Staff users primarily access the system from desktops and are comfortable with current layout.
- **Consequences**: Allows Phase 3 to close cleanly. A future phase will revisit responsiveness enhancements.

### [2025-05-31] Refactor TimePicker with Strong Type Support
- **Status**: Accepted
- **Context**: The `TimePicker` component used `any` for its `field` prop, creating a type safety issue in integration with React Hook Form.
- **Decision**: Made `TimePicker` a generic component accepting `TFieldValues`, and updated its props to use `ControllerRenderProps` from `react-hook-form`.
- **Consequences**: Resolved ESLint `no-explicit-any` issues and improved overall component reusability and safety.

### [2025-05-31] Strongly Type Data Fetching Logic
- **Status**: Accepted
- **Context**: Data fetching logic in Dashboard and My Submissions pages used `any`, leading to reduced type inference and IDE help.
- **Decision**: Introduced typed response interfaces for backend data fetches and refactored fetch logic in both pages.
- **Consequences**: Enhances readability, confidence in shape of remote data, and developer tooling support.

### [2025-05-31] Fetch and Display Logged-in User Name on Dashboard
- **Status**: Accepted
- **Context**: The dashboard used a placeholder for the user’s name instead of displaying the actual name from Clerk.
- **Decision**: Integrated Clerk’s `useUser()` hook to retrieve and display the authenticated user's name on the dashboard.
- **Consequences**: Improved personalization and correctness of dashboard greeting.

### [2025-05-31] Finalize API Integration with UX Feedback
- **Status**: Accepted
- **Context**: Form submissions were missing user feedback mechanisms like success messages and redirection after action completion.
- **Decision**: Implemented toast notifications, success handlers, and redirection logic for both Expense and Overtime forms.
- **Consequences**: Provides users with clear feedback and improved experience after submitting forms.

---

## Development Phase: 4

### [2025-06-02] Implement Manager Approval Dashboard
- **Status**: Accepted
- **Context**: Needed a dedicated view for managers to see and access pending claims and overtime submissions requiring their approval.
- **Decision**: Created the `src/app/manager/approvals/page.tsx` page and the `src/components/PendingSubmissionsList.tsx` component. Implemented data fetching to retrieve pending submissions and associated user details.
- **Consequences**: Managers have a centralized list of items awaiting their action. Requires implementing the detail view and action logic.

### [2025-06-02] Implement Submission Detail View for Managers
- **Status**: Accepted
- **Context**: Managers need to view full details of a submission (claims or overtime) and its attachments before approving or rejecting.
- **Decision**: Created the dynamic route `src/app/manager/approvals/[id]/page.tsx`. Developed components for displaying submission details (`src/components/SubmissionDetailCard.tsx`), attachments (`src/components/AttachmentViewer.tsx`), and action buttons (`src/components/ActionButtons.tsx`). Implemented data fetching for specific submissions and attachments, and added handler functions for approve/reject/comment actions.
- **Consequences**: Provides managers with necessary information and tools to evaluate submissions.

### [2025-06-02] Implement Admin Rate Configuration
- **Status**: Accepted
- **Context**: Administrators need to view and update system-wide rate configurations (e.g., overtime rates).
- **Decision**: Created the frontend page `src/app/admin/rates/page.tsx` with UI for displaying and editing rates. Implemented data fetching and update logic. Created the dynamic backend API route `src/app/api/config/rates/[id]/route.ts` to handle updating individual rates via PATCH requests.
- **Consequences**: Provides administrators with control over system rates.

### [2025-06-02] Implement Admin User Management
- **Status**: Accepted
- **Context**: Administrators need to manage user accounts (view, create, update, delete).
- **Decision**: Developed frontend pages for listing users (`src/app/admin/users/page.tsx`), viewing/editing users (`src/app/admin/users/[id]/page.tsx`), and creating new users (`src/app/admin/users/new/page.tsx`). Verified that existing backend API routes (`src/app/api/users/route.ts` and `src/app/api/users/[id]/route.ts`) support these operations with appropriate authorization.
- **Consequences**: Provides administrators with full control over user accounts.

### [2025-06-02] Implement Audit Logs View
- **Status**: Accepted
- **Context**: Administrators need to view a log of key system activities for auditing and troubleshooting.
- **Decision**: Created the frontend page `src/app/admin/audit-logs/page.tsx` to display audit log entries. Implemented the backend API route `src/app/api/audit-logs/route.ts` with a GET handler to fetch audit logs from the database, including necessary authentication and authorization.
- **Consequences**: Provides administrators with visibility into system activities.
---

## Development Phase: 5

### [2025-06-03] Enhanced RBAC System with Superadmin Role
- **Status**: Accepted
- **Context**: The original RBAC system had limitations: single role per user, no way to combine admin and manager permissions, and inflexible permission checking. The superadmin role was added to solve the need for accounts with both administrative and managerial capabilities.
- **Decision**: Implemented a comprehensive RBAC system with:
  - Migration from single `role` field to `roles` array for multiple role support
  - Introduction of `superadmin` role with all permissions
  - Permission-based access control system with hierarchical inheritance
  - Enhanced middleware with better error handling and route protection
  - Frontend hooks (`useRBAC`) for role-based UI rendering
  - Role management utilities for admin interfaces
  - Migration scripts for backward compatibility
- **Consequences**: 
  - **Benefits**: Flexible role assignment, better security, clearer permission model, easier to extend
  - **Tradeoffs**: More complex role management UI needed, requires data migration, slightly more complex permission checking logic
  - **Technical Debt**: Need to update all API routes to use new permission system, update documentation

### [2025-06-03] Implement Permission-Based Authorization
- **Status**: Accepted
- **Context**: Moving from simple role checking to granular permission-based authorization for better security and flexibility.
- **Decision**: Created a permission system where roles inherit permissions and specific actions are protected by permissions rather than roles. Example permissions: `users:create`, `claims:approve`, `reports:read:all`, `roles:manage`.
- **Consequences**: More granular control over access, easier to modify permissions without changing role logic, clearer separation of concerns between authentication and authorization.

### [2025-06-03] Implement Role Hierarchy System
- **Status**: Accepted
- **Context**: Need a clear hierarchy where higher roles inherit permissions from lower roles, reducing complexity in permission management.
- **Decision**: Established role hierarchy: staff(1) < manager(2) < finance(3) < admin(4) < superadmin(5). Higher roles automatically inherit permissions from lower roles.
- **Consequences**: Simplified permission management, clearer role relationships, but requires careful consideration when adding new roles or changing hierarchy.

### [2025-06-03] Enhanced Middleware with Route Protection
- **Status**: Accepted
- **Context**: The original middleware had basic route protection but lacked granular control and proper error handling.
- **Decision**: Redesigned middleware to use the new RBAC system with:
  - Route-specific permission checking
  - Better error messages and logging
  - Support for both role and permission-based protection
  - Proper handling of API vs page routes
- **Consequences**: Better security, clearer access control, improved user experience with better error messages, but requires updating route configurations.

### [2025-06-03] Implement Type-Safe Authentication Utilities
- **Status**: Accepted
- **Context**: Previous auth utilities used unsafe `as any` type assertions when accessing Clerk's session claims, causing TypeScript errors and reducing type safety.
- **Decision**: Created proper TypeScript interfaces for Clerk session claims and implemented a centralized `extractRolesFromSession()` helper function to safely extract user roles. Updated all auth utilities and middleware to use type-safe role extraction.
- **Consequences**:
  - **Benefits**: Eliminated all `as any` assertions, improved type safety, better IDE support and error detection
  - **Tradeoffs**: Slightly more verbose code, requires maintaining custom type definitions for Clerk session structure
  - **Impact**: All authentication-related code now has proper typing, reducing runtime errors

### [2025-06-03] Enhanced User Experience with Toast Notifications
- **Status**: Accepted
- **Context**: Access denied errors were displayed as ugly URL parameters (`?error=access_denied&message=...`), creating poor user experience and exposing error details in browser history.
- **Decision**: Implemented professional error handling system using:
  - `react-hot-toast` integration for clean toast notifications
  - Dedicated `/access-denied` page with auto-redirect functionality
  - `ErrorHandler` component to convert URL-based errors to toast notifications
  - Updated middleware to redirect to clean URLs instead of adding error parameters
- **Consequences**:
  - **Benefits**: Professional user experience, clean URLs, no sensitive error information in browser history, better visual feedback
  - **Tradeoffs**: Additional dependency on `react-hot-toast`, slightly more complex error handling flow
  - **UX Impact**: Users now see clean, professional error messages with appropriate visual feedback instead of technical error URLs

### [2025-06-03] Unified Adaptive Admin Dashboard Architecture
- **Status**: Accepted
- **Context**: Originally had separate `/admin` and `/manager` interfaces with different layouts, navigation, and functionality. This created code duplication, inconsistent user experience, and made it difficult for users with multiple roles (like superadmins) to access all features efficiently.
- **Decision**: Implemented a unified adaptive dashboard system under `/admin` with:
  - **Unified AdminLayout**: Single layout component with role-based navigation filtering
  - **Permission-based components**: All admin pages now use consistent RBAC checking with graceful access denied screens
  - **Role-adaptive functionality**: Same routes show different data/actions based on user permissions (e.g., analytics shows basic vs full data)
  - **Legacy route migration**: `/manager/*` routes now redirect to `/admin/*` equivalents
  - **Granular permission system**: Added specific permissions for admin sections (`config:update`, `analytics:read:basic`, etc.)
- **Consequences**:
  - **Benefits**: Single entry point for all admin tasks, consistent UI/UX, reduced code duplication, better role scalability, unified navigation
  - **Tradeoffs**: More complex permission checking logic, required migration of existing manager functionality, larger initial refactoring effort
  - **Architecture Impact**: All administrative interfaces now follow the same pattern, making future admin features easier to implement and maintain

### [2025-06-03] Enhanced RBAC with Analytics Permissions
- **Status**: Accepted
- **Context**: Added new analytics dashboard with different data access levels based on user roles (managers see basic metrics, admins see full analytics, finance sees financial data).
- **Decision**: Extended RBAC system with analytics-specific permissions:
  - `analytics:read:basic` for managers (team metrics, approval rates)
  - `analytics:read:full` for admins (comprehensive insights, trends, categories)
  - `analytics:read:financial` for finance role (monetary data access)
  - Enhanced route protection for `/admin/analytics` endpoint
- **Consequences**: Enables role-appropriate data visualization while maintaining security boundaries. Analytics dashboard adapts to show relevant information without exposing sensitive data to unauthorized users.

### [2025-06-03] Component-Level RBAC Integration
- **Status**: Accepted
- **Context**: Previous pages had minimal permission checking and showed generic error messages. Needed consistent, professional access control across all admin components.
- **Decision**: Standardized all admin pages to use:
  - `useRBAC()` hook for permission checking
  - Consistent access denied screens with professional messaging
  - Permission-based UI element rendering (buttons, sections, navigation items)
  - Loading states and error handling patterns
- **Consequences**: Professional user experience with clear access boundaries, consistent security model across all components, but requires updating all existing admin pages to follow the new patterns.

### [2025-06-03] Resolve Clerk-MongoDB Role Synchronization Issues
- **Status**: Accepted
- **Context**: Critical production issue where user roles stored in MongoDB were not synchronized with Clerk's `publicMetadata`, causing middleware and API route protection failures. Users with valid roles in database were getting "access denied" errors.
- **Decision**: Implemented comprehensive role synchronization system:
  - Created debug API endpoints (`/api/debug/check-clerk-user`, `/api/debug/sync-roles`) for troubleshooting
  - Built role sync utilities to force-update Clerk `publicMetadata` from MongoDB roles
  - Updated middleware to use `clerkClient().users.getUser()` instead of cached session claims
  - Enhanced API route protection to fetch fresh user data from Clerk
  - Added retry logic and fallback mechanisms for intermittent Clerk API failures
- **Consequences**:
  - **Benefits**: Resolved critical access control failures, improved system reliability, better error handling for network issues
  - **Tradeoffs**: Additional API calls to Clerk for role verification, slightly increased latency for protected routes
  - **Technical Impact**: All role-based access now works reliably, but requires maintaining sync between MongoDB and Clerk

### [2025-06-03] Fix Next.js 15 Dynamic Route Parameter Handling
- **Status**: Accepted
- **Context**: Next.js 15 introduced breaking changes requiring `params` to be awaited in dynamic API routes. Existing code was causing "[object Object]" errors and 400 Bad Request responses.
- **Decision**: Updated all dynamic API routes to properly handle async params:
  - Modified `/api/users/[id]/route.ts` to await params before destructuring
  - Fixed frontend logic to handle populated MongoDB ObjectIds vs string IDs
  - Updated approval detail page to detect populated user objects and avoid unnecessary API calls
  - Integrated new RBAC `protectApiRoute` utility for consistent authorization
- **Consequences**:
  - **Benefits**: Eliminated "[object Object]" errors, proper Next.js 15 compatibility, improved type safety
  - **Tradeoffs**: Required updating multiple API routes and frontend components
  - **Compatibility**: System now fully compatible with Next.js 15 conventions

### [2025-06-03] Implement Professional Approval Workflow System
- **Status**: Accepted
- **Context**: Admin approval functionality was incomplete with missing API endpoints, broken approve/reject actions, and no UI for entering rejection remarks or comments.
- **Decision**: Built comprehensive approval workflow system:
  - Created dedicated approve endpoints (`/api/claims/[id]/approve`, `/api/overtime/[id]/approve`) supporting both approve and reject actions
  - Redesigned `ActionButtons` component with expandable forms for rejection remarks and comments
  - Implemented proper validation, error handling, and user feedback with toast notifications
  - Added audit logging for all approval actions with remarks tracking
  - Enhanced UI with color-coded sections and professional styling
- **Consequences**:
  - **Benefits**: Complete approval workflow, professional user experience, proper audit trail, clear rejection reasoning
  - **Tradeoffs**: More complex UI state management, additional API endpoints to maintain
  - **Business Impact**: Managers can now properly approve/reject submissions with documented reasoning, improving accountability

### [2025-06-03] Enhance Middleware Reliability with Retry Logic
- **Status**: Accepted
- **Context**: Intermittent Clerk API failures were causing random "access denied" redirects for valid users, creating poor user experience and unreliable system behavior.
- **Decision**: Enhanced middleware with robust error handling:
  - Implemented exponential backoff retry logic (up to 2 retries) for network failures
  - Added fallback mechanisms for critical admin routes when role verification fails
  - Improved error logging and debugging capabilities
  - Enhanced type safety for error handling without `any` types
- **Consequences**:
  - **Benefits**: More reliable access control, better user experience, reduced false access denials
  - **Tradeoffs**: Slightly increased latency for failed requests, more complex error handling logic
  - **Reliability Impact**: System now gracefully handles temporary network issues and Clerk API instability

### [2025-06-03] Standardize Admin UI with Consistent Layout System
- **Status**: Accepted
- **Context**: Admin reports and audit-logs pages had inconsistent styling and layout compared to other admin sections, creating poor user experience and maintenance overhead.
- **Decision**: Standardized all admin pages to use consistent `AdminLayout` pattern:
  - Updated `/admin/reports` and `/admin/audit-logs` to use `AdminLayout` wrapper
  - Implemented consistent permission checking with professional access denied screens
  - Enhanced table styling with ShadCN components for better visual consistency
  - Added proper loading states, error handling, and responsive design patterns
- **Consequences**:
  - **Benefits**: Consistent user experience across all admin sections, easier maintenance, professional appearance
  - **Tradeoffs**: Required refactoring existing pages, slightly more complex component structure
  - **UX Impact**: All admin functionality now follows the same design patterns and interaction models

---

## Development Phase: 6 - Location System Implementation

### [2025-06-05] Google Maps Directions API Integration Choice
- **Status**: Accepted
- **Context**: Needed accurate, real-world distance calculation for mileage claims instead of straight-line calculations that don't account for actual road routes, traffic patterns, or geographic obstacles.
- **Decision**: Implemented Google Maps Directions API integration via [`/api/mileage/calculate`](src/app/api/mileage/calculate/route.ts:1) endpoint:
  - Uses Google's road network data for precise distance calculations
  - Supports both coordinate pairs and address strings as input
  - Caches distance calculations to minimize API costs
  - Provides fallback handling for API failures
- **Consequences**:
  - **Benefits**: Highly accurate mileage calculations, industry-standard mapping data, reliable distance estimation
  - **Tradeoffs**: External API dependency, ongoing costs per calculation, requires API key management
  - **Business Impact**: Ensures fair and accurate mileage reimbursements based on actual travel distances

### [2025-06-05] Trip Mode Architecture Design
- **Status**: Accepted
- **Context**: Original complex `TripMode` enum system (6 modes) was confusing users and creating UX friction. Business analysis showed most trips fall into simple patterns.
- **Decision**: Simplified to intuitive trip mode system:
  - **Default Mode**: Office-to-destination with optional return trip checkbox
  - **Custom Mode**: Custom origin-to-destination with optional return trip
  - Replaced confusing enum values with clear, user-friendly labels
  - Streamlined form logic with conditional field rendering
- **Consequences**:
  - **Benefits**: Much clearer user experience, reduced form complexity, easier to understand trip patterns
  - **Tradeoffs**: Less granular trip type tracking, required refactoring existing trip logic
  - **UX Impact**: Users can now easily understand and select appropriate trip options without confusion

### [2025-06-05] LocationTemplate vs Custom Destination Approach
- **Status**: Accepted
- **Context**: Needed balance between admin control (consistent destinations) and user flexibility (custom locations) for expense claim locations.
- **Decision**: Implemented hybrid [`LocationTemplate`](src/models/LocationTemplate.ts:1) system:
  - Admin-controlled templates with predefined coordinates for common destinations
  - User ability to enter custom addresses when templates don't meet needs
  - Template dropdown with search/filter capabilities
  - Custom address geocoding via Google Maps API
- **Consequences**:
  - **Benefits**: Consistency for common locations, flexibility for unique trips, reduced data entry errors
  - **Tradeoffs**: More complex UI with template selection logic, admin maintenance overhead for templates
  - **Operational Impact**: Admins can standardize frequent destinations while users retain flexibility

### [2025-06-05] Mileage Calculation Automation Decision
- **Status**: Accepted
- **Context**: Manual mileage entry was prone to errors, inconsistencies, and potential fraud. Business required accurate, verifiable distance calculations.
- **Decision**: Implemented read-only mileage field with automatic calculation:
  - Mileage field locked for staff users (admin override available)
  - Real-time calculation display with "Estimated distance: X km (via Google Maps)" feedback
  - Clear visual indicators (disabled styling) to show field is auto-calculated
  - Integration with trip mode selection for dynamic recalculation
- **Consequences**:
  - **Benefits**: Eliminates manual errors, ensures consistency, provides audit trail for calculations
  - **Tradeoffs**: Reduced user control, dependency on Google Maps API availability
  - **Compliance Impact**: Automated calculations provide verifiable audit trail for expense justification

### [2025-06-05] Admin vs User-Controlled Destination Management
- **Status**: Accepted
- **Context**: Needed to balance administrative control over common destinations with user autonomy for unique travel requirements.
- **Decision**: Implemented tiered destination management system:
  - **Admin Level**: [`AdminTripTemplate`](src/models/AdminTripTemplate.ts:1) for organization-wide common routes
  - **User Level**: [`SavedTripTemplate`](src/models/SavedTripTemplate.ts:1) for personal frequently-used routes
  - **Global Templates**: Available to all users via `/admin/trip-templates` management
  - **Personal Templates**: User-specific via `/api/saved-trip-templates` endpoints
- **Consequences**:
  - **Benefits**: Standardization for common business travel, personalization for individual needs, reduced duplicate data entry
  - **Tradeoffs**: More complex template management UI, additional database collections to maintain
  - **Scalability Impact**: System can grow with organization needs while maintaining user productivity

---