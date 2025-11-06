# 🔧 Exemplos de curl para Testar a API

## Base URL
```
http://localhost:3000/api
```

---

## 1. Registro de Usuário (PT-BR)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'
```

**Resposta esperada (Status 201):**
```json
{
  "message": "Conta criada com sucesso"
}
```

**Com `Accept-Language: en`:**
```json
{
  "message": "Account created successfully"
}
```

**Nota:** Por segurança, não retornamos dados do usuário nem token no registro. Use o endpoint de login após o registro.

---

## 2. Registro de Usuário (EN)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123456",
    "confirmPassword": "password123456"
  }'
```

---

## 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123456"
  }'
```

**Resposta esperada (Status 200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "timestamp": "2025-11-05T23:46:04.506Z"
}
```

**Nota:** Por segurança, não retornamos dados do usuário no login. Use o token JWT para acessar endpoints protegidos que retornam dados do usuário.

---

## 4. Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "email": "joao@example.com"
  }'
```

**Resposta esperada:**
```json
{
  "data": {
    "message": "Link de recuperação enviado para o email"
  },
  "timestamp": "2025-11-05T..."
}
```

---

## 5. Reset Password

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "token": "reset-token-here",
    "newPassword": "novaSenha123456",
    "confirmPassword": "novaSenha123456"
  }'
```

---

## 6. Health Check (Endpoint padrão)

```bash
curl http://localhost:3000/api
```

**Resposta esperada:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2025-11-05T...",
  "path": "/api"
}
```

---

## 🧪 Testes de Validação (Erros Esperados)

### Email inválido
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Teste",
    "email": "email-invalido",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'
```

**Resposta esperada:** Status 400
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "errors": ["email must be an email"],
  "timestamp": "...",
  "path": "/api/auth/register"
}
```

### Senha muito curta
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Teste",
    "email": "teste@example.com",
    "password": "123",
    "confirmPassword": "123"
  }'
```

**Resposta esperada:** Status 400
```json
{
  "statusCode": 400,
  "message": [
    "password must be longer than or equal to 8 characters",
    "confirmPassword must be longer than or equal to 8 characters"
  ],
  "errors": [...],
  "timestamp": "...",
  "path": "/api/auth/register"
}
```

### Nome muito curto
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jo",
    "email": "teste@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'
```

**Resposta esperada:** Status 400

### Email já cadastrado
```bash
# Primeiro registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Teste",
    "email": "teste@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'

# Tentar registrar novamente com mesmo email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "Outro Nome",
    "email": "teste@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'
```

**Resposta esperada:** Status 409
```json
{
  "statusCode": 409,
  "message": "Email já cadastrado",
  "timestamp": "...",
  "path": "/api/auth/register"
}
```

### Credenciais inválidas no login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "email": "joao@example.com",
    "password": "senhaErrada"
  }'
```

**Resposta esperada:** Status 401
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "timestamp": "...",
  "path": "/api/auth/login"
}
```

---

## 💡 Dicas

### Formatar JSON na resposta
Adicione `| jq` ao final do comando (se tiver jq instalado):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}' | jq
```

### Ver apenas o status HTTP
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{...}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -o /dev/null -s
```

### Salvar token em variável (bash)
```bash
# 1. Registrar usuário
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'

# 2. Fazer login e salvar token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Token: $TOKEN"

# 3. Usar token em requisições protegidas (quando implementarmos)
# curl -X GET http://localhost:3000/api/user/profile \
#   -H "Authorization: Bearer $TOKEN"
```

### Teste completo: Registro + Login
```bash
# 1. Registrar
EMAIL="usuario$(date +%s)@example.com"
echo "Registrando: $EMAIL"

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d "{
    \"fullName\": \"Usuário Teste\",
    \"email\": \"$EMAIL\",
    \"password\": \"senha123456\",
    \"confirmPassword\": \"senha123456\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'
# Resposta esperada: {"message": "Conta criada com sucesso"}

# 2. Fazer login
echo ""
echo "Fazendo login..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"senha123456\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'
# Resposta esperada: {"access_token": "...", "timestamp": "..."}

# 3. Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
echo ""
echo "Token obtido: ${TOKEN:0:50}..."
```

---

## 11. Criar Treino

```bash
# Substitua {YOUR_JWT_TOKEN} pelo token obtido no login
curl -X POST http://localhost:3000/api/workouts \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "date": "2024-01-15T10:00:00Z",
    "exercises": [
      {
        "exerciseId": "1",
        "name": "Arranco",
        "abbreviation": "A",
        "isConjugated": false,
        "config": [
          {
            "id": "series-1",
            "sets": 3,
            "reps": 3,
            "percentage": 75,
            "weights": [80, 82.5, 85]
          },
          {
            "id": "series-2",
            "sets": 2,
            "reps": 2,
            "percentage": 80,
            "weights": [87.5, 90]
          }
        ]
      },
      {
        "exerciseId": "2",
        "name": "Arremesso",
        "abbreviation": "Ar",
        "isConjugated": false,
        "config": [
          {
            "id": "series-3",
            "sets": 3,
            "reps": 3,
            "percentage": 70,
            "weights": [100, 105, 110]
          }
        ]
      }
    ]
  }'
```

**Resposta esperada (Status 201):**
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00.000Z",
  "exercises": [...],
  "totalVolume": 62,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "message": "Treino salvo com sucesso"
}
```

---

## 12. Listar Treinos

