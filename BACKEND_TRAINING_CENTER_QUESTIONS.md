# Perguntas para o Backend (Centros de Treinamento & Treinadores)

Antes de validar os ajustes, preciso confirmar alguns pontos:

1. **Endpoints e Respostas**
   - `POST /training-centers` já aceita os campos `{ name, abbreviation, trainerId }`?
   - A resposta retorna o centro criado com `id`, `name`, `abbreviation` e o objeto `trainer` (com ao menos `id` e `name`)?
   - `GET /training-centers` e `GET /training-centers/search` já retornam nessa mesma estrutura?  

2. **Associação com o Usuário**
   - `GET /user/profile` devolve o centro associado no novo formato (`trainingCenter` como objeto, ou `trainingCenterId` + `trainingCenterName`)?  
   - `PUT /user/profile` aceita o campo `trainingCenterId` (string) para associar e `null` para remover a associação?  
   - Ao remover (`trainingCenterId: null`), o backend limpa a relação e garante que um novo centro possa ser definido depois?

3. **Diretório de Treinadores**
   - `GET /trainers` devolve uma lista com `{ id, name }` (opcionalmente `email`/`phone`)?  
   - `POST /trainers` aceita `{ name }` e retorna o treinador com `id` para uso imediato?

4. **Regras e Restrições**
   - Há alguma validação adicional para `abbreviation` (ex: máximo de 8 caracteres, apenas letras/números)?
   - Existe validação para evitar centros duplicados (`name`/`abbreviation`)?  
   - O usuário pode ficar sem nenhum centro associado (backend aceita `null` sem erros)?

5. **Logs/Monitoramento**
   - Caso alguma dessas operações falhe, há logs que possamos consultar (status, payload)?
   - Precisamos enviar algum cabeçalho adicional (além do `Authorization`)?

Essas respostas ajudam a validar se tudo está alinhado com o frontend e a nova UX. Obrigado! 👍

