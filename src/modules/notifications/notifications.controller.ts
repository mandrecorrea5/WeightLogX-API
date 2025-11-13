import { Controller, Get, Query, Patch, Param, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  async list(
    @CurrentUser() user: UserEntity,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.listNotifications(
      user.id,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
      unreadOnly === 'true',
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    await this.notificationsService.markAsRead(user.id, id);
    return { message: 'Notificação marcada como lida' };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAll(@CurrentUser() user: UserEntity) {
    const updatedCount = await this.notificationsService.markAllAsRead(user.id);
    return {
      message: 'Todas as notificações foram marcadas como lidas',
      updatedCount,
    };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings' })
  async getSettings(@CurrentUser() user: UserEntity) {
    return this.notificationsService.getSettings(user.id);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  async updateSettings(@CurrentUser() user: UserEntity, @Body() body: any) {
    return this.notificationsService.updateSettings(user.id, body);
  }
}
