import { createRequest } from 'node-mocks-http';
import { GET as handleGetAllUsers, POST as handleCreateUser } from '@/app/api/users/route';
import { GET as handleGetUserById, PATCH as handleUpdateUser, DELETE as handleDeleteUser } from '@/app/api/users/[id]/route';
import dbConnect from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

// Mock Clerk authentication
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
  deleteMany: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  find: jest.fn(),
};

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: mockUser,
}));

// Type the mocked functions properly
const mockAuth = auth as unknown as jest.MockedFunction<() => { userId: string | null }>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

// Define interfaces for better type safety
interface MockUserData {
  _id?: string;
  clerkId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  salary?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

describe('User Management API', () => {
  beforeAll(() => {
    // Mock dbConnect to resolve immediately
    mockDbConnect.mockResolvedValue({} as typeof import('mongoose'));
  });

  beforeEach(() => {
    // Reset all mocks before each test
    mockAuth.mockReset();
    (mockUser.deleteMany as jest.Mock).mockReset();
    (mockUser.create as jest.Mock).mockReset();
    (mockUser.findOne as jest.Mock).mockReset();
    (mockUser.findById as jest.Mock).mockReset();
    (mockUser.findByIdAndUpdate as jest.Mock).mockReset();
    (mockUser.findByIdAndDelete as jest.Mock).mockReset();
    (mockUser.find as jest.Mock).mockReset();
  });

  describe('GET /api/users', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });
      const req = createRequest({ method: 'GET' });

      const response = await (handleGetAllUsers as unknown as (req: Request) => Promise<Response>)(req as unknown as Request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      mockAuth.mockReturnValue({ userId: 'user_staff123' });
      
      const staffUser: MockUserData = {
        _id: 'staff_id',
        clerkId: 'user_staff123',
        role: 'staff',
        name: 'Staff User',
        email: 'staff@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const req = createRequest({ method: 'GET' });

      const response = await (handleGetAllUsers as unknown as (req: Request) => Promise<Response>)(req as unknown as Request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return all users if user is an admin', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      
      const allUsers: MockUserData[] = [
        adminUser,
        { _id: 'staff1_id', clerkId: 'user_staff1', role: 'staff', name: 'Staff One', email: 'staff1@example.com' },
        { _id: 'manager1_id', clerkId: 'user_manager1', role: 'manager', name: 'Manager One', email: 'manager1@example.com' }
      ];

      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);
      (mockUser.find as jest.Mock).mockResolvedValue(allUsers);

      const req = createRequest({ method: 'GET' });

      const response = await (handleGetAllUsers as unknown as (req: Request) => Promise<Response>)(req as unknown as Request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveLength(3);
      expect(body.some((user: MockUserData) => user.email === 'staff1@example.com')).toBe(true);
      expect(body.some((user: MockUserData) => user.email === 'manager1@example.com')).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });
      const req = createRequest({
        method: 'POST',
        body: { clerkId: 'new_user_id', name: 'New User', email: 'new@example.com', role: 'staff' }
      });

      const response = await (handleCreateUser as unknown as (req: Request) => Promise<Response>)(req as unknown as Request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      mockAuth.mockReturnValue({ userId: 'user_staff123' });
      
      const staffUser: MockUserData = {
        _id: 'staff_id',
        clerkId: 'user_staff123',
        role: 'staff',
        name: 'Staff User',
        email: 'staff@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const req = createRequest({
        method: 'POST',
        body: { clerkId: 'new_user_id', name: 'New User', email: 'new@example.com', role: 'staff' }
      });

      const response = await (handleCreateUser as unknown as (req: Request) => Promise<Response>)(req as unknown as Request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return 400 if required fields are missing', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);

      const req = createRequest({
        method: 'POST',
        body: { name: 'New User', email: 'new@example.com' } // Missing clerkId and role
      });

      const response = await (handleCreateUser as unknown as (req: Request) => Promise<Response>)(req as unknown as Request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toBe('Missing required fields');
    });

    it('should return 409 if user with clerkId or email already exists', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };

      const existingUser: MockUserData = {
        _id: 'existing_id',
        clerkId: 'existing_user_id',
        role: 'staff',
        name: 'Existing User',
        email: 'existing@example.com'
      };

      (mockUser.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUser) // First call for admin check
        .mockResolvedValueOnce(existingUser); // Second call for duplicate check

      const req1 = createRequest({
        method: 'POST',
        body: {
          clerkId: 'another_new_id',
          name: 'Another User',
          email: 'existing@example.com',
          role: 'staff'
        }
      });

      const response1 = await (handleCreateUser as unknown as (req: Request) => Promise<Response>)(req1 as unknown as Request);
      
      expect(response1.status).toBe(409);
      const body1 = await response1.json();
      expect(body1).toBe('User with this Clerk ID or email already exists');
    });

