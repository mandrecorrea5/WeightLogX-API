# 🗄️ Migrations - WeightLogX API

## 📋 Visão Geral

Este projeto usa **TypeORM** para gerenciar o schema do banco de dados através de **migrations**. Migrations garantem que o banco de dados seja versionado e possa ser atualizado de forma controlada e reproduzível.

---

## 🚀 Scripts Disponíveis

### Gerar Nova Migration
```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

### Criar Migration Vazia
```bash
npm run migration:create -- src/database/migrations/MigrationName
```

### Executar Migrations
```bash
npm run migration:run
```

### Reverter Última Migration
```bash
npm run migration:revert
```

### Ver Status das Migrations
```bash
npm run migration:show
```

---

## 📝 Schema do Banco de Dados

### Tabelas Criadas

#### 1. `users`
- **id**: UUID (PK)
- **email**: VARCHAR (UNIQUE, NOT NULL)
- **full_name**: VARCHAR (NOT NULL)
- **password_hash**: VARCHAR (NOT NULL)
- **birth_date**: DATE (NULLABLE)
- **phone**: VARCHAR (NULLABLE)
- **training_center**: VARCHAR (NULLABLE)
- **profile_image_url**: VARCHAR (NULLABLE)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP
- **Índices**: `email`

#### 2. `workouts`
- **id**: UUID (PK)
- **user_id**: UUID (FK → users.id)
- **date**: TIMESTAMP (NOT NULL)
- **total_volume**: INTEGER (default: 0)
- **sent_to_trainer**: BOOLEAN (default: false)
- **sent_at**: TIMESTAMP (NULLABLE)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP
- **Índices**: `user_id`, `date`

#### 3. `workout_exercises`
- **id**: UUID (PK)
- **workout_id**: UUID (FK → workouts.id)
- **exercise_id**: VARCHAR (NOT NULL)
- **name**: VARCHAR (NOT NULL)
- **abbreviation**: VARCHAR (NOT NULL)
- **is_conjugated**: BOOLEAN (default: false)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

#### 4. `series_configs`
- **id**: UUID (PK)
- **workout_exercise_id**: UUID (FK → workout_exercises.id)
- **sets**: INTEGER (NOT NULL)
- **reps**: INTEGER (NOT NULL)
- **percentage**: INTEGER (NOT NULL)
- **weights**: JSONB (NULLABLE) - Array de números
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

#### 5. `personal_records`
- **id**: UUID (PK)
- **user_id**: UUID (FK → users.id)
- **exercise_id**: VARCHAR (NOT NULL)
- **max_weight**: DECIMAL(10,2) (NOT NULL)
- **workout_id**: UUID (FK → workouts.id)
- **date**: TIMESTAMP (NOT NULL)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP
- **Índices**: `user_id`, `exercise_id`

---

## 🔄 Fluxo de Trabalho

### 1. Desenvolvimento Local

```bash
# 1. Iniciar banco de dados
docker-compose up -d db

# 2. Executar migrations
npm run migration:run

# 3. Verificar status
npm run migration:show
```

### 2. Criar Nova Migration

Se você alterar uma entidade:

```bash
# Gerar migration automaticamente baseada nas mudanças
npm run migration:generate -- src/database/migrations/AddNewColumn

# Ou criar migration manual
npm run migration:create -- src/database/migrations/AddNewColumn
```

### 3. Produção

```bash
# Executar migrations antes de iniciar a aplicação
npm run migration:run
npm run start:prod
```

---

## ⚠️ Importante

1. **Nunca use `synchronize: true` em produção**
   - O TypeORM está configurado com `synchronize: false`
   - Use migrations para todas as mudanças de schema

2. **Sempre teste migrations localmente primeiro**
   ```bash
   npm run migration:run
   npm run migration:revert  # Testar reversão
   npm run migration:run     # Executar novamente
   ```

3. **Backup antes de executar migrations em produção**
   ```bash
   pg_dump -U user_weightlogx -d weightlogx_db > backup.sql
   ```

4. **UUID Extension**
   - A migration inicial habilita a extensão `uuid-ossp` do PostgreSQL
   - Necessária para gerar UUIDs automaticamente

---

## 📚 Referências

- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL UUID Extension](https://www.postgresql.org/docs/current/uuid-ossp.html)

---

## 🔍 Troubleshooting

### Erro: "Extension uuid-ossp does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro: "Migration already executed"
```bash
# Verificar status
npm run migration:show

# Se necessário, reverter e executar novamente
npm run migration:revert
npm run migration:run
```

### Erro: "Cannot connect to database"
- Verifique se o Docker está rodando
- Verifique as variáveis de ambiente no `.env`
- Teste a conexão: `docker-compose exec db psql -U user_weightlogx -d weightlogx_db`

