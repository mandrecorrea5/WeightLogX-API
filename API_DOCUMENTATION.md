# WeightLogX API – Documentação Técnica

## Sumário
- [Visão Geral](#visão-geral)
- [Arquitetura do Projeto](#arquitetura-do-projeto)
- [Segurança e Observabilidade](#segurança-e-observabilidade)
- [Módulos e Endpoints](#módulos-e-endpoints)
  - [Auth](#auth-apiauth)
  - [User](#user-apiuser)
  - [Workouts](#workouts-apiworkouts)
  - [Personal Records (PRs)](#personal-records-prs-apiprs)
  - [Reports](#reports-apireports)
  - [Exercises](#exercises-apiexercises)
  - [Training Centers](#training-centers-apitraining-centers)
  - [Trainers](#trainers-apitrainers)
  - [Notifications](#notifications-apinotifications)
  - [Device Tokens](#device-tokens-apinotificationsdevice-tokens)
  - [Metrics](#metrics-apimetrics)
  - [Health](#health-apihealth)
  - [Raiz](#rota-raiz-api)
- [Modelagem de Dados](#modelagem-de-dados)
- [Configuração e Deploy](#configuração-e-deploy)
- [Testes e Próximos Passos](#testes-e-próximos-passos)

## Visão Geral
Aplicação backend construída com NestJS 11 e TypeORM, focada em registro e acompanhamento de treinos de levantamento olímpico. Possui recursos de:
- Autenticação e autorização via JWT com controle de roles.
- Internacionalização (`nestjs-i18n`) com suporte a `pt-BR` e `en`.
- Documentação interativa via Swagger (`/api/docs`, controlado por `ENABLE_SWAGGER`).
- Observabilidade com métricas Prometheus em `/api/metrics` e dashboards Grafana pré-configurados.

## Arquitetura do Projeto
```
src/
├─ app.module.ts            # Composição principal dos módulos
├─ main.ts                  # Bootstrap: validação, cors, swagger, métricas
├─ common/                  # Decorators, guards, filtros, interceptors, health
├─ config/                  # Carregamento de env, database, jwt, upload, tracing
├─ database/                # Configuração TypeORM, entidades compartilhadas, migrations
├─ i18n/                    # Configuração do módulo e arquivos de tradução
├─ modules/                 # Domínios: auth, user, workouts, prs, reports, etc.
└─ test/                    # Testes end-to-end (auth, user, workouts, reports, prs)
```
Principais módulos importados em `AppModule`:
- `AuthModule`, `UserModule`, `WorkoutsModule`, `PrsModule`, `ReportsModule`, `ExercisesModule`, `TrainersModule`, `TrainingCentersModule`, `NotificationsModule`, `MetricsModule`, `HealthModule`.
- `ConfigModule`, `DatabaseModule`, `I18nModule`, `ThrottlerModule` (rate limiting).

## Segurança e Observabilidade
- **Autenticação**: Guard global `JwtAuthGuard` (rota exenta com `@Public()`).
- **Autorização**: `RolesGuard` aplicado aos endpoints com `@Roles()`, restringindo ações administrativas.
- **Rate Limiting**: `@nestjs/throttler` (100 req/min em dev, 60 em prod por padrão).
- **CORS**: Configurável via `CORS_ORIGIN`; em dev libera localhost (3000, 3001, 5173).
- **Helmet**: Proteções de cabeçalhos ativadas, com exceções para suporte ao Swagger.
- **Observabilidade**:
  - Interceptor `MetricsInterceptor` mede latência, tamanho de payload, status e erros.
  - Métricas expostas em `/api/metrics` e dashboards Grafana em `grafana/dashboards/`.
  - Preparado para OpenTelemetry em `instrumentation.ts` (comentado, basta instalar dependências e habilitar).
- **Health Check**: `/api/health`, `/api/health/liveness`, `/api/health/readiness` usando `@nestjs/terminus`.

## Módulos e Endpoints
Convenções:
- Todas as rotas são prefixadas por `/api` (definido em `main.ts`).
- Autenticação: `JWT` indica necessidade de bearer token válido. `Público` significa rota liberada.
- Todas as respostas seguem DTOs documentadas no Swagger.

### Auth (`/api/auth`)
| Método | Caminho            | Autenticação | DTO de Entrada         | DTO de Saída            | Descrição |
|--------|--------------------|--------------|------------------------|-------------------------|-----------|
| POST   | `/register`        | Público      | `RegisterDto`          | `RegisterResponseDto`   | Cria novo usuário com role padrão `atleta`.
| POST   | `/login`           | Público      | `LoginDto`             | `LoginResponseDto`      | Autentica usuário e retorna `access_token`.
| POST   | `/forgot-password` | Público      | `ForgotPasswordDto`    | `{ message, token? }`   | Envia token de recuperação (retornado na resposta em dev).
| POST   | `/reset-password`  | Público      | `ResetPasswordDto`     | `{ message }`           | Troca senha usando token válido.

### User (`/api/user`)
| Método | Caminho                           | Autenticação | DTO de Entrada                | DTO de Saída              | Descrição |
|--------|-----------------------------------|--------------|-------------------------------|---------------------------|-----------|
| GET    | `/profile`                        | JWT          | —                             | `ProfileResponseDto`      | Dados do usuário autenticado.
| PUT    | `/profile`                        | JWT          | `UpdateProfileDto`            | `ProfileResponseDto`      | Atualiza perfil (nome, telefone, data nascimento, centro).
| PUT    | `/password`                       | JWT          | `ChangePasswordDto`           | `{ message }`             | Altera senha mediante senha atual.
| POST   | `/profile-image`                  | JWT          | multipart (`image`)           | `UploadImageResponseDto`  | Upload de foto de perfil (redimensionada via Sharp).
| DELETE | `/profile-image`                  | JWT          | —                             | `{ message }`             | Remove imagem de perfil.
| GET    | `/permissions`                    | JWT          | —                             | `PermissionsResponseDto`  | Lista permissões derivadas da role.
| PUT    | `/users/:userId/role`             | JWT + `admin`| `UpdateUserRoleDto`           | `ProfileResponseDto`      | Altera role de qualquer usuário.
| PUT    | `/users/:userId/trainer`          | JWT + `admin`| `{ trainerId: string }`       | `ProfileResponseDto`      | Vincula atleta a um treinador.
| DELETE | `/users/:userId/trainer`          | JWT + `admin`| —                             | `ProfileResponseDto`      | Remove vínculo de treinador.

### Workouts (`/api/workouts`)
| Método | Caminho                    | Autenticação | DTO de Entrada        | DTO de Saída                    | Descrição |
|--------|----------------------------|--------------|-----------------------|---------------------------------|-----------|
| POST   | `/`                        | JWT          | `CreateWorkoutDto`    | `CreateWorkoutResponseDto`      | Cria treino com exercícios e séries.
| GET    | `/`                        | JWT          | Query: `page`, `limit`, `startDate`, `endDate` | `WorkoutListResponseDto` | Lista treinos com paginação.
| GET    | `/:id`                     | JWT          | —                     | `WorkoutDetailsResponseDto`     | Detalhes completos do treino.
| PUT    | `/:id`                     | JWT          | `CreateWorkoutDto`    | `CreateWorkoutResponseDto`      | Atualiza treino existente.
| PUT    | `/:id/send-to-trainer`     | JWT          | —                     | `SendToTrainerResponseDto`      | Marca treino como enviado ao treinador.
| DELETE | `/:id`                     | JWT          | —                     | —                               | Remove treino e PRs relacionados.

### Personal Records (PRs) (`/api/prs`)
| Método | Caminho | Autenticação | DTO de Entrada | DTO de Saída           | Descrição |
|--------|---------|--------------|----------------|------------------------|-----------|
| GET    | `/`     | JWT          | Query: `exerciseId`, `recent` | `PrListResponseDto` | Lista PRs do usuário, com filtro por exercício e PRs recentes (últimos 7 dias).

### Reports (`/api/reports`)
| Método | Caminho | Autenticação | DTO de Entrada        | DTO de Saída           | Descrição |
|--------|---------|--------------|-----------------------|------------------------|-----------|
| GET    | `/`     | JWT          | `ReportsQueryDto` (`type` = `geral|exercicio|carga`, `timeFilter` = `7d|30d|3m|1y`, `exerciseId` obrigatório quando `type=exercicio`) | `ReportsResponseDto` | Gera métricas de evolução (variação, volume total, PRs recentes, dados para gráfico mensal).

### Exercises (`/api/exercises`)
| Método | Caminho  | Autenticação | DTO de Entrada          | DTO de Saída             | Descrição |
|--------|----------|--------------|-------------------------|--------------------------|-----------|
| POST   | `/`      | JWT          | `CreateExerciseDto`     | `ExerciseResponseDto`    | Cria exercício bilíngue.
| GET    | `/`      | JWT          | —                       | `ExerciseListResponseDto`| Lista exercícios ordenados.
| GET    | `/:id`   | JWT          | —                       | `ExerciseResponseDto`    | Recupera exercício específico.
| PUT    | `/:id`   | JWT          | `UpdateExerciseDto`     | `ExerciseResponseDto`    | Atualiza totalmente o exercício.
| PATCH  | `/:id`   | JWT          | `UpdateExerciseDto`     | `ExerciseResponseDto`    | Atualização parcial.
| DELETE | `/:id`   | JWT          | —                       | `{ message }`            | Remove exercício (sem verificação de uso ainda).

### Training Centers (`/api/training-centers`)
| Método | Caminho  | Autenticação | DTO de Entrada              | DTO de Saída                  | Descrição |
|--------|----------|--------------|-----------------------------|-------------------------------|-----------|
| POST   | `/`      | JWT          | `CreateTrainingCenterDto`   | `TrainingCenterResponseDto`   | Cria centro de treinamento (nome, sigla, treinador, endereço).
| GET    | `/`      | JWT          | Query: `search`             | `TrainingCenterListResponseDto` | Lista centros, filtrando por nome/cidade/treinador.
| GET    | `/:id`   | JWT          | —                           | `TrainingCenterResponseDto`   | Detalhes de um centro.
| PUT    | `/:id`   | JWT          | `UpdateTrainingCenterDto`   | `TrainingCenterResponseDto`   | Atualiza dados gerais e treinador responsável.
| DELETE | `/:id`   | JWT          | —                           | `{ message }`                 | Remove centro (planeja validar vínculos futuros).

### Trainers (`/api/trainers`)
| Método | Caminho | Autenticação | DTO de Entrada     | DTO de Saída             | Descrição |
|--------|---------|--------------|--------------------|--------------------------|-----------|
| POST   | `/`     | JWT          | `CreateTrainerDto` | `TrainerResponseDto`     | Cadastra treinador (nome único).
| GET    | `/`     | JWT          | Query: `search`    | `TrainerListResponseDto` | Lista treinadores, com filtro por nome.

### Notifications (`/api/notifications`)
| Método | Caminho           | Autenticação | DTO de Entrada | DTO de Saída | Descrição |
|--------|-------------------|--------------|----------------|-------------|-----------|
| GET    | `/`               | JWT          | Query: `page`, `limit`, `unreadOnly` | `{ notifications, pagination, unreadCount }` | Lista notificações com paginação.
| PATCH  | `/:id/read`       | JWT          | —              | `{ message }` | Marca notificação como lida.
| PATCH  | `/read-all`       | JWT          | —              | `{ message, updatedCount }` | Marca todas como lidas.
| GET    | `/settings`       | JWT          | —              | `NotificationSettingsEntity` | Preferências de notificação.
| PATCH  | `/settings`       | JWT          | `Partial<NotificationSettingsEntity>` | `NotificationSettingsEntity` | Atualiza preferências (ex.: lembretes, horário padrão, push).

### Device Tokens (`/api/notifications/device-tokens`)
| Método | Caminho              | Autenticação | DTO de Entrada                                    | DTO de Saída        | Descrição |
|--------|----------------------|--------------|---------------------------------------------------|---------------------|-----------|
| POST   | `/`                  | JWT          | `{ deviceToken, platform, deviceId? }`            | `{ message }`       | Registra token de push (ios/android). Ignora duplicatas.
| DELETE | `/:deviceToken`      | JWT          | —                                                 | `{ message }`       | Remove token associado ao usuário.

### Metrics (`/api/metrics`)
| Método | Caminho     | Autenticação | Descrição |
|--------|-------------|--------------|-----------|
| GET    | `/metrics`  | Público      | Exporta métricas Prometheus coletadas pelo `MetricsService`.

### Health (`/api/health`)
| Método | Caminho            | Autenticação | Descrição |
|--------|--------------------|--------------|-----------|
| GET    | `/health`          | Público      | Health check geral (banco, memória, disco).
| GET    | `/health/liveness` | Público      | Confirma se a aplicação está viva.
| GET    | `/health/readiness`| Público      | Verifica dependências críticas (Postgres).

### Rota Raiz (`/api`)
| Método | Caminho | Autenticação | Descrição |
|--------|---------|--------------|-----------|
| GET    | `/`     | Público      | Mensagem de boas-vindas (`AppService`).

## Modelagem de Dados
Principais entidades (TypeORM):
- `users`: armazena usuário (campos para email, nome, hash de senha, role, centro, treinador, imagem), relacionando com `roles`, `training_centers` e auto-relacionamento para treinador.
- `roles`: define papéis (`atleta`, `treinador`, `admin`).
- `workouts`, `workout_exercises`, `series_configs`: estrutura hierárquica de treinos, exercícios e parâmetros de séries.
- `personal_records`: PRs vinculados a usuário, exercício e treino de origem.
- `exercises`: nomes/abreviações em PT e EN.
- `training_centers`: centros com treinador responsável, endereço e sigla única.
- `trainers`: técnicos cadastrados.
- `notifications`, `notification_settings`, `device_tokens`: gestão de notificações, preferências e tokens de dispositivos.

## Configuração e Deploy
- **Variáveis de ambiente**: validadas em `config/env.validation.ts`. Em produção, exige `DATABASE_*`, `JWT_SECRET` (>=32 chars) e `CORS_ORIGIN` definido.
- **Arquivos de Configuração**:
  - `config/database.config.ts`: conexão Postgres, `synchronize=false`, logging controlado por `DB_LOGGING`.
  - `config/jwt.config.ts`: secret, expiração padrão `7d`, refresh tokens.
  - `config/upload.config.ts`: diretório e limites de upload (`./uploads/profiles`, 5MB).
  - `config/tracing.config.ts`: opções de OpenTelemetry (endpoint OTLP, service name/version).
- **Uploads**: arquivos disponíveis em `/uploads/profiles`, servidos estáticamente (configuração em `main.ts`).
- **Docker**: `docker-compose.yml` e `docker-compose.dev.yml` para ambiente completo, além de stack de observabilidade (Grafana/Loki/Promtail/Prometheus).
- **Scripts NPM**: `start:dev`, `build`, `test`, `test:e2e`, `migration:*` (via TypeORM CLI).

## Testes e Próximos Passos
- **Testes**: rodar `npm run test:e2e` para validar fluxos (auth, user, workouts, reports, prs). Cobertura consolidada em `coverage/`.
- **Monitoramento**: configurar Prometheus/Grafana usando dashboards fornecidos. Ajustar alertas conforme métricas expostas.
- **Documentação Interativa**: habilitar `ENABLE_SWAGGER=true` para expor `/api/docs` em ambientes controlados.
- **Tracing**: opcionalmente ativar OpenTelemetry conforme instruções em `instrumentation.ts`.

## Diagramas Mermaid

Os diagramas foram movidos para arquivos dedicados em `docs/diagrams/`:

- [Visão de Alto Nível](docs/diagrams/architecture-high-level.mermaid)
- [Fluxo de Requisições](docs/diagrams/request-flow.mermaid)
- [Fluxo Detalhado de Endpoints e Serviços](docs/diagrams/request-flow-detail.mermaid)
