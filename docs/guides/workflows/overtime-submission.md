---

**ClaimBot Workflows: Overtime Submission & Approval**

**1. Overview**

This document outlines the end-to-end workflow for submitting an overtime request, having it reviewed, and processed for approval or rejection within the ClaimBot system.

**2. Actors**

*   **Submitter (Staff/User):** Any authenticated user with the permission to create overtime requests (typically 'staff' role and above) and whose salary is verified.
*   **Approver (Manager/Finance/Admin):** Users with roles and permissions to review and approve/reject overtime requests (e.g., 'manager', 'finance', 'admin').

**3. Workflow Steps & Diagrams**

**3.1. Overtime Request Creation and Submission (by Submitter)**

1.  **Navigate to Submit Overtime Page:**
    *   The user navigates to the "Submit Overtime" page (e.g., [`/submit/overtime`](src/app/submit/overtime/page.tsx:1)).
2.  **Fill Overtime Details:**
    *   The user fills in the overtime request form, providing details such as date, start time, end time, and reason/justification for the overtime.
    *   **UI:** [`SubmitOvertimePage`](src/app/submit/overtime/page.tsx:1) component (structure inferred).
    *   **Logic:**
        *   Client-side validation for time formats, reason, and potentially business rules (e.g., weekday overtime start time).
        *   User's salary must be in 'verified' status (checked by the backend API).
3.  **Upload Attachments (Optional):**
    *   User uploads supporting documents if required (e.g., approval email, work logs) via a `FileUploader` component.
    *   **API Call:** `POST /api/files/upload` for each file, linking to the overtime document ID.
    *   **Model:** `File` metadata is created.
4.  **Submit Overtime Request:**
    *   User finalizes the request and clicks "Submit".
    *   **API Call:** `POST /api/overtime` with overtime details.
    *   **Model:** `Overtime` document is created. `status` is set to 'submitted'. Fields like `hoursWorked`, `rateMultiplier`, `hourlyRate`, and `totalPayout` are calculated by the backend based on user's verified salary, `RateConfig`, and overtime duration. User's `monthlyOvertimeHours` in the `User` model is updated.
    *   **Audit:** An `AuditLog` entry is created for overtime submission.
    *   **Validation:** Backend validates against monthly OT cap (18 hours) and weekday start time rules.

**Sequence Diagram: Overtime Creation & Submission**
```mermaid
sequenceDiagram
    participant User
    participant SubmitOvertimePage as UI: /submit/overtime
    participant FileUploader_Comp as UI: FileUploader
    participant FileUploadAPI as API: /api/files/upload
    participant OvertimeAPI as API: /api/overtime
    participant OvertimeModel as DB: Overtime Model
    participant UserModel as DB: User Model (for OT hours)
    participant AuditLogModel as DB: AuditLog Model

    User->>SubmitOvertimePage: Fills form details (date, times, reason)
    opt Attachments
        User->>FileUploader_Comp: Selects files
        loop For each file
            FileUploader_Comp->>FileUploadAPI: POST (file, linkedToCollection: 'overtime', linkedToDocumentId: 'temp_ot_id_or_later_update')
            FileUploadAPI-->>FileUploader_Comp: File ID / Success
        end
    end
    User->>SubmitOvertimePage: Clicks "Submit"
    SubmitOvertimePage->>OvertimeAPI: POST (overtimeData)
    OvertimeAPI->>OvertimeModel: Create Overtime Request (calculates hours, payout based on User salary & RateConfig)
    OvertimeModel-->>OvertimeAPI: Saved Overtime (with ID)
    OvertimeAPI->>UserModel: Update user.monthlyOvertimeHours
    UserModel-->>OvertimeAPI: User updated
    OvertimeAPI->>AuditLogModel: Create Log (action: 'created_overtime')
    AuditLogModel-->>OvertimeAPI: Log Saved
    OvertimeAPI-->>SubmitOvertimePage: Success/Error (e.g., salary not verified, OT cap exceeded)
    SubmitOvertimePage->>User: Shows confirmation/error
```

**3.2. Overtime Approval/Rejection (by Approver)**

1.  **Navigate to Approvals Page:**
    *   The Approver navigates to an approvals dashboard (e.g., [`/admin/approvals`](src/app/admin/approvals/page.tsx)).
    *   **UI:** Admin page listing pending submissions.
    *   **API Call (for list):** `GET /api/overtime` (with filters for 'submitted' status).
