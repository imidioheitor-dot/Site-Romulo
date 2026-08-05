# Rômulo Santos Flores — Loja de Calçados

Site de vendas da **Rômulo Santos Flores**: calçados para o dia a dia com
elegância e preço justo. Interface escura, minimalista e cheia de efeitos
interativos (WebGL / GSAP / shaders), com catálogo, carrinho, pagamento via
**Pix**, e uma **área da equipe** para gestão de estoque e pedidos.

## Como rodar

```bash
npm install
npm run dev        # ambiente de desenvolvimento (site)
npm run dev:api    # (opcional, outro terminal) backend compartilhado local
npm run build      # gera a versão de produção em dist/
npm run preview    # pré-visualiza o build de produção
npm test           # testes da API (estoque, pedidos, senha)
```

Com `npm run dev` sozinho o site roda em **modo local** (só `localStorage`).
Rodando também `npm run dev:api`, o Vite manda `/api` para o servidor local,
que executa exatamente o mesmo código da Netlify Function — com os dados em
`.netlify-blobs-local/` no lugar do Netlify Blobs.

## Estrutura

- **Início** (`/`) — landing scrolável com vídeo de fundo, hero animado e destaques.
- **Catálogo** (`/catalogo`) — todos os modelos, com busca e filtros.
- **Produto** (`/produto/:id`) — detalhe, seleção de tamanho e adicionar ao carrinho.
- **Carrinho** (`/carrinho`) — sacola → dados → **pagamento via Pix** (QR Code + copia e cola + envio do comprovante).
- **Contato** (`/contato`) — canais de atendimento e formulário que abre o WhatsApp.
- **Localização** (`/localizacao`) — mapa e informações da loja.
- **Equipe** (`/equipe`) — login e painel de gestão.

## Pagamento via Pix

O checkout gera um **BR Code Pix** válido (padrão EMV do BACEN) para a chave
telefone da loja `+55 62 9236-8358`, com o valor do carrinho e um identificador
do pedido. O cliente paga, anexa o comprovante e envia o pedido — que entra no
painel da equipe com status **"aguardando confirmação"**.

Ao **confirmar a venda** no painel, o estoque é **baixado automaticamente** e o
pedido passa para **"pago · preparando"**.

## Área da equipe

Acesse em `/equipe`. A senha de fábrica está no histórico deste repositório
(que é público), então **troque-a em *Configurações* no primeiro acesso** —
ver *Backend compartilhado* abaixo, porque essa mesma senha autoriza as
alterações no servidor.

No painel a equipe pode:
- **Pedidos** — ver comprovantes, confirmar vendas (baixa o estoque), marcar como enviado ou cancelar.
- **Estoque** — ajustar quantidades, editar preços, cadastrar/remover modelos.
- **Configurações** — trocar a senha.

Uma faixa no topo do painel mostra se o **servidor compartilhado** está ligado
(estoque e pedidos valendo para todos os aparelhos) ou se o painel está em
**modo local**. Com o servidor ligado, ela também traz *Atualizar* e
*Publicar catálogo*.

## Backend compartilhado (estoque e pedidos)

O site funciona em duas camadas empilhadas:

1. **`localStorage`** — sempre presente. Sem servidor nenhum (hospedagem
   estática, arquivo único aberto no celular, função fora do ar), o site
   continua inteiro: catálogo, carrinho, checkout e painel funcionam, só que
   as alterações valem apenas naquele aparelho.
2. **API compartilhada** — quando existe, ela passa a ser a fonte da verdade.
   Estoque e pedidos ficam iguais em todos os aparelhos.

A API é uma **Netlify Function** (`netlify/functions/api.mjs`) guardando os
dados no **Netlify Blobs**. Não há banco para provisionar nem chave para criar:
publicando o site na Netlify, o backend sobe junto.

### Rotas

| Rota | Quem pode | O que faz |
| --- | --- | --- |
| `GET /api/status` | público | diz se o backend existe (é o que liga o modo compartilhado) |
| `GET /api/catalogo` | público | catálogo + estoque; aceita `?rev=` e responde só "sem mudança" quando nada mudou |
| `PUT /api/catalogo` | **senha da equipe** | grava o catálogo (com detecção de conflito entre aparelhos) |
| `POST /api/pedidos` | público | checkout — o **total é calculado no servidor**, pelo catálogo |
| `GET /api/pedidos` | **senha da equipe** | lista de pedidos (dados de cliente nunca são públicos) |
| `PATCH /api/pedidos` | **senha da equipe** | muda o status; confirmar a venda **baixa o estoque no servidor** |
| `GET /api/comprovante?id=` | **senha da equipe** | comprovante de um pedido (guardado à parte, por ser pesado) |
| `POST /api/login` | público | confere a senha e devolve o token de escrita |
| `PUT /api/senha` | **senha da equipe** | troca a senha da equipe |

### A senha do painel é o token de escrita

A mesma senha usada para entrar em `/equipe` autoriza as rotas de escrita
(vai no cabeçalho `Authorization: Bearer …`). Não há segundo segredo para
administrar: quem sabe a senha gerencia a loja de qualquer aparelho, e trocá-la
em *Configurações* já vale para o servidor.

