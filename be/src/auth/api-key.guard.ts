import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * API Key authentication guard.
 * Validates the `x-api-key` header against the configured API_KEY.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('API_KEY');

    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
