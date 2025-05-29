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