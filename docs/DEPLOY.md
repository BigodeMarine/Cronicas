# CI/CD e deploy na Vercel

O workflow `.github/workflows/ci-cd.yml` valida frontend e backend. O deploy publica **somente o frontend Next.js** na Vercel. A API FastAPI, o PostgreSQL e os anexos privados precisam de hospedagem separada.

## Quando executa

| Evento | Validação | Deploy após os checks |
| --- | --- | --- |
| Pull request para `main` ou `diario-rpg` | Frontend e backend | Não |
| Push em `diario-rpg` | Frontend e backend | Preview |
| Push em `main` | Frontend e backend | Produção |
| Actions → CI / CD → Run workflow | Frontend e backend | Conforme a branch selecionada |

O deploy só executa quando a variável do repositório `ENABLE_VERCEL_DEPLOY` estiver definida como `true`. Sem ela, o CI funciona e o job de deploy é ignorado. A execução manual também respeita essa variável e só publica `main` ou `diario-rpg`.

O frontend usa Node.js 22, `npm ci`, lint, TypeScript e build. O backend usa Python 3.12, Poetry 2.4.1, testes isolados em SQLite e todas as migrações em um PostgreSQL 16 temporário, seguidas de `alembic check`. Os testes não usam o banco de produção. O deploy depende do sucesso dos dois jobs.

## 1. Hospedar a API

Use um serviço que execute Python e ofereça disco persistente, como uma instância/serviço com volume no provedor de sua preferência. No diretório `backend`:

```bash
poetry install --no-root --only main
poetry run alembic upgrade head
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Ajuste a porta para a exigida pelo provedor. Execute as migrações na etapa de release da API antes de iniciar a nova versão. O workflow da Vercel não atualiza a API nem aplica migrações ao banco de produção.

Configure no provedor da API:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL real com driver `postgresql+psycopg://` |
| `JWT_SECRET_KEY` | Chave aleatória forte, exclusiva da produção |
| `CHARACTER_STORAGE_DIR` | Caminho absoluto de um volume privado persistente |

A API deve ter uma URL HTTPS pública. Valide `/docs` e o fluxo de autenticação antes de conectar o frontend. Preserve os arquivos e o banco entre releases e faça backup de ambos juntos. O cofre atual não é adequado a um disco temporário de funções serverless: reinstâncias perderiam anexos. Use uma API/banco separados para preview se quiser isolar os dados de produção.

## 2. Criar o projeto na Vercel

Importe `BigodeMarine/Cronicas` na Vercel e configure:

| Configuração | Valor |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Node.js Version | 22.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Padrão do Next.js |
| Production Branch | `main` |

Em **Environment Variables**, defina `API_INTERNAL_URL` para **Production** e **Preview**, com a URL HTTPS da sua API, por exemplo `https://api.seu-dominio.com`. Use somente a URL de base; não acrescente `/api` se a API continua com suas rotas diretamente na raiz. Uma barra final é normalizada.

Mantenha `NEXT_PUBLIC_API_URL` sem configuração para usar o proxy `/api` do Next.js. Assim, o navegador acessa a mesma origem e não precisa de CORS adicional para esse fluxo. A API precisa ser acessível pelos servidores da Vercel. Não coloque `DATABASE_URL` ou `JWT_SECRET_KEY` no frontend.

As rewrites são geradas durante o build: ao mudar `API_INTERNAL_URL`, execute outro deploy. A configuração do Next.js recusa um build na Vercel sem essa variável ou apontando para localhost.

`frontend/vercel.json` contém os comandos e desativa deploys automáticos da integração Git. O GitHub Actions passa a controlar a publicação após os testes. Confira essa configuração na Vercel para evitar deploys duplicados ou releases antes da validação. A criação inicial do projeto pode iniciar um primeiro build; configure a URL da API antes dele.

## 3. Configurar GitHub Actions

Em **Settings → Secrets and variables → Actions**, adicione os secrets:

| Secret | Onde obter |
| --- | --- |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens; token com acesso ao projeto/time |
| `VERCEL_ORG_ID` | ID do time/conta, disponível no projeto vinculado pela CLI |
| `VERCEL_PROJECT_ID` | Project Settings → General → Project ID |

Para obter os IDs pela CLI, na **raiz do repositório**:

```bash
npx vercel@63.1.2 login
npx vercel@63.1.2 link
```

Selecione o projeto já criado. O arquivo local `.vercel/project.json` contém `orgId` e `projectId`. A pasta `.vercel` é ignorada pelo Git; não versione tokens nem arquivos de variáveis baixados pela CLI. O workflow também executa os comandos na raiz do repositório e usa o Root Directory `frontend` salvo no projeto da Vercel.

Crie a variável de repositório **`ENABLE_VERCEL_DEPLOY=true`** somente depois de preparar o projeto e as variáveis da Vercel. Essa opção é uma **variable**, não um secret. Os três IDs/token podem ser secrets do repositório ou dos environments correspondentes.

Opcionalmente, configure os GitHub Environments **`production`** e **`preview`**, usados pelo job de deploy, para adicionar regras de aprovação. Nas regras de proteção da branch `main`, exija os checks **Frontend / lint, tipos e build** e **Backend / testes e migrações** antes do merge.

## 4. Executar e conferir

Faça push na `diario-rpg` para gerar um preview; um push/merge na `main` publica produção. Também é possível executar manualmente em **Actions → CI / CD → Run workflow** na branch desejada. O workflow não faz merge automático entre branches.

A Vercel CLI está fixada em 63.1.2. O workflow usa `vercel pull`, `vercel build` e `vercel deploy --prebuilt`; produção acrescenta `--prod`. As variáveis e as configurações são carregadas da Vercel para o ambiente correto antes do build. A URL fica no resumo da execução do job.

Depois do deploy, confira abertura do livro, cadastro/login, campanhas, comentários e upload/download privado do cofre. Teste também uma segunda conta para verificar o isolamento dos personagens.

Se o CI passar e o deploy estiver **skipped**, confira `ENABLE_VERCEL_DEPLOY`. Se o build de deploy falhar por `API_INTERNAL_URL`, revise a variável no ambiente Production/Preview da Vercel. Erros de login ou anexos após o deploy exigem conferir a URL/ disponibilidade da API, suas migrações e o volume privado. Problemas de credenciais do deploy exigem conferir os três secrets e o acesso do token ao projeto.

Para rollback do frontend, use um deploy anterior no painel da Vercel. Isso não reverte migrações ou alterações de dados da API.
