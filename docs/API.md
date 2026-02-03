# Documentação da API — Afiliado Trabalho

Base URL (desenvolvimento): `http://localhost:3000`

## Autenticação

Rotas protegidas exigem o header:

```
Authorization: Bearer <token>
```

O token é retornado em `POST /register` e `POST /login`. Expira em 1 dia.

- **401**: token ausente, inválido ou expirado — resposta: `{ error: "mensagem" }`.
- **403**: token válido mas sem permissão (ex.: rota admin com usuário não-admin) — resposta: `{ error: "mensagem" }`.

---

## Formato de erro

Respostas de erro usam o formato:

```json
{ "error": "mensagem descritiva" }
```

---

## Rotas públicas

### POST `/register`

Registra um novo cliente.

**Body (JSON):**

| Campo         | Tipo   | Obrigatório | Descrição       |
| ------------- | ------ | ----------- | --------------- |
| name          | string | Sim         | Nome            |
| login         | string | Sim         | Login único     |
| email         | string | Sim         | E-mail único    |
| password_hash | string | Sim         | Senha em texto  |
| phone         | string | Não         | Telefone        |
| Tipo_Cliente  | string | Não         | Tipo do cliente |
| Tele_An       | string | Não         | Telegram        |
| Rede_An       | string | Não         | Rede afiliado   |

