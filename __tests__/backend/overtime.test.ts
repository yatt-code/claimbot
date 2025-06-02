import { Types } from 'mongoose';
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

// Mock the Mongoose models
const mockUser = {
  findOne: jest.fn(),
};

const mockOvertime = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
};

const mockAuditLog = {
  create: jest.fn(),
};

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: mockUser,
}));

jest.mock('@/models/Overtime', () => ({
  __esModule: true,
  default: mockOvertime,
}));

jest.mock('@/models/AuditLog', () => ({
  __esModule: true,
  default: mockAuditLog,
}));

// Import the actual API route handlers
import { GET as GET_Overtime, POST as POST_Overtime } from '@/app/api/overtime/route';
import {
  GET as GET_OvertimeById,
  PATCH as PATCH_OvertimeById,
  DELETE as DELETE_OvertimeById,
} from '@/app/api/overtime/[id]/route';

// Type the mocked functions properly
const mockAuth = auth as unknown as jest.MockedFunction<() => { userId: string | null }>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

// Define interfaces for better type safety
interface MockUser {
  _id: Types.ObjectId;
  clerkId: string;
  role: string;
  name: string;
  email: string;
}

interface MockOvertimeDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'submitted' | 'approved' | 'rejected' | 'paid' | 'draft';
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  hoursWorked?: number;
  rateMultiplier?: number;
  hourlyRate?: number;
  totalPayout?: number;
  attachments?: Types.ObjectId[];
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  remarks?: string;
  save: jest.MockedFunction<() => Promise<MockOvertimeDocument>>;
  populate: jest.MockedFunction<(path: string, select?: string) => Promise<MockOvertimeDocument>>;
}

