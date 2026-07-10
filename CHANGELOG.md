# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Não lançado]

### Adicionado

- Scaffold inicial com Next.js 16 + TypeScript 5
- Tailwind CSS 4 + ESLint configurados
- Mongoose 8 com singleton de conexão (`src/lib/db.ts`)
- Models base: `Tenant` e `User` com suporte a multi-tenant via `tenantId`
- Model `Commission` com campos: `saleAmount`, `commissionRate`, `commissionValue`, `status`, `saleDate`, `paidAt`
- Índices compostos em `Commission`: `(tenantId, userId)`, `(tenantId, status)`, `(tenantId, saleDate)`
- Interfaces TypeScript base: `WithTenant`, `WithTimestamps`
- Jest + React Testing Library configurados (`jest.config.ts`, `jest.setup.ts`)
- Helper `src/lib/test-db.ts` para testes com MongoDB in-memory (`mongodb-memory-server`)
- Testes do model `Commission` — 8 casos cobrindo validações, defaults e persistência
- Playwright configurado para testes E2E (`playwright.config.ts`)
- NextAuth.js 5 (beta) e Puppeteer 24 instalados
- `.env.local.example` com variáveis necessárias
- Prettier + EditorConfig + `.vscode/settings.json` (LF, tab=4, format on save)
