# Guia de Instalação — Estuda+

## Requisitos

- Node.js 18+ (para o servidor local — opcional)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

## Instalação Local

### 1. Clone ou baixe o projeto

```bash
git clone https://github.com/seu-usuario/estuda-plus.git
cd estuda-plus
```

Ou baixe o ZIP e extraia.

### 2. Inicie o servidor

Escolha uma das opções:

**Opção A — Servidor Node (recomendado)**
```bash
npm start
```
Acesse `http://localhost:8080`

**Opção B — Abrir automaticamente**
```bash
npm run dev
```

**Opção C — Python**
```bash
python -m http.server 8080
```

**Opção D — VS Code Live Server**
Clique direito no `index.html` → "Open with Live Server"

**Opção E — npx**
```bash
npx serve .
```

### 3. Instalação como PWA

**Android:**
- Ao acessar o site, um banner de instalação aparece na parte inferior
- Clique em "Instalar" e confirme

**iOS (iPhone/iPad):**
- Abra no Safari
- Toque no botão Compartilhar (ícone de quadrado com seta para cima)
- Role para baixo e toque em "Adicionar à Tela de Início"
- Toque em "Adicionar" no canto superior direito

**Desktop (Chrome/Edge):**
- Clique no ícone de instalação na barra de endereço
- Ou clique no botão "Instalar" no canto inferior do app

## Verificação

- Abra o DevTools (F12) → Console: não deve haver erros
- Abra o DevTools → Application → Service Workers: deve mostrar "activated and is running"
- Abra o DevTools → Lighthouse: execute auditoria PWA
- Teste offline: desconecte a internet e recarregue a página