> ⚠️ **Troque a senha de fábrica.** Este repositório é público, e a senha
> inicial aparece no histórico dele — ou seja, qualquer pessoa pode
> descobri-la e escrever no servidor da loja. Troque em `/equipe` →
> *Configurações*. Enquanto a senha de fábrica estiver valendo, o painel
> mostra um aviso vermelho no topo.

**Como a senha é guardada.** Ao ser trocada pelo painel, ela vai para o Blobs
como `scrypt` com sal — não dá para voltar dela ao texto original. O painel
continua usando um hash simples no `localStorage` para o modo local (sem
servidor), mas isso não é fronteira de segurança: quem manda é o servidor.

**Ordem de precedência** (o primeiro que existir vence):

1. `EQUIPE_SENHA` — senha em texto nas variáveis do site na Netlify
   (*Site configuration → Environment variables*). Como é definida por quem
   tem acesso ao painel da Netlify, ela vence tudo — e serve de caminho de
   recuperação. Com ela definida, trocar a senha pelo painel é recusado com
   uma explicação, em vez de não surtir efeito.
2. `EQUIPE_SENHA_HASH` — um hash pronto, para quem prefere não escrever a
   senha nas variáveis.
3. A senha trocada em `/equipe` → *Configurações* (guardada em `scrypt`).
4. A senha de fábrica.

Tentativas repetidas de senha errada do mesmo IP são bloqueadas por alguns
minutos. Tokens já conferidos ficam alguns minutos em cache na memória da
função, para o `scrypt` não rodar de novo a cada consulta do painel.

> **Nota histórica.** Até agosto/2026 o servidor guardava a senha com o mesmo
> hash de 32 bits do painel. Com 32 bits dá para *calcular* um texto diferente
> que produz o mesmo hash — e ele abriria a API sem que ninguém precisasse
> descobrir a senha. O teste `Token forjado` em `scripts/test-api.mjs` faz essa
> conta e prova que o formato atual recusa o texto forjado. Se a sua loja ainda
> estiver com a senha de fábrica, troque-a: é a troca que grava o formato novo.

### Atualização ao vivo

Cada aba consulta `/api/catalogo?rev=<versão que já tenho>` a cada 20 segundos —
e também quando a aba volta ao foco ou a internet retorna. Quando nada mudou, a
resposta é só o número da versão, então o custo é mínimo; quando alguém mexeu no
estoque, a página se atualiza sozinha, sem recarregar.

Se dois aparelhos salvarem o catálogo ao mesmo tempo, o segundo recebe um
conflito (409) com a versão mais nova e **reaplica** a própria alteração em cima
dela, em vez de apagar o trabalho do outro.

### Testes

```bash
npm test                              # 101 verificações da API (sem rede, sem Netlify)
npm run build && npm run serve:full   # site + API juntos em http://localhost:8888
npm i -D playwright-core && npm run test:e2e   # 31 verificações no navegador
```

O `test:e2e` sobe o site construído com e sem backend e checa no Chromium:
publicação do catálogo, escrita protegida, checkout público, baixa de estoque
ao confirmar a venda, atualização ao vivo entre dois "aparelhos" e o
funcionamento completo em modo local.

## Adicionar as fotos e o vídeo

- **Fotos dos produtos** → `public/products/` (ver `public/products/README.md`).
  O nome do arquivo deve bater com o campo `img` do produto. Sem a foto, o site
  mostra automaticamente uma **ilustração vetorial** gerada a partir das cores.
- **Vídeo do hero** → `public/media/hero.mp4` (ver `public/media/README.md`).
  Sem o vídeo, o hero usa um **shader animado** de fundo.

## Efeitos integrados

MetaBalls, ShapeBlur, Cubes, StickerPeel, Strands, GradualBlur, TargetCursor,
LogoLoop, LiquidChrome, BlurText, ChromaGrid, Dock e uma superfície de
**Liquid Glass** (vidro líquido com refração real via SVG) usada nos cartões,
no checkout e nos painéis.

## Publicar na Netlify

O repositório já vem configurado (`netlify.toml`): build `npm run build`,
publicação em `dist/` e funções em `netlify/functions/`. Basta conectar o
repositório na Netlify — o backend compartilhado sobe junto, sem passo extra.

> **Não crie um redirect de `/api/*` para `/.netlify/functions/api`.** A função
> declara os próprios caminhos (`config.path`), e ao fazer isso ela **deixa de
> atender no endereço padrão `/.netlify/functions/<nome>`**. Um redirect para lá
> aponta para algo que não existe mais — e com `force` ele ainda passa na frente
> do roteamento por path, derrubando a API inteira em 404. O `netlify.toml`
> guarda só o fallback do SPA, sem `force`, justamente para não atropelar nem os
> arquivos estáticos nem os caminhos da função.

Depois de publicar, entre em `/equipe` com a senha: no primeiro acesso o
catálogo local é enviado ao servidor automaticamente e a loja passa a operar
compartilhada.

Hospedando em outro lugar (Vercel, GitHub Pages, arquivo único), o site
continua funcionando — só que em modo local, sem estoque compartilhado.

## Tecnologias

React · React Router · Vite · GSAP · Motion · OGL / Three.js (WebGL) · qrcode
· Netlify Functions · Netlify Blobs