2.  **Select Overtime Request for Review:**
    *   Approver selects a specific overtime request.
    *   **UI:** Navigates to an overtime detail view (e.g., [`/admin/approvals/[id]` or `/overtime/[id]`](src/app/overtime/[id]/page.tsx) if it shows admin actions).
    *   **API Call (for detail):** `GET /api/overtime/[id]`.
3.  **Review Overtime Details & Attachments:**
    *   Approver examines all request information.
    *   **API Call (for attachments):** `GET /api/files/[fileId]`.
4.  **Approve or Reject:**
    *   Approver makes a decision.
    *   **UI:** Buttons for "Approve" / "Reject", remarks field.
    *   **API Call:** `POST /api/overtime/[id]/approve` with `status: 'approved'` or `status: 'rejected'` and optional `remarks`.
    *   **Model:** `Overtime` document is updated: `status` changes, `approvedBy`, `approvedAt`, and `remarks` are set.
    *   **Audit:** An `AuditLog` entry is created.
5.  **Notification (Implicit):**
    *   Submitter may be notified of the status change.

**Sequence Diagram: Overtime Approval/Rejection**
```mermaid
sequenceDiagram
    participant Approver
    participant AdminApprovalsPage as UI: /admin/approvals
    participant OvertimeDetailView as UI: /admin/approvals/[id] or /overtime/[id]
    participant OvertimeAPI_List as API: /api/overtime (list)
    participant OvertimeAPI_Detail as API: /api/overtime/[id] (detail)
    participant ApproveOvertimeAPI as API: /api/overtime/[id]/approve
    participant OvertimeModel as DB: Overtime Model
    participant AuditLogModel as DB: AuditLog Model

    Approver->>AdminApprovalsPage: Views pending overtime
    AdminApprovalsPage->>OvertimeAPI_List: GET (filter: status='submitted')
    OvertimeAPI_List-->>AdminApprovalsPage: List of pending overtime
    Approver->>AdminApprovalsPage: Selects an overtime request
    AdminApprovalsPage->>OvertimeDetailView: Navigate to detail
    OvertimeDetailView->>OvertimeAPI_Detail: GET /api/overtime/[id]
    OvertimeAPI_Detail-->>OvertimeDetailView: Overtime details & attachment IDs
    opt View Attachments
        OvertimeDetailView->>FileAPI: GET /api/files/[fileId] (for each attachment)
        FileAPI-->>OvertimeDetailView: File content
    end
    Approver->>OvertimeDetailView: Clicks "Approve" or "Reject" (adds remarks)
    OvertimeDetailView->>ApproveOvertimeAPI: POST (status: 'approved'/'rejected', remarks)
    ApproveOvertimeAPI->>OvertimeModel: Update Overtime (status, approvedBy, approvedAt, remarks)
    OvertimeModel-->>ApproveOvertimeAPI: Updated Overtime
    ApproveOvertimeAPI->>AuditLogModel: Create Log (action: 'approved_overtime'/'rejected_overtime')
    AuditLogModel-->>ApproveOvertimeAPI: Log Saved
    ApproveOvertimeAPI-->>OvertimeDetailView: Success/Error
    OvertimeDetailView->>Approver: Shows confirmation
```

**4. Data Models Involved**

*   **[`Overtime`](src/models/Overtime.ts:1):** Central model for storing overtime request data and its lifecycle.
*   **[`User`](src/models/User.ts:1):** Stores Submitter and Approver information. User roles, `salaryVerificationStatus`, `monthlySalary`/`hourlyRate`, `designation`, and `monthlyOvertimeHours` are critical.
*   **[`File`](src/models/File.ts:1):** Stores metadata for attachments.
*   **[`AuditLog`](src/models/AuditLog.ts:1):** Records actions related to overtime requests.
*   **[`RateConfig`](src/models/RateConfig.ts:1):** Used by the backend to determine the `rateMultiplier` for overtime payout calculations based on day type and user designation.

**5. Key RBAC Permissions Involved**

*   **Submitter:**
    *   `overtime:create`
    *   `overtime:update:own` (for drafts, if applicable, though current flow is direct submission)
    *   `files:upload`
*   **Approver:**
    *   `overtime:approve`
    *   `overtime:read:team` or `overtime:read:all`

---