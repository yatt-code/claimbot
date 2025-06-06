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
- Collections: `users`, `claims`, `overtime`, `rates_config`, `files`, `audit_logs`, `location_templates`, `admin_trip_templates`, `saved_trip_templates`

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
  salary: {
    amount: 4500, // Stored as monthly or hourly
    type: "monthly", // "monthly" or "hourly"
    isVerified: false, // Boolean indicating if salary is verified
    submittedAt: ISODate, // Timestamp of last submission
    verifiedAt: ISODate, // Timestamp of verification
    verifiedBy: ObjectId // Admin user who verified
  },
  hourlyRate: 4500 / 173, // Derived from salary.amount and type
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
  // Location and trip data
  tripMode: "OFFICE_TO_DEST", // TripMode enum
  origin: {
    name: "Main Office",
    address: "123 Business St",
    lat: 3.139,
    lng: 101.6869
  },
  destination: {
    name: "KPKT",
    address: "456 Government Ave",
    lat: 3.158,
    lng: 101.711
  },
  returnTrip: false,
  calculatedDistance: 20.5, // km from Google Maps API
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
  updatedAt: ISODate,
  // New fields for validation tracking
  monthlyCapExceeded: false, // True if this submission exceeds the 18-hour monthly cap
  weekdayRestrictionViolated: false // True if overtime claimed before 8 PM on a weekday
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

### 3.7 Location Templates Collection

```javascript
{
  _id: ObjectId,
  name: "KPKT",
  address: "Level 1-7, No. 51, Persiaran Perdana, Presint 4, 62574 Putrajaya",
  lat: 3.1583,
  lng: 101.7111,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.8 Admin Trip Templates Collection

```javascript
{
  _id: ObjectId,
  name: "Office to KPKT Return",
  description: "Standard office to KPKT with return trip",
  origin: {
    name: "Main Office",
    address: "123 Business Street",
    lat: 3.139,
    lng: 101.6869
  },
  destination: {
    name: "KPKT",
    address: "Level 1-7, No. 51, Persiaran Perdana, Presint 4, 62574 Putrajaya",
    lat: 3.1583,
    lng: 101.7111
  },
  returnTrip: true,
  estimatedDistance: 41.2, // km (calculated during template creation)
  isActive: true,
  createdBy: ObjectId,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 3.9 Saved Trip Templates Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: "My Regular Client Visit",
  origin: {
    name: "Home Office",
    address: "789 Residential Ave",
    lat: 3.145,
    lng: 101.695
  },
  destination: {
    name: "Client Site",
    address: "456 Corporate Blvd",
    lat: 3.155,
    lng: 101.715
  },
  returnTrip: false,
  estimatedDistance: 15.3, // km
  createdAt: ISODate,
  updatedAt: ISODate
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

### Salary Management
- `POST /api/users/salary` — Submit or update user's salary data
- `GET /api/users/salary/status` — Get current user's salary verification status
- `POST /api/users/:id/salary/verify` — Admin endpoint to verify a user's salary (updates `isVerified` to true)
- `POST /api/users/:id/salary/reject` — Admin endpoint to reject a user's salary (updates `isVerified` to false, adds remarks)

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

### Location Templates
- `GET /api/location-templates` — Get all admin-defined location templates
- `POST /api/location-templates` — Create new location template (admin only)
- `PATCH /api/location-templates/:id` — Update location template (admin only)
- `DELETE /api/location-templates/:id` — Delete location template (admin only)

### Admin Trip Templates
- `GET /api/admin/trip-templates` — Get all global trip templates
- `POST /api/admin/trip-templates` — Create new admin trip template (admin only)
- `PATCH /api/admin/trip-templates/:id` — Update admin trip template (admin only)
- `DELETE /api/admin/trip-templates/:id` — Delete admin trip template (admin only)

### Saved Trip Templates
- `GET /api/saved-trip-templates` — Get user's personal saved trip templates
- `POST /api/saved-trip-templates` — Create new saved trip template for current user
- `PATCH /api/saved-trip-templates/:id` — Update user's saved trip template
- `DELETE /api/saved-trip-templates/:id` — Delete user's saved trip template

### Mileage Calculation
- `POST /api/mileage/calculate` — Calculate distance using Google Maps Directions API

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

🗺️ Trip Information
Trip Mode: [Office to Destination ▼]
Destination: [Select Template ▼] or [Custom Address]
□ Return Trip
Estimated Distance: 15.6 km (via Google Maps) [Read-only]

💰 Expenses
Mileage: [7.80] (auto-calculated)   Petrol: [__]
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
| Staff   | Submit/edit/view own claims/overtime, submit salary data, view salary status |
| Manager | Approve direct reports' submissions                   |
| Finance | Export reports, update payout statuses, verify user salary data |
| Admin   | Full control: config rates, users, view audit logs, manage salary verification |

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
- **Location System Validation:**
  - Mileage automatically calculated using Google Maps Directions API
  - Trip mode determines required fields (office vs custom origin/destination)
  - Distance calculations cached to reduce API calls
  - Validation warnings for trips exceeding 100km
  - Admin override capabilities for mileage adjustments

---

## 9. Database Index Strategy

| Collection             | Index                                      |
|------------------------|-------------------------------------------|
| users                  | email, role, department                   |
| claims                 | userId, date, status, tripMode           |
| overtime               | userId, date, status                      |
| files                  | linkedTo.documentId                       |
| audit_logs             | userId, timestamp                         |
| rates_config           | type, effectiveDate, condition.designation|
| location_templates     | name, lat, lng                            |
| admin_trip_templates   | isActive, estimatedDistance               |
| saved_trip_templates   | userId, estimatedDistance                 |

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

_Document Version: 1.1 • Last updated: 2025-06-05 by Code Mode_
