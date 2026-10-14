[**✦ Acessar o deploy — https://cronicas-beta.vercel.app**](https://cronicas-beta.vercel.app)

![Crônicas — O registro de suas aventuras](docs/assets/cronicas-banner.svg)

# Crônicas

**Projeto desenvolvido como trabalho freelance.** Uma aplicação web para mesas de RPG, com diário compartilhado de campanhas, sessões e relatos, além de um cofre privado de personagens.

A experiência é inspirada em um grimório: capa interativa, páginas de pergaminho, encadernação e detalhes dourados. Mestres e jogadores registram as diferentes perspectivas da mesma aventura.  
**Quer experimentar? Crie uma conta é bem simples e fácil.**

## ✦ Funcionalidades

- **Campanhas:** criação de mesas com nome, cenário e sistema; o mestre gerencia participantes.
- **Diário compartilhado:** sessões, relatos livres ou vinculados a capítulos e comentários da mesa.
- **Permissões:** participantes leem e escrevem; autores editam seus registros e o mestre pode moderar.
- **Cofre de personagens:** retratos, fichas PDF/imagem e anotações privadas por campanha.
- **Autenticação:** cadastro e login com e-mail e senha, com controle de acesso na API.
- **Interface responsiva:** livro adaptado a computadores e celulares, respeitando a preferência por movimento reduzido.

## ✦ Identidade visual

O banner usa as cores definidas em [`frontend/app/globals.css`](frontend/app/globals.css). O SVG mantém o design colorido na renderização do GitHub, que não permite aplicar CSS personalizado ao README.

| Cor | Hexadecimal | Aplicação |
| --- | --- | --- |
| Verde profundo | `#111c17` | Fundo |
| Verde escuro | `#1c2c24` | Superfícies e botões do diário |
| Dourado | `#d7b16b` | Identidade e detalhes |
| Pergaminho | `#e8d7b5` | Tons de papel |
| Pergaminho claro | `#f3e7c9` | Superfícies claras |

Os títulos usam Georgia; o texto usa Arial/Helvetica. A capa é construída com CSS e SVG inline, sem depender de uma pasta `public`.

## ✦ Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript e CSS Modules |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic e Alembic |
| Banco | PostgreSQL; SQLite isolado nos testes |
| Autenticação | JWT e Argon2 |
| Qualidade e entrega | ESLint, TypeScript, pytest e GitHub Actions |
| Deploy do frontend | Vercel |

```text
frontend/            Interface, componentes, estilos e proxy da API
backend/             API, persistência, migrações e testes
docs/               Guias técnicos e identidade visual do README
.github/             Workflow de validação e deploy
docker-compose.yml   PostgreSQL para desenvolvimento
```

## ✦ Executar localmente

Requisitos: **Node.js 22**, **Python 3.11 ou superior**, **Poetry 2.4.1** e **Docker Compose**.

Instale as dependências:

```bash
cd frontend
npm ci
cd ../backend
poetry install --no-root
```

Crie `backend/.env` com as configurações locais (não versione esse arquivo):

```dotenv
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5433/forgehub
JWT_SECRET_KEY=substitua-por-uma-chave-aleatoria-local
```

Na raiz do repositório, inicie o banco:

```bash
docker compose up -d --wait postgres
```

Em um terminal, inicie a API:

```bash
cd backend
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Em outro terminal, inicie o frontend:

```bash
cd frontend
npm run dev
```

Abra [localhost:3000](http://localhost:3000). A documentação da API fica em [127.0.0.1:8001/docs](http://127.0.0.1:8001/docs).

O frontend encaminha `/api` à API local. `API_INTERNAL_URL` configura outro destino no servidor Next.js; na Vercel, use a URL HTTPS pública do backend. Credenciais do banco e chave JWT ficam no backend.

## ✦ Validação

No diretório `frontend`:

```bash
npm run lint
npx --no-install tsc --noEmit
npm run build
```

No diretório `backend`:

```bash
poetry run python -m pytest -q tests
```

Os testes exercitam autenticação, participação, comentários, moderação e privacidade do cofre, usando banco e arquivos isolados. O CI também valida migrações em PostgreSQL.

## ✦ Documentação e deploy

- [Desenvolvimento e funcionamento](docs/DEVELOPMENT.md): fluxos da mesa, permissões, armazenamento privado e testes.
- [Guia de deploy](docs/DEPLOY.md): configuração da API, Vercel e GitHub Actions.
- [Frontend](frontend/README.md): comandos e organização dos estilos.

O frontend está disponível em **[cronicas-beta.vercel.app](https://cronicas-beta.vercel.app)**. A API, o banco e os anexos privados são hospedados separadamente.

---

<p align="center">Feito com ☕, Python e um pouco de dados.</p>  
