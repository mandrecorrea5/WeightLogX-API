# WeightLogX - Documentação de API e Componentes Frontend

## Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Endpoints da API](#endpoints-da-api)
4. [Componentes e Telas](#componentes-e-telas)
5. [Fluxos de Dados](#fluxos-de-dados)
6. [Validações](#validações)
7. [Autenticação](#autenticação)
8. [Upload de Arquivos](#upload-de-arquivos)
9. [Internacionalização (i18n)](#internacionalização-i18n)

---

## Visão Geral

O WeightLogX é uma aplicação React Native para registro e acompanhamento de treinos de Levantamento de Peso Olímpico. O frontend foi desenvolvido com Expo Router, TypeScript, Tamagui e React Native.

### Tecnologias Utilizadas
- **Framework**: Expo Router
- **Linguagem**: TypeScript
- **UI Library**: Tamagui
- **Validação**: Formik + Yup
- **Internacionalização**: i18next (PT-BR e EN)
- **Navegação**: Expo Router (file-based routing)

---

## Estrutura de Dados

### Tipos Principais

#### 1. Exercise (Exercício)
```typescript
type Exercise = {
  id: string;                    // UUID ou identificador único
  name: string;                   // Nome completo (ex: "Arranco")
  abbreviation: string;           // Abreviação (ex: "A")
  isConjugated?: boolean;         // Se é exercício conjugado
  conjugatedExercises?: Exercise[]; // Exercícios que compõem o conjugado
  config?: ExerciseConfig;        // Configuração de séries (usado durante treino)
};
```

**Observações**:
- `config` é usado apenas durante a criação/edição de um treino
- `isConjugated` indica que o exercício é uma combinação de outros exercícios
- Lista de exercícios disponíveis está em `src/constants/exercises.ts` (12 exercícios olímpicos)

#### 2. SeriesConfig (Configuração de Série)
```typescript
type SeriesConfig = {
  id: string;                     // UUID ou identificador único
  sets: number;                   // Número de séries (ex: 3)
  reps: number;                   // Número de repetições por série (ex: 3)
  percentage: number;              // Porcentagem de 1RM (ex: 75)
  weights?: (number | undefined)[]; // Array de pesos executados em cada série
};
```

**Observações**:
- `weights` tem o mesmo tamanho que `sets`
- `weights` pode conter `undefined` para séries ainda não executadas
- Séries são agrupadas por porcentagem na interface

#### 3. ExerciseConfig
```typescript
type ExerciseConfig = SeriesConfig[]; // Array de séries configuradas
```

#### 4. CompletedExercise (Exercício Completo)
```typescript
type CompletedExercise = {
  name: string;                   // Nome do exercício
  totalVolume: number;            // Total de repetições (soma de todas as séries)
};
```

#### 5. CompletedWorkout (Treino Completo)
```typescript
type CompletedWorkout = {
  id: string;                     // UUID
  date: Date;                     // Data do treino
  exercises: CompletedExercise[]; // Lista de exercícios executados
  totalVolume: number;            // Total de repetições do treino
  sentToTrainer: boolean;         // Se foi enviado ao treinador
};
```

#### 6. WorkoutDetails (Detalhes do Treino)
```typescript
type WorkoutDetails = {
  id: string;                     // UUID
  date: Date;                     // Data do treino
  exercises: Exercise[];           // Exercícios com configuração completa
  totalVolume: number;            // Total de repetições
};
```

**Observações**:
- `exercises` contém `Exercise` completo com `config` preenchido
- Cada `config` contém `SeriesConfig` com `weights` preenchidos

#### 7. PersonalRecord (PR)
```typescript
type PersonalRecord = {
  exerciseId: string;             // ID do exercício
  exerciseName: string;            // Nome do exercício
  abbreviation: string;            // Abreviação
  maxWeight: number;               // Maior peso levantado
  date: Date;                      // Data em que foi estabelecido
  workoutId?: string;              // ID do treino onde foi estabelecido
};
```

**Observações**:
- PRs são calculados automaticamente pelo frontend
- Backend deve validar e armazenar PRs quando um treino é salvo
- PR é considerado "recente" se foi estabelecido nos últimos 7 dias

#### 8. User (Usuário)
```typescript
type User = {
  id: string;                      // UUID
  fullName: string;                 // Nome completo (não editável após registro)
  email: string;                   // Email (não editável após registro)
  birthDate?: string;              // Data de nascimento (dd/MM/yyyy)
  phone?: string;                  // Telefone (formato: (XX) XXXXX-XXXX)
  trainingCenter?: string;         // Centro de treinamento
  profileImage?: string | null;    // URL da imagem de perfil
};
```

**Observações**:
- `fullName` e `email` são imutáveis após o registro
- `profileImage` é uma URL após upload, ou `null` se não houver imagem

#### 9. ReportData (Dados de Relatório)
```typescript
type ReportData = {
  mediaGeral: number;              // Média geral de peso
  volumeTotal: number;             // Volume total (em kg)
  prsRecentes: number;             // Número de PRs recentes
  graphData: Array<{               // Dados para gráfico
    date: string;                   // Data (formato: YYYY-MM-DD)
    value: number;                  // Valor do ponto no gráfico
  }>;
};
```

#### 10. FilterType e TimeFilter
```typescript
type FilterType = 'geral' | 'exercicio' | 'carga';
type TimeFilter = '7d' | '30d' | '3m' | '1y';
```

---

## Endpoints da API

### Autenticação

#### POST /api/auth/register
**Descrição**: Registra um novo usuário

**Request Body**:
```json
{
  "fullName": "Bruno Silva",
  "email": "bruno@example.com",
  "password": "senha123456",
  "confirmPassword": "senha123456"
}
```

**Validações**:
- `fullName`: mínimo 3 caracteres
- `email`: formato de email válido
- `password`: mínimo 8 caracteres
- `confirmPassword`: deve ser igual a `password`

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "fullName": "Bruno Silva",
    "email": "bruno@example.com",
    "birthDate": null,
    "phone": null,
    "trainingCenter": null,
    "profileImage": null
  },
  "token": "jwt_token_here",
  "message": "Conta criada com sucesso"
}
```

**Erros**:
- `400`: Dados inválidos (mensagens traduzidas baseadas em `Accept-Language`)
- `409`: Email já cadastrado (mensagem traduzida)

**Observações**:
- Mensagens de erro devem ser traduzidas baseadas no header `Accept-Language`
- Se `Accept-Language: en`, retornar: `"message": "Account created successfully"`

---

#### POST /api/auth/login
**Descrição**: Autentica um usuário

**Request Body**:
```json
{
  "email": "bruno@example.com",
  "password": "senha123456"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "fullName": "Bruno Silva",
    "email": "bruno@example.com",
    "birthDate": "15/03/1990",
    "phone": "(31) 98765-4321",
    "trainingCenter": "Academia XYZ",
    "profileImage": "https://..."
  },
  "token": "jwt_token_here"
}
```

**Erros**:
- `401`: Credenciais inválidas
- `400`: Dados inválidos

---

#### POST /api/auth/forgot-password
**Descrição**: Envia link de recuperação de senha

**Request Body**:
```json
{
  "email": "bruno@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Link de recuperação enviado para o email"
}
```

**Com Accept-Language: en**:
```json
{
  "message": "Recovery link sent to email"
}
```

**Erros**:
- `404`: Email não encontrado (mensagem traduzida)
- `400`: Email inválido (mensagem traduzida)

---

#### POST /api/auth/reset-password
**Descrição**: Redefine a senha usando token

**Request Body**:
```json
{
  "token": "reset_token",
  "newPassword": "novaSenha123456",
  "confirmPassword": "novaSenha123456"
}
```

**Response** (200 OK):
```json
{
  "message": "Senha alterada com sucesso"
}
```

**Com Accept-Language: en**:
```json
{
  "message": "Password changed successfully"
}
```

---

### Usuário

#### GET /api/user/profile
**Descrição**: Retorna dados do usuário autenticado

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "fullName": "Bruno Silva",
  "email": "bruno@example.com",
  "birthDate": "15/03/1990",
  "phone": "(31) 98765-4321",
  "trainingCenter": "Academia XYZ",
  "profileImage": "https://..."
}
```

---

#### PUT /api/user/profile
**Descrição**: Atualiza dados do perfil

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "birthDate": "15/03/1990",
  "phone": "(31) 98765-4321",
  "trainingCenter": "Academia XYZ"
}
```

**Validações**:
- `birthDate`: formato dd/MM/yyyy
- `phone`: formato (XX) XXXXX-XXXX

**Response** (200 OK):
```json
{
  "id": "uuid",
  "fullName": "Bruno Silva",
  "email": "bruno@example.com",
  "birthDate": "15/03/1990",
  "phone": "(31) 98765-4321",
  "trainingCenter": "Academia XYZ",
  "profileImage": "https://..."
}
```

---

#### PUT /api/user/password
**Descrição**: Altera senha do usuário

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "currentPassword": "senhaAntiga123",
  "newPassword": "novaSenha123456",
  "confirmPassword": "novaSenha123456"
}
```

**Validações**:
- `currentPassword`: deve ser igual à senha atual
- `newPassword`: mínimo 8 caracteres
- `confirmPassword`: deve ser igual a `newPassword`

**Response** (200 OK):
```json
{
  "message": "Senha alterada com sucesso"
}
```

**Erros**:
- `401`: Senha atual incorreta
- `400`: Dados inválidos

---

#### POST /api/user/profile-image
**Descrição**: Upload de imagem de perfil

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```
image: File
```

**Response** (200 OK):
```json
{
  "profileImage": "https://cdn.example.com/images/uuid.jpg"
}
```

**Observações**:
- Imagem deve ser quadrada (1:1)
- Tamanho máximo: 5MB
- Formatos aceitos: JPG, PNG

---

#### DELETE /api/user/profile-image
**Descrição**: Remove imagem de perfil

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "message": "Imagem removida com sucesso"
}
```

**Com Accept-Language: en**:
```json
{
  "message": "Image removed successfully"
}
```

---

### Treinos

#### POST /api/workouts
**Descrição**: Cria um novo treino

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
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
}
```

**Validações**:
- Todos os exercícios devem ter pelo menos uma série configurada
- Todas as séries devem ter `weights` preenchidos (sem `undefined`)
- `date` deve ser uma data válida

**Response** (201 Created):
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00Z",
  "exercises": [...],
  "totalVolume": 62,
  "createdAt": "2024-01-15T10:30:00Z",
  "message": "Treino salvo com sucesso"
}
```

**Com Accept-Language: en**:
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00Z",
  "exercises": [...],
  "totalVolume": 62,
  "createdAt": "2024-01-15T10:30:00Z",
  "message": "Workout saved successfully"
}
```

