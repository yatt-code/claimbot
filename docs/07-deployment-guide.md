# 🚀 ClaimBot Deployment Guide

## Project Information
- **Document Type**: Deployment & Operations Guide
- **Version**: 1.0
- **Last Updated**: June 2, 2025
- **Audience**: DevOps Engineers, System Administrators, Developers

---

## 📋 Table of Contents

- [Production Deployment](#-production-deployment)
- [Environment Configuration](#-environment-configuration)
- [Docker Deployment](#-docker-deployment)
- [Cloud Platform Deployment](#-cloud-platform-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Monitoring & Logging](#-monitoring--logging)
- [Security Considerations](#-security-considerations)
- [Backup & Recovery](#-backup--recovery)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Production Deployment

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **MongoDB Atlas** cluster configured
- **Clerk** production account setup
- **Domain** with SSL certificate
- **Cloud platform** account (Vercel, AWS, GCP, etc.)

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] DNS records configured
- [ ] Monitoring systems active
- [ ] Backup procedures established
- [ ] Security audit completed
- [ ] Performance testing completed

---

## 🔧 Environment Configuration

### Production Environment Variables

Create a `.env.production` file with the following variables:

```env
# Application Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://claimbot.yourdomain.com

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/claimbot

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret-key

# File Storage (Optional - for cloud storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=claimbot-files
AWS_REGION=us-east-1

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn-for-error-tracking

# Performance
NEXT_TELEMETRY_DISABLED=1
```

### Environment Variable Security

- **Never commit** `.env` files to version control
- **Use environment-specific** variable management (Vercel, AWS Secrets Manager, etc.)
- **Rotate secrets** regularly
- **Use least privilege** access for service accounts

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create system user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  claimbot:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - claimbot-network

  # Optional: MongoDB (if not using Atlas)
  mongodb:
    image: mongo:7.0
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    restart: unless-stopped
    networks:
      - claimbot-network

  # Optional: Reverse Proxy (Nginx)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - claimbot
    restart: unless-stopped
    networks:
      - claimbot-network

volumes:
  mongodb_data:

networks:
  claimbot-network:
    driver: bridge
```

### Build and Deploy Commands

```bash
# Build Docker image
docker build -t claimbot:latest .

# Run container locally
docker run -p 3000:3000 --env-file .env.production claimbot:latest

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f claimbot

# Scale services
docker-compose up -d --scale claimbot=3
```

---

## ☁️ Cloud Platform Deployment

### Vercel (Recommended for Next.js)

#### Automatic Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   ```bash
   # Set environment variables via CLI
   vercel env add MONGODB_URI production
   vercel env add CLERK_SECRET_KEY production
   
   # Or use Vercel dashboard
   # https://vercel.com/your-team/claimbot/settings/environment-variables
   ```

3. **Custom Domain**
   ```bash
   # Add custom domain
   vercel domains add claimbot.yourdomain.com
   ```

#### Vercel Configuration

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "CLERK_SECRET_KEY": "@clerk-secret-key"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### AWS ECS/Fargate Deployment

#### Task Definition

```json
{
  "family": "claimbot-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "claimbot",
      "image": "your-account.dkr.ecr.region.amazonaws.com/claimbot:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:claimbot/mongodb-uri"
        },
        {
          "name": "CLERK_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:claimbot/clerk-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/claimbot",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Deployment Commands

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin account.dkr.ecr.us-east-1.amazonaws.com

docker build -t claimbot:latest .
docker tag claimbot:latest account.dkr.ecr.us-east-1.amazonaws.com/claimbot:latest
docker push account.dkr.ecr.us-east-1.amazonaws.com/claimbot:latest

# Update ECS service
aws ecs update-service --cluster claimbot-cluster --service claimbot-service --force-new-deployment
```

### Google Cloud Run

#### Deployment

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/project-id/claimbot

# Deploy to Cloud Run
gcloud run deploy claimbot \
  --image gcr.io/project-id/claimbot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars NEXT_PUBLIC_APP_URL=https://claimbot.yourdomain.com
```

#### Cloud Run Configuration

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: claimbot
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      containers:
      - image: gcr.io/project-id/claimbot
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: claimbot-secrets
              key: mongodb-uri
        resources:
          limits:
            cpu: 1000m
            memory: 512Mi
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install Vercel CLI
      run: npm install --global vercel@latest
    
    - name: Pull Vercel Environment Information
      run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
    
    - name: Build Project Artifacts
      run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
    
    - name: Deploy Project Artifacts to Vercel
      run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  notify:
    needs: [test, deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Notify deployment status
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test:
  stage: test
  image: node:18-alpine
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run type-check
    - npm run lint
    - npm test
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main

deploy:
  stage: deploy
  image: alpine/kubectl:latest
  script:
    - kubectl set image deployment/claimbot claimbot=$DOCKER_IMAGE
    - kubectl rollout status deployment/claimbot
  environment:
    name: production
    url: https://claimbot.yourdomain.com
  only:
    - main
```

---

## 📊 Monitoring & Logging

### Application Monitoring

#### Health Check Endpoint

Create `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    // Check database connection
    await connectDB();
    
    // Check external services
    const clerkStatus = await checkClerkHealth();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        clerk: clerkStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 });
  }
}
```

#### Prometheus Metrics

```typescript
// lib/metrics.ts
import promClient from 'prom-client';

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

export const activeUsers = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

export const claimsTotal = new promClient.Counter({
  name: 'claims_total',
  help: 'Total number of claims submitted',
  labelNames: ['status']
});
```

### Error Tracking with Sentry

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
```

### Log Aggregation

#### Structured Logging

```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'claimbot' },
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

export default logger;
```

---

## 🔒 Security Considerations

### Security Headers

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Environment Security

- **Secrets Management**: Use cloud-native secret management
- **Network Security**: Implement VPC, security groups, and firewalls
- **Access Control**: Least privilege access for all services
- **Encryption**: Encrypt data in transit and at rest
- **Regular Updates**: Keep dependencies and base images updated

---

## 💾 Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
MONGODB_URI="your-mongodb-connection-string"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

### Automated Backup with Cron

```bash
# Add to crontab
# Daily backup at 2 AM
0 2 * * * /path/to/backup-mongodb.sh

# Weekly full backup on Sunday at 3 AM
0 3 * * 0 /path/to/full-backup.sh
```

### Recovery Procedures

```bash
#!/bin/bash
# restore-mongodb.sh

BACKUP_FILE="$1"
MONGODB_URI="your-mongodb-connection-string"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.tar.gz>"
  exit 1
fi

# Extract backup
tar -xzf "$BACKUP_FILE"

# Restore database
mongorestore --uri="$MONGODB_URI" --drop backup_*/

echo "Database restored from $BACKUP_FILE"
```

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check MongoDB Atlas connectivity
curl -I https://cluster0.mongodb.net/

# Test connection string
node -e "
const { MongoClient } = require('mongodb');
MongoClient.connect('your-connection-string')
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"
```

#### Authentication Issues

```bash
# Verify Clerk configuration
curl -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  https://api.clerk.dev/v1/users
```

#### Performance Issues

```bash
# Check memory usage
docker stats claimbot

# Check logs for errors
docker logs claimbot --tail 100

# Monitor database queries
# Enable MongoDB profiler for slow queries
```

### Debugging Commands

```bash
# View application logs
docker-compose logs -f claimbot

# Execute commands in container
docker-compose exec claimbot sh

# Check environment variables
docker-compose exec claimbot env

# Test API endpoints
curl -X GET https://claimbot.yourdomain.com/api/health

# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Rollback Procedures

```bash
# Rollback to previous version (Vercel)
vercel rollback

# Rollback Docker deployment
docker-compose down
docker-compose up -d --force-recreate

# Rollback ECS service
aws ecs update-service \
  --cluster claimbot-cluster \
  --service claimbot-service \
  --task-definition claimbot-task:previous-revision
```

---

## 📋 Post-Deployment Checklist

### Immediate Post-Deployment

- [ ] ✅ Health check endpoint responds correctly
- [ ] ✅ Database connection established
- [ ] ✅ Authentication flows working
- [ ] ✅ File uploads functional
- [ ] ✅ All API endpoints responding
- [ ] ✅ SSL certificate valid
- [ ] ✅ DNS resolution correct

### Application Functionality

- [ ] ✅ User registration and login
- [ ] ✅ Claims submission workflow
- [ ] ✅ Overtime request workflow
- [ ] ✅ Manager approval process
- [ ] ✅ Admin panel functionality
- [ ] ✅ File upload/download
- [ ] ✅ Report generation

### Monitoring & Security

- [ ] ✅ Monitoring alerts configured
- [ ] ✅ Log aggregation working
- [ ] ✅ Error tracking active
- [ ] ✅ Backup procedures tested
- [ ] ✅ Security headers configured
- [ ] ✅ Rate limiting active

### Performance & Scalability

- [ ] ✅ Performance benchmarks met
- [ ] ✅ Database indexes optimized
- [ ] ✅ CDN configured (if applicable)
- [ ] ✅ Auto-scaling configured
- [ ] ✅ Load testing completed

---

**📝 Document Version**: 1.0  
**🔄 Last Updated**: June 2, 2025  
**📧 Maintained by**: DevOps Team

---

*Comprehensive deployment guide for ClaimBot production environments* 🚀🔧