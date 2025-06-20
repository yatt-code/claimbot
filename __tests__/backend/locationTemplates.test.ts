import { Types } from 'mongoose';
import { auth } from '@clerk/nextjs/server';
import { dbConnect } from '@/lib/server/db';
import { calculateMileage, validateTripRequirements } from '@/lib/mileage-calculator';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Mock database connection
jest.mock('@/lib/server/db', () => ({
  dbConnect: jest.fn(),
}));

// Mock the Mongoose models
const mockUser = {
  findOne: jest.fn(),
};

const mockLocationTemplate = {
  find: jest.fn(),
  findOne: jest.fn(),
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

jest.mock('@/models/LocationTemplate', () => ({
  __esModule: true,
  default: mockLocationTemplate,
}));

jest.mock('@/models/AuditLog', () => ({
  __esModule: true,
  default: mockAuditLog,
}));

// Mock Google Maps functions
jest.mock('@/lib/google-maps', () => ({
  getDistanceInKM: jest.fn(),
  getOfficeLocation: jest.fn(() => ({
    lat: 3.139,
    lng: 101.6869,
    name: 'Test Office'
  })),
  validateCoordinates: jest.fn(() => true)
}));

// Import the actual API route handlers
import { GET, POST } from '@/app/api/location-templates/route';

const mockAuth = auth as unknown as jest.MockedFunction<() => { userId: string | null }>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

describe('/api/location-templates', () => {
  beforeAll(() => {
    // Mock dbConnect to resolve immediately
    mockDbConnect.mockResolvedValue({} as typeof import('mongoose'));
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockAuth.mockReset();
    (mockUser.findOne as jest.Mock).mockReset();
    (mockLocationTemplate.find as jest.Mock).mockReset();
    (mockLocationTemplate.findOne as jest.Mock).mockReset();
    (mockAuditLog.create as jest.Mock).mockReset();
  });

  describe('GET /api/location-templates', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      (mockUser.findOne as jest.Mock).mockResolvedValue({
        hasAnyRole: jest.fn().mockReturnValue(false)
      });

      const response = await GET();

      expect(response.status).toBe(403);
    });

    it('should return location templates for admin users', async () => {
      mockAuth.mockReturnValue({ userId: 'admin123' });
      (mockUser.findOne as jest.Mock).mockResolvedValue({
        hasAnyRole: jest.fn().mockReturnValue(true)
      });

      const mockTemplates = [
        {
          _id: '1',
          name: 'KPKT',
          address: 'Kuala Lumpur',
          lat: 3.139,
          lng: 101.6869
        }
      ];
      (mockLocationTemplate.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockTemplates)
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTemplates);
    });
  });
});

describe('Mileage Calculator', () => {
  const { getDistanceInKM } = require('@/lib/google-maps');

  beforeEach(() => {
    jest.clearAllMocks();
    getDistanceInKM.mockResolvedValue(15.5);
  });

  describe('calculateMileage', () => {
    it('should calculate one-way distance', async () => {
      const result = await calculateMileage(
        { lat: 3.139, lng: 101.6869, name: 'Test Office' }, // Origin
        'Test Destination', // Destination
        false // isRoundTrip
      );

      expect(result).toBe(15.5);
      expect(getDistanceInKM).toHaveBeenCalledWith(
        { lat: 3.139, lng: 101.6869, name: 'Test Office' },
        'Test Destination'
      );
    });

    it('should calculate round-trip distance', async () => {
      const result = await calculateMileage(
        { lat: 3.139, lng: 101.6869, name: 'Test Office' }, // Origin
        'Test Destination', // Destination
        true // isRoundTrip
      );

      expect(result).toBe(31); // 15.5 * 2
    });

    it('should calculate custom one-way trip correctly', async () => {
      const result = await calculateMileage(
        'Custom Origin', // Origin
        'Test Destination', // Destination
        false // isRoundTrip
      );

      expect(result).toBe(15.5);
      expect(getDistanceInKM).toHaveBeenCalledWith(
        'Custom Origin',
        'Test Destination'
      );
    });

    it('should calculate custom round-trip correctly', async () => {
      const result = await calculateMileage(
        'Custom Origin', // Origin
        'Test Destination', // Destination
        true // isRoundTrip
      );

      expect(result).toBe(31); // 15.5 * 2
      expect(getDistanceInKM).toHaveBeenCalledWith(
        'Custom Origin',
        'Test Destination'
      );
    });
  });

  describe('validateTripRequirements', () => {
    it('should validate origin requirement', () => {
      const result = validateTripRequirements(
        null, // Missing origin
        'Test Destination'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Origin is required');
    });

    it('should validate destination requirement', () => {
      const result = validateTripRequirements(
        'Test Origin',
        null // Missing destination
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Destination is required');
    });

    it('should pass validation for valid inputs', () => {
      const result = validateTripRequirements(
        'Test Origin',
        'Test Destination'
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});