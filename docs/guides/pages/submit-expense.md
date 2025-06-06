# SubmitExpensePage Guide

**Version**: 1.0  
**Last Updated**: June 6, 2025  
**Status**: Production Ready  
**Component Path**: [`src/app/submit/expense/page.tsx`](../../../src/app/submit/expense/page.tsx:1)

## Overview

The `SubmitExpensePage` is a client component responsible for handling the creation and editing of expense claims. It features a comprehensive form with dynamic fields, integration with location services for mileage calculation, support for trip templates, and file attachments.

## Purpose

*   Allow users to submit new expense claims with detailed information.
*   Allow users to edit their existing draft expense claims.
*   Provide an intuitive interface for inputting trip details, various expense types, and supporting documentation.
*   Automate mileage calculation based on trip origin and destination.
*   Enable users to utilize and save trip templates for frequently used routes.

## Key UI Components Used

*   [`StaffLayout`](../../../src/components/StaffLayout.tsx:1): Wraps the page content.
*   [`Form`](../../../src/components/ui/form.tsx:1) (from `react-hook-form` and `src/components/ui/form`): For overall form structure and field management.
*   [`Input`](../../../src/components/ui/input.tsx:1), [`Textarea`](../../../src/components/ui/textarea.tsx:1), [`DatePicker`](../../../src/components/DatePicker.tsx:1), [`Select`](../../../src/components/ui/select.tsx:1), [`Checkbox`](../../../src/components/ui/checkbox.tsx:1): For various input fields.
*   [`LocationAutocomplete`](../../../src/components/LocationAutocomplete.tsx:79): For origin and destination inputs. See [LocationAutocomplete Component Reference](../../reference/components/location-autocomplete.md).
*   [`FileUploader`](../../../src/components/FileUploader.tsx:1): For attaching supporting documents.
*   [`Button`](../../../src/components/ui/button.tsx:1): For actions like submit, save draft, save template.
*   [`Dialog`](../../../src/components/ui/dialog.tsx:1): For the "Save Trip Template" modal.

## Core Functionality & Logic

### Form Handling
*   Uses `react-hook-form` with `zodResolver` for form state management and validation.
*   The Zod schema (`expenseFormSchema`) defines validation rules for all fields, including conditional validation (e.g., origin required for 'custom' trip mode).

### Editing Drafts
*   Checks for an `edit` query parameter in the URL (e.g., `/submit/expense?edit=[claimId]`).
*   If `editId` is present, it fetches the existing claim data from `/api/claims/[editId]` and pre-fills the form.
*   Special handling (`isLoadingEditData`, `protectMileageField` state variables) to manage form state during data loading and prevent premature mileage recalculation.

### Trip Mode (`tripMode` field)
*   **`default`:** Origin is automatically set to the office location (fetched from environment variables `NEXT_PUBLIC_OFFICE_...`). The origin input is typically disabled or hidden.
*   **`custom`:** User can manually input or select a custom origin using `LocationAutocomplete`. The origin field becomes required.

### Mileage Calculation
*   **Trigger:** Automatically triggered when `tripMode`, `roundTrip`, `origin` (debounced text or `originLocation` object), or `destination` (debounced text or `destinationLocation` object) changes.
*   **Process:**
    1.  Determines origin coordinates:
        *   If `tripMode` is 'default', uses pre-configured office coordinates.
        *   If `tripMode` is 'custom' and `originLocation` (from autocomplete) is set, uses its coordinates.
        *   If `tripMode` is 'custom' and only `origin` text is available (and long enough), attempts to geocode the address via Google Maps API (`geocodeAddress` helper).
    2.  Determines destination coordinates similarly (using `destinationLocation` or geocoding `destination` text).
    3.  If both origin and destination coordinates are available:
        *   Calls `POST /api/mileage/calculate` with origin, destination, and `isRoundTrip` flag.
        *   The API returns the calculated distance.
        *   Updates `calculatedMileage` and `mileage` fields in the form.
        *   Displays feedback (e.g., "Estimated distance: X km").
        *   Shows a toast warning if the distance is unusually high.
*   **State:** `isCalculatingMileage` and `mileageCalculationFeedback` manage UI during calculation.

### Trip Templates
*   **Loading:** Fetches user-saved trip templates (`GET /api/saved-trip-templates`) and admin-defined trip templates (`GET /api/admin/trip-templates`) on component mount.
*   **Selection:** Displays templates in a `Select` dropdown. When a template is selected (`handleLoadTemplate`):
    *   Populates `origin`, `destination`, `roundTrip`, `originLocation`, and `destinationLocation` form fields from the template.
    *   This will trigger the mileage calculation.
*   **Saving:**
    *   A "Save Current Trip as Template" button/option opens a `Dialog`.
    *   User provides a `saveTemplateLabel`.
    *   On confirm (`handleSaveTemplate`):
        *   Calls `POST /api/saved-trip-templates` with current origin, destination, roundTrip status, and label.
        *   Refreshes the list of saved templates.

