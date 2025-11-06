# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar arquivos de dependências para build
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2.5: Development (para hot reload com volumes mapeados)
FROM node:20-alpine AS development

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar todas as dependências (incluindo devDependencies para hot reload)
RUN npm ci && npm cache clean --force

# Instalar su-exec para mudar de usuário (mais leve que su)
RUN apk add --no-cache su-exec && \
    which su-exec || echo "su-exec installed"

# Criar diretório dist com permissões corretas para desenvolvimento
RUN mkdir -p /app/dist/i18n/locales && chown -R nestjs:nodejs /app/dist

# Mudar ownership para usuário não-root
RUN chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Comando padrão para desenvolvimento (será sobrescrito pelo docker-compose)
CMD ["npm", "run", "start:dev"]

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado do stage build
COPY --from=build /app/dist ./dist

# Copiar arquivos de configuração necessários
COPY --from=build /app/node_modules/i18n ./node_modules/i18n
COPY --from=build /app/src/i18n ./src/i18n

# Mudar ownership para usuário não-root
RUN chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar aplicação
CMD ["node", "dist/main.js"]

