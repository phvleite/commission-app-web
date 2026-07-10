# commission-app-web

Sistema web de gestão de comissões com suporte a múltiplos tenants.

## Stack

| Tecnologia | Versão |
|---|---|
| Next.js | 16 (App Router) |
| TypeScript | 5 |
| Node.js | 22 LTS |
| MongoDB Atlas | 7 |
| Mongoose | 9 |
| NextAuth.js | 5 (beta) |
| Tailwind CSS | 4 |
| Puppeteer | 25 (geração de PDF) |
| Jest + RTL | testes unitários/integração |
| Playwright | testes E2E |

## Pré-requisitos

- Node.js 22 LTS (`nvm use 22`)
- Conta no [MongoDB Atlas](https://cloud.mongodb.com)

## Configuração

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com MONGODB_URI e AUTH_SECRET
```

Para gerar o `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Desenvolvimento

```bash
npm run dev          # servidor local em http://localhost:3000
```

## Testes

```bash
npm test             # Jest (unitários + integração)
npm run test:watch   # Jest em modo watch
npm run test:coverage # Jest com relatório de cobertura
npm run test:e2e     # Playwright (E2E) — requer servidor rodando
npm run test:e2e:ui  # Playwright com interface gráfica
```

## Disciplina de desenvolvimento

> Criar funcionalidade → testar → só então avançar

Testes são criados junto com cada arquivo. Nenhuma feature avança sem cobertura de testes.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
