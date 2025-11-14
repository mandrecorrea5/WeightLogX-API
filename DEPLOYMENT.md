# WeightLogX API – Guia de Deploy (Hostinger ou VPS similar)

## 1. Visão Geral
Este documento descreve o processo completo para o primeiro deploy da API WeightLogX em um servidor com Docker (ex.: VPS Hostinger). O stack recomendado utiliza Docker Compose para orquestrar:

- API NestJS (`api`)
- Banco PostgreSQL (`db`)
- Observabilidade (Prometheus, Loki, Promtail, Grafana)
- Analytics opcional com PostHog (envolvendo PostgreSQL dedicado, Redis, ClickHouse, Kafka, Zookeeper e serviços PostHog)

## 2. Pré-requisitos do Servidor
- Docker 24+ e Docker Compose Plugin (`docker compose`) instalados
- CPU x86_64/arm64 com pelo menos 2 vCPUs e 4 GB RAM (PostHog requer adicional ≥ 4 GB)
- Abrir portas externas conforme necessidade (padrão):
  - API: `3000` (ou valor de `API_PORT`)
  - Prometheus: `9090`
  - Grafana: `3001`
  - Loki: `3100`
  - PostHog (opcional): `8000`, Kafka `9093`, Zookeeper `2181`
- Acesso SSH com permissões para `docker` e `docker compose`
- Domínio configurado (opcional) apontando para o servidor

## 3. Preparando o Código Fonte
1. Faça clone do repositório na máquina local:
   ```bash
   git clone git@github.com:SEU_USUARIO/weightlogx-api.git
   ```
2. Envie os arquivos para o servidor (ex.: `scp -r weightlogx-api usuario@host:/opt/apps/`)
3. No servidor, posicione o projeto em `/opt/apps/weightlogx-api` (ou diretório de sua preferência)

## 4. Configurando Variáveis de Ambiente
Crie um arquivo `.env.production` na raiz com os valores seguros (não comite). Exemplo:
```env
# --- Core Application ---
NODE_ENV=production
API_PORT=3000
PORT=3000
CORS_ORIGIN=https://app.seudominio.com
JWT_SECRET=altere-este-segredo-super-seguro
JWT_EXPIRES_IN=7d
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
MAX_FILE_SIZE=5242880 # 5MB
ENABLE_SWAGGER=false
ENABLE_TRACING=false

# --- Authentication & Verification ---
# Tempo de expiração dos códigos de verificação (registro e reset de senha) em minutos
# Valor padrão: 5 minutos. Máximo permitido: 5 minutos
# Se configurado acima de 5 minutos, será automaticamente limitado a 5 minutos
AUTH_VERIFICATION_EXPIRATION_MINUTES=5
# Limite de reenvios de código de verificação por hora
AUTH_VERIFICATION_RESEND_LIMIT_PER_HOUR=3

# --- Database (API) ---
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_USER=weightlogx
DATABASE_PASSWORD=defina-uma-senha
DATABASE_NAME=weightlogx_db
DATABASE_SSL=false

# --- Observability ---
GRAFANA_USER=admin
GRAFANA_PASSWORD=defina-senha
GRAFANA_ROOT_URL=https://grafana.seudominio.com
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
LOKI_PORT=3100

# --- PostHog (opcional) ---
POSTHOG_WEB_PORT=8000
POSTHOG_POSTGRES_DB=posthog
POSTHOG_POSTGRES_USER=posthog
POSTHOG_POSTGRES_PASSWORD=defina-senha
POSTHOG_CLICKHOUSE_DB=posthog
POSTHOG_CLICKHOUSE_USER=default
POSTHOG_CLICKHOUSE_PASSWORD=
POSTHOG_SECRET_KEY=chave-super-secreta
POSTHOG_SITE_URL=https://posthog.seudominio.com
POSTHOG_KAFKA_PORT=9093
POSTHOG_ZOOKEEPER_PORT=2181
```
> **Importante:** Ajuste `DATABASE_PASSWORD`, `JWT_SECRET`, `POSTHOG_SECRET_KEY` e demais segredos antes de subir em produção.

O `docker-compose.yml` está configurado para carregar automaticamente o arquivo `.env.production` via `env_file`, então não é necessário passar `--env-file` manualmente. Apenas certifique-se de que o arquivo `.env.production` está presente na raiz do projeto.

## 5. Primeiro Deploy (sem PostHog)
1. No servidor, acesse a pasta do projeto
   ```bash
   cd /opt/apps/weightlogx-api
   ```
2. Certifique-se de que o arquivo `.env.production` está presente na raiz do projeto
3. Suba a stack principal (API + banco + observabilidade)
   ```bash
   docker compose up -d db api
   docker compose up -d prometheus loki promtail grafana
   ```
   > **Nota:** O `docker-compose.yml` está configurado para carregar automaticamente o arquivo `.env.production` via `env_file`, então não é necessário passar `--env-file` manualmente.
