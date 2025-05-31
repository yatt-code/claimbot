# System Design Specification (SDS)

## Project Information
- **Project Title:** Internal Claims & Overtime Management System
- **Date:** May 2025
- **Prepared By:** Aiyad

---

## 1. Purpose

This SDS provides a comprehensive technical blueprint for building the Internal Claims & Overtime Management System. It translates the business requirements (BRS) into technical specifications, database schemas, API behaviors, and UI component architecture suitable for implementation using a MERN (MongoDB, Express, React, TypeScript, Node.js) stack with TailwindCSS + ShadCN UI.

---

## 2. System Architecture Overview

### Frontend
- React.js with TypeScript, TailwindCSS & ShadCN UI
- Responsive layout with light/dark mode
- Designed with responsive layout (Tailwind + ShadCN), optimized for desktop-first workflows, mobile supported where needed.

### Backend
- Node.js + Express RESTful API
- Auth: Handle by Clerk
- API Rate Limiting: Express middleware (e.g., `express-rate-limit`) to throttle requests and prevent abuse.
- API documentation will be generated using **Swagger** (OpenAPI 3.0 compliant) for endpoint visibility and testing.

### Database
- MongoDB Atlas
- Collections: `users`, `claims`, `overtime`, `rates_config`, `files`, `audit_logs`

---

## 3. MongoDB Collections Schema

### 3.1 Users Collection

```javascript
{
  _id: ObjectId,
  clerkId: "user_xyz123", // Clerk's internal ID
  name: "Aiyad Zamir",
  email: "aiyad@objectexpression.com",
  department: "Management",
  designation: "Technical Consultant",
  role: "staff", // or "manager", "finance", "admin"
  salary: 4500,
  hourlyRate: 4500 / 173,
  isActive: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

> *Note:* The `users` collection is extended from Clerk identities using the `clerkId` field as the foreign key. This ensures user records are easily mapped and queried using Clerk's user identity.

### 3.2 Claims Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: ISODate,
  project: "HIMS Migration",
  description: "KPKT site visit",
  expenses: {
    mileage: 20,
    toll: 3.20,
    petrol: 10.00,
    meal: 12.00,
    others: 5.00
  },
  mileageRate: 0.5,
  totalClaim: 40.20,
  attachments: [ObjectId],
  status: "draft", // or "submitted", "approved", "rejected", "paid"
  submittedAt: ISODate,
  approvedBy: ObjectId,
  approvedAt: ISODate,
  remarks: "",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.3 Overtime Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: ISODate,
  startTime: "18:00",
  endTime: "21:30",
  reason: "Night deployment",
  hoursWorked: 3.5,
  rateMultiplier: 1.5,
  hourlyRate: 26.01,
  totalPayout: 91.04,
  attachments: [ObjectId],
  status: "submitted", // or "approved", "rejected", "paid"
  approvedBy: ObjectId,
  approvedAt: ISODate,
  remarks: "",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.4 Rates Configuration Collection

```javascript
{
  _id: ObjectId,
  type: "mileage",
  value: 0.50,
  effectiveDate: ISODate
},
{
  _id: ObjectId,
  type: "overtime_multiplier",
  condition: {
    dayType: "weekend",
    designation: "Software Engineer"
  },
  multiplier: 1.5,
  effectiveDate: ISODate
}
```

### 3.5 Files Collection

```javascript
{
  _id: ObjectId,
  filename: "receipt.png",
  mimetype: "image/png",
  path: "/uploads/2025/05/receipt.png",
  uploadedBy: ObjectId,
  linkedTo: {
    collection: "claims",
    documentId: ObjectId
  },
  uploadedAt: ISODate
}
```

### 3.6 Audit Logs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: "approved_claim",
  target: {
    collection: "claims",
    documentId: ObjectId
  },
  details: "Approved by manager.",
  timestamp: ISODate
}
```

---

## 4. API Endpoints Summary

### Authentication
- Login handled by Clerk `signIn()` // POST /auth/login
- Register handled by Clerk `signUp` // POST /auth/register
- `GET /auth/profile` // Fetches from Clerk

