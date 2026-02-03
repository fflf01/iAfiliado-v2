# Como contribuir — Afiliado Trabalho

Obrigado por considerar contribuir. Este documento descreve como configurar o ambiente, rodar o projeto e seguir os padrões do repositório.

## Configuração do ambiente

1. **Clone e dependências**

   ```sh
   git clone <URL_DO_REPOSITORIO>
   cd afiliado_trab
   npm install
   ```

2. **Variáveis de ambiente**

   Copie o arquivo de exemplo e preencha com seus valores:

   ```sh
   cp backend/.env.example .env
   ```

   Edite o `.env` (na raiz ou em `backend/`, conforme onde você executa o servidor) com `DB_*`, `JWT_SECRET` e, opcionalmente, `DISCORD_WEBHOOK_URL`. Veja o [README](README.md) e [docs/DATABASE.md](docs/DATABASE.md).

3. **Banco de dados**

   Crie o banco PostgreSQL e as tabelas conforme [docs/DATABASE.md](docs/DATABASE.md). Depois execute:

   ```sh
   node backend/update_support_schema.js
   ```

## Rodando o projeto

- **Frontend:** `npm run dev` — acesse `http://localhost:5173`
- **Backend:** `node backend/server.js` — API em `http://localhost:3000`

Em desenvolvimento é necessário ter os dois rodando.

## Testes e lint

- **Testes:** `npm run test` (Vitest)
- **Lint:** `npm run lint` (ESLint)

Antes de enviar alterações, garanta que os testes e o lint passem.

## Padrões de código

- Siga as regras do **ESLint** do projeto.
- Prefira nomes claros e funções pequenas; evite comentários óbvios.
- Comentários e documentação podem ser em português ou inglês; mantenha consistência no mesmo arquivo ou módulo.
- **Documentação:**
  - Visão geral e quick start: [README](README.md)
  - Detalhes técnicos: [docs/API.md](docs/API.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DATABASE.md](docs/DATABASE.md)
  - Funções e módulos públicos: use JSDoc (backend) ou TSDoc (frontend) onde agregar valor (contratos, parâmetros, comportamento).

## Processo sugerido

1. Crie uma branch para sua alteração (ex.: `feature/nome-da-feature` ou `fix/descricao-do-fix`).
2. Faça as mudanças e descreva-as de forma clara no commit e, se aplicável, na PR.
3. Rode `npm run lint` e `npm run test`.
4. Envie a PR; após revisão e aprovação, a alteração pode ser incorporada.

Se tiver dúvidas sobre a arquitetura ou os endpoints, consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/API.md](docs/API.md).