4. Aguarde os containers ficarem saudáveis (`docker compose ps`)
5. Verifique logs da API:
   ```bash
   docker compose logs -f api
   ```
6. A API deve responder em `http://SEU_SERVIDOR:3000/api`. Use `/api/health` e `/api/metrics` para checks rápidos.

## 5.1. Configurando Nginx (Opcional mas Recomendado)
O Nginx está configurado como reverse proxy para facilitar o acesso e preparar para SSL/TLS.

1. Adicione as variáveis do Nginx ao `.env.production`:
   ```env
   NGINX_HTTP_PORT=80
   NGINX_HTTPS_PORT=443
   ```

2. Suba o container Nginx:
   ```bash
   docker compose up -d nginx
   ```

3. Após configurar, os serviços estarão acessíveis via Nginx:
   - API: `http://SEU_SERVIDOR/api`
   - Grafana: `http://SEU_SERVIDOR/grafana`
   - Health: `http://SEU_SERVIDOR/health`

4. Para configurar SSL/TLS, consulte `NGINX_SETUP.md`

> **Nota:** As portas originais (3000, 3001, etc.) ainda estarão abertas. Para produção, considere fechar essas portas no firewall e usar apenas o Nginx.

## 6. Migrações do Banco de Dados
Após a API estar rodando, execute as migrations no container `api`:
```bash
docker compose exec api npm run migration:run
```
Se precisar reverter: `docker compose exec api npm run migration:revert`

## 7. Uploads e Persistência
- Pasta `uploads/` (imagens de perfil) é montada em `./uploads` localmente.
- Banco PostgreSQL da aplicação usa volume `./data/postgres`.
- Certifique-se de configurar backups regulares desses diretórios.

## 8. Habilitando o PostHog (Opcional)
O PostHog envolve múltiplos serviços adicionais.
1. Garanta que o servidor possui recursos suficientes (≥4 CPUs, 8 GB RAM recomendado)
2. Suba os serviços adicionais:
   ```bash
   docker compose --env-file .env.production up -d \
     posthog-db posthog-redis posthog-clickhouse posthog-zookeeper posthog-kafka \
     posthog-web posthog-worker posthog-plugin-server
   ```
3. Acesse `http://SEU_SERVIDOR:8000` (ou domínio configurado). Complete o onboarding e configure credenciais internas.
4. Para capturar eventos da aplicação, utilize a SDK do PostHog nas aplicações cliente (não coberto neste guia).

## 9. Observabilidade e Monitoramento
- Prometheus: `http://SEU_SERVIDOR:9090`
- Grafana: `http://SEU_SERVIDOR:3001` (login `GRAFANA_USER`/`GRAFANA_PASSWORD`)
- Loki recebe logs via Promtail; configure dashboards no Grafana conforme necessidades
- Métricas personalizadas expostas em `/api/metrics`

## 10. HTTPS / Reverse Proxy
Recomenda-se colocar um proxy reverso (Nginx, Caddy ou Traefik) em frente à API e aos dashboards.
- Exemplo com Nginx: mapear `/` → `api:3000`, `/grafana` → `grafana:3000`, `/posthog` → `posthog-web:8000`
- Habilitar TLS (Let's Encrypt) para todos os domínios públicos

## 11. Rotina de Manutenção
- Atualização do código:
  ```bash
  git pull origin main
  docker compose down
  docker compose up -d --build
  docker compose exec api npm run migration:run
  ```
- Logs:
  ```bash
  docker compose logs -f api
  docker compose logs -f posthog-web
  ```
- Backups: agendar dump do PostgreSQL (`docker compose exec db pg_dump ...`) e snapshot da pasta `uploads/`

## 12. Troubleshooting
| Problema | Solução |
|----------|---------|
| API sobe mas responde 500 | Verificar variáveis obrigatórias (`JWT_SECRET`, `DATABASE_*`). Conferir logs `docker compose logs api`. |
| Falha na conexão com Postgres | Certificar que os containers estão na mesma rede (`weightlogx_network`) e credenciais corretas. |
| Migrações falham | Rodar `docker compose exec api npm run migration:show` para identificar pendentes; revisar migrations no diretório `src/database/migrations`. |
| PostHog não inicia | Verificar recursos do servidor, senhas e se `posthog-kafka` consegue acessar `posthog-zookeeper`. |
| Grafana sem dashboards | Certificar que `grafana/provisioning` está montado. Reinicie o container Grafana. |

## 13. Check-list Final de Produção
- [ ] `.env.production` com segredos fortes e credenciais corretas
- [ ] Certificados TLS no proxy reverso
- [ ] Backups configurados (Postgres + uploads)
- [ ] Logs centralizados e monitorados (Grafana/Loki)
- [ ] Health checks monitorados (`/api/health`, `/api/metrics`)
- [ ] PostHog (se habilitado) com credenciais administrativas redefinidas

---
Para dúvidas adicionais ou ajustes de infraestrutura, consulte `API_DOCUMENTATION.md` e o time responsável pelas operações.
