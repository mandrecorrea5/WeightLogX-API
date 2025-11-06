# ⚠️ Como Iniciar os Testes

## Problemas Identificados

1. **Docker não está rodando** - O Docker Desktop precisa estar iniciado
2. **Banco de dados não está disponível** - Precisa do Docker para rodar

## 🔧 Solução: Passos para Testar

### Opção 1: Com Docker (Recomendado)

```bash
# 1. Iniciar Docker Desktop
# Abra o Docker Desktop no seu Mac

# 2. Aguardar Docker iniciar completamente
# Espere até ver "Docker Desktop is running" na barra de menu

# 3. Iniciar banco de dados
docker-compose up -d db

# 4. Verificar se banco está rodando
docker-compose ps db

# 5. Iniciar aplicação (em terminal separado)
npm run start:dev

# 6. Aguardar aplicação iniciar (verá: "🚀 Application is running on: http://localhost:3000")

# 7. Executar testes
./test-api.sh
```

### Opção 2: Sem Docker (Banco Local)

Se você tem PostgreSQL instalado localmente:

```bash
# 1. Criar banco de dados manualmente
createdb weightlogx_db
# ou via psql:
psql -U postgres -c "CREATE DATABASE weightlogx_db;"

# 2. Atualizar .env com suas credenciais locais
# DATABASE_HOST=localhost
# DATABASE_USER=seu_usuario
# DATABASE_PASSWORD=sua_senha

# 3. Iniciar aplicação
npm run start:dev

# 4. Executar testes
./test-api.sh
```

### Opção 3: Verificar Status Atual

```bash
# Verificar Docker
docker ps

# Verificar se porta 3000 está em uso
lsof -i :3000

# Verificar logs da aplicação (se rodou em background)
tail -f /tmp/weightlogx-api.log

# Parar processo em background (se existir)
kill $(cat /tmp/weightlogx-api.pid 2>/dev/null) 2>/dev/null
```

## 🚀 Quick Start (Quando Docker estiver rodando)

```bash
# Tudo em um comando
docker-compose up -d db && sleep 5 && npm run start:dev
```

Depois, em outro terminal:
```bash
./test-api.sh
```

## 📝 Verificar Logs

```bash
# Logs do banco
docker-compose logs db

# Logs da aplicação (se rodar em background)
tail -f /tmp/weightlogx-api.log

# Ou ver logs no terminal onde iniciou a aplicação
```

## ✅ Checklist Antes de Testar

- [ ] Docker Desktop está rodando
- [ ] Banco de dados está rodando (`docker-compose ps db`)
- [ ] Arquivo `.env` existe e está configurado
- [ ] Aplicação está rodando (`curl http://localhost:3000/api`)
- [ ] Porta 3000 está livre

## 🐛 Troubleshooting

**Docker não inicia:**
- Verifique se Docker Desktop está instalado
- Reinicie o Docker Desktop
- Verifique se há espaço em disco

**Banco não conecta:**
- Verifique se `docker-compose ps db` mostra "Up"
- Verifique logs: `docker-compose logs db`
- Tente reiniciar: `docker-compose restart db`

**API não inicia:**
- Verifique se banco está rodando
- Verifique arquivo `.env`
- Verifique logs: `tail -f /tmp/weightlogx-api.log`
- Verifique porta: `lsof -i :3000`

