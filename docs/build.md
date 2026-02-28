# Build em produção via SSH

Instruções e comandos para fazer build e deploy da aplicação iAfiliado diretamente no servidor via SSH.

## Conexão

```bash
ssh root@62.72.21.49
```

## Pré-requisitos no servidor

- Docker e Docker Compose instalados
- Projeto clonado (ou fazer `git clone`)
- Arquivo `backend/.env` configurado em produção

---

## Opção 1: Build local no servidor (sem Docker Hub)

Ideal quando você quer fazer deploy sem usar GitHub Actions ou Docker Hub. O build roda inteiro no servidor.

### 1. Conectar e acessar o projeto

```bash
ssh root@62.72.21.49
cd /root/iAfiliado-v2
# ou o caminho onde o projeto está clonado
```

### 2. Atualizar o código (se usar Git)

```bash
git pull --ff-only
```

### 3. Garantir que o `.env` existe

```bash
# Verificar se backend/.env existe e contém CORS_ORIGINS
grep CORS_ORIGINS backend/.env
```

### 4. Build e subir os containers

```bash
docker compose -f docker-compose.build.yml up -d --build
```

### 5. Verificar se está rodando

```bash
docker compose -f docker-compose.build.yml ps
curl -s http://localhost:3000/health
```

---

## Opção 2: Deploy via rsync + build remoto

Útil para enviar o código da sua máquina local ao servidor e fazer o build lá.

### Enviar o projeto e buildar no servidor

```bash
# Do seu PC (PowerShell ou Git Bash), na pasta do projeto:
rsync -avz --exclude node_modules --exclude .git --exclude backend/data --exclude backend/uploads ./ root@62.72.21.49:/root/iAfiliado-v2/
ssh root@62.72.21.49 "cd /root/iAfiliado-v2 && docker compose -f docker-compose.build.yml up -d --build"
```

---

## Opção 3: Build e push local, pull no servidor

Se você tem Docker instalado localmente e faz push para o Docker Hub, o servidor pode puxar as imagens.

### No seu PC (build + push)

```bash
# Build
docker build -t fflf01/iafiliado-v2-backend:local ./backend
docker build -t fflf01/iafiliado-v2-frontend:local --build-arg VITE_API_BASE_URL=/api .

# Push (fazer login antes: docker login)
docker push fflf01/iafiliado-v2-backend:local
docker push fflf01/iafiliado-v2-frontend:local
```

### No servidor (pull + up)

```bash
ssh root@62.72.21.49
cd /root/iAfiliado-v2
export IMAGE_TAG=local
export DOCKERHUB_USERNAME=fflf01
docker compose pull
docker compose up -d
```

---

## Comandos úteis

| Ação | Comando |
|------|---------|
| Parar containers | `docker compose -f docker-compose.build.yml down` |
| Ver logs | `docker compose -f docker-compose.build.yml logs -f` |
| Rebuildar sem cache | `docker compose -f docker-compose.build.yml build --no-cache && docker compose -f docker-compose.build.yml up -d` |
| Liberar espaço (imagens órfãs) | `docker image prune -a -f && docker builder prune -af` |

---

## Variáveis de ambiente

No servidor, o `docker-compose` usa o `IMAGE_TAG`. Para build local (Opção 1), o `docker-compose.build.yml` não depende de `IMAGE_TAG`; as imagens são geradas no próprio servidor.
