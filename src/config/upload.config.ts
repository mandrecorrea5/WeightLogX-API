import { registerAs } from '@nestjs/config';

export default registerAs('upload', () => ({
  maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE, 10) : 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  profileImagePath: process.env.PROFILE_IMAGE_PATH || './uploads/profiles',
  profileImageSize: {
    width: 512,
    height: 512,
  },
}));

