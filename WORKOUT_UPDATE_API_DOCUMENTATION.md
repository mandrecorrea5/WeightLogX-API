# API - Atualização de Treino (Workout Update)

## Visão Geral

Este endpoint permite atualizar um treino existente. É possível atualizar apenas a data, apenas os exercícios, ou ambos. Todos os campos são opcionais, mas pelo menos um deve ser fornecido.

---

## Endpoint

```
PUT /api/workouts/:id
```

### Parâmetros de URL

| Parâmetro | Tipo   | Obrigatório | Descrição                    |
|-----------|--------|-------------|------------------------------|
| `id`      | string | Sim         | UUID do treino a ser editado |

---

## Autenticação

Este endpoint requer autenticação via JWT Bearer Token.

**Header:**
```
Authorization: Bearer {token}
```

---

## Request Body

O body da requisição é um objeto JSON com os seguintes campos (todos opcionais, mas pelo menos um deve ser fornecido):

### Campos Disponíveis

| Campo      | Tipo     | Obrigatório | Descrição                                                                 |
|------------|----------|-------------|---------------------------------------------------------------------------|
| `date`     | string   | Não         | Data do treino no formato ISO 8601 (ex: `2024-01-15T10:00:00Z`)          |
| `exercises` | array    | Não         | Lista de exercícios do treino (mesma estrutura do create)                |

### Estrutura do Campo `exercises`

Cada exercício no array deve seguir a seguinte estrutura:

```typescript
{
  exerciseId: string;        // ID do exercício
  name: string;               // Nome do exercício (ex: "Arranco")
  abbreviation: string;       // Abreviação (ex: "A")
  isConjugated?: boolean;     // Se é exercício conjugado (opcional, padrão: false)
  config: Array<{             // Array de configurações de séries
    id: string;               // ID único da série
    sets: number;             // Número de séries (mínimo: 1)
    reps: number;              // Número de repetições (mínimo: 1)
    percentage: number;        // Porcentagem de 1RM (mínimo: 0, pode ser maior que 100%)
    weights: number[];         // Array de pesos executados (pode ser vazio [])
  }>
}
```

---

## Exemplos de Uso

### 1. Atualizar apenas a data do treino

**Request:**
```http
PUT /api/workouts/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-01-20T14:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2024-01-20T14:30:00.000Z",
  "exercises": [
    {
      "id": "exercise-uuid-1",
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
        }
      ]
    }
  ],
  "totalVolume": 9,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "message": "Treino atualizado com sucesso"
}
```

---

### 2. Atualizar apenas os exercícios

**Request:**
```http
PUT /api/workouts/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {token}
Content-Type: application/json

{
  "exercises": [
    {
      "exerciseId": "1",
      "name": "Arranco",
      "abbreviation": "A",
      "isConjugated": false,
      "config": [
        {
          "id": "series-1",
          "sets": 4,
          "reps": 3,
          "percentage": 80,
          "weights": [85, 87.5, 90, 92.5]
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
          "id": "series-2",
          "sets": 3,
          "reps": 2,
          "percentage": 85,
          "weights": [100, 105, 110]
        }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2024-01-15T10:00:00.000Z",
  "exercises": [
    {
      "id": "exercise-uuid-1",
      "exerciseId": "1",
      "name": "Arranco",
      "abbreviation": "A",
      "isConjugated": false,
      "config": [
        {
          "id": "series-1",
          "sets": 4,
          "reps": 3,
          "percentage": 80,
          "weights": [85, 87.5, 90, 92.5]
        }
      ]
    },
    {
      "id": "exercise-uuid-2",
      "exerciseId": "2",
      "name": "Arremesso",
      "abbreviation": "Ar",
      "isConjugated": false,
      "config": [
        {
          "id": "series-2",
          "sets": 3,
          "reps": 2,
          "percentage": 85,
          "weights": [100, 105, 110]
        }
      ]
    }
  ],
  "totalVolume": 18,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "message": "Treino atualizado com sucesso"
}
```

---

### 3. Atualizar data e exercícios simultaneamente

**Request:**
```http
PUT /api/workouts/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-01-20T14:30:00Z",
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
        }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "date": "2024-01-20T14:30:00.000Z",
  "exercises": [
    {
      "id": "exercise-uuid-1",
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
        }
      ]
    }
  ],
  "totalVolume": 9,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "message": "Treino atualizado com sucesso"
}
```

---

### 4. Exercício com séries ainda não executadas (weights vazio)

**Request:**
```http
PUT /api/workouts/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {token}
Content-Type: application/json

{
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
          "weights": []  // Array vazio = séries ainda não executadas
        }
      ]
    }
  ]
}
```

---

## Respostas da API

### Sucesso (200 OK)

Retorna o treino atualizado com a mesma estrutura do endpoint de criação.

**Estrutura da Resposta:**
```typescript
{
  id: string;              // UUID do treino
  date: string;            // Data do treino (ISO 8601)
  exercises: Array<{       // Lista de exercícios
    id: string;
    exerciseId: string;
    name: string;
    abbreviation: string;
    isConjugated: boolean;
    config: Array<{        // Configurações de séries
      id: string;
      sets: number;
      reps: number;
      percentage: number;
      weights: number[];
    }>;
  }>;
  totalVolume: number;     // Volume total calculado
  createdAt: string;       // Data de criação (ISO 8601)
  message: string;         // Mensagem de sucesso
}
```

---

## Códigos de Erro

### 400 Bad Request

**Causa:** Nenhum campo fornecido (nem `date` nem `exercises`)

**Response:**
```json
{
  "statusCode": 400,
  "message": "É necessário fornecer pelo menos a data ou os exercícios para atualizar o treino",
  "error": "Bad Request"
}
```

