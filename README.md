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
- **PostgreSQL** (Supabase) — banco de dados com SSL
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
- PostgreSQL (ou Supabase)
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

Variaveis obrigatorias:

| Variavel | Descricao |
| --- | --- |
| `DB_HOST` | Host do PostgreSQL (ex: `db.xxx.supabase.co`) |
| `DB_PORT` | Porta (padrao: `5432`) |
| `DB_NAME` | Nome do banco (padrao: `postgres`) |
| `DB_USER` | Usuario do banco |
| `DB_PASSWORD` | Senha do banco |
| `JWT_SECRET` | Chave secreta para assinatura JWT |
| `CORS_ORIGINS` | Origens permitidas em producao (separadas por virgula) |
| `DISCORD_WEBHOOK_URL` | URL do webhook Discord para notificacoes |

Frontend (opcional, para build de producao):

| Variavel | Descricao |
| --- | --- |
| `VITE_API_BASE_URL` | URL base da API (padrao: `http://localhost:3000`) |

### 3. Banco de dados

O projeto usa PostgreSQL. As tabelas necessarias sao:

- `clients` — usuarios e afiliados
- `support_messages` — tickets de suporte
- `support_replies` — respostas aos tickets
- `support_attachments` — anexos de tickets/respostas

Consulte [docs/DATABASE.md](docs/DATABASE.md) para o schema completo e ordem de criacao.

### 4. Executar o projeto

**Frontend (Vite):**

```sh
npm run dev
```

Acesse: `http://localhost:5173`

**Backend (Express):**

```sh
node backend/server.js
```

API em: `http://localhost:3000`

Para desenvolvimento, ambos precisam estar rodando.

## Scripts disponiveis

| Comando | Descricao |
| --- | --- |
| `npm run dev` | Sobe o frontend (Vite) |
| `npm run build` | Build de producao do frontend |
| `npm run preview` | Preview do build |
| `npm run lint` | Executa o ESLint |
| `npm run test` | Executa os testes (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run test:e2e:security` | Apenas testes E2E de seguranca |

## Estrutura do projeto

```
iAfiliado-v2/
├── backend/
│   ├── auth/              # Login, registro, middlewares de auth
│   ├── config/
│   │   └── constants.js   # Constantes centralizadas (AUTH, UPLOAD, TICKET, RATE_LIMIT)
│   ├── middleware/
│   │   ├── errorHandler.js  # asyncHandler + error handler centralizado
│   │   └── adminAuthMiddleware.js
│   ├── support/
│   │   └── message.js     # CRUD de tickets, respostas e anexos
│   ├── utils/
│   │   └── jwt.js         # Geracao centralizada de tokens JWT
│   ├── db.js              # Pool PostgreSQL com SSL automatico
│   ├── discord.js         # Integracao Discord (webhook)
│   ├── routes.js          # Rotas, validacao e rate limiting
│   ├── server.js          # Entrada do servidor
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
- **Error handler** (`middleware/errorHandler.js`): `asyncHandler` elimina try-catch repetitivos; error handler trata erros do Multer, Postgres (23505) e retorna mensagens seguras em producao
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
| Banco nao conecta | Verifique `DB_*` no `.env`. Para Supabase, SSL e habilitado automaticamente. |
| 401 em rotas protegidas | Token invalido/expirado. Faca login novamente. |
| 403 em rotas de admin | Apenas `is_admin = true` pode acessar. |
| CORS em producao | Configure `CORS_ORIGINS` no `.env` com as origens do frontend. |
| "Muitas requisicoes" | Rate limiting ativo. Aguarde 15 minutos. |
| Upload falha | Limite: 5MB por arquivo, 5 arquivos. Tipos: JPEG, PNG, WebP, PDF. |

## Licenca

ISC
