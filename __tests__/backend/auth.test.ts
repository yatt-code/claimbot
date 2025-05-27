import request from 'supertest';
// We need to import the Next.js app instance to test API routes
// This might require a custom test setup or a way to import the handler directly.
// For simplicity in this basic example, we'll assume a way to test the API route handler.
// In a real Next.js project, testing API routes with Supertest often involves
// importing the handler function or using a library like `next-test-api-route-handler`.

// Mock Clerk's auth() helper for testing authenticated scenarios
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Import the actual API route handler
// This import path assumes the handler is directly exportable.
// Depending on the Next.js version and structure, this might need adjustment.
import { GET as GET_Profile } from '@/app/api/auth/profile/route';

// Mock the database connection to prevent actual DB calls during tests
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()), // Mock dbConnect to resolve immediately
}));

// Mock the User model to control database interactions
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

const mockAuth = require('@clerk/nextjs/server').auth;
const mockUser = require('@/models/User').default;

describe('Auth API Routes', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockAuth.mockReset();
    mockUser.findOne.mockReset();
  });

  describe('GET /api/auth/profile', () => {
    test('should return 401 if user is not authenticated', async () => {
      // Mock auth() to return no userId (unauthenticated)
      mockAuth.mockReturnValue({ userId: null });

      // Create a mock request object (Supertest might handle this, but explicit mock is clearer)
      const mockRequest = {
        headers: {},
      } as any; // Use 'any' for simplified mocking

      const response = await GET_Profile(mockRequest);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    // Test case for authenticated user (requires mocking the User model response)
    test('should return user profile if authenticated and user exists in DB', async () => {
      const testUserId = 'user_test123';
      const testUser = {
        _id: 'mongo_id_123',
        clerkId: testUserId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'staff',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock auth() to return a userId (authenticated)
      mockAuth.mockReturnValue({ userId: testUserId });

      // Mock User.findOne to return a user document
      mockUser.findOne.mockResolvedValue(testUser);

      const mockRequest = {
        headers: {},
      } as any;

      const response = await GET_Profile(mockRequest);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(expect.objectContaining({
        _id: 'mongo_id_123',
        clerkId: testUserId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'staff',
        isActive: true,
      }));
      // Check that sensitive fields like salary are not included by default
      expect(body).not.toHaveProperty('salary');
      expect(body).not.toHaveProperty('hourlyRate');

      // Verify that dbConnect and User.findOne were called
      expect(require('@/lib/mongodb').default).toHaveBeenCalled();
      expect(mockUser.findOne).toHaveBeenCalledWith({ clerkId: testUserId });
    });

    test('should return 404 if authenticated but user not found in DB', async () => {
        const testUserId = 'user_not_in_db';

        // Mock auth() to return a userId (authenticated)
        mockAuth.mockReturnValue({ userId: testUserId });

        // Mock User.findOne to return null (user not found)
        mockUser.findOne.mockResolvedValue(null);

        const mockRequest = {
            headers: {},
        } as any;

        const response = await GET_Profile(mockRequest);

        expect(response.status).toBe(404);
        const body = await response.json();
        expect(body).toBe('User not found in database');

        // Verify that dbConnect and User.findOne were called
        expect(require('@/lib/mongodb').default).toHaveBeenCalled();
        expect(mockUser.findOne).toHaveBeenCalledWith({ clerkId: testUserId });
    });
  });
});