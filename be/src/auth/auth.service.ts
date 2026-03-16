import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

type AuthUserPublic = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  exp: number;
};

@Injectable()
export class AuthService {
  private readonly dataDir = join(process.cwd(), 'data');
  private readonly usersPath = join(this.dataDir, 'auth-users.json');

  constructor(private readonly configService: ConfigService) {}

  async register(dto: RegisterDto) {
    const users = await this.readUsers();
    const exists = users.some(
      (user) => user.email.toLowerCase() === dto.email.toLowerCase(),
    );

    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = this.hashPassword(dto.password);

    const user: AuthUser = {
      id: randomUUID(),
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    await this.writeUsers(users);

    const token = this.signToken(user);
    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  async login(dto: LoginDto) {
    const users = await this.readUsers();
    const user = users.find(
      (item) => item.email.toLowerCase() === dto.email.toLowerCase(),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = this.verifyPassword(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.signToken(user);
    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const users = await this.readUsers();
    const userIndex = users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      throw new UnauthorizedException('User not found');
    }

    const user = users[userIndex];
    const validCurrentPassword = this.verifyPassword(dto.currentPassword, user.passwordHash);

    if (!validCurrentPassword) {
      throw new UnauthorizedException('Invalid current password');
    }

    const newPasswordHash = this.hashPassword(dto.newPassword);
    
    // Update the user array and write it back
    users[userIndex].passwordHash = newPasswordHash;
    await this.writeUsers(users);

    return { success: true };
  }

  async updateEmailAndName(userId: string, email: string, name: string) {
    const users = await this.readUsers();
    const userIndex = users.findIndex((item) => item.id === userId);

    if (userIndex === -1) {
      throw new UnauthorizedException('User not found');
    }

    const newEmail = email.toLowerCase();
    
    // Check for email collision if the email is actually changing
    if (users[userIndex].email !== newEmail) {
      const emailExists = users.some((user) => user.email === newEmail && user.id !== userId);
      if (emailExists) {
        throw new ConflictException('Email already registered');
      }
    }

    users[userIndex].email = newEmail;
    users[userIndex].name = name;
    
    await this.writeUsers(users);
    return { success: true };
  }

  verifyToken(token: string): JwtPayload {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const expectedSignature = this.signValue(encodedPayload);
    const isValidSignature = this.safeEqual(signature, expectedSignature);

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    let payload: JwtPayload;

    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf-8'),
      ) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload.exp || payload.exp < Date.now()) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }

  async me(userId: string) {
    const users = await this.readUsers();
    const user = users.find((item) => item.id === userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toPublicUser(user);
  }

  private signToken(user: AuthUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = this.signValue(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private getJwtSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') || 'taskpulse-dev-secret'
    );
  }

  private signValue(value: string): string {
    return createHmac('sha256', this.getJwtSecret())
      .update(value)
      .digest('base64url');
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const calculatedHash = scryptSync(password, salt, 64).toString('hex');
    return this.safeEqual(hash, calculatedHash);
  }

  private safeEqual(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    if (aBuffer.length !== bBuffer.length) return false;
    return timingSafeEqual(aBuffer, bBuffer);
  }

  private async readUsers(): Promise<AuthUser[]> {
    await mkdir(this.dataDir, { recursive: true });

    try {
      const content = await readFile(this.usersPath, 'utf-8');
      return JSON.parse(content) as AuthUser[];
    } catch {
      await this.writeUsers([]);
      return [];
    }
  }

  private async writeUsers(users: AuthUser[]) {
    await mkdir(this.dataDir, { recursive: true });
    await writeFile(this.usersPath, JSON.stringify(users, null, 2), 'utf-8');
  }

  private toPublicUser(user: AuthUser): AuthUserPublic {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
