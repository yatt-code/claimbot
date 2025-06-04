# Business Requirement Specification (BRS)

## Project Overview

**Project Title:** Internal Claims & Overtime Management System  
**Date:** May 2025  
**Prepared By:** Aiyad  

---

## 1. Project Objective

This project aims to develop an internal system that **digitizes and streamlines** the current manual process of submitting, approving, and tracking employee expense claims and overtime requests. Currently handled via Excel spreadsheets, the new system will:

- Improve accuracy and transparency
- Enhance auditability
- Reduce administrative workload
- Provide real-time tracking and reporting

---

## 2. Project Scope

### In Scope
- ✅ **Expense and overtime submission** workflows
- ✅ **Multi-level approval** processes (Admin/Manager)
- ✅ **Configurable rate management** (mileage rates & overtime multipliers)
- ✅ **Document attachment** support for receipts and supporting materials
- ✅ **Export functionality** for monthly summaries (Excel/CSV format)
- ✅ **User and role management** system
- ✅ **Comprehensive audit logging** for all system actions
- ✅ **Location and mileage calculation system** with Google Maps integration

### Out of Scope (MVP)
- ❌ Integration with external payroll systems
- ❌ Public holiday calendar API integration
- ❌ Native mobile application (web-responsive design only)

---

## 3. Stakeholder Roles

| Role | Primary Responsibilities |
|------|-------------------------|
| **Staff** | Submit expense claims and overtime requests |
| **Managers** | Review and approve/reject submissions from team members |
| **Finance/HR** | Monitor claims, manage rate configurations, generate reports |
| **System Admin** | Oversee system operations, manage users and roles |

---

## 4. Business Rules and Logic

### 4.1 Expense Claims

**Rate Structure:**
- Default mileage rate: **RM 0.50/km** (admin configurable)

**Location and Mileage System:**
- **Google Maps API integration** for accurate mileage calculation using real-world distances
- **Admin-controlled destination templates** ([`LocationTemplate`](src/models/LocationTemplate.ts:1)) with predefined coordinates
- **Trip mode system** supporting various travel patterns:
  - Office-to-destination (one-way and return trips)
  - Custom origin routes with flexible destinations
  - Saved trip templates for frequently used routes
- **Automatic mileage calculation** with read-only field for staff (prevents manual override)
- **Enhanced UX** with trip mode selection and visual feedback on calculated distances

**Documentation Requirements:**
- Receipts **mandatory** for: toll payments, petrol, meals, and miscellaneous expenses
- Each claim must be associated with a specific project or department

**Submission Rules:**
- Claims must be submitted within **7 days** of expense occurrence
- Claims are editable until submission
- Claims become **locked** after approval

**Location System Validation Rules:**
- Mileage field is read-only for staff users and auto-calculated from Google Maps API
- Trip mode selection determines required fields (office modes require destination only, custom modes require origin and destination)
- Mileage exceeding 100km triggers soft warning message for review
- Admins may override mileage calculations via role-based permissions
- All location and trip data validated using [`react-hook-form`](src/app/submit/expense/page.tsx:1) and [Zod schemas](src/app/submit/expense/page.tsx:1)

### 4.2 Overtime Calculations

**Rate Calculation:**
- Based on user's hourly rate (derived from annual salary)
- Multipliers vary by day type and user designation:

| Day Type | Multiplier |
|----------|------------|
| **Weekdays** | 1.0x (standard rate) |
| **Weekends** | 1.5x |
| **Public Holidays** | 2.0x – 3.0x (admin configurable) |

**Submission Requirements:**
- Must include business justification
- Requires defined approval workflow

### 4.3 Salary Management

- Stored per user for overtime rate calculations
- **Admin-only access** (hidden from regular users)
- Used exclusively for automated overtime calculations

### 4.4 Role-Based Permissions

| Role | System Permissions |
|------|-------------------|
| **Staff** | • Submit, view, and edit own claims/overtime<br>• View submission status and history |
| **Manager** | • All Staff permissions<br>• Approve/reject direct reports' submissions |
| **Finance** | • Export system data<br>• Monitor financial totals<br>• Update payout statuses |
| **Admin** | • Full system access<br>• User management (CRUD operations)<br>• Rate and designation configuration |

### 4.5 Document Management

**File Handling:**
- Secure file uploads with metadata storage (filename, path, file type)
- Multiple attachments supported per claim/overtime request
- Direct linking between attachments and parent submissions

### 4.6 Approval Workflow

**Process Flow:**
```
Staff Submission → Manager Review → [Optional] Finance Review → Final Approval
```

**Audit Requirements:**
- Each approval stage logs: timestamp, reviewer comments, approver identification
- Complete workflow visibility for all stakeholders

### 4.7 System Audit Trail

**Logging Scope:**
- All create, edit, approve, and reject operations
- Comprehensive audit records including:
    - User identification
    - Timestamp
    - Specific changes made
    - System state before/after changes

---

## 5. Functional Requirements Summary

| Feature Category | Specific Functionality |
|-----------------|----------------------|
| **Submission Management** | Intuitive forms for expense claims and overtime logging |
| **Status Tracking** | Real-time visibility of submission status and history |
| **Administrative Controls** | Interface for configuring mileage rates and overtime rules |
| **Approval Dashboard** | Centralized review and action interface for managers/finance |
| **Document Support** | Secure upload and viewing of receipts and justification documents |
| **Reporting & Export** | Filterable monthly reports with multiple export formats |
| **System Monitoring** | Comprehensive audit logging and system activity tracking |

---

## 6. Non-Functional Requirements

### Security & Access
- **Role-Based Access Control (RBAC)** implementation
- Secure user authentication and authorization

### Performance & Usability
- **Responsive design** optimized for desktop and mobile devices
- **Scalability** to support up to 100 concurrent users
- Intuitive user interface with minimal learning curve

### Compliance & Monitoring
- **Complete auditability** with timestamped action logs
- **Secure file storage** with clear data lineage
- Compliance with internal data governance policies

---

## 7. Project Timeline & Milestones

| Phase | Deliverable | Duration | Timeline |
|-------|-------------|----------|----------|
| **Pre-Phase** | BRS Approval & Sign-off | 1 week | Week 1 |
| **Pre-Phase** | System Design Specification (SDS) | 1 week | Week 2 |
| **Phase 1** | Foundation & Core Backend | 2 weeks | Weeks 3-4 |
| **Phase 2** | Claims & Overtime Backend | 2 weeks | Weeks 5-6 |
| **Phase 3** | Frontend Core & Staff Modules | 2 weeks | Weeks 7-8 |
| **Phase 4** | Manager & Admin Modules | 2 weeks | Weeks 9-10 |
| **Phase 5** | Deployment & Monitoring | 1 week | Week 11 |
| **Phase 6** | Post-Launch & Future Enhancements | Ongoing | Ongoing |

---

## 8. Acceptance Criteria

### Core Functionality
- ✅ End-to-end submission workflow operates smoothly for both claims and overtime
- ✅ Manager approval process functions with comment capabilities
- ✅ Accurate calculations for mileage and overtime based on configured rates

### Document & Audit Management
- ✅ Attachment viewing accessible to all relevant approvers
- ✅ Comprehensive audit logs capture all critical system actions
- ✅ Administrative rate configuration interface functions correctly

### Reporting & Export
- ✅ Monthly reports generate and export accurately in required formats
- ✅ Data filtering and search capabilities work as specified

### User Experience
- ✅ Intuitive interface requires minimal user training
- ✅ System performance meets specified response time requirements

---

_Document Version: 1.3 • Last updated: 2025-06-05 by Code Mode_
