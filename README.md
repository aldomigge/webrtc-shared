# Screen Room

Aplicação WebRTC para salas com múltiplos participantes, dedicada exclusivamente a **compartilhamento de tela e áudio da tela/aba**. Não há botão, permissão nem captura de microfone: o cliente utiliza exclusivamente `navigator.mediaDevices.getDisplayMedia()`.

---

## Estrutura do Monorepo

O projeto é estruturado como um monorepo gerenciado por `pnpm`:

```text
.
├── apps/
│   ├── web/           # Frontend TanStack Start (SSR), React 19, TypeScript, Mantine UI
│   └── signaling/     # Serviço Node.js para WebSocket (/signal) e TURN (/turn-credentials)
└── packages/
    └── protocol/      # Contratos compartilhados, esquemas, tipos, perfis e utilitários de sala
```

- **`apps/web`**: Interface web idiomática com rotas no TanStack Start, componentes Mantine, gerenciamento modular de peers WebRTC, controle de mídia, diagnóstico em tempo real e adaptação dinâmica de qualidade.
- **`apps/signaling`**: Servidor de sinalização enxuto em Node.js com WebSocket (`/signal`), emissão de credenciais temporárias TURN (`/turn-credentials`), política de validação de origem e health check (`/healthz`). Não serve arquivos estáticos.
- **`packages/protocol`**: Biblioteca de tipos e validações consumida tanto pelo web quanto pelo signaling, garantindo consistência de mensagens e entropia criptográfica dos IDs de sala.

---

## Desenvolvimento Local

### Pré-requisitos
- Node.js 22+
- `pnpm` 9+ ou 10+

### Instalação
```bash
pnpm install
```

### Executar em Desenvolvimento
Inicia simultaneamente o frontend (`apps/web`) e o servidor de sinalização (`apps/signaling`):

```bash
pnpm dev
```

Por padrão:
- `apps/signaling` roda em `http://localhost:3000`
- `apps/web` roda em `http://localhost:3001` (com proxy automático de desenvolvimento encaminhando `/signal` e `/turn-credentials` para a porta 3000)

Você também pode iniciar cada serviço isoladamente:
```bash
pnpm dev:web         # apenas o frontend (porta 3001)
pnpm dev:signaling   # apenas o signaling (porta 3000)
```

Abra `http://localhost:3001` no navegador.

---

## Comandos do Workspace

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia todos os apps em paralelo no modo desenvolvimento |
| `pnpm dev:web` | Inicia o app web em modo dev (porta 3001 com proxy para 3000) |
| `pnpm dev:signaling` | Inicia o serviço de signaling com recarregamento a quente |
| `pnpm build` | Compila recursivamente todos os pacotes e aplicações |
| `pnpm test` | Executa toda a suíte de testes automatizados da nova arquitetura |
| `pnpm typecheck` | Executa verificação de tipos TypeScript em todo o monorepo |
| `pnpm start:web` | Inicia o servidor Node de produção da web (`node .output/server/index.mjs` via Nitro) |
| `pnpm start:signaling` | Inicia o serviço de sinalização em modo produção |
| `pnpm preview:web` | Inicia o preview local do Vite (`vite preview`, apenas para inspeção local de build) |

---

## Arquitetura de Produção: Dois Serviços sob Mesma Origem

Em produção, `apps/web` e `apps/signaling` são processos independentes executados atrás de um **reverse proxy** que os expõe sob o mesmo domínio/origem pública.

O frontend comunica-se exclusivamente via caminhos relativos:
- `/signal` -> WebSocket encaminhado para `apps/signaling`
- `/turn-credentials` -> HTTP encaminhado para `apps/signaling`
- `/*` -> HTTP/SSR encaminhado para `apps/web`

### 1. Variáveis de Ambiente

#### `apps/web`
- `PORT`: Porta HTTP para servir a aplicação Node/Nitro (padrão: `3001`).
- `HOST`: Interface de rede para bind do servidor (padrão: `0.0.0.0`).
- `NITRO_PORT` / `NITRO_HOST`: Variáveis alternativas suportadas nativamente pelo runtime Nitro.

#### `apps/signaling`
- `PORT`: Porta HTTP/WebSocket para o servidor (padrão: `3000`).
- `HOST`: Interface de rede (padrão: `0.0.0.0`).
- `ALLOWED_ORIGINS`: Lista explícita de origens públicas autorizadas a acessar `/turn-credentials` e estabelecer WebSocket em `/signal`.
  - **Em desenvolvimento local:** Fallback automático para `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:3001`, `http://127.0.0.1:3001`.
  - **Em produção:** Configure explicitamente com a URL da sua aplicação (ex.: `ALLOWED_ORIGINS=https://screen.example.com` ou valores separados por vírgula se houver múltiplos domínios).
  - *Validação:* Conexões cujo cabeçalho `Origin` coincida com `http://${Host}` ou `https://${Host}` (quando o proxy repassa o header `Host` intacto) também são aceitas, mas em qualquer topologia com terminação TLS ou reescrita de cabeçalhos pelo proxy, defina `ALLOWED_ORIGINS` obrigatoriamente para evitar bloqueio `403 Forbidden`.

---

## Execução em Produção

### Via Node / pnpm

```bash
# 1. Compilar todo o projeto (gera o bundle do signaling e .output/server/index.mjs no web)
pnpm build

# 2. Iniciar o serviço de sinalização (Terminal 1)
PORT=3000 ALLOWED_ORIGINS="https://screen.example.com" pnpm start:signaling

# 3. Iniciar a aplicação web (Terminal 2 - runtime Node.js oficial via Nitro)
PORT=3001 pnpm start:web
```

### Via Docker / Contêineres

Cada serviço possui seu próprio `Dockerfile`:

```bash
# Construir as imagens a partir da raiz do monorepo
docker build -f apps/signaling/Dockerfile -t screen-room-signaling .
docker build -f apps/web/Dockerfile -t screen-room-web .

# Executar os contêineres
docker run -d --name signaling -p 3000:3000 screen-room-signaling
docker run -d --name web -p 3001:3001 screen-room-web
```

---

## Exemplos de Proxy Reverso

### Exemplo 1: Caddy (`Caddyfile`)

```caddy
screen.example.com {
    # Sinalização e credenciais TURN -> apps/signaling
    handle /signal* {
        reverse_proxy localhost:3000
    }
    handle /turn-credentials* {
        reverse_proxy localhost:3000
    }

    # Aplicação web e SSR -> apps/web
    handle {
        reverse_proxy localhost:3001
    }
}
```

### Exemplo 2: Nginx (`nginx.conf`)

```nginx
server {
    listen 80;
    server_name screen.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name screen.example.com;

    # Certificados SSL...

    # WebSocket de Sinalização
    location /signal {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # Endpoint de Credenciais TURN
    location /turn-credentials {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend TanStack Start
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Documentação Adicional

- [TURN.md](./TURN.md) — Configuração do relay de conectividade coturn e liberação de portas de firewall.
- [DEBUG.md](./DEBUG.md) — Guia de diagnóstico da negociação WebRTC e ciclo de vida de conexões.
- [PERFORMANCE.md](./PERFORMANCE.md) — Perfis de qualidade (bitrate, fps, resolução) e adaptação automática.
- [SLIPLANE.md](./SLIPLANE.md) — Instruções para deploy conteinerizado na plataforma Sliplane.
