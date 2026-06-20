# Estuda+

> **Estuda+** é um Progressive Web App (PWA) para gerenciamento de estudos pessoais. Funciona 100% no navegador com suporte offline, instalável na tela inicial do celular ou desktop.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Dashboard** | Visão geral com métricas, gráficos e atividades recentes |
| **Disciplinas** | Gerenciamento de matérias com cores e carga horária |
| **Materiais de Estudo** | CRUD de livros, cursos, vídeos e PDFs com progresso |
| **Sessões de Estudo** | Registro com data, horário, duração e filtros |
| **Pomodoro** | Timer foco/pausa com histórico de ciclos e som |
| **Metas** | Metas semanais/mensais com progresso automático |
| **Tarefas** | Gerenciamento com prioridades e prazos |
| **Calendário** | Visualização das sessões com intensidade |
| **Relatórios** | 5 gráficos interativos (Chart.js) |
| **Conquistas** | 8 badges com verificação automática |
| **Exportação** | Relatórios em PDF e CSV |
| **Modo Offline** | PWA completo com Service Worker, instalável |
| **Modo Escuro** | Tema dark inspirado no Linear |

## Tecnologias

- **HTML5** — Estrutura semântica
- **CSS3** — Design System completo com Custom Properties
- **JavaScript ES6+** — ES Modules, zero frameworks
- **LocalStorage** — Persistência de dados
- **Chart.js 4** — Gráficos (CDN)
- **jsPDF 2.5** — Exportação PDF (CDN)
- **Service Worker** — Cache offline-first
- **Web Audio API** — Alerta sonoro do Pomodoro

## Quick Start

```bash
# Clone ou baixe o projeto
cd estuda-plus

# Inicie com Node.js (zero dependências)
npm start

# Ou com Python
python -m http.server 8080

# Ou com npx
npx serve .
```

Acesse `http://localhost:8080` no navegador.

## Estrutura

```
estuda-plus/
├── index.html              # Entry point
├── manifest.json           # Configuração PWA
├── sw.js                   # Service Worker
├── server.js               # Servidor HTTP local
├── netlify.toml            # Config Netlify
├── vercel.json             # Config Vercel
├── _redirects              # Redirects Netlify
├── assets/
│   ├── icons/              # Ícones (SVG + PNGs)
│   ├── splash/             # Splash iOS
│   └── screenshots/        # Screenshots PWA
├── scripts/                # Scripts de geração
└── src/
    ├── app.js              # Bootstrap
    ├── router.js           # Roteador hash-based
    ├── state.js            # Estado centralizado
    ├── store/              # Persistência + Schema
    ├── services/           # Lógica de negócio
    ├── components/         # Componentes UI
    ├── pages/              # Páginas da aplicação
    ├── utils/              # Utilitários
    └── styles/             # Design System CSS
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm start` | Inicia servidor em `localhost:8080` |
| `npm run dev` | Inicia servidor e abre navegador |
| `npm run icons` | Regenera ícones PNG |
| `npm run splash` | Regenera splash screens iOS |
| `npm run generate` | Ícones + splash screens |

## Deploy

### GitHub Pages
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/estuda-plus.git
git push -u origin main
# Settings > Pages > Source: main, / (root)
```

### Vercel
```bash
npm i -g vercel && vercel
```

### Netlify
```bash
npm i -g netlify-cli && netlify deploy --prod --dir=.
```

## Licença

MIT
