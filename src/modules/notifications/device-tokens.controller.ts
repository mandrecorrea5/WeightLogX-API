import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications/device-tokens')
export class DeviceTokensController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  @ApiOperation({ summary: 'Register a device token' })
  async register(
    @CurrentUser() user: UserEntity,
    @Body() body: { deviceToken: string; platform: 'ios' | 'android'; deviceId?: string },
  ) {
    await this.notificationsService.registerDeviceToken(user.id, body);
    return { message: 'Token registrado' };
  }

  @Delete(':deviceToken')
  @ApiOperation({ summary: 'Delete a device token' })
  async remove(@CurrentUser() user: UserEntity, @Param('deviceToken') deviceToken: string) {
    await this.notificationsService.deleteDeviceToken(user.id, deviceToken);
    return { message: 'Token removido' };
  }
}
