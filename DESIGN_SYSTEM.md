# Design System — Estuda+

> Inspirado em **Notion** (neutro, funcional, icon-driven), **Linear** (accent vibrante, dark mode premium, animações suaves) e **Todoist** (task-first, prioridades visuais, informação compacta).

---

## 1. Paleta de Cores

### Neutro (warm-cool blend)

| Token      | Light | Dark  | Uso |
|-----------|-------|-------|-----|
| `--color-neutral-50`  | `#fafafa` | `#161616` | Fundo da página |
| `--color-neutral-100` | `#f5f5f4` | `#1c1c1c` | Fundo sutil / hover |
| `--color-neutral-150` | `#efefee` | `#222222` | Active / divisor |
| `--color-neutral-200` | `#e5e5e4` | `#2a2a2a` | Bordas |
| `--color-neutral-300` | `#d4d4d4` | `#3c3c3c` | Bordas hover |
| `--color-neutral-400` | `#a3a3a3` | `#5c5c5e` | Texto muted |
| `--color-neutral-500` | `#737373` | `#86868b` | — |
| `--color-neutral-600` | `#525252` | `#a1a1a6` | Texto secundário |
| `--color-neutral-700` | `#404040` | `#c7c7cc` | — |
| `--color-neutral-800` | `#262626` | `#e5e5ea` | — |
| `--color-neutral-900` | `#171717` | `#f5f5f7` | Texto primário |

### Primary (Linear-indigo)

`#6366f1` → `#4f46e5` → `#4338ca`

Use para: botões primários, links, links ativos do sidebar, foco, toggle ativo, progresso.

### Semântica

| Token     | Light | Dark  |
|-----------|-------|-------|
| Success   | `#22c55e` | `#22c55e` |
| Warning   | `#f59e0b` | `#f59e0b` |
| Danger    | `#ef4444` | `#ef4444` |
| Info      | `#0ea5e9` | `#0ea5e9` |

### Prioridades (Todoist)

| Prioridade | Cor |
|-----------|-----|
| Alta   | `#dc2626` |
| Média  | `#d97706` |
| Baixa  | `#16a34a` |

---

## 2. Tipografia

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

### Escala

| Token      | Tamanho | Uso |
|-----------|---------|-----|
| `--text-xs`   | 12px | Metadados, badges, tabs |
| `--text-sm`   | 14px | Body, botões, inputs, table cells |
| `--text-base` | 16px | Parágrafos, cards |
| `--text-lg`   | 18px | Subtítulos |
| `--text-xl`   | 20px | Títulos de modal / card |
| `--text-2xl`  | 24px | Títulos de página |
| `--text-3xl`  | 30px | Seções grandes |
| `--text-4xl`  | 36px | Hero / dashboard stats |

### Pesos

`400` Normal · `500` Medium · `600` Semibold · `700` Bold

### Leading

`1` None · `1.25` Tight · `1.5` Normal · `1.625` Relaxed

---

## 3. Espaçamentos

Base de **4px**, escala de `--space-0` (0) a `--space-24` (96px).

| Token  | Valor | Exemplo |
|--------|-------|---------|
| `--space-1`  | 4px  | Gap interno de label |
| `--space-2`  | 8px  | Gap entre ícone e texto |
| `--space-3`  | 12px | Padding de input |
| `--space-4`  | 16px | Gap de grid / card body |
| `--space-6`  | 24px | Padding de card |
| `--space-8`  | 32px | Seções da página |
| `--space-12` | 48px | Empty state |

---

## 4. Bordas

| Token  | Valor | Uso |
|--------|-------|-----|
| `--radius-sm`  | 4px  | Tags internas |
| `--radius-md`  | 6px  | KBD, inputs |
| `--radius-lg`  | 8px  | Botões, inputs |
| `--radius-xl`  | 12px | Cards, dropdown |
| `--radius-2xl` | 16px | Modal |
| `--radius-full` | 50% | Badges, avatares |

Todas as bordas são **1px solid** com `--color-border`. Foco usa `--focus-ring-color` com **2px + offset 2px**.

---

## 5. Sombras

| Token     | Light (y) | Dark (y) |
|-----------|-----------|----------|
| `--shadow-xs`  | 1px 2px / opacity 0.04 | 1px 2px / 0.3 |
| `--shadow-sm`  | 1px 3px / 0.05 | 1px 3px / 0.3 |
| `--shadow-md`  | 4px 6px / 0.06 | 4px 6px / 0.4 |
| `--shadow-lg`  | 10px 15px / 0.06 | 10px 15px / 0.4 |
| `--shadow-xl`  | 20px 25px / 0.08 | 20px 25px / 0.5 |
| `--shadow-2xl` | 25px 50px / 0.15 | 25px 50px / 0.5 |
| `--shadow-ring`| 0 0 0 3px primary 0.15 | primary 0.3 |

---

## 6. Dark Mode

**Não é simples inversão.** O dark mode do Estuda+ segue a filosofia **Linear**: fundo quasi-preto (`#0c0c0c`), superfícies em `#1a1a1a`, textos em `#f5f5f7`.

