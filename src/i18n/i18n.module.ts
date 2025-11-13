import { Module } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  QueryResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'pt-BR',
      loaderOptions: {
        path: path.join(process.cwd(), 'dist/i18n/locales/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['locale', 'lang'] },
        AcceptLanguageResolver,
      ],
    }),
  ],
})
export class I18nModule {}
