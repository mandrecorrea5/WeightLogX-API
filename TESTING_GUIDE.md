# Guia de Testes - WeightLogX API

## 📋 Pré-requisitos

1. Node.js >= 20.11 instalado
2. Docker e Docker Compose instalados
3. PostgreSQL 14+ (ou via Docker)

---

## 🚀 Configuração Inicial

### 1. Criar arquivo `.env`

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
JWT_SECRET=your-super-secret-key-minimum-32-characters-for-production
JWT_EXPIRES_IN=7d
```

### 2. Iniciar Banco de Dados

```bash
# Iniciar PostgreSQL via Docker Compose
docker-compose up -d db

# Verificar se está rodando
docker-compose ps

# Ver logs do banco
docker-compose logs db
```

### 3. Instalar Dependências

```bash
npm install
```

---

## 🧪 Testes Manuais

### 1. Iniciar a Aplicação

```bash
# Modo desenvolvimento (com watch)
npm run start:dev

# Ou modo produção
npm run build
npm run start:prod
```

A aplicação estará disponível em: `http://localhost:3000/api`

### 2. Testar Endpoints

#### Teste 1: Health Check

```bash
curl http://localhost:3000/api
```

**Resposta esperada**: Status 200

---

#### Teste 2: Registro de Usuário (PT-BR)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }' | jq
```

**Resposta esperada**:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "João Silva",
      "email": "joao@example.com",
      "birthDate": null,
      "phone": null,
      "trainingCenter": null,
      "profileImage": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Conta criada com sucesso"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Cenários de Erro**:

- Email já cadastrado:
```bash
# Tentar registrar o mesmo email novamente
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }' | jq
```

**Resposta esperada**: Status 409
```json
{
  "statusCode": 409,
  "message": "Email já cadastrado",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/api/auth/register"
}
```

- Senhas não coincidem:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva",
    "email": "joao2@example.com",
    "password": "senha123456",
    "confirmPassword": "senhaDiferente"
  }' | jq
```

**Resposta esperada**: Status 400

- Dados inválidos:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jo",
    "email": "email-invalido",
    "password": "123",
    "confirmPassword": "123"
  }' | jq
```

**Resposta esperada**: Status 400 com detalhes de validação

---

#### Teste 3: Registro de Usuário (EN)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123456",
    "confirmPassword": "password123456"
  }' | jq
```

**Resposta esperada**: Mensagem em inglês
```json
{
  "message": "Account created successfully"
}
```

---

#### Teste 4: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123456"
  }' | jq
```

**Resposta esperada**: Status 200
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "João Silva",
      "email": "joao@example.com",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Cenários de Erro**:

- Credenciais inválidas:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "email": "joao@example.com",
    "password": "senhaErrada"
  }' | jq
```

**Resposta esperada**: Status 401
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/api/auth/login"
}
```

- Email não encontrado:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "naoexiste@example.com",
    "password": "senha123456"
  }' | jq
```

**Resposta esperada**: Status 401

---

#### Teste 5: Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "email": "joao@example.com"
  }' | jq
```

**Resposta esperada**: Status 200
```json
{
  "data": {
    "message": "Link de recuperação enviado para o email"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

#### Teste 6: Reset Password

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "token": "reset-token-here",
    "newPassword": "novaSenha123456",
    "confirmPassword": "novaSenha123456"
  }' | jq
```

**Nota**: Este endpoint ainda precisa implementar validação de token real.

---

## 🧪 Testes Automatizados

### Testes Unitários

```bash
# Executar todos os testes
npm run test

# Modo watch
npm run test:watch

# Com coverage
npm run test:cov
```

### Testes E2E

```bash
# Executar testes e2e
npm run test:e2e
```

---

## 📝 Scripts de Teste com curl

Crie um arquivo `test-api.sh` na raiz do projeto:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "=== Teste 1: Health Check ==="
curl -s $BASE_URL | jq

echo -e "\n=== Teste 2: Registro (PT-BR) ==="
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "Teste Usuario",
    "email": "teste@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }' | jq

echo -e "\n=== Teste 3: Login ==="
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123456"
  }' | jq -r '.data.token')

echo "Token obtido: $TOKEN"

echo -e "\n=== Teste 4: Endpoint protegido (com token) ==="
# Exemplo quando tivermos endpoints protegidos
curl -s -X GET $BASE_URL/user/profile \
  -H "Authorization: Bearer $TOKEN" | jq
```

Tornar o script executável:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔍 Usando Postman/Insomnia

### Collection Postman

1. **Variável de ambiente**: `base_url = http://localhost:3000/api`

2. **Requests**:
   - `POST {{base_url}}/auth/register`
   - `POST {{base_url}}/auth/login`
   - `POST {{base_url}}/auth/forgot-password`
   - `POST {{base_url}}/auth/reset-password`

3. **Headers padrão**:
   - `Content-Type: application/json`
   - `Accept-Language: pt-BR` (ou `en`)

4. **Variável automática de token**:
   - No request de login, adicione um script de teste:
   ```javascript
   if (pm.response.code === 200) {
     const jsonData = pm.response.json();
     pm.environment.set("token", jsonData.data.token);
   }
   ```

5. **Usar token em requests protegidos**:
   - Header: `Authorization: Bearer {{token}}`

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

**Solução**:
```bash
# Verificar se o banco está rodando
docker-compose ps

# Verificar logs
docker-compose logs db

# Reiniciar o banco
docker-compose restart db
```

### Erro: "JWT secret is not configured"

**Solução**: Verifique se o arquivo `.env` existe e tem a variável `JWT_SECRET`

### Erro: "Port 3000 already in use"

**Solução**:
```bash
# Verificar o que está usando a porta
lsof -i :3000

# Ou mudar a porta no .env
PORT=3001
```

### Erro: "Validation failed"

**Solução**: Verifique:
- Headers corretos (`Content-Type: application/json`)
- Formato JSON válido
- Campos obrigatórios preenchidos
- Validações de formato (email, tamanho mínimo, etc.)

---

## 📊 Verificar Banco de Dados

```bash
# Conectar ao PostgreSQL
docker exec -it weightlogx-api-db-1 psql -U user_weightlogx -d weightlogx_db

# Verificar tabela de usuários
SELECT id, email, full_name, created_at FROM users;

# Sair
\q
```

---

## ✅ Checklist de Testes

- [ ] Aplicação inicia sem erros
- [ ] Banco de dados conecta corretamente
- [ ] Registro de usuário funciona (PT-BR)
- [ ] Registro de usuário funciona (EN)
- [ ] Validação de email duplicado funciona
- [ ] Validação de senhas não coincidentes funciona
- [ ] Login funciona com credenciais corretas
- [ ] Login falha com credenciais incorretas
- [ ] Mensagens de erro são traduzidas
- [ ] Token JWT é gerado corretamente
- [ ] Rate limiting funciona (10 requests/min)
- [ ] CORS está configurado

---

## 🎯 Próximos Passos

Após validar o módulo de autenticação:

1. Implementar testes unitários para `AuthService`
2. Implementar testes e2e para endpoints de auth
3. Implementar validação real de token em `reset-password`
4. Implementar envio de email em `forgot-password`
5. Implementar módulo User (perfil)

---

**Dúvidas?** Consulte a documentação em `ARCHITECTURE.md` e `API_DOCUMENTATION.md`

