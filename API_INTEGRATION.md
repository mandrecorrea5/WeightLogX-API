## WeightLogX API – Frontend Integration Guide

This document describes the public API surface, authentication, request/response shapes, WebSocket events, notifications, errors, health, metrics, and conventions to integrate frontend apps.

### Base URL and Versioning
- Base path: `/api`
- Example: `GET /api/health`
- Versioning: not versioned yet; keep backward compatibility in mind.

### Authentication
- Scheme: Bearer JWT in `Authorization: Bearer <token>`
- Issued on login/register; include `sub` (user id) and expiry.

Endpoints:
- `POST /api/auth/register` – body: `{ email, fullName, password }`
- `POST /api/auth/login` – body: `{ email, password }`
- `GET /api/auth/profile` – returns current user profile

Response (example profile):
```
{
  "id": "<uuid>",
  "email": "user@example.com",
  "fullName": "User Name",
  "role": { "id": "<uuid>", "name": "atleta" | "treinador" | "admin" },
  "trainingCenter": {
    "id": "a9c34a9c-1234-5678-9012-abcdef123456",
    "name": "Centro de Levantamento Olímpico do Maranhão",
    "abbreviation": "CLOMA"
  },
  "trainingCenterId": "a9c34a9c-1234-5678-9012-abcdef123456",
  "trainingCenterName": "Centro de Levantamento Olímpico do Maranhão",
  "trainerId": "<uuid|null>",
  "createdAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

### Users
- `PUT /api/user/profile` – update profile
- `PUT /api/user/password` – change password
- `POST /api/user/profile-image` – upload image (multipart/form-data; field `image`)
- `GET /api/user/permissions` – permissions of current user

**Update profile body:**
```json
{
  "fullName": "João Silva",
  "birthDate": "1990-03-15T00:00:00.000Z",
  "phone": "31987654321",
  "trainingCenterId": "a9c34a9c-1234-5678-9012-abcdef123456"
}
```

**Note:**
- `birthDate`: Aceita ISO 8601 (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ss.sssZ`) ou formato brasileiro (`dd/MM/yyyy`)
- `phone`: Aceita vários formatos (apenas números, com parênteses, hífen, etc.). Será normalizado para apenas dígitos (10-11 dígitos)
- `trainingCenterId`: Envie o UUID do centro de treinamento (`null` para remover a associação). Para compatibilidade, ainda aceitamos `trainingCenter` (string) – caso usado, o backend armazena apenas o nome e remove o vínculo com a tabela
- `trainingCenter`: Quando a resposta vier com um objeto `{ id, name, abbreviation }`, significa que o usuário está vinculado a um centro cadastrado em `/api/training-centers`. Os campos `trainingCenterId` e `trainingCenterName` permanecem como fallback legados.
- Todos os campos são opcionais
- Resposta retorna `birthDate` formatado como `dd/MM/yyyy` e `phone` apenas com dígitos

Admin-only:
- `PUT /api/user/users/:userId/trainer` – set trainer for athlete; body `{ trainerId: string }`
- `DELETE /api/user/users/:userId/trainer` – unlink trainer from athlete

Set trainer response (shape equals profile):
```
{
  "id": "<athleteId>",
  "trainerId": "<trainerId|null>",
  ...profileFields
}
```

### Workouts
- `POST /api/workouts` – create workout
- `GET /api/workouts` – list workouts (supports pagination: `page`, `limit`)
- `GET /api/workouts/:id` – workout details
- `PUT /api/workouts/:id` – update workout (uses same body as POST)
- `DELETE /api/workouts/:id` – delete workout (returns 204 No Content on success)
- `PUT /api/workouts/:id/send-to-trainer` – marks workout as sent; triggers notification

**Note:** 
- UPDATE endpoint validates ownership, deletes old exercises/series, creates new ones, and recalculates PRs
- DELETE endpoint validates ownership (only the workout owner can delete it). Cascade delete automatically removes associated exercises and series configs
- Both UPDATE and DELETE remove related PRs and recalculate them if needed

