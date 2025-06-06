## Condensed Project Context
**ClaimBot** is a Next.js 15 + TypeScript full-stack expense and overtime management system for Malaysian companies, built with modern web technologies and enterprise-grade security.

### **Core Architecture:**
- **Frontend**: Next.js 15 App Router, React 19, TailwindCSS + ShadCN UI components
- **Backend**: Next.js API routes with MongoDB (Mongoose ODM) and Zod validation
- **Authentication**: Clerk.dev with custom RBAC system supporting multiple roles
- **Database**: MongoDB with collections for Users, Claims, Overtime, Files, AuditLogs

### **Key Features:**
- **Staff Portal**: Submit expense claims and overtime requests with file attachments
- **Manager/Admin Dashboard**: Unified `/admin` interface for approvals, user management, analytics
- **Role-Based Access Control**: Hierarchical permissions (staff → manager → finance → admin → superadmin)
- **Audit System**: Comprehensive logging of all user actions and system changes
- **File Management**: Upload/download system for receipts and supporting documents

### **Current Status (Phase 6 Complete):**
- ✅ **Authentication & RBAC**: Clerk integration with MongoDB role sync, permission-based access control
- ✅ **Core Workflows**: Complete submission → approval → audit trail for claims/overtime
- ✅ **Admin Interface**: Unified adaptive dashboard with role-based navigation and functionality
- ✅ **Data Management**: User management, rate configuration, reporting, audit logs
- ✅ **Location System**: Google Maps integration with autocomplete, mileage calculation, and trip templates
- ✅ **Professional UX**: Toast notifications, error handling, consistent UI/UX patterns

### **Technical Highlights:**
- **Type Safety**: Full TypeScript coverage with Zod schemas for runtime validation
- **Security**: JWT-based auth with Clerk, RBAC middleware, API route protection
- **Scalability**: Modular architecture, reusable components, permission-based rendering
- **Reliability**: Retry logic for external APIs, comprehensive error handling, audit trails
- **Developer Experience**: Comprehensive documentation, technical decision log, testing scaffolding

### **Business Value:**
Replaces manual expense/overtime processes with automated workflows, providing managers with approval tools, admins with system control, and comprehensive audit trails for compliance and financial tracking.