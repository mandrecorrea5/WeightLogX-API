# WeightLogX API - Arquitetura e Proposta Técnica

## 📋 Análise da Documentação

### Requisitos Identificados

1. **Autenticação & Autorização**
   - JWT tokens com expiração
   - Registro, login, recuperação de senha
   - Proteção de rotas autenticadas

2. **Domínios Principais**
   - **Auth**: Autenticação e autorização
   - **User**: Gerenciamento de usuários e perfil
   - **Workouts**: Treinos e exercícios
   - **PRs**: Personal Records
   - **Reports**: Relatórios e estatísticas

3. **Funcionalidades Especiais**
   - Internacionalização (i18n) - PT-BR e EN
   - Upload de imagens de perfil
   - Cálculo automático de PRs
   - Validações complexas de treinos
   - Paginação e filtros

4. **Requisitos Não-Funcionais**
   - Rate limiting
   - Validação robusta
   - Tratamento de erros padronizado
   - Logging estruturado
   - Testes unitários e e2e

---

## 🏗️ Arquitetura Proposta

### Princípios Aplicados

#### 1. **Clean Architecture / Hexagonal Architecture**
- Separação clara entre camadas
- Dependências apontam para dentro (dependency rule)
- Domínio independente de frameworks

#### 2. **SOLID Principles**
- **S**ingle Responsibility: Cada classe tem uma responsabilidade
- **O**pen/Closed: Aberto para extensão, fechado para modificação
- **L**iskov Substitution: Interfaces bem definidas
- **I**nterface Segregation: Interfaces específicas
- **D**ependency Inversion: Dependências de abstrações, não implementações

#### 3. **Domain-Driven Design (DDD)**
- Entidades de domínio ricas
- Value Objects para valores imutáveis
- Aggregates para consistência
- Repositories para abstração de dados

### Estrutura de Pastas

```
src/
├── common/                    # Código compartilhado
│   ├── decorators/           # Decorators customizados
│   ├── filters/              # Exception filters
│   ├── guards/               # Guards (auth, roles)
│   ├── interceptors/         # Interceptors (logging, transform)
│   ├── pipes/               # Pipes customizados
│   ├── interfaces/           # Interfaces compartilhadas
│   └── utils/                # Utilitários
│
├── config/                    # Configurações
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── upload.config.ts
│
├── database/                  # Camada de dados
│   ├── entities/             # Entidades TypeORM/Prisma
│   ├── migrations/           # Migrações
│   └── seeds/                # Seeders
│
├── i18n/                      # Internacionalização
│   ├── locales/
│   │   ├── pt-BR.json
│   │   └── en.json
│   └── i18n.module.ts
│
├── modules/                    # Módulos de domínio
│   ├── auth/
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entities/         # Entidades de domínio
│   │   ├── guards/           # Guards específicos
│   │   ├── strategies/       # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   └── auth.module.ts
│   │
│   ├── user/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   └── user.module.ts
│   │
│   ├── workouts/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── workouts.controller.ts
│   │   ├── workouts.service.ts
│   │   ├── workouts.repository.ts
│   │   └── workouts.module.ts
│   │
│   ├── prs/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── prs.controller.ts
│   │   ├── prs.service.ts
│   │   ├── prs.repository.ts
│   │   └── prs.module.ts
│   │
│   └── reports/
│       ├── dto/
│       ├── reports.controller.ts
│       ├── reports.service.ts
│       └── reports.module.ts
│
└── main.ts                     # Bootstrap da aplicação
```

---

## 📚 Bibliotecas Recomendadas

### Core Dependencies

