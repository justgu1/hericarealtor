# hericarealtor

Plataforma imobiliária construída com Laravel + Inertia.js. Exibe listagens de imóveis, capta leads e sincroniza automaticamente com o perfil de agente no Zillow.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Laravel 11, PHP 8.2 |
| Frontend | Inertia.js + Vue 3 + Tailwind CSS |
| Banco de dados | PostgreSQL 15 |
| Cache / Queue | Redis |
| Storage | MinIO (S3-compatível) |
| Runtime | PHP-FPM + Supervisor (queue worker + scheduler) |
| Imagem Docker | GHCR — `ghcr.io/justgu1/hericarealtor` |

---

## Estrutura do projeto

```
hericarealtor/
├── app/
│   ├── Http/Controllers/   ← controllers (Admin, Listing, Lead, Blog…)
│   ├── Models/             ← Listing, Lead, Post, Review, Amenity…
│   ├── Mail/               ← e-mails transacionais
│   └── Enums/
├── resources/
│   └── js/                 ← páginas Vue via Inertia
├── routes/
│   ├── web.php             ← rotas públicas + painel admin
│   └── api.php
├── docker/
│   ├── Dockerfile          ← multi-stage build (PHP-FPM + assets)
│   ├── entrypoint.sh       ← migrações, otimizações, start supervisor
│   └── supervisord.conf    ← PHP-FPM + queue worker + scheduler
├── jobs/
│   └── listings-updater/   ← scraper Python para o Zillow
├── k8s/                    ← manifestos Kubernetes (base + overlays)
├── workflows/              ← GitHub Actions (CI/CD → GHCR)
├── docker-compose.yml      ← ambiente local completo
└── .env.example            ← template de variáveis
```

---

## Funcionalidades

### Área pública
- **Home** — listagens em destaque, últimos posts, avaliações de clientes
- **Properties** — busca e filtro de imóveis (venda, aluguel, vendidos)
- **Property detail** — galeria, mapa, exportação em PDF
- **Seller** — formulário para o agente cadastrar novos imóveis
- **Neighborhood** — página informativa de bairros
- **About / Contact** — informações do agente e formulário de lead

### Painel Admin (`/admin`)
- Autenticação protegida por senha
- Dashboard com resumo de leads e listagens
- CRUD completo de listagens, amenidades e características
- Gestão de leads (captação do site)
- Gestão de avaliações de clientes
- Gestão de blog (posts, categorias, tags)
- Configurações do perfil

### Listings Updater (job Python)
Scraper que sincroniza automaticamente com o perfil do agente no Zillow:
- Obtém cookies de sessão via Chrome headless (`undetected-chromedriver`)
- Contorna o challenge anti-bot (Press & Hold) via `ActionChains`
- Busca listagens ativas, para alugar e vendidas
- Atualização incremental — só processa o que é novo desde a última execução
- Persiste na tabela `zillow_listings` (PostgreSQL)

---

## Ambiente local

### Pré-requisitos
- Docker + Docker Compose

### Setup

```bash
# 1. Clonar o repositório
git clone git@github.com:justgu1/hericarealtor.git
cd hericarealtor

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env: APP_KEY, DB_*, REDIS_PASSWORD, AWS_*, MAIL_*

# 3. Gerar APP_KEY
docker compose run --rm app php artisan key:generate

# 4. Subir os serviços
docker compose up -d

# 5. Executar migrações e seeders
docker compose exec app php artisan migrate --seed
```

### Listings Updater (local)

```bash
cd jobs/listings-updater
cp .env.example .env
# Preencha: ZILLOW_ENCODED_ZUID, ZILLOW_PROFILE_SLUG, DATABASE_URL

# Sem Docker
pip install -r requirements.txt
USE_VIRTUAL_DISPLAY=false python -m app.main

# Com Docker
docker compose up listing-updater
```

---

## CI/CD

Todo push na branch `main` dispara o GitHub Actions:

| Workflow | Trigger | Imagem publicada |
|---|---|---|
| `docker.yml` | Mudanças no app Laravel | `ghcr.io/justgu1/hericarealtor:latest` + `sha-<hash>` |
| `docker-listings-updater.yml` | Mudanças em `jobs/listings-updater/` | `ghcr.io/justgu1/hericarealtor-listings-updater:latest` |

> **Segredo necessário no repositório:** `GH_PAT` com permissão de escrita no repo `infra` (para atualizar a tag da imagem no deploy).

---

## Deploy em produção

O deploy é gerenciado pelo repo [`infra`](https://github.com/justgu1/infra) via Docker Swarm.
Consulte o README do `infra` para o guia completo de deploy na VPS.

Em resumo:
```bash
# Na VPS, dentro do repo infra
bash scripts/deploy-stack.sh hericarealtor
```

---

## Variáveis de ambiente

Veja o `.env.example` para a lista completa. Principais:

| Variável | Descrição |
|---|---|
| `APP_KEY` | Gerado com `php artisan key:generate` |
| `APP_ENV` | `local` ou `production` |
| `DB_*` | Conexão PostgreSQL |
| `REDIS_PASSWORD` | Senha do Redis |
| `AWS_*` | Credenciais MinIO (S3-compatível) |
| `MAIL_*` | Configuração SMTP |

> ⚠️ **Nunca commite o `.env`** — ele está no `.gitignore`.

---

## Segurança

- `.env` no `.gitignore` — nunca vai ao repositório
- Segredos de produção gerenciados exclusivamente no servidor via variáveis de ambiente
- Painel admin protegido por autenticação Laravel + middleware `auth`
- Imagens Docker publicadas no GHCR (privado) via `GITHUB_TOKEN`
- `GH_PAT` com escopo mínimo necessário (write no repo infra apenas)
