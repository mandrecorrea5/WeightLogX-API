import { registerAs } from '@nestjs/config';

export default registerAs('health', () => ({
  enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
}));

