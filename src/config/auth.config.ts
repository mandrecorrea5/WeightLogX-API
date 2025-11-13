import { registerAs } from '@nestjs/config';

const MAX_EXPIRATION_MINUTES = 5;

export default registerAs('auth', () => {
  const expirationMinutes = process.env.AUTH_VERIFICATION_EXPIRATION_MINUTES
    ? parseInt(process.env.AUTH_VERIFICATION_EXPIRATION_MINUTES, 10)
    : MAX_EXPIRATION_MINUTES;

  // Validar que não excede o máximo permitido de 5 minutos
  const validatedExpirationMinutes = Math.min(
    expirationMinutes,
    MAX_EXPIRATION_MINUTES,
  );

  if (expirationMinutes > MAX_EXPIRATION_MINUTES) {
    console.warn(
      `⚠️  AUTH_VERIFICATION_EXPIRATION_MINUTES (${expirationMinutes}) excede o máximo permitido de ${MAX_EXPIRATION_MINUTES} minutos. Usando ${MAX_EXPIRATION_MINUTES} minutos.`,
    );
  }

  return {
    verification: {
      expirationMinutes: validatedExpirationMinutes,
      maxExpirationMinutes: MAX_EXPIRATION_MINUTES,
      resendLimitPerHour: process.env.AUTH_VERIFICATION_RESEND_LIMIT_PER_HOUR
        ? parseInt(process.env.AUTH_VERIFICATION_RESEND_LIMIT_PER_HOUR, 10)
        : 3,
    },
  debug: {
    returnVerificationCode:
      process.env.AUTH_DEBUG_RETURN_VERIFICATION_CODE === 'true',
  },
  brevo: {
    smtp: {
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
      port: process.env.BREVO_SMTP_PORT
        ? parseInt(process.env.BREVO_SMTP_PORT, 10)
        : 587,
      login: process.env.BREVO_SMTP_LOGIN || '',
      password: process.env.BREVO_SMTP_PASSWORD || '',
    },
    sender: {
      email: process.env.BREVO_FROM_EMAIL || '',
      name: process.env.BREVO_FROM_NAME || 'WeightLogX',
    },
  },
  };
});
