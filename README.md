# iAfiliado v2 — Plataforma de Afiliados

Plataforma web para gestao de afiliados, com autenticacao, painel administrativo, sistema de suporte com tickets e integracao com Discord.

## Tecnologias

### Frontend

- **React 18** + **TypeScript**
- **Vite** — build e dev server
- **Tailwind CSS** + **shadcn/ui** — interface
- **React Router** — rotas com protecao (ProtectedRoute)
- **React Hook Form** + **Zod** — formularios e validacao
- **TanStack Query** — requisicoes e cache

### Backend

- **Node.js** + **Express 5**
- **SQLite** (better-sqlite3) — banco de dados em arquivo (WAL, foreign keys)
- **JWT** (`jsonwebtoken`) — autenticacao
- **bcrypt** — hash de senhas (salt rounds: 10)
- **Multer** — upload de arquivos (5MB, JPEG/PNG/WebP/PDF)
- **helmet** — headers de seguranca (CSP, HSTS, X-Frame-Options)
- **express-rate-limit** — protecao contra brute-force
- **express-validator** — validacao e sanitizacao de input
- **dotenv** — variaveis de ambiente
- **Discord Webhook** — notificacoes de tickets

## Pre-requisitos

- Node.js (recomendado: LTS 20+)
- npm

## Quick Start

### 1. Clonar e instalar dependencias

```sh
git clone <URL_DO_REPOSITORIO>
cd iAfiliado-v2
npm install
```

### 2. Variaveis de ambiente

Copie o exemplo e preencha com suas credenciais:

```sh
cp backend/.env.example backend/.env
```

Variaveis obrigatorias (backend):

| Variavel | Descricao |
| --- | --- |
| `JWT_SECRET` | Chave secreta para assinatura JWT (min. 32 caracteres em producao) |
| `CORS_ORIGINS` | Origens permitidas em producao (separadas por virgula) |

Opcionais (backend):

| Variavel | Descricao |
| --- | --- |
| `DB_PATH` | Caminho do arquivo SQLite (padrao: `backend/data/iafiliado.db`) |
| `DISCORD_WEBHOOK_URL` | URL do webhook Discord para notificacoes |
| `PORT` | Porta HTTP (padrao: `3000`) |
| `NODE_ENV` | `development`, `test` ou `production` |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` |

Frontend (opcional):

| Variavel | Descricao |
| --- | --- |
| `VITE_API_BASE_URL` | URL base da API. Em **dev** deixe sem definir para usar o proxy do Vite (`/api` -> backend na porta 3000). Em **producao** defina (ex: `/api` ou `https://sua-api.com`). |

#### Ativar CAPTCHA (reCAPTCHA v2)

1. Acesse [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) e registre um site (tipo **"Não sou um robô"**).
2. **Backend** — em `backend/.env` defina:
   - `RECAPTCHA_SECRET_KEY=` com a **Chave secreta** do reCAPTCHA.
3. **Frontend** — na raiz do projeto crie ou edite `.env` e defina:
   - `VITE_RECAPTCHA_SITE_KEY=` com a **Chave do site** do reCAPTCHA.
4. Reinicie o backend e o frontend.

Com isso: no **login**, o CAPTCHA é exigido após 3 falhas por IP; no **registro**, o usuário precisa resolver o CAPTCHA para se cadastrar. Sem as chaves, o CAPTCHA fica desativado (dev/test).

### 3. Banco de dados

O backend usa **SQLite**. O schema e aplicado automaticamente na primeira execucao (`backend/schema.sql`). Em teste (`NODE_ENV=test`) e usado um arquivo temporario.

Consulte [docs/DATABASE.md](docs/DATABASE.md) para o schema completo e tabelas (users, support_messages, support_replies, support_attachments, casinos, etc.).

### 4. Executar o projeto

**Frontend (Vite):**

```sh
npm run dev
```

Acesse: `http://localhost:8080` (porta configurada em `vite.config.ts`).

**Backend (Express):**

```sh
cd backend && npm run dev
```

API em: `http://localhost:3000`

Para desenvolvimento, **ambos precisam estar rodando**. O frontend usa o proxy do Vite: chamadas a `/api/*` sao encaminhadas para o backend na porta 3000.

**Se ao clicar em "Acessar" (Casas Parceiras) aparecer erro 404 ou "resposta inesperada (HTML)":**

