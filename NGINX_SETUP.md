# Configuração do Nginx - Reverse Proxy

Este documento descreve como configurar e usar o Nginx como reverse proxy para a API WeightLogX.

## 📋 Visão Geral

O Nginx foi configurado para:
- **API**: Proxy reverso para `http://api:3000` (acessível em `/api`)
- **Grafana**: Proxy reverso para `http://grafana:3000` (acessível em `/grafana`)
- **Prometheus**: Configurado mas comentado (pode ser habilitado com autenticação)
- **SSL/TLS**: Preparado para Let's Encrypt (comentado até configurar)

## 🚀 Iniciando o Nginx

### 1. Adicionar variáveis ao .env.production

Adicione estas variáveis ao seu `.env.production`:

```env
# --- Nginx Reverse Proxy ---
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

### 2. Subir o container Nginx

```bash
docker compose up -d nginx
```

### 3. Verificar se está rodando

```bash
docker compose ps nginx
docker compose logs nginx
```

## 🌐 Acessos

Após configurar o Nginx, os serviços estarão acessíveis através dele:

- **API**: `http://SEU_SERVIDOR/api` ou `http://SEU_SERVIDOR:80/api`
- **Grafana**: `http://SEU_SERVIDOR/grafana` ou `http://SEU_SERVIDOR:80/grafana`
- **Health Check**: `http://SEU_SERVIDOR/health`

### ⚠️ Importante

- As portas originais (3000, 3001, etc.) ainda estarão abertas
- Para produção, considere fechar essas portas no firewall e usar apenas o Nginx
- O Nginx está configurado na porta 80 (HTTP) por padrão

## 🔒 Configurando SSL/TLS (Let's Encrypt)

### Pré-requisitos

1. Domínio apontando para o servidor
2. Certbot instalado no servidor (ou usar container)

### Passo 1: Obter certificado SSL

```bash
# Instalar certbot (se não tiver)
sudo apt-get update
sudo apt-get install certbot

# Obter certificado
sudo certbot certonly --webroot \
  -w /opt/apps/WeightLogX-API/nginx/certbot \
  -d seu-dominio.com \
  -d www.seu-dominio.com
```

### Passo 2: Atualizar configuração do Nginx

Edite `nginx/conf.d/default.conf` e descomente o bloco `server` para HTTPS (linhas 67-103).

Ajuste:
- `server_name` para seu domínio
- Caminhos dos certificados SSL

### Passo 3: Habilitar redirecionamento HTTP → HTTPS

Descomente a linha 20 em `nginx/conf.d/default.conf`:
```nginx
return 301 https://$host$request_uri;
```

### Passo 4: Reiniciar Nginx

```bash
docker compose restart nginx
```

### Passo 5: Renovação automática

Adicione ao crontab:
```bash
0 0 * * * certbot renew --quiet && docker compose restart nginx
```

## 📝 Estrutura de Arquivos

```
nginx/
├── nginx.conf          # Configuração principal do Nginx
├── conf.d/
│   └── default.conf    # Configuração dos servidores (HTTP/HTTPS)
├── logs/               # Logs do Nginx (gitignored)
├── certbot/            # Diretório para validação Let's Encrypt
└── ssl/                # Certificados SSL (gitignored)
```

## 🔧 Personalização

### Alterar porta HTTP

No `.env.production`:
```env
NGINX_HTTP_PORT=8080
```

### Adicionar autenticação básica para Prometheus

1. Criar arquivo de senhas:
```bash
docker run --rm -it httpd:2.4-alpine htpasswd -nb admin senha_segura > nginx/.htpasswd
```

2. Descomentar e ajustar a seção Prometheus em `nginx/conf.d/default.conf`

### Adicionar rate limiting

Adicione em `nginx/conf.d/default.conf`:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api {
    limit_req zone=api_limit burst=20;
    # ... resto da configuração
}
```

## 🐛 Troubleshooting

### Nginx não inicia

```bash
# Verificar logs
docker compose logs nginx

# Verificar sintaxe da configuração
docker compose exec nginx nginx -t
```

### Erro 502 Bad Gateway

- Verifique se os serviços upstream (api, grafana) estão rodando
- Verifique se estão na mesma rede Docker (`weightlogx_network`)
- Verifique logs: `docker compose logs api grafana`

### Certificado SSL não funciona

- Verifique se os caminhos dos certificados estão corretos
- Verifique permissões: `sudo chmod -R 755 /opt/apps/WeightLogX-API/nginx/ssl`
- Verifique se o domínio está apontando para o servidor

## 📚 Referências

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot Documentation](https://certbot.eff.org/)

