# Ajuste Necessário no Backend: Exercícios sem Configuração

## Problema

O frontend precisa poder salvar treinos com exercícios que ainda não têm séries configuradas. Isso permite que o usuário:

1. Adicione apenas os exercícios ao treino
2. Salve o treino
3. Volte depois para configurar as séries de cada exercício

## Estrutura Atual

Atualmente, quando um exercício não tem configuração de séries, o frontend envia:

```json
{
  "date": "2024-01-15T10:00:00.000Z",
  "exercises": [
    {
      "exerciseId": "123",
      "name": "Arranco",
      "abbreviation": "ARR",
      "config": []  // Array vazio quando não há séries configuradas
    }
  ]
}
```

## Requisito do Backend

O backend precisa aceitar e processar exercícios com `config: []` (array vazio).

### Validação Esperada

1. **Aceitar `config` como array vazio**: Quando `config` é um array vazio `[]`, o backend deve:
   - Salvar o exercício no treino
   - Não criar nenhuma série/configuração
   - Permitir que o exercício seja atualizado depois com séries

2. **Não rejeitar requisições**: O backend não deve retornar erro 400/422 quando `config` é um array vazio.

3. **Atualização posterior**: Quando o usuário editar o treino e adicionar séries, o backend deve aceitar a atualização normalmente.

## Exemplo de Requisição

### Criar Treino com Exercício sem Config

```bash
POST /api/workouts
Content-Type: application/json
Authorization: Bearer {token}

{
  "date": "2024-01-15T10:00:00.000Z",
  "exercises": [
    {
      "exerciseId": "exercise-123",
      "name": "Arranco",
      "abbreviation": "ARR",
      "config": []
    },
    {
      "exerciseId": "exercise-456",
      "name": "Arremesso",
      "abbreviation": "ARR",
      "config": []
    }
  ]
}
```

### Resposta Esperada

```json
{
  "id": "workout-789",
  "date": "2024-01-15T10:00:00.000Z",
  "totalVolume": 0,
  "exercises": [
    {
      "id": "workout-exercise-1",
      "exerciseId": "exercise-123",
      "name": "Arranco",
      "abbreviation": "ARR",
      "config": []
    },
    {
      "id": "workout-exercise-2",
      "exerciseId": "exercise-456",
      "name": "Arremesso",
      "abbreviation": "ARR",
      "config": []
    }
  ],
  "message": "Treino criado com sucesso",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### Atualizar Treino Adicionando Séries

```bash
PUT /api/workouts/{workoutId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "date": "2024-01-15T10:00:00.000Z",
  "exercises": [
    {
      "exerciseId": "exercise-123",
      "name": "Arranco",
      "abbreviation": "ARR",
      "config": [
        {
          "id": "series-1",
          "sets": 3,
          "reps": 5,
          "percentage": 80,
          "weights": [40, 45, 50]
        }
      ]
    }
  ]
}
```

## Pontos Importantes

1. **`config` sempre é um array**: Nunca é `null` ou `undefined`, sempre é um array (vazio ou com séries).

2. **`totalVolume` pode ser 0**: Quando não há séries configuradas, o `totalVolume` deve ser 0.

3. **Compatibilidade**: O backend já deve aceitar exercícios com séries configuradas normalmente. Este ajuste apenas adiciona suporte para array vazio.

## Validações que DEVEM ser mantidas

- ✅ Validar que `exerciseId` existe no banco de dados
- ✅ Validar que `name` e `abbreviation` são strings não vazias
- ✅ Validar que `config` é um array (pode ser vazio)
- ✅ Validar séries quando `config.length > 0` (sets, reps, percentage, weights)

## Validações que DEVEM ser removidas/ajustadas

- ❌ NÃO rejeitar se `config.length === 0`
- ❌ NÃO exigir que `config` tenha pelo menos um elemento
- ❌ NÃO validar campos de séries quando `config` está vazio

## Testes Sugeridos

1. Criar treino com exercício sem config (`config: []`)
2. Criar treino com exercício com config (comportamento atual)
3. Criar treino misto (alguns com config, outros sem)
4. Atualizar treino adicionando séries a um exercício que não tinha
5. Atualizar treino removendo todas as séries de um exercício (deixar `config: []`)

