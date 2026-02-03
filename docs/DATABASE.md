# Schema do banco de dados — Afiliado Trabalho

Documentação das tabelas PostgreSQL usadas pelo backend e ordem recomendada de criação/migração.

## Ordem de criação

1. **clients** — usuários da plataforma (obrigatório primeiro).
2. **support_messages** — tickets de suporte (depende indiretamente de `clients` por `user_id` opcional).
3. Executar **`node backend/update_support_schema.js`** para criar `support_replies`, `support_attachments` e adicionar as colunas extras em `support_messages` (status, priority, phone, ticket_code) se ainda não existirem.

---

## Tabela `clients`

Usada por registro, login e associação de tickets a usuários logados. Inferida a partir de [backend/auth/register.js](backend/auth/register.js) e [backend/auth/login.js](backend/auth/login.js).

| Coluna        | Tipo    | Descrição                          |
| ------------- | ------- | ---------------------------------- |
| id            | SERIAL  | Chave primária                     |
| name          | VARCHAR | Nome do cliente                    |
| login         | VARCHAR | Login único                        |
| email         | VARCHAR | E-mail único                       |
| password_hash | VARCHAR | Senha hasheada (bcrypt)            |
| phone         | VARCHAR | Telefone (opcional)                |
| tipo_cliente  | VARCHAR | Tipo do cliente (opcional)         |
| tele_an       | VARCHAR | Telegram (opcional)                |
| rede_an       | VARCHAR | Rede afiliado (opcional)           |
| is_admin      | BOOLEAN | Se é administrador (default false) |

**Sugestão de criação (SQL):**

```sql
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  login VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  tipo_cliente VARCHAR(50),
  tele_an VARCHAR(100),
  rede_an VARCHAR(100),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

_(O código atual não exige `created_at`; incluir é recomendado para auditoria.)_

---

## Tabela `support_messages`

Cada linha é um ticket de suporte (abertura). Pode ter `user_id` nulo (ticket público) ou preenchido (usuário logado).

| Coluna      | Tipo         | Descrição                                                 |
| ----------- | ------------ | --------------------------------------------------------- |
| id          | SERIAL       | Chave primária                                            |
| name        | VARCHAR      | Nome de quem abriu o ticket                               |
| email       | VARCHAR      | E-mail                                                    |
| subject     | VARCHAR/TEXT | Assunto                                                   |
| message     | TEXT         | Mensagem inicial                                          |
| priority    | VARCHAR(20)  | `low`, `medium`, `high` (default: `medium`)               |
| phone       | VARCHAR(20)  | Telefone (opcional)                                       |
| user_id     | INTEGER      | FK para `clients(id)` (opcional, ticket público)          |
| status      | VARCHAR(20)  | Ex.: `unread`, `read`, `replied` (adicionado pelo script) |
| ticket_code | VARCHAR(50)  | Código exibido (ex.: `SUP-1001`) (adicionado pelo script) |
| created_at  | TIMESTAMP    | Data de criação                                           |

**Sugestão de criação (SQL) — tabela base antes do script:**

```sql
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  phone VARCHAR(20),
  user_id INTEGER REFERENCES clients(id),
  status VARCHAR(20) DEFAULT 'unread',
  ticket_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Se a tabela já existir sem `status`, `priority`, `phone` ou `ticket_code`, o script `update_support_schema.js` adiciona essas colunas com `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

---

## Tabela `support_replies`

Respostas de um ticket. Criada por [backend/update_support_schema.js](backend/update_support_schema.js).

| Coluna      | Tipo        | Descrição                                        |
| ----------- | ----------- | ------------------------------------------------ |
| id          | SERIAL      | Chave primária                                   |
| ticket_id   | INTEGER     | FK para `support_messages(id)` ON DELETE CASCADE |
| user_id     | INTEGER     | FK para `clients(id)` (opcional)                 |
| sender_type | VARCHAR(20) | `'user'` ou `'support'`                          |
| message     | TEXT        | Texto da resposta                                |
| created_at  | TIMESTAMP   | Data de criação                                  |

---

## Tabela `support_attachments`

Anexos de tickets (mensagem inicial ou respostas). O código associa anexos ao `ticket_id`; anexos de resposta usam o mesmo `ticket_id`. Criada por `update_support_schema.js`.

| Coluna     | Tipo         | Descrição                                        |
| ---------- | ------------ | ------------------------------------------------ |
| id         | SERIAL       | Chave primária                                   |
| ticket_id  | INTEGER      | FK para `support_messages(id)` ON DELETE CASCADE |
| filename   | VARCHAR(255) | Nome do arquivo                                  |
| path       | VARCHAR(255) | Caminho no disco                                 |
| mimetype   | VARCHAR(100) | Tipo MIME (opcional)                             |
| created_at | TIMESTAMP    | Data de criação                                  |

---

## Migrações

O script atual de atualização do schema de suporte é:

```sh
node backend/update_support_schema.js
```

Ele:

- Adiciona em `support_messages`: `status`, `priority`, `phone`, `ticket_code` (se não existirem).
- Cria `support_replies` e `support_attachments` se não existirem.

Não cria a tabela `clients` nem a tabela base `support_messages`; essas precisam existir antes (crie manualmente com os SQLs acima ou com suas migrações próprias).