Mudanças estruturais no dark mode:
- Neutrals invertem com warming sutil
- Primary escala inverte: `--primary-50` vira fundo escuro
- Sombras ficam mais intensas (opacidade maior)
- Scrollbar adapta cor
- Selection invertido

Ativação: `<html data-theme="dark">` ou via JS.

---

## 7. Responsividade

### Breakpoints

| Nome | Largura | Media Query |
|-----|---------|-------------|
| `sm`  | 640px  | `@media (max-width: 640px)` |
| `md`  | 768px  | `@media (max-width: 768px)` |
| `lg`  | 1024px | `@media (max-width: 1024px)` |
| `xl`  | 1280px | — |
| `2xl` | 1536px | — |

### Comportamentos

- **Mobile (≤640px)**: Sidebar vira overlay com `transform`, header ganha menu hamburger, grids viram 1 coluna, page header empilha
- **Tablet (641–1024px)**: Grids de 3/4 colunas viram 2 colunas
- **Desktop (≥1025px)**: Layout completo com sidebar fixa

---

## 8. Componentes

### Button

| Classe | Uso |
|--------|-----|
| `.btn` | Base |
| `.btn--primary` | Ação principal |
| `.btn--secondary` | Ação alternativa |
| `.btn--ghost` | Ação sutil |
| `.btn--danger` | Destrutivo |
| `.btn--danger-ghost` | Destrutivo sutil |
| `.btn--sm` / `.btn--lg` | Tamanhos |
| `.btn--icon` | Apenas ícone |

### Card

| Classe | Uso |
|--------|-----|
| `.card` | Container padrão |
| `.card--interactive` | Hover com sombra, cursor pointer |
| `.card--flat` | Fundo sutil, sem borda |
| `.card__header` / `__body` / `__footer` | Seções internas |

### Form

| Classe | Uso |
|--------|-----|
| `.input` | Input, select, textarea |
| `.input--error` | Estado de erro |
| `.input--sm` / `.input--lg` | Tamanhos |
| `.form-field` | Wrapper label + input |
| `.form-field--row` | Layout horizontal |

### Feedback

| Componente | Uso |
|-----------|-----|
| `.badge` | Status small (ex: "Concluído") |
| `.tag` | Chip removível (ex: filtros) |
| `.toast` | Notificação temporária (canto inferior direito) |
| `.skeleton` | Loading shimmer |
| `.empty-state` | Estado vazio com CTA |

### Navegação

| Componente | Uso |
|-----------|-----|
| `.sidebar__link` | Item de menu |
| `.sidebar__link--active` | Item ativo |
| `.tab` | Aba de conteúdo |
| `.tab--active` | Aba ativa |
| `.breadcrumb` | Navegação hierárquica |

### Dados

| Componente | Uso |
|-----------|-----|
| `.table` | Tabela de dados |
| `.list-item` | Item de lista (Todoist-style) |
| `.stat` | Card de métrica |
| `.progress` | Barra de progresso |

---

## 9. Ícones

O Design System não define ícones específicos. Recomenda-se **Lucide** ou **Phosphor Icons** (SVG inline) pelos seguintes motivos:

- Compatibilidade com `currentColor` (herdam cor do CSS)
- Tamanhos via `--icon-size-*` tokens
- Pesos de traço consistentes (1.5px–2px)

Tamanhos: `xs: 12px` · `sm: 16px` · `md: 20px` · `lg: 24px` · `xl: 32px`

---

## 10. Animação

### Durações

| Token | ms  |
|-------|-----|
| `--duration-75`  | 75  |
| `--duration-150` | 150 |
| `--duration-200` | 200 |
| `--duration-250` | 250 |
| `--duration-300` | 300 |
| `--duration-500` | 500 |
| `--duration-700` | 700 |

### Easing

| Token | Curva |
|-------|-------|
| `--ease-linear`  | `linear` |
| `--ease-out`     | `cubic-bezier(0, 0, 0.2, 1)` |
| `--ease-in-out`  | `cubic-bezier(0.4, 0, 0.2, 1)` |

### Transições padrão

- **hover**: 150ms ease-out
- **open/close** (modal, dropdown): 200ms ease-out
- **progress fill**: 500ms ease-out

`prefers-reduced-motion`: todas as durações zeradas.

---

## 11. Z-Index

| Camada     | Valor |
|-----------|-------|
| Base       | 0    |
| Dropdown   | 100  |
| Sidebar    | 200  |
| Header     | 300  |
| Backdrop   | 400  |
| Modal      | 500  |
| Toast      | 600  |
| Tooltip    | 700  |

---

## 12. Checklist de Implementação

- [ ] Incluir fonte **Inter** (Google Fonts ou self-hosted)
- [ ] Incluir fonte **JetBrains Mono** para o timer
- [ ] Configurar `data-theme="dark"` no `<html>` via settings do usuário
- [ ] Testar todos os breakpoints (640, 768, 1024)
- [ ] Verificar contraste mínimo WCAG AA nos dois temas
- [ ] Testar `prefers-reduced-motion`
- [ ] Adicionar `role` e `aria-*` nos componentes interativos
- [ ] Verificar foco visível em todos os elementos clicáveis

---

*Versão 1.0 — Junho 2026*
