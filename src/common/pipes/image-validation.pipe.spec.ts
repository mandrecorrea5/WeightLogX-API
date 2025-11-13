import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ImageValidationPipe } from './image-validation.pipe';

describe('ImageValidationPipe', () => {
  let pipe: ImageValidationPipe;
  let i18nService: I18nService;

  const mockI18nService = {
    translate: jest.fn((key: string, options?: any) => Promise.resolve(key)),
  };

  const mockMetadata: ArgumentMetadata = {
    type: 'custom',
    metatype: Object,
    data: 'image',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageValidationPipe,
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    pipe = module.get<ImageValidationPipe>(ImageValidationPipe);
    i18nService = module.get<I18nService>(I18nService);

    jest.clearAllMocks();
  });

  describe('transform', () => {
    it('should throw BadRequestException if file is null', async () => {
      mockI18nService.translate.mockResolvedValue('Formato de imagem inválido');

      await expect(pipe.transform(null as any, mockMetadata)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockI18nService.translate).toHaveBeenCalled();
    });

    it('should throw BadRequestException if file is undefined', async () => {
      mockI18nService.translate.mockResolvedValue('Formato de imagem inválido');

      await expect(
        pipe.transform(undefined as any, mockMetadata),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid mime type', async () => {
      const invalidFile = {
        mimetype: 'application/pdf',
        size: 1000,
      } as Express.Multer.File;

      mockI18nService.translate.mockResolvedValue('Formato de imagem inválido');

      await expect(pipe.transform(invalidFile, mockMetadata)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for file size exceeding 5MB', async () => {
      const largeFile = {
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6MB
      } as Express.Multer.File;

      mockI18nService.translate.mockResolvedValue('Tamanho de imagem inválido');

      await expect(pipe.transform(largeFile, mockMetadata)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return file for valid JPEG image', async () => {
      const validFile = {
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
      } as Express.Multer.File;

      const result = await pipe.transform(validFile, mockMetadata);

      expect(result).toEqual(validFile);
    });

    it('should return file for valid PNG image', async () => {
      const validFile = {
        mimetype: 'image/png',
        size: 1 * 1024 * 1024, // 1MB
      } as Express.Multer.File;

      const result = await pipe.transform(validFile, mockMetadata);

      expect(result).toEqual(validFile);
    });

    it('should return file for valid JPG image', async () => {
      const validFile = {
        mimetype: 'image/jpg',
        size: 500 * 1024, // 500KB
      } as Express.Multer.File;

      const result = await pipe.transform(validFile, mockMetadata);

      expect(result).toEqual(validFile);
    });

    it('should accept file at exactly 5MB limit', async () => {
      const validFile = {
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024, // Exactly 5MB
      } as Express.Multer.File;

      const result = await pipe.transform(validFile, mockMetadata);

      expect(result).toEqual(validFile);
    });
  });
});
