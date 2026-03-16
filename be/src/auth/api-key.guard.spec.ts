import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyGuard } from './api-key.guard';

/**
 * Unit tests for API Key authentication guard.
 */
describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  const createMockContext = (apiKey?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: apiKey ? { 'x-api-key': apiKey } : {},
        }),
      }),
    } as ExecutionContext;
  };

  it('should allow request with valid API key', () => {
    const context = createMockContext('test-api-key');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject request with invalid API key', () => {
    const context = createMockContext('wrong-key');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request without API key header', () => {
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request with empty API key', () => {
    const context = createMockContext('');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