```bash
# Substitua {YOUR_JWT_TOKEN} pelo token obtido no login
curl -X GET "http://localhost:3000/api/workouts?page=1&limit=20" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

**Resposta esperada (Status 200):**
```json
{
  "workouts": [
    {
      "id": "workout-uuid",
      "date": "2024-01-15T10:00:00.000Z",
      "exercises": [
        {
          "name": "Arranco",
          "totalVolume": 24
        },
        {
          "name": "Arremesso",
          "totalVolume": 18
        }
      ],
      "totalVolume": 62,
      "sentToTrainer": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## 13. Obter Detalhes de um Treino

```bash
# Substitua {YOUR_JWT_TOKEN} pelo token obtido no login
# Substitua {WORKOUT_ID} pelo ID do treino
curl -X GET http://localhost:3000/api/workouts/{WORKOUT_ID} \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

**Resposta esperada (Status 200):**
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00.000Z",
  "exercises": [
    {
      "id": "1",
      "name": "Arranco",
      "abbreviation": "A",
      "isConjugated": false,
      "config": [
        {
          "id": "series-1",
          "sets": 3,
          "reps": 3,
          "percentage": 75,
          "weights": [80, 82.5, 85]
        }
      ]
    }
  ],
  "totalVolume": 62
}
```

---

## 14. Enviar Treino ao Treinador

```bash
# Substitua {YOUR_JWT_TOKEN} pelo token obtido no login
# Substitua {WORKOUT_ID} pelo ID do treino
curl -X PUT http://localhost:3000/api/workouts/{WORKOUT_ID}/send-to-trainer \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  -H "Accept-Language: pt-BR"
```

**Resposta esperada (Status 200):**
```json
{
  "id": "workout-uuid",
  "sentToTrainer": true,
  "sentAt": "2024-01-15T11:00:00.000Z"
}
```

---

## 15. Listar Personal Records (PRs)

```bash
# Substitua {YOUR_JWT_TOKEN} pelo token obtido no login
curl -X GET "http://localhost:3000/api/prs" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

**Resposta esperada (Status 200):**
```json
{
  "prs": [
    {
      "exerciseId": "1",
      "exerciseName": "Arranco",
      "abbreviation": "A",
      "maxWeight": 95,
      "date": "2024-01-15T10:00:00.000Z",
      "workoutId": "workout-uuid"
    },
    {
      "exerciseId": "2",
      "exerciseName": "Arremesso",
      "abbreviation": "Ar",
      "maxWeight": 125,
      "date": "2024-01-14T10:00:00.000Z",
      "workoutId": "workout-uuid-2"
    }
  ]
}
```

---

## 16. Listar PRs Filtrados

### Filtrar por exercício específico:
```bash
curl -X GET "http://localhost:3000/api/prs?exerciseId=1" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

### Apenas PRs recentes (últimos 7 dias):
```bash
curl -X GET "http://localhost:3000/api/prs?recent=true" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

### Combinar filtros:
```bash
curl -X GET "http://localhost:3000/api/prs?exerciseId=1&recent=true" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

**Observações:**
- PRs são calculados automaticamente quando um treino é salvo
- PRs são ordenados por peso (maior primeiro)
- PR é considerado "recente" se foi estabelecido nos últimos 7 dias

---

## 17. Gerar Relatório Geral

```bash
# Substitua {YOUR_JWT_TOKEN} pelo token obtido no login
curl -X GET "http://localhost:3000/api/reports?type=geral&timeFilter=30d" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  -H "Accept-Language: pt-BR"
```

**Resposta esperada (Status 200):**
```json
{
  "mediaGeral": 142,
  "volumeTotal": 8450,
  "prsRecentes": 3,
  "graphData": [
    {
      "date": "2024-06-01",
      "value": 120
    },
    {
      "date": "2024-07-01",
      "value": 135
    },
    {
      "date": "2024-08-01",
      "value": 142
    }
  ]
}
```

---

## 18. Gerar Relatório por Exercício

```bash
# Relatório do exercício "Arranco" (exerciseId=1) nos últimos 3 meses
curl -X GET "http://localhost:3000/api/reports?type=exercicio&timeFilter=3m&exerciseId=1" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  -H "Accept-Language: pt-BR"
```

**Observações:**
- `type`: `geral` (todos os exercícios), `exercicio` (exercício específico), `carga` (por carga)
- `timeFilter`: `7d` (7 dias), `30d` (30 dias), `3m` (3 meses), `1y` (1 ano)
- `exerciseId`: Obrigatório quando `type=exercicio`
- `mediaGeral`: Média de peso levantado no período
- `volumeTotal`: Soma de todos os pesos levantados (em kg)
- `prsRecentes`: Número de PRs estabelecidos no período
- `graphData`: Dados para gráfico de linha (mês a mês)

---

## 19. Exemplos de Filtros de Período

### Últimos 7 dias:
```bash
curl -X GET "http://localhost:3000/api/reports?type=geral&timeFilter=7d" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

### Últimos 30 dias:
```bash
curl -X GET "http://localhost:3000/api/reports?type=geral&timeFilter=30d" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

### Últimos 3 meses:
```bash
curl -X GET "http://localhost:3000/api/reports?type=geral&timeFilter=3m" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

### Último ano:
```bash
curl -X GET "http://localhost:3000/api/reports?type=geral&timeFilter=1y" \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}"
```

---

## 🔍 Verificar se API está rodando

```bash
curl http://localhost:3000/api
```

Se retornar algo (mesmo que erro 401), significa que a API está rodando! ✅

---

## 📝 Notas

- Todos os endpoints de `/auth/*` são públicos (não precisam de token)
- O token JWT expira em 7 dias (configurável no `.env`)
- As mensagens de erro são traduzidas baseadas no header `Accept-Language`
- Em produção, use HTTPS ao invés de HTTP

