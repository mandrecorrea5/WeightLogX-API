# 🌍 Internacionalização (i18n) - Como Funciona

## 📋 Visão Geral

A API suporta múltiplos idiomas através do header `Accept-Language`. A mensagem de resposta é traduzida automaticamente baseada no idioma solicitado.

---

## ✅ Como Funciona no Registro

### Código

No `AuthService.register()`:
```typescript
// Translate success message
const message = this.i18n.translate('auth.register.success', {
  lang: locale,
});

return {
  message,
};
```

O `locale` é extraído automaticamente do header `Accept-Language` pelo decorator `@I18nLang()` no controller.

### Traduções Disponíveis

**PT-BR** (`src/i18n/locales/pt-BR.json`):
```json
{
  "auth": {
    "register": {
      "success": "Conta criada com sucesso"
    }
  }
}
```

**EN** (`src/i18n/locales/en.json`):
```json
{
  "auth": {
    "register": {
      "success": "Account created successfully"
    }
  }
}
```

---

## 🔧 Exemplos de Uso

### 1. Registro em Português (PT-BR)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'
```

**Resposta:**
```json
{
  "message": "Conta criada com sucesso"
}
```

---

### 2. Registro em Inglês (EN)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123456",
    "confirmPassword": "password123456"
  }'
```

**Resposta:**
```json
{
  "message": "Account created successfully"
}
```

---

### 3. Sem Header (Padrão PT-BR)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva",
    "email": "joao@example.com",
    "password": "senha123456",
    "confirmPassword": "senha123456"
  }'
```

**Resposta (padrão PT-BR):**
```json
{
  "message": "Conta criada com sucesso"
}
```

---

## 📝 Variações de Header Aceitas

O sistema aceita diferentes formatos do header `Accept-Language`:

- `Accept-Language: pt-BR` ✅
- `Accept-Language: pt` ✅ (mapeado para pt-BR)
- `Accept-Language: en` ✅
- `Accept-Language: en-US` ✅ (mapeado para en)
- `Accept-Language: en,pt-BR` ✅ (usa o primeiro: en)

---

## 🔍 Como Adicionar Novos Idiomas

1. **Criar arquivo de tradução:**
   ```bash
   src/i18n/locales/es.json
   ```

2. **Adicionar traduções:**
   ```json
   {
     "auth": {
       "register": {
         "success": "Cuenta creada con éxito"
       }
     }
   }
   ```

3. **Atualizar fallback (opcional):**
   Em `src/i18n/i18n.module.ts`, você pode adicionar mais idiomas suportados.

---

## 🎯 Todos os Endpoints com i18n

### ✅ Registro
- Mensagem de sucesso traduzida
- Mensagens de erro traduzidas

### ✅ Login
- Mensagens de erro traduzidas

### ✅ Forgot Password
- Mensagens de sucesso/erro traduzidas

### ✅ Reset Password
- Mensagens de sucesso/erro traduzidas

---

## 💡 Dicas

1. **Sempre envie o header `Accept-Language`** para garantir a tradução correta
2. **Use `pt-BR` ou `en`** para os idiomas suportados atualmente
3. **O padrão é `pt-BR`** se nenhum header for enviado
4. **Mensagens de erro também são traduzidas** automaticamente

---

## 🧪 Teste Rápido

```bash
# PT-BR
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: pt-BR" \
  -d '{"fullName":"Teste","email":"teste'$(date +%s)'@example.com","password":"senha123456","confirmPassword":"senha123456"}'

# EN
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{"fullName":"Test","email":"test'$(date +%s)'@example.com","password":"password123456","confirmPassword":"password123456"}'
```

