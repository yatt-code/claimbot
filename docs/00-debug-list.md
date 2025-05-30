# 🐛 ClaimBot Debug List & TODOs

This document tracks known bugs, errors, and pending implementation tasks.

---

## Known Issues

#### Persistent TypeScript Type Errors in Expense Form
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#form`, `#zod`, `#type-error`
- **Description**: Resolved by handling empty string conversion to undefined in input `onChange` and Zod `preprocess` for optional number fields.
- **Affected File**: `src/app/submit/expense/page.tsx`
- **Related**: See TDL [2025-05-30] Submit Expense Form Implementation


#### TypeScript Type Errors in Claims Backend Tests
- **Status**: Resolved
- **Priority**: High
- **Tags**: `#test`, `#typescript`, `#mocking`
- **Description**: Persistent TypeScript type compatibility issues exist within the backend claims tests (`__tests__/backend/claims.test.ts`), particularly related to the mocking of Mongoose document methods like `save`. An example is the error at line 138, where the type of the mocked `save` property does not fully match the expected `Mock` type from `jest-mock`. This indicates potential underlying issues with how Mongoose document instances and their methods are being mocked for testing.
- **Affected File**: `__tests__/backend/claims.test.ts`
- **Related**: See TDL [2025-05-29] Add Integration Test Scaffolding for API Routes

---

## TODOs

#### Implement Dedicated Time Range Picker Components
- **Status**: Open
- **Priority**: Medium
- **Tags**: `#ux`, `#component`
- **Description**: Replace native HTML time inputs with a dedicated time range picker component for overtime requests.
- **Affected File**: `src/app/submit/overtime/page.tsx`

#### Enhance File Uploader Component
- **Status**: Open
- **Priority**: Medium
- **Tags**: `#component`, `#upload`, `#ux`
- **Description**: Add functionality for file preview and removal in the `FileUploader` component.
- **Affected File**: `src/components/FileUploader.tsx`

#### Implement Full API Integration Details
- **Status**: In Progress
- **Priority**: High
- **Tags**: `#api`, `#ux`, `#feedback`
- **Description**: Add comprehensive error handling, success messages, and redirection logic after form submissions and data fetching.
- **Affected Files**: 
  - `src/app/submit/expense/page.tsx`
  - `src/app/submit/overtime/page.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/my-submissions/page.tsx`

#### Implement Responsive Design
- **Status**: Open
- **Priority**: Low
- **Tags**: `#responsive`, `#layout`, `#design`
- **Description**: Ensure optimal display and user experience across various desktop and mobile screen sizes.
- **Affected Files**: All frontend component and page files

#### Fetch Actual User Name for Dashboard
- **Status**: Open
- **Priority**: Medium
- **Tags**: `#auth`, `#dashboard`, `#clerk`
- **Description**: Replace the placeholder user name on the dashboard with the actual logged-in user's name fetched from Clerk.
- **Affected File**: `src/app/dashboard/page.tsx`

#### Potentially Rename Submission Table Component
- **Status**: Open
- **Priority**: Low
- **Tags**: `#naming`, `#refactor`
- **Description**: Consider renaming `RecentSubmissionsTable` to a more generic name like `SubmissionTable` as it's used for both recent and all submissions.
- **Affected Files**: 
  - `src/components/RecentSubmissionsTable.tsx`
  - `src/app/dashboard/page.tsx`
  - `src/app/my-submissions/page.tsx`

---

_Document Version: 1.0 • Last updated: 2025-05-29 by Architect_