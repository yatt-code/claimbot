## 📋 **Strategy: Centralized Admin Dashboard with Role-Based Views**

### 🎯 **Current State Analysis:**

**Admin Dashboard (`/admin`):**
- Statistics overview (users, claims, overtime, amounts)
- Quick actions: User Management, Rate Configuration, Reports, Audit Logs
- Admin-specific features

**Manager Dashboard (`/manager/approvals`):**
- Pending submissions list (claims + overtime)
- Approval workflow functionality

### 🏗️ **Proposed New Structure:**

```
/admin
├── / (main dashboard - role-adaptive)
├── /approvals (manager functionality)
├── /users (admin functionality)
├── /rates (admin functionality)
├── /reports (shared - role-filtered)
├── /audit-logs (admin functionality)
└── /analytics (new - combined insights)
```

### 📊 **Role-Based Dashboard Design:**

#### **1. Unified `/admin` Main Dashboard**
- **For Managers**: Show approval-focused stats + pending submissions
- **For Admins**: Show system-wide stats + admin tools
- **For Superadmins**: Show everything with enhanced controls
- **Dynamic navigation** based on user permissions

#### **2. Permission-Based Section Visibility**

| Section | Manager | Admin | Superadmin |
|---------|---------|-------|------------|
| Approvals | ✅ (team) | ❌ | ✅ (all) |
| Users | ❌ | ✅ | ✅ |
| Rates | ❌ | ✅ | ✅ |
| Reports | ✅ (team) | ✅ (all) | ✅ (all) |
| Audit Logs | ❌ | ✅ | ✅ |
| Analytics | ✅ (basic) | ✅ (full) | ✅ (full) |

### 🔧 **Implementation Strategy:**

#### **Phase 1: Create Adaptive Dashboard Component**
1. **Build role-aware main dashboard** that shows different cards/stats based on permissions
2. **Implement dynamic navigation** using `useRBAC()` hook
3. **Create unified stats API** that returns role-appropriate data

#### **Phase 2: Migrate Manager Functionality**
1. **Move `/manager/approvals` → `/admin/approvals`**
2. **Update navigation and links**
3. **Enhance approvals with admin-level controls for superadmins**

#### **Phase 3: Create Unified Components**
1. **Build `AdminLayout` component** with role-based sidebar
2. **Create `StatsCard` component** that adapts to user permissions
3. **Implement `QuickActions` component** with conditional rendering

#### **Phase 4: Update RBAC and Routes**
1. **Update middleware routing** for new structure
2. **Add new permissions** for admin sections if needed
3. **Migrate and test all functionality**

### 🎨 **User Experience Benefits:**

- **Single entry point** for all administrative tasks
- **Personalized dashboard** based on user role
- **Consistent navigation** and layout
- **Better discoverability** of features
- **Simplified permissions** - all admin features in one place

### 🔐 **Security Considerations:**

- **Route-level protection** via middleware
- **Component-level protection** via `useRBAC()` hook
- **API-level protection** via `protectApiRoute()`
- **Dynamic navigation** hides unauthorized sections

### 🚀 **Migration Plan:**

1. **Create new adaptive dashboard**
2. **Implement role-based navigation**
3. **Move manager functionality to `/admin/approvals`**
4. **Update all internal links and navigation**
5. **Test each role's view thoroughly**
6. **Remove old `/manager` directory**

This approach provides a **centralized, powerful admin interface** where each user sees exactly what they need based on their role, while maintaining security and usability.