# API de Ranking - Documentação de Integração

## Visão Geral

A API de Ranking permite obter o ranking de usuários do mesmo centro de treinamento, ordenado por quantidade de treinos executados. Apenas usuários com pelo menos 1 treino executado aparecem no ranking.

## Endpoint

### GET `/api/ranking/center`

Retorna o ranking de usuários do mesmo centro de treinamento do usuário autenticado.

**Autenticação:** Requerida (JWT Bearer Token)

**Parâmetros de Query:**

| Parâmetro | Tipo   | Obrigatório | Descrição                                    | Valores Aceitos |
|-----------|--------|-------------|----------------------------------------------|-----------------|
| `limit`   | number | Não         | Limite de usuários a retornar                | 1-100           |

**Exemplo de Requisição:**

```bash
curl -X GET 'http://localhost:3000/api/ranking/center?limit=10' \
  -H 'Authorization: Bearer SEU_TOKEN_JWT' \
  -H 'Accept-Language: pt-BR'
```

## Resposta

### Sucesso (200 OK)

```json
{
  "users": [
    {
      "id": "a6f3a315-2529-40b7-86ef-9847593602e9",
      "name": "Ana Souza",
      "profileImageUrl": "https://example.com/profile.jpg",
      "quantidadeTreinos": 128,
      "position": 1
    },
    {
      "id": "b7g4b426-3630-51c8-97fg-0955864713f0",
      "name": "Marcos Silva",
      "profileImageUrl": null,
      "quantidadeTreinos": 122,
      "position": 2
    },
    {
      "id": "c8h5c537-4741-62d9-08gh-1066975824g1",
      "name": "Rafaela Costa",
      "profileImageUrl": "https://example.com/rafaela.jpg",
      "quantidadeTreinos": 119,
      "position": 3
    }
  ],
  "total": 25
}
```

### Estrutura da Resposta

#### `users` (Array)
Lista de usuários ordenados por quantidade de treinos (decrescente).

**Campos:**

| Campo              | Tipo    | Descrição                                    |
|--------------------|---------|----------------------------------------------|
| `id`               | string  | ID único do usuário (UUID)                  |
| `name`             | string  | Nome completo do usuário                     |
| `profileImageUrl`  | string  | URL da imagem de perfil (null se não houver) |
| `quantidadeTreinos`| number  | Quantidade de treinos executados             |
| `position`         | number  | Posição no ranking (começando em 1)          |

#### `total` (number)
Total de usuários no ranking (sem limite aplicado).

### Erros

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Limit must be a number between 1 and 100",
  "timestamp": "2025-11-13T20:00:00.000Z",
  "path": "/api/ranking/center"
}
```

**Causas:**
- `limit` não é um número válido
- `limit` está fora do intervalo 1-100

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2025-11-13T20:00:00.000Z",
  "path": "/api/ranking/center"
}
```

**Causas:**
- Token JWT ausente ou inválido
- Token expirado

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "timestamp": "2025-11-13T20:00:00.000Z",
  "path": "/api/ranking/center"
}
```

**Causas:**
- Usuário autenticado não encontrado no banco de dados

## Regras de Negócio

### Contagem de Treinos

- **Treino Executado:** Um treino é considerado "executado" se tiver pelo menos uma série com pesos preenchidos (`weights.length > 0`).
- **Filtragem:** Apenas usuários com pelo menos 1 treino executado aparecem no ranking.
- **Ordenação:** Usuários são ordenados por `quantidadeTreinos` em ordem decrescente.

### Centro de Treinamento

- O ranking retorna apenas usuários do mesmo centro de treinamento do usuário autenticado.
- Se o usuário autenticado não tiver um centro de treinamento associado (`trainingCenterId`), a resposta será um array vazio:
  ```json
  {
    "users": [],
    "total": 0
  }
  ```

### Status do Usuário

- Apenas usuários com status `ACTIVE` são incluídos no ranking.

### Limite

- Se `limit` não for fornecido, todos os usuários do ranking são retornados.
- Se `limit` for fornecido, apenas os primeiros N usuários são retornados.
- O campo `total` sempre retorna o total completo (sem limite aplicado).

## Exemplos de Uso

### Exemplo 1: Obter Top 10 do Ranking

```javascript
const response = await fetch('http://localhost:3000/api/ranking/center?limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept-Language': 'pt-BR'
  }
});