### Users
- `GET /users`
- Clerk should now handle user creation // POST /users
- `PATCH /users/:id`
- `DELETE /users/:id`

### Claims
- `GET /claims`
- `POST /claims`
- `PATCH /claims/:id`
- `DELETE /claims/:id`
- `POST /claims/:id/submit`
- `POST /claims/:id/approve`

### Overtime
- `GET /overtime`
- `POST /overtime`
- `PATCH /overtime/:id`
- `POST /overtime/:id/submit`
- `POST /overtime/:id/approve`

### Rates Configuration
- `GET /config/rates`
- `POST /config/rates`

### Files
- `POST /upload`
- `GET /file/:id`

### Audit Logs
- `GET /logs`

### Miscellaneous
- `POST /auth/reset` — Initiate password reset (email-based)
- `POST /auth/reset/confirm` — Confirm password reset with token

---

## 5. User Interface & Wireframes

*Styled using TailwindCSS + ShadCN UI*

### 5.1 Staff Dashboard

```
+ Submit Expense  + Submit Overtime
────────────────────────────────────
📄 My Submissions
| Date | Type     | Status   | View |
|------|----------|----------|------|
| 5/1  | Expense  | Approved | 🔍   |
| 5/3  | Overtime | Pending  | 🔍   |
```

### 5.2 Submit Expense Form

```
📥 Expense Form
─────────────────────────────
[Date]   [Project]
[Description Textarea]
Mileage: [__] km   Petrol: [__]
Toll: [__]     Meal: [__]  Others: [__]
📎 Upload receipt
[ Save Draft ] [ Submit ]
```

### 5.3 Submit Overtime Form

```
⏱️ Overtime Request
─────────────────────────────
[Date]   Start: [__] End: [__]
Justification [____________]
📎 Upload optional doc
[ Save Draft ] [ Submit ]
```

---

## 6. Role-Based Access Control (RBAC)

| Role    | Permissions                                           |
|---------|-------------------------------------------------------|
| Staff   | Submit/edit/view own claims/overtime                  |
| Manager | Approve direct reports' submissions                   |
| Finance | Export reports, update payout statuses               |
| Admin   | Full control: config rates, users, view audit logs   |

---

## 7. Reporting & Exports

- Monthly claim report (CSV, Excel, optional PDF)
- **Filters:** department, date range, claim/overtime type
- **Fields:** user, project, total claims, payout amount

---

## 8. Validation & Business Rules

- Mileage rate & multiplier fetched from `rates_config`
- Claims must be submitted within 7 days
- Overtime rate is calculated from `salary / 173 * multiplier`
- Duplicate submissions blocked within same day range
- Attachments optional but encouraged

---

## 9. Database Index Strategy

| Collection     | Index                                      |
|----------------|-------------------------------------------|
| users          | email, role, department                   |
| claims         | userId, date, status                      |
| overtime       | userId, date, status                      |
| files          | linkedTo.documentId                       |
| audit_logs     | userId, timestamp                         |
| rates_config   | type, effectiveDate, condition.designation|

---

## 10. Logging & Monitoring Strategy

- **Logger:** [Winston](https://github.com/winstonjs/winston) will be used for structured and leveled logging.
- **Log Levels:** info, warn, error, http
- **Output:** Console (development), rotating log files (production)
- **Optional:** Integration with external log monitoring services (e.g., Loggly, Datadog)

---

## 11. Development & Testing Plan

### Development Phases
- **Phase 1:** Core functionality (claims, overtime, approval, admin config)
- **Phase 2:** Integration and unit testing (Jest, Supertest)
- **Phase 3:** Logging, documentation (Swagger), and deployment
- **Phase 4:** Post-deployment monitoring and feedback collection

### Testing Strategy
- Unit tests for all critical endpoints and calculations
- Integration tests for multi-step flows (e.g., claim submission → approval)
- Manual QA with real user scenarios during UAT

---

## Appendix: Future Extensions

- Integration with e-payroll API (2025 Q4)
- Mobile PWA interface for on-the-go approvals
- AI Assistant (ClaimBot) integration for auto-fill

---

_Document Version: 1.0 • Last updated: 2025-05-27 by Aiyad_
