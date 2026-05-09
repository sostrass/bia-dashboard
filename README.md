# Bia Dashboard — Painel de Atendimento IA

Stack: React 18 + Vite + Tailwind CSS + shadcn/ui + Recharts

---

## IMPLANTAÇÃO NO RAILWAY (passo a passo)

### 1. Criar repositório no GitHub

1. Acesse github.com → New repository
2. Nome: `bia-dashboard` (ou qualquer nome)
3. Marque Private
4. Faça upload de TODOS os arquivos desta pasta

### 2. Criar novo serviço no Railway

1. Acesse railway.app → seu projeto existente
2. Clique em **+ New Service**
3. Selecione **GitHub Repo**
4. Escolha o repositório `bia-dashboard`

### 3. Configurar variável de ambiente

No Railway → seu serviço bia-dashboard → **Variables**:

```
VITE_API_URL = https://whatsapp-ia-atendimento-production.up.railway.app
```

Substitua pela URL real do seu backend Node.js.

### 4. Deploy automático

O Railway detecta o `railway.json` e executa automaticamente:
- `npm install` — instala dependências
- `npm run build` — compila o React com Vite
- `npm run start` — serve o build compilado

### 5. Acessar o painel

Após o deploy (~2 minutos), o Railway gera uma URL como:
```
https://bia-dashboard-production.up.railway.app
```

---

## ESTRUTURA DO PROJETO

```
bia-dashboard/
├── src/
│   ├── pages/
│   │   ├── PageDashboard.jsx    ← KPIs, gráficos, métricas
│   │   ├── PageConversas.jsx    ← Chat viewer ao vivo
│   │   ├── PageTransacional.jsx ← Editor dos 11 templates
│   │   ├── PageContatos.jsx     ← Contatos + envio em massa
│   │   ├── PageEstoque.jsx      ← Monitor avise-me
│   │   ├── PageAgentes.jsx      ← ★ Config comportamento IA
│   │   └── PageConfig.jsx       ← Integrações e credenciais
│   ├── components/
│   │   └── Sidebar.jsx
│   ├── lib/utils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── railway.json                 ← Config de deploy
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## MÓDULO AGENTES IA (destaque)

O módulo `PageAgentes.jsx` permite:

1. **Persona** — Nome da IA, nome da loja, chave Gemini API
2. **System Prompt** — Ensine a IA a se comportar, texto livre
3. **Modelo** — Gemini 2.0 Flash / 2.5 Flash / 2.5 Pro
4. **Criatividade** — Slider de temperatura 0-100%
5. **Respostas Rápidas** — Cadastre triggers e respostas prontas
6. **Regras** — Toggles de comportamento (emojis, upsell, escalação, etc.)
7. **Tempos** — Configure delays, timeouts e agendamentos
