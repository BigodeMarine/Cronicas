[**Acessar o deploy — Crônicas**](https://cronicas-beta.vercel.app)

# Frontend · Crônicas

Interface de um **trabalho freelance**, desenvolvida com Next.js, React, TypeScript e CSS Modules. A identidade visual combina verde escuro, dourado e pergaminho em um diário de RPG interativo.

A apresentação e a paleta estão no [README do projeto](../README.md). Consulte também o [guia de desenvolvimento](../docs/DEVELOPMENT.md) e o [guia de deploy](../docs/DEPLOY.md).

## Executar

Com Node.js 22 e a API disponível em `http://127.0.0.1:8001`:

```bash
npm ci
npm run dev
```

Abra [localhost:3000](http://localhost:3000). O Next.js encaminha `/api` para o backend; `API_INTERNAL_URL` permite configurar outro destino.

## Validar

```bash
npm run lint
npx --no-install tsc --noEmit
npm run build
```

Os tokens visuais ficam em `app/globals.css`, o reset em `styles/Base.module.css` e os controles compartilhados em `styles/Ui.module.css`. A capa usa CSS e SVG inline; não depende de uma pasta `public`.
