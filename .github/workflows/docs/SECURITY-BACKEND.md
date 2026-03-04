# Segurança no Backend (iAfiliado v2)

Análise de vazamento de dados e vulnerabilidades no backend, e boas práticas aplicadas.

## O que foi verificado

### Autenticação e senha

- **Senha:** nunca retornada na API. O repositório usa `findPublicById` / listagens sem a coluna `password_hash`; no login o hash é removido (`delete user.password_hash`) antes de devolver o usuário.
- **Hash:** bcrypt com `AUTH.SALT_ROUNDS` (10); senha validada com `bcrypt.compare`; tamanho mínimo em `AUTH.MIN_PASSWORD_LENGTH` (8) e regra de letra + número no `authService`.
- **JWT:** assinado com `JWT_SECRET` (variável de ambiente); expiração em `AUTH.TOKEN_EXPIRY` ("1d"); payload contém apenas `id`, `full_name`, `email`, `is_admin`, `is_manager`. Token nunca é logado.
- **Cookie HttpOnly:** o token é enviado ao cliente via `Set-Cookie` (nome `auth_token`) com `HttpOnly`, `Secure` em produção, `SameSite=Strict` e `Path=/`. O middleware de auth aceita o token do cookie ou do header `Authorization: Bearer` (para clientes não-browser ou testes). `POST /logout` limpa o cookie.

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
- **CSP no Nginx:** o documento HTML e a SPA são servidos pelo Nginx; o `nginx.conf` inclui `Content-Security-Policy` para que a resposta da página (não só da API) tenha CSP e mitigue XSS. A API continua com CSP via Helmet nas respostas de `/api/*`.

---

## Verificação: CSP ausente na resposta (Nginx)

**Afirmação:** "O header Content-Security-Policy não está configurado, deixando a aplicação vulnerável a XSS."

**Resultado:** **Verdadeiro para o documento servido pelo Nginx.** O backend (Express/Helmet) aplica CSP **apenas nas respostas da API** (`/api/*`) e somente em produção. As respostas do **frontend** (HTML, SPA) vêm do **Nginx** (`nginx.conf`), que não adicionava CSP; quem acessa a página (GET `/`) recebia headers como `x-frame-options`, `strict-transport-security`, etc., mas **sem** `Content-Security-Policy`. O documento que carrega o JavaScript é justamente onde o CSP mais importa para XSS.

**Ajuste:** Foi adicionado `add_header Content-Security-Policy` no `nginx.conf` para que todas as respostas do Nginx (incluindo o documento e assets) enviem CSP. Recomenda-se revisar as diretivas (ex.: `script-src 'unsafe-inline' 'unsafe-eval'`) e restringir quando possível (ex.: nonces ou hashes para scripts).

---

## Verificação: Proteção contra força bruta (parcial)

**Afirmação:** "O rate limiting só é acionado após múltiplas tentativas rápidas; tentativas espaçadas não são bloqueadas."

**Resultado:** **Verdadeiro.** O limite de auth é **por número de requisições na janela** (`RATE_LIMIT.AUTH`: 10 requisições por 15 minutos por IP). Comportamento observado:
- Várias tentativas **rápidas** (ex.: 9+ em sequência) → 429 (rate limit).
- Tentativas **espaçadas** (ex.: 6 tentativas a cada 0,5 s) → todas recebem 401 (credenciais inválidas), mas **nenhum 429**, pois 6 &lt; 10 na mesma janela.

Ou seja, um atacante pode fazer até **10 tentativas de login por 15 minutos por IP** (rápidas ou espaçadas) sem ser bloqueado; só a 11ª na mesma janela retorna 429. Não existe **bloqueio por conta** (ex.: travar a conta após N senhas erradas para o mesmo usuário).

**Recomendação (não implementada aqui):** além do rate limit por IP, considerar bloqueio temporário por **conta** (ex.: após 5 falhas de login para o mesmo email/usuário, bloquear por 15 minutos) e/ou aumento do custo de tentativas (ex.: CAPTCHA após 3 falhas).

---

## Ajustes feitos

1. **CSP no Nginx**  
   Inclusão de `Content-Security-Policy` no `nginx.conf` para as respostas do frontend (documento e SPA), de modo que o CSP não fique ausente quando a página é servida pelo Nginx.

2. **Log em produção**  
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
| JWT / cookie      | OK       | Token em cookie HttpOnly (Secure, SameSite=Strict); Bearer aceito para testes/API |
| JWT               | OK       | Secret de env; expiração 1d; payload mínimo                |
| SQL               | OK       | Prepared statements; IN dinâmico com placeholders          |
| Erro (cliente)    | OK       | Produção: mensagem genérica; sem stack                     |
| Erro (log)        | OK       | Stack só em desenvolvimento                               |
| Upload            | OK       | Nome sanitizado (basename + replace); MIME/ext validados   |
| AuthZ             | OK       | Admin e recursos por req.user.id                          |
| Log path          | Ajustado | Produção: apenas path, sem query string                    |

---

## Verificação: “Senha em texto plano no payload” (login)

**Afirmação:** “As senhas dos usuários estão sendo enviadas em texto plano no payload das requisições de login.”

**Resultado da verificação (testes em `backend/tests/integration/login-password-security.test.js`):**

1. **Senha no body da requisição** — **Verdadeiro.** O cliente envia `{ "login": "...", "password": "..." }` em JSON no `POST /api/login`. Isso é o comportamento esperado de login via HTTP: a senha vai no body; a proteção em trânsito é o **HTTPS** (TLS), que criptografa o corpo da requisição. Não é prática padrão fazer hash da senha no cliente antes de enviar para login (o servidor compara com o hash armazenado).

2. **Captura em logs do servidor** — **Falso na implementação atual.** Os testes confirmam que o backend **não** registra o body da requisição. O logger de requisição usa apenas `requestId`, `method`, `path` (e em produção, `path` sem query string). Nenhum trecho de código grava `req.body` em log. O teste “POST /login NÃO registra a senha em logs do servidor” faz login com uma senha única e verifica que ela não aparece em nenhuma saída de `console.log`/`warn`/`error`.

3. **Proxies/intermediários** — O risco existe **somente** se a aplicação for acessada por **HTTP** (sem TLS). Em produção, o tráfego deve ser **HTTPS** (Nginx ou outro terminador TLS na frente do backend), de forma que o payload (incluindo a senha) seja criptografado em trânsito.

**Recomendações já atendidas:** não logar corpo de requisição; não retornar senha nem hash na resposta. **Recomendação de deploy:** garantir sempre HTTPS em produção para `/login` e demais rotas sensíveis.