describe('Overtime API Integration Tests', () => {
  let staffUser: MockUser;
  let managerUser: MockUser;
  let adminUser: MockUser;
  let mockOvertimeId: Types.ObjectId;

  beforeAll(() => {
    // Define mock users with different roles
    staffUser = { _id: new Types.ObjectId(), clerkId: 'user_staff123', role: 'staff', name: 'Staff User', email: 'staff@example.com' };
    managerUser = { _id: new Types.ObjectId(), clerkId: 'user_manager123', role: 'manager', name: 'Manager User', email: 'manager@example.com' };
    adminUser = { _id: new Types.ObjectId(), clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' };
    mockOvertimeId = new Types.ObjectId();

    // Mock dbConnect to resolve immediately for all tests
    mockDbConnect.mockResolvedValue({} as typeof import('mongoose'));
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockAuth.mockReset();
    (mockUser.findOne as jest.Mock).mockReset();
    (mockOvertime.find as jest.Mock).mockReset();
    (mockOvertime.findById as jest.Mock).mockReset();
    (mockOvertime.findByIdAndUpdate as jest.Mock).mockReset();
    (mockOvertime.findByIdAndDelete as jest.Mock).mockReset();
    (mockOvertime.create as jest.Mock).mockReset();
    (mockAuditLog.create as jest.Mock).mockReset();
  });

  describe('POST /api/overtime', () => {
    test('Staff user should create a new overtime request', async () => {
      // Mock authenticated staff user
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const overtimeData = {
        date: '2025-06-01',
        startTime: '18:00',
        endTime: '21:30',
        reason: 'Night deployment',
      };

      const createdOvertime: MockOvertimeDocument = {
        _id: mockOvertimeId,
        userId: staffUser._id,
        status: 'submitted',
        hoursWorked: 3.5,
        date: new Date(overtimeData.date),
        startTime: overtimeData.startTime,
        endTime: overtimeData.endTime,
        reason: overtimeData.reason,
        save: jest.fn().mockResolvedValue({} as MockOvertimeDocument),
        populate: jest.fn().mockResolvedValue({} as MockOvertimeDocument),
        approvedBy: undefined,
        approvedAt: undefined,
        remarks: undefined,
        rateMultiplier: undefined,
        hourlyRate: undefined,
        totalPayout: undefined,
        attachments: undefined,
      };
      (mockOvertime.create as jest.Mock).mockResolvedValue(createdOvertime);

      const mockRequest = {
        json: async () => overtimeData,
      } as unknown as Request;

      const response = await (POST_Overtime as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual(expect.objectContaining({
        status: 'submitted',
        userId: staffUser._id.toString(),
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
      mockAuth.mockReturnValue({ userId: managerUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(managerUser);

      const overtimeData = {
        date: '2025-06-01',
        startTime: '08:00',
        endTime: '10:00',
        reason: 'Extra work',
      };

      const mockRequest = {
        json: async () => overtimeData,
      } as unknown as Request;

      const response = await (POST_Overtime as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toBe('Forbidden');
      expect(mockOvertime.create).not.toHaveBeenCalled();
      expect(mockAuditLog.create).not.toHaveBeenCalled();
    });

    test('Should return 400 for invalid overtime data', async () => {
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const invalidOvertimeData = {
        date: 'invalid-date',
        startTime: '18:00',
        endTime: '21:30',
        reason: 'Night deployment',
      };

      const mockRequest = {
        json: async () => invalidOvertimeData,
      } as unknown as Request;

      const response = await (POST_Overtime as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toContain('Invalid request body');
      expect(mockOvertime.create).not.toHaveBeenCalled();
      expect(mockAuditLog.create).not.toHaveBeenCalled();
    });

    test('Should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const overtimeData = {
        date: '2025-06-01',
        startTime: '18:00',
        endTime: '21:30',
        reason: 'Night deployment',
      };

      const mockRequest = {
        json: async () => overtimeData,
      } as unknown as Request;

      const response = await (POST_Overtime as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
      expect(mockOvertime.create).not.toHaveBeenCalled();
      expect(mockAuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/overtime', () => {
    test('Staff user should only see their own overtime requests', async () => {
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const staffOvertime = [{ _id: new Types.ObjectId(), userId: staffUser._id, reason: 'Staff OT 1' }];

      (mockOvertime.find as jest.Mock).mockImplementation((query: { userId?: Types.ObjectId }) => {
        if (query && query.userId && query.userId.toString() === staffUser._id.toString()) {
          return staffOvertime;
        }
        return [];
      });

      const mockRequest = { headers: {} } as unknown as Request;
      const response = await (GET_Overtime as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(staffOvertime);
      expect(mockOvertime.find).toHaveBeenCalledWith({ userId: staffUser._id });
    });

    test('Admin user should see all overtime requests', async () => {
      mockAuth.mockReturnValue({ userId: adminUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(adminUser);

      const allOvertime = [
        { _id: new Types.ObjectId(), userId: staffUser._id, reason: 'Staff OT 1' },
        { _id: new Types.ObjectId(), userId: managerUser._id, reason: 'Manager OT 1' },
      ];

      (mockOvertime.find as jest.Mock).mockResolvedValue(allOvertime);

      const mockRequest = { headers: {} } as unknown as Request;
      const response = await (GET_Overtime as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(allOvertime);
      expect(mockOvertime.find).toHaveBeenCalledWith({});
    });

    test('Should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const mockRequest = { headers: {} } as unknown as Request;
      const response = await (GET_Overtime as unknown as (req: Request) => Promise<Response>)(mockRequest);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
      expect(mockOvertime.find).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/overtime/[id]', () => {
    test('Staff user should see their own overtime by ID', async () => {
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const staffOvertime: MockOvertimeDocument = {
        _id: mockOvertimeId,
        userId: staffUser._id,
        status: 'submitted',
        reason: 'Staff OT',
        save: jest.fn().mockResolvedValue({} as MockOvertimeDocument),
        populate: jest.fn().mockResolvedValue({
          _id: mockOvertimeId,
          userId: staffUser,
          status: 'submitted',
          reason: 'Staff OT',
          date: new Date(),
          startTime: '08:00',
          endTime: '09:00',
          save: jest.fn(),
          populate: jest.fn(),
        } as unknown as MockOvertimeDocument),
        date: new Date(),
        startTime: '08:00',
        endTime: '09:00',
        hoursWorked: 1,
        approvedBy: undefined,
        approvedAt: undefined,
        remarks: undefined,
        rateMultiplier: undefined,
        hourlyRate: undefined,
        totalPayout: undefined,
        attachments: undefined,
      };
      (mockOvertime.findById as jest.Mock).mockResolvedValue(staffOvertime);

      const mockRequest = { headers: {} } as unknown as Request;
      const mockParams = { id: mockOvertimeId.toString() };
      const response = await (GET_OvertimeById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        mockRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(expect.objectContaining({ _id: mockOvertimeId.toString(), reason: 'Staff OT' }));
      expect(mockOvertime.findById).toHaveBeenCalledWith(mockOvertimeId.toString());
      expect(staffOvertime.populate).toHaveBeenCalledWith('userId', 'name email role');
    });

    test('Should return 404 if overtime not found by ID', async () => {
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      (mockOvertime.findById as jest.Mock).mockResolvedValue(null);

      const mockRequest = { headers: {} } as unknown as Request;
      const mockParams = { id: new Types.ObjectId().toString() };
      const response = await (GET_OvertimeById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        mockRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toBe('Overtime request not found');
      expect(mockOvertime.findById).toHaveBeenCalledWith(mockParams.id);
    });

    test('Should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const mockRequest = { headers: {} } as unknown as Request;
      const mockParams = { id: mockOvertimeId.toString() };
      const response = await (GET_OvertimeById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        mockRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
      expect(mockOvertime.findById).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/overtime/[id]', () => {
    test('Staff user should update their own submitted overtime', async () => {
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const submittedOvertime: MockOvertimeDocument = {
        _id: mockOvertimeId,
        userId: staffUser._id,
        status: 'submitted',
        reason: 'Old Reason',
        save: jest.fn().mockResolvedValue({} as MockOvertimeDocument),
        populate: jest.fn().mockResolvedValue({} as MockOvertimeDocument),
        date: new Date(),
        startTime: '08:00',
        endTime: '09:00',
        hoursWorked: 1,
        approvedBy: undefined,
        approvedAt: undefined,
        remarks: undefined,
        rateMultiplier: undefined,
        hourlyRate: undefined,
        totalPayout: undefined,
        attachments: undefined,
      };
      (mockOvertime.findById as jest.Mock).mockResolvedValue(submittedOvertime);

      const updateData = {
        reason: 'Updated Reason',
      };

      const mockRequest = {
        json: async () => updateData,
      } as unknown as Request;
      const mockParams = { id: mockOvertimeId.toString() };

      const response = await (PATCH_OvertimeById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        mockRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(expect.objectContaining({
        _id: mockOvertimeId.toString(),
        reason: 'Updated Reason',
        status: 'submitted',
      }));
      expect(mockOvertime.findById).toHaveBeenCalledWith(mockOvertimeId.toString());
      expect(submittedOvertime.save).toHaveBeenCalled();
      expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: staffUser._id,
        action: 'updated_overtime',
        target: { collection: 'overtime', documentId: mockOvertimeId },
      }));
    });

    test('Should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const updateData = { reason: 'Attempted Update' };

      const mockRequest = { json: async () => updateData } as unknown as Request;
      const mockParams = { id: mockOvertimeId.toString() };

      const response = await (PATCH_OvertimeById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        mockRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
      expect(mockOvertime.findById).not.toHaveBeenCalled();
      expect(mockAuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/overtime/[id]', () => {
    test('Staff user should delete their own submitted overtime', async () => {
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

      const submittedOvertime: MockOvertimeDocument = {
        _id: mockOvertimeId,
        userId: staffUser._id,
        status: 'submitted',
        reason: 'Reason to delete',
        save: jest.fn().mockResolvedValue({} as MockOvertimeDocument),
        populate: jest.fn().mockResolvedValue({} as MockOvertimeDocument),
        date: new Date(),
        startTime: '08:00',
        endTime: '09:00',
        hoursWorked: 1,
        approvedBy: undefined,
        approvedAt: undefined,
        remarks: undefined,
        rateMultiplier: undefined,
        hourlyRate: undefined,
        totalPayout: undefined,
        attachments: undefined,
      };
      (mockOvertime.findById as jest.Mock).mockResolvedValue(submittedOvertime);
      (mockOvertime.findByIdAndDelete as jest.Mock).mockResolvedValue(submittedOvertime);

      const mockRequest = { headers: {} } as unknown as Request;
      const mockParams = { id: mockOvertimeId.toString() };

      const response = await (DELETE_OvertimeById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        mockRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(expect.objectContaining({ _id: mockOvertimeId.toString(), reason: 'Reason to delete' }));
      expect(mockOvertime.findById).toHaveBeenCalledWith(mockOvertimeId.toString());
      expect(mockOvertime.findByIdAndDelete).toHaveBeenCalledWith(mockOvertimeId.toString());
      expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: staffUser._id,
        action: 'deleted_overtime',
        target: { collection: 'overtime', documentId: mockOvertimeId },
      }));
    });

    test('Should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const mockRequest = { headers: {} } as unknown as Request;
      const mockParams = { id: mockOvertimeId.toString() };

      const response = await (DELETE_OvertimeById as unknown as (req: Request, context: { params: { id: string } }) => Promise<Response>)(
        mockRequest,
        { params: mockParams }
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toBe('Unauthorized');
      expect(mockOvertime.findById).not.toHaveBeenCalled();
      expect(mockAuditLog.create).not.toHaveBeenCalled();
    });
  });
});