**Observações**:
- Backend deve calcular `totalVolume` automaticamente
- Backend deve verificar e atualizar PRs após salvar o treino
- Mensagem de sucesso deve ser traduzida baseada no `Accept-Language`
- Nomes de exercícios em `exercises` devem ser traduzidos

---

#### GET /api/workouts
**Descrição**: Lista treinos do usuário

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 20)
- `startDate` (opcional): data inicial (ISO 8601)
- `endDate` (opcional): data final (ISO 8601)

**Response** (200 OK):
```json
{
  "workouts": [
    {
      "id": "workout-uuid",
      "date": "2024-01-15T10:00:00Z",
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

**Observações**:
- Treinos ordenados por data (mais recente primeiro)
- `exercises` contém apenas nome e volume total
- Nomes de exercícios devem ser traduzidos baseados no `Accept-Language` header

---

#### GET /api/workouts/:id
**Descrição**: Retorna detalhes completos de um treino

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00Z",
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

**Erros**:
- `404`: Treino não encontrado
- `403`: Treino não pertence ao usuário

---

#### PUT /api/workouts/:id/send-to-trainer
**Descrição**: Marca treino como enviado ao treinador

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "id": "workout-uuid",
  "sentToTrainer": true,
  "sentAt": "2024-01-15T11:00:00Z"
}
```

