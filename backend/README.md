# Backend iAfiliado

## Variaveis de ambiente

Obrigatorias:

- `JWT_SECRET`: segredo JWT usado na assinatura e verificacao dos tokens.

Obrigatorias em producao:

- `CORS_ORIGINS`: lista separada por virgula de origens permitidas (exemplo: `https://app.exemplo.com,https://admin.exemplo.com`).

Opcionais:

- `PORT`: porta HTTP (padrao `3000`).
- `DB_PATH`: caminho do arquivo SQLite.
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

### Observabilidade

- Cada requisicao recebe `requestId` e logs estruturados com contexto de rota/metodo.
- Em erros, a API sempre responde `error`, `code` e `requestId` para rastreio.
- Em ambiente de desenvolvimento, stack trace e detalhes de erro sao logados.

### Troubleshooting rapido

- **401 UNAUTHORIZED**: token ausente, expirado ou malformatado.
- **403 FORBIDDEN**: usuario autenticado sem permissao (ex.: rotas admin).
- **400 VALIDATION_ERROR**: payload invalido (campos obrigatorios/formatos/ID).
- **409 DUPLICATE_RECORD**: conflito de unicidade no banco.
