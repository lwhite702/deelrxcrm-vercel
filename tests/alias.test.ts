import { createAlias, disableAlias, validateForwarding } from '../lib/alias/simplelogin';

// Mock fetch globally
global.fetch = jest.fn();

describe('SimpleLogin API Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock environment variables
    process.env.SIMPLELOGIN_API_KEY = 'test-key';
    process.env.SIMPLELOGIN_API_URL = 'https://api.simplelogin.io';
    process.env.SIMPLELOGIN_ALIAS_DOMAIN = 'alias.example.com';
  });

  describe('createAlias', () => {
    it('should create an alias successfully', async () => {
      const mockResponse = {
        email: 'test.alias@simplelogin.io',
        id: 12345,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await createAlias({ note: 'Test alias' });

      expect(result).toEqual({
        alias: 'test.alias@simplelogin.io',
        aliasId: '12345',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.simplelogin.io/api/aliases',
        {
          method: 'POST',
          headers: {
            'Authentication': 'test-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            note: 'Test alias',
            hostname: 'alias.example.com',
          }),
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      } as Response);

      await expect(createAlias({})).rejects.toThrow(
        'Authentication failed - check API key configuration'
      );
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(createAlias({})).rejects.toThrow(
        'Unable to connect to SimpleLogin service'
      );
    });

    it('should throw when API key is missing', async () => {
      delete process.env.SIMPLELOGIN_API_KEY;

      await expect(createAlias({})).rejects.toThrow(
        'SimpleLogin API key not configured'
      );
    });
  });

  describe('disableAlias', () => {
    it('should disable an alias successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(
        disableAlias({ aliasId: '12345' })
      ).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.simplelogin.io/api/aliases/12345/toggle',
        {
          method: 'POST',
          headers: {
            'Authentication': 'test-key',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle 404 errors appropriately', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        disableAlias({ aliasId: 'nonexistent' })
      ).rejects.toThrow('Alias not found');
    });
  });

  describe('validateForwarding', () => {
    it('should return "ok" for valid email format', async () => {
      const result = await validateForwarding('test@example.com');
      expect(result).toBe('ok');
    });

    it('should return "error" for invalid email format', async () => {
      const result = await validateForwarding('invalid-email');
      expect(result).toBe('error');
    });

    it('should return "error" for email without domain', async () => {
      const result = await validateForwarding('test@');
      expect(result).toBe('error');
    });
  });
});