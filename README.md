# Crônicas

Diário de RPG compartilhado por toda a mesa. O login, as contas e as campanhas existentes são reaproveitados; projetos antigos aparecem como campanhas e tarefas antigas continuam armazenadas.

## O que a mesa pode fazer

- Criar campanhas com nome, cenário e sistema de RPG.
- O criador é o mestre: edita a campanha, registra/edita sessões e adiciona ou remove jogadores pelo e-mail de uma conta existente.
- Mestre e jogadores leem e publicam relatos, livres ou vinculados a uma sessão.
- Todos os participantes podem comentar nos relatos uns dos outros. Comentários têm autoria e data, podem ser editados/excluídos pelo autor e moderados pelo mestre. O acesso aos comentários é revogado junto com a participação na campanha.
- Autores editam/excluem seus próprios relatos; o mestre também pode moderá-los. Um jogador não altera relatos de outro jogador.
- Remover um jogador revoga seu acesso, preservando seus relatos. As campanhas são privadas para seus participantes.

Cada conta também pode manter personagens, fichas anexadas e anotações privadas no **Cofre de Personagens**, descrito abaixo. Não há envio de convites por e-mail ou edição simultânea. A inclusão pelo mestre concede acesso imediatamente à campanha.

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

## Estilos e tipografia

`frontend/app/globals.css` contém somente tokens de cores, tipografia, espaçamento e sombras. O reset está em `styles/Base.module.css`; controles compartilhados em `styles/Ui.module.css`; capa/autenticação e encadernação do diário têm seus próprios CSS Modules em `components/book`. Componentes usam classes locais, sem seletores globais para as telas.

A escala usa o Portfolio de BigodeMarine como referência: descrições em 1,3rem, formulários/ações em 1,125rem, textos secundários em 1rem e títulos responsivos. A capa é um grimório com couro verde escuro, cantoneiras, fechos e um D20 vetorial, sem depender de serviços externos de imagem ou fontes. A abertura e a virada de página respeitam a preferência por movimento reduzido.

Ao abrir a capa, o livro com login/cadastro ocupa **80% da largura da tela em resoluções a partir de 2560px** (2048px em uma tela de 2560px). O ajuste está em `components/book/BookEntrance.module.css`; a capa fechada e os tamanhos das telas menores são preservados. O layout foi verificado em larguras de 375, 1920, 2560, 3440 e 3840px, sem rolagem horizontal.

A migração `d42b8e930002` adiciona os comentários dos relatos. Ao atualizar uma instalação local, execute `poetry run alembic upgrade head` em `backend` antes de reiniciar a API. A paleta verde/dourada do grimório é compartilhada pelo projeto através dos tokens globais.

## Cofre de Personagens

A navegação autenticada agora inclui **Meus personagens** (`/characters`). O cofre é privado: cada conta só acessa seus próprios personagens, retratos, fichas e anotações. Ser mestre ou membro da mesma campanha não concede acesso ao cofre de outra pessoa.

### Preparação

Em `backend`, instale as novas dependências e aplique a migração aditiva:

```bash
poetry install --no-root
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --port 8001
```

A migração `42a4a2c8a28b` adiciona `characters`, `character_participations`, `character_files` e `character_notes`, com chaves estrangeiras, índices e restrições de unicidade. Não substitui nem apaga campanhas, sessões, relatos ou contas existentes.

O frontend continua sendo executado em `frontend` com `npm ci` e `npm run dev`; uploads e downloads autenticados usam o encaminhamento `/api` já existente.

### Armazenamento privado

Não existia armazenamento de anexos no projeto. A implementação local fica em `backend/.local/character-vault` quando a API é iniciada a partir de `backend`. Essa pasta é ignorada pelo Git e não é servida como diretório estático.

A variável opcional `CHARACTER_STORAGE_DIR` em `backend/.env` permite escolher outra pasta **privada**, preferencialmente com caminho absoluto. Exemplo para Windows:

```env
CHARACTER_STORAGE_DIR=C:/dados-privados/cronicas/cofre
```

Ou, em Linux:

