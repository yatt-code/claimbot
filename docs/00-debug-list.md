# 🐛 ClaimBot Debug List & TODOs

This document tracks known bugs, errors, and pending implementation tasks.

---

## Known Issues

-   **Persistent TypeScript Type Errors in Expense Form:**
    -   **Description:** Type compatibility issues between `react-hook-form`, Zod, and optional number inputs persist in the expense form. Errors indicate a mismatch in expected types despite attempts to adjust the Zod schema and input `onChange` handlers.
    -   **Affected File:** `src/app/submit/expense/page.tsx`
    -   **Notes:** Requires further investigation into `react-hook-form` and Zod type interactions, potentially involving different schema definitions or manual type assertions.

---

## TODOs

-   **Implement Dedicated Date Picker Components:**
    -   **Description:** Replace native HTML date inputs with a more user-friendly date picker component.
    -   **Affected Files:** `src/app/submit/expense/page.tsx`, `src/app/submit/overtime/page.tsx`
-   **Implement Dedicated Time Range Picker Components:**
    -   **Description:** Replace native HTML time inputs with a dedicated time range picker component for overtime requests.
    -   **Affected File:** `src/app/submit/overtime/page.tsx`
-   **Enhance File Uploader Component:**
    -   **Description:** Add functionality for file preview and removal in the `FileUploader` component.
    -   **Affected File:** `src/components/FileUploader.tsx`
-   **Handle File Uploads Separately:**
    -   **Description:** Implement logic to upload files to the backend after the main form submission.
    -   **Affected Files:** `src/app/submit/expense/page.tsx`, `src/app/submit/overtime/page.tsx`
-   **Implement Full API Integration Details:**
    -   **Description:** Add comprehensive error handling, success messages, and redirection logic after form submissions and data fetching.
    -   **Affected Files:** `src/app/submit/expense/page.tsx`, `src/app/submit/overtime/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/my-submissions/page.tsx`
-   **Implement Responsive Design:**
    -   **Description:** Ensure optimal display and user experience across various desktop and mobile screen sizes.
    -   **Affected Files:** All frontend component and page files.
-   **Fetch Actual User Name for Dashboard:**
    -   **Description:** Replace the placeholder user name on the dashboard with the actual logged-in user's name fetched from Clerk.
    -   **Affected File:** `src/app/dashboard/page.tsx`
-   **Potentially Rename Submission Table Component:**
    -   **Description:** Consider renaming `RecentSubmissionsTable` to a more generic name like `SubmissionTable` as it's used for both recent and all submissions.
    -   **Affected Files:** `src/components/RecentSubmissionsTable.tsx`, `src/app/dashboard/page.tsx`, `src/app/my-submissions/page.tsx`

---

_Document Version: 1.0 • Last updated: 2025-05-29 by Architect_