    it('should create a new user if user is an admin and valid data is provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };

      const newUserData = {
        clerkId: 'new_user_id',
        name: 'New User',
        email: 'new@example.com',
        role: 'staff',
        department: 'IT',
        designation: 'Developer',
        salary: 60000,
      };

      const createdUser: MockUserData = {
        ...newUserData,
        _id: 'new_user_mongo_id',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockUser.findOne as jest.Mock)
        .mockResolvedValueOnce(adminUser) // Admin check
        .mockResolvedValueOnce(null); // No duplicate user found
      (mockUser.create as jest.Mock).mockResolvedValue(createdUser);

      const req = createRequest({ method: 'POST', body: newUserData });

      const response = await (handleCreateUser as unknown as (req: Request) => Promise<Response>)(req as unknown as Request);

      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        clerkId: 'new_user_id',
        name: 'New User',
        email: 'new@example.com',
        role: 'staff',
        department: 'IT',
        designation: 'Developer',
        salary: 60000,
        isActive: true,
      });
      expect(responseBody._id).toBeDefined();
    });
  });

  describe('GET /api/users/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });
      const req = createRequest({ method: 'GET' });

      const response = await (handleGetUserById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'someid' } }
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      mockAuth.mockReturnValue({ userId: 'user_staff123' });
      
      const staffUser: MockUserData = {
        _id: 'staff_id',
        clerkId: 'user_staff123',
        role: 'staff',
        name: 'Staff User',
        email: 'staff@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const req = createRequest({ method: 'GET' });

      const response = await (handleGetUserById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'some_user_id' } }
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return 400 if invalid user ID format is provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);

      const req = createRequest({ method: 'GET' });

      const response = await (handleGetUserById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'invalid-id' } }
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toBe('Invalid user ID format');
    });

    it('should return 404 if user is not found', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);
      (mockUser.findById as jest.Mock).mockResolvedValue(null);

      const req = createRequest({ method: 'GET' });

      const response = await (handleGetUserById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: nonExistentId } }
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toBe('User not found');
    });

    it('should return user details if user is an admin and valid ID is provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };

      const userToFetch: MockUserData = {
        _id: 'user_to_fetch_id',
        clerkId: 'user_to_fetch',
        role: 'staff',
        name: 'Fetch User',
        email: 'fetch@example.com'
      };

      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);
      (mockUser.findById as jest.Mock).mockResolvedValue(userToFetch);

      const req = createRequest({ method: 'GET' });

      const response = await (handleGetUserById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: userToFetch._id! } }
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        clerkId: 'user_to_fetch',
        name: 'Fetch User',
        email: 'fetch@example.com',
        role: 'staff',
      });
      expect(body._id).toBe(userToFetch._id);
    });
  });

  describe('PATCH /api/users/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });
      const req = createRequest({ method: 'PATCH', body: { role: 'manager' } });

      const response = await (handleUpdateUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'someid' } }
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      mockAuth.mockReturnValue({ userId: 'user_staff123' });
      
      const staffUser: MockUserData = {
        _id: 'staff_id',
        clerkId: 'user_staff123',
        role: 'staff',
        name: 'Staff User',
        email: 'staff@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const req = createRequest({ method: 'PATCH', body: { role: 'manager' } });

      const response = await (handleUpdateUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'some_user_id' } }
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return 400 if invalid user ID format is provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);

      const req = createRequest({ method: 'PATCH', body: { role: 'manager' } });

      const response = await (handleUpdateUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'invalid-id' } }
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toBe('Invalid user ID format');
    });

    it('should return 404 if user is not found', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);
      (mockUser.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const req = createRequest({ method: 'PATCH', body: { role: 'manager' } });

      const response = await (handleUpdateUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: nonExistentId } }
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toBe('User not found');
    });

    it('should update user details if user is an admin and valid data is provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };

      const updatedUser: MockUserData = {
        _id: 'user_to_update_id',
        clerkId: 'user_to_update',
        role: 'manager',
        name: 'Update User',
        email: 'update@example.com',
        isActive: false
      };

      const updateData = {
        role: 'manager',
        isActive: false,
      };

      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);
      (mockUser.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      const req = createRequest({ method: 'PATCH', body: updateData });

      const response = await (handleUpdateUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: updatedUser._id! } }
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toMatchObject(updateData);
      expect(responseBody._id).toBe(updatedUser._id);
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });
      const req = createRequest({ method: 'DELETE' });

      const response = await (handleDeleteUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'someid' } }
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      mockAuth.mockReturnValue({ userId: 'user_staff123' });
      
      const staffUser: MockUserData = {
        _id: 'staff_id',
        clerkId: 'user_staff123',
        role: 'staff',
        name: 'Staff User',
        email: 'staff@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const req = createRequest({ method: 'DELETE' });

      const response = await (handleDeleteUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'some_user_id' } }
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
    });

    it('should return 400 if invalid user ID format is provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);

      const req = createRequest({ method: 'DELETE' });

      const response = await (handleDeleteUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: 'invalid-id' } }
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toBe('Invalid user ID format');
    });

    it('should return 404 if user is not found', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };
      
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);
      (mockUser.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const req = createRequest({ method: 'DELETE' });

      const response = await (handleDeleteUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: nonExistentId } }
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toBe('User not found');
    });

    it('should delete user if user is an admin and valid ID is provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user_admin123' });
      
      const adminUser: MockUserData = {
        _id: 'admin_id',
        clerkId: 'user_admin123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com'
      };

      const userToDelete: MockUserData = {
        _id: 'user_to_delete_id',
        clerkId: 'user_to_delete',
        role: 'staff',
        name: 'Delete User',
        email: 'delete@example.com'
      };

      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);
      (mockUser.findByIdAndDelete as jest.Mock).mockResolvedValue(userToDelete);

      const req = createRequest({ method: 'DELETE' });

      const response = await (handleDeleteUser as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        req as unknown as Request,
        { params: { id: userToDelete._id! } }
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ message: "User deleted successfully" });
    });
  });
});