### Expense Fields
Standard input fields for `toll`, `petrol`, `meal`, `others`. Values are preprocessed to numbers (defaulting to 0 if empty).

### File Attachments
*   Uses the `FileUploader` component.
*   The `onSubmit` function handles iterating through `values.attachments` (a `FileList`) and uploading each file, associating the returned file IDs with the claim. This typically happens after the claim is initially saved to get a `claimId` to link attachments to.

### Submission Logic (`onSubmit` function)
*   Sets `isSubmitting` to true and shows a loading toast.
*   Determines if it's an edit (based on `editId` from `searchParams`) or a new claim.
*   Constructs `claimData` payload, ensuring expenses are numbers (defaulting to 0).
*   **API Calls:**
    *   Editing: `PATCH /api/claims/[editId]`
    *   New: `POST /api/claims`
*   Handles response, shows success/error toasts, and navigates to `My Submissions` page on success.

## State Management

*   `form`: Managed by `react-hook-form`.
*   `isSubmitting`: Boolean for submission loading state.
*   `savedTripTemplates`, `adminTripTemplates`: Arrays to store fetched templates.
*   `isCalculatingMileage`, `mileageCalculationFeedback`: For mileage calculation UI.
*   `isSaveTemplateDialogOpen`: Controls visibility of the save template dialog.
*   `isLoadingEditData`, `protectMileageField`: Manage form behavior when editing a draft.

## Key Dependencies

*   `react-hook-form`, `@hookform/resolvers/zod`, `zod`: For form handling and validation.
*   `react-hot-toast` (or `sonner`): For notifications.
*   `next/navigation` (`useRouter`, `useSearchParams`): For routing and query parameter access.
*   `use-debounce`: For debouncing input changes before triggering mileage calculation.
*   Custom components: [`LocationAutocomplete`](../../reference/components/location-autocomplete.md), [`FileUploader`](../../../src/components/FileUploader.tsx:1), [`DatePicker`](../../../src/components/DatePicker.tsx:1), UI primitives.
*   Various API endpoints (listed in functionality). See [API Reference](../../reference/api-routes.md).

## Environment Variables Used

*   `NEXT_PUBLIC_BASE_URL`: For constructing API call URLs.
*   `NEXT_PUBLIC_OFFICE_LAT`, `NEXT_PUBLIC_OFFICE_LNG`, `NEXT_PUBLIC_OFFICE_NAME`: For 'default' trip mode origin.
*   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Used by `LocationAutocomplete` and potentially `geocodeAddress` helper.

## Points to Note & Potential Issues

*   **Complexity:** This is a feature-rich and complex page. Understanding the interplay between form state, watched values, `useEffect` hooks for calculations and data fetching, and API calls is key.
*   **Mileage Calculation Flow:** The conditions under which mileage is calculated (and potentially reset) need to be clearly understood to avoid unexpected behavior, especially when editing drafts. The `protectMileageField` state aims to help with this.
*   **File Upload Process:** The exact sequence of saving claim data and then uploading/linking files needs to be documented from the full `onSubmit` function.
*   **Error Handling:** Robust error handling for API calls (mileage, templates, submission) is present using `toast` notifications.
*   **Geocoding Fallback:** The `geocodeAddress` function is a fallback if structured `LocationData` is not available from `LocationAutocomplete`. Its reliability depends on the Google Geocoding API and the quality of text input.
*   **Office Location:** Relies on client-side environment variables for the default office location. Ensure these are correctly set.

## User Experience Flow

1.  User navigates to `/submit/expense`.
2.  Form loads with default values.
3.  User selects date, enters project/description.
4.  User chooses `tripMode`:
    *   **Default:** Office origin is pre-filled. User enters destination.
    *   **Custom:** User enters both origin and destination.
5.  Mileage is auto-calculated as origin/destination/roundTrip changes.
6.  User enters amounts for other expenses (toll, petrol, etc.).
7.  User uploads attachments (receipts).
8.  User can save the current trip as a template.
9.  User can load an existing trip template.
10. User clicks "Save Draft" or "Submit Claim".
11. On success, user is redirected to "My Submissions".

## Related Documentation

- **[Claim Submission Workflow](../workflows/claim-submission.md)** - Overall business process
- **[LocationAutocomplete Component Reference](../../reference/components/location-autocomplete.md)** - For origin/destination inputs
- **[FileUploader Component Reference](../../reference/components/fileuploader.md)** (To be created) - For attachments
- **[API Reference](../../reference/api-routes.md)** - Backend endpoints used by this page
- **[Data Models](../../reference/data-models.md)** - `Claim`, `File`, `SavedTripTemplate`, `AdminTripTemplate` models

---

**Next Steps**: Review the [Claim Submission Workflow](../workflows/claim-submission.md) for a broader understanding of the claim process.