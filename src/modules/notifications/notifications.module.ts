import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationSettingsEntity } from './entities/notification-settings.entity';
import { DeviceTokenEntity } from './entities/device-token.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DeviceTokensController } from './device-tokens.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsCronService } from './notifications.cron';
import { WorkoutEntity } from '../workouts/entities/workout.entity';
import { UserEntity } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      NotificationSettingsEntity,
      DeviceTokenEntity,
      WorkoutEntity,
      UserEntity,
    ]),
    JwtModule.register({}),
  ],
  controllers: [NotificationsController, DeviceTokensController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsCronService,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
