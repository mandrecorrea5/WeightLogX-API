#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"

echo -e "${BLUE}=== WeightLogX API - Testes Manuais ===${NC}\n"

# Verificar se a API está rodando
echo -e "${YELLOW}Verificando se a API está rodando...${NC}"
if ! curl -s -f "$BASE_URL" > /dev/null; then
    echo -e "${RED}❌ Erro: API não está respondendo em $BASE_URL${NC}"
    echo -e "${YELLOW}Certifique-se de que a aplicação está rodando: npm run start:dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API está respondendo${NC}\n"

# Teste 1: Health Check
echo -e "${BLUE}=== Teste 1: Health Check ===${NC}"
curl -s "$BASE_URL" | jq '.' || echo "Resposta não é JSON válido"
echo -e "\n"

# Teste 2: Registro (PT-BR)
echo -e "${BLUE}=== Teste 2: Registro de Usuário (PT-BR) ===${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "Teste Usuario",
    "email": "teste'$(date +%s)'@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extrair token se registro foi bem-sucedido
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token // empty')
EMAIL=$(echo "$REGISTER_RESPONSE" | jq -r '.data.user.email // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${YELLOW}⚠️  Registro pode ter falhado ou usuário já existe. Tentando login...${NC}"
    # Tentar login com email padrão
    EMAIL="teste@example.com"
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"senha123456\"
      }")
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')
fi

echo -e "\n"

# Teste 3: Login
echo -e "${BLUE}=== Teste 3: Login ===${NC}"
if [ -n "$EMAIL" ]; then
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -H "Accept-Language: pt-BR" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"senha123456\"
      }")
    echo "$LOGIN_RESPONSE" | jq '.'
    
    # Atualizar token se login foi bem-sucedido
    NEW_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')
    if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
        TOKEN="$NEW_TOKEN"
    fi
else
    echo -e "${YELLOW}⚠️  Email não disponível para teste de login${NC}"
fi
echo -e "\n"

# Teste 4: Forgot Password
echo -e "${BLUE}=== Teste 4: Forgot Password ===${NC}"
if [ -n "$EMAIL" ]; then
    curl -s -X POST "$BASE_URL/auth/forgot-password" \
      -H "Content-Type: application/json" \
      -H "Accept-Language: pt-BR" \
      -d "{
        \"email\": \"$EMAIL\"
      }" | jq '.'
else
    echo -e "${YELLOW}⚠️  Email não disponível para teste${NC}"
fi
echo -e "\n"

# Teste 5: Reset Password (mock)
echo -e "${BLUE}=== Teste 5: Reset Password (mock) ===${NC}"
curl -s -X POST "$BASE_URL/auth/reset-password" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "token": "mock-token",
    "newPassword": "novaSenha123456",
    "confirmPassword": "novaSenha123456"
  }' | jq '.'
echo -e "\n"

# Teste 6: Endpoint protegido (quando disponível)
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${BLUE}=== Teste 6: Endpoint Protegido (com token) ===${NC}"
    echo -e "${YELLOW}Token: ${TOKEN:0:50}...${NC}\n"
    
    # Quando tivermos endpoints protegidos, testar aqui
    # curl -s -X GET "$BASE_URL/user/profile" \
    #   -H "Authorization: Bearer $TOKEN" | jq '.'
    
    echo -e "${GREEN}✅ Token gerado com sucesso${NC}"
    echo -e "${YELLOW}Use este token para testar endpoints protegidos:${NC}"
    echo -e "${BLUE}Authorization: Bearer $TOKEN${NC}\n"
else
    echo -e "${RED}❌ Não foi possível obter token para testes${NC}\n"
fi

# Teste 7: Validações
echo -e "${BLUE}=== Teste 7: Validações (Erros Esperados) ===${NC}"

echo -e "${YELLOW}7.1: Email inválido${NC}"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Teste",
    "email": "email-invalido",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }' | jq '.message, .errors // empty' || echo "Erro ao processar resposta"
echo -e "\n"

echo -e "${YELLOW}7.2: Senha muito curta${NC}"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Teste",
    "email": "teste2@example.com",
    "password": "123",
    "confirmPassword": "123"
  }' | jq '.message, .errors // empty' || echo "Erro ao processar resposta"
echo -e "\n"

echo -e "${YELLOW}7.3: Nome muito curto${NC}"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jo",
    "email": "teste3@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }' | jq '.message, .errors // empty' || echo "Erro ao processar resposta"
echo -e "\n"

# Teste 8: Internacionalização
echo -e "${BLUE}=== Teste 8: Internacionalização (EN) ===${NC}"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "fullName": "Test User",
    "email": "testen'$(date +%s)'@example.com",
    "password": "password123456",
    "confirmPassword": "password123456"
  }' | jq '.data.message // .message'
echo -e "\n"

echo -e "${GREEN}=== Testes Concluídos ===${NC}"