const data = await response.json();

// data.users contém os top 10 usuários
// data.total contém o total de usuários no ranking completo
```

### Exemplo 2: Obter Ranking Completo

```javascript
const response = await fetch('http://localhost:3000/api/ranking/center', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept-Language': 'pt-BR'
  }
});

const data = await response.json();

// data.users contém todos os usuários do ranking
// data.total === data.users.length (quando não há limite)
```

### Exemplo 3: Exibir Ranking no Frontend

```typescript
interface RankingUser {
  id: string;
  name: string;
  profileImageUrl: string | null;
  quantidadeTreinos: number;
  position: number;
}

interface RankingResponse {
  users: RankingUser[];
  total: number;
}

async function getCenterRanking(limit?: number): Promise<RankingResponse> {
  const url = limit 
    ? `http://localhost:3000/api/ranking/center?limit=${limit}`
    : 'http://localhost:3000/api/ranking/center';
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Accept-Language': 'pt-BR'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Uso
const ranking = await getCenterRanking(10);

ranking.users.forEach((user, index) => {
  console.log(`${user.position}. ${user.name} - ${user.quantidadeTreinos} treinos`);
});
```

## Integração com Frontend

### Mapeamento de Dados

| Campo Frontend          | Campo API                | Observações                                    |
|-------------------------|---------------------------|------------------------------------------------|
| Posição no ranking      | `position`                | Já vem ordenado e numerado                    |
| Nome do usuário         | `name`                    | Nome completo                                  |
| Foto de perfil          | `profileImageUrl`         | Pode ser `null`                                |
| Quantidade de treinos   | `quantidadeTreinos`       | Número de treinos executados                  |
| ID do usuário           | `id`                      | Usado para navegação/detalhes                  |

### Destaques Visuais

Com base na `position`, você pode aplicar estilos diferentes:

- **1º lugar:** Destaque especial (ex: cor dourada, fundo amarelo)
- **2º lugar:** Estilo padrão
- **3º lugar:** Destaque secundário (ex: cor bronze, fundo laranja)
- **Demais:** Estilo padrão

### Exemplo de Renderização

```tsx
// React/TypeScript exemplo
function RankingCard({ user }: { user: RankingUser }) {
  const getPositionStyle = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800';
    if (position === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`ranking-item ${getPositionStyle(user.position)}`}>
      <div className="position-circle">{user.position}</div>
      {user.profileImageUrl && (
        <img src={user.profileImageUrl} alt={user.name} />
      )}
      <div className="user-name">{user.name}</div>
      <div className="workout-count">{user.quantidadeTreinos} treinos</div>
    </div>
  );
}
```

## Performance

- A API conta treinos executados para cada usuário do centro.
- Para centros com muitos usuários, considere usar o parâmetro `limit` para melhorar a performance.
- O campo `total` pode ser usado para implementar paginação no frontend.

## Notas Importantes

1. **Treinos Executados:** Apenas treinos com pelo menos uma série com pesos preenchidos são contados.
2. **Ordenação:** O ranking é sempre ordenado por quantidade de treinos (decrescente).
3. **Posição:** A posição é calculada automaticamente e começa em 1.
4. **Centro de Treinamento:** O ranking é baseado no centro de treinamento do usuário autenticado.
5. **Usuários Ativos:** Apenas usuários com status `ACTIVE` aparecem no ranking.

## Changelog

### v1.0.0 (2025-11-13)
- Versão inicial da API de Ranking
- Suporte a ranking por centro de treinamento
- Parâmetro opcional `limit` para limitar resultados
- Contagem de treinos executados

