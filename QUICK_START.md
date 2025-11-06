# 🚀 Quick Start - Testando a API

## Passo 1: Configurar Ambiente

```bash
# 1. Criar arquivo .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user_weightlogx
DATABASE_PASSWORD=password_segura
DATABASE_NAME=weightlogx_db

JWT_SECRET=your-super-secret-key-minimum-32-characters-for-production
JWT_EXPIRES_IN=7d
EOF

# 2. Iniciar banco de dados
docker-compose up -d db

# 3. Aguardar banco iniciar (5-10 segundos)
sleep 5

# 4. Iniciar aplicação
npm run start:dev
```

## Passo 2: Testar Rapidamente

### Opção A: Script Automatizado

```bash
# Executar script de teste
./test-api.sh
```

### Opção B: Testes Manuais com curl

```bash
# 1. Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }' | jq

# 2. Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123456"
  }' | jq
```

### Opção C: Usando httpie (se instalado)

```bash
# Registrar
http POST localhost:3000/api/auth/register \
  fullName="João Silva" \
  email="joao@example.com" \
  password="senha123456" \
  confirmPassword="senha123456" \
  Accept-Language:pt-BR

# Login
http POST localhost:3000/api/auth/login \
  email="joao@example.com" \
  password="senha123456"
```

## Passo 3: Verificar se Funcionou

✅ **Sucesso se você ver**:
- Status 201 (Created) no registro
- Status 200 (OK) no login
- Token JWT na resposta
- Mensagens em português (se usar `Accept-Language: pt-BR`)

❌ **Problemas comuns**:
- `Cannot connect to database` → Verifique se o Docker está rodando
- `Port 3000 already in use` → Mude a porta no .env
- `JWT secret is not configured` → Verifique o arquivo .env

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `TESTING_GUIDE.md` - Guia completo de testes
- `ARCHITECTURE.md` - Arquitetura do projeto
- `API_DOCUMENTATION.md` - Documentação da API

