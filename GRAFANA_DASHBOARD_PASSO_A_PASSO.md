# 🎯 Guia Visual: Criar Dashboard de Códigos de Verificação

Guia passo a passo detalhado para criar o dashboard manualmente no Grafana.

---

## 📋 O Que Você Precisa Ver

**Campos finais na tabela:**
- Método
- Email  
- Target
- Type
- Code

---

## 🔍 Passo 1: Query do Loki

**Na aba "Query", cole exatamente isto:**

```
{container=~"weightlogx.*"} |= "verification_code" | regexp `verification_code (?P<json>{.*})` | line_format "{{.json}}"
```

**✅ Verificação:** Clique em "Run query". Você deve ver logs no preview. Se aparecer "No data", gere um código de teste primeiro.

---

## 🔧 Passo 2: Transformação "Extract fields"

### 2.1 Adicionar a Transformação

1. Vá para a aba **"Transform"**
2. Clique em **"Add transformation"**
3. Selecione **"Extract fields"**

### 2.2 Configurar

**IMPORTANTE - Configure exatamente assim:**

- **Format**: Selecione `JSON` no dropdown (não digite, selecione)
- **Source**: Digite `Line` (com L maiúsculo)

**⚠️ Se não funcionar com `Line`:**
- Tente `line` (minúsculo)
- Tente `Log` (com L maiúsculo)
- **Dica:** Antes de adicionar a transformação, veja na lista de campos disponíveis qual contém o JSON

### 2.3 Verificar se Funcionou

**✅ Após clicar em "Apply", você DEVE ver na lista de campos:**

Campos do JSON (que você precisa):
- `code`
- `email`
- `method`
- `target`
- `type`
- `timestamp`

Campos do Loki (que você vai excluir depois):
- `Time`
- `Line`
- `tsNs`
- `labelTypes`
- `id`
- `container`
- `log_stream`
- `service`
- `service_name`
- `labels`

**❌ Se NÃO aparecer os campos JSON:**
- O campo source está errado. Tente `line` (minúsculo) ou `Log`
- Verifique se a query está retornando dados
- Remova a transformação e adicione novamente

---

## 🔧 Passo 3: Transformação "Organize fields by name"

**⚠️ IMPORTANTE:** Só adicione esta transformação DEPOIS que a "Extract fields" funcionar e você ver os campos JSON na lista.

### 3.1 Adicionar a Transformação

1. Ainda na aba **"Transform"**
2. Clique em **"Add transformation"** novamente
3. Selecione **"Organize fields by name"**

### 3.2 Excluir Campos

Na seção **"Exclude fields"**, marque para excluir **TODOS** estes campos:

```
Time
Line
tsNs
labelTypes
id
container
log_stream
service
service_name
labels
timestamp
```

**⚠️ IMPORTANTE:** Exclua `timestamp` também (você não quer mostrar na tabela).

### 3.3 Renomear Campos

Na seção **"Rename fields"**, configure:

| Campo Original | Novo Nome |
|---------------|-----------|
| `method` | `Método` |
| `email` | `Email` |
| `target` | `Target` |
| `type` | `Type` |
| `code` | `Code` |

**⚠️ ATENÇÃO:** Use os nomes originais em minúsculo (`method`, `email`, etc.) - não use os nomes já renomeados.

### 3.4 Ordenar Campos

1. Selecione **"Manual"** em "Field order"
2. Arraste ou ordene nesta sequência:
   1. `Método` (que era `method`)
   2. `Email` (que era `email`)
   3. `Target` (que era `target`)
   4. `Type` (que era `type`)
   5. `Code` (que era `code`)

### 3.5 Aplicar

Clique em **"Apply"**

**✅ Verificação:** Após aplicar, você deve ver apenas 5 colunas na tabela: Método, Email, Target, Type, Code

**❌ Se aparecer "No data" ou tabela vazia:**
- Verifique se a transformação "Extract fields" funcionou primeiro
- Verifique se os nomes dos campos no "Rename" estão corretos (minúsculos, sem acentos)
- Verifique se não está excluindo campos que você precisa

---

## 🎨 Passo 4: Configurar Visualização

1. Vá para a aba **"Visualization"**
2. Selecione **"Table"**
3. Configure:
   - **Show header**: ✅ Ativado
   - **Cell display mode**: `Auto`
   - **Sort by**: Selecione `Type` ou `Code` (descendente)

---

## 🎯 Passo 5: Mapear Type (Opcional)

