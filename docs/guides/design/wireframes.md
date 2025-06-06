# ClaimBot System Wireframes

## Staff User Interface

### 1. Dashboard
The main landing page for staff members displaying recent activity and quick actions.

```
┌───────────────────────────────────────────────┐
│ Hello, Aiyad 👋 Today's Date: 2025-05-27       │
├───────────────────────────────────────────────┤
│ + Submit Expense   + Submit Overtime          │
├───────────────────────────────────────────────┤
│ 📄 My Recent Submissions                      │
│ ┌────────┬──────────────┬──────────┬───────┐  │
│ │ Date   │ Type         │ Status   │ View  │  │
│ ├────────┼──────────────┼──────────┼───────┤  │
│ │ 05/03  │ Expense      │ Approved │ 🔍    │  │
│ │ 05/10  │ Overtime     │ Pending  │ 🔍    │  │
│ └────────┴──────────────┴──────────┴───────┘  │
└───────────────────────────────────────────────┘
```

**Features:**
- Personalized greeting with current date
- Quick access buttons for expense and overtime submissions
- Recent submissions table with status tracking

---

### 2. Submit Expense Claim
Form interface for submitting expense reimbursement requests.

```
┌───────────────────────────────────────────────┐
│ 📥 Expense Claim Form                         │
├───────────────────────────────────────────────┤
│ Date: [📅]   Project: [__________]            │
│ Description: [___________________________]    │
├───────────────────────────────────────────────┤
│ Mileage (km): [  ]                            │
│ Toll:         [  ]     Petrol:   [  ]         │
│ Meal:         [  ]     Others:   [  ]         │
├───────────────────────────────────────────────┤
│ Attachments: [📎 Upload Receipt]              │
├───────────────────────────────────────────────┤
│ [💾 Save as Draft]   [🚀 Submit Claim]         │
└───────────────────────────────────────────────┘
```

**Expense Categories:**
- **Mileage**: Travel distance in kilometers
- **Toll**: Highway toll charges
- **Petrol**: Fuel expenses
- **Meal**: Food allowances
- **Others**: Miscellaneous expenses

**Actions:**
- Save draft for later completion
- Submit claim for approval

---

### 3. Submit Overtime Request
Interface for requesting overtime compensation approval.

```
┌───────────────────────────────────────────────┐
│ ⏱️ Overtime Request                           │
├───────────────────────────────────────────────┤
│ Date: [📅]   Start: [🕒]   End: [🕒]           │
│ Justification:                                │
│ [__________________________________________]  │
├───────────────────────────────────────────────┤
│ Attachments: [📎 Optional Proof]              │
├───────────────────────────────────────────────┤
│ [💾 Save Draft]      [🚀 Submit Request]       │
└───────────────────────────────────────────────┘
```

**Required Information:**
- Date and time range of overtime work
- Business justification for overtime
- Optional supporting documentation

---

### 4. My Submissions
Comprehensive view of all submitted claims and requests.

```
┌───────────────────────────────────────────────┐
│ 🗂️ My Submissions                             │
├────────┬────────────┬──────────┬─────────────┤
│ Date   │ Type       │ Status   │ Total (RM)  │
├────────┼────────────┼──────────┼─────────────┤
│ 05/03  │ Expense    │ Approved │ 84.70       │
│ 05/10  │ Overtime   │ Pending  │ 156.00      │
└────────┴────────────┴──────────┴─────────────┘
```

**Status Types:**
- **Approved**: Claim has been approved for payment
- **Pending**: Awaiting manager review
- **Rejected**: Claim requires revision or resubmission

---

## Manager Interface

### 5. Approval Dashboard
Central hub for managers to review and approve pending submissions.

```
┌───────────────────────────────────────────────┐
│ 🧾 Pending Approvals                          │
├────────┬────────────┬────────────┬───────────┤
│ User   │ Type       │ Date       │ Action    │
├────────┼────────────┼────────────┼───────────┤
│ Sarah  │ Expense    │ 05/15      │ 🔍 Review │
│ Mino   │ Overtime   │ 05/18      │ 🔍 Review │
└────────┴────────────┴────────────┴───────────┘
```