---

### Personal Records (PRs)

#### GET /api/prs
**Descrição**: Lista PRs do usuário

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `exerciseId` (opcional): filtrar por exercício
- `recent` (opcional): apenas PRs recentes (últimos 7 dias)

**Response** (200 OK):
```json
{
  "prs": [
    {
      "exerciseId": "1",
      "exerciseName": "Arranco",
      "abbreviation": "A",
      "maxWeight": 95,
      "date": "2024-01-15T10:00:00Z",
      "workoutId": "workout-uuid"
    },
    {
      "exerciseId": "2",
      "exerciseName": "Arremesso",
      "abbreviation": "Ar",
      "maxWeight": 125,
      "date": "2024-01-14T10:00:00Z",
      "workoutId": "workout-uuid-2"
    }
  ]
}
```

**Observações**:
- PRs ordenados por peso (maior primeiro)
- PR é considerado "recente" se foi estabelecido nos últimos 7 dias
- Nomes de exercícios (`exerciseName`) devem ser traduzidos baseados no `Accept-Language` header

---

### Relatórios

#### GET /api/reports
**Descrição**: Retorna dados para relatórios

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `type`: `geral` | `exercicio` | `carga`
- `timeFilter`: `7d` | `30d` | `3m` | `1y`
- `exerciseId` (opcional): se `type=exercicio`, filtrar por exercício específico

**Response** (200 OK):
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