**Create/Update workout body:**
```json
{
  "date": "2025-01-10T10:00:00.000Z",
  "exercises": [
    {
      "exerciseId": "881eea3a-0b5e-456b-84c8-3ec218b8517b",
      "name": "Arranco",
      "abbreviation": "A",
      "config": [
        {
          "id": "series-1",
          "sets": 3,
          "reps": 3,
          "percentage": 75,
          "weights": [50, 60, 60]
        },
        {
          "id": "series-2",
          "sets": 3,
          "reps": 2,
          "percentage": 80,
          "weights": [70, 70, 80]
        }
      ]
    }
  ]
}
```

**Note:** 
- `date` deve ser ISO 8601 (pode incluir ou não timezone)
- Cada exercício precisa de `exerciseId`, `name`, `abbreviation`
- Cada série em `config` precisa de `id`, `sets`, `reps`, `percentage`, `weights` (array)

Send to trainer response:
```
{ "id": "<workoutId>", "sentToTrainer": true, "sentAt": "2025-01-10T15:30:00.000Z" }
```

### Personal Records (PRs)
- `GET /api/prs` – list PRs
- `GET /api/prs/:exerciseId` – PR by exercise
- Background: when saving a workout, PRs are recalculated; on new PR a notification is created.

### Exercises
- `GET /api/exercises` – list all exercises
- `POST /api/exercises` – create exercise
- `PUT /api/exercises/:id` – update exercise (full update)
- `PATCH /api/exercises/:id` – update exercise (partial update, same as PUT)
- `DELETE /api/exercises/:id` – delete exercise

**Create/Update exercise body:**
```json
{
  "namePtBr": "Arranco Técnico",
  "nameEn": "Squat Snatch",
  "abbreviationPtBr": "ATec",
  "abbreviationEn": "SSn"
}
```

**Note:** Todos os campos são opcionais no update (PATCH/PUT), mas pelo menos um deve ser fornecido.

### Training Centers
- `GET /api/training-centers` – lista centros (suporta `?search=term` para nome/sigla/treinador)
- `POST /api/training-centers` – cria centro (campos obrigatórios abaixo)
- `GET /api/training-centers/:id` – detalhes
- `PUT /api/training-centers/:id` – atualiza centro
- `DELETE /api/training-centers/:id` – remove centro

**Create training center body:**
```json
{
  "name": "Centro de Levantamento Olímpico do Maranhão",
  "abbreviation": "CLOMA",
  "trainerId": "1d23f456-7890-4abc-def1-234567890abc",
  "nickname": "CLOMA",             // opcional (alias para autocomplete)
  "address": "Rua das Flores, 123", // opcional
  "city": "São Luís",               // opcional
  "state": "MA",                    // opcional
  "country": "Brasil"               // opcional
}
```

**Response:**
```json
{
  "id": "center-uuid",
  "name": "Centro de Levantamento Olímpico do Maranhão",
  "abbreviation": "CLOMA",
  "nickname": "CLOMA",
  "trainer": {
    "id": "1d23f456-7890-4abc-def1-234567890abc",
    "name": "Eduardo Roberto"
  },
  "trainerId": "1d23f456-7890-4abc-def1-234567890abc",   // fallback legado
  "trainerName": "Eduardo Roberto",                     // fallback legado
  "address": "Rua das Flores, 123",
  "city": "São Luís",
  "state": "MA",
  "country": "Brasil",
  "createdAt": "2025-01-10T12:00:00.000Z",
  "updatedAt": "2025-01-10T12:00:00.000Z"
}
```

**Notas:**
- `abbreviation` é obrigatório, normalizado em UPPERCASE e único (case-insensitive)
- `trainerId` deve apontar para um treinador existente (`POST /api/trainers`)
- `trainer` retorna objeto completo; `trainerId`/`trainerName` são mantidos para compatibilidade com apps legados
- Busca (`?search=`) considera nome, sigla, nickname, nome do treinador, cidade e estado
- Para vincular um usuário a um centro, utilize o `trainingCenterId` no `PUT /api/user/profile`

### Trainers
- `GET /api/trainers` – lista treinadores (`?search=` opcional)
- `POST /api/trainers` – cadastra novo treinador

