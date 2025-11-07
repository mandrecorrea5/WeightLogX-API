import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly i18n: I18nService,
  ) { }

  async getProfile(userId: string, locale: string = 'pt-BR'): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    return this.mapUserToProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    locale: string = 'pt-BR',
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    // Update fullName if provided
    if (updateProfileDto.fullName !== undefined) {
      user.fullName = updateProfileDto.fullName;
    }

    // Convert birthDate - aceita ISO 8601 ou formato brasileiro dd/MM/yyyy
    if (updateProfileDto.birthDate) {
      let date: Date;

      // Tenta parsear como ISO 8601 primeiro (formato mais comum em APIs)
      if (updateProfileDto.birthDate.includes('T') || updateProfileDto.birthDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        // ISO 8601: 1984-06-19T00:00:00.000Z ou 1984-06-19
        date = new Date(updateProfileDto.birthDate);
      } else if (updateProfileDto.birthDate.includes('/')) {
        // Formato brasileiro: dd/MM/yyyy
        const [day, month, year] = updateProfileDto.birthDate.split('/');
        date = new Date(`${year}-${month}-${day}`);
      } else {
        // Tenta parsear como está
        date = new Date(updateProfileDto.birthDate);
      }

      // Valida se a data é válida
      if (isNaN(date.getTime())) {
        throw new BadRequestException(
          await this.i18n.translate('validation.dateFormat', { lang: locale }),
        );
      }

      user.birthDate = date;
    } else if (updateProfileDto.birthDate === null) {
      user.birthDate = null;
    }

    // Normalizar telefone - remove caracteres não numéricos e formata
    if (updateProfileDto.phone !== undefined) {
      if (updateProfileDto.phone) {
        // Remove todos os caracteres não numéricos
        const phoneDigits = updateProfileDto.phone.replace(/\D/g, '');

        // Valida se tem pelo menos 10 dígitos (DDD + número)
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
          throw new BadRequestException(
            await this.i18n.translate('validation.phoneFormat', { lang: locale }),
          );
        }

        // Salva apenas os dígitos (normalizado)
        user.phone = phoneDigits;
      } else {
        user.phone = null;
      }
    }

    if (updateProfileDto.trainingCenter !== undefined) {
      user.trainingCenter = updateProfileDto.trainingCenter || null;
    }

    await this.userRepository.save(user);

    // Reload with relations to get updated role
    const reloadedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    return this.mapUserToProfileResponse(reloadedUser!);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    locale: string = 'pt-BR',
  ): Promise<{ message: string }> {
    // Validate password confirmation
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        this.i18n.translate('validation.password.mismatch', { lang: locale }),
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        await this.i18n.translate('user.password.currentIncorrect', { lang: locale }),
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.passwordHash = passwordHash;

    await this.userRepository.save(user);

    const message = await this.i18n.translate('user.password.changed', {
      lang: locale,
    });

    return { message };
  }

  async uploadProfileImage(
    userId: string,
    imageUrl: string,
    locale: string = 'pt-BR',
  ): Promise<UploadImageResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    user.profileImageUrl = imageUrl;
    await this.userRepository.save(user);

    return {
      profileImage: imageUrl,
    };
  }

  async deleteProfileImage(
    userId: string,
    locale: string = 'pt-BR',
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    user.profileImageUrl = null;
    await this.userRepository.save(user);

    const message = await this.i18n.translate('user.profileImage.removed', {
      lang: locale,
    });

    return { message };
  }

  async updateUserRole(
    userId: string,
    roleName: string,
    locale: string = 'pt-BR',
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    // Find role by name
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(
        await this.i18n.translate('user.role.notFound', { lang: locale }),
      );
    }

    user.roleId = role.id;
    const updatedUser = await this.userRepository.save(user);

    // Reload with relations to get updated role
    const reloadedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    return this.mapUserToProfileResponse(reloadedUser!);
  }

  async setTrainer(
    athleteId: string,
    trainerId: string,
    locale: string = 'pt-BR',
  ): Promise<ProfileResponseDto> {
    const athlete = await this.userRepository.findOne({ where: { id: athleteId }, relations: ['role'] });
    if (!athlete) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    const trainer = await this.userRepository.findOne({ where: { id: trainerId }, relations: ['role'] });
    if (!trainer) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    athlete.trainerId = trainer.id;
    await this.userRepository.save(athlete);

    const reloaded = await this.userRepository.findOne({ where: { id: athleteId }, relations: ['role'] });
    return this.mapUserToProfileResponse(reloaded!);
  }

  async removeTrainer(
    athleteId: string,
    locale: string = 'pt-BR',
  ): Promise<ProfileResponseDto> {
    const athlete = await this.userRepository.findOne({ where: { id: athleteId }, relations: ['role'] });
    if (!athlete) {
      throw new NotFoundException(
        await this.i18n.translate('user.profile.notFound', { lang: locale }),
      );
    }

    athlete.trainerId = null;
    await this.userRepository.save(athlete);

    const reloaded = await this.userRepository.findOne({ where: { id: athleteId }, relations: ['role'] });
    return this.mapUserToProfileResponse(reloaded!);
  }

  private mapUserToProfileResponse(user: UserEntity): ProfileResponseDto {
    // Format birthDate from Date to dd/MM/yyyy string
    let birthDateFormatted: string | null = null;
    if (user.birthDate) {
      const date = new Date(user.birthDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      birthDateFormatted = `${day}/${month}/${year}`;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role?.name || 'atleta',
      birthDate: birthDateFormatted,
      phone: user.phone,
      trainingCenter: user.trainingCenter,
      profileImage: user.profileImageUrl,
    };
  }
}