**Causa:** Dados inválidos (formato de data inválido, exercícios vazios, etc.)

**Response:**
```json
{
  "statusCode": 400,
  "message": ["date must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

---

### 403 Forbidden

**Causa:** Tentativa de editar um treino que não pertence ao usuário autenticado

**Response:**
```json
{
  "statusCode": 403,
  "message": "Você não tem permissão para acessar este treino",
  "error": "Forbidden"
}
```

---

### 404 Not Found

**Causa:** Treino não encontrado

**Response:**
```json
{
  "statusCode": 404,
  "message": "Treino não encontrado",
  "error": "Not Found"
}
```

---

### 401 Unauthorized

**Causa:** Token de autenticação inválido ou ausente

**Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Comportamentos Importantes

### 1. Atualização Parcial
- ✅ É possível atualizar apenas a data sem enviar os exercícios
- ✅ É possível atualizar apenas os exercícios sem enviar a data
- ✅ É possível atualizar ambos simultaneamente
- ❌ Não é possível enviar um body vazio (pelo menos um campo deve ser fornecido)

### 2. Status de Envio ao Treinador
- Quando a data ou os exercícios são atualizados, o status `sentToTrainer` é automaticamente resetado para `false`
- O campo `sentAt` é limpo (definido como `null`)

### 3. Cálculo de PRs (Personal Records)
- Os PRs são recalculados automaticamente **apenas quando os exercícios são atualizados**
- Se apenas a data for atualizada, os PRs não são recalculados

### 4. Volume Total
- O volume total é recalculado automaticamente quando os exercícios são atualizados
- O cálculo considera apenas séries com pesos preenchidos (`weights` não vazio)
- Fórmula: `volume = sets × reps` (somente para séries executadas)

### 5. Substituição de Exercícios
- Quando `exercises` é fornecido, **todos os exercícios existentes são substituídos** pelos novos
- Não é possível fazer merge parcial - é uma substituição completa

---

## Validações

### Campo `date`
- ✅ Deve ser uma string no formato ISO 8601
- ✅ Exemplo válido: `"2024-01-15T10:00:00Z"`
- ❌ Exemplo inválido: `"2024-01-15"` (sem hora)

### Campo `exercises`
- ✅ Se fornecido, deve ser um array com pelo menos 1 exercício
- ✅ Cada exercício deve ter `exerciseId`, `name`, `abbreviation` e `config`
- ✅ O campo `config` pode ser um array vazio `[]`
- ✅ Cada série em `config` deve ter `id`, `sets`, `reps`, `percentage` e `weights`
- ✅ O campo `weights` pode ser um array vazio `[]` (séries não executadas)
- ✅ Se `weights` não estiver vazio, o tamanho deve corresponder ao número de `sets`
- ✅ `sets` e `reps` devem ser números maiores ou iguais a 1
- ✅ `percentage` deve ser um número maior ou igual a 0 (pode ser maior que 100% se o atleta extrapolar o limite)

---

## Exemplo de Código (JavaScript/TypeScript)

### Usando Fetch API

```javascript
async function updateWorkout(workoutId, updateData) {
  const token = localStorage.getItem('authToken'); // ou sua forma de obter o token
  
  try {
    const response = await fetch(`/api/workouts/${workoutId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar treino');
    }

    const updatedWorkout = await response.json();
    return updatedWorkout;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Exemplo de uso: atualizar apenas a data
await updateWorkout('123e4567-e89b-12d3-a456-426614174000', {
  date: '2024-01-20T14:30:00Z'
});

// Exemplo de uso: atualizar exercícios
await updateWorkout('123e4567-e89b-12d3-a456-426614174000', {
  exercises: [
    {
      exerciseId: '1',
      name: 'Arranco',
      abbreviation: 'A',
      isConjugated: false,
      config: [
        {
          id: 'series-1',
          sets: 3,
          reps: 3,
          percentage: 75,
          weights: [80, 82.5, 85]
        }
      ]
    }
  ]
});
```

### Usando Axios

```javascript
import axios from 'axios';

async function updateWorkout(workoutId, updateData) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await axios.put(
      `/api/workouts/${workoutId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // Erro da API
      console.error('Erro da API:', error.response.data);
      throw new Error(error.response.data.message);
    } else {
      // Erro de rede
      console.error('Erro de rede:', error.message);
      throw error;
    }
  }
}
```

---

## Notas para o Frontend

1. **Formato de Data:** Sempre use o formato ISO 8601 completo com timezone (ex: `2024-01-15T10:00:00Z`)

2. **Atualização Parcial:** Aproveite a flexibilidade de atualizar apenas o que mudou. Se o usuário só mudou a data, não precisa reenviar todos os exercícios.

3. **Tratamento de Erros:** Sempre trate os possíveis códigos de erro (400, 403, 404, 401) e exiba mensagens apropriadas ao usuário.

4. **Loading States:** Durante a atualização, mostre um estado de loading, pois o recálculo de PRs pode levar alguns segundos.

5. **Confirmação:** Considere pedir confirmação antes de atualizar, especialmente se o treino já foi enviado ao treinador (`sentToTrainer: true`), pois a atualização resetará esse status.

6. **Validação no Frontend:** Valide os dados antes de enviar para melhorar a experiência do usuário:
   - Data deve ser válida
   - Se enviar exercícios, deve ter pelo menos 1
   - Se weights não estiver vazio, deve ter o mesmo tamanho que sets

---

## Base URL

A base URL da API deve ser configurada conforme o ambiente:

- **Desenvolvimento:** `http://localhost:3000`
- **Produção:** `https://api.weightlogx.com` (ou seu domínio)

O endpoint completo seria: `{BASE_URL}/api/workouts/{id}`