**Exemplo de request:**

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","login":"joao1","email":"joao@exemplo.com","password_hash":"senha123"}'
```

**Exemplo de response (201):**

```json
{
  "message": "Usuário registrado com sucesso",
  "user": {
    "id": 1,
    "name": "João",
    "login": "joao1",
    "email": "joao@exemplo.com",
    "phone": null,
    "is_admin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respostas:**

- `201` — Sucesso. Body: `{ message, user, token }`
- `400` — Campos obrigatórios ausentes. Ex.: `{ "error": "Campos obrigatórios ausentes" }`
- `409` — E-mail ou login já em uso. Ex.: `{ "error": "Este e-mail já está em uso." }`
- `500` — Erro interno

---

### POST `/login`

Autentica e retorna token.

**Body (JSON):**

| Campo    | Tipo   | Obrigatório | Descrição               |
| -------- | ------ | ----------- | ----------------------- |
| email    | string | Condicional | E-mail (ou use `login`) |
| login    | string | Condicional | Login (ou use `email`)  |
| password | string | Sim         | Senha em texto          |

Pelo menos um de `email` ou `login` é obrigatório.

**Exemplo de request:**

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"login":"joao1","password":"senha123"}'
```

**Exemplo de response (200):**

```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "name": "João",
    "login": "joao1",
    "email": "joao@exemplo.com",
    "phone": null,
    "is_admin": false
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respostas:**

- `200` — Sucesso. Body: `{ message, user, token }`
- `400` — Email/Login e senha obrigatórios. Ex.: `{ "error": "Email/Login e senha são obrigatórios." }`
- `401` — Credenciais inválidas. Ex.: `{ "error": "Credenciais inválidas." }`
- `500` — Erro interno

---

### POST `/support`

Cria ticket de suporte **sem login** (formulário público).

**Content-Type:** `multipart/form-data`

**Campos:**

| Campo       | Tipo   | Obrigatório | Descrição                                   |
| ----------- | ------ | ----------- | ------------------------------------------- |
| name        | string | Sim         | Nome                                        |
| email       | string | Sim         | E-mail                                      |
| subject     | string | Sim         | Assunto                                     |
| title       | string | Sim\*       | Alternativa a `subject`                     |
| message     | string | Sim         | Mensagem                                    |
| priority    | string | Não         | `low`, `medium`, `high` (default: `medium`) |
| phone       | string | Não         | Telefone                                    |
| attachments | file[] | Não         | Anexos (até 5 MB cada)                      |

**Exemplo de request (curl com arquivo):**

```bash
curl -X POST http://localhost:3000/support \
  -F "name=Maria" \
  -F "email=maria@exemplo.com" \
  -F "subject=Dúvida" \
  -F "message=Preciso de ajuda com minha conta."
```

**Exemplo de response (201):**

```json
{
  "message": "Ticket criado com sucesso!",
  "id": "SUP-1"
}
```

**Respostas:**

- `201` — Sucesso. Body: `{ message: "Ticket criado com sucesso!", id: "SUP-<id>" }`
- `400` — Nome, email, assunto e mensagem obrigatórios. Ex.: `{ "error": "Nome, email, assunto e mensagem são obrigatórios." }`
- `500` — Erro interno

---

### GET `/clients`

Lista todos os clientes (rota temporária, sem auth).

**Resposta:** `200` — Array de objetos `{ id, name, login, email, phone, is_admin }`

---

## Rotas autenticadas (Bearer token)

### GET `/profile`

Retorna dados do usuário autenticado.

**Resposta:** `200` — `{ message, user }` (user = payload do JWT)

---

### POST `/support/ticket`

Cria ticket de suporte **com usuário logado**. Prioridade pode ser definida automaticamente para VIP/gestor/influencer.

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data`

Campos iguais a `POST /support` (name, email, subject/title, message, priority, phone, attachments).

**Respostas:**

- `201` — `{ message, id: "SUP-<id>" }`
- `400` — Validação
- `500` — Erro interno

---

### POST `/support/ticket/:id/reply`

Adiciona resposta a um ticket.

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data`

| Campo       | Tipo   | Obrigatório | Descrição          |
| ----------- | ------ | ----------- | ------------------ |
| message     | string | Sim         | Texto da resposta  |
| attachments | file[] | Não         | Anexos (5 MB cada) |

**Respostas:**

- `201` — Objeto da resposta criada (incluindo `attachments` se houver)
- `400` — Mensagem obrigatória
- `404` — Ticket não encontrado
- `500` — Erro interno

---

### GET `/support/ticket/:id/replies`

Lista respostas de um ticket.

**Headers:** `Authorization: Bearer <token>`

**Resposta:** `200` — Array de respostas (com anexos quando existirem)

---

### GET `/support/my-messages`

Lista tickets do usuário logado.

**Headers:** `Authorization: Bearer <token>`

**Exemplo de request:**

```bash
curl -X GET http://localhost:3000/support/my-messages \
  -H "Authorization: Bearer <seu_token>"
```

**Exemplo de response (200):**

```json
[
  {
    "id": 1,
    "name": "João",
    "email": "joao@exemplo.com",
    "subject": "Dúvida",
    "message": "Preciso de ajuda.",
    "priority": "medium",
    "status": "unread",
    "ticket_code": "SUP-1",
    "created_at": "2025-02-02T12:00:00.000Z",
    "attachments": []
  }
]
```

**Resposta:** `200` — Array de mensagens/tickets do usuário (com anexos). `401` se token inválido.

---

## Rotas de administrador

Exigem token **e** usuário com `is_admin = true`.

### GET `/admin`

Verificação de acesso admin.

**Resposta:** `200` — `{ message: "Bem-vindo, admin 👑" }`

---

### GET `/support/messages`

Lista **todas** as mensagens de suporte (admin).

**Headers:** `Authorization: Bearer <token>` (admin)

**Resposta:** `200` — Array de todas as mensagens (com anexos)

---

### PUT `/support/messages/:id`

Atualiza status ou prioridade de um ticket (admin).

**Headers:** `Authorization: Bearer <token>` (admin)

**Body (JSON):**

| Campo    | Tipo   | Obrigatório | Descrição       |
| -------- | ------ | ----------- | --------------- |
| status   | string | Não         | Novo status     |
| priority | string | Não         | Nova prioridade |

Pelo menos um de `status` ou `priority` deve ser enviado.

**Exemplo de request:**

```bash
curl -X PUT http://localhost:3000/support/messages/1 \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"status":"read","priority":"high"}'
```

**Exemplo de response (200):**

```json
{
  "id": 1,
  "name": "Maria",
  "email": "maria@exemplo.com",
  "subject": "Dúvida",
  "message": "Preciso de ajuda.",
  "priority": "high",
  "status": "read",
  "ticket_code": "SUP-1",
  "created_at": "2025-02-02T12:00:00.000Z"
}
```

**Respostas:**

- `200` — Objeto da mensagem atualizada
- `400` — Nenhum campo para atualizar. Ex.: `{ "error": "Forneça status ou prioridade para atualizar." }`
- `403` — Token válido mas usuário não é admin
- `404` — Mensagem não encontrada. Ex.: `{ "error": "Mensagem não encontrada." }`
- `500` — Erro interno

---

## Uploads (arquivos estáticos)

Anexos de tickets são servidos em:

```
GET /uploads/<filename>
```

O caminho físico é `src/assets/uploads`. Limite por arquivo: 5 MB.

---

## Códigos de erro comuns

| Código | Significado                                        |
| ------ | -------------------------------------------------- |
| 400    | Requisição inválida (campos faltando ou inválidos) |
| 401    | Não autenticado ou token inválido/expirado         |
| 403    | Sem permissão (ex.: rota admin para não-admin)     |
| 404    | Recurso não encontrado                             |
| 409    | Conflito (ex.: email/login já em uso)              |
| 500    | Erro interno do servidor                           |

Respostas de erro têm o formato: `{ "error": "mensagem" }`. Em rotas protegidas, token inválido ou expirado retorna **401**; token válido mas sem permissão (ex.: não-admin em rota admin) retorna **403**.
