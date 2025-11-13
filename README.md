# WeightLogX API

API REST para gerenciamento de treinos de levantamento de peso olímpico, desenvolvida com NestJS.

## 📚 Documentação

- **[API Integration Guide](API_INTEGRATION.md)** - Guia completo de integração para o frontend
- **[Deployment Guide](DEPLOYMENT.md)** - Guia de deploy em produção
- **[Ranking API Documentation](RANKING_API_DOCUMENTATION.md)** - Documentação da API de Ranking
- **[Workout Update API Documentation](WORKOUT_UPDATE_API_DOCUMENTATION.md)** - Documentação da atualização de treinos
- **[Grafana Dashboard Guide](GRAFANA_VERIFICATION_CODES_DASHBOARD.md)** - Guia do dashboard de códigos de verificação

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (ou use o Docker Compose)

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Subir os serviços com Docker Compose
docker compose up -d

# Executar migrações
npm run migration:run

# Iniciar em desenvolvimento
npm run start:dev
```

### Testes

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:cov

# Executar testes e2e
npm run test:e2e
```

## 📊 Cobertura de Testes

- **Statements:** 40.54%
- **Branches:** 36.43%
- **Functions:** 33.33%
- **Lines:** 39.96%
- **Total de testes:** 154 (todos passando)

## 🏗️ Stack Tecnológica

- **Framework:** NestJS
- **Database:** PostgreSQL com TypeORM
- **Autenticação:** JWT
- **Validação:** class-validator, class-transformer
- **Documentação:** Swagger/OpenAPI
- **Observabilidade:** Prometheus, Grafana, Loki
- **Testes:** Jest

## 📝 Principais Funcionalidades

- ✅ Autenticação e autorização (JWT)
- ✅ Verificação de registro e recuperação de senha por código
- ✅ Gerenciamento de treinos e exercícios
- ✅ Cálculo automático de Personal Records (PRs)
- ✅ Relatórios e métricas de treino
- ✅ Ranking por centro de treinamento
- ✅ Notificações em tempo real (WebSocket)
- ✅ Upload de imagens de perfil
- ✅ Gerenciamento de centros de treinamento e treinadores

## 🔧 Scripts Disponíveis

```bash
npm run build          # Compilar para produção
npm run start          # Iniciar aplicação
npm run start:dev      # Iniciar em modo desenvolvimento
npm run start:debug    # Iniciar em modo debug
npm run start:prod     # Iniciar em produção
npm run lint           # Executar linter
npm run test           # Executar testes unitários
npm run test:cov       # Executar testes com coverage
npm run test:e2e       # Executar testes end-to-end
npm run migration:run  # Executar migrações
npm run migration:revert # Reverter última migração
```

## 📦 Estrutura do Projeto

```
src/
├── modules/           # Módulos da aplicação
│   ├── auth/         # Autenticação e verificação
│   ├── workouts/     # Treinos
│   ├── exercises/    # Exercícios
│   ├── prs/          # Personal Records
│   ├── reports/      # Relatórios
│   ├── ranking/      # Ranking
│   ├── user/         # Usuários
│   ├── trainers/     # Treinadores
│   └── training-centers/ # Centros de treinamento
├── common/           # Código compartilhado
├── config/           # Configurações
├── database/         # Entidades e migrações
└── i18n/             # Internacionalização
```

## 🔐 Variáveis de Ambiente

Principais variáveis de ambiente (veja `.env.example` para lista completa):

- `DATABASE_*` - Configurações do banco de dados
- `JWT_SECRET` - Segredo para assinatura de tokens JWT
- `AUTH_VERIFICATION_EXPIRATION_MINUTES` - Expiração de códigos (máx 5min)
- `AUTH_VERIFICATION_RESEND_LIMIT_PER_HOUR` - Limite de reenvios por hora
- `CORS_ORIGIN` - Origem permitida para CORS
- `API_PORT` - Porta da API

## 📄 Licença

Este projeto é privado e não possui licença pública.

## 👥 Contribuindo

Este é um projeto privado. Para contribuições, entre em contato com a equipe responsável.

