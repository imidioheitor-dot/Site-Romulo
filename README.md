# Rômulo Santos Flores — Loja de Calçados

Site de vendas da **Rômulo Santos Flores**: calçados para o dia a dia com
elegância e preço justo. Interface escura, minimalista e cheia de efeitos
interativos (WebGL / GSAP / shaders), com catálogo, carrinho, pagamento via
**Pix**, e uma **área da equipe** para gestão de estoque e pedidos.

## Como rodar

```bash
npm install
npm run dev        # ambiente de desenvolvimento
npm run build      # gera a versão de produção em dist/
npm run preview    # pré-visualiza o build de produção
```

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

Acesse em `/equipe`. Senha padrão inicial: **`romulo2026`**
(altere em *Configurações* após o primeiro acesso).

No painel a equipe pode:
- **Pedidos** — ver comprovantes, confirmar vendas (baixa o estoque), marcar como enviado ou cancelar.
- **Estoque** — ajustar quantidades, editar preços, cadastrar/remover modelos.
- **Configurações** — trocar a senha.

> Os dados (produtos, estoque, pedidos, carrinho, senha) são persistidos no
> `localStorage` do navegador — não exigem servidor. Para uma operação com
> múltiplos dispositivos, basta plugar as funções de `src/lib/store.js` a uma API/BD.

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

## Tecnologias

React · React Router · Vite · GSAP · Motion · OGL / Three.js (WebGL) · qrcode