**Create trainer body:**
```json
{
  "name": "Eduardo Roberto"
}
```

**Response:**
```json
{
  "id": "1d23f456-7890-4abc-def1-234567890abc",
  "name": "Eduardo Roberto",
  "createdAt": "2025-01-10T12:00:00.000Z",
  "updatedAt": "2025-01-10T12:00:00.000Z"
}
```

### Reports
- `GET /api/reports?type={geral|exercicio|carga}&timeFilter={7d|30d|3m|1y}&exerciseId={uuid}` – generate workout reports

**Query Parameters:**
- `type` (required): `geral` | `exercicio` | `carga`
- `timeFilter` (required): `7d` | `30d` | `3m` | `1y`
- `exerciseId` (optional, required if `type=exercicio`): UUID do exercício

**Examples:**
```bash
# Relatório geral dos últimos 30 dias
GET /api/reports?type=geral&timeFilter=30d

# Relatório dos últimos 3 meses
GET /api/reports?type=geral&timeFilter=3m

# Relatório de um exercício específico (últimos 30 dias)
GET /api/reports?type=exercicio&timeFilter=30d&exerciseId=881eea3a-0b5e-456b-84c8-3ec218b8517b
```

**Response:**
```json
{
  "evolucaoMediaGeral": {
    "current": 248.33,
    "variationPercent": 15.5,
    "isPositive": true
  },
  "volumeTotal": {
    "current": 745.0,
    "variationPercent": 10.2,
    "isPositive": true
  },
  "prsRecentes": 3,
  "quantidadeTreinos": 12,
  "graphData": [
    { "date": "2024-01-01", "value": 200.5 },
    { "date": "2024-02-01", "value": 220.3 },
    { "date": "2024-03-01", "value": 248.33 }
  ]
}
```

### Notifications (REST)
- `GET /api/notifications` – list notifications; query: `page`, `limit`, `unreadOnly`
- `PATCH /api/notifications/:id/read` – mark a notification as read
- `PATCH /api/notifications/read-all` – mark all as read
- `GET /api/notifications/settings` – get user settings
- `PATCH /api/notifications/settings` – update settings
- Device tokens:
  - `POST /api/notifications/device-tokens` – `{ deviceToken, platform: "ios"|"android", deviceId? }`
  - `DELETE /api/notifications/device-tokens/:deviceToken`

Notification object:
```
{
  "id": "<uuid>",
  "userId": "<uuid>",
  "type": "new_pr" | "workout_sent_to_trainer" | "workout_reminder" | "athlete_inactive" | ...,
  "title": "string",
  "body": "string",
  "data": { ... },
  "read": false,
  "readAt": null,
  "createdAt": "2025-01-10T15:30:00.000Z"
}
```

Notification settings:
```
{
  "workoutReminders": true,
  "workoutReminderTime": "18:00:00",
  "prNotifications": true,
  "trainerFeedback": true,
  "weeklyGoals": true,
  "pushEnabled": true
}
```

### Notifications (WebSocket)
- Namespace: `/ws`
- Transport: `websocket` (fallback `polling` enabled)
- Auth: send JWT as `auth.token` or header `Authorization: Bearer <token>` when connecting
- Rooms: server joins each socket to `user:<userId>`

Client connection example (Socket.IO):
```
io("/ws", { auth: { token: jwt } })
```

Server → Client events:
- `notification:new` – payload: Notification
- `unread_count:update` – payload: `{ count: number }`

Client → Server events:
- `notification:read` – payload: `{ id: string }`
- `notification:read_all` – no payload

### Cron jobs
- Workout reminders (every minute checks users matching their `workoutReminderTime`; sends `workout_reminder` if no workout today)
- Inactive athletes (default daily 09:00; notifies trainer if athlete has no workout in last N days)
- Feature flags via env:
  - `ENABLE_CRON_REMINDERS` (default true)
  - `ENABLE_CRON_INACTIVITY` (default true)
  - `INACTIVITY_DAYS` (default 7)
  - `INACTIVITY_CRON_SCHEDULE` (cron string; default `0 9 * * *`)