```json
{
  "@nestjs/config": "^3.x",           // Gerenciamento de configurações
  "@nestjs/jwt": "^10.x",             // JWT tokens
  "@nestjs/passport": "^10.x",        // Autenticação
  "@nestjs/throttler": "^5.x",        // Rate limiting
  "@nestjs/serve-static": "^4.x",     // Servir arquivos estáticos
  "passport": "^0.7.x",               // Estratégias de autenticação
  "passport-jwt": "^4.x",             // JWT strategy
  "bcrypt": "^5.x",                   // Hash de senhas
  "class-validator": "^0.14.x",       // Validação de DTOs
  "class-transformer": "^0.5.x",      // Transformação de objetos
  "i18next": "^23.x",                 // Internacionalização
  "nestjs-i18n": "^10.x",             // Integração i18n com NestJS
  "multer": "^1.4.x",                 // Upload de arquivos
  "@nestjs/platform-express": "^11.x",// Já incluído
  "typeorm": "^0.3.x",                // ORM (ou Prisma)
  "@nestjs/typeorm": "^10.x",         // Integração TypeORM
  "pg": "^8.x",                       // Driver PostgreSQL
  "uuid": "^9.x",                     // Geração de UUIDs
  "date-fns": "^3.x",                 // Manipulação de datas
  "sharp": "^0.33.x"                  // Processamento de imagens
}
```

### Dev Dependencies

```json
{
  "@types/bcrypt": "^5.x",
  "@types/passport-jwt": "^4.x",
  "@types/multer": "^1.4.x",
  "@types/uuid": "^9.x",
  "typeorm-seeding": "^1.x"           // Para seeders (opcional)
}
```

---

## 🎯 Padrões de Implementação

### 1. DTOs (Data Transfer Objects)

**Princípio**: Usar DTOs para todas as entradas e saídas da API

```typescript
// dto/create-workout.dto.ts
import { IsArray, IsDate, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkoutDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseConfigDto)
  exercises: ExerciseConfigDto[];
}
```

### 2. Services (Lógica de Negócio)

**Princípio**: Services contêm a lógica de negócio, não dependem de HTTP

```typescript
// workouts.service.ts
@Injectable()
export class WorkoutsService {
  constructor(
    private readonly workoutsRepository: WorkoutsRepository,
    private readonly prsService: PrsService,
    private readonly i18n: I18nService,
  ) {}

  async create(userId: string, createWorkoutDto: CreateWorkoutDto): Promise<Workout> {
    // Validação de negócio
    // Criação do treino
    // Cálculo de volume
    // Atualização de PRs
    // Retorno
  }
}
```

### 3. Repositories (Acesso a Dados)

**Princípio**: Abstração da camada de dados, facilita testes

```typescript
// workouts.repository.ts
@Injectable()
export class WorkoutsRepository {
  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly repository: Repository<WorkoutEntity>,
  ) {}

  async findByUserId(userId: string, options?: FindOptions): Promise<WorkoutEntity[]> {
    return this.repository.find({
      where: { userId },
      ...options,
    });
  }
}
```

### 4. Guards (Autorização)

**Princípio**: Guards para proteger rotas e validar permissões

```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean {
    return super.canActivate(context);
  }
}
```

### 5. Exception Filters

**Princípio**: Tratamento centralizado de exceções

```typescript
// filters/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // Tratamento padronizado
    // Logging
    // Resposta traduzida
  }
}
```

### 6. Interceptors

**Princípio**: Transformação de respostas e logging

```typescript
// interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

---

## 🔐 Autenticação e Segurança

### Estratégia JWT

```typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.usersService.findById(payload.sub);
  }
}
```

### Hash de Senhas

```typescript
// Usar bcrypt com salt rounds 10+
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

### Rate Limiting

```typescript
// Usar @nestjs/throttler
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController {}
```

---

## 🌍 Internacionalização (i18n)

### Configuração

```typescript
// i18n/i18n.module.ts
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'pt-BR',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(__dirname, '/locales/'),
        watch: true,
      },
    }),
  ],
})
export class AppI18nModule {}
```

### Uso em Services

```typescript
// Extrair locale do request
const locale = this.i18n.resolveLanguage(context);
const message = this.i18n.translate('workout.saved', { lang: locale });
```

---

## 🗄️ Banco de Dados

### Opções: TypeORM ou Prisma

**Recomendação**: TypeORM (mais integrado com NestJS)

### Entidades Principais

1. **User**
   - id, email, fullName, passwordHash
   - birthDate, phone, trainingCenter, profileImageUrl

2. **Workout**
   - id, userId, date, totalVolume, sentToTrainer
   - Relação: WorkoutExercise (one-to-many)

3. **WorkoutExercise**
   - id, workoutId, exerciseId, name, abbreviation

4. **SeriesConfig**
   - id, workoutExerciseId, sets, reps, percentage
   - weights (JSON array)