1. Vá para a aba **"Field"** (ou "Overrides")
2. Clique em **"Add field override"**
3. Selecione **"Fields with name"** → Digite `Type`
4. Clique em **"Add override property"** → Selecione **"Mappings"**
5. Clique em **"Add value mapping"**
6. Configure:
   - **Type**: `Value`
   - **Value**: `registration` → **Text**: `Registro`
   - Clique em **"Add value mapping"** novamente
   - **Value**: `password_reset` → **Text**: `Recuperação de Senha`

---

## ✅ Checklist de Verificação

Siga esta ordem e verifique cada passo:

- [ ] **Query retorna dados**
  - Query configurada
  - Preview mostra logs

- [ ] **Transformação 1: Extract fields**
  - Format: `JSON`
  - Source: `Line` (ou `line` se não funcionar)
  - **VERIFICAÇÃO CRÍTICA:** Campos JSON aparecem na lista (`code`, `email`, `method`, `target`, `type`, `timestamp`)

- [ ] **Transformação 2: Organize fields**
  - Campos excluídos: Time, Line, tsNs, labelTypes, id, container, log_stream, service, service_name, labels, **timestamp**
  - Campos renomeados: method→Método, email→Email, target→Target, type→Type, code→Code
  - Ordem: Método, Email, Target, Type, Code
  - **VERIFICAÇÃO CRÍTICA:** Tabela mostra 5 colunas com dados

- [ ] **Visualização configurada**
  - Tipo: Table
  - Show header: ✅
  - Sort by: Type ou Code

---

## 🚨 Problemas Comuns e Soluções

### Problema: "Extract fields" não extrai nada

**Sintoma:** Após adicionar "Extract fields", não aparecem os campos JSON.

**Soluções (teste nesta ordem):**

1. **Mude o campo source:**
   - Se estava `Line`, tente `line` (minúsculo)
   - Se estava `line`, tente `Log` (com L maiúsculo)
   - Se estava `Log`, tente `log` (minúsculo)

2. **Verifique se há dados:**
   - Volte para a aba "Query"
   - Veja se há logs no preview
   - Se não houver, gere um código de teste

3. **Verifique o formato do JSON:**
   - No preview da query, o campo `Line` deve conter apenas o JSON
   - Deve estar no formato: `{"type":"...","method":"...","email":"...","target":"...","code":"...","timestamp":"..."}`

4. **Remova e adicione novamente:**
   - Remova a transformação "Extract fields"
   - Adicione novamente, testando diferentes valores para "Source"

### Problema: "Organize fields" deixa a tabela vazia

**Sintoma:** Após adicionar "Organize fields", a tabela fica vazia ou mostra "No data".

**Soluções:**

1. **Verifique se "Extract fields" funcionou:**
   - Antes de adicionar "Organize fields", você DEVE ver os campos JSON na lista
   - Se não ver, corrija "Extract fields" primeiro

2. **Verifique os nomes dos campos no "Rename":**
   - Use os nomes ORIGINAIS (minúsculos): `method`, `email`, `target`, `type`, `code`
   - NÃO use os nomes renomeados (`Método`, `Email`, etc.) no campo "Rename"

3. **Não exclua campos que você precisa:**
   - Exclua apenas: Time, Line, tsNs, labelTypes, id, container, log_stream, service, service_name, labels, timestamp
   - NÃO exclua: method, email, target, type, code

4. **Verifique a ordem das transformações:**
   - "Extract fields" deve estar ANTES de "Organize fields"
   - Se estiverem na ordem errada, arraste para reordenar

### Problema: Campos aparecem mas com nomes errados

**Solução:** Verifique o mapeamento de renomeação:
- Campo original: `method` → Novo nome: `Método`
- Campo original: `email` → Novo nome: `Email`
- Campo original: `target` → Novo nome: `Target`
- Campo original: `type` → Novo nome: `Type`
- Campo original: `code` → Novo nome: `Code`

**⚠️ IMPORTANTE:** No campo "Rename", use sempre o nome ORIGINAL (minúsculo), não o nome renomeado.

---

## 🎯 Resultado Final Esperado

A tabela deve mostrar **exatamente 5 colunas** nesta ordem:

| Método | Email | Target | Type | Code |
|--------|-------|--------|------|------|
| email | usuario@example.com | usuario@example.com | Registro | 123456 |
| email | usuario2@example.com | usuario2@example.com | Recuperação de Senha | 654321 |

---

## 💡 Dica Final

**Se nada funcionar:**

1. Comece do zero: remova todas as transformações
2. Use a query simples primeiro: `{container=~"weightlogx.*"} |= "verification_code"`
3. Veja os logs brutos no preview
4. Adicione "Extract fields" e verifique se os campos aparecem
5. Só então adicione "Organize fields"

**Lembre-se:** A ordem é crítica. "Extract fields" PRIMEIRO, depois "Organize fields".

---

**Última atualização**: 2025-11-12

