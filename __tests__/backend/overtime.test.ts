import request from 'supertest';
import { Types } from 'mongoose';

// Mock Clerk's auth() helper
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Mock the database connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the Mongoose models
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));
jest.mock('@/models/Overtime', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(), // Mock create for POST
    // Mock save method on instances
    prototype: {
        save: jest.fn(),
    },
  },
}));
jest.mock('@/models/AuditLog', () => ({
    __esModule: true,
    default: {
      create: jest.fn(),
    },
}));


const mockAuth = require('@clerk/nextjs/server').auth;
const mockUser = require('@/models/User').default;
const mockOvertime = require('@/models/Overtime').default;
const mockAuditLog = require('@/models/AuditLog').default;
const mockDbConnect = require('@/lib/mongodb').default;

// Import the actual API route handlers
import { GET as GET_Overtime, POST as POST_Overtime } from '@/app/api/overtime/route';
import {
    GET as GET_OvertimeById,
    PATCH as PATCH_OvertimeById,
    DELETE as DELETE_OvertimeById,
    POST_Approve as POST_ApproveOvertime, // Assuming these are exported as named functions
} from '@/app/api/overtime/[id]/route';


describe('Overtime API Integration Tests', () => {
  let staffUser: any;
  let managerUser: any;
  let financeUser: any;
  let adminUser: any;
  let mockOvertimeId: Types.ObjectId;

  beforeAll(() => {
    // Define mock users with different roles
    staffUser = { _id: new Types.ObjectId(), clerkId: 'user_staff123', role: 'staff', name: 'Staff User', email: 'staff@example.com' };
    managerUser = { _id: new Types.ObjectId(), clerkId: 'user_manager123', role: 'manager', name: 'Manager User', email: 'manager@example.com' };
    financeUser = { _id: new Types.ObjectId(), clerkId: 'user_finance123', role: 'finance', name: 'Finance User', email: 'finance@example.com' };
    adminUser = { _id: new Types.ObjectId(), clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' };
    mockOvertimeId = new Types.ObjectId();

    // Mock dbConnect to resolve immediately for all tests
    mockDbConnect.mockResolvedValue(true);
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockAuth.mockReset();
    mockUser.findOne.mockReset();
    mockOvertime.find.mockReset();
    mockOvertime.findById.mockReset();
    mockOvertime.findByIdAndUpdate.mockReset();
    mockOvertime.findByIdAndDelete.mockReset();
    mockOvertime.create.mockReset();
    mockOvertime.prototype.save.mockReset();
    mockAuditLog.create.mockReset();
  });

  describe('POST /api/overtime', () => {
    test('Staff user should create a new overtime request', async () => {
      // Mock authenticated staff user
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      mockUser.findOne.mockResolvedValue(staffUser);

      const overtimeData = {
        date: '2025-06-01',
        startTime: '18:00',
        endTime: '21:30',
        reason: 'Night deployment',
      };

      // Mock the Overtime model's create method
      const createdOvertime = {
          _id: mockOvertimeId,
          userId: staffUser._id,
          status: 'submitted',
          hoursWorked: 3.5, // Expected calculated value
          ...overtimeData,
          save: jest.fn().mockResolvedValue(true), // Mock save on the created instance
      };
      mockOvertime.create.mockResolvedValue(createdOvertime);
      mockOvertime.prototype.save.mockResolvedValue(true); // Ensure save on prototype is also mocked if needed


      // Simulate the request
      const mockRequest = {
          json: async () => overtimeData,
      } as any;

      const response = await POST_Overtime(mockRequest);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual(expect.objectContaining({
        status: 'submitted',
        userId: staffUser._id,
        reason: 'Night deployment',
        hoursWorked: 3.5,
      }));
      expect(mockOvertime.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: staffUser._id,
          date: new Date('2025-06-01'),
          startTime: '18:00',
          endTime: '21:30',
          reason: 'Night deployment',
          hoursWorked: 3.5,
          status: 'submitted',
      }));
      expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: staffUser._id,
          action: 'created_overtime',
          target: { collection: 'overtime', documentId: mockOvertimeId },
      }));
    });

    test('Non-staff user should be forbidden from creating an overtime request', async () => {
        // Mock authenticated manager user
        mockAuth.mockReturnValue({ userId: managerUser.clerkId });
        mockUser.findOne.mockResolvedValue(managerUser);

        const overtimeData = {
            date: '2025-06-01',
            startTime: '08:00',
            endTime: '10:00',
            reason: 'Extra work',
        };

        const mockRequest = {
            json: async () => overtimeData,
        } as any;

        const response = await POST_Overtime(mockRequest);

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body).toBe('Forbidden');
        expect(mockOvertime.create).not.toHaveBeenCalled();
        expect(mockAuditLog.create).not.toHaveBeenCalled();
    });

    test('Should return 400 for invalid overtime data', async () => {
        // Mock authenticated staff user
        mockAuth.mockReturnValue({ userId: staffUser.clerkId });
        mockUser.findOne.mockResolvedValue(staffUser);

        const invalidOvertimeData = {
            date: 'invalid-date', // Invalid date format
            startTime: '18:00',
            endTime: '21:30',
            reason: 'Night deployment',
        };

        const mockRequest = {
            json: async () => invalidOvertimeData,
        } as any;

        const response = await POST_Overtime(mockRequest);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body).toContain('Invalid request body');
        expect(mockOvertime.create).not.toHaveBeenCalled();
        expect(mockAuditLog.create).not.toHaveBeenCalled();
    });

    test('Should return 401 if user is not authenticated', async () => {
        // Mock unauthenticated user
        mockAuth.mockReturnValue({ userId: null });

        const overtimeData = {
            date: '2025-06-01',
            startTime: '18:00',
            endTime: '21:30',
            reason: 'Night deployment',
        };

        const mockRequest = {
            json: async () => overtimeData,
        } as any;

        const response = await POST_Overtime(mockRequest);

        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body).toBe('Unauthorized');
        expect(mockOvertime.create).not.toHaveBeenCalled();
        expect(mockAuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/overtime', () => {
      test('Staff user should only see their own overtime requests', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const staffOvertime = [{ _id: new Types.ObjectId(), userId: staffUser._id, reason: 'Staff OT 1' }];
          const otherOvertime = [{ _id: new Types.ObjectId(), userId: new Types.ObjectId(), reason: 'Other OT' }];

          // Mock Overtime.find to return only staff user's overtime when called with userId filter
          mockOvertime.find.mockImplementation((query: any) => {
              if (query && query.userId && query.userId.toString() === staffUser._id.toString()) {
                  return staffOvertime;
              }
              return []; // Should not return other overtime for staff
          });

          const mockRequest = { headers: {} } as any;
          const response = await GET_Overtime(mockRequest);

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(staffOvertime);
          expect(mockOvertime.find).toHaveBeenCalledWith({ userId: staffUser._id });
      });

      test('Admin user should see all overtime requests', async () => {
          // Mock authenticated admin user
          mockAuth.mockReturnValue({ userId: adminUser.clerkId });
          mockUser.findOne.mockResolvedValue(adminUser);

          const allOvertime = [
              { _id: new Types.ObjectId(), userId: staffUser._id, reason: 'Staff OT 1' },
              { _id: new Types.ObjectId(), userId: managerUser._id, reason: 'Manager OT 1' },
          ];

          // Mock Overtime.find to return all overtime when called without a specific userId filter
          mockOvertime.find.mockResolvedValue(allOvertime);

          const mockRequest = { headers: {} } as any;
          const response = await GET_Overtime(mockRequest);

          expect(response.status).toBe(200);
          const body = await await response.json();
          expect(body).toEqual(allOvertime);
          expect(mockOvertime.find).toHaveBeenCalledWith({}); // Admin sees all
      });

      test('Should return 401 if user is not authenticated', async () => {
          // Mock unauthenticated user
          mockAuth.mockReturnValue({ userId: null });

          const mockRequest = { headers: {} } as any;
          const response = await GET_Overtime(mockRequest);

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body).toBe('Unauthorized');
          expect(mockOvertime.find).not.toHaveBeenCalled();
      });
  });

  // TODO: Add tests for GET, PATCH, DELETE, POST_Approve for /api/overtime/[id]
  // These tests will require more complex mocking of findById, findByIdAndUpdate, findByIdAndDelete,
  // and simulating request parameters.
});