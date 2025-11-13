# 📊 Guia Completo: Dashboard de Códigos de Verificação no Grafana

Este guia fornece instruções detalhadas passo a passo para criar manualmente o dashboard de códigos de verificação no Grafana.

---

## 📋 Campos que o Dashboard Deve Mostrar

| Campo Original | Nome no Dashboard | Descrição |
|----------------|-------------------|-----------|
| `method` | **Método** | Método de envio (email ou sms) |
| `email` | **Email** | Email do usuário |
| `target` | **Target** | Email ou telefone de destino |
| `type` | **Type** | Tipo: `registration` (Registro) ou `password_reset` (Recuperação de Senha) |
| `code` | **Code** | Código de 6 dígitos gerado |

**⚠️ IMPORTANTE:** Não incluir `timestamp` - apenas os 5 campos acima.

---

## 🔍 Query do Loki

### Query Completa (Recomendada)

```
{container=~"weightlogx.*"} |= "verification_code" | regexp `verification_code (?P<json>{.*})` | line_format "{{.json}}"
```

**Explicação:**
- `{container=~"weightlogx.*"}` - Filtra containers que começam com "weightlogx"
- `|= "verification_code"` - Filtra linhas que contêm "verification_code"
- `regexp \`verification_code (?P<json>{.*})\`` - Captura o JSON após "verification_code"
- `line_format "{{.json}}"` - Formata a linha para conter apenas o JSON

**Formato do log original:**
```
verification_code {"type":"registration","method":"email","email":"usuario@example.com","target":"usuario@example.com","code":"123456","timestamp":"2025-11-12T20:16:00.351Z"}
```

**Após `line_format`:**
```json
{"type":"registration","method":"email","email":"usuario@example.com","target":"usuario@example.com","code":"123456","timestamp":"2025-11-12T20:16:00.351Z"}
```

---

## 🛠️ Passo a Passo Detalhado

### 1. Criar Novo Dashboard

1. No Grafana, clique em **"Dashboards"** → **"New"** → **"New Dashboard"**
2. Clique em **"Add visualization"** ou **"Add panel"**
3. Selecione **"Loki"** como fonte de dados

### 2. Configurar a Query

1. Na aba **"Query"**, cole a query:
   ```
   {container=~"weightlogx.*"} |= "verification_code" | regexp `verification_code (?P<json>{.*})` | line_format "{{.json}}"
   ```

2. Clique em **"Run query"** (ou aguarde o refresh automático)
3. **Verifique:** Deve aparecer logs no preview. Se aparecer "No data", gere um código de teste primeiro.

### 3. Configurar Transformações (CRÍTICO - Siga exatamente)

Vá para a aba **"Transform"** e adicione as transformações **na ordem exata**:

#### Transformação 1: Extract fields

1. Clique em **"Add transformation"**
2. Selecione **"Extract fields"**
3. Configure **EXATAMENTE** assim:
   - **Format**: Selecione `JSON` no dropdown
   - **Source**: Digite `Line` (com L maiúsculo) - **IMPORTANTE:** Se não funcionar, tente `line` (minúsculo)
4. Clique em **"Apply"**

**✅ Verificação:** Após aplicar, você deve ver na lista de campos:
- `code`
- `email`
- `method`
- `target`
- `type`
- `timestamp`
- E também campos do Loki: `Time`, `Line`, `tsNs`, etc.

**❌ Se não aparecer os campos JSON:**
- Verifique se o campo source está correto (`Line` ou `line`)
- Verifique se a query está retornando dados
- Tente remover e adicionar a transformação novamente

#### Transformação 2: Organize fields by name

1. Clique em **"Add transformation"** novamente
2. Selecione **"Organize fields by name"**
3. Configure:

   **A. Excluir campos (Exclude fields):**
   
   Marque para excluir **TODOS** estes campos:
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
   - `timestamp` ⚠️ **IMPORTANTE:** Excluir timestamp também

   **B. Renomear campos (Rename fields):**
   
   Configure os seguintes mapeamentos:
   - `method` → `Método`
   - `email` → `Email`
   - `target` → `Target`
   - `type` → `Type`
   - `code` → `Code`

   **C. Ordenar campos (Field order):**
   
   Selecione **"Manual"** e ordene nesta sequência:
   1. `Método` (method)
   2. `Email` (email)
   3. `Target` (target)
   4. `Type` (type)
   5. `Code` (code)

