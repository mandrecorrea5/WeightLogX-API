import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) { }

  async transform(
    value: Express.Multer.File,
    metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException(
        await this.i18n.translate('user.profileImage.invalidFormat', {
          lang: 'pt-BR',
        }),
      );
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(value.mimetype)) {
      throw new BadRequestException(
        await this.i18n.translate('user.profileImage.invalidFormat', {
          lang: 'pt-BR',
        }),
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (value.size > maxSize) {
      throw new BadRequestException(
        await this.i18n.translate('user.profileImage.invalidSize', {
          lang: 'pt-BR',
        }),
      );
    }

    return value;
  }
}

