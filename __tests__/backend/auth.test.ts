import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';

// Mock Clerk's auth() helper
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Mock the database connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the User model
const mockUser = {
  findOne: jest.fn(),
};

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: mockUser,
}));

// Import the actual API route handler
import { GET as GET_Profile } from '@/app/api/auth/profile/route';

// Type the mocked functions properly
const mockAuth = auth as unknown as jest.MockedFunction<() => { userId: string | null }>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

// Define interfaces for better type safety
interface MockUser {
  _id: string;
  clerkId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

describe('Auth API Routes', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockAuth.mockReset();
    (mockUser.findOne as jest.Mock).mockReset();
    mockDbConnect.mockReset();
  });

  describe('GET /api/auth/profile', () => {
    test('should return 401 if user is not authenticated', async () => {
      // Mock auth() to return no userId (unauthenticated)
      mockAuth.mockReturnValue({ userId: null });

      // Create a mock request object
      const mockRequest = {
        headers: {},
      } as unknown as Request;

      const response = await (GET_Profile as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    test('should return user profile if authenticated and user exists in DB', async () => {
      const testUserId = 'user_test123';
      const testUser: MockUser = {
        _id: 'mongo_id_123',
        clerkId: testUserId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'staff',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock dbConnect to resolve immediately
      mockDbConnect.mockResolvedValue({} as typeof import('mongoose'));

      // Mock auth() to return a userId (authenticated)
      mockAuth.mockReturnValue({ userId: testUserId });

      // Mock User.findOne to return a user document
      (mockUser.findOne as jest.Mock).mockResolvedValue(testUser);

      const mockRequest = {
        headers: {},
      } as unknown as Request;

      const response = await (GET_Profile as unknown as (req: Request) => Promise<Response>)(mockRequest);

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
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockUser.findOne).toHaveBeenCalledWith({ clerkId: testUserId });
    });

    test('should return 404 if authenticated but user not found in DB', async () => {
      const testUserId = 'user_not_in_db';

      // Mock dbConnect to resolve immediately
      mockDbConnect.mockResolvedValue({} as typeof import('mongoose'));

      // Mock auth() to return a userId (authenticated)
      mockAuth.mockReturnValue({ userId: testUserId });

      // Mock User.findOne to return null (user not found)
      (mockUser.findOne as jest.Mock).mockResolvedValue(null);

      const mockRequest = {
        headers: {},
      } as unknown as Request;

      const response = await (GET_Profile as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toBe('User not found in database');

      // Verify that dbConnect and User.findOne were called
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockUser.findOne).toHaveBeenCalledWith({ clerkId: testUserId });
    });
  });
});