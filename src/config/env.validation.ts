/**
 * Validação de variáveis de ambiente obrigatórias
 * Executado na inicialização da aplicação
 */

export function validateEnvironment(): void {
  const requiredVars: string[] = [];
  const errors: string[] = [];

  // Variáveis obrigatórias em produção
  if (process.env.NODE_ENV === 'production') {
    requiredVars.push(
      'DATABASE_HOST',
      'DATABASE_USER',
      'DATABASE_PASSWORD',
      'DATABASE_NAME',
      'JWT_SECRET',
      'CORS_ORIGIN',
    );
  }

  // Verificar variáveis obrigatórias
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Validações específicas
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push(
        'JWT_SECRET must be at least 32 characters long in production',
      );
    }

    if (process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN) {
      errors.push(
        'CORS_ORIGIN must be specified and cannot be "*" in production',
      );
    }

    if (
      process.env.DATABASE_PASSWORD === 'password_segura' ||
      !process.env.DATABASE_PASSWORD
    ) {
      errors.push(
        'DATABASE_PASSWORD must be changed from default value in production',
      );
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error(
      '\nPlease fix the environment variables and restart the application.',
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Environment variables validated successfully');
  }
}
