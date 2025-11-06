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
- `PUT /api/workouts/:id` – update workout
- `DELETE /api/workouts/:id` – delete workout
- `POST /api/workouts/:id/send-to-trainer` – marks workout as sent; triggers notification

Create workout (simplified):
```
{
  "date": "2025-01-10",
  "exercises": [
    {
      "exerciseId": "<uuid>",
      "name": "Snatch",
      "seriesConfigs": [{ "weights": [40, 45, 50] }]
    }
  ]
}
```

Send to trainer response:
```
{ "id": "<workoutId>", "sentToTrainer": true, "sentAt": "2025-01-10T15:30:00.000Z" }
```

### Personal Records (PRs)
- `GET /api/prs` – list PRs
- `GET /api/prs/:exerciseId` – PR by exercise
- Background: when saving a workout, PRs are recalculated; on new PR a notification is created.

### Exercises
- `GET /api/exercises` – list
- `POST /api/exercises` – create
- `PUT /api/exercises/:id` – update
- `DELETE /api/exercises/:id` – delete

### Training Centers
- `GET /api/training-centers`
- `POST /api/training-centers`
- `GET /api/training-centers/:id`
- `PUT /api/training-centers/:id`
- `DELETE /api/training-centers/:id`

### Reports
- `GET /api/reports/overview` – high-level stats
- `GET /api/reports/user` – per-user stats

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
- Dates: ISO 8601 in responses; input dates typically `YYYY-MM-DD` for workout date
- IDs: UUID strings
- Auth required for all endpoints unless explicitly marked public (health/metrics may be public in non-prod)
- CORS: configured via `CORS_ORIGIN` env; credentials enabled

### Security
- Helmet enabled; CORS restricted by env; rate limiting recommended at gateway/proxy
- JWT required for protected routes; bcrypt for passwords; DB logging only in development
- Swagger at `/api/docs` except in production unless `ENABLE_SWAGGER=true`

### Environment (selected)
- `NODE_ENV` – `development` | `production`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_SSL`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- CORS: `CORS_ORIGIN`
- Upload: `UPLOAD_DEST`, `MAX_FILE_SIZE`

### Quick test (curl)
```
# Health
curl -s http://localhost:3000/api/health | jq .

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret"}' | jq -r .accessToken)

# List notifications
curl -s http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Frontend tips
- Normalize errors to the structure above
- Use WebSocket namespace `/ws` with JWT on connection
- Watch `unread_count:update` to update badges
- Debounce writes to `notification:read` to reduce chatter

If anything is missing for your UI flows, open an issue with the exact field/endpoint needed.


