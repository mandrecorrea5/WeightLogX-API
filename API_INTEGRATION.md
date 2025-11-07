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
- `GET /api/training-centers`
- `POST /api/training-centers`
- `GET /api/training-centers/:id`
- `PUT /api/training-centers/:id`
- `DELETE /api/training-centers/:id`

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

**Common Mistakes:**
- ❌ Reports sem `exerciseId` quando `type=exercicio` → 400 Bad Request
- ❌ Workout update sem campo `config` nos exercícios → 400 Bad Request
- ❌ Headers faltando `Authorization` → 401 Unauthorized
- ❌ Body não é JSON válido → 400 Bad Request

If anything is missing for your UI flows, open an issue with the exact field/endpoint needed.


