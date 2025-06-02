# 🤝 Contributing to ClaimBot

Thank you for your interest in contributing to ClaimBot! This guide will help you get started with development, understand our standards, and contribute effectively to the project.

---

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Development Environment](#-development-environment)
- [Development Workflow](#-development-workflow)
- [Code Standards](#-code-standards)
- [Testing Requirements](#-testing-requirements)
- [Pull Request Process](#-pull-request-process)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Deployment Guide](#-deployment-guide)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Package Manager**: npm 9+, yarn 1.22+, or pnpm 8+
- **Git** for version control
- **MongoDB Atlas** account
- **Clerk** account for authentication

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/claimbot.git
   cd claimbot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Configuration**
   
   Copy the example environment file and update with your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
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

4. **Verify Setup**
   ```bash
   npm run dev
   ```
   
   Navigate to [http://localhost:3000](http://localhost:3000) to verify the application is running.

---

## 💻 Development Environment

### Recommended IDE: VS Code

**Essential Extensions:**
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer

**Recommended VS Code Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Database Development

**Local MongoDB (Optional)**
```bash
# Using Docker for local development
docker run -d \
  --name claimbot-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Update .env.local for local development
MONGODB_URI=mongodb://admin:password@localhost:27017/claimbot?authSource=admin
```

**Sample Data Seeding**
```bash
# Seed database with sample data (when implemented)
npm run db:seed

# This creates:
# - Sample users with different roles
# - Sample rate configurations
# - Demo claims and overtime requests
```

---

## 🔄 Development Workflow

### 1. Feature Development

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Make your changes
# Follow the coding standards below

# Test your changes
npm test
npm run lint
npm run type-check

# Commit with conventional format
git add .
git commit -m "feat: add new feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Branch Naming Convention

- **Features**: `feature/description` (e.g., `feature/add-overtime-approval`)
- **Bug fixes**: `fix/description` (e.g., `fix/calculation-error`)
- **Documentation**: `docs/description` (e.g., `docs/update-api-spec`)
- **Refactoring**: `refactor/description` (e.g., `refactor/user-service`)

### 3. Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add overtime approval notification
fix: resolve mileage calculation bug
docs: update API documentation for claims endpoint
test: add integration tests for user management
refactor: improve error handling in auth service
```

---

## 📏 Code Standards

### TypeScript Standards

- **Strict Mode**: Always use TypeScript strict mode
- **Type Safety**: Avoid `any` types - use proper interfaces and types
- **Naming**: Use descriptive variable and function names
- **Interfaces**: Define clear interfaces for all data structures

**Example:**
```typescript
// ✅ Good
interface ClaimSubmission {
  userId: string;
  date: Date;
  expenses: ExpenseBreakdown;
  status: ClaimStatus;
}

// ❌ Avoid
const data: any = fetchClaims();
```

### React/Next.js Standards

- **Functional Components**: Use function components with hooks
- **Component Structure**: Keep components focused and single-purpose
- **Props Typing**: Always type component props
- **File Naming**: Use PascalCase for components, camelCase for utilities

**Example:**
```typescript
// ✅ Good component structure
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant, size = 'md', onClick, children }: ButtonProps) {
  return (
    <button 
      className={getButtonClasses(variant, size)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### API Route Standards

- **RESTful Design**: Follow REST conventions
- **Error Handling**: Implement comprehensive error handling
- **Validation**: Use Zod schemas for request validation
- **Authorization**: Check permissions for all protected routes

**Example:**
```typescript
// ✅ Good API route structure
export async function POST(request: Request) {
  try {
    // Authentication check
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validation
    const body = await request.json();
    const validatedData = createClaimSchema.parse(body);

    // Business logic
    const claim = await createClaim(userId, validatedData);

    // Audit logging
    await logAuditEvent('created_claim', userId, claim._id);

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### CSS/Styling Standards

- **TailwindCSS**: Use utility-first approach
- **Component Variants**: Use `cva` for component variations
- **Responsive Design**: Mobile-first responsive design
- **Accessibility**: Ensure WCAG 2.1 compliance

---

## 🧪 Testing Requirements

### Testing Philosophy

- **Test-Driven Development**: Write tests before implementing features when possible
- **Comprehensive Coverage**: Aim for 90%+ code coverage
- **Unit & Integration**: Both unit and integration tests are required
- **TypeScript Compliance**: All tests must use proper TypeScript typing

### Backend Testing

**Required for all API routes:**
```typescript
// Example integration test
describe('POST /api/claims', () => {
  it('should create a new claim for authenticated user', async () => {
    const mockUser = createMockUser({ role: 'staff' });
    const claimData = createMockClaimData();
    
    const response = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${mockToken}`)
      .send(claimData)
      .expect(201);
    
    expect(response.body).toMatchObject({
      userId: mockUser._id,
      status: 'draft',
      totalClaim: expect.any(Number)
    });
  });
});
```

### Frontend Testing

**Required for all components:**
```typescript
// Example component test
describe('Button Component', () => {
  it('should render with correct variant styles', () => {
    render(<Button variant="primary">Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('bg-blue-600');
  });
  
  it('should call onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- claims.test.ts

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

### Coverage Requirements

- **Minimum Coverage**: 85% for all new code
- **Critical Paths**: 95% coverage for authentication, payment calculations, approval workflows
- **API Routes**: 100% coverage for all endpoints

---

## 📥 Pull Request Process

### Before Submitting

1. **Run Quality Checks**
   ```bash
   npm run lint        # ESLint checks
   npm run type-check  # TypeScript compilation
   npm test           # All tests pass
   npm run build      # Production build succeeds
   ```

2. **Update Documentation**
   - Update relevant documentation
   - Add/update API documentation if applicable
   - Update README if adding new features

3. **Self Review**
   - Review your own code for clarity and best practices
   - Ensure all new code is properly tested
   - Verify no sensitive information is committed

### PR Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass locally

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or noted)
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: All tests must pass
4. **Documentation**: Documentation must be updated if applicable

---

## 📁 Project Structure

```
claimbot/
├── 📁 src/                          # Source code directory
│   ├── 📁 app/                      # Next.js App Router
│   │   ├── 📁 api/                  # API routes
│   │   ├── 📁 dashboard/            # Staff dashboard
│   │   ├── 📁 submit/               # Submission forms
│   │   ├── 📁 manager/              # Manager interfaces
│   │   ├── 📁 admin/                # Admin panel
│   │   └── 📁 (auth)/               # Authentication pages
│   ├── 📁 components/               # Reusable components
│   │   ├── 📁 ui/                   # ShadCN UI components
│   │   └── [ComponentName].tsx      # Custom components
│   ├── 📁 lib/                      # Utility libraries
│   └── 📁 models/                   # Database models
├── 📁 __tests__/                    # Test suites
│   ├── 📁 backend/                  # API route tests
│   ├── 📁 frontend/                 # Component tests
│   └── 📁 utils/                    # Utility tests
├── 📁 docs/                         # Documentation
├── 📁 public/                       # Static assets
└── Configuration files
```

---

## 📜 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
```

### Database (Future)
```bash
npm run db:seed          # Seed database with sample data
npm run db:migrate       # Run database migrations
```

---

## 🚀 Deployment Guide

### Production Environment

**Environment Variables:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/claimbot
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://claimbot.yourdomain.com
```

### Docker Deployment

**Build and Run:**
```bash
# Build Docker image
docker build -t claimbot:latest .

# Run container
docker run -p 3000:3000 --env-file .env.production claimbot:latest
```

### Cloud Platforms

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel --prod
```

**Manual Deployment:**
```bash
npm run build
npm start
```

---

## 🔧 Troubleshooting

### Common Issues

**Environment Setup:**
- Ensure all required environment variables are set
- Verify MongoDB Atlas connection string
- Check Clerk configuration

**Development Issues:**
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Clear Next.js cache: `rm -rf .next`
- Restart development server

**Testing Issues:**
- Ensure test database is separate from development
- Clear Jest cache: `npx jest --clearCache`
- Check mock configurations

### Getting Help

1. **Check existing issues** in GitHub Issues
2. **Review documentation** in the `docs/` folder
3. **Ask questions** in GitHub Discussions
4. **Contact maintainers** for urgent issues

---

## 📋 Code Review Checklist

### For Reviewers

- [ ] Code follows established patterns and conventions
- [ ] All new code has appropriate tests
- [ ] Documentation is updated where necessary
- [ ] No security vulnerabilities introduced
- [ ] Performance considerations addressed
- [ ] Error handling is comprehensive
- [ ] TypeScript types are properly defined

### For Contributors

- [ ] Feature works as intended
- [ ] All tests pass locally
- [ ] Code is properly formatted (Prettier)
- [ ] No ESLint warnings or errors
- [ ] TypeScript compiles without errors
- [ ] Git history is clean and meaningful
- [ ] PR description clearly explains changes

---

**📝 Last Updated**: June 2, 2025  
**🏗️ Status**: Phase 4 Complete, Ready for Production  
**📧 Contact**: For questions about contributing, please open an issue or discussion

---

*Thank you for contributing to ClaimBot! Together we're building a modern, efficient expense and overtime management system.* 🚀