**Observações**:
- `mediaGeral`: média de peso levantado no período
- `volumeTotal`: soma de todos os pesos levantados (em kg)
- `prsRecentes`: número de PRs estabelecidos no período
- `graphData`: dados para gráfico de linha (mês a mês)
- Labels e mensagens devem ser traduzidos baseados no `Accept-Language` header

---

## Componentes e Telas

### Telas de Autenticação

#### LoginScreen (`app/index.tsx`)
**Descrição**: Tela de login

**Funcionalidades**:
- Login com email e senha
- Link para recuperação de senha
- Link para registro
- Seletor de idioma (PT-BR/EN)

**Endpoints Utilizados**:
- `POST /api/auth/login`

**Dados Enviados**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Dados Esperados**:
- `user`: objeto User completo
- `token`: JWT token

---

#### RegisterScreen (`app/register.tsx`)
**Descrição**: Tela de registro

**Funcionalidades**:
- Registro com nome, email e senha
- Validação de senha (mínimo 8 caracteres)
- Confirmação de senha
- Seletor de idioma

**Endpoints Utilizados**:
- `POST /api/auth/register`

**Dados Enviados**:
```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

---

#### ForgotPasswordScreen (`app/forgot-password.tsx`)
**Descrição**: Tela de recuperação de senha

**Funcionalidades**:
- Envio de link de recuperação
- Validação de email

**Endpoints Utilizados**:
- `POST /api/auth/forgot-password`

---

### Telas Autenticadas

#### HomeScreen (`app/home.tsx`)
**Descrição**: Tela inicial do aplicativo

**Funcionalidades**:
- Exibe último treino realizado
- Botão para registrar novo treino
- Link para PRs
- Navegação para detalhes do último treino

**Endpoints Utilizados**:
- `GET /api/workouts?limit=1` (para último treino)

**Dados Esperados**:
- Último treino com resumo (exercícios, volume total)

---

#### TrainScreen (`app/train.tsx`)
**Descrição**: Tela de registro de treino

**Funcionalidades**:
- Adicionar exercícios (via modal)
- Conjugar exercícios
- Configurar séries, repetições e porcentagem
- Inserir pesos executados
- Validação visual de séries completas
- Excluir exercícios

**Endpoints Utilizados**:
- `POST /api/workouts` (ao salvar treino)

**Dados Enviados**:
- Objeto `WorkoutDetails` completo

**Observações**:
- Estado local mantém exercícios até salvar
- Validação visual: borda verde quando peso inserido, check quando série completa
- Exercício só é marcado como completo quando todas as séries estão validadas

---

#### HistoryScreen (`app/history.tsx`)
**Descrição**: Histórico de treinos

**Funcionalidades**:
- Lista treinos agrupados por data
- Enviar treino ao treinador
- Navegação para detalhes do treino

**Endpoints Utilizados**:
- `GET /api/workouts` (lista paginada)
- `PUT /api/workouts/:id/send-to-trainer`

**Dados Esperados**:
- Array de `CompletedWorkout`

**Observações**:
- Agrupamento por data: "HOJE", "ONTEM", ou data formatada
- Ordenação: mais recente primeiro

---

#### WorkoutDetailsScreen (`app/workout-details.tsx`)
**Descrição**: Detalhes completos de um treino

**Funcionalidades**:
- Exibe exercícios com séries completas
- Mostra pesos executados em cada série
- Calcula volume por exercício

**Endpoints Utilizados**:
- `GET /api/workouts/:id`

**Dados Esperados**:
- Objeto `WorkoutDetails` completo

---

#### PRsScreen (`app/prs.tsx`)
**Descrição**: Tela de Personal Records

**Funcionalidades**:
- Lista todos os PRs
- Destaca PRs recentes (últimos 7 dias)
- Ordenação por peso

**Endpoints Utilizados**:
- `GET /api/prs`

**Dados Esperados**:
- Array de `PersonalRecord`

**Observações**:
- PRs são calculados automaticamente pelo backend ao salvar treino
- Frontend apenas exibe os dados

---

#### ReportsScreen (`app/reports.tsx`)
**Descrição**: Tela de relatórios e progresso

**Funcionalidades**:
- Filtros por tipo (geral, exercício, carga)
- Filtros por período (30 dias, 3 meses, 6 meses, 12 meses)
- Gráfico de evolução
- Métricas de volume e PRs

**Endpoints Utilizados**:
- `GET /api/reports?type={type}&timeFilter={filter}`

**Dados Esperados**:
- Objeto `ReportData`

---

#### EditProfileScreen (`app/edit-profile.tsx`)
**Descrição**: Edição de perfil

**Funcionalidades**:
- Atualizar data de nascimento, telefone, centro de treinamento
- Alterar senha
- Upload/remover foto de perfil
- Campos de nome e email são read-only

**Endpoints Utilizados**:
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `PUT /api/user/password`
- `POST /api/user/profile-image`
- `DELETE /api/user/profile-image`

**Dados Enviados**:
- Para atualização de perfil: `birthDate`, `phone`, `trainingCenter`
- Para alteração de senha: `currentPassword`, `newPassword`, `confirmPassword`
- Para upload de imagem: FormData com arquivo

---

### Componentes Modais

#### ExerciseSelectionModal (`src/components/features/ExerciseSelectionModal.tsx`)
**Descrição**: Modal para seleção de exercícios

**Funcionalidades**:
- Busca de exercícios (autocomplete)
- Seleção múltipla
- Opção de conjugar exercícios

**Dados Utilizados**:
- Lista estática de exercícios (`OLYMPIC_EXERCISES`)
- No futuro, pode vir de `GET /api/exercises`

**Observações**:
- Lista de exercícios está em `src/constants/exercises.ts`
- Backend pode fornecer lista dinâmica no futuro

---

#### ExerciseConfigModal (`src/components/features/ExerciseConfigModal.tsx`)
**Descrição**: Modal para configurar séries de um exercício

**Funcionalidades**:
- Adicionar múltiplas séries
- Configurar sets, reps e porcentagem
- Remover séries

**Dados Gerados**:
- Array de `SeriesConfig`

**Observações**:
- Pesos são inseridos diretamente no card do exercício (não no modal)
- Modal apenas configura a estrutura das séries

---

### Componentes de Layout

#### AuthenticatedLayout (`src/components/layout/AuthenticatedLayout.tsx`)
**Descrição**: Layout base para telas autenticadas

**Funcionalidades**:
- Header com informações do usuário
- Drawer de menu
- Navegação inferior

---

#### UserDrawer (`src/components/layout/UserDrawer.tsx`)
**Descrição**: Menu lateral do usuário

**Funcionalidades**:
- Navegação entre telas
- Editar perfil
- Logout
- Toggle de tema (dark/light)
- Seletor de idioma

---

#### BottomNavigation (`src/components/layout/BottomNavigation.tsx`)
**Descrição**: Navegação inferior

**Funcionalidades**:
- Navegação entre telas principais (Home, Train, History, Reports)

---

## Fluxos de Dados

### Fluxo de Registro de Treino

1. **Usuário acessa TrainScreen**
   - Estado local: `exercises: Exercise[] = []`

2. **Usuário adiciona exercício**
   - Abre `ExerciseSelectionModal`
   - Seleciona exercício(s)
   - Opcionalmente marca "conjugar"
   - Modal fecha e exercício é adicionado ao estado local

3. **Usuário configura séries**
   - Clica no ícone de engrenagem no exercício
   - Abre `ExerciseConfigModal`
   - Adiciona séries (sets, reps, porcentagem)
   - Salva configuração
   - Exercício no estado local recebe `config: ExerciseConfig`

4. **Usuário insere pesos**
   - Expande card do exercício (accordion)
   - Insere pesos diretamente nos inputs
   - Estado local atualiza `weights` em cada `SeriesConfig`
   - Validação visual: borda verde quando peso inserido, check quando série completa

5. **Usuário salva treino**
   - Clica em botão "Salvar" (não implementado ainda)
   - Frontend valida que todos os exercícios têm séries configuradas
   - Frontend valida que todos os pesos estão preenchidos
   - Envia `POST /api/workouts` com dados completos
   - Backend salva treino e atualiza PRs
   - Frontend navega para HomeScreen ou HistoryScreen

---

### Fluxo de Cálculo de PRs

1. **Treino é salvo**
   - Backend recebe `WorkoutDetails` com exercícios e pesos

2. **Backend processa cada exercício**
   - Para cada exercício, encontra o maior peso em `weights`
   - Compara com PR atual do exercício
   - Se maior, atualiza PR

3. **Backend retorna treino salvo**
   - Frontend pode atualizar lista de PRs

**Observações**:
- PR é calculado pelo maior peso executado em qualquer série do exercício
- PR é por exercício (não por variação, ex: Arranco e Arranco de Força são diferentes)
- PR recente: estabelecido nos últimos 7 dias

---

### Fluxo de Upload de Foto de Perfil

1. **Usuário acessa EditProfileScreen**
   - Carrega dados do perfil via `GET /api/user/profile`

2. **Usuário clica em foto de perfil**
   - Abre modal de seleção (câmera ou galeria)
   - Frontend usa `expo-image-picker`

3. **Usuário seleciona/tira foto**
   - Frontend recebe URI local da imagem
   - Imagem é exibida (ainda não salva)

4. **Usuário salva perfil**
   - Se há nova imagem, frontend faz upload via `POST /api/user/profile-image`
   - Backend retorna URL da imagem
   - Frontend atualiza perfil com nova URL via `PUT /api/user/profile`

**Observações**:
- Imagem deve ser processada antes do upload (redimensionar, comprimir)
- Backend deve validar formato e tamanho
- Backend deve armazenar imagem e retornar URL pública

---

## Validações

### Frontend (Yup Schemas)

#### Login
- Email: formato válido, obrigatório
- Senha: mínimo 6 caracteres, obrigatório

#### Registro
- Nome completo: mínimo 3 caracteres, obrigatório
- Email: formato válido, obrigatório
- Senha: mínimo 8 caracteres, obrigatório
- Confirmação de senha: deve ser igual à senha

#### Edição de Perfil
- Data de nascimento: formato dd/MM/yyyy (opcional)
- Telefone: formato (XX) XXXXX-XXXX (opcional)
- Centro de treinamento: texto livre (opcional)
- Senha atual: obrigatória se nova senha fornecida
- Nova senha: mínimo 8 caracteres se fornecida
- Confirmação de senha: deve ser igual à nova senha

### Backend (Validações Necessárias)

#### Autenticação
- Email único no registro
- Hash de senha (bcrypt)
- Validação de JWT token
- Rate limiting em login/registro

#### Treinos
- Todos os exercícios devem ter pelo menos uma série
- Todas as séries devem ter pesos preenchidos (sem `undefined`)
- Data do treino não pode ser futura (opcional, dependendo do requisito)
- Validação de exercícios existentes (se backend fornecer lista)

#### PRs
- PR só é atualizado se novo peso for maior que o anterior
- Data do PR é a data do treino onde foi estabelecido

#### Upload de Imagem
- Formato: JPG, PNG
- Tamanho máximo: 5MB
- Dimensões: recomendado quadrado (1:1)
- Validação de conteúdo (não apenas extensão)

---

## Autenticação

### Estratégia
- **JWT (JSON Web Tokens)**
- Token enviado no header `Authorization: Bearer {token}`
- Token deve expirar (recomendado: 7 dias)
- Refresh token opcional

### Fluxo
1. Usuário faz login/registro
2. Backend retorna JWT token
3. Frontend armazena token (AsyncStorage ou SecureStore)
4. Frontend envia token em todas as requisições autenticadas
5. Backend valida token em cada requisição

### Logout
- Frontend remove token do armazenamento
- Backend pode invalidar token (blacklist) se necessário

---

## Upload de Arquivos

### Foto de Perfil

**Formato**:
- Content-Type: `multipart/form-data`
- Campo: `image`

**Validações Backend**:
- Formato: JPG, PNG
- Tamanho máximo: 5MB
- Dimensões: processar para 512x512 ou similar

**Armazenamento**:
- Opção 1: Armazenar em servidor (ex: `/uploads/profiles/{userId}.jpg`)
- Opção 2: Armazenar em cloud storage (AWS S3, Cloudinary, etc.)
- Retornar URL pública da imagem

**Processamento**:
- Redimensionar para tamanho padrão
- Comprimir para reduzir tamanho
- Gerar thumbnail se necessário

---

## Observações Importantes

### Dados Mockados Atualmente
- Lista de exercícios está em `src/constants/exercises.ts`
- PRs são calculados no frontend a partir de treinos mockados
- Relatórios usam dados mockados

### Funcionalidades Pendentes
- Botão "Salvar Treino" não está implementado em TrainScreen
- Integração real com backend não está implementada
- Refresh token não está implementado
- Notificações push não estão implementadas

### Melhorias Futuras
- Backend pode fornecer lista dinâmica de exercícios
- Backend pode calcular PRs automaticamente
- Backend pode fornecer estatísticas avançadas
- Backend pode implementar sistema de treinadores
- Backend pode enviar notificações quando treino é enviado ao treinador

---

## Exemplo de Requisição Completa

### Criar Treino

```http
POST /api/workouts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
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
    }
  ]
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2024-01-15T10:00:00Z",
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
        },
        {
          "id": "series-2",
          "sets": 2,
          "reps": 2,
          "percentage": 80,
          "weights": [87.5, 90]
        }
      ]
    }
  ],
  "totalVolume": 15,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Internacionalização (i18n)

