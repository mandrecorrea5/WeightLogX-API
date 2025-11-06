import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ApiLocale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const acceptLanguage = request.headers['accept-language'];

    // Parse Accept-Language header
    if (acceptLanguage) {
      const locale = acceptLanguage.split(',')[0].split('-')[0];
      if (locale === 'en') return 'en';
      if (locale === 'pt') return 'pt-BR';
    }

    // Default to pt-BR
    return 'pt-BR';
  },
);