### Health & Metrics
- Health:
  - `GET /api/health` (composite)
  - `GET /api/health/liveness`
  - `GET /api/health/readiness`
- Metrics (Prometheus):
  - `GET /api/metrics`
  - Includes HTTP durations, totals, status classes, sizes, DB query timings, active connections, defaults.

### Error format
All errors conform to:
```
{
  "statusCode": 400|401|403|404|500,
  "timestamp": "2025-01-10T15:30:00.000Z",
  "path": "/api/...",
  "message": "string | i18n key translated",
  "errors": [optional array]
}
```
Notes:
- I18n: locale derived from `Accept-Language` (supports `pt-BR` default, `en`)
- Production hides internal details for security (auth paths are masked)

### Conventions
- Pagination: `page` (1-based), `limit` (max 100). Responses include `{ pagination: { page, limit, total, totalPages } }`
- Dates: ISO 8601 in responses; input dates typically `YYYY-MM-DD` for workout date or ISO 8601 with timezone
- IDs: UUID strings
- Auth required for all endpoints unless explicitly marked public (health/metrics may be public in non-prod)
- CORS: configured via `CORS_ORIGIN` env; credentials enabled

### Required Headers
All authenticated requests must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json (for POST/PUT/PATCH with body)
Accept-Language: pt-BR | en (optional, defaults to pt-BR)
```

**Important:**
- Query parameters must be properly URL-encoded (e.g., `exerciseId=881eea3a-0b5e-456b-84c8-3ec218b8517b`)
- JSON bodies must be valid JSON (use `JSON.stringify()` in JavaScript)
- Content-Type must match the body type (application/json for JSON, multipart/form-data for file uploads)

### Security
- Helmet enabled; CORS restricted by env; rate limiting enabled
- JWT required for protected routes; bcrypt for passwords; DB logging only in development
- Swagger at `/api/docs` except in production unless `ENABLE_SWAGGER=true`

### Rate Limiting
- **Default limits:**
  - Development: 100 requests/minute
  - Production: 60 requests/minute
- **Configuration:** Via environment variables:
  - `THROTTLE_TTL`: Time window in milliseconds (default: 60000 = 1 minute)
  - `THROTTLE_LIMIT`: Maximum requests per window (default: 100 dev, 60 prod)
- **Error response:** `429 Too Many Requests` when limit exceeded
- **Headers:** Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Environment (selected)
- `NODE_ENV` – `development` | `production`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_SSL`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- CORS: `CORS_ORIGIN`
- Upload: `UPLOAD_DEST`, `MAX_FILE_SIZE`

### Quick test (curl)
```bash
# Health
curl -s http://localhost:3000/api/health

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret"}' | jq -r .accessToken)

# List notifications
curl -s http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# Get reports (geral, últimos 30 dias)
curl -s "http://localhost:3000/api/reports?type=geral&timeFilter=30d" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept-Language: pt-BR"

# Get reports (exercício específico)
curl -s "http://localhost:3000/api/reports?type=exercicio&timeFilter=30d&exerciseId=881eea3a-0b5e-456b-84c8-3ec218b8517b" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept-Language: pt-BR"

# Update workout
curl -X PUT "http://localhost:3000/api/workouts/{workoutId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "date": "2025-11-07T01:04:02.821Z",
    "exercises": [
      {
        "exerciseId": "881eea3a-0b5e-456b-84c8-3ec218b8517b",
        "name": "Arranco",
        "abbreviation": "A",
        "config": [
          {
            "id": "0b6823fb-000a-42cb-a25c-df77ef2e3b60",
            "sets": 3,
            "reps": 3,
            "percentage": 75,
            "weights": [50, 60, 60]
          }
        ]
      }
    ]
  }'

# Update exercise (PATCH)
curl -X PATCH "http://localhost:3000/api/exercises/{exerciseId}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "namePtBr": "Arranco Técnico",
    "nameEn": "Squat Snatch",
    "abbreviationPtBr": "ATec",
    "abbreviationEn": "SSn"
  }'
```