### Visão Geral

O WeightLogX suporta **múltiplos idiomas** (PT-BR e EN). Todos os endpoints que retornam texto devem suportar tradução baseada no idioma solicitado pelo cliente.

### Como Especificar o Idioma

O idioma pode ser especificado de duas formas:

1. **Header HTTP (Recomendado)**
   ```
   Accept-Language: pt-BR
   ```
   ou
   ```
   Accept-Language: en
   ```

2. **Query Parameter (Alternativo)**
   ```
   GET /api/workouts?locale=pt-BR
   ```

**Prioridade**: Se ambos forem fornecidos, o header `Accept-Language` tem prioridade.

**Idioma Padrão**: Se nenhum idioma for especificado, o backend deve retornar **PT-BR** como padrão.

### Campos que Devem ser Traduzidos

#### Mensagens de Erro e Sucesso
- Mensagens de validação
- Mensagens de erro HTTP
- Mensagens de sucesso

#### Nomes de Exercícios
- Campo `name` em objetos `Exercise`
- Nomes de exercícios podem ter traduções diferentes (ex: "Arranco" → "Snatch")

#### Mensagens do Sistema
- Mensagens de confirmação
- Labels de status
- Mensagens de notificação

### Estrutura de Resposta com Traduções

#### Opção 1: Objeto com Múltiplos Idiomas (Recomendado para Exercícios)
```json
{
  "id": "1",
  "name": {
    "pt-BR": "Arranco",
    "en": "Snatch"
  },
  "abbreviation": "A"
}
```

