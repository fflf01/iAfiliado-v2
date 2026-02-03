# Afiliado Trabalho — Plataforma de Afiliados

Plataforma web para gestão de afiliados, com autenticação, painel administrativo e sistema de suporte com tickets.

## Tecnologias

### Frontend

- **React** + **TypeScript**
- **Vite** — build e dev server
- **Tailwind CSS** + **shadcn/ui** — interface
- **React Router** — rotas
- **React Hook Form** + **Zod** — formulários e validação
- **TanStack Query** — requisições e cache

### Backend

- **Node.js** + **Express**
- **PostgreSQL** — banco de dados
- **JWT** — autenticação
- **bcrypt** — hash de senhas
- **Multer** — upload de arquivos (anexos em tickets)
- **dotenv** — variáveis de ambiente

## Pré-requisitos

- Node.js (recomendado: LTS)
- PostgreSQL
- npm ou bun

## Quick Start

### 1. Clonar e instalar dependências

```sh
git clone <URL_DO_REPOSITORIO>
cd afiliado_trab
npm install
```

### 2. Variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores (crie `.env` na raiz ou em `backend/`, conforme onde o servidor for executado):

```sh
cp backend/.env.example .env
```

Edite o `.env` com suas credenciais (banco de dados, `JWT_SECRET`). O backend lê o `.env` na raiz ou em `backend/`. Veja [docs/DATABASE.md](docs/DATABASE.md) para o schema completo.

### 3. Banco de dados

Crie o banco no PostgreSQL. As tabelas necessárias são: `clients`, `support_messages`, `support_replies`, `support_attachments`. O schema detalhado e a ordem de criação estão em **[docs/DATABASE.md](docs/DATABASE.md)**. Para criar/atualizar as tabelas de suporte, execute:

```sh
node backend/update_support_schema.js
```

(A tabela `clients` e a estrutura inicial de `support_messages` precisam existir antes; consulte DATABASE.md.)

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

Para desenvolvimento, é necessário ter os dois rodando (front em 5173, back em 3000).

## Scripts disponíveis

| Comando                     | Descrição                            |
| --------------------------- | ------------------------------------ |
| `npm run dev`               | Sobe o frontend (Vite)               |
| `npm run build`             | Build de produção do frontend        |
| `npm run preview`           | Preview do build                     |
| `npm run lint`              | Executa o ESLint                     |
| `npm run test`              | Executa os testes (Vitest)           |
| `npm run test:e2e`          | Testes E2E no navegador (Playwright) |
| `npm run test:e2e:security` | Apenas testes E2E de segurança       |
| `npm run test:e2e:ui`       | Playwright em modo UI (debug)        |

O backend é iniciado manualmente: `node backend/server.js`.

### Testes E2E e segurança

Os testes E2E rodam no navegador (Chromium) e incluem **testes de segurança** em `e2e/security/`:

- **auth-redirect**: redirecionamento para `/login` ao acessar `/dashboard` sem autenticação.
- **login-invalid**: credenciais inválidas não devem fazer login nem redirecionar; exibição de feedback de erro.
- **admin-access**: acesso à rota admin sem login; API retorna 403 para usuário não-admin em `/support/messages`.
- **xss-basic**: payloads XSS nos campos de login/senha não são executados (conteúdo escapado).

Para rodar: ter o **backend** em `http://localhost:3000` (para testes de login/admin). O Playwright sobe o frontend automaticamente em `http://localhost:8080`. Execute:

```sh
npm run test:e2e
# ou só os testes de segurança:
npm run test:e2e:security
```

## Estrutura do projeto

```
afiliado_trab/
├── backend/           # API Express
│   ├── auth/          # Registro, login, middlewares de auth
│   ├── controllers/
│   ├── middleware/
│   ├── support/       # Tickets e mensagens de suporte
│   ├── db.js          # Pool PostgreSQL
│   ├── discord.js     # Integração Discord (notificações)
│   ├── routes.js      # Rotas da API
│   └── server.js      # Entrada do servidor
├── src/               # Frontend React
│   ├── components/    # Componentes e UI
│   ├── pages/         # Páginas (Login, Dashboard, Suporte, etc.)
│   ├── hooks/
│   └── lib/
├── public/
├── docs/              # Documentação técnica
└── package.json
```

## Documentação

| Documento                                    | Descrição                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| [docs/API.md](docs/API.md)                   | Endpoints da API, exemplos de request/response e códigos de erro                  |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Visão geral da arquitetura e fluxos (auth, suporte)                               |
| [docs/DATABASE.md](docs/DATABASE.md)         | Schema do banco (clients, support_messages, support_replies, support_attachments) |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Como contribuir, padrões de código e processo de desenvolvimento                  |

Resumo da API:

- **Públicas:** `POST /register`, `POST /login`, `POST /support`, `GET /clients`
- **Autenticadas:** `GET /profile`, criação de ticket com usuário, respostas, minhas mensagens
- **Admin:** `GET /admin`, `GET /support/messages`, `PUT /support/messages/:id`

## Autenticação

- Login e registro retornam um **token JWT** no corpo da resposta.
- Para rotas protegidas, envie no header: `Authorization: Bearer <token>`.
- O token expira em **1 dia** (configurável no código).

## Suporte

- Tickets podem ser criados **sem login** (`POST /support`) ou **logado** (`POST /support/ticket`).
- Usuários logados podem ver suas mensagens em `GET /support/my-messages`.
- Admins listam todas as mensagens em `GET /support/messages` e podem atualizar status/prioridade com `PUT /support/messages/:id`.
- Anexos: multipart/form-data, limite de 5 MB por arquivo; servidos em `/uploads`.

## Troubleshooting

| Problema                        | Possível causa                                                  | Solução                                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco não conecta               | `DB_PASSWORD` ausente ou incorreto, PostgreSQL não está rodando | Verifique o `.env` e que o PostgreSQL está ativo. Confira a mensagem no console ao subir o backend.                                                                        |
| 401 ao acessar rotas protegidas | Token inválido ou expirado                                      | Faça login novamente para obter um novo token. Verifique se o header é `Authorization: Bearer <token>`.                                                                    |
| 403 em rotas de admin           | Usuário não é admin                                             | Apenas usuários com `is_admin = true` podem acessar `/admin` e rotas de suporte admin.                                                                                     |
| CORS ao chamar API do front     | Backend não permite origem do frontend                          | O backend usa `cors()` sem restrição de origem em desenvolvimento. Confirme que a API está em `http://localhost:3000` e que o front usa essa URL.                          |
| 404 em `/uploads/...`           | Pasta de uploads inexistente ou caminho errado                  | O servidor serve uploads de `src/assets/uploads`. O Multer cria a pasta ao receber o primeiro upload. Verifique que `server.js` monta `express.static` no caminho correto. |

## Licença

ISC
