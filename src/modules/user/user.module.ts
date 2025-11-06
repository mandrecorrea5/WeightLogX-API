import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nModule } from '../../i18n/i18n.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { PermissionsService } from './services/permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity]),
    I18nModule,
  ],
  controllers: [UserController],
  providers: [UserService, PermissionsService],
  exports: [UserService, PermissionsService],
})
export class UserModule { }