#### Opção 2: Campo Único Baseado no Idioma Solicitado (Recomendado para Mensagens)
```json
{
  "message": "Treino salvo com sucesso"
}
```
ou
```json
{
  "message": "Workout saved successfully"
}
```

### Endpoints Atualizados com i18n

#### GET /api/exercises
**Descrição**: Lista todos os exercícios disponíveis (com traduções)

**Headers**:
```
Accept-Language: pt-BR
```

**Response** (200 OK):
```json
{
  "exercises": [
    {
      "id": "1",
      "name": {
        "pt-BR": "Arranco",
        "en": "Snatch"
      },
      "abbreviation": "A"
    },
    {
      "id": "2",
      "name": {
        "pt-BR": "Arremesso",
        "en": "Clean and Jerk"
      },
      "abbreviation": "Ar"
    }
  ]
}
```

**Observações**:
- Se `Accept-Language: en`, frontend pode usar `exercise.name.en`
- Se `Accept-Language: pt-BR`, frontend pode usar `exercise.name["pt-BR"]`
- Ou backend pode retornar apenas o campo traduzido baseado no header

---

#### POST /api/auth/register
**Mensagens de Erro com Tradução**

**Headers**:
```
Accept-Language: pt-BR
```

**Request Body**:
```json
{
  "fullName": "João",
  "email": "email@exemplo.com",
  "password": "123"
}
```

