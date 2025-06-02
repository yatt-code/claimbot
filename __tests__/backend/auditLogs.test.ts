// __tests__/backend/auditLogs.test.ts
import { createRequest } from 'node-mocks-http';
import { GET as handleGetAuditLogs } from '@/app/api/audit-logs/route';
import dbConnect from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Define interface for expected audit log response structure
interface AuditLogResponse {
  _id: string;
  userId: string;
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any; // Adjust if details has a specific structure
  timestamp: string; // Assuming ISO string
  // Add other fields if needed
}


// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock<typeof auth>; // Cast auth to unknown then to jest.Mock type

describe('Audit Logs API', () => {
  beforeAll(async () => {
    await dbConnect();
    // Clean up the database before tests
    await AuditLog.deleteMany({});
    await User.deleteMany({});
  });

  afterEach(async () => {
    // Clean up data after each test
    await AuditLog.deleteMany({});
    await User.deleteMany({});
    mockAuth.mockReset();
  });

  afterAll(async () => {
    // Disconnect after all tests
    // Note: In a real app, manage connection lifecycle carefully
  });

  describe('GET /api/audit-logs', () => {
    it('should return 401 if user is not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: null } as any));
      const req = createRequest({ method: 'GET' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handleGetAuditLogs as any)(req as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_staff123' } as any));
      // Create a non-admin user
      await User.create({ clerkId: 'user_staff123', role: 'staff', name: 'Staff User', email: 'staff@example.com' });

      const req = createRequest({ method: 'GET' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handleGetAuditLogs as any)(req as any);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return audit logs if user is an admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
      // Create an admin user
      await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });

      // Create some dummy audit logs
      await AuditLog.create({
        userId: 'user_staff1',
        action: 'SUBMIT_CLAIM',
        details: { claimId: new mongoose.Types.ObjectId() },
        timestamp: new Date(),
      });
      await AuditLog.create({
        userId: 'user_manager1',
        action: 'APPROVE_CLAIM',
        details: { claimId: new mongoose.Types.ObjectId() },
        timestamp: new Date(),
      });

      const req = createRequest({ method: 'GET' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handleGetAuditLogs as any)(req as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(2);
      // Basic check for log data presence
      expect(body.some((log: AuditLogResponse) => log.action === 'SUBMIT_CLAIM')).toBe(true);
      expect(body.some((log: AuditLogResponse) => log.action === 'APPROVE_CLAIM')).toBe(true);
    });

    // TODO: Add tests for filtering and pagination if implemented in the API route
  });
});