4. Clique em **"Apply"**

**✅ Verificação:** Após aplicar, você deve ver apenas 5 colunas: Método, Email, Target, Type, Code

### 4. Configurar Visualização (Table)

1. Na aba **"Visualization"**, selecione **"Table"**
2. Configure as opções:
   - **Show header**: ✅ Ativado
   - **Cell display mode**: `Auto` ou `Color text`
   - **Sort by**: Selecione `Type` ou `Code` (descendente)

### 5. Configurar Overrides (Opcional - para mapear Type)

1. Na aba **"Field"** (ou "Overrides"), clique em **"Add field override"**
2. Selecione **"Fields with name"** → Digite `Type`
3. Adicione a propriedade **"Mappings"**:
   - Clique em **"Add value mapping"**
   - **Type**: `Value`
   - Adicione:
     - **Value**: `registration` → **Text**: `Registro`
     - **Value**: `password_reset` → **Text**: `Recuperação de Senha`

### 6. Configurar Título e Refresh

1. No painel, clique no título e renomeie para: **"Códigos de Verificação"**
2. Configure o refresh automático:
   - Clique no ícone de relógio no canto superior direito do dashboard
   - Selecione **"10s"** ou **"30s"**

### 7. Configurar Período de Tempo

1. No seletor de tempo (canto superior direito), configure:
   - **From**: `now-24h` (últimas 24 horas)
   - **To**: `now`

---

## 🔧 Troubleshooting Detalhado

### Problema: "Extract fields" não extrai os campos

**Sintomas:** Após adicionar "Extract fields", os campos JSON não aparecem na lista.

**Soluções:**

1. **Verifique o campo source:**
   - Tente `Line` (com L maiúsculo)
   - Tente `line` (minúsculo)
   - Tente `Log` (com L maiúsculo)
   - **Dica:** Na lista de campos disponíveis (antes de adicionar a transformação), veja qual campo contém o JSON

2. **Verifique se a query está funcionando:**
   - Volte para a aba "Query"
   - Verifique se há dados no preview
   - Se não houver, gere um código de teste:
     ```bash
     curl --location 'http://localhost:3000/api/auth/register' \
     --header 'Content-Type: application/json' \
     --data-raw '{
       "fullName": "Teste",
       "email": "teste@email.com",
       "phone": "11987654321",
       "birthDate": "1990-01-01",
       "verificationMethod": "email",
       "password": "senha123456",
       "confirmPassword": "senha123456"
     }'
     ```

3. **Verifique o formato do JSON:**
   - No preview da query, verifique se o JSON está completo e válido
   - Deve estar no formato: `{"type":"...","method":"...","email":"...","target":"...","code":"...","timestamp":"..."}`

4. **Tente remover e adicionar novamente:**
   - Remova a transformação "Extract fields"
   - Adicione novamente, testando diferentes valores para "Source"

### Problema: "Organize fields" não mostra campos

**Sintomas:** Após adicionar "Organize fields", a tabela fica vazia ou mostra "No data".

**Soluções:**

1. **Verifique se "Extract fields" funcionou:**
   - Antes de adicionar "Organize fields", verifique se os campos JSON aparecem na lista
   - Se não aparecerem, corrija a transformação "Extract fields" primeiro

2. **Verifique os nomes dos campos:**
   - Na transformação "Organize fields", verifique se os nomes dos campos estão corretos
   - Os campos devem ser: `method`, `email`, `target`, `type`, `code` (minúsculos, sem acentos)

3. **Não exclua campos que não existem:**
   - Se você marcar para excluir um campo que não existe, pode causar problemas
   - Exclua apenas os campos que realmente aparecem na lista

4. **Verifique a ordem das transformações:**
   - "Extract fields" deve vir ANTES de "Organize fields"
   - Se estiverem na ordem errada, arraste para reordenar