1. Confirme que o **backend esta rodando** na porta 3000 (`cd backend && npm run dev`).
2. Use o **frontend pelo dev server** (`npm run dev`), nao pelo `npm run preview` nem abrindo o build em outro servidor (o proxy so existe no dev).
3. Nao defina `VITE_API_BASE_URL` no `.env` do frontend (ou use `VITE_API_BASE_URL=/api`) para que as requisicoes passem pelo proxy.
4. Teste a API direto: `curl -s http://localhost:3000/health` deve retornar `{"status":"ok",...}`.

## Scripts disponiveis

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Sobe o frontend (Vite) |
| `npm run build` | Build de producao do frontend |
| `npm run preview` | Preview do build |
| `npm run lint` | Executa o ESLint |
| `npm run test` | Executa os testes do frontend (Vitest) |
| `npm run test:backend` | Executa os testes do backend (Node `--test`: integração, fluxos, infra) |
| `npm run test:all` | Executa testes do backend e do frontend em sequência |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run test:e2e:security` | Apenas testes E2E de seguranca |
| `npm run deploy` | Deploy em producao via SSH (build no servidor) |

**Testes**

- **Backend** (`backend/`): `npm run test` (ou na raiz: `npm run test:backend`). Inclui testes de integração (`tests/integration`), fluxos (`tests/flows`: auth/dashboard, suporte, admin) e infraestrutura (`tests/infrastructure`: health, error handler). Usa SQLite em arquivo temporário quando `NODE_ENV=test`.
- **Frontend** (raiz): `npm test` executa Vitest (testes em `src/`, ex.: `src/lib/auth.test.ts`, `src/lib/api-client.test.ts`).

## Deploy em producao (SSH)

1. **Configure o servidor:** no servidor, clone o repo na pasta desejada (ex: `/docker/iafiliadov2/iAfiliado-v2`). Crie `backend/.env` com as variaveis de producao (JWT_SECRET, CORS_ORIGINS, etc.).

2. **Configure o deploy local:** copie `.env.deploy.example` para `.env.deploy` e preencha:
   - `SERVER_USER` (ex: root)
   - `SERVER_HOST` (ex: 62.72.21.49)
   - `SERVER_PORT` (ex: 22)
   - `DEPLOY_PATH` (ex: /docker/iafiliadov2/iAfiliado-v2)

3. **Faça commit e push** das alteracoes (o script faz `git pull` no servidor).

4. **Rode o deploy:** na raiz do projeto:
   - **Windows (PowerShell):** `npm run deploy` ou `pwsh -File scripts/deploy-ssh.ps1`
   - **Linux/Mac:** `./scripts/deploy-ssh.sh` (chmod +x na primeira vez)

   O script conecta via SSH, executa `git pull` e `docker compose -f docker-compose.build.yml up -d --build` (build das imagens no proprio servidor).

5. **URLs:** Frontend em `http://SEU_SERVIDOR:8080`, Backend em `http://SEU_SERVIDOR:3000`. Confira `backend/.env` (CORS_ORIGINS deve incluir a URL do frontend).

## Estrutura do projeto

```
iAfiliado-v2/
├── backend/
│   ├── auth/              # Middlewares de autenticacao (authMiddleware, adminAuthMiddleware)
│   ├── config/            # constants.js, env.js (validacao de variaveis)
│   ├── controllers/       # Handlers das rotas (auth, admin, dashboard, support, etc.)
│   ├── middleware/        # errorHandler (asyncHandler + tratamento de erros)
│   ├── repositories/      # Acesso a dados (auth, admin, dashboard, support, etc.)
│   ├── services/          # Regras de negocio
│   ├── utils/             # logger.js, jwt.js
│   ├── errors/            # AppError, ValidationError, UnauthorizedError, etc.
│   ├── scripts/           # backup.cjs, migrate.cjs
│   ├── tests/             # Integracao, fluxos, infraestrutura (Node --test)
│   ├── db.js              # Conexao SQLite (better-sqlite3), schema
│   ├── discord.js         # Integracao Discord (webhook)
│   ├── routes.js          # Rotas, validacao (express-validator), Multer
│   ├── server.js          # Entrada do servidor (helmet, CORS, rate-limit)
│   ├── schema.sql         # DDL das tabelas
│   ├── .env               # Variaveis de ambiente (nao versionado)
│   └── .env.example       # Exemplo de configuracao
├── src/
│   ├── components/
│   │   ├── ui/            # Componentes shadcn/ui
│   │   ├── ProtectedRoute.tsx  # Protecao de rotas (auth + admin)
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts          # Estado reativo de autenticacao
│   │   ├── useFileUpload.ts    # Upload de arquivos
│   │   ├── useCopyToClipboard.ts
│   │   └── usePolling.ts       # Polling periodico com cleanup
│   ├── lib/
│   │   ├── api-client.ts  # API client centralizado (get/post/postForm/put)
│   │   ├── auth.ts        # Utilitarios de autenticacao (token/user)
│   │   ├── format.ts      # Formatadores (telefone, moeda, data)
│   │   ├── support-utils.ts  # Utilitarios de suporte (cores, status, prioridade)
│   │   └── utils.ts       # Utilitarios gerais (cn)
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── SuporteCliente.tsx
│   │   ├── SuporteAdmin.tsx
│   │   ├── Suporte.tsx
│   │   ├── Carteira.tsx
│   │   └── ...
│   ├── styles/            # index.css (Tailwind, variaveis CSS, tema global)
│   ├── test/              # setup Vitest, testes unitarios
│   ├── types/
│   │   └── index.ts       # Interfaces TypeScript (User, Ticket, Reply, etc.)
│   └── App.tsx            # Roteamento e providers
├── docs/                  # Documentacao tecnica
├── public/
└── package.json
```