### Frontend tips
- Normalize errors to the structure above
- Use WebSocket namespace `/ws` with JWT on connection
- Watch `unread_count:update` to update badges
- Debounce writes to `notification:read` to reduce chatter

### Request Examples (Complete)

**1. Reports - Relatório Geral:**
```javascript
// JavaScript/TypeScript
const response = await fetch('http://localhost:3000/api/reports?type=geral&timeFilter=30d', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept-Language': 'pt-BR'
  }
});
const data = await response.json();
// data.evolucaoMediaGeral.current, data.volumeTotal.current, data.quantidadeTreinos, data.graphData
```

**2. Reports - Por Exercício:**
```javascript
// IMPORTANTE: exerciseId é obrigatório quando type=exercicio
const exerciseId = '881eea3a-0b5e-456b-84c8-3ec218b8517b';
const response = await fetch(
  `http://localhost:3000/api/reports?type=exercicio&timeFilter=30d&exerciseId=${exerciseId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept-Language': 'pt-BR'
    }
  }
);
```

**3. Update Workout:**
```javascript
const workoutId = 'be62e7c6-f8d5-425c-ad95-433226270a8b';
const response = await fetch(`http://localhost:3000/api/workouts/${workoutId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept-Language': 'pt-BR'
  },
  body: JSON.stringify({
    date: '2025-11-07T01:04:02.821Z',
    exercises: [
      {
        exerciseId: '881eea3a-0b5e-456b-84c8-3ec218b8517b',
        name: 'Arranco',
        abbreviation: 'A',
        config: [
          {
            id: '0b6823fb-000a-42cb-a25c-df77ef2e3b60',
            sets: 3,
            reps: 3,
            percentage: 75,
            weights: [50, 60, 60]
          }
        ]
      }
    ]
  })
});
```

**4. Update Exercise:**
```javascript
const exerciseId = '3965f327-0724-46a9-b18c-1c341c64a690';
const response = await fetch(`http://localhost:3000/api/exercises/${exerciseId}`, {
  method: 'PATCH', // ou PUT
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept-Language': 'pt-BR'
  },
  body: JSON.stringify({
    namePtBr: 'Arranco Técnico',
    nameEn: 'Squat Snatch',
    abbreviationPtBr: 'ATec',
    abbreviationEn: 'SSn'
  })
});
```

**5. Update User Profile:**
```javascript
const response = await fetch('http://localhost:3000/api/user/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept-Language': 'pt-BR'
  },
  body: JSON.stringify({
    fullName: 'João Silva',
    birthDate: '1990-03-15T00:00:00.000Z', // ISO 8601 ou '15/03/1990'
    phone: '31987654321', // Aceita vários formatos: '(31) 98765-4321', '31 98765-4321', etc.
    trainingCenterId: 'a9c34a9c-1234-5678-9012-abcdef123456' // Use null para remover associação
  })
});
const profile = await response.json();
// profile.birthDate retorna como '15/03/1990' (formato brasileiro)
// profile.phone retorna apenas dígitos: '31987654321'
// profile.trainingCenter retorna objeto com id, nome e sigla (quando associado)
```

**Common Mistakes:**
- ❌ Reports sem `exerciseId` quando `type=exercicio` → 400 Bad Request
- ❌ Workout update sem campo `config` nos exercícios → 400 Bad Request
- ❌ Headers faltando `Authorization` → 401 Unauthorized
- ❌ Body não é JSON válido → 400 Bad Request
- ❌ Profile update com telefone com menos de 10 dígitos ou mais de 11 → 400 Bad Request
- ❌ Profile update com data inválida → 400 Bad Request
- ❌ Profile update com `trainingCenterId` inexistente → 404 Not Found
- ❌ Profile update enviando `trainingCenter` string + `trainingCenterId` → 400 Bad Request (escolha apenas um formato)
- ❌ Training center sem sigla ou com sigla duplicada → 400/409 Bad Request
- ❌ Training center com `trainerId` inexistente → 404 Not Found

If anything is missing for your UI flows, open an issue with the exact field/endpoint needed.


