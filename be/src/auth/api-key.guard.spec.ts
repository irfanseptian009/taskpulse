import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { AuthService } from './auth.service';

/**
 * Unit tests for API Key authentication guard.
 */
describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;

  const mockAuthService = {
    verifyToken: jest.fn().mockReturnValue({
      sub: 'user-id',
      email: 'user@mail.com',
      name: 'User',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  const createMockContext = (authorization?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authorization ? { authorization } : {},
        }),
      }),
    } as ExecutionContext;
  };

  it('should allow request with valid bearer token', () => {
    const context = createMockContext('Bearer test-token');
    expect(guard.canActivate(context)).toBe(true);
    expect(mockAuthService.verifyToken).toHaveBeenCalledWith('test-token');
  });

  it('should reject request with invalid authorization type', () => {
    const context = createMockContext('Basic abcdef');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request without authorization header', () => {
    const context = createMockContext();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should reject request with empty bearer token', () => {
    const context = createMockContext('Bearer ');
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