**Manager Capabilities:**
- View all pending submissions from team members
- Quick access to review detailed submission information
- Streamlined approval workflow

---

### 6. Submission Detail View
Detailed review interface for individual submissions.

```
┌───────────────────────────────────────────────┐
│ Submission: Sarah • Overtime • 3.5 hrs        │
├───────────────────────────────────────────────┤
│ Date: 2025-05-18   Time: 9:00PM–12:30AM       │
│ Justification: Deployment night patch         │
├───────────────────────────────────────────────┤
│ Attached Docs: 📎 screenshot-log.png          │
├───────────────────────────────────────────────┤
│ [✅ Approve] [❌ Reject] [💬 Add Comment]       │
└───────────────────────────────────────────────┘
```

**Review Actions:**
- **Approve**: Accept the submission for payment
- **Reject**: Decline the submission with reason
- **Add Comment**: Provide feedback or request clarification

---

## Admin Panel

### 7. Rate Configuration
Administrative interface for managing compensation rates and rules.

```
┌───────────────────────────────────────────────┐
│ ⚙️ Mileage & Overtime Rate Settings           │
├────────────────────┬─────────────────────────┤
│ Mileage Rate (RM/km): [ 0.50 ]               │
│ Designation: [Software Engineer]             │
│ Weekday: [1.0x]  Weekend: [1.5x]  Holiday: [3x]│
├───────────────────────────────────────────────┤
│ [➕ Add Rule]  [💾 Save Settings]              │
└───────────────────────────────────────────────┘
```

**Configuration Options:**
- **Mileage Rate**: Cost per kilometer for travel expenses
- **Overtime Multipliers**: Different rates based on day type
    - Weekday: Standard rate (1.0x)
    - Weekend: Premium rate (1.5x)
    - Holiday: Maximum rate (3.0x)

---

### 8. User Management
Administrative panel for managing system users and their roles.

```
┌───────────────────────────────────────────────┐
│ 👥 Manage Users                               │
├──────────┬─────────────┬────────────┬────────┤
│ Name     │ Role        │ Department │ Salary │
├──────────┼─────────────┼────────────┼────────┤
│ Aiyad    │ Admin       │ Tech       │ 4500   │
│ Sarah    │ Staff       │ Finance    │ 3200   │
└──────────┴─────────────┴────────────┴────────┘
│ [➕ Add User] [✏️ Edit] [🗑️ Delete]            │
└───────────────────────────────────────────────┘
```

**User Management Features:**
- Add new users to the system
- Edit existing user information
- Delete user accounts
- Manage role-based permissions

---

### 9. Audit Logs
System activity tracking for compliance and security monitoring.

```
┌───────────────────────────────────────────────┐
│ 📜 System Audit Logs                          │
├────────────┬───────────────┬─────────────────┤
│ Date       │ User          │ Action          │
├────────────┼───────────────┼─────────────────┤
│ 2025-05-20 │ Aiyad         │ Edited Rate     │
│ 2025-05-21 │ Sarah         │ Submitted Claim │
└────────────┴───────────────┴─────────────────┘
```

**Tracked Activities:**
- Configuration changes
- User submissions
- Approval decisions
- System administrative actions

---

### 10. Reports & Export
Data export and reporting functionality for financial analysis.

```
┌───────────────────────────────────────────────┐
│ 📊 Generate Monthly Report                    │
├───────────────────────────────────────────────┤
│ Select Month: [ May 2025 ▼ ]                 │
│ Department: [ All ▼ ]                        │
│ Type: [ Expense ☐ ] [ Overtime ☐ ]           │
├───────────────────────────────────────────────┤
│ [📥 Export Excel]   [📄 Export PDF]           │
└───────────────────────────────────────────────┘
```

**Report Customization:**
- **Time Period**: Monthly selection
- **Department Filter**: All departments or specific teams
- **Claim Types**: Expense claims, overtime requests, or both
- **Export Formats**: Excel spreadsheet or PDF document

---

_Document Version: 1.0 • Last updated: 2025-05-27 by Aiyad_