**Response** (400 Bad Request):
```json
{
  "error": "validation_error",
  "message": "Dados inválidos",
  "errors": [
    {
      "field": "fullName",
      "message": "Nome deve ter no mínimo 3 caracteres"
    },
    {
      "field": "password",
      "message": "Senha deve ter no mínimo 8 caracteres"
    }
  ]
}
```

**Com Accept-Language: en**:
```json
{
  "error": "validation_error",
  "message": "Invalid data",
  "errors": [
    {
      "field": "fullName",
      "message": "Name must be at least 3 characters"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

#### POST /api/workouts
**Mensagens de Sucesso/Erro com Tradução**

**Headers**:
```
Authorization: Bearer {token}
Accept-Language: pt-BR
```

**Response** (201 Created):
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00Z",
  "message": "Treino salvo com sucesso",
  "exercises": [...]
}
```

**Com Accept-Language: en**:
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00Z",
  "message": "Workout saved successfully",
  "exercises": [...]
}
```

---

#### GET /api/workouts/:id
**Exercícios com Nomes Traduzidos**

**Headers**:
```
Authorization: Bearer {token}
Accept-Language: en
```

**Response** (200 OK):
```json
{
  "id": "workout-uuid",
  "date": "2024-01-15T10:00:00Z",
  "exercises": [
    {
      "id": "1",
      "name": "Snatch",
      "abbreviation": "A",
      "config": [...]
    }
  ]
}
```

**Observações**:
- Backend retorna `name` já traduzido baseado no `Accept-Language`
- Frontend não precisa fazer tradução adicional

---

#### GET /api/reports
**Labels e Mensagens Traduzidas**

**Headers**:
```
Authorization: Bearer {token}
Accept-Language: pt-BR
```

**Response** (200 OK):
```json
{
  "mediaGeral": 142,
  "volumeTotal": 8450,
  "prsRecentes": 3,
  "labels": {
    "mediaGeral": "Média Geral",
    "volumeTotal": "Volume Total",
    "prsRecentes": "PRs Recentes"
  },
  "graphData": [...]
}
```

**Com Accept-Language: en**:
```json
{
  "mediaGeral": 142,
  "volumeTotal": 8450,
  "prsRecentes": 3,
  "labels": {
    "mediaGeral": "General Average",
    "volumeTotal": "Total Volume",
    "prsRecentes": "Recent PRs"
  },
  "graphData": [...]
}
```

---

### Implementação no Backend

#### Estratégia Recomendada

1. **Middleware de Idioma**
   - Extrair `Accept-Language` header
   - Validar se idioma é suportado (pt-BR, en)
   - Fallback para pt-BR se inválido
   - Disponibilizar idioma no contexto da requisição

2. **Serviço de Tradução**
   - Manter arquivos de tradução (similar ao frontend)
   - Função `t(key: string, locale: string): string`
   - Suporte a interpolação (ex: `"Total: {{count}} reps"`)

3. **Modelo de Dados**
   - Exercícios: armazenar traduções no banco ou arquivo de configuração
   - Mensagens: usar chaves de tradução

#### Exemplo de Estrutura de Traduções no Backend

```typescript
// translations/pt-BR.json
{
  "workout": {
    "saved": "Treino salvo com sucesso",
    "notFound": "Treino não encontrado",
    "validation": {
      "exercisesRequired": "Pelo menos um exercício é obrigatório",
      "weightsRequired": "Todos os pesos devem ser preenchidos"
    }
  },
  "exercise": {
    "snatch": "Arranco",
    "cleanAndJerk": "Arremesso",
    "frontSquat": "Front Squat"
  }
}

