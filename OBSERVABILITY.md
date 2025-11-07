# Observabilidade - WeightLogX API

Este documento descreve a stack de observabilidade configurada para a API WeightLogX, incluindo Prometheus, Grafana e Loki.

## Stack de Observabilidade

A aplicação utiliza a stack completa de observabilidade:

- **Prometheus**: Coleta e armazena métricas da API
- **Grafana**: Visualização de métricas e logs através de dashboards
- **Loki**: Agregação e armazenamento de logs
- **Promtail**: Coleta logs dos containers e envia para Loki

## Serviços e Portas

| Serviço | Porta | URL |
|---------|-------|-----|
| API | 3000 | http://localhost:3000 |
| Grafana | 3001 | http://localhost:3001 |
| Prometheus | 9090 | http://localhost:9090 |
| Loki | 3100 | http://localhost:3100 |

## Configuração

### Credenciais Padrão

**Grafana:**
- Usuário: `admin` (configurável via `GRAFANA_USER`)
- Senha: `admin` (configurável via `GRAFANA_PASSWORD`)

⚠️ **IMPORTANTE**: Altere as credenciais padrão em produção!

### Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin
GRAFANA_PORT=3001
GRAFANA_ROOT_URL=http://localhost:3001

# Prometheus
PROMETHEUS_PORT=9090

# Loki
LOKI_PORT=3100
```

## Iniciando os Serviços

### Desenvolvimento

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Produção

```bash
docker-compose up -d
```

## Acessando o Grafana

1. Acesse http://localhost:3001
2. Faça login com as credenciais configuradas
3. Os dashboards já estarão disponíveis na pasta "WeightLogX"

## Dashboards Disponíveis

### 1. WeightLogX API - Complete Dashboard

Dashboard principal com as seguintes métricas:

- **HTTP Request Rate**: Taxa de requisições por segundo
- **HTTP Request Duration**: Tempo de resposta (p50, p95, p99)
- **HTTP Status Codes Distribution**: Distribuição de códigos de status
- **Error Rate by Type**: Taxa de erros por tipo
- **Database Query Duration**: Duração das queries do banco (p95)
- **Active Connections**: Conexões ativas
- **Request/Response Size**: Tamanho médio de requisições e respostas
- **Top Endpoints**: Top 10 endpoints por número de requisições
- **Success Rate**: Taxa de sucesso (2xx / Total)
- **Total Requests**: Total de requisições nos últimos 5 minutos
- **Error Rate**: Taxa de erros nos últimos 5 minutos
- **Avg Response Time**: Tempo médio de resposta

## Métricas Coletadas

A API expõe métricas Prometheus em `/api/metrics`. As principais métricas incluem:

### HTTP Metrics
- `weightlogx_http_requests_total`: Total de requisições HTTP
- `weightlogx_http_request_duration_seconds`: Duração das requisições HTTP
- `weightlogx_http_errors_total`: Total de erros HTTP
- `weightlogx_http_status_codes_total`: Total por código de status
- `weightlogx_http_request_size_bytes`: Tamanho das requisições
- `weightlogx_http_response_size_bytes`: Tamanho das respostas

### Database Metrics
- `weightlogx_database_query_duration_seconds`: Duração das queries do banco

### System Metrics
- `weightlogx_active_connections`: Conexões ativas
- Métricas padrão do Node.js (CPU, memória, etc.)

## Logs

Os logs são coletados pelo Promtail e enviados para o Loki. Você pode visualizar os logs no Grafana usando a query:

```
{job="weightlogx-api"}
```

Ou para logs de containers Docker:

```
{service="weightlogx-api-dev"}
```

## Prometheus Queries Úteis

### Taxa de Requisições por Endpoint

```promql
sum(rate(weightlogx_http_requests_total[5m])) by (endpoint)
```

### Tempo de Resposta p95 por Rota

```promql
histogram_quantile(0.95, sum(rate(weightlogx_http_request_duration_seconds_bucket[5m])) by (le, route))
```

### Taxa de Erros

```promql
sum(rate(weightlogx_http_errors_total[5m])) by (error_type)
```

### Taxa de Sucesso (2xx)

```promql
sum(rate(weightlogx_http_status_codes_total{status_class="2xx"}[5m])) / sum(rate(weightlogx_http_requests_total[5m])) * 100
```

## Retenção de Dados

- **Prometheus (Dev)**: 30 dias
- **Prometheus (Prod)**: 90 dias
- **Loki**: Configurável via `loki-config.yml`

## Troubleshooting

### Prometheus não está coletando métricas

1. Verifique se a API está rodando: `curl http://localhost:3000/api/metrics`
2. Verifique os logs do Prometheus: `docker logs weightlogx_prometheus_dev`
3. Verifique a configuração em `prometheus/prometheus.yml`

### Grafana não mostra dashboards

1. Verifique se os arquivos de provisioning estão corretos
2. Verifique os logs do Grafana: `docker logs weightlogx_grafana_dev`
3. Acesse Configuration > Data Sources e verifique se Prometheus e Loki estão configurados

### Logs não aparecem no Grafana

1. Verifique se o Promtail está rodando: `docker logs weightlogx_promtail_dev`
2. Verifique se o diretório `./logs` existe e contém arquivos de log
3. Verifique a configuração em `promtail/promtail-config.yml`

## Estrutura de Arquivos

```
.
├── prometheus/
│   └── prometheus.yml          # Configuração do Prometheus
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml # Datasources (Prometheus, Loki)
│   │   └── dashboards/
│   │       └── dashboards.yml  # Configuração de dashboards
│   └── dashboards/
│       ├── api-overview.json   # Dashboard básico
│       └── weightlogx-api-dashboard.json # Dashboard completo
├── promtail/
│   └── promtail-config.yml     # Configuração do Promtail
└── loki/
    └── loki-config.yml          # Configuração do Loki
```

## Próximos Passos

- [ ] Configurar alertas no Prometheus
- [ ] Adicionar mais dashboards específicos (ex: performance por endpoint)
- [ ] Configurar notificações (email, Slack, etc.)
- [ ] Adicionar métricas customizadas de negócio

## Referências

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)

