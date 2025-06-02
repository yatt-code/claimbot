import { createRequest } from 'node-mocks-http';
import { GET as handleGetAllRates } from '@/app/api/config/rates/route';
import { PATCH as handlePatchRate } from '@/app/api/config/rates/[id]/route';
import dbConnect from '@/lib/mongodb';
import RateConfig from '@/models/RateConfig';
import User from '@/models/User';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
// Define interface for expected rate configuration response structure
interface RateConfigResponse {
  _id: string;
  type: string;
  rate?: number;
  value?: number;
  effectiveDate: string; // Assuming ISO string
  // Add other fields if needed
}

// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

import { auth } from '@clerk/nextjs/server';

const mockAuth = auth as unknown as jest.Mock<typeof auth>; // Cast auth to unknown then to jest.Mock type
describe('Rate Configuration API', () => {
  beforeAll(async () => {
    await dbConnect();
    // Clean up the database before tests
    await RateConfig.deleteMany({});
    await User.deleteMany({});
  });

  afterEach(async () => {
    // Clean up data after each test
    await RateConfig.deleteMany({});
    await User.deleteMany({});
    mockAuth.mockReset();
  });

  afterAll(async () => {
    // Disconnect after all tests
    // Note: In a real app, manage connection lifecycle carefully
  });

  describe('GET /api/config/rates', () => {
    it('should return 401 if user is not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: null } as any));
      const req = createRequest({ method: 'GET' });

      // Need to call the actual route handler function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handleGetAllRates as any)(req as any); // Cast function to any

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
      const response = await (handleGetAllRates as any)(req as any); // Cast function to any

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return rate configurations if user is an admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
      // Create an admin user
      await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });
      // Create some rate configurations
      await RateConfig.create({ type: 'overtime', rate: 1.5, effectiveDate: new Date() });
      await RateConfig.create({ type: 'mileage', value: 0.5, effectiveDate: new Date() });

      const req = createRequest({ method: 'GET' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handleGetAllRates as any)(req as any); // Cast function to any

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(2);
      // Check if the returned data includes the created rates (basic check)
      expect(body.some((r: RateConfigResponse) => r.type === 'overtime' && r.rate === 1.5)).toBe(true);
      expect(body.some((r: RateConfigResponse) => r.type === 'mileage' && r.value === 0.5)).toBe(true);
    });
  });

  describe('PATCH /api/config/rates/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: null } as any));
      const req = createRequest({ method: 'PATCH', body: { rate: 2.0 } });

      // Need to provide params for the dynamic route handler
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handlePatchRate as any)(req as any, { params: { id: 'someid' } }); // Cast function to any

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_staff123' } as any));
      // Create a non-admin user
      await User.create({ clerkId: 'user_staff123', role: 'staff', name: 'Staff User', email: 'staff@example.com' });
      // Create a rate to update
      const rateToUpdate = await RateConfig.create({ type: 'overtime', rate: 1.5, effectiveDate: new Date() });

      const req = createRequest({ method: 'PATCH', body: { rate: 2.0 } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handlePatchRate as any)(req as any, { params: { id: rateToUpdate._id.toString() } }); // Cast function to any

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return 400 if invalid rate ID format is provided', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
        await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });

        const req = createRequest({ method: 'PATCH', body: { rate: 2.0 } });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (handlePatchRate as any)(req as any, { params: { id: 'invalid-id' } }); // Cast function to any

        expect(response.status).toBe(400);
        const body = await response.json();
        // TODO: Backend error message says "Invalid user ID format", should ideally be "Invalid rate ID format"
        expect(body).toBe('Invalid user ID format');
    });

     it('should return 404 if rate is not found', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
        await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });

        const nonExistentId = new mongoose.Types.ObjectId().toString(); // Create a valid but non-existent ID

        const req = createRequest({ method: 'PATCH', body: { rate: 2.0 } });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (handlePatchRate as any)(req as any, { params: { id: nonExistentId } }); // Cast function to any

        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body).toBe('Rate configuration not found');
    });


    it('should update rate configuration if user is an admin and valid data is provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockAuth.mockReturnValue(Promise.resolve({ userId: 'user_admin123' } as any));
      // Create an admin user
      await User.create({ clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' });
      // Create a rate to update
      const rateToUpdate = await RateConfig.create({ type: 'overtime', rate: 1.5, effectiveDate: new Date() });

      const req = createRequest({ method: 'PATCH', body: { rate: 2.0 } });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (handlePatchRate as any)(req as any, { params: { id: rateToUpdate._id.toString() } }); // Cast function to any

      expect(response.status).toBe(200);
      const updatedRate = await response.json();
      expect(updatedRate.rate).toBe(2.0);

      // Verify the change in the database
      const rateInDb = await RateConfig.findById(rateToUpdate._id);
      expect(rateInDb?.rate).toBe(2.0);
    });
  });

  // TODO: Add tests for other fields if PATCH handler is expanded
  // TODO: Add tests for POST /api/config/rates (creating new rates) if that functionality is needed
});