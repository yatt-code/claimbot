# 🤖 ClaimBot - Internal Claims & Overtime Management System

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=flat-square)](https://clerk.com/)

> **A modern, full-stack web application that digitizes and streamlines employee expense claims and overtime request management, replacing traditional Excel-based workflows with an intuitive, secure, and auditable system.**

---

## 🎯 Project Overview

ClaimBot transforms the traditional manual process of expense claims and overtime requests from Excel spreadsheets into a modern, digital workflow. The system provides:

- **Improved Accuracy**: Automated calculations with configurable rates
- **Enhanced Transparency**: Real-time status tracking and audit trails
- **Reduced Administrative Workload**: Streamlined approval workflows
- **Complete Auditability**: Comprehensive logging of all system actions

---

## ✨ Key Features

### 👤 **For Staff**
- Submit expense claims with itemized categories
- Request overtime compensation with time tracking
- Upload supporting documents and receipts
- Track submission status in real-time
- View complete submission history

### 👨‍💼 **For Managers**
- Review pending claims and overtime requests
- Approve, reject, or request clarification with comments
- View detailed submission information and attachments
- Centralized approval dashboard

### 🏢 **For Administrators**
- Manage user accounts and role assignments
- Configure mileage rates and overtime multipliers
- View comprehensive system audit logs
- Generate and export monthly reports

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- MongoDB Atlas account
- Clerk account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yatt-code/claimbot.git
   cd claimbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   
   Create a `.env.local` file:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/claimbot
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
   
   # Application
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Initial Setup

1. Create your first admin user through Clerk's dashboard
2. Configure rate settings via the admin panel (`/admin/rates`)
3. Add team members through user management (`/admin/users`)
4. Start submitting claims through the staff dashboard (`/dashboard`)

---

## 📦 Tech Stack

**Frontend**: Next.js 15, TypeScript, TailwindCSS, ShadCN UI, React Hook Form + Zod  
**Backend**: Next.js API Routes, Mongoose ODM, Winston Logging  
**Database**: MongoDB Atlas  
**Authentication**: Clerk (JWT-based)  
**Testing**: Jest + React Testing Library + Supertest  

---

## 📋 Project Status

### ✅ **Phase 4 Complete** - Ready for Production Deployment

- ✅ **Foundation & Core Backend**: Next.js 15 + TypeScript, MongoDB Atlas, Clerk auth
- ✅ **Claims & Overtime Backend**: Complete API endpoints with approval workflow
- ✅ **Frontend Core & Staff Modules**: Dashboard, submission forms, file upload
- ✅ **Manager & Admin Modules**: Approval dashboard, rate config, user management
- ✅ **Comprehensive Testing**: Backend integration tests with TypeScript compliance

### 🔄 **Next Phase**: Deployment & Monitoring
- Docker containerization
- CI/CD pipeline setup
- Production deployment configuration
- Performance monitoring
- Error tracking and alerting

---

## 📚 Documentation

### **Quick Links**
- 📖 **[Complete Documentation Hub](docs/README.md)** - Navigation to all project documentation
- 🚀 **[Development Guide](CONTRIBUTING.md)** - Setup, coding standards, and contribution workflow
- 🔧 **[API Documentation](docs/swagger.yaml)** - Complete API reference
- 🎨 **[System Design](docs/02-sds-claimbot.md)** - Technical architecture and database schema

### **User Guides**
- **Staff Users**: Submit claims, track overtime, view history
- **Managers**: Review submissions, approve/reject with comments
- **Administrators**: User management, rate configuration, system monitoring

### **Developer Resources**
- **[Technical Decisions](docs/00-technical-decision-log.md)** - Architecture choices and rationale
- **[Known Issues](docs/00-debug-list.md)** - Current bugs and TODO items
- **[Business Requirements](docs/01-brs-claimbot.md)** - Project scope and objectives

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend integration tests
npm run test:backend

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- auth.test.ts
```

**Coverage**: 95%+ backend API routes with comprehensive TypeScript compliance

---

## 🔐 Security & Compliance

- **Authentication**: Secure JWT-based authentication via Clerk
- **Authorization**: Role-based access control (RBAC)
- **Audit Trail**: Complete logging of all system actions
- **Data Validation**: Zod schema validation on all inputs
- **File Security**: Validated file types and secure storage

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for:

- Development setup and workflow
- Code standards and best practices
- Testing requirements
- Pull request process

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit using conventional format (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Support & Contact

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/yatt-code/claimbot/issues)
- **API Documentation**: Available at `/api/docs` when running the application
- **Security**: Report security vulnerabilities privately to the maintainers

### **Project Team**
- **Project Lead**: Aiyad
- **Architecture**: Full-stack TypeScript/Next.js application
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: Clerk integration

---

**📝 Last Updated**: June 2, 2025  
**📊 Version**: 1.0.0  
**🏗️ Status**: Phase 4 Complete, Ready for Production Deployment

---

*ClaimBot - Transforming expense and overtime management through modern web technology* 🚀