## Arquitetura

### Backend

- **Constantes centralizadas** (`config/constants.js`): magic numbers e strings em um unico lugar
- **JWT centralizado** (`utils/jwt.js`): geracao de token sem duplicacao
- **Error handler** (`middleware/errorHandler.js`): `asyncHandler` elimina try-catch repetitivos; error handler trata erros do Multer, SQLite (UNIQUE, NOT NULL, FOREIGN KEY) e retorna mensagens seguras em producao (sem stack no cliente)
- **Validacao** (`routes.js`): express-validator sanitiza e valida todos os inputs antes de chegarem aos handlers
- **Rate limiting**: global (100 req/15min) e especifico para auth (10 req/15min)
- **Seguranca**: helmet (CSP, HSTS, X-Frame-Options), bcrypt (salt 10), JWT com expiracao de 1 dia, CORS configuravel

### Frontend

- **API Client** (`lib/api-client.ts`): auto-attach de Bearer token, validacao de content-type, error handling padronizado
- **Auth centralizado** (`lib/auth.ts` + `hooks/useAuth.ts`): substitui ~15 acessos diretos a localStorage
- **Hooks reutilizaveis**: `useFileUpload`, `useCopyToClipboard`, `usePolling` eliminam duplicacao
- **Tipagem completa** (`types/index.ts`): interfaces para User, Ticket, Reply, Attachment, ApiError
- **ProtectedRoute**: protecao de rotas com verificacao de auth e permissao admin

## Documentacao

| Documento | Descricao |
| --- | --- |
| [docs/API.md](docs/API.md) | Endpoints da API, exemplos e codigos de erro |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Visao geral da arquitetura e fluxos |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema do banco de dados |
| [docs/SECURITY-BACKEND.md](docs/SECURITY-BACKEND.md) | Seguranca no backend: vazamentos, vulnerabilidades e boas praticas |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Como contribuir e padroes de codigo |

### Resumo da API

**Publicas:**
- `POST /register` — Cadastro de usuario
- `POST /login` — Autenticacao
- `POST /support` — Criar ticket publico

**Autenticadas (Bearer token):**
- `GET /profile` — Perfil do usuario
- `POST /support/ticket` — Criar ticket (logado)
- `POST /support/ticket/:id/reply` — Responder ticket
- `GET /support/ticket/:id/replies` — Listar respostas
- `GET /support/my-messages` — Meus tickets

**Admin (auth + is_admin):**
- `GET /support/messages` — Todos os tickets
- `PUT /support/messages/:id` — Atualizar status/prioridade
- `GET /clients` — Listar clientes

## Autenticacao

- Login e registro retornam um **token JWT** no corpo da resposta
- Rotas protegidas: `Authorization: Bearer <token>`
- Token expira em **1 dia** (configuravel em `backend/config/constants.js`)
- Dados sensiveis (telefone) **nao** sao incluidos no token

## Troubleshooting

| Problema | Solucao |
| --- | --- |
| Banco nao conecta | Verifique `DB_PATH` no `.env` do backend ou a pasta `backend/data/` (criada automaticamente). |
| 401 em rotas protegidas | Token invalido/expirado. Faca login novamente. |
| 403 em rotas de admin | Apenas `is_admin = true` pode acessar. |
| CORS em producao | Configure `CORS_ORIGINS` no `.env` com as origens do frontend. |
| "Muitas requisicoes" | Rate limiting ativo. Aguarde 15 minutos. |
| Upload falha | Limite: 5MB por arquivo, 5 arquivos. Tipos: JPEG, PNG, WebP, PDF. |

## Licenca

ISC
