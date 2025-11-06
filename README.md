<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**WeightLogX API** - Backend API para aplicativo de registro e acompanhamento de treinos de Levantamento de Peso Olímpico.

Desenvolvido com [NestJS](https://github.com/nestjs/nest) seguindo os princípios de **Clean Architecture**, **SOLID** e as melhores práticas de desenvolvimento.

### Características

- ✅ **Clean Architecture**: Separação clara de responsabilidades
- ✅ **SOLID Principles**: Código manutenível e extensível
- ✅ **JWT Authentication**: Autenticação segura com tokens
- ✅ **TypeORM**: ORM para PostgreSQL
- ✅ **i18n**: Suporte a múltiplos idiomas (PT-BR e EN)
- ✅ **Validação**: Validação robusta de dados com class-validator
- ✅ **Rate Limiting**: Proteção contra abuso
- ✅ **Exception Handling**: Tratamento centralizado de erros
- ✅ **Upload de Arquivos**: Upload e processamento de imagens

## 📋 Pré-requisitos

- Node.js >= 20.11
- PostgreSQL 14+
- Docker e Docker Compose (opcional)

## 🚀 Início Rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Application
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user_weightlogx
DATABASE_PASSWORD=password_segura
DATABASE_NAME=weightlogx_db

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 3. Iniciar banco de dados

```bash
# Com Docker Compose
docker-compose up -d db

# Ou use seu PostgreSQL local
```

### 4. Executar migrations (quando criadas)

```bash
npm run typeorm migration:run
```

### 5. Iniciar aplicação

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A aplicação estará disponível em `http://localhost:3000/api`

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## 📚 Documentação

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Documentação completa da arquitetura
- [**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md) - Documentação da API
- [**IMPLEMENTATION_SUMMARY.md**](./IMPLEMENTATION_SUMMARY.md) - Resumo da implementação

## 🏗️ Estrutura do Projeto

```
src/
├── common/           # Código compartilhado (decorators, guards, filters, etc.)
├── config/           # Configurações (database, jwt, upload)
├── database/         # Entidades, migrations, seeds
├── i18n/             # Internacionalização (PT-BR, EN)
└── modules/          # Módulos de domínio (auth, user, workouts, prs, reports)
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes em modo watch
npm run test:watch

# Coverage
npm run test:cov

# Testes e2e
npm run test:e2e
```

## 📦 Scripts Disponíveis

```bash
npm run build          # Compilar para produção
npm run format         # Formatar código com Prettier
npm run start          # Iniciar em modo produção
npm run start:dev      # Iniciar em modo desenvolvimento (watch)
npm run start:debug    # Iniciar em modo debug
npm run lint           # Executar ESLint
```

## 🔧 Tecnologias

- **Framework**: NestJS 11
- **Linguagem**: TypeScript
- **Database**: PostgreSQL com TypeORM
- **Autenticação**: JWT com Passport
- **Validação**: class-validator, class-transformer
- **i18n**: nestjs-i18n
- **Upload**: Multer + Sharp

## 📝 Licença

Este projeto é privado e não possui licença aberta.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
