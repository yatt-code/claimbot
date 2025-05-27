# 🧩 ClaimBot Component Specification & Flow Reference

## Shared Type Definitions

### Submission (Used in Staff Dashboards & Histories)
```ts
type Submission = {
  date: string;
  type: "Expense" | "Overtime";
  status: "Approved" | "Pending" | "Rejected";
  total: number;
}
```

### PendingItem (Used in Manager Approval Lists)
```ts
type PendingItem = {
  user: string;
  type: "Expense" | "Overtime";
  date: string;
}
```

---

# ClaimBot UI Component Specifications & Flow Companion

## Reference Document
- **Linked to:** `02-sds-claimbot.md` (System Design Spec)
- **Wireframe Basis:** `03-wireframe-claimbot.md`

---

## 1. Global Components

### Button Component
| Property | Type | Description |
|----------|------|-------------|
| `variant` | `string` | Button style: `primary`, `secondary`, `ghost` |
| `icon` | `string` | Optional icon position: `start` or `end` |
| `onClick` | `function` | Click event handler |

### StatusBadge Component
| Status | CSS Classes |
|--------|-------------|
| `approved` | `bg-green-100 text-green-800` |
| `pending` | `bg-yellow-100 text-yellow-700` |
| `rejected` | `bg-red-100 text-red-800` |

**Additional States:**
- `draft`: `bg-gray-100 text-gray-800`

---

## 2. Staff Components

> 🔗 See: `03-wireframe-claimbot.md` → Section 1. Dashboard

### Staff Dashboard (`/dashboard`)
- **Component:** `RecentSubmissionsTable`
- **Props:** `submissions[]`

> 🔗 See: `03-wireframe-claimbot.md` → Section 1. Dashboard

### Submit Expense Form (`/submit/expense`)
- **Components:** `ExpenseForm`, `FileUploader`
- **Fields:**
    - `date` (date picker)
    - `project`, `description`
    - `mileage`, `toll`, `petrol`, `meal`, `others`
    - `attachments[]`
- **Actions:** `SaveDraft()`, `SubmitClaim()`

> 🔗 See: `03-wireframe-claimbot.md` → Section 2. Submit Expense Claim

### Submit Overtime Form (`/submit/overtime`)
- **Components:** `OvertimeForm`, `TimeRangePicker`, `JustificationTextArea`
- **Fields:**
    - `date`, `start`, `end`
    - `justification`
    - `attachments[]`
- **Actions:** `SaveDraft()`, `SubmitRequest()`

> 🔗 See: `03-wireframe-claimbot.md` → Section 3. Submit Overtime Request

### My Submissions (`/my-submissions`)
- **Component:** `SubmissionHistoryTable`
- **Columns:** date, type, status, amount, action (View)

> 🔗 See: `03-wireframe-claimbot.md` → Section 4. My Submissions

---

## 3. Manager Components

> 🔗 See: `03-wireframe-claimbot.md` → Section 5. Approval Dashboard

### Approval Dashboard (`/manager/approvals`)
- **Component:** `PendingSubmissionsList`
- **Columns:** user, type, date, action (🔍 Review)

> 🔗 See: `03-wireframe-claimbot.md` → Section 5. Approval Dashboard

### Submission Detail View (`/manager/approvals/:id`)
- **Components:**
    - `SubmissionDetailCard`
    - `AttachmentViewer`
    - `ActionButtons` (approve, reject, comment)

> 🔗 See: `03-wireframe-claimbot.md` → Section 6. Submission Detail View

---

## 4. Admin Panel Components

> 🔗 See: `03-wireframe-claimbot.md` → Section 7. Rate Configuration

### Rate Configuration (`/admin/rates`)
- **Component:** `RateConfigForm`
- **Fields:**
    - `mileageRate` (decimal)
    - `designation`, `weekdayRate`, `weekendRate`, `holidayRate`
- **Actions:** `AddRule()`, `SaveSettings()`

> 🔗 See: `03-wireframe-claimbot.md` → Section 7. Rate Configuration

### User Management (`/admin/users`)
- **Component:** `UserTable`
- **Columns:** name, role, department, salary, actions (✏️🗑️)
- **Actions:** `AddUserModal`, `EditUserModal`

> 🔗 See: `03-wireframe-claimbot.md` → Section 8. User Management

### Audit Logs (`/admin/logs`)
- **Component:** `AuditLogTable`
- **Columns:** date, user, action

> 🔗 See: `03-wireframe-claimbot.md` → Section 9. Audit Logs

### Reports & Export (`/admin/reports`)
- **Component:** `ReportFilterPanel`, `ExportButtons`
- **Filters:** month, department, type
- **Actions:** `ExportCSV()`, `ExportPDF()`

> 🔗 See: `03-wireframe-claimbot.md` → Section 10. Reports & Export

---

## 5. User Flow Screens

### Staff Expense Flow
```
1. /dashboard
2. Click "Submit Expense" → /submit/expense
3. Fill form and submit
4. Redirect → /my-submissions
5. Status progression: Draft → Submitted → Approved
```

### Staff Overtime Flow
```
1. /dashboard
2. Click "Submit Overtime" → /submit/overtime
3. Fill form and submit
4. View status in /my-submissions
```

### Manager Approval Flow
```
1. /manager/approvals
2. Click 🔍 Review → /manager/approvals/:id
3. Review submission and take action (approve/reject/comment)
```

### Admin Workflow
```
1. /admin/users → Manage user accounts
2. /admin/rates → Update calculation rates
3. /admin/logs → Monitor system activity
4. /admin/reports → Export summaries and reports
```

---

_Document Version: 1.0 • Last updated: 2025-05-27 by Aiyad_