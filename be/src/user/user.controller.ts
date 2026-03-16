import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { UpdateProfileDto, UpdateSettingsDto } from './dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(ApiKeyGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.userService.getProfile(req.user);
  }

  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user, dto);
  }

  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const acceptedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!acceptedMimeTypes.includes(file.mimetype)) {
          cb(new Error('Only JPG, PNG, and WEBP files are allowed'), false);
          return;
        }

        cb(null, true);
      },
    }),
  )
  uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadAvatar(req.user, file);
  }

  @Get('settings')
  getSettings(@Req() req: any) {
    return this.userService.getSettings(req.user);
  }

  @Patch('settings')
  updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.userService.updateSettings(req.user, dto);
  }

  @Get('notifications')
  getNotifications(@Req() req: any) {
    return this.userService.getNotifications(req.user);
  }

  @Patch('notifications/:id/read')
  markNotificationAsRead(@Req() req: any, @Param('id') id: string) {
    return this.userService.markNotificationAsRead(req.user, id);
  }
}
