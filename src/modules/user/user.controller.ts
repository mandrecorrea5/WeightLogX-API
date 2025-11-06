import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { I18nLang } from 'nestjs-i18n';
import { UserService } from './user.service';
import { PermissionsService } from './services/permissions.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import { PermissionsResponseDto } from './dto/permissions-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { ImageValidationPipe } from '../../common/pipes/image-validation.pipe';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@ApiTags('user')
@ApiBearerAuth('JWT-auth')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly permissionsService: PermissionsService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) { }

  @Get('profile')
  @ApiOperation({ summary: 'Retorna dados do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do perfil do usuário',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getProfile(
    @CurrentUser() user: UserEntity,
    @I18nLang() locale: string,
  ): Promise<ProfileResponseDto> {
    return this.userService.getProfile(user.id, locale);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualiza dados do perfil' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async updateProfile(
    @CurrentUser() user: UserEntity,
    @Body() updateProfileDto: UpdateProfileDto,
    @I18nLang() locale: string,
  ): Promise<ProfileResponseDto> {
    return this.userService.updateProfile(user.id, updateProfileDto, locale);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Altera senha do usuário' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta ou não autenticado' })
  async changePassword(
    @CurrentUser() user: UserEntity,
    @Body() changePasswordDto: ChangePasswordDto,
    @I18nLang() locale: string,
  ): Promise<{ message: string }> {
    return this.userService.changePassword(user.id, changePasswordDto, locale);
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload de imagem de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Imagem de perfil enviada com sucesso',
    type: UploadImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Formato ou tamanho de imagem inválido' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async uploadProfileImage(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
    @I18nLang() locale: string,
  ): Promise<UploadImageResponseDto> {
    // Validate file
    if (!file) {
      throw new BadRequestException(
        await this.i18n.translate('user.profileImage.invalidFormat', {
          lang: locale,
        }),
      );
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        await this.i18n.translate('user.profileImage.invalidFormat', {
          lang: locale,
        }),
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        await this.i18n.translate('user.profileImage.invalidSize', {
          lang: locale,
        }),
      );
    }
    // Process image with Sharp
    const uploadConfig = this.configService.get('upload');
    const uploadPath = uploadConfig.profileImagePath || './uploads/profiles';
    const imageSize = uploadConfig.profileImageSize || { width: 512, height: 512 };

    // Ensure upload directory exists
    await fs.mkdir(uploadPath, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const filename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadPath, filename);

    // Process image: resize to square, compress
    await sharp(file.buffer)
      .resize(imageSize.width, imageSize.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    // Generate URL (for now, local path - in production, use S3 or CDN)
    const imageUrl = `/uploads/profiles/${filename}`;

    return this.userService.uploadProfileImage(user.id, imageUrl, locale);
  }

  @Delete('profile-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove imagem de perfil' })
  @ApiResponse({ status: 200, description: 'Imagem removida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async deleteProfileImage(
    @CurrentUser() user: UserEntity,
    @I18nLang() locale: string,
  ): Promise<{ message: string }> {
    // Get current profile image URL to delete file
    const profile = await this.userService.getProfile(user.id, locale);

    if (profile.profileImage) {
      // Extract filename from URL
      const filename = path.basename(profile.profileImage);
      const uploadConfig = this.configService.get('upload');
      const uploadPath = uploadConfig.profileImagePath || './uploads/profiles';
      const filePath = path.join(uploadPath, filename);

      // Delete file if exists
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, continue anyway
      }
    }

    return this.userService.deleteProfileImage(user.id, locale);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Retorna as permissões do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Permissões do usuário',
    type: PermissionsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getPermissions(
    @CurrentUser() user: UserEntity,
  ): Promise<PermissionsResponseDto> {
    const roleName = user.role?.name || 'atleta';
    const permissions = this.permissionsService.getPermissionsByRole(roleName);
    return {
      role: roleName,
      permissions,
    };
  }

  @Put('users/:userId/role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Atualiza a role de um usuário (apenas admin)' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role atualizada com sucesso',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado (apenas admin)' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @I18nLang() locale: string,
  ): Promise<ProfileResponseDto> {
    return this.userService.updateUserRole(userId, updateUserRoleDto.role, locale);
  }

  @Put('users/:userId/trainer')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Define o treinador de um atleta (apenas admin)' })
  @ApiBody({ schema: { type: 'object', properties: { trainerId: { type: 'string', format: 'uuid' } }, required: ['trainerId'] } })
  @ApiResponse({ status: 200, description: 'Vínculo atualizado', type: ProfileResponseDto })
  async setTrainer(
    @Param('userId') userId: string,
    @Body('trainerId') trainerId: string,
    @I18nLang() locale: string,
  ): Promise<ProfileResponseDto> {
    return this.userService.setTrainer(userId, trainerId, locale);
  }

  @Delete('users/:userId/trainer')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Remove o treinador de um atleta (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Vínculo removido', type: ProfileResponseDto })
  async removeTrainer(
    @Param('userId') userId: string,
    @I18nLang() locale: string,
  ): Promise<ProfileResponseDto> {
    return this.userService.removeTrainer(userId, locale);
  }
}

