import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/server/db';
import SavedTripTemplate from '@/models/SavedTripTemplate';
import User from '@/models/User';
import { auditLog } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Mock database connection
jest.mock('@/lib/server/db', () => ({
  connectDB: jest.fn(),
}));

// Mock the Mongoose models
const mockUser = {
  findOne: jest.fn(),
};

const mockSavedTripTemplate = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
};

const mockAuditLog = {
  auditLog: jest.fn(),
};

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: mockUser,
}));

jest.mock('@/models/SavedTripTemplate', () => ({
  __esModule: true,
  default: mockSavedTripTemplate,
}));

jest.mock('@/lib/logger', () => ({
  auditLog: jest.fn(),
}));

// Import the actual API route handlers
import { GET, POST } from '@/app/api/saved-trip-templates/route';
import { DELETE } from '@/app/api/saved-trip-templates/[id]/route';

const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<{ userId: string | null }>>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockAuditLogFn = auditLog as jest.MockedFunction<typeof auditLog>;

describe('/api/saved-trip-templates', () => {
  beforeAll(() => {
    // Mock dbConnect to resolve immediately with a dummy mongoose object
    mockConnectDB.mockResolvedValue({} as any); // Use 'any' to bypass strict type checking for mock
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user123' });
    (mockUser.findOne as jest.Mock).mockResolvedValue({
      _id: 'userObjectId123',
      clerkId: 'user123',
      hasAnyRole: jest.fn().mockReturnValue(true),
      hasRole: jest.fn().mockReturnValue(true),
    });
  });

  describe('GET /api/saved-trip-templates', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET(new NextRequest('http://localhost/api/saved-trip-templates', { method: 'GET' }));

      expect(response.status).toBe(401);
    });

    it('should return saved trip templates for authenticated users', async () => {
      const mockTemplates = [
        {
          id: 'template1',
          userId: 'user123',
          origin: { address: 'Origin A', lat: 1, lng: 1 },
          destination: { address: 'Destination B', lat: 2, lng: 2 },
          roundTrip: false,
          label: 'Work Trip',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockSavedTripTemplate.findAll as jest.Mock).mockResolvedValue(mockTemplates);

      const response = await GET(new NextRequest('http://localhost/api/saved-trip-templates', { method: 'GET' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockTemplates);
      expect(mockSavedTripTemplate.findAll).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        order: [['createdAt', 'DESC']],
      });
    });

    it('should handle errors gracefully', async () => {
      (mockSavedTripTemplate.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

      const response = await GET(new NextRequest('http://localhost/api/saved-trip-templates', { method: 'GET' }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error fetching saved trip templates');
    });
  });

  describe('POST /api/saved-trip-templates', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await POST(new NextRequest('http://localhost/api/saved-trip-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }));

      expect(response.status).toBe(401);
    });

    it('should return 400 if missing required fields', async () => {
      const response = await POST(new NextRequest('http://localhost/api/saved-trip-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: {}, destination: {}, roundTrip: true }), // Missing label
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Missing required fields');
    });

    it('should create a new saved trip template', async () => {
      const newTemplateData = {
        origin: { address: 'Origin C', lat: 3, lng: 3 },
        destination: { address: 'Destination D', lat: 4, lng: 4 },
        roundTrip: true,
        label: 'Weekend Trip',
      };
      const createdTemplate = { id: 'newTemplateId', userId: 'user123', ...newTemplateData };
      (mockSavedTripTemplate.create as jest.Mock).mockResolvedValue(createdTemplate);

      const response = await POST(new NextRequest('http://localhost/api/saved-trip-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplateData),
      }));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdTemplate);
      expect(mockSavedTripTemplate.create).toHaveBeenCalledWith({
        userId: 'user123',
        ...newTemplateData,
      });
      expect(mockAuditLogFn).toHaveBeenCalledWith({
        userId: 'user123',
        action: 'CREATE',
        entity: 'SavedTripTemplate',
        entityId: 'newTemplateId',
        details: 'Created saved trip template: Weekend Trip',
      });
    });

    it('should handle errors gracefully', async () => {
      (mockSavedTripTemplate.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const response = await POST(new NextRequest('http://localhost/api/saved-trip-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { address: 'Origin C', lat: 3, lng: 3 },
          destination: { address: 'Destination D', lat: 4, lng: 4 },
          roundTrip: true,
          label: 'Weekend Trip',
        }),
      }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error creating saved trip template');
    });
  });

  describe('DELETE /api/saved-trip-templates/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await DELETE(new NextRequest('http://localhost/api/saved-trip-templates/someId', { method: 'DELETE' }), { params: { id: 'someId' } });

      expect(response.status).toBe(401);
    });

    it('should return 400 if template ID is missing', async () => {
      const response = await DELETE(new NextRequest('http://localhost/api/saved-trip-templates/', { method: 'DELETE' }), { params: { id: '' } }); // Missing ID

      expect(response.status).toBe(400);
    });

    it('should return 404 if template not found or unauthorized', async () => {
      (mockSavedTripTemplate.findOne as jest.Mock).mockResolvedValue(null);

      const response = await DELETE(new NextRequest('http://localhost/api/saved-trip-templates/nonExistentId', { method: 'DELETE' }), { params: { id: 'nonExistentId' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('Template not found or unauthorized');
    });

    it('should delete a saved trip template', async () => {
      const mockTemplate = {
        id: 'templateToDelete',
        userId: 'user123',
        label: 'Old Trip',
        destroy: jest.fn().mockResolvedValue(true),
      };
      (mockSavedTripTemplate.findOne as jest.Mock).mockResolvedValue(mockTemplate);

      const response = await DELETE(new NextRequest('http://localhost/api/saved-trip-templates/templateToDelete', { method: 'DELETE' }), { params: { id: 'templateToDelete' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Template deleted successfully');
      expect(mockTemplate.destroy).toHaveBeenCalled();
      expect(mockAuditLogFn).toHaveBeenCalledWith({
        userId: 'user123',
        action: 'DELETE',
        entity: 'SavedTripTemplate',
        entityId: 'templateToDelete',
        details: 'Deleted saved trip template: Old Trip',
      });
    });

    it('should handle errors gracefully', async () => {
      (mockSavedTripTemplate.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      const response = await DELETE(new NextRequest('http://localhost/api/saved-trip-templates/someId', { method: 'DELETE' }), { params: { id: 'someId' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error deleting saved trip template');
    });
  });
});