# Segurança no Backend (iAfiliado v2)

Análise de vazamento de dados e vulnerabilidades no backend, e boas práticas aplicadas.

## O que foi verificado

### Autenticação e senha

- **Senha:** nunca retornada na API. O repositório usa `findPublicById` / listagens sem a coluna `password_hash`; no login o hash é removido (`delete user.password_hash`) antes de devolver o usuário.
- **Hash:** bcrypt com `AUTH.SALT_ROUNDS` (10); senha validada com `bcrypt.compare`; tamanho mínimo em `AUTH.MIN_PASSWORD_LENGTH` (8) e regra de letra + número no `authService`.
- **JWT:** assinado com `JWT_SECRET` (variável de ambiente); expiração em `AUTH.TOKEN_EXPIRY` ("1d"); payload contém apenas `id`, `full_name`, `email`, `is_admin`, `is_manager`. Token nunca é logado.

### SQL e injeção

- **Consultas:** uso de prepared statements (`.prepare()` + `.get()` / `.run()` / `.all()` com parâmetros). Nenhuma concatenação de entrada do usuário na SQL.
- **IN dinâmico:** em `supportRepository.listAttachmentsByTicketIds`, os placeholders são gerados a partir do tamanho do array (`?` por id) e os valores passados por parâmetro (`.all(...ticketIds)`), sem interpolação de dados na string SQL.

### Tratamento de erros

- **Resposta ao cliente:** em produção a mensagem genérica é "Erro interno do servidor."; stack **não** é enviada. Em desenvolvimento o stack pode aparecer na resposta (apenas local).
- **Log:** stack só é incluída no log em desenvolvimento (`!isProduction`); em produção apenas `err.message` é logado.
- **Validação:** erros de validação retornam `code` e `message`; o campo `details` do `AppError` é usado apenas no log, **não** é enviado no corpo da resposta (evita vazar detalhes de payload no cliente).

### Upload de arquivos

- **Nome do arquivo:** `sanitizeFilename` usa `path.basename(originalName)` e substitui caracteres não permitidos por `_` (`[^a-zA-Z0-9._-]`), evitando path traversal e nomes perigosos.
- **Nome final:** `timestamp-random-sanitized.ext` reduz previsibilidade e conflitos.
- **Tipo:** validação por MIME e extensão permitida (`UPLOAD.ALLOWED_MIMES`, `ALLOWED_EXTENSIONS_BY_MIME`); limites de tamanho e quantidade (`MAX_FILE_SIZE`, `MAX_FILES`).

### Autorização e rotas

- **Admin:** rotas `/admin/*` e equivalentes exigem `authMiddleware` + `adminAuthMiddleware` (verificação de `req.user.is_admin`).
- **Recursos por usuário:** endpoints como `/me/*`, `/profile`, suporte por ticket usam `req.user.id` (do JWT) para filtrar dados; não há uso de id vindo do corpo/query sem checagem.

### Rate limit e CORS

- **Rate limit:** global (`RATE_LIMIT.GLOBAL`) e limitadores específicos para auth e suporte; em teste (`isTest`) o rate limit é desativado.
- **CORS:** origens configuradas por variável de ambiente; em produção sem `CORS_ORIGINS` a aplicação depende da validação explícita (configurar sempre em produção).

### Headers de segurança

- **Helmet:** usado com CSP em produção (`defaultSrc`, `scriptSrc`, etc.); `crossOriginEmbedderPolicy: false` para compatibilidade com recursos cross-origin necessários.

---

## Ajustes feitos

1. **Log em produção**  
   O contexto do logger de requisição passou a usar apenas `req.path` em produção, em vez de `req.originalUrl`. Assim, query strings (que poderiam conter token ou outros dados sensíveis por engano) não são persistidas nos logs.

---

## Boas práticas recomendadas

- **Variáveis de ambiente:** manter `JWT_SECRET` forte e único por ambiente; não commitar `.env`. Em produção, definir `CORS_ORIGINS` e demais vars obrigatórias.
- **Uploads públicos:** a rota `/uploads` é servida com `express.static` (pública). Quem souber o nome do arquivo pode acessá-lo. Os nomes são não previsíveis (timestamp + random). Se precisar de controle por usuário/ticket, considerar rota autenticada que verifica pertinência antes de servir o arquivo.
- **Logs:** não logar corpo de requisição (senha, token). O logger atual não inclui body; em produção o path já não inclui query string.
- **Dependências:** manter `bcrypt`, `jsonwebtoken`, `express`, `helmet` e demais pacotes atualizados; rodar `npm audit` periodicamente.

---

## Referência rápida

| Área              | Status   | Observação                                                |
|-------------------|----------|------------------------------------------------------------|
| Senha / hash      | OK       | bcrypt; nunca retornada; removida antes de enviar user     |
| JWT               | OK       | Secret de env; expiração 1d; payload mínimo                |
| SQL               | OK       | Prepared statements; IN dinâmico com placeholders          |
| Erro (cliente)    | OK       | Produção: mensagem genérica; sem stack                     |
| Erro (log)        | OK       | Stack só em desenvolvimento                               |
| Upload            | OK       | Nome sanitizado (basename + replace); MIME/ext validados   |
| AuthZ             | OK       | Admin e recursos por req.user.id                          |
| Log path          | Ajustado | Produção: apenas path, sem query string                    |