5. **PersonalRecord**
   - id, userId, exerciseId, maxWeight, date, workoutId

### Migrations

```typescript
// Usar TypeORM migrations
// Executar com: npm run typeorm migration:run
```

---

## 📤 Upload de Arquivos

### Configuração Multer

```typescript
// user/user.controller.ts
@Post('profile-image')
@UseInterceptors(FileInterceptor('image'))
async uploadProfileImage(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: User,
) {
  // Validação de tipo e tamanho
  // Processamento com Sharp
  // Upload para storage (S3 ou local)
  // Retorno da URL
}
```

### Validação de Imagem

```typescript
// pipes/image-validation.pipe.ts
@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    // Validar tipo (JPG, PNG)
    // Validar tamanho (5MB)
    // Validar dimensões (1:1)
    return file;
  }
}
```

---

## ✅ Validações

### Validação de DTOs

```typescript
// Usar class-validator
// Habilitar globalmente no main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

### Validações Customizadas

```typescript
// validators/is-date-format.validator.ts
@ValidatorConstraint({ name: 'isDateFormat', async: false })
export class IsDateFormatConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
  }
}
```

---

## 🧪 Testes

### Estrutura de Testes

```
src/
├── modules/
│   └── workouts/
│       ├── workouts.service.spec.ts
│       ├── workouts.controller.spec.ts
│       └── workouts.repository.spec.ts
└── test/
    └── e2e/
        ├── auth.e2e-spec.ts
        └── workouts.e2e-spec.ts
```

### Exemplo de Teste Unitário

```typescript
describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let repository: WorkoutsRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: WorkoutsRepository,
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(WorkoutsService);
    repository = module.get(WorkoutsRepository);
  });

  it('should create a workout', async () => {
    // Test implementation
  });
});
```

---

## 📝 Logging

### Configuração

```typescript
// Usar Logger do NestJS
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(WorkoutsService.name);

this.logger.log('Creating workout');
this.logger.error('Error creating workout', error.stack);
```

### Estrutura de Logs

- Logs estruturados (JSON em produção)
- Níveis: log, error, warn, debug
- Contexto sempre incluído

---

## 🚀 Performance

### Otimizações

1. **Paginação**: Sempre usar em listagens
2. **Lazy Loading**: Evitar N+1 queries
3. **Caching**: Cache de exercícios (dados estáticos)
4. **Indexação**: Índices em campos frequentes (userId, date)
5. **Compressão**: Habilitar gzip

---

## 📋 Checklist de Implementação

### Fase 1: Infraestrutura Base
- [ ] Configurar TypeORM/Prisma
- [ ] Configurar i18n
- [ ] Configurar JWT
- [ ] Criar exception filters
- [ ] Criar guards base
- [ ] Configurar rate limiting

### Fase 2: Módulo Auth
- [ ] Entidades e migrations
- [ ] DTOs de registro e login
- [ ] Service de autenticação
- [ ] Controller de autenticação
- [ ] Testes

### Fase 3: Módulo User
- [ ] Entidades e migrations
- [ ] DTOs de perfil
- [ ] Service de usuário
- [ ] Upload de imagem
- [ ] Controller de usuário

### Fase 4: Módulo Workouts
- [ ] Entidades e migrations
- [ ] DTOs de treino
- [ ] Service de treinos
- [ ] Cálculo de volume
- [ ] Controller de treinos

### Fase 5: Módulo PRs
- [ ] Entidades e migrations
- [ ] Service de PRs
- [ ] Cálculo automático
- [ ] Controller de PRs

### Fase 6: Módulo Reports
- [ ] Service de relatórios
- [ ] Agregações de dados
- [ ] Controller de relatórios

---

## 🎓 Boas Práticas

1. **Nunca retornar senhas** em respostas
2. **Sempre validar** entrada do usuário
3. **Usar transactions** para operações críticas
4. **Logging adequado** para debugging
5. **Tratamento de erros** consistente
6. **Documentação** com Swagger/OpenAPI
7. **Versionamento** de API (/api/v1/)
8. **Health checks** para monitoramento

---

## 📚 Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Data de Criação**: 2024
**Versão**: 1.0.0

