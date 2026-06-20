# Guia de Manutenção — Estuda+

## Arquitetura

O Estuda+ é uma SPA (Single Page Application) puramente front-end. Não há backend, banco de dados ou build step. Todo o código é executado no navegador e os dados são persistidos no LocalStorage.

### Fluxo de Dados

```
Usuário → Página (Page) → Serviço (Service) → Store (LocalStorage)
                                                      ↓
                                              State + EventBus
                                                      ↓
                                              Componentes re-renderizam
```

### Camadas

| Camada | Diretório | Responsabilidade |
|---|---|---|
| **Pages** | `src/pages/` | Páginas da aplicação, renderizam HTML e gerenciam eventos |
| **Components** | `src/components/` | Componentes reutilizáveis (cards, botões, gráficos) |
| **Services** | `src/services/` | Lógica de negócio (estatísticas, conquistas, exportação) |
| **Store** | `src/store/` | Abstração do LocalStorage + schema + migrações |
| **Utils** | `src/utils/` | Utilitários (EventBus, datas, validação, helpers) |
| **Styles** | `src/styles/` | Design System baseado em CSS Custom Properties |

## Como Adicionar uma Nova Página

1. Crie `src/pages/minha-pagina.js` seguindo o padrão:
   ```js
   export class MinhaPagina {
     async render() { /* retorna HTMLElement */ }
     async afterRender() { /* bind de eventos */ }
     destroy() { /* cleanup */ }
   }
   ```
2. Adicione a rota em `src/utils/constants.js` (ROUTES)
3. Importe e registre em `src/app.js` (`_registerRoutes`)
4. Adicione ao sidebar em `src/components/sidebar.js`

## Migrações de Schema

Quando precisar alterar a estrutura dos dados no LocalStorage:

1. Incremente `SCHEMA_VERSION` em `src/utils/constants.js`
2. Crie uma migration em `src/store/migrations.js`:
   ```js
   const migrations = {
     ...existingMigrations,
     2: (data) => {
       // transforme os dados existentes
       return data
     }
   }
   ```
3. As migrações rodam automaticamente na inicialização

## Cache do Service Worker

O cache é versionado via `CACHE_NAME` no `sw.js`:
- `estuda-plus-v4` → assets estáticos
- `estuda-plus-cdn-v1` → bibliotecas CDN

Para invalidar o cache em produção, altere o número da versão. O Service Worker antigo é limpo automaticamente no evento `activate`.

## Atualização de Dependências CDN

As dependências (Chart.js, jsPDF) são carregadas via CDN no `index.html` e cacheadas pelo Service Worker. Para atualizar:

1. Altere a URL no `index.html`
2. Altere a URL em `CDN_URLS` no `sw.js`
3. Atualize o cache do Service Worker

## Testando

O projeto não possui test runner configurado. Para testar manualmente:

1. Abra o DevTools → Console: verifique se não há erros
2. Teste o modo offline: DevTools → Network → "Offline"
3. Teste o PWA: DevTools → Application → Manifest / Service Workers
4. Teste a responsividade: DevTools → Device Toolbar
5. Execute Lighthouse: DevTools → Lighthouse → "Generate report"

## Boas Práticas

- **Não acesse `localStorage` diretamente** fora da camada `store/`
- **Sempre limpe listeners** no método `destroy()` de pages e components
- **Use o EventBus** para comunicação entre componentes desacoplados
- **Mantenha o schema versionado** para evitar perda de dados
- **Teste offline** após qualquer alteração no Service Worker
