# 🔒 Guia de Segurança - WeightLogX API

Este documento descreve as medidas de segurança implementadas na API e as práticas recomendadas para manter a aplicação segura.

## ✅ Medidas de Segurança Implementadas

### 1. **Autenticação e Autorização**

- ✅ **JWT Authentication**: Todos os endpoints (exceto públicos) requerem token JWT válido
- ✅ **Role-Based Access Control (RBAC)**: Sistema de roles (atleta, treinador, admin)
- ✅ **Password Hashing**: Senhas hashadas com bcrypt (10 rounds)
- ✅ **Password Reset**: Tokens seguros com expiração de 24 horas

### 2. **Proteção de Dados**

- ✅ **Query Logging Desabilitado**: Queries SQL não são logadas em produção
- ✅ **Validação de Entrada**: Validação com `class-validator` e `ValidationPipe`
- ✅ **SQL Injection Protection**: TypeORM usa prepared statements
- ✅ **XSS Protection**: Helmet configura headers de segurança
- ✅ **Error Messages**: Mensagens de erro não expõem informações sensíveis em produção

### 3. **Headers de Segurança (Helmet)**

- ✅ **Content Security Policy**: Habilitado em produção
- ✅ **X-Frame-Options**: Previne clickjacking
- ✅ **X-Content-Type-Options**: Previne MIME sniffing
- ✅ **Strict-Transport-Security**: HTTPS enforcement (quando configurado)

### 4. **CORS (Cross-Origin Resource Sharing)**

- ✅ **Origins Específicos**: Não permite wildcard (`*`) em produção
- ✅ **Headers Permitidos**: Apenas `Content-Type`, `Authorization`, `Accept-Language`
- ✅ **Methods Permitidos**: Apenas métodos necessários (GET, POST, PUT, PATCH, DELETE, OPTIONS)

### 5. **Rate Limiting**

- ✅ **Throttler**: 10 requisições por minuto por IP (configurável)
- ✅ **Proteção contra DDoS**: Limita requisições simultâneas

### 6. **Configuração de Banco de Dados**

- ✅ **Synchronize Desabilitado**: Nunca usa `synchronize: true` em produção
- ✅ **SSL/TLS**: Configurável para conexões seguras
- ✅ **Credenciais**: Requer variáveis de ambiente em produção (sem defaults)

### 7. **Exposição de Informações**

- ✅ **Swagger Protegido**: Desabilitado em produção por padrão
- ✅ **Console Logs**: Apenas em desenvolvimento
- ✅ **Stack Traces**: Não expostos em produção
- ✅ **Query Logging**: Desabilitado por padrão (requer `DB_LOGGING=true`)

## 🔧 Configuração de Variáveis de Ambiente

### Variáveis Obrigatórias (Produção)

```env
# Database
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=weightlogx_db
DATABASE_SSL=true

# Application
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# CORS (específico, não use *)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Variáveis Opcionais

```env
# Database Logging (apenas desenvolvimento)
DB_LOGGING=true  # Apenas para debug - NUNCA em produção

# Swagger (apenas desenvolvimento)
ENABLE_SWAGGER=false  # Desabilitado em produção por padrão

# Tracing
ENABLE_TRACING=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

## ⚠️ Problemas de Segurança Corrigidos

### 1. **Query Logging em Produção**
**Problema**: Queries SQL eram logadas no terminal, expondo dados sensíveis.

**Solução**: 
- Logging desabilitado por padrão
- Requer `DB_LOGGING=true` explicitamente
- Apenas funciona em `NODE_ENV=development`

### 2. **CORS com Wildcard**
**Problema**: `CORS_ORIGIN=*` permitia requisições de qualquer origem.

**Solução**:
- CORS requer origens específicas em produção
- Sem `CORS_ORIGIN` configurado, nenhuma origem é permitida em produção
- Development usa origens locais padrão

### 3. **Falta de Headers de Segurança**
**Problema**: API não tinha headers de segurança HTTP.

**Solução**: Helmet implementado com configurações adequadas.

### 4. **Swagger Exposto em Produção**
**Problema**: Swagger UI acessível em produção, expondo estrutura da API.

**Solução**: 
- Swagger desabilitado por padrão em produção
- Requer `ENABLE_SWAGGER=true` explicitamente

### 5. **Valores Padrão Hardcoded**
**Problema**: Senhas e usuários com valores padrão inseguros.

