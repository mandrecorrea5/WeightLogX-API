# Explicação dos Reports - WeightLogX API

## 📊 Tabelas Utilizadas

Os reports são gerados a partir das seguintes tabelas do banco de dados:

1. **`workouts`** - Treinos do usuário
   - Campos: `id`, `user_id`, `date`, `total_volume`, `created_at`

2. **`workout_exercises`** - Exercícios de cada treino
   - Campos: `id`, `workout_id`, `exercise_id`, `name`, `abbreviation`

3. **`series_configs`** - Configurações de séries (onde estão os pesos!)
   - Campos: `id`, `workout_exercise_id`, `sets`, `reps`, `weights` (array JSONB)
   - ⚠️ **IMPORTANTE**: Os pesos estão no campo `weights` que é um array JSONB

4. **`personal_records`** - Para contar PRs recentes
   - Campos: `id`, `user_id`, `exercise_id`, `max_weight`, `workout_id`, `date`

## 🔍 Como os Valores São Calculados

### 1. **`mediaGeral`** (Média Geral)
```typescript
// Fórmula: Volume Total / Número de Treinos
// Representa o volume médio por treino no período
totalWeight = soma de todos os valores no array weights[] de todas as séries
workoutCount = número de treinos que têm exercícios (após aplicar filtros)
mediaGeral = totalWeight / workoutCount
```

**Exemplo:**
- Treino 1: 3 séries com pesos [80, 82.5, 85] → volume = 247.5 kg
- Treino 2: 2 séries com pesos [90, 92.5] → volume = 182.5 kg
- Treino 3: 4 séries com pesos [75, 77.5, 80, 82.5] → volume = 315 kg
- **mediaGeral = (247.5 + 182.5 + 315) / 3 = 745 / 3 = 248.33 kg/treino**

✅ **Interpretação**: Mostra a evolução do volume médio de treino. Se você treinou mais pesado ou fez mais séries, esse valor aumenta.

### 2. **`volumeTotal`** (Volume Total)
```typescript
// Fórmula: Soma simples de todos os pesos levantados
volumeTotal = soma de todos os valores no array weights[] de todas as séries
```

**Exemplo:**
- Treino 1: [80, 82.5, 85] → 247.5 kg
- Treino 2: [90, 92.5] → 182.5 kg
- **volumeTotal = 247.5 + 182.5 = 430 kg**

### 3. **`prsRecentes`** (PRs Recentes)
```typescript
// Contagem direta na tabela personal_records
prsRecentes = COUNT(*) FROM personal_records 
WHERE user_id = ? 
  AND date >= startDate 
  AND date <= endDate
  AND (exercise_id = ? se filtro por exercício)
```

### 4. **`graphData`** (Dados do Gráfico)
```typescript
// Agrupa por mês e calcula volume médio por treino no mês
Para cada mês:
  - Agrupa todos os treinos do mês
  - Calcula totalWeight e workoutCount do mês
  - Média mensal = totalWeight / workoutCount (volume médio por treino)
  - Retorna array: [{ date: "2024-01-01", value: 248.33 }, ...]
```

## 🔎 Onde Estão os Dados?

### Estrutura de Dados:
```
workouts
  └── workout_exercises (relação 1:N)
       └── series_configs (relação 1:N)
            └── weights: [80, 82.5, 85] ← AQUI estão os pesos!
```

### Query SQL Equivalente (simplificado):
```sql
SELECT 
  w.id,
  w.date,
  we.exercise_id,
  we.name,
  sc.sets,
  sc.reps,
  sc.weights  -- Array JSONB com os pesos
FROM workouts w
LEFT JOIN workout_exercises we ON we.workout_id = w.id
LEFT JOIN series_configs sc ON sc.workout_exercise_id = we.id
WHERE w.user_id = ?
  AND w.date >= ?
  AND w.date <= ?
```

## ⚠️ Pontos de Atenção

1. **`mediaGeral` representa volume médio por treino**:
   - Mostra quanto peso você levantou em média por treino
   - Útil para ver evolução: se o valor aumenta, você está treinando com mais volume
   - Exemplo: Se você fez 3 treinos com 200kg, 250kg e 300kg → média = 250kg/treino

2. **`volumeTotal` é a soma bruta**:
   - Soma todos os pesos de todas as séries
   - Não considera reps, apenas soma os valores

3. **Filtros aplicados**:
   - `type=geral`: Todos os exercícios
   - `type=exercicio`: Apenas o exercício especificado em `exerciseId`
   - `type=carga`: Atualmente trata igual a `geral` (pode ser um bug)

4. **Período (`timeFilter`)**:
   - `7d`: Últimos 7 dias
   - `30d`: Últimos 30 dias
   - `3m`: Últimos 3 meses
   - `1y`: Último ano

## 🐛 Possíveis Problemas

Se você está vendo valores estranhos, verifique:

1. **Os pesos estão salvos corretamente?**
   ```sql
   SELECT sc.weights FROM series_configs sc
   JOIN workout_exercises we ON we.id = sc.workout_exercise_id
   JOIN workouts w ON w.id = we.workout_id
   WHERE w.user_id = 'seu-user-id'
   LIMIT 10;
   ```

2. **Há treinos no período?**
   ```sql
   SELECT COUNT(*) FROM workouts 
   WHERE user_id = 'seu-user-id' 
     AND date >= '2024-01-01' 
     AND date <= '2024-12-31';
   ```

3. **Os arrays de weights não estão vazios?**
   ```sql
   SELECT COUNT(*) FROM series_configs 
   WHERE weights IS NULL OR jsonb_array_length(weights) = 0;
   ```

## 📝 Exemplo Prático

**Cenário:** 3 treinos no mês

**Treino 1 (Arranco):**
- 3 séries com pesos: [80, 82.5, 85]
- Volume do treino = 80 + 82.5 + 85 = **247.5 kg**

**Treino 2 (Arremesso):**
- 2 séries com pesos: [90, 92.5]
- Volume do treino = 90 + 92.5 = **182.5 kg**

**Treino 3 (Arranco):**
- 4 séries com pesos: [75, 77.5, 80, 82.5]
- Volume do treino = 75 + 77.5 + 80 + 82.5 = **315 kg**

**Cálculo das métricas:**
- `volumeTotal = 247.5 + 182.5 + 315 = 745 kg`
- `mediaGeral = 745 / 3 = 248.33 kg/treino`
- `prsRecentes = contagem de PRs na tabela personal_records no período`

**Interpretação:**
- Você levantou em média **248.33 kg por treino** no período
- O volume total foi de **745 kg** no mês
- Se a `mediaGeral` aumentar no próximo mês, significa que você está treinando com mais volume

