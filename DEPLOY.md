# Deploy — Bia Sistema WhatsApp

## whatsapp-ia-atendimento (Backend Railway)

| Arquivo | Destino | Prioridade |
|---|---|---|
| gemini.js | src/services/gemini.js | 🔴 CRÍTICO |
| webhook.js | src/routes/webhook.js | 🔴 CRÍTICO |
| roteador.js | src/services/roteador.js | 🔴 CRÍTICO |
| templates-api.js | src/routes/templates-api.js | 🔴 CRÍTICO |
| bling-webhook.js | src/routes/bling-webhook.js | 🔴 CRÍTICO |
| catalogoSync.js | src/services/catalogoSync.js | 🟡 IMPORTANTE |
| suporte.js | src/services/agentes/suporte.js | 🟡 IMPORTANTE |
| ocorrencias-api.js | src/routes/ocorrencias-api.js | 🟡 IMPORTANTE |
| agentes-api.js | src/routes/agentes-api.js | 🟡 IMPORTANTE |

### Adicionar no src/index.js:
```js
'/bling-webhook':  loadRouter('./routes/bling-webhook'),
'/api/ocorrencias':loadRouter('./routes/ocorrencias-api'),
'/api/templates':  loadRouter('./routes/templates-api'),
'/api/agentes':    loadRouter('./routes/agentes-api'),
```

### Variáveis Railway (adicionar):
```
WA_TEMPLATES_APROVADOS=true   # só após aprovar templates na Meta
```

## bia-dashboard (Frontend Railway)

| Arquivo | Destino | Prioridade |
|---|---|---|
| PageTransacional.jsx | src/pages/PageTransacional.jsx | 🔴 CRÍTICO |
| PageAgentesMulti.jsx | src/pages/PageAgentesMulti.jsx | 🟡 IMPORTANTE |
| PageDisparos.jsx | src/pages/PageDisparos.jsx | 🟢 NOVO |

## Bling — configurar webhook:
1. Acesse: Configurações → Integrações → Webhooks
2. Nova URL: https://whatsapp-sostrass.up.railway.app/bling-webhook
3. Evento: Pedido — Alteração

## Após deploy — forçar sync do catálogo:
```
POST https://whatsapp-sostrass.up.railway.app/bling/sync-catalogo
```
