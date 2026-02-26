# Backend iAfiliado

API REST em Node.js + Express 5 com **SQLite** (better-sqlite3), autenticacao JWT, suporte a tickets com anexos, painel admin e integracao Discord.

## Estrutura

| Pasta / arquivo | Descricao |
| --- | --- |
| `auth/` | Middlewares de autenticacao (`authMiddleware`, `adminAuthMiddleware`) |
| `config/` | Constantes (`constants.js`) e validacao de env (`env.js`) |
| `controllers/` | Handlers das rotas (auth, admin, dashboard, support, withdrawals, casinos, contracts) |
| `middleware/` | `errorHandler.js` (asyncHandler + tratamento centralizado de erros) |
| `repositories/` | Acesso a dados (auth, admin, dashboard, support, withdrawals, contracts, casinos) |
| `services/` | Regras de negocio (auth, admin, dashboard, support, contracts, withdrawals, adminLog) |
| `utils/` | `logger.js`, `jwt.js` |
| `errors/` | `AppError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError` |
| `scripts/` | `backup.cjs`, `migrate.cjs` |
| `tests/` | Testes (Node `--test`): integracao, fluxos, infraestrutura |
| `db.js` | Conexao SQLite, carregamento do `schema.sql`, migrations leves |
| `discord.js` | Envio de notificacoes via webhook Discord |
| `routes.js` | Rotas, express-validator, Multer (upload) |
| `server.js` | Entrada do servidor (helmet, CORS, rate-limit, body parser) |
| `schema.sql` | DDL das tabelas (idempotente) |

Seguranca (vazamentos, vulnerabilidades, boas praticas): [../docs/SECURITY-BACKEND.md](../docs/SECURITY-BACKEND.md).

## Variaveis de ambiente

Obrigatorias:

- `JWT_SECRET`: segredo JWT usado na assinatura e verificacao dos tokens.

Obrigatorias em producao:

- `CORS_ORIGINS`: lista separada por virgula de origens permitidas (exemplo: `https://app.exemplo.com,https://admin.exemplo.com`).

Opcionais:

- `PORT`: porta HTTP (padrao `3000`).
- `DB_PATH`: caminho do arquivo SQLite (padrao: `data/iafiliado.db` relativo ao backend). Em `NODE_ENV=test` os testes usam um arquivo temporario.
- `DISCORD_WEBHOOK_URL`: webhook para notificacoes de tickets/respostas.
- `NODE_ENV`: `development`, `test` ou `production`.
- `LOG_LEVEL`: nivel de log (`debug`, `info`, `warn`, `error`).

## Bootstrap seguro de ambiente

Na inicializacao, o backend valida automaticamente:

- `NODE_ENV` permitido (`development`, `test`, `production`).
- `JWT_SECRET` obrigatorio.
- `PORT` valido entre `1` e `65535` (quando informado).
- URLs de `CORS_ORIGINS` com protocolo `http` ou `https`.
- `JWT_SECRET` com no minimo 32 caracteres em `production`.
- `DISCORD_WEBHOOK_URL` com protocolo `https` e dominio Discord (quando definida).
- `LOG_LEVEL` com valor permitido (`debug`, `info`, `warn`, `error`) quando definido.
- Em `production`, falha o boot se `CORS_ORIGINS` estiver vazio.

## Scripts (npm)

| Comando | Descricao |
| --- | --- |
| `npm start` | Inicia o servidor (produção) |
| `npm run dev` | Inicia com `--watch` (reinicia ao alterar arquivos) |
| `npm test` | Testes de integração, fluxos e infraestrutura |
| `npm run test:integration` | Apenas testes de integração |
| `npm run test:flows` | Apenas testes de fluxo (auth, suporte, admin) |
| `npm run test:infra` | Apenas testes de infraestrutura (health, error-handler) |
| `npm run backup` | Gera backup do SQLite (ver opções em "Rotina de backup") |

## Padrao de erro da API

As respostas de erro seguem o formato:

```json
{
  "error": "Mensagem legivel",
  "code": "CODIGO_DE_ERRO",
  "requestId": "uuid-da-requisicao"
}
```

## Checklist de hardening

- [x] Bloqueio de CORS sem configuracao em producao.
- [x] Validacao de IDs e payloads nas rotas criticas.
- [x] Upload validando MIME e extensao.
- [x] Queries de update sem SQL dinamico inseguro.
- [x] Tratamento de erro padronizado com codigo e requestId.
- [x] Testes de integracao para fluxos criticos.

## Politica explicita de CORS (producao)

- `NODE_ENV=production` exige `CORS_ORIGINS` com pelo menos uma URL valida.
- Apenas origens listadas em `CORS_ORIGINS` recebem `Access-Control-Allow-Origin`.
- Origem fora da whitelist e bloqueada com erro `CORS_FORBIDDEN`.
- Nao usar `localhost` em `CORS_ORIGINS` de producao.

## Operacao e manutencao

### Rotina de deploy

1. Defina variaveis obrigatorias (`JWT_SECRET`, `CORS_ORIGINS` em producao).
2. Valide o tamanho do `JWT_SECRET` (>= 32 em producao) e revise `LOG_LEVEL`.
3. Se usar Discord, valide `DISCORD_WEBHOOK_URL` com endpoint oficial do webhook.
4. Execute `npm ci`.
5. Execute `npm test`.
6. Suba o servico com `npm start`.
7. Verifique `GET /health` apos deploy.

### Rotina de backup e restauracao

- Gerar backup manual: `npm run backup`.
- Definir retencao: `npm run backup -- --max=15`.
- Restaurar: parar o servico, substituir o arquivo em `DB_PATH` por um backup valido e subir novamente.
- Apos restauracao, validar `GET /health` e executar um `integrity_check` no SQLite.

### Testes

- `npm test`: executa testes de integracao (`tests/integration`), fluxos (`tests/flows`: auth-dashboard, suporte, admin) e infraestrutura (`tests/infrastructure`: health, error-handler).
- Em `NODE_ENV=test` o banco e um SQLite em arquivo temporario; rate-limit e desativado.

### Observabilidade

- Cada requisicao recebe `requestId` e logs estruturados com contexto de rota/metodo.
- Em producao, o path logado nao inclui query string (evita vazamento se token for enviado por engano na URL).
- Em erros, a API sempre responde `error`, `code` e `requestId` para rastreio.
- Em ambiente de desenvolvimento, stack trace e detalhes de erro sao logados; em producao a resposta ao cliente e generica e sem stack.

### Riscos operacionais e mitigacao

- Evite usar `.env` fixo em producao com segredos versionados ou copiados manualmente.
- Priorize secrets/variaveis no runtime do servidor e no pipeline de deploy.
- Mantenha revisao periodica de `CORS_ORIGINS` quando houver troca de dominio/frontend.

### Troubleshooting rapido

- **401 UNAUTHORIZED**: token ausente, expirado ou malformatado.
- **403 FORBIDDEN**: usuario autenticado sem permissao (ex.: rotas admin).
- **400 VALIDATION_ERROR**: payload invalido (campos obrigatorios/formatos/ID).
- **409 DUPLICATE_RECORD**: conflito de unicidade no banco.
