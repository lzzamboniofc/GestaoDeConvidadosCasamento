# Gestão de Convidados + Convite Digital — v1.16

Projeto estático (HTML, CSS, JS) publicado na **Vercel**, com autenticação, banco, RSVP e personalização por casamento no **Supabase**. O site oferece somente **um modelo público**, derivado do antigo convite nível 3. Na aba **Fotos do convite**, cada casal autorizado pode trocar as próprias imagens; o administrador controla essa autonomia por casamento. Os arquivos permanecem separados no Supabase Storage.

## Endereços oficiais

- **Login:** `https://lzwebstudio-gestaodecasamentos.vercel.app/`
- **Painel:** `https://lzwebstudio-gestaodecasamentos.vercel.app/admin/`
- **Convite personalizado:** `https://lzwebstudio-gestaodecasamentos.vercel.app/convite/?convite=TOKEN`
- **Presentes:** `https://lzwebstudio-gestaodecasamentos.vercel.app/convite/presentes.html?convite=TOKEN`
- **Redefinir senha:** `https://lzwebstudio-gestaodecasamentos.vercel.app/reset-password.html`

O `TOKEN` é gerado no painel, não deve ser inventado, trocado entre convidados ou divulgado publicamente. Cada link só consulta os dados da pessoa/família correspondente via Edge Function. O URL `#detalhes` é apenas a âncora de navegação e continua funcionando. O link público não exibe mais `convites/nivel-3`.

### Como protegemos o modelo

A pasta publicável real é `convite/`: contém apenas o antigo nível 3 (incluindo lista de presentes e PIX). Os modelos 1, 2 e 4 **não são incluídos**. Na Vercel, `vercel.json` redireciona tentativas de acessar `/convites/*` para o convite oficial. Foram mantidas duas páginas pequenas dentro de `convites/nivel-3/` apenas para redirecionar antigos links enviados pelo GitHub Pages (inclusive query `?convite=...` e âncora `#...`); elas **não contêm a implementação do modelo antigo**. Se o usuário substituir o caminho do link por `nivel-1`, `nivel-2` ou `nivel-4`, não terá acesso a outros designs nesta versão.

**Limite:** URL bonita e remoção de arquivos não transformam HTML estático em conteúdo privado; o código e as imagens públicas continuam acessíveis no site e no histórico de um repositório público. O acesso aos convidados, RSVP e dados do PIX depende da validação do token na Edge Function/Supabase. Não armazenar dados secretos dentro de arquivos públicos.

## Arquivos principais

```text
/
├── index.html                 Entrada (login)
├── reset-password.html        Convite de acesso/recuperação
├── admin/                     Administração e painel dos noivos
│   ├── index.html
│   ├── css/
│   └── js/
├── convite/                   ÚNICO MODELO (antes nível 3)
│   ├── index.html
│   ├── presentes.html
│   ├── assets/images/          Backup das fotos de demonstração
│   ├── assets/audio/musica.mp3
│   ├── js/                    Conteúdo e lógica do convite
│   └── css/
├── convites/nivel-3/          Somente 2 redirecionadores antigos
├── modelos/modelo-importacao-convidados.xlsx
├── supabase/                  SQL e fontes das Edge Functions
├── vercel.json                Redirecionamentos + cabeçalhos
└── README.md                  Documentação única
```

## Atualizar GitHub e Vercel

1. **Faça uma cópia do repositório.** Extraia o ZIP e coloque **o conteúdo da pasta `GestaoDeConvidados/` na raiz** do repositório, sem um nível extra de pasta.
2. **Exclua do Git os diretórios antigos** `convites/nivel-1`, `convites/nivel-2`, `convites/nivel-4` e os `.md` antigos. **Só copiar novos arquivos por cima não remove arquivos antigos** do GitHub/Vercel.
3. Confirme com `git status` que as exclusões de modelos e docs apareceram; depois execute:

   ```bash
   git add -A
   git commit -m "fix: fechar menu mobile do painel e convite"
   git push origin main
   ```

4. Na Vercel, em **Project → Deployments**, confira se o deploy ficou *Ready*. O framework continua **Other** e o projeto segue sem etapa de build.
5. Teste o link oficial com token real, os links antigos e as rotas descontinuadas (que não podem mostrar os outros modelos). Teste também abrir a lista de presentes, copiar PIX, voltar ao convite, WhatsApp, RSVP e login do casal. O token também deve chegar intacto à página de presentes.

O painel agora **gera sempre** links `/convite/?convite=TOKEN`, mesmo para casamentos com a antiga URL-base salva no banco. A configuração de base ficou somente leitura no formulário. Quando salvar novamente a tela **Casamento**, o banco também passará a guardar a URL atualizada. **Não precisa rodar SQL nem redeployar Edge Functions nesta versão.**

### Se não publicar na Vercel

A nova pasta `/convite/` funciona em hospedagem estática com caminho relativo (inclusive GitHub Pages, considerando o prefixo do repositório). Os redirecionamentos de `vercel.json` **só funcionam na Vercel**; as duas páginas antigas fazem encaminhamento do GitHub Pages para a Vercel. Outros servidores podem precisar de redirecionamentos próprios.

## Admin, casal e convites

- **Admin:** pode criar casamentos e gerenciar acessos. O cadastro de novos casamentos já recebe o caminho público fixo.
- **Casal:** pode gerenciar convidados, respostas, informações do próprio casamento e personalização sem acessar outros casamentos (com RLS Supabase).
- O convite 3 possui seções opcionais, temas, fontes, textos, música, RSVP, galeria e presentes.
- Em **Personalizar convite → PIX** existem dois modos: **sem valor definido** (um único código PIX genérico ou link externo) e **valor fixo por presente** (cada presente tem código PIX próprio). Os códigos são configurados por casamento no painel; não há confirmação automática de pagamento. Verifique valor, beneficiário, validade e possibilidade de reutilização no banco.

## Supabase

- `admin/js/config.js`: URL do projeto Supabase, chave **publishable** e `defaultInviteBaseUrl: "../convite/"`.
- `convite/js/config.js`: textos/fotos/serviços, `guestSystem.mode = "api"` e endpoint da Edge Function pública.
- `supabase/schema.sql`: instalação inicial (novos projetos); scripts `supabase/migration_*.sql`: histórico. **Não execute SQL de instalação no banco já existente** por causa de uma mudança de caminho.
- Função **`invite-public`**: valida token público para leitura e RSVP, fornece personalização, inclusive PIX; publica com `verify_jwt=false` porque aplica autenticação pelo token do convite.
- Função **`admin-access`**: somente admin autenticado; normalmente `verify_jwt=true`.
- `wedding_customizations`: personalização por casamento com RLS.
- Em **Authentication → URL Configuration** mantenha a URL de login e redefinição da Vercel. Em **Edge Functions → Secrets**, autorize a origem `https://lzwebstudio-gestaodecasamentos.vercel.app` em `INVITE_ALLOWED_ORIGINS` e `ADMIN_ALLOWED_ORIGINS`.
- Nunca coloque **secret key**, `service_role`, senhas ou tokens de usuários em arquivos de frontend.
- Para e-mails de convite de novos casais fora da equipe do Supabase, configure SMTP próprio antes de usar em produção.

## Fotos, mobile e publicação

**Correção pontual na v1.16:** no celular, o menu do painel pode ser fechado pelo botão ×, toque fora, tecla Esc ou seleção de uma aba. No convite, o botão de menu se transforma em × quando aberto e também permite fechar sem selecionar uma seção. Sem alterações no banco ou no Supabase.

Administrador e noivos autorizados enviam fotos por casamento em **Fotos do convite**; as imagens padrão ficam preservadas no projeto. Campos que aceitam `image: { desktop: "...", mobile: "..." }` escolhem automaticamente a variante mobile abaixo de 768px. Para fundos em `cover`, recomenda-se produzir artes aproximadamente 1920×1080 (desktop) e 1080×1920 (celular), com recortes cuidadosos.

O arquivo `convite/assets/audio/musica.mp3` continua disponível; o botão play/pause não toca automaticamente. O fluxo de publicação segue **GitHub `main` → deploy automático Vercel**.


## v1.15 — Fotos individuais e biblioteca demonstrativa

**Depois de publicar os arquivos na Vercel**, entre como administrador:

1. Abra **Fotos do convite** e clique em **Importar imagens de exemplo para o Supabase**. Esse botão faz a transferência dos 26 arquivos JPG/PNG (11 fotografias do convite e 15 imagens ilustrativas do catálogo de presentes) diretamente pelo seu navegador para o bucket `wedding-demo-media`. Aguarde a confirmação; **isso ainda não é feito automaticamente pelo deploy**.
2. O sistema carrega os exemplos do Supabase apenas depois de a transferência ser concluída; até lá, mantém as fotos locais como fallback.
3. Selecione o casamento. Use **Trocar foto** no slot desejado (capa, história, cerimônia, recepção, programação, galeria, trajes, RSVP; desktop ou celular). O sistema converte para WebP, até 1800 px (desktop) ou 1400 px (mobile), sem você modificar arquivos GitHub.
4. O botão **Restaurar imagem de exemplo** remove o vínculo específico; não altera a biblioteca compartilhada nem o casamento dos outros clientes.
5. Para mostrar o modelo a possíveis clientes, abra `https://lzwebstudio-gestaodecasamentos.vercel.app/convite/?demo=1`. Esta apresentação usa nomes e locais fictícios, marca d'água DEMONSTRAÇÃO, fotos ilustrativas e não permite RSVP/PIX. A página de presentes também pode ser vista por esse link sem cobranças.

Fotos de noivos **não são públicas no bucket**: apenas uma pessoa com token válido recebe links de leitura temporários no convite. Quem receber ou compartilhar um desses links temporários poderá abrir a imagem enquanto ela for válida; não confunda isso com sigilo absoluto. O bucket demonstrativo é público por intenção.

Se uma imagem não carregar, confira o arquivo no Storage, as políticas de acesso e se o `invite-public` está na versão 17. Nunca envie chaves secretas ou `service_role` para o navegador.

## Diagnóstico rápido

- Convite abre sem personalização: conferir o token, status do convite, projeto Supabase, CORS e logs da `invite-public`.
- Link de presente perdeu o token: deve ser gerado por `convite/js/main.js` e restaurado nos links de retorno por `convite/js/gifts-page.js`.
- Vercel ainda mostra nível 1/2/4: conferir que **arquivos antigos foram excluídos do repositório**, não apenas sobrepostos; confirmar deploy `Ready`.
- Cadastro de casamento aponta para URL antiga: atualizar o frontend, então salvar **Casamento** uma vez; o editor usa o caminho fixo definido no código.

## v1.16 — Autonomia para os noivos enviarem as fotos

**Banco da instalação atual:** a migration `supabase/migration_v1_15_to_v1_16.sql` já foi aplicada ao projeto principal. **Não execute novamente no mesmo banco.** A versão 17 da `invite-public` continua compatível e não precisa ser republicada.

- **Por padrão**, o casal vinculado ao casamento pode enviar e substituir as próprias fotos. No painel do administrador, selecione o casamento, abra **Fotos do convite** e desative/ative **Permitir que os noivos editem as fotografias deste casamento**. Apenas administradores podem alterar esse controle; o Supabase o aplica também a tentativas de upload direto.
- A conta do casal possui acesso às fotos apenas de seu(s) casamento(s), conforme `wedding_members`, e não pode importar ou modificar a biblioteca compartilhada. A aba **Fotos do convite** também aparece para noivos; se o administrador bloquear, eles visualizam as fotos sem editar.
- Ao selecionar uma foto JPG/PNG/WebP (máximo 12 MB de arquivo original), o navegador otimiza em WebP (até 1800px desktop / 1400px mobile), apresenta **prévia** e aguarda confirmação antes de enviar (até 5 MB no Storage). Não existe ferramenta de reposicionamento/crop interativa; o enquadramento precisa estar adequado no arquivo escolhido.
- **Desfazer última troca** restaura a fotografia anterior daquele espaço. Fica guardada somente uma versão anterior; depois de uma nova substituição, o backup mais antigo pode ser apagado. **Restaurar imagem de exemplo** limpa a associação daquele espaço e remove também o backup.
- Para testes e novos casamentos, as imagens de exemplo permanecem no bucket demonstrativo e como fallback local. **Importar imagens de exemplo para o Supabase** continua sendo ação exclusiva do administrador.
- Quando a conta do casal não consegue editar, confirme no Supabase `wedding_members`, `wedding_media_permissions` e o status da sessão. Não modifique RLS para `USING (true)` e não publique fotos particulares em bucket público.