```env
CHARACTER_STORAGE_DIR=/caminho/privado/cronicas/cofre
```

O usuário que executa a API precisa poder criar/ler/remover arquivos nessa pasta. Não use `frontend/public`, `.next` ou um diretório servido por HTTP. Os nomes físicos são UUIDs gerados pela aplicação; o nome original só é metadado de download. O PostgreSQL guarda referências e metadados, nunca os binários. Faça backup **do banco e da pasta de arquivos** juntos. Se mudar a pasta, mova também os arquivos já armazenados antes de reiniciar a API.

`PrivateFileStorage` em `app/services/character_storage.py` fornece apenas `write`, `open` e `delete`, permitindo substituir o armazenamento local por um adaptador de objetos no futuro. Esta versão não usa serviços externos.

Retratos aceitam PNG/JPEG de até 5 MiB. Fichas aceitam PDF/PNG/JPEG de até 10 MiB. A extensão, o MIME informado e o conteúdo decodificável são validados pelo backend (Pillow/pypdf); PDFs vazios, protegidos ou corrompidos e imagens acima de 40 milhões de pixels são rejeitados. Não há OCR, interpretação de regras nem extração de campos de PDF.

Há um retrato e uma ficha geral por personagem e uma ficha específica por participação. Enviar outro arquivo substitui o anterior. A limpeza acontece após o commit, verifica referências restantes e inclui exclusões de campanha/personagem; uploads de transações que falham são removidos. Falhas de permissão/disco na limpeza após um commit são registradas no log e precisam de intervenção no armazenamento; não revertem uma alteração já confirmada no banco.

### Como testar o fluxo

1. Entre, abra **Meus personagens** e crie um personagem com nome, sistema, história, estado e retrato opcional.
2. Abra o personagem e anexe/baixe/substitua/remova a **Ficha geral**.
3. Vincule uma campanha da qual sua conta é proprietária ou membro. Vínculos duplicados são bloqueados.
4. Anexe uma **Ficha da campanha**, informe um link HTTP/HTTPS opcional e crie anotações privadas. Cada campanha mantém sua ficha e suas anotações independentes. Uma anotação pode usar uma sessão existente da mesma campanha ou apenas uma data.
5. Edite uma anotação, aposente o personagem sem perder os arquivos ou exclua registros com confirmação. Desvincular uma campanha apaga apenas sua ficha específica e suas anotações; a ficha geral permanece.
6. Entre com outra conta: mesmo o mestre daquela campanha não pode consultar nem baixar esses dados.

Todas as operações verificam novamente propriedade e, para participações/anotações/fichas específicas, acesso atual à campanha. Quando a conta perde o acesso à campanha, essa participação fica indisponível no cofre; os dados são preservados e reaparecem se o acesso for concedido novamente. O personagem e a ficha geral continuam disponíveis, e excluir o personagem ainda remove todos os seus registros.

Listagens de personagens, participações e anotações têm paginação por `limit` (1–100) e `offset`. Personagens têm busca `q`, filtro `system` e `status` (`active`, `retired`, `dead`). Os uploads usam campo multipart `file`. Os downloads são autenticados, têm `Cache-Control: private, no-store` e `X-Content-Type-Options: nosniff`; não há links públicos nem tokens na URL.

### Verificações

```bash
# Em backend: testes isolados, sem alterar dados de desenvolvimento
poetry run python -m pytest -q tests
poetry run alembic check

# Em frontend
npm run lint
npx tsc --noEmit
npm run build
```

Os testes do cofre usam SQLite com chaves estrangeiras habilitadas e armazenamento em pastas temporárias. Exercitam isolamento inclusive nos downloads, vínculos/permissões, privacidade de anotações, fichas independentes, validação de arquivos, limpeza em falhas/substituições/cascatas e CRUD. O lint global ainda acusa os dois problemas preexistentes de efeitos React na tela legada `components/tasks/TasksContent.tsx`; os componentes do cofre não desabilitam essas regras.

Esta primeira versão não inclui compartilhamento de fichas, múltiplas versões de um mesmo anexo, sincronização com VTTs, fichas estruturadas, rolagens ou cálculos de sistema.