// translations/en.json
{
  "workout": {
    "saved": "Workout saved successfully",
    "notFound": "Workout not found",
    "validation": {
      "exercisesRequired": "At least one exercise is required",
      "weightsRequired": "All weights must be filled"
    }
  },
  "exercise": {
    "snatch": "Snatch",
    "cleanAndJerk": "Clean and Jerk",
    "frontSquat": "Front Squat"
  }
}
```

#### Exemplo de Uso no Endpoint

```typescript
// Exemplo Node.js/Express
app.post('/api/workouts', authenticate, async (req, res) => {
  const locale = req.locale || 'pt-BR'; // Extraído do middleware
  
  try {
    const workout = await createWorkout(req.body);
    
    res.status(201).json({
      ...workout,
      message: t('workout.saved', locale)
    });
  } catch (error) {
    res.status(400).json({
      error: 'validation_error',
      message: t('workout.validation.exercisesRequired', locale)
    });
  }
});
```

---

### Lista de Endpoints que Precisam de Tradução

#### Obrigatório
- ✅ `POST /api/auth/register` - Mensagens de erro
- ✅ `POST /api/auth/login` - Mensagens de erro
- ✅ `POST /api/auth/forgot-password` - Mensagens de sucesso/erro
- ✅ `POST /api/workouts` - Mensagens de sucesso/erro
- ✅ `GET /api/workouts` - Nomes de exercícios (se aplicável)
- ✅ `GET /api/workouts/:id` - Nomes de exercícios
- ✅ `GET /api/exercises` - Nomes de exercícios
- ✅ `GET /api/reports` - Labels e mensagens
- ✅ `PUT /api/user/profile` - Mensagens de sucesso/erro
- ✅ `PUT /api/user/password` - Mensagens de sucesso/erro

#### Opcional (Mas Recomendado)
- `GET /api/prs` - Mensagens e labels
- `PUT /api/workouts/:id/send-to-trainer` - Mensagens de sucesso

---

### Validação de Idioma

**Idiomas Suportados**:
- `pt-BR` (Português do Brasil)
- `en` (English)

**Comportamento**:
- Se idioma não for suportado → fallback para `pt-BR`
- Se `Accept-Language` não for fornecido → usar `pt-BR`
- Suportar variações como `pt`, `pt-BR`, `en-US`, `en` (todas mapeadas para `pt-BR` ou `en`)

---

## Conclusão

Este documento fornece uma visão completa da estrutura do frontend e das APIs necessárias para o backend. O backend deve implementar todos os endpoints descritos e seguir as validações e estruturas de dados especificadas.

**Importante**: Todos os endpoints que retornam texto devem suportar internacionalização através do header `Accept-Language` ou query parameter `locale`.

Para dúvidas ou esclarecimentos, consulte o código fonte nos arquivos mencionados ou entre em contato com a equipe de desenvolvimento.

