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

const mockClaim = {
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

jest.mock('@/models/Claim', () => ({
  __esModule: true,
  default: mockClaim,
}));

jest.mock('@/models/AuditLog', () => ({
  __esModule: true,
  default: mockAuditLog,
}));

// Import the actual API route handlers
import { POST as POST_Claims } from '@/app/api/claims/route';

// Type the mocked functions properly
const mockAuth = auth as unknown as jest.MockedFunction<() => { userId: string | null }>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

// Define a type for mock user objects
interface MockUser {
  _id: Types.ObjectId;
  clerkId: string;
  role: string;
  name: string;
  email: string;
}

// Define a type for the mocked Claim document (without extending Document to avoid conflicts)
interface MockClaimDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  project: string;
  status: string;
  date?: Date;
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
  save: jest.MockedFunction<() => Promise<MockClaimDocument>>;
  populate: jest.MockedFunction<(path: string) => Promise<MockClaimDocument>>;
}

describe('Claims API Simplified Tests', () => {
  let staffUser: MockUser;

  beforeAll(() => {
    // Define a mock staff user
    staffUser = {
      _id: new Types.ObjectId(),
      clerkId: 'user_staff123',
      role: 'staff',
      name: 'Staff User',
      email: 'staff@example.com'
    };

    // Mock dbConnect to resolve immediately
    mockDbConnect.mockResolvedValue({} as typeof import('mongoose'));
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockAuth.mockReset();
    (mockUser.findOne as jest.Mock).mockReset();
    (mockClaim.create as jest.Mock).mockReset();
    (mockAuditLog.create as jest.Mock).mockReset();
  });

  test('Basic test: Staff user should be able to call POST /api/claims', async () => {
    // Mock authenticated staff user
    mockAuth.mockReturnValue({ userId: staffUser.clerkId });
    (mockUser.findOne as jest.Mock).mockResolvedValue(staffUser);

    const claimData = {
      date: '2025-06-01',
      project: 'Project X',
    };

    // Create a properly typed mock claim document
    const createdClaim: MockClaimDocument = {
      _id: new Types.ObjectId(),
      userId: staffUser._id,
      status: 'draft',
      project: claimData.project,
      date: new Date(claimData.date),
      description: undefined,
      expenses: undefined,
      totalClaim: undefined,
      attachments: undefined,
      submittedAt: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      remarks: undefined,
      save: jest.fn().mockResolvedValue({} as MockClaimDocument),
      populate: jest.fn().mockResolvedValue({} as MockClaimDocument),
    };

    (mockClaim.create as jest.Mock).mockResolvedValue(createdClaim);

    // Simulate the request
    const mockRequest = {
      json: async () => claimData,
    } as unknown as Request;

    const response = await (POST_Claims as unknown as (req: Request) => Promise<Response>)(mockRequest);

    expect(response.status).toBe(201);
    
    // Verify that the create method was called with the expected data
    expect(mockClaim.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: staffUser._id,
      date: new Date('2025-06-01'),
      project: 'Project X',
      status: 'draft',
    }));
  });
});