### Problema: Campos aparecem mas com nomes errados

**Solução:** Verifique o mapeamento de renomeação na transformação "Organize fields":
- `method` → `Método`
- `email` → `Email`
- `target` → `Target`
- `type` → `Type`
- `code` → `Code`

### Problema: "No data" aparece

**Soluções:**

1. **Gere um código de teste:**
   ```bash
   # Registro
   curl --location 'http://localhost:3000/api/auth/register' \
   --header 'Content-Type: application/json' \
   --data-raw '{
     "fullName": "Teste Dashboard",
     "email": "teste-dashboard@email.com",
     "phone": "11987654321",
     "birthDate": "1990-01-01",
     "verificationMethod": "email",
     "password": "senha123456",
     "confirmPassword": "senha123456"
   }'
   
   # Recuperação de senha
   curl --location 'http://localhost:3000/api/auth/forgot-password' \
   --header 'Content-Type: application/json' \
   --data-raw '{
     "email": "teste-dashboard@email.com",
     "verificationMethod": "email"
   }'
   ```

2. **Ajuste o período de tempo:**
   - Tente "Last 1 hour" ou "Last 24 hours"
   - Verifique se há logs no período selecionado

3. **Verifique se o Promtail está coletando logs:**
   ```bash
   docker-compose logs promtail --tail 20
   ```

---

## 📝 Checklist Passo a Passo

Siga esta checklist na ordem:

- [ ] **Query configurada e retornando dados**
  - Query: `{container=~"weightlogx.*"} |= "verification_code" | regexp \`verification_code (?P<json>{.*})\` | line_format "{{.json}}"`
  - Preview mostra logs com JSON

- [ ] **Transformação 1: Extract fields aplicada**
  - Format: `JSON`
  - Source: `Line` (ou `line` se não funcionar)
  - Campos aparecem: `code`, `email`, `method`, `target`, `type`, `timestamp`

- [ ] **Transformação 2: Organize fields aplicada**
  - Campos excluídos: `Time`, `Line`, `tsNs`, `labelTypes`, `id`, `container`, `log_stream`, `service`, `service_name`, `labels`, `timestamp`
  - Campos renomeados: `method`→`Método`, `email`→`Email`, `target`→`Target`, `type`→`Type`, `code`→`Code`
  - Ordem: `Método`, `Email`, `Target`, `Type`, `Code`

- [ ] **Visualização configurada**
  - Tipo: `Table`
  - Show header: ✅
  - Sort by: `Type` ou `Code`

- [ ] **Overrides configurados (opcional)**
  - Field: `Type`
  - Mappings: `registration`→`Registro`, `password_reset`→`Recuperação de Senha`

- [ ] **Dashboard configurado**
  - Título: "Códigos de Verificação"
  - Refresh: 10s ou 30s
  - Período: Last 24 hours

---

## 🎯 Resultado Esperado

O dashboard deve mostrar uma tabela com **exatamente 5 colunas**:

| Método | Email | Target | Type | Code |
|--------|-------|--------|------|------|
| email | usuario@example.com | usuario@example.com | Registro | 123456 |
| email | usuario2@example.com | usuario2@example.com | Recuperação de Senha | 654321 |

---

## 💡 Dicas Importantes

1. **Ordem das transformações é crítica:** "Extract fields" deve vir ANTES de "Organize fields"

2. **Campo source pode variar:** Se `Line` não funcionar, tente `line`, `Log`, ou verifique na lista de campos disponíveis

3. **Teste uma transformação por vez:** Adicione "Extract fields", verifique se funcionou, depois adicione "Organize fields"

4. **Se nada funcionar:** Use a query simples primeiro (`{container=~"weightlogx.*"} |= "verification_code"`) para ver os logs brutos, depois adicione as transformações gradualmente

---

## 📚 Referências

- **Loki Query Language**: https://grafana.com/docs/loki/latest/logql/
- **Grafana Transformations**: https://grafana.com/docs/grafana/latest/panels/transformations/
- **Grafana Table Panel**: https://grafana.com/docs/grafana/latest/panels/visualizations/table/

---

**Última atualização**: 2025-11-12
