# Guia de Deploy — Estuda+

O Estuda+ é um projeto 100% estático — não requer build step, banco de dados ou servidor backend. Pode ser hospedado em qualquer serviço de hospedagem estática.

## Pré-requisitos

- Git instalado
- Conta no serviço de hospedagem desejado
- Domínio (opcional)

---

## GitHub Pages

### Via interface web

1. Crie um repositório no GitHub (ex: `seu-usuario/estuda-plus`)
2. Envie o projeto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-usuario/estuda-plus.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**
4. Em "Source", selecione "Deploy from a branch"
5. Selecione a branch `main`, pasta `/ (root)`
6. Clique em "Save"

O site estará disponível em `https://seu-usuario.github.io/estuda-plus/`.

### Arquivo .nojekyll

O projeto já inclui um arquivo `.nojekyll` na raiz para garantir que o GitHub Pages sirva corretamente os arquivos.

---

## Vercel

### Opção 1 — CLI
```bash
npm i -g vercel
vercel
```
Siga as instruções interativas. O `vercel.json` já está configurado.

### Opção 2 — Dashboard
1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório git
3. Configuração automática (o `vercel.json` detecta as regras)
4. Clique em "Deploy"

### Configurações Vercel
- **Framework Preset:** Other
- **Build Command:** (deixar vazio)
- **Output Directory:** ./
- **Node.js Version:** 18.x

---

## Netlify

### Opção 1 — Drag & Drop
1. Acesse [app.netlify.com](https://app.netlify.com/)
2. Arraste a pasta do projeto para a área de upload
3. Pronto! O site será publicado em um subdomínio `.netlify.app`

### Opção 2 — CLI
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=.
```

### Opção 3 — Git
1. Conecte seu repositório no Netlify
2. Configurações automáticas (`netlify.toml` incluso)
3. Deploy automático a cada push

---

## Personalização por Plataforma

### GitHub Pages
Atualize o `start_url` no `manifest.json` se o app não estiver na raiz:
```json
"start_url": "/estuda-plus/index.html"
```

### Vercel
Se usar domínio personalizado, atualize o `CORS` no `vercel.json` se necessário.

### Netlify
Atualize o `_redirects` para redirects personalizados. HTTPS é automático.

---

## Checklist Pós-Deploy

- [ ] Acessar a URL pública e verificar carregamento
- [ ] Verificar se o Service Worker registrou (DevTools → Application → Service Workers)
- [ ] Testar instalação como PWA
- [ ] Testar modo offline (desconectar internet e recarregar)
- [ ] Verificar se não há erros no console
- [ ] Executar Lighthouse (alvo: ≥ 90 em todas as categorias)
- [ ] Testar responsividade em mobile, tablet e desktop
- [ ] Verificar se todos os ícones e assets carregam
- [ ] Testar navegação entre todas as páginas
