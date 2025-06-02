// __tests__/backend/reports.test.ts
import { createRequest } from 'node-mocks-http';
import { GET as handleGetReports } from '@/app/api/reports/route';
import dbConnect from '@/lib/mongodb';
import Claim from '@/models/Claim';
import Overtime from '@/models/Overtime';
import User from '@/models/User';
import { jest } from '@jest/globals';

// Define interface for expected report item structure (combined claims and overtime)
interface ReportItem {
  _id: string;
  userId: string;
  type: 'claim' | 'overtime' | 'expense'; // Assuming type is included in the response
  status: string;
  submissionDate: string; // Assuming ISO string
  description: string;
  amount?: number; // Optional for claims
  hours?: number; // Optional for overtime
  // Add other common fields if needed
}


// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock<typeof auth>; // Cast auth to unknown then to jest.Mock type

describe('Reports API', () => {
  beforeAll(async () => {
    await dbConnect();
    // Clean up the database before tests
    await Claim.deleteMany({});
    await Overtime.deleteMany({});
    await User.deleteMany({});
  });

  afterEach(async () => {
    // Clean up data after each test
    await Claim.deleteMany({});
    await Overtime.deleteMany({});
    await User.deleteMany({});
    mockAuth.mockReset();
  });

  afterAll(async () => {
    // Disconnect after all tests
    // Note: In a real app, manage connection lifecycle carefully
  });

  describe('GET /api/reports', () => {
    it('should return 401 if user is not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: null } as any));
      const req = createRequest({ method: 'GET' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handleGetReports as any)(req as any);

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
      const response = await (handleGetReports as any)(req as any);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return all claims and overtime submissions if user is an admin and no criteria are provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
      // Create an admin user
      await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });
      // Create some dummy claims and overtime
      const user1 = await User.create({ clerkId: 'user_staff1', role: 'staff', name: 'Staff One', email: 'staff1@example.com' });
      const user2 = await User.create({ clerkId: 'user_staff2', role: 'staff', name: 'Staff Two', email: 'staff2@example.com' });

      await Claim.create({
        userId: user1._id,
        type: 'expense',
        amount: 100,
        status: 'approved',
        submissionDate: new Date('2023-10-01'),
        description: 'Claim 1',
      });
      await Overtime.create({
        userId: user2._id,
        hours: 5,
        status: 'pending',
        submissionDate: new Date('2023-10-05'),
        description: 'Overtime 1',
      });

      const req = createRequest({ method: 'GET' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handleGetReports as any)(req as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(2); // 1 claim + 1 overtime
      // Basic check for data presence (assuming the API returns a combined list)
      expect(body.some((item: ReportItem) => item.type === 'expense' && item.amount === 100)).toBe(true);
      expect(body.some((item: ReportItem) => item.hours === 5 && item.status === 'pending')).toBe(true);
    });

    it('should return filtered reports based on criteria (e.g., date range)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
        await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });
        const user1 = await User.create({ clerkId: 'user_staff1', role: 'staff', name: 'Staff One', email: 'staff1@example.com' });

        // Create claims/overtime with different dates
        await Claim.create({ userId: user1._id, type: 'expense', amount: 50, status: 'approved', submissionDate: new Date('2023-11-10'), description: 'Claim Nov' });
        await Overtime.create({ userId: user1._id, hours: 3, status: 'approved', submissionDate: new Date('2023-12-01'), description: 'Overtime Dec' });
        await Claim.create({ userId: user1._id, type: 'expense', amount: 75, status: 'pending', submissionDate: new Date('2024-01-15'), description: 'Claim Jan' });

        const req = createRequest({
            method: 'GET',
            query: {
                startDate: '2023-11-01',
                endDate: '2023-12-31',
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (handleGetReports as any)(req as any);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toHaveLength(2); // Should include Nov claim and Dec overtime
        expect(body.some((item: ReportItem) => item.description === 'Claim Nov')).toBe(true);
        expect(body.some((item: ReportItem) => item.description === 'Overtime Dec')).toBe(true);
        expect(body.some((item: ReportItem) => item.description === 'Claim Jan')).toBe(false); // Should not include Jan claim
    });

    it('should return filtered reports based on criteria (e.g., user ID)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
        await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });
        const user1 = await User.create({ clerkId: 'user_staff1', role: 'staff', name: 'Staff One', email: 'staff1@example.com' });
        const user2 = await User.create({ clerkId: 'user_staff2', role: 'staff', name: 'Staff Two', email: 'staff2@example.com' });

        // Create claims/overtime for different users
        await Claim.create({ userId: user1._id, type: 'expense', amount: 50, status: 'approved', submissionDate: new Date(), description: 'User 1 Claim' });
        await Overtime.create({ userId: user2._id, hours: 3, status: 'approved', submissionDate: new Date(), description: 'User 2 Overtime' });

        const req = createRequest({
            method: 'GET',
            query: {
                userId: user1._id.toString(),
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (handleGetReports as any)(req as any);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toHaveLength(1); // Should only include User 1's claim
        expect(body.some((item: ReportItem) => item.description === 'User 1 Claim')).toBe(true);
        expect(body.some((item: ReportItem) => item.description === 'User 2 Overtime')).toBe(false);
    });

     it('should return filtered reports based on criteria (e.g., status)', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
        await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });
        const user1 = await User.create({ clerkId: 'user_staff1', role: 'staff', name: 'Staff One', email: 'staff1@example.com' });

        // Create claims/overtime with different statuses
        await Claim.create({ userId: user1._id, type: 'expense', amount: 50, status: 'approved', submissionDate: new Date(), description: 'Approved Claim' });
        await Overtime.create({ userId: user1._id, hours: 3, status: 'pending', submissionDate: new Date(), description: 'Pending Overtime' });
        await Claim.create({ userId: user1._id, type: 'expense', amount: 75, status: 'rejected', submissionDate: new Date(), description: 'Rejected Claim' });


        const req = createRequest({
            method: 'GET',
            query: {
                status: 'approved',
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (handleGetReports as any)(req as any);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toHaveLength(1); // Should only include the approved claim
        expect(body.some((item: ReportItem) => item.description === 'Approved Claim')).toBe(true);
        expect(body.some((item: ReportItem) => item.description === 'Pending Overtime')).toBe(false);
        expect(body.some((item: ReportItem) => item.description === 'Rejected Claim')).toBe(false);
    });


    it('should return an empty array if no reports match the criteria', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
        await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });
        const user1 = await User.create({ clerkId: 'user_staff1', role: 'staff', name: 'Staff One', email: 'staff1@example.com' });

        // Create some data, but the query will not match it
        await Claim.create({ userId: user1._id, type: 'expense', amount: 50, status: 'approved', submissionDate: new Date('2023-11-10'), description: 'Claim Nov' });

        const req = createRequest({
            method: 'GET',
            query: {
                startDate: '2024-01-01', // Date range that won't match
                endDate: '2024-01-31',
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (handleGetReports as any)(req as any);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body).toHaveLength(0); // Should return an empty array
    });

    // TODO: Add tests for combining multiple criteria
    // TODO: Add tests for pagination if implemented in the API route
  });
});