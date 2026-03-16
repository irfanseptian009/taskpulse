import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto, UpdateSettingsDto } from './dto';

type JwtUser = {
  sub: string;
  email: string;
  name: string;
};

type UserRecord = {
  profile: {
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
  settings: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    inAppNotifications: boolean;
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }>;
};

type UserState = {
  users: Record<string, UserRecord>;
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly dataDir = join(process.cwd(), 'data');
  private readonly dataPath = join(this.dataDir, 'user-state.json');
  private readonly bucketName = 'profile';
  private readonly supabase: SupabaseClient | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (supabaseUrl && supabaseServiceRoleKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false },
      });
    } else {
      this.supabase = null;
      this.logger.warn(
        'Supabase credentials are missing. Avatar upload endpoint will be unavailable.',
      );
    }
  }

  async getProfile(jwtUser: JwtUser) {
    const state = await this.readState();
    const userRecord = this.getUserRecord(state, jwtUser);

    return {
      id: jwtUser.sub,
      ...userRecord.profile,
    };
  }

  async updateProfile(jwtUser: JwtUser, dto: UpdateProfileDto) {
    const state = await this.readState();
    const userRecord = this.getUserRecord(state, jwtUser);

    // Sync with auth system before applying locally. Throws if email taken.
    if (dto.email || dto.displayName) {
      const newEmail = dto.email ?? jwtUser.email;
      const newName = dto.displayName ?? jwtUser.name;
      await this.authService.updateEmailAndName(jwtUser.sub, newEmail, newName);
    }

    userRecord.profile = {
      ...userRecord.profile,
      ...dto,
    };

    await this.writeState(state);
    return {
      id: jwtUser.sub,
      ...userRecord.profile,
    };
  }

  async getSettings(jwtUser: JwtUser) {
    const state = await this.readState();
    return this.getUserRecord(state, jwtUser).settings;
  }

  async updateSettings(jwtUser: JwtUser, dto: UpdateSettingsDto) {
    const state = await this.readState();
    const userRecord = this.getUserRecord(state, jwtUser);

    userRecord.settings = {
      ...userRecord.settings,
      ...dto,
    };

    await this.writeState(state);
    return userRecord.settings;
  }

  async getNotifications(jwtUser: JwtUser) {
    const state = await this.readState();
    const userRecord = this.getUserRecord(state, jwtUser);

    return userRecord.notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async markNotificationAsRead(jwtUser: JwtUser, id: string) {
    const state = await this.readState();
    const userRecord = this.getUserRecord(state, jwtUser);

    userRecord.notifications = userRecord.notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    );

    await this.writeState(state);
    return { success: true };
  }

  async uploadAvatar(jwtUser: JwtUser, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Supabase client is not configured on the server',
      );
    }

    const extension = this.getExtension(file.originalname);
    const fileName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e8)}.${extension}`;
    const objectPath = `uploads/${fileName}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucketName)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`Failed upload avatar: ${uploadError.message}`);
      throw new InternalServerErrorException('Failed to upload avatar');
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(objectPath);

    const state = await this.readState();
    const userRecord = this.getUserRecord(state, jwtUser);
    userRecord.profile.avatarUrl = publicUrlData.publicUrl;
    await this.writeState(state);

    return {
      avatarUrl: publicUrlData.publicUrl,
    };
  }

  private getDefaultUserRecord(jwtUser: JwtUser): UserRecord {
    return {
      profile: {
        displayName: jwtUser.name,
        email: jwtUser.email,
        avatarUrl: null,
      },
      settings: {
        theme: 'system',
        emailNotifications: true,
        inAppNotifications: true,
      },
      notifications: [
        {
          id: `notif-${Date.now()}-1`,
          title: 'Welcome to TaskPulse',
          message: 'Your dashboard is ready. Start by creating your first task.',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: `notif-${Date.now()}-2`,
          title: 'Tip',
          message: 'Use cron preview in task form to validate your schedule.',
          read: false,
          createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        },
      ],
    };
  }

  private async readState(): Promise<UserState> {
    await mkdir(this.dataDir, { recursive: true });

    try {
      const content = await readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(content) as UserState | Record<string, unknown>;

      if ('users' in parsed && parsed.users && typeof parsed.users === 'object') {
        return parsed as UserState;
      }

      // Migrate old single-user shape to new multi-user shape
      const migratedState: UserState = { users: {} };
      await this.writeState(migratedState);
      return migratedState;
    } catch {
      const defaultState: UserState = { users: {} };
      await this.writeState(defaultState);
      return defaultState;
    }
  }

  private async writeState(state: UserState): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await writeFile(this.dataPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  private getExtension(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return 'jpg';
    return extension;
  }

  private getUserRecord(state: UserState, jwtUser: JwtUser): UserRecord {
    if (!state.users[jwtUser.sub]) {
      state.users[jwtUser.sub] = this.getDefaultUserRecord(jwtUser);
    }

    return state.users[jwtUser.sub];
  }
}
