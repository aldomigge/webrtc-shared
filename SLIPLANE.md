# Configuração Sliplane

A nova arquitetura do Screen Room é composta por dois serviços independentes:

1. **`apps/web`**: Aplicação de interface em TanStack Start (SSR) e React.
2. **`apps/signaling`**: Serviço Node.js para WebSocket de sinalização (`/signal`) e credenciais temporárias TURN (`/turn-credentials`).

Ambos os serviços devem ser expostos sob a mesma origem pública através de roteamento/reverse proxy:
- `/signal` (WebSocket) -> `apps/signaling`
- `/turn-credentials` (HTTP) -> `apps/signaling`
- Todas as demais requisições -> `apps/web`

---

## 1. Deploy do Serviço de Sinalização (`apps/signaling`)

1. No painel do Sliplane, crie um novo **App Runtime** (ex.: `screen-room-signaling`).
2. Conecte o repositório do projeto.
3. Configure o deploy por Dockerfile:
   - **Dockerfile path**: `apps/signaling/Dockerfile`
   - **Context**: `.` (raiz do repositório)
4. Defina a porta interna: `3000` (ou utilize a variável `PORT` injetada pelo Sliplane).
5. WebSocket: habilitado automaticamente.
6. Variáveis de ambiente opcionais:
   - `ALLOWED_ORIGINS`: origens permitidas (ex.: `https://seu-dominio.com`), se não estiver atrás de proxy com header Host coincidente.

---

## 2. Deploy do Serviço Web (`apps/web`)

1. Crie outro **App Runtime** no Sliplane (ex.: `screen-room-web`).
2. Conecte o repositório do projeto.
3. Configure o deploy por Dockerfile:
   - **Dockerfile path**: `apps/web/Dockerfile`
   - **Context**: `.` (raiz do repositório)
4. Defina a porta interna: `3001` (ou utilize a variável `PORT` injetada pelo Sliplane). O container executa o runtime Node oficial do TanStack Start gerado pelo Nitro (`node .output/server/index.mjs`).

---

## 3. Roteamento sob a Mesma Origem

Para que o frontend acesse o signaling e o TURN de forma transparente via URLs relativas (`/signal` e `/turn-credentials`):

- Configure o balanceador / domínio no Sliplane (ou proxy Caddy/Cloudflare/Nginx na frente dos serviços) roteando:
  - `/signal*` -> `screen-room-signaling:3000`
  - `/turn-credentials*` -> `screen-room-signaling:3000`
  - `/*` -> `screen-room-web:3001`