**Solução**: 
- Requer variáveis de ambiente em produção
- Sem defaults em produção

### 6. **SSL com `rejectUnauthorized: false`**
**Problema**: SSL não verificava certificados em produção.

**Solução**: 
- `rejectUnauthorized: true` em produção
- SSL configurável via `DATABASE_SSL`

### 7. **Console.logs de Debug**
**Problema**: Logs de debug expostos em produção.

**Solução**: Console.logs apenas em desenvolvimento.

### 8. **Synchronize Habilitado**
**Problema**: `synchronize: true` poderia causar perda de dados.

**Solução**: Sempre desabilitado, usando migrations.

## 🛡️ Boas Práticas de Segurança

### 1. **Senhas**
- ✅ Sempre use senhas fortes (mínimo 8 caracteres, maiúsculas, minúsculas, números)
- ✅ Nunca armazene senhas em texto plano
- ✅ Use bcrypt com salt rounds adequados (10+)

### 2. **JWT Secrets**
- ✅ Use secrets longos e aleatórios (mínimo 32 caracteres)
- ✅ Gere com: `openssl rand -base64 32`
- ✅ Nunca commite secrets no código

### 3. **Variáveis de Ambiente**
- ✅ Use `.env` para desenvolvimento
- ✅ Use secrets management em produção (AWS Secrets Manager, Azure Key Vault, etc.)
- ✅ Nunca commite `.env` no Git

### 4. **Logs**
- ✅ Não logue dados sensíveis (senhas, tokens, dados pessoais)
- ✅ Use log levels apropriados
- ✅ Em produção, use serviços de logging centralizados

### 5. **Error Handling**
- ✅ Não exponha stack traces em produção
- ✅ Mensagens de erro genéricas para usuários
- ✅ Logs detalhados apenas para administradores

### 6. **API Documentation**
- ✅ Desabilite Swagger em produção
- ✅ Se necessário, proteja com autenticação

### 7. **Database**
- ✅ Use migrations, nunca `synchronize`
- ✅ Backups regulares
- ✅ Use SSL/TLS para conexões
- ✅ Credenciais fortes
- ✅ Princípio do menor privilégio

### 8. **Uploads**
- ✅ Valide tipos de arquivo
- ✅ Limite tamanho de arquivo
- ✅ Sanitize nomes de arquivo
- ✅ Armazene fora do diretório web root se possível

## 📋 Checklist de Segurança para Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `NODE_ENV=production` definido
- [ ] `JWT_SECRET` seguro e único
- [ ] `CORS_ORIGIN` com origens específicas (não `*`)
- [ ] `DATABASE_SSL=true` em produção
- [ ] `DB_LOGGING` não definido ou `false`
- [ ] `ENABLE_SWAGGER=false` ou não definido
- [ ] Swagger desabilitado ou protegido
- [ ] Helmet configurado e ativo
- [ ] Rate limiting configurado
- [ ] Backups de banco de dados configurados
- [ ] Logs não expõem dados sensíveis
- [ ] SSL/TLS configurado no servidor web (Nginx, etc.)
- [ ] Firewall configurado
- [ ] Dependências atualizadas (`npm audit`)
- [ ] Testes de segurança executados

## 🔍 Auditoria de Segurança

### Verificar Vulnerabilidades em Dependências

```bash
npm audit
npm audit fix
```

### Verificar Configuração

```bash
# Verificar se NODE_ENV está correto
echo $NODE_ENV

# Verificar se variáveis sensíveis não estão expostas
env | grep -E "(SECRET|PASSWORD|KEY)" | grep -v "^#"
```

### Testar CORS

```bash
# Deve falhar se CORS não permitir origem
curl -H "Origin: https://malicious.com" -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://your-api.com/api/auth/login
```

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [Helmet Documentation](https://helmetjs.github.io/)
- [TypeORM Security](https://typeorm.io/security)

## 🚨 Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, por favor:

1. **NÃO** reporte via issues públicos
2. Entre em contato diretamente com a equipe de desenvolvimento
3. Forneça detalhes suficientes para reproduzir o problema
4. Aguarde confirmação antes de divulgar publicamente

## 📝 Histórico de Correções

- **2025-11-06**: Correção de query logging, CORS, Helmet, Swagger, e valores padrão
- **2025-11-06**: Implementação de rate limiting e validação de entrada
- **2025-11-06**: Melhorias em error handling e logging

