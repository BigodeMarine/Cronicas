# Crônicas

Diário de RPG compartilhado por toda a mesa. O login, as contas e as campanhas existentes são reaproveitados; projetos antigos aparecem como campanhas e tarefas antigas continuam armazenadas.

## O que a mesa pode fazer

- Criar campanhas com nome, cenário e sistema de RPG.
- O criador é o mestre: edita a campanha, registra/edita sessões e adiciona ou remove jogadores pelo e-mail de uma conta existente.
- Mestre e jogadores leem e publicam relatos, livres ou vinculados a uma sessão.
- Autores editam/excluem seus próprios relatos; o mestre também pode moderá-los. Um jogador não altera relatos de outro jogador.
- Remover um jogador revoga seu acesso, preservando seus relatos. As campanhas são privadas para seus participantes.

Não há envio de convites por e-mail, edição simultânea ou ficha de personagem nesta versão. A inclusão pelo mestre concede acesso imediatamente.

## Desenvolvimento

Requisitos: Node.js >=20.9, Python >=3.11, Poetry 2.4.1 e Docker Compose.

Em `frontend`, execute `npm ci`. Em `backend`, execute `poetry install --no-root` (inclui dependências de desenvolvimento).

Crie `backend/.env` com `DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5433/forgehub` e `JWT_SECRET_KEY` com uma chave aleatória local. Não versione esse arquivo ou use as credenciais locais em produção.

Na raiz, execute `docker compose up -d --wait postgres`. Em `backend`, execute `poetry run alembic upgrade head`, depois `poetry run uvicorn app.main:app --host 127.0.0.1 --port 8001`. Em outra sessão, em `frontend`, execute `npm run dev`.

O navegador usa `/api`, encaminhado pelo Next.js à API em `http://127.0.0.1:8001`. `API_INTERNAL_URL` configura o destino no servidor Next.js. `NEXT_PUBLIC_API_URL` é um override opcional para uma API externa; nesse caso, configure também o CORS da API. Sem override, o navegador usa a mesma origem, inclusive em acesso remoto.

Abra a aplicação e clique na capa do livro (também funciona com Enter ou Espaço). As primeiras páginas oferecem login e cadastro, ambos somente com e-mail e senha. O cadastro já autentica a nova conta; após a autenticação, uma animação vira a página e abre o diário, retomando a primeira campanha disponível. O movimento é reduzido para quem prefere menos animações.

O diário mantém a aparência de livro aberto em computador e celular. No índice, acesse **Campanhas**, crie uma mesa e clique em **Abrir diário**. Na aba **Mesa**, adicione jogadores que já tenham conta. Na aba **Sessões**, registre um capítulo; em **Relatos**, todos podem escrever. **Fechar o livro e sair** encerra a sessão e retorna à capa.

Para contas novas, o nome de autoria é gerado a partir da parte do e-mail antes do `@`; contas existentes mantêm seus nomes. A API de cadastro ainda aceita o nome opcional de clientes antigos.

## Validação

Em `backend`: `poetry run python -m pytest -q tests`. Os testes usam banco SQLite isolado, com chaves estrangeiras habilitadas, e exercitam autenticação real, participação, moderação e isolamento entre campanhas; não alteram o banco de desenvolvimento. As migrações devem ser aplicadas também ao PostgreSQL.

Em `frontend`: `npm run build` valida a compilação e TypeScript; `npm run lint` verifica as regras React. Existem erros anteriores em `components/tasks/TasksContent.tsx`, da tela legada de tarefas.
