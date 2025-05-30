import request from 'supertest';
import { Types } from 'mongoose';
import { Mock } from 'jest-mock'; // Import Mock type

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
jest.mock('@/models/Claim', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(), // Mock create for POST
    // Mock save method on instances
    prototype: {
        save: jest.fn() as Mock, // Explicitly type save mock
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
const mockClaim = require('@/models/Claim').default;
const mockAuditLog = require('@/models/AuditLog').default;
const mockDbConnect = require('@/lib/mongodb').default;

// Import the actual API route handlers
import { GET as GET_Claims, POST as POST_Claims } from '@/app/api/claims/route';
import {
    GET as GET_ClaimById,
    PATCH as PATCH_ClaimById,
    DELETE as DELETE_ClaimById,
    POST_Submit as POST_SubmitClaim, // Assuming these are exported as named functions
    POST_Approve as POST_ApproveClaim,
} from '@/app/api/claims/[id]/route';


// Define a type for the mocked Claim document to include all potential properties
interface MockClaimDocument {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
    project?: string;
    description?: string;
    expenses?: {
        mileage?: number;
        toll?: number;
        petrol?: number;
        meal?: number;
        others?: number;
    };
    totalClaim?: number;
    attachments?: Types.ObjectId[];
    submittedAt?: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    remarks?: string;
    save: Mock; // Type save as Mock
    populate: Mock; // Type populate as Mock
}


describe('Claims API Integration Tests', () => {
  let staffUser: any;
  let managerUser: any;
  let financeUser: any;
  let adminUser: any;
  let mockClaimId: Types.ObjectId;

  beforeAll(() => {
    // Define mock users with different roles
    staffUser = { _id: new Types.ObjectId(), clerkId: 'user_staff123', role: 'staff', name: 'Staff User', email: 'staff@example.com' };
    managerUser = { _id: new Types.ObjectId(), clerkId: 'user_manager123', role: 'manager', name: 'Manager User', email: 'manager@example.com' };
    financeUser = { _id: new Types.ObjectId(), clerkId: 'user_finance123', role: 'finance', name: 'Finance User', email: 'finance@example.com' };
    adminUser = { _id: new Types.ObjectId(), clerkId: 'user_admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' };
    mockClaimId = new Types.ObjectId();

    // Mock dbConnect to resolve immediately for all tests
    mockDbConnect.mockResolvedValue(true);
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockAuth.mockReset();
    mockUser.findOne.mockReset();
    mockClaim.find.mockReset();
    mockClaim.findById.mockReset();
    mockClaim.findByIdAndUpdate.mockReset();
    mockClaim.findByIdAndDelete.mockReset();
    mockClaim.create.mockReset();
    mockClaim.prototype.save.mockReset();
    mockAuditLog.create.mockReset();
  });

  describe('POST /api/claims', () => {
    test('Staff user should create a new claim (draft)', async () => {
      // Mock authenticated staff user
      mockAuth.mockReturnValue({ userId: staffUser.clerkId });
      mockUser.findOne.mockResolvedValue(staffUser);

      const claimData = {
        date: '2025-06-01',
        project: 'Project X',
        description: 'Travel expenses',
        expenses: { mileage: 50, toll: 10, petrol: 20 },
      };

      // Mock the Claim model's create method
      const createdClaim: MockClaimDocument = { // Explicitly type mock object
          _id: mockClaimId,
          userId: staffUser._id,
          status: 'draft',
          ...claimData,
          save: jest.fn().mockResolvedValue(true) as Mock, // Mock save on the created instance
          populate: jest.fn() as Mock, // Add populate mock
          submittedAt: undefined, // Initialize properties that will be set later
          approvedBy: undefined,
          approvedAt: undefined,
          remarks: undefined,
      };
      mockClaim.create.mockResolvedValue(createdClaim);
      mockClaim.prototype.save.mockResolvedValue(true); // Ensure save on prototype is also mocked if needed

      // Simulate the request
      const mockRequest = {
          json: async () => claimData,
      } as any;

      const response = await POST_Claims(mockRequest);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual(expect.objectContaining({
        status: 'draft',
        userId: staffUser._id,
        project: 'Project X',
      }));
      expect(mockClaim.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: staffUser._id,
          date: new Date('2025-06-01'),
          project: 'Project X',
          status: 'draft',
      }));
      expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
          userId: staffUser._id,
          action: 'created_claim',
          target: { collection: 'claims', documentId: mockClaimId },
      }));
    });

    test('Non-staff user should be forbidden from creating a claim', async () => {
        // Mock authenticated manager user
        mockAuth.mockReturnValue({ userId: managerUser.clerkId });
        mockUser.findOne.mockResolvedValue(managerUser);

        const claimData = {
            date: '2025-06-01',
            project: 'Project Y',
            description: 'Other expenses',
        };

        const mockRequest = {
            json: async () => claimData,
        } as any;

        const response = await POST_Claims(mockRequest);

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body).toBe('Forbidden');
        expect(mockClaim.create).not.toHaveBeenCalled();
        expect(mockAuditLog.create).not.toHaveBeenCalled();
    });

    test('Should return 400 for invalid claim data', async () => {
        // Mock authenticated staff user
        mockAuth.mockReturnValue({ userId: staffUser.clerkId });
        mockUser.findOne.mockResolvedValue(staffUser);

        const invalidClaimData = {
            // Missing date
            project: 'Project Z',
        };

        const mockRequest = {
            json: async () => invalidClaimData,
        } as any;

        const response = await POST_Claims(mockRequest);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body).toContain('Invalid request body');
        expect(mockClaim.create).not.toHaveBeenCalled();
        expect(mockAuditLog.create).not.toHaveBeenCalled();
    });

    test('Should return 401 if user is not authenticated', async () => {
        // Mock unauthenticated user
        mockAuth.mockReturnValue({ userId: null });

        const claimData = {
            date: '2025-06-01',
            project: 'Project A',
        };

        const mockRequest = {
            json: async () => claimData,
        } as any;

        const response = await POST_Claims(mockRequest);

        expect(response.status).toBe(401);
        const body = await response.json();
        expect(body).toBe('Unauthorized');
        expect(mockClaim.create).not.toHaveBeenCalled();
        expect(mockAuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/claims', () => {
      test('Staff user should only see their own claims', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const staffClaims = [{ _id: new Types.ObjectId(), userId: staffUser._id, project: 'Staff Claim 1' }];
          const otherClaims = [{ _id: new Types.ObjectId(), userId: new Types.ObjectId(), project: 'Other Claim' }];

          // Mock Claim.find to return only staff user's claims when called with userId filter
          mockClaim.find.mockImplementation((query: any) => {
              if (query && query.userId && query.userId.toString() === staffUser._id.toString()) {
                  return staffClaims;
              }
              return []; // Should not return other claims for staff
          });

          const mockRequest = { headers: {} } as any;
          const response = await GET_Claims(mockRequest);

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(staffClaims);
          expect(mockClaim.find).toHaveBeenCalledWith({ userId: staffUser._id });
      });

      test('Admin user should see all claims', async () => {
          // Mock authenticated admin user
          mockAuth.mockReturnValue({ userId: adminUser.clerkId });
          mockUser.findOne.mockResolvedValue(adminUser);

          const allClaims = [
              { _id: new Types.ObjectId(), userId: staffUser._id, project: 'Staff Claim 1' },
              { _id: new Types.ObjectId(), userId: managerUser._id, project: 'Manager Claim 1' },
          ];

          // Mock Claim.find to return all claims when called without a specific userId filter
          mockClaim.find.mockResolvedValue(allClaims);

          const mockRequest = { headers: {} } as any;
          const response = await GET_Claims(mockRequest);

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(allClaims);
          expect(mockClaim.find).toHaveBeenCalledWith({}); // Admin sees all
      });

      test('Should return 401 if user is not authenticated', async () => {
          // Mock unauthenticated user
          mockAuth.mockReturnValue({ userId: null });

          const mockRequest = { headers: {} } as any;
          const response = await GET_Claims(mockRequest);

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body).toBe('Unauthorized');
          expect(mockClaim.find).not.toHaveBeenCalled();
      });
  });

  describe('GET /api/claims/[id]', () => {
      test('Staff user should see their own claim by ID', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const staffClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', project: 'Staff Claim', populate: jest.fn().mockResolvedValue({ _id: mockClaimId, userId: staffUser, status: 'draft', project: 'Staff Claim' }) as Mock } as any; // Mock populate with explicit structure
          mockClaim.findById.mockResolvedValue(staffClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };
          const response = await GET_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(expect.objectContaining({ _id: mockClaimId, project: 'Staff Claim' }));
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(staffClaim.populate).toHaveBeenCalledWith('userId', 'name email role');
      });

      test('Staff user should be forbidden from seeing another user\'s claim by ID', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const otherUser = { _id: new Types.ObjectId(), clerkId: 'user_other123', role: 'staff' };
          const otherClaim: MockClaimDocument = { _id: new Types.ObjectId(), userId: otherUser._id, status: 'draft', project: 'Other Claim', populate: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), userId: otherUser, status: 'draft', project: 'Other Claim' }) } as any;
          mockClaim.findById.mockResolvedValue(otherClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: otherClaim._id.toString() };
          const response = await GET_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body).toBe('Forbidden');
          expect(mockClaim.findById).toHaveBeenCalledWith(otherClaim._id.toString());
          expect(otherClaim.populate).toHaveBeenCalledWith('userId', 'name email role');
      });

      test('Admin user should see any claim by ID', async () => {
          // Mock authenticated admin user
          mockAuth.mockReturnValue({ userId: adminUser.clerkId });
          mockUser.findOne.mockResolvedValue(adminUser);

          const staffClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', project: 'Staff Claim', populate: jest.fn().mockResolvedValue({ _id: mockClaimId, userId: staffUser, status: 'draft', project: 'Staff Claim' }) } as any;
          mockClaim.findById.mockResolvedValue(staffClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };
          const response = await GET_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(expect.objectContaining({ _id: mockClaimId, project: 'Staff Claim' }));
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(staffClaim.populate).toHaveBeenCalledWith('userId', 'name email role');
      });

      test('Should return 404 if claim not found by ID', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          mockClaim.findById.mockResolvedValue(null); // Claim not found

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: new Types.ObjectId().toString() }; // Non-existent ID
          const response = await GET_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(404);
          const body = await response.json();
          expect(body).toBe('Claim not found');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockParams.id);
      });

      test('Should return 400 for invalid claim ID format', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: 'invalid-id' }; // Invalid ID format
          const response = await GET_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Invalid claim ID format');
          expect(mockClaim.findById).not.toHaveBeenCalled(); // Should not attempt DB call
      });

      test('Should return 401 if user is not authenticated', async () => {
          // Mock unauthenticated user
          mockAuth.mockReturnValue({ userId: null });

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };
          const response = await GET_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body).toBe('Unauthorized');
          expect(mockClaim.findById).not.toHaveBeenCalled();
      });
  });

  describe('PATCH /api/claims/[id]', () => {
      test('Staff user should update their own draft claim', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { // Explicitly type mock object
              _id: mockClaimId,
              userId: staffUser._id,
              status: 'draft',
              project: 'Old Project',
              expenses: { mileage: 10 },
              totalClaim: 10,
              save: jest.fn().mockResolvedValue(true) as Mock,
              populate: jest.fn() as Mock, // Add populate mock
              submittedAt: undefined, // Initialize properties that will be set later
              approvedBy: undefined,
              approvedAt: undefined,
              remarks: undefined,
          };
          mockClaim.findById.mockResolvedValue(draftClaim);

          const updateData = {
              project: 'Updated Project',
              expenses: { mileage: 20, toll: 5 },
          };

          const mockRequest = {
              json: async () => updateData,
          } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(expect.objectContaining({
              _id: mockClaimId,
              project: 'Updated Project',
              expenses: { mileage: 20, toll: 5 },
              totalClaim: 25, // 20 + 5
              status: 'draft', // Status should not change via PATCH
          }));
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(draftClaim.save).toHaveBeenCalled();
          expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
              userId: staffUser._id,
              action: 'updated_claim',
              target: { collection: 'claims', documentId: mockClaimId },
          }));
      });

      test('Staff user should be forbidden from updating another user\'s claim', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const otherUser = { _id: new Types.ObjectId(), clerkId: 'user_other123', role: 'staff' };
          const otherClaim: MockClaimDocument = { _id: new Types.ObjectId(), userId: otherUser._id, status: 'draft', project: 'Other Claim', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(otherClaim);

          const updateData = { project: 'Attempted Update' };
          const mockRequest = { json: async () => updateData } as any;
          const mockParams = { id: otherClaim._id.toString() };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body).toBe('Forbidden');
          expect(mockClaim.findById).toHaveBeenCalledWith(otherClaim._id.toString());
          expect(mockClaim.findByIdAndUpdate).not.toHaveBeenCalled(); // Ensure update was not attempted
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Staff user should be forbidden from updating a claim not in draft status', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', project: 'Submitted Claim', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const updateData = { project: 'Attempted Update' };
          const mockRequest = { json: async () => updateData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Cannot update claim in status: submitted');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.findByIdAndUpdate).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Admin user should update any claim', async () => {
          // Mock authenticated admin user
          mockAuth.mockReturnValue({ userId: adminUser.clerkId });
          mockUser.findOne.mockResolvedValue(adminUser);

          const submittedClaim: MockClaimDocument = {
              _id: mockClaimId,
              userId: staffUser._id,
              status: 'submitted',
              project: 'Submitted Claim',
              save: jest.fn().mockResolvedValue(true) as Mock,
              populate: jest.fn() as Mock, // Add populate mock
              submittedAt: new Date(), // Initialize properties that will be set later
              approvedBy: undefined,
              approvedAt: undefined,
              remarks: undefined,
          };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const updateData = { project: 'Admin Updated Project' };
          const mockRequest = { json: async () => updateData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(expect.objectContaining({
              _id: mockClaimId,
              project: 'Admin Updated Project',
              status: 'submitted', // Status should not change via PATCH
          }));
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(submittedClaim.save).toHaveBeenCalled();
          expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
              userId: adminUser._id,
              action: 'updated_claim',
              target: { collection: 'claims', documentId: mockClaimId },
          }));
      });

      test('Should return 400 for invalid update data', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(draftClaim);

          const invalidUpdateData = {
              date: 'invalid-date', // Invalid field not in schema
          };

          const mockRequest = {
              json: async () => invalidUpdateData,
          } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toContain('Invalid request body');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockParams.id);
          expect(draftClaim.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 404 if claim not found by ID', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          mockClaim.findById.mockResolvedValue(null); // Claim not found
          mockClaim.findByIdAndUpdate.mockResolvedValue(null); // Ensure update is also mocked

          const updateData = { project: 'Update' };
          const mockRequest = { json: async () => updateData } as any;
          const mockParams = { id: new Types.ObjectId().toString() };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(404);
          const body = await response.json();
          expect(body).toBe('Claim not found');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockParams.id);
          expect(mockClaim.findByIdAndUpdate).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 400 for invalid claim ID format', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const updateData = { project: 'Update' };
          const mockRequest = { json: async () => updateData } as any;
          const mockParams = { id: 'invalid-id' };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Invalid claim ID format');
          expect(mockClaim.findById).not.toHaveBeenCalled();
          expect(mockClaim.findByIdAndUpdate).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 401 if user is not authenticated', async () => {
          // Mock unauthenticated user
          mockAuth.mockReturnValue({ userId: null });

          const updateData = { project: 'Update' };
          const mockRequest = { json: async () => updateData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await PATCH_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body).toBe('Unauthorized');
          expect(mockClaim.findById).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });
  });

  describe('DELETE /api/claims/[id]', () => {
      test('Staff user should delete their own draft claim', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(draftClaim);
          mockClaim.findByIdAndDelete.mockResolvedValue(draftClaim); // Mock delete success

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await DELETE_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual({ message: 'Claim deleted successfully' });
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.findByIdAndDelete).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
              userId: staffUser._id,
              action: 'deleted_claim',
              target: { collection: 'claims', documentId: mockClaimId.toString() },
          }));
      });

      test('Staff user should be forbidden from deleting another user\'s claim', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const otherUser = { _id: new Types.ObjectId(), clerkId: 'user_other123', role: 'staff' };
          const otherClaim: MockClaimDocument = { _id: new Types.ObjectId(), userId: otherUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(otherClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: otherClaim._id.toString() };

          const response = await DELETE_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body).toBe('Forbidden');
          expect(mockClaim.findById).toHaveBeenCalledWith(otherClaim._id.toString());
          expect(mockClaim.findByIdAndDelete).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Staff user should be forbidden from deleting a claim not in draft status', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await DELETE_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Cannot delete claim in status: submitted');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.findByIdAndDelete).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Admin user should delete any claim', async () => {
          // Mock authenticated admin user
          mockAuth.mockReturnValue({ userId: adminUser.clerkId });
          mockUser.findOne.mockResolvedValue(adminUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(submittedClaim);
          mockClaim.findByIdAndDelete.mockResolvedValue(submittedClaim); // Mock delete success

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await DELETE_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual({ message: 'Claim deleted successfully' });
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.findByIdAndDelete).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
              userId: adminUser._id,
              action: 'deleted_claim',
              target: { collection: 'claims', documentId: mockClaimId.toString() },
          }));
      });

      test('Should return 404 if claim not found by ID', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(null); // Claim not found
          mockClaim.findByIdAndDelete.mockResolvedValue(null); // Ensure delete is also mocked

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: new Types.ObjectId().toString() };

          const response = await DELETE_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(404);
          const body = await response.json();
          expect(body).toBe('Claim not found');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockParams.id);
          expect(mockClaim.findByIdAndDelete).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 400 for invalid claim ID format', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          const mockRequest = { headers: {} } as any;
          const mockParams = { id: 'invalid-id' };

          const response = await DELETE_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Invalid claim ID format');
          expect(mockClaim.findById).not.toHaveBeenCalled();
          expect(mockClaim.findByIdAndDelete).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 401 if user is not authenticated', async () => {
          // Mock unauthenticated user
          mockAuth.mockReturnValue({ userId: null });

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await DELETE_ClaimById(mockRequest, { params: mockParams });

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body).toBe('Unauthorized');
          expect(mockClaim.findById).not.toHaveBeenCalled();
          expect(mockClaim.findByIdAndDelete).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });
  });

  describe('POST /api/claims/[id]/submit', () => {
      test('Staff user should submit their own draft claim', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { // Explicitly type mock object
              _id: mockClaimId,
              userId: staffUser._id,
              status: 'draft',
              save: jest.fn().mockResolvedValue(true) as Mock,
              populate: jest.fn() as Mock, // Add populate mock
              submittedAt: undefined, // Initialize properties that will be set later
              approvedBy: undefined,
              approvedAt: undefined,
              remarks: undefined,
          };
          mockClaim.findById.mockResolvedValue(draftClaim);

          const mockRequest = { headers: {} } as any; // Submit typically has no body
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_SubmitClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(expect.objectContaining({
              _id: mockClaimId,
              status: 'submitted', // Status should be updated
          }));
          expect(draftClaim.status).toBe('submitted'); // Verify status change on the mocked object
          expect(draftClaim.submittedAt).toBeInstanceOf(Date); // Verify submittedAt is set
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(draftClaim.save).toHaveBeenCalled();
          expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
              userId: staffUser._id,
              action: 'submitted_claim',
              target: { collection: 'claims', documentId: mockClaimId },
          }));
      });

      test('Staff user should be forbidden from submitting another user\'s claim', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const otherUser = { _id: new Types.ObjectId(), clerkId: 'user_other123', role: 'staff' };
          const otherClaim: MockClaimDocument = { _id: new Types.ObjectId(), userId: otherUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(otherClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: otherClaim._id.toString() };

          const response = await POST_SubmitClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body).toBe('Forbidden');
          expect(mockClaim.findById).toHaveBeenCalledWith(otherClaim._id.toString());
          expect(mockClaim.prototype.save).not.toHaveBeenCalled(); // Ensure save was not attempted
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Staff user should be forbidden from submitting a claim not in draft status', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_SubmitClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Cannot submit claim in status: submitted');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Non-staff user should be forbidden from submitting a claim', async () => {
          // Mock authenticated manager user
          mockAuth.mockReturnValue({ userId: managerUser.clerkId });
          mockUser.findOne.mockResolvedValue(managerUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(draftClaim);

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_SubmitClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body).toBe('Forbidden');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 404 if claim not found by ID', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(null); // Claim not found

          const mockRequest = { headers: {} } as any;
          const mockParams = { id: new Types.ObjectId().toString() };

          const response = await POST_SubmitClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(404);
          const body = await response.json();
          expect(body).toBe('Claim not found');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockParams.id);
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 400 for invalid claim ID format', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          const mockRequest = { headers: {} } as any;
          const mockParams = { id: 'invalid-id' };

          const response = await POST_SubmitClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Invalid claim ID format');
          expect(mockClaim.findById).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 401 if user is not authenticated', async () => {
          // Mock unauthenticated user
          mockAuth.mockReturnValue({ userId: null });

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          const mockRequest = { headers: {} } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_SubmitClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body).toBe('Unauthorized');
          expect(mockClaim.findById).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });
  });

  describe('POST /api/claims/[id]/approve', () => {
      test('Manager user should approve a submitted claim', async () => {
          // Mock authenticated manager user
          mockAuth.mockReturnValue({ userId: managerUser.clerkId });
          mockUser.findOne.mockResolvedValue(managerUser);

          const submittedClaim: MockClaimDocument = { // Explicitly type mock object
              _id: mockClaimId,
              userId: staffUser._id,
              status: 'submitted',
              save: jest.fn().mockResolvedValue(true) as Mock,
              populate: jest.fn() as Mock, // Add populate mock
              submittedAt: new Date(), // Initialize properties that will be set
              approvedBy: undefined, // Initialize properties that will be set
              approvedAt: undefined,
              remarks: undefined,
          };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const approvalData = { status: 'approved', remarks: 'Looks good' };
          const mockRequest = { json: async () => approvalData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(expect.objectContaining({
              _id: mockClaimId,
              status: 'approved', // Status should be updated
              approvedBy: managerUser._id, // Approved by manager
              remarks: 'Looks good',
          }));
          expect(submittedClaim.status).toBe('approved'); // Verify status change on the mocked object
          expect(submittedClaim.approvedBy).toEqual(managerUser._id); // Verify approvedBy
          expect(submittedClaim.approvedAt).toBeInstanceOf(Date); // Verify approvedAt is set
          expect(submittedClaim.remarks).toBe('Looks good'); // Verify remarks
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(submittedClaim.save).toHaveBeenCalled();
          expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
              userId: managerUser._id,
              action: 'approved_claim',
              target: { collection: 'claims', documentId: mockClaimId },
              details: 'approved claim with ID ' + mockClaimId + '. Remarks: Looks good',
          }));
      });

      test('Finance user should reject a submitted claim', async () => {
          // Mock authenticated finance user
          mockAuth.mockReturnValue({ userId: financeUser.clerkId });
          mockUser.findOne.mockResolvedValue(financeUser);

          const submittedClaim: MockClaimDocument = { // Explicitly type mock object
              _id: mockClaimId,
              userId: staffUser._id,
              status: 'submitted',
              save: jest.fn().mockResolvedValue(true) as Mock,
              populate: jest.fn() as Mock, // Add populate mock
              submittedAt: new Date(), // Initialize properties that will be set
              approvedBy: undefined, // Initialize properties that will be set
              approvedAt: undefined,
              remarks: undefined,
          };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const approvalData = { status: 'rejected', remarks: 'Missing receipt' };
          const mockRequest = { json: async () => approvalData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(200);
          const body = await response.json();
          expect(body).toEqual(expect.objectContaining({
              _id: mockClaimId,
              status: 'rejected', // Status should be updated
              approvedBy: financeUser._id, // Approved by finance
              remarks: 'Missing receipt',
          }));
          expect(submittedClaim.status).toBe('rejected'); // Verify status change on the mocked object
          expect(submittedClaim.approvedBy).toEqual(financeUser._id); // Verify approvedBy
          expect(submittedClaim.approvedAt).toBeInstanceOf(Date); // Verify approvedAt is set
          expect(submittedClaim.remarks).toBe('Missing receipt'); // Verify remarks
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(submittedClaim.save).toHaveBeenCalled();
          expect(mockAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
              userId: financeUser._id,
              action: 'rejected_claim',
              target: { collection: 'claims', documentId: mockClaimId },
              details: 'rejected claim with ID ' + mockClaimId + '. Remarks: Missing receipt',
          }));
      });

      test('Should return 400 if claim is not in submitted status', async () => {
          // Mock authenticated manager user
          mockAuth.mockReturnValue({ userId: managerUser.clerkId });
          mockUser.findOne.mockResolvedValue(managerUser);

          const draftClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'draft', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: undefined, approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(draftClaim);

          const approvalData = { status: 'approved' };
          const mockRequest = { json: async () => approvalData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Cannot approve/reject claim in status: draft');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 400 for invalid approval data', async () => {
          // Mock authenticated manager user
          mockAuth.mockReturnValue({ userId: managerUser.clerkId });
          mockUser.findOne.mockResolvedValue(managerUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const invalidApprovalData = {
              status: 'pending', // Invalid status for this endpoint
          };
          const mockRequest = { json: async () => invalidApprovalData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toContain('Invalid request body');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Staff user should be forbidden from approving/rejecting a claim', async () => {
          // Mock authenticated staff user
          mockAuth.mockReturnValue({ userId: staffUser.clerkId });
          mockUser.findOne.mockResolvedValue(staffUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const approvalData = { status: 'approved' };
          const mockRequest = { json: async () => approvalData } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(403);
          const body = await response.json();
          expect(body).toBe('Forbidden');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 404 if claim not found by ID', async () => {
          // Mock authenticated manager user
          mockAuth.mockReturnValue({ userId: managerUser.clerkId });
          mockUser.findOne.mockResolvedValue(managerUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(null); // Claim not found

          const approvalData = { status: 'approved' };
          const mockRequest = { json: async () => approvalData } as any;
          const mockParams = { id: new Types.ObjectId().toString() };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(404);
          const body = await response.json();
          expect(body).toBe('Claim not found');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockParams.id);
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 400 for invalid claim ID format', async () => {
          // Mock authenticated manager user
          mockAuth.mockReturnValue({ userId: managerUser.clerkId });
          mockUser.findOne.mockResolvedValue(managerUser);

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          mockClaim.findById.mockResolvedValue(submittedClaim);

          const approvalData = { status: 'approved' };
          const mockRequest = { json: async () => approvalData } as any;
          const mockParams = { id: 'invalid-id' };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body).toBe('Invalid claim ID format');
          expect(mockClaim.findById).toHaveBeenCalledWith(mockClaimId.toString());
          expect(mockClaim.prototype.save).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });

      test('Should return 401 if user is not authenticated', async () => {
          // Mock unauthenticated user
          mockAuth.mockReturnValue({ userId: null });

          const submittedClaim: MockClaimDocument = { _id: mockClaimId, userId: staffUser._id, status: 'submitted', save: jest.fn() as Mock, populate: jest.fn() as Mock, submittedAt: new Date(), approvedBy: undefined, approvedAt: undefined, remarks: undefined };
          const mockRequest = { json: async () => ({status: 'apporved'}) } as any;
          const mockParams = { id: mockClaimId.toString() };

          const response = await POST_ApproveClaim(mockRequest, { params: mockParams });

          expect(response.status).toBe(401);
          const body = await response.json();
          expect(body).toBe('Unauthorized');
          expect(mockClaim.findById).not.toHaveBeenCalled();
          expect(mockAuditLog.create).not.toHaveBeenCalled();
      });
  });
});