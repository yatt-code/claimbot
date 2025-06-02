# 🏗️ ClaimBot Technical Architecture

## Project Information
- **Document Type**: Technical Architecture Guide
- **Version**: 1.0
- **Last Updated**: June 2, 2025
- **Audience**: Developers, System Architects, DevOps Engineers

---

## 📋 Table of Contents

- [System Architecture Overview](#-system-architecture-overview)
- [Database Schema & Design](#-database-schema--design)
- [API Architecture](#-api-architecture)
- [Frontend Architecture](#-frontend-architecture)
- [Authentication & Authorization](#-authentication--authorization)
- [File Management System](#-file-management-system)
- [Logging & Monitoring](#-logging--monitoring)
- [Testing Architecture](#-testing-architecture)
- [Deployment Architecture](#-deployment-architecture)
- [Performance Considerations](#-performance-considerations)

---

## 🏗️ System Architecture Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        C[Next.js 15 App]
        D[React Components]
        E[TailwindCSS + ShadCN UI]
        F[React Hook Form + Zod]
    end
    
    subgraph "Authentication Layer"
        G[Clerk Auth Provider]
        H[JWT Middleware]
    end
    
    subgraph "Backend Layer"
        I[Next.js API Routes]
        J[Mongoose ODM]
        K[Business Logic Services]
        L[Winston Logging]
    end
    
    subgraph "Database Layer"
        M[(MongoDB Atlas)]
        N[File Storage]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    G --> H
    H --> I
    I --> J
    I --> K
    I --> L
    J --> M
    K --> N
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 + TypeScript | Modern React framework with App Router |
| **UI Framework** | TailwindCSS + ShadCN UI | Utility-first styling with accessible components |
| **Forms** | React Hook Form + Zod | Type-safe form handling and validation |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | MongoDB Atlas + Mongoose | NoSQL database with ODM |
| **Authentication** | Clerk | Secure JWT-based authentication |
| **Logging** | Winston | Structured application logging |
| **Testing** | Jest + RTL + Supertest | Comprehensive testing framework |

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth (Clerk)
    participant B as Backend API
    participant D as Database
    participant L as Logs

    U->>F: Interact with UI
    F->>A: Authenticate Request
    A->>F: Return JWT Token
    F->>B: API Request + JWT
    B->>A: Validate JWT
    A->>B: User Claims
    B->>D: Query/Update Data
    D->>B: Return Results
    B->>L: Log Action
    B->>F: JSON Response
    F->>U: Update UI
```

---

## 📊 Database Schema & Design

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  clerkId: "user_xyz123",           // Clerk integration ID
  name: "John Doe",
  email: "john@company.com",
  department: "Engineering",
  designation: "Software Engineer",
  role: "staff",                   // staff | manager | finance | admin
  salary: 4500,                    // For overtime calculations
  hourlyRate: 26.01,              // Calculated: salary / 173
  isActive: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Claims Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,                // Reference to users collection
  date: ISODate,
  project: "HIMS Migration",
  description: "Client site visit",
  expenses: {
    mileage: 50,                   // kilometers
    toll: 12.50,                   // RM
    petrol: 45.00,                 // RM
    meal: 25.00,                   // RM
    others: 15.00                  // RM
  },
  mileageRate: 0.50,              // RM per km (from config)
  totalClaim: 122.50,             // Auto-calculated
  attachments: [ObjectId],        // File references
  status: "submitted",            // draft | submitted | approved | rejected | paid
  submittedAt: ISODate,
  approvedBy: ObjectId,           // Reference to approver
  approvedAt: ISODate,
  remarks: "Approved for payment",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Overtime Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: ISODate,
  startTime: "18:00",
  endTime: "22:30",
  reason: "Emergency system deployment",
  hoursWorked: 4.5,              // Auto-calculated
  rateMultiplier: 1.5,           // From rate config (weekend/holiday)
  hourlyRate: 26.01,             // From user profile
  totalPayout: 175.57,           // Auto-calculated
  attachments: [ObjectId],
  status: "approved",
  approvedBy: ObjectId,
  approvedAt: ISODate,
  remarks: "",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Rate Configuration Collection
```javascript
{
  _id: ObjectId,
  type: "mileage",               // mileage | overtime_multiplier
  value: 0.50,                   // For mileage rates (RM per km)
  condition: {                   // For overtime multipliers
    dayType: "weekend",          // weekday | weekend | holiday
    designation: "Engineer"      // Optional designation filter
  },
  multiplier: 1.5,              // For overtime rates
  effectiveDate: ISODate,       // When this rate becomes active
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Files Collection
```javascript
{
  _id: ObjectId,
  filename: "receipt_001.jpg",
  mimetype: "image/jpeg",
  path: "/uploads/2025/06/receipt_001.jpg",
  uploadedBy: ObjectId,
  linkedTo: {
    collection: "claims",        // claims | overtime
    documentId: ObjectId
  },
  uploadedAt: ISODate
}
```

#### Audit Logs Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: "approved_claim",      // Action type
  target: {
    collection: "claims",
    documentId: ObjectId
  },
  details: "Claim approved by manager",
  timestamp: ISODate
}
```

### Database Indexes

```javascript
// Users Collection
db.users.createIndex({ clerkId: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1, department: 1 })

// Claims Collection
db.claims.createIndex({ userId: 1, status: 1 })
db.claims.createIndex({ status: 1, createdAt: -1 })
db.claims.createIndex({ date: -1 })

// Overtime Collection
db.overtime.createIndex({ userId: 1, status: 1 })
db.overtime.createIndex({ status: 1, createdAt: -1 })
db.overtime.createIndex({ date: -1 })

// Files Collection
db.files.createIndex({ "linkedTo.documentId": 1 })
db.files.createIndex({ uploadedBy: 1 })

// Audit Logs Collection
db.audit_logs.createIndex({ userId: 1, timestamp: -1 })
db.audit_logs.createIndex({ action: 1, timestamp: -1 })

// Rate Configuration Collection
db.rates_config.createIndex({ type: 1, effectiveDate: -1 })
```

---

## 🛠️ API Architecture

### RESTful API Design

#### Authentication Endpoints
```
GET  /api/auth/profile          # Get current user profile
```

#### User Management Endpoints
```
GET    /api/users               # List all users (admin only)
POST   /api/users               # Create new user (admin only)
GET    /api/users/[id]          # Get user by ID (admin only)
PATCH  /api/users/[id]          # Update user (admin only)
DELETE /api/users/[id]          # Delete user (admin only)
```

#### Claims Management Endpoints
```
GET    /api/claims              # List claims (filtered by role)
POST   /api/claims              # Create new claim (staff+)
GET    /api/claims/[id]         # Get claim details
PATCH  /api/claims/[id]         # Update claim (owner/admin)
DELETE /api/claims/[id]         # Delete claim (owner/admin)
POST   /api/claims/[id]/submit  # Submit claim for approval
POST   /api/claims/[id]/approve # Approve/reject claim (manager+)
```

#### Overtime Management Endpoints
```
GET    /api/overtime            # List overtime requests
POST   /api/overtime            # Create overtime request (staff+)
GET    /api/overtime/[id]       # Get overtime details
PATCH  /api/overtime/[id]       # Update overtime (owner/admin)
DELETE /api/overtime/[id]       # Delete overtime (owner/admin)
POST   /api/overtime/[id]/submit  # Submit for approval
POST   /api/overtime/[id]/approve # Approve/reject (manager+)
```

#### Configuration Endpoints
```
GET    /api/config/rates        # Get rate configurations (admin)
POST   /api/config/rates        # Create rate configuration (admin)
PATCH  /api/config/rates/[id]   # Update rate configuration (admin)
```

#### File Management Endpoints
```
POST   /api/upload              # Upload file attachment
GET    /api/files/[id]          # Download/view file
```

#### Audit & Reports Endpoints
```
GET    /api/audit-logs          # Get audit logs (admin)
GET    /api/reports             # Generate reports (finance+)
```

### API Response Patterns

#### Success Response
```typescript
{
  success: true,
  data: T,
  message?: string
}
```

#### Error Response
```typescript
{
  success: false,
  error: string,
  details?: any,
  code?: string
}
```

#### Validation Error Response
```typescript
{
  success: false,
  error: "Validation failed",
  details: {
    field: ["error message"]
  }
}
```

---

## 🎨 Frontend Architecture

### Component Architecture

```
src/components/
├── ui/                         # ShadCN UI base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── calendar.tsx
│   └── ...
├── Button.tsx                  # Global button component
├── StatusBadge.tsx            # Status indicators
├── SubmissionTable.tsx        # Data tables
├── FileUploader.tsx           # File upload component
├── DatePicker.tsx             # Date selection
├── TimePicker.tsx             # Time selection
├── PendingSubmissionsList.tsx # Manager dashboard
├── SubmissionDetailCard.tsx   # Detailed views
├── AttachmentViewer.tsx       # File viewing
└── ActionButtons.tsx          # Action controls
```

### Page Architecture

```
src/app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page
├── dashboard/
│   └── page.tsx              # Staff dashboard
├── submit/
│   ├── expense/
│   │   └── page.tsx          # Expense submission form
│   └── overtime/
│       └── page.tsx          # Overtime submission form
├── my-submissions/
│   └── page.tsx              # User submission history
├── manager/
│   └── approvals/
│       ├── page.tsx          # Manager approval dashboard
│       └── [id]/
│           └── page.tsx      # Submission detail view
├── admin/
│   ├── users/
│   │   ├── page.tsx          # User management list
│   │   ├── new/
│   │   │   └── page.tsx      # Create new user
│   │   └── [id]/
│   │       └── page.tsx      # Edit user
│   ├── rates/
│   │   └── page.tsx          # Rate configuration
│   ├── audit-logs/
│   │   └── page.tsx          # System audit logs
│   └── reports/
│       └── page.tsx          # Report generation
└── (auth)/
    ├── sign-in/
    │   └── [[...sign-in]]/
    │       └── page.tsx      # Sign in page
    └── sign-up/
        └── [[...sign-up]]/
            └── page.tsx      # Sign up page
```

### State Management

- **Local State**: React useState for component-specific state
- **Form State**: React Hook Form for form management
- **Server State**: Direct API calls with native fetch
- **Authentication State**: Managed by Clerk hooks

### Styling Architecture

- **Base**: TailwindCSS utility classes
- **Components**: ShadCN UI component library
- **Variants**: CVA (Class Variance Authority) for component variants
- **Responsive**: Mobile-first responsive design

---

## 🔐 Authentication & Authorization

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Clerk
    participant F as Frontend
    participant B as Backend

    U->>C: Login Request
    C->>U: JWT Token
    U->>F: Access Application
    F->>C: Validate Session
    C->>F: User Claims
    F->>B: API Request + JWT
    B->>C: Verify JWT
    C->>B: User Information
    B->>B: Check Permissions
    B->>F: Authorized Response
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Staff** | • Submit and edit own claims/overtime<br>• View own submission history<br>• Upload supporting documents |
| **Manager** | • All Staff permissions<br>• Approve/reject team submissions<br>• View team member submissions<br>• Add approval comments |
| **Finance** | • Export financial reports<br>• Monitor system-wide totals<br>• Update payout statuses<br>• View all submissions |
| **Admin** | • Full system access<br>• User management (CRUD)<br>• Rate configuration<br>• System audit logs<br>• User role management |

### Security Features

- **JWT Authentication**: Secure token-based authentication via Clerk
- **API Authorization**: Route-level permission checking
- **Input Validation**: Zod schema validation on all inputs
- **Audit Logging**: Complete action tracking
- **Secure File Uploads**: Validated file types and sizes
- **CSRF Protection**: Built-in Next.js security features

---

## 📁 File Management System

### File Upload Architecture

```mermaid
graph LR
    A[User Selects File] --> B[Frontend Validation]
    B --> C[Upload to API]
    C --> D[Server Validation]
    D --> E[Store Metadata]
    E --> F[Save to Filesystem]
    F --> G[Return File Reference]
```

### File Storage Structure

```
uploads/
├── 2025/
│   ├── 01/                    # January
│   ├── 02/                    # February
│   └── ...
├── temp/                      # Temporary uploads
└── processed/                 # Processed files
```

### File Security

- **Type Validation**: Only allowed MIME types (images, PDFs)
- **Size Limits**: Maximum file size restrictions
- **Access Control**: Files linked to specific users/submissions
- **Secure Paths**: Non-predictable file paths
- **Virus Scanning**: Future enhancement for file scanning

---

## 📝 Logging & Monitoring

### Winston Logging Configuration

```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});
```

### Log Levels

- **error**: System errors and exceptions
- **warn**: Warning conditions
- **info**: General information (user actions, API calls)
- **http**: HTTP request/response logging
- **debug**: Detailed debugging information

### Audit Logging

All critical actions are logged to the `audit_logs` collection:

- User creation, updates, deletion
- Claims submission, approval, rejection
- Overtime submission, approval, rejection
- Rate configuration changes
- File uploads and downloads

---

## 🧪 Testing Architecture

### Testing Strategy

```
Testing Pyramid
    ┌─────────────┐
    │     E2E     │ ← Few, high-value tests
    ├─────────────┤
    │ Integration │ ← API and component integration
    ├─────────────┤
    │    Unit     │ ← Many, fast, focused tests
    └─────────────┘
```

### Backend Testing

- **Framework**: Jest + Supertest
- **Scope**: API route integration tests
- **Mocking**: Database and external services
- **Coverage**: 95%+ for all API endpoints

### Frontend Testing

- **Framework**: Jest + React Testing Library
- **Scope**: Component and page testing
- **User-Centric**: Focus on user interactions
- **Accessibility**: Screen reader and keyboard navigation

### Test Database

- **Separate Environment**: Isolated test database
- **Data Seeding**: Consistent test data setup
- **Cleanup**: Automatic cleanup after tests

---

## 🚀 Deployment Architecture

### Docker Configuration

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Cloud Deployment Options

#### Vercel (Recommended)
- **Pros**: Optimized for Next.js, automatic deployments, edge functions
- **Cons**: Vendor lock-in, limited customization
- **Best for**: Quick deployment, minimal DevOps overhead

#### AWS ECS/Fargate
- **Pros**: Full control, scalability, cost-effective
- **Cons**: More complex setup, requires AWS knowledge
- **Best for**: Production environments, custom requirements

#### Google Cloud Run
- **Pros**: Serverless, pay-per-use, easy scaling
- **Cons**: Cold starts, limited customization
- **Best for**: Variable traffic patterns

### Environment Configuration

```env
# Production Environment Variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/claimbot
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://claimbot.yourdomain.com
LOG_LEVEL=info
```

---

## ⚡ Performance Considerations

### Database Optimization

- **Indexing**: Strategic indexes on frequently queried fields
- **Connection Pooling**: Mongoose connection pooling
- **Query Optimization**: Efficient aggregation pipelines
- **Data Pagination**: Limit large result sets

### Frontend Optimization

- **Code Splitting**: Automatic Next.js code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring
- **Caching**: Strategic caching of API responses

### API Performance

- **Response Compression**: Gzip compression enabled
- **Rate Limiting**: Prevent API abuse
- **Caching**: Redis caching for frequently accessed data (future)
- **Database Queries**: Optimized queries with proper indexing

### Monitoring Metrics

- **Response Times**: API endpoint response times
- **Error Rates**: Track 4xx and 5xx errors
- **Database Performance**: Query execution times
- **User Metrics**: Page load times, user interactions

---

**📝 Document Version**: 1.0  
**🔄 Last Updated**: June 2, 2025  
**📧 Maintained by**: Development Team

---

*Comprehensive technical architecture documentation for ClaimBot system* 🏗️✨