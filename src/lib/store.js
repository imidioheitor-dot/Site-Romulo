/* ============================================================
   Camada de dados — produtos / estoque / pedidos / carrinho / equipe

   Duas camadas empilhadas:
   1. localStorage — sempre presente, faz o site funcionar sozinho.
   2. API compartilhada (Netlify Functions + Netlify Blobs) — quando existe,
      vira a fonte da verdade e sincroniza estoque e pedidos entre aparelhos.
   Se a API sumir, a camada 1 continua respondendo: nada quebra.
   ============================================================ */

import { useSyncExternalStore } from 'react';
import * as api from './api';

const KEYS = {
  products: 'rsf.products.v7',
  orders: 'rsf.orders.v1',
  cart: 'rsf.cart.v4',
  staff: 'rsf.staff.v1',
  session: 'rsf.session.v1'
};

const EVENT = 'rsf-store-change';

/* ---------- catálogo inicial ----------
   Cada produto aponta para uma FOTO REAL em /products/<img>.
   Basta colocar o arquivo com esse nome na pasta public/products/.
   O colorway fica só como rede de segurança visual. */
const SEED_PRODUCTS = [
  {
    "id": "rsf-tenis-nb-cream",
    "nome": "New Balance 9060 Cream",
    "marca": "New Balance",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "New Balance 9060 Cream — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#e8e0d0",
      "#9aa0a8"
    ],
    "colorway": {
      "base": "#e8e0d0",
      "mesh": "#e8e0d0",
      "stripe": "#9aa0a8",
      "sole": "#efe9dc",
      "accent": "#9aa0a8",
      "lace": "#e8e0d0"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 10,
    "img": "tenis-nb-cream.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-tenis-nb-blue",
    "nome": "New Balance 9060 Azul",
    "marca": "New Balance",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "New Balance 9060 Azul — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#a9c9e0",
      "#dfe8f0"
    ],
    "colorway": {
      "base": "#a9c9e0",
      "mesh": "#a9c9e0",
      "stripe": "#dfe8f0",
      "sole": "#efe9dc",
      "accent": "#dfe8f0",
      "lace": "#a9c9e0"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 8,
    "img": "tenis-nb-blue.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-tenis-nb-black",
    "nome": "New Balance 9060 Preto",
    "marca": "New Balance",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "New Balance 9060 Preto — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#1a1a1e",
      "#3a3a40"
    ],
    "colorway": {
      "base": "#1a1a1e",
      "mesh": "#1a1a1e",
      "stripe": "#3a3a40",
      "sole": "#efe9dc",
      "accent": "#3a3a40",
      "lace": "#1a1a1e"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 9,
    "img": "tenis-nb-black.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-tenis-nb-white",
    "nome": "New Balance 530 Branco",
    "marca": "New Balance",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "New Balance 530 Branco — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#f0f0ee",
      "#cfcfca"
    ],
    "colorway": {
      "base": "#f0f0ee",
      "mesh": "#f0f0ee",
      "stripe": "#cfcfca",
      "sole": "#efe9dc",
      "accent": "#cfcfca",
      "lace": "#f0f0ee"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 7,
    "img": "tenis-nb-white.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-tenis-campus-preto",
    "nome": "Campus 00s Preto",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Campus 00s Preto — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#161618",
      "#f4f4f2"
    ],
    "colorway": {
      "base": "#161618",
      "mesh": "#161618",
      "stripe": "#f4f4f2",
      "sole": "#efe9dc",
      "accent": "#f4f4f2",
      "lace": "#161618"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 12,
    "img": "tenis-campus-preto.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-tenis-campus-verde",
    "nome": "Campus 00s Verde",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Campus 00s Verde — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#2f6b3a",
      "#f4f4f2"
    ],
    "colorway": {
      "base": "#2f6b3a",
      "mesh": "#2f6b3a",
      "stripe": "#f4f4f2",
      "sole": "#efe9dc",
      "accent": "#f4f4f2",
      "lace": "#2f6b3a"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 8,
    "img": "tenis-campus-verde.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-tenis-campus-rosa",
    "nome": "Campus 00s Rosa",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Feminino",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Campus 00s Rosa — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#c23b6f",
      "#f4f4f2"
    ],
    "colorway": {
      "base": "#c23b6f",
      "mesh": "#c23b6f",
      "stripe": "#f4f4f2",
      "sole": "#efe9dc",
      "accent": "#f4f4f2",
      "lace": "#c23b6f"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 7,
    "img": "tenis-campus-rosa.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-tenis-samba-creme",
    "nome": "Samba OG Creme",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Samba OG Creme — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#f2ead9",
      "#6b4230"
    ],
    "colorway": {
      "base": "#f2ead9",
      "mesh": "#f2ead9",
      "stripe": "#6b4230",
      "sole": "#efe9dc",
      "accent": "#6b4230",
      "lace": "#f2ead9"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 11,
    "img": "tenis-samba-creme.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-tenis-samba-preto",
    "nome": "Samba OG Preto",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Samba OG Preto — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#161618",
      "#e0a35f"
    ],
    "colorway": {
      "base": "#161618",
      "mesh": "#161618",
      "stripe": "#e0a35f",
      "sole": "#efe9dc",
      "accent": "#e0a35f",
      "lace": "#161618"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 10,
    "img": "tenis-samba-preto.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-tenis-af1-preto",
    "nome": "Air Force 1 Preto",
    "marca": "Nike",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Air Force 1 Preto — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#0e0e10",
      "#2a2a2e"
    ],
    "colorway": {
      "base": "#0e0e10",
      "mesh": "#0e0e10",
      "stripe": "#2a2a2e",
      "sole": "#efe9dc",
      "accent": "#2a2a2e",
      "lace": "#0e0e10"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 9,
    "img": "tenis-af1-preto.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-tenis-af1-branco",
    "nome": "Air Force 1 Branco",
    "marca": "Nike",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Air Force 1 Branco — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#f2f2ee",
      "#d8d8d2"
    ],
    "colorway": {
      "base": "#f2f2ee",
      "mesh": "#f2f2ee",
      "stripe": "#d8d8d2",
      "sole": "#efe9dc",
      "accent": "#d8d8d2",
      "lace": "#f2f2ee"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 10,
    "img": "tenis-af1-branco.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-tenis-dunk-cinza",
    "nome": "Dunk Low Cinza",
    "marca": "Nike",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Dunk Low Cinza — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#9aa0a8",
      "#9adfc3"
    ],
    "colorway": {
      "base": "#9aa0a8",
      "mesh": "#9aa0a8",
      "stripe": "#9adfc3",
      "sole": "#efe9dc",
      "accent": "#9adfc3",
      "lace": "#9aa0a8"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 6,
    "img": "tenis-dunk-cinza.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-tenis-nike-mostarda",
    "nome": "Dunk Low Mostarda",
    "marca": "Nike",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Masculino",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Dunk Low Mostarda — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#d8a63a",
      "#f4f1ea"
    ],
    "colorway": {
      "base": "#d8a63a",
      "mesh": "#d8a63a",
      "stripe": "#f4f1ea",
      "sole": "#efe9dc",
      "accent": "#f4f1ea",
      "lace": "#d8a63a"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 6,
    "img": "tenis-nike-mostarda.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-tenis-vans-laranja",
    "nome": "Knu Skool Laranja",
    "marca": "Vans",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 120,
    "precoAntigo": null,
    "descricao": "Knu Skool Laranja — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#d2622a",
      "#f5f5f5"
    ],
    "colorway": {
      "base": "#d2622a",
      "mesh": "#d2622a",
      "stripe": "#f5f5f5",
      "sole": "#efe9dc",
      "accent": "#f5f5f5",
      "lace": "#d2622a"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 9,
    "img": "tenis-vans-laranja.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-tenis-vans-preto",
    "nome": "Knu Skool Preto",
    "marca": "Vans",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 120,
    "precoAntigo": null,
    "descricao": "Knu Skool Preto — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#161619",
      "#f5f5f5"
    ],
    "colorway": {
      "base": "#161619",
      "mesh": "#161619",
      "stripe": "#f5f5f5",
      "sole": "#efe9dc",
      "accent": "#f5f5f5",
      "lace": "#161619"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 12,
    "img": "tenis-vans-preto.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-tenis-mizuno-azul",
    "nome": "Wave Prophecy Azul",
    "marca": "Mizuno",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Wave Prophecy Azul — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#a9c9e0",
      "#1c2a52"
    ],
    "colorway": {
      "base": "#a9c9e0",
      "mesh": "#a9c9e0",
      "stripe": "#1c2a52",
      "sole": "#efe9dc",
      "accent": "#1c2a52",
      "lace": "#a9c9e0"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 6,
    "img": "tenis-mizuno-azul.jpg",
    "destaque": false,
    "tag": "Premium"
  },
  {
    "id": "rsf-tenis-mizuno-preto",
    "nome": "Wave Prophecy Preto",
    "marca": "Mizuno",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Masculino",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Wave Prophecy Preto — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#0e0e10",
      "#3a3a40"
    ],
    "colorway": {
      "base": "#0e0e10",
      "mesh": "#0e0e10",
      "stripe": "#3a3a40",
      "sole": "#efe9dc",
      "accent": "#3a3a40",
      "lace": "#0e0e10"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 7,
    "img": "tenis-mizuno-preto.jpg",
    "destaque": false,
    "tag": "Premium"
  },
  {
    "id": "rsf-tenis-adidas-response",
    "nome": "Response Cinza/Laranja",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Response Cinza/Laranja — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#c9c4bd",
      "#d2622a"
    ],
    "colorway": {
      "base": "#c9c4bd",
      "mesh": "#c9c4bd",
      "stripe": "#d2622a",
      "sole": "#efe9dc",
      "accent": "#d2622a",
      "lace": "#c9c4bd"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 8,
    "img": "tenis-adidas-response.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-tenis-ultraboost-laranja",
    "nome": "Ultraboost Laranja",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Ultraboost Laranja — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#e0512a",
      "#1a1a1e"
    ],
    "colorway": {
      "base": "#e0512a",
      "mesh": "#e0512a",
      "stripe": "#1a1a1e",
      "sole": "#efe9dc",
      "accent": "#1a1a1e",
      "lace": "#e0512a"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 7,
    "img": "tenis-ultraboost-laranja.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-tenis-ultraboost-rosa",
    "nome": "Ultraboost Branco/Rosa",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Feminino",
    "preco": 140,
    "precoAntigo": null,
    "descricao": "Ultraboost Branco/Rosa — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#f0f0ee",
      "#e06a9c"
    ],
    "colorway": {
      "base": "#f0f0ee",
      "mesh": "#f0f0ee",
      "stripe": "#e06a9c",
      "sole": "#efe9dc",
      "accent": "#e06a9c",
      "lace": "#f0f0ee"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 7,
    "img": "tenis-ultraboost-rosa.jpg",
    "destaque": false,
    "tag": "Novo"
  },
  {
    "id": "rsf-tenis-supernova-bege",
    "nome": "Supernova Bege",
    "marca": "Adidas",
    "tipo": "Tênis",
    "categoria": "Tênis",
    "genero": "Unissex",
    "preco": 130,
    "precoAntigo": null,
    "descricao": "Supernova Bege — foto real da loja. Original, na caixa, pronto para envio. Conforto e estilo para o dia a dia.",
    "cores": [
      "#cdbfae",
      "#1a1a1e"
    ],
    "colorway": {
      "base": "#cdbfae",
      "mesh": "#cdbfae",
      "stripe": "#1a1a1e",
      "sole": "#efe9dc",
      "accent": "#1a1a1e",
      "lace": "#cdbfae"
    },
    "tamanhos": [
      37,
      38,
      39,
      40,
      41,
      42,
      43
    ],
    "estoque": 9,
    "img": "tenis-supernova-bege.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camiseta-hugo-azul",
    "nome": "Camiseta HUGO Azul",
    "marca": "Hugo",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta HUGO Azul em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#2a4a8a",
      "#ffffff"
    ],
    "colorway": {
      "base": "#2a4a8a",
      "mesh": "#2a4a8a",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#2a4a8a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 14,
    "img": "camiseta-hugo-azul.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-camiseta-ea7-azul",
    "nome": "Camiseta EA7 Azul",
    "marca": "EA7",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta EA7 Azul em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#3a4a6a",
      "#ffffff"
    ],
    "colorway": {
      "base": "#3a4a6a",
      "mesh": "#3a4a6a",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#3a4a6a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 12,
    "img": "camiseta-ea7-azul.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-camiseta-armani-branca",
    "nome": "Camiseta Armani Branca",
    "marca": "Armani",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Armani Branca em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#f0f0ee",
      "#161616"
    ],
    "colorway": {
      "base": "#f0f0ee",
      "mesh": "#f0f0ee",
      "stripe": "#161616",
      "sole": "#efe9dc",
      "accent": "#161616",
      "lace": "#f0f0ee"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 13,
    "img": "camiseta-armani-branca.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-camiseta-preta",
    "nome": "Camiseta Basic Preta",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Basic Preta em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#161616",
      "#3a3a3a"
    ],
    "colorway": {
      "base": "#161616",
      "mesh": "#161616",
      "stripe": "#3a3a3a",
      "sole": "#efe9dc",
      "accent": "#3a3a3a",
      "lace": "#161616"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 16,
    "img": "camiseta-preta.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-camiseta-vermelha",
    "nome": "Camiseta Basic Vermelha",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Basic Vermelha em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#b12a2a",
      "#ffffff"
    ],
    "colorway": {
      "base": "#b12a2a",
      "mesh": "#b12a2a",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#b12a2a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 12,
    "img": "camiseta-vermelha.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camiseta-laranja",
    "nome": "Camiseta Basic Laranja",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Basic Laranja em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#d2622a",
      "#ffffff"
    ],
    "colorway": {
      "base": "#d2622a",
      "mesh": "#d2622a",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#d2622a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 11,
    "img": "camiseta-laranja.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camiseta-verde",
    "nome": "Camiseta Basic Verde",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Basic Verde em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#2f6b6b",
      "#ffffff"
    ],
    "colorway": {
      "base": "#2f6b6b",
      "mesh": "#2f6b6b",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#2f6b6b"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 12,
    "img": "camiseta-verde.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camiseta-marrom",
    "nome": "Camiseta Basic Marrom",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Basic Marrom em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#5a3a26",
      "#ffffff"
    ],
    "colorway": {
      "base": "#5a3a26",
      "mesh": "#5a3a26",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#5a3a26"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 13,
    "img": "camiseta-marrom.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-camiseta-navy",
    "nome": "Camiseta Basic Azul Marinho",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Basic Azul Marinho em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#1c2a52",
      "#ffffff"
    ],
    "colorway": {
      "base": "#1c2a52",
      "mesh": "#1c2a52",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#1c2a52"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 14,
    "img": "camiseta-navy.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camiseta-lime",
    "nome": "Camiseta Basic Verde Limão",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Basic Verde Limão em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#b0d43a",
      "#161616"
    ],
    "colorway": {
      "base": "#b0d43a",
      "mesh": "#b0d43a",
      "stripe": "#161616",
      "sole": "#efe9dc",
      "accent": "#161616",
      "lace": "#b0d43a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 10,
    "img": "camiseta-lime.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camiseta-gola-alta-bordo",
    "nome": "Camiseta Gola Alta Bordô",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camiseta",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camiseta Gola Alta Bordô em algodão premium com caimento perfeito. Peça versátil que combina com tudo.",
    "cores": [
      "#6a1f2a",
      "#ffffff"
    ],
    "colorway": {
      "base": "#6a1f2a",
      "mesh": "#6a1f2a",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#6a1f2a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 11,
    "img": "camiseta-gola-alta-bordo.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-camisa-manutd",
    "nome": "Camisa Manchester United",
    "marca": "Adidas",
    "tipo": "Roupas",
    "categoria": "Camisa de time",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camisa Manchester United — versão torcedor de alta qualidade, tecido leve e respirável. Vista o seu time com estilo.",
    "cores": [
      "#c8102e",
      "#161616"
    ],
    "colorway": {
      "base": "#c8102e",
      "mesh": "#c8102e",
      "stripe": "#161616",
      "sole": "#efe9dc",
      "accent": "#161616",
      "lace": "#c8102e"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 10,
    "img": "camisa-manutd.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-camisa-saopaulo",
    "nome": "Camisa São Paulo",
    "marca": "New Balance",
    "tipo": "Roupas",
    "categoria": "Camisa de time",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camisa São Paulo — versão torcedor de alta qualidade, tecido leve e respirável. Vista o seu time com estilo.",
    "cores": [
      "#c8102e",
      "#161616"
    ],
    "colorway": {
      "base": "#c8102e",
      "mesh": "#c8102e",
      "stripe": "#161616",
      "sole": "#efe9dc",
      "accent": "#161616",
      "lace": "#c8102e"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 9,
    "img": "camisa-saopaulo.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-camisa-flamengo",
    "nome": "Camisa Flamengo",
    "marca": "Adidas",
    "tipo": "Roupas",
    "categoria": "Camisa de time",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camisa Flamengo — versão torcedor de alta qualidade, tecido leve e respirável. Vista o seu time com estilo.",
    "cores": [
      "#f0f0ee",
      "#c8102e"
    ],
    "colorway": {
      "base": "#f0f0ee",
      "mesh": "#f0f0ee",
      "stripe": "#c8102e",
      "sole": "#efe9dc",
      "accent": "#c8102e",
      "lace": "#f0f0ee"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 10,
    "img": "camisa-flamengo.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-camisa-palmeiras",
    "nome": "Camisa Palmeiras",
    "marca": "Puma",
    "tipo": "Roupas",
    "categoria": "Camisa de time",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camisa Palmeiras — versão torcedor de alta qualidade, tecido leve e respirável. Vista o seu time com estilo.",
    "cores": [
      "#1a6b3a",
      "#ffffff"
    ],
    "colorway": {
      "base": "#1a6b3a",
      "mesh": "#1a6b3a",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#1a6b3a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 9,
    "img": "camisa-palmeiras.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camisa-gremio",
    "nome": "Camisa Grêmio",
    "marca": "Umbro",
    "tipo": "Roupas",
    "categoria": "Camisa de time",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camisa Grêmio — versão torcedor de alta qualidade, tecido leve e respirável. Vista o seu time com estilo.",
    "cores": [
      "#1a6bd8",
      "#161616"
    ],
    "colorway": {
      "base": "#1a6bd8",
      "mesh": "#1a6bd8",
      "stripe": "#161616",
      "sole": "#efe9dc",
      "accent": "#161616",
      "lace": "#1a6bd8"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 8,
    "img": "camisa-gremio.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camisa-chelsea",
    "nome": "Camisa Chelsea",
    "marca": "Nike",
    "tipo": "Roupas",
    "categoria": "Camisa de time",
    "genero": "Masculino",
    "preco": 55,
    "precoAntigo": null,
    "descricao": "Camisa Chelsea — versão torcedor de alta qualidade, tecido leve e respirável. Vista o seu time com estilo.",
    "cores": [
      "#1a4bd8",
      "#ffffff"
    ],
    "colorway": {
      "base": "#1a4bd8",
      "mesh": "#1a4bd8",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#1a4bd8"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 9,
    "img": "camisa-chelsea.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camisa-botao-branca",
    "nome": "Camisa Botão Branca",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camisa",
    "genero": "Masculino",
    "preco": 80,
    "precoAntigo": null,
    "descricao": "Camisa Botão Branca de manga curta, tecido leve e corte moderno. Ideal para o calor com elegância.",
    "cores": [
      "#f0f0ee",
      "#d8d8d2"
    ],
    "colorway": {
      "base": "#f0f0ee",
      "mesh": "#f0f0ee",
      "stripe": "#d8d8d2",
      "sole": "#efe9dc",
      "accent": "#d8d8d2",
      "lace": "#f0f0ee"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 8,
    "img": "camisa-botao-branca.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-camisa-botao-navy",
    "nome": "Camisa Botão Azul Marinho",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camisa",
    "genero": "Masculino",
    "preco": 80,
    "precoAntigo": null,
    "descricao": "Camisa Botão Azul Marinho de manga curta, tecido leve e corte moderno. Ideal para o calor com elegância.",
    "cores": [
      "#1c2a52",
      "#ffffff"
    ],
    "colorway": {
      "base": "#1c2a52",
      "mesh": "#1c2a52",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#1c2a52"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 8,
    "img": "camisa-botao-navy.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-camisa-botao-cinza",
    "nome": "Camisa Botão Cinza",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Camisa",
    "genero": "Masculino",
    "preco": 80,
    "precoAntigo": null,
    "descricao": "Camisa Botão Cinza de manga curta, tecido leve e corte moderno. Ideal para o calor com elegância.",
    "cores": [
      "#5a5a5a",
      "#ffffff"
    ],
    "colorway": {
      "base": "#5a5a5a",
      "mesh": "#5a5a5a",
      "stripe": "#ffffff",
      "sole": "#efe9dc",
      "accent": "#ffffff",
      "lace": "#5a5a5a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 7,
    "img": "camisa-botao-cinza.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-shorts-sarja",
    "nome": "Shorts Sarja",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Shorts",
    "genero": "Masculino",
    "preco": 60,
    "precoAntigo": null,
    "descricao": "Shorts Sarja em sarja confortável, com cordão ajustável. Perfeito para o dia a dia e o verão.",
    "cores": [
      "#d2622a",
      "#161616"
    ],
    "colorway": {
      "base": "#d2622a",
      "mesh": "#d2622a",
      "stripe": "#161616",
      "sole": "#efe9dc",
      "accent": "#161616",
      "lace": "#d2622a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 14,
    "img": "shorts-sarja.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-shorts-colors",
    "nome": "Shorts Sarja Colors",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Shorts",
    "genero": "Masculino",
    "preco": 60,
    "precoAntigo": null,
    "descricao": "Shorts Sarja Colors em sarja confortável, com cordão ajustável. Perfeito para o dia a dia e o verão.",
    "cores": [
      "#2f6b3a",
      "#b12a2a"
    ],
    "colorway": {
      "base": "#2f6b3a",
      "mesh": "#2f6b3a",
      "stripe": "#b12a2a",
      "sole": "#efe9dc",
      "accent": "#b12a2a",
      "lace": "#2f6b3a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 14,
    "img": "shorts-colors.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-calca-verde-marrom",
    "nome": "Calça Alfaiataria Verde/Marrom",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Calça",
    "genero": "Masculino",
    "preco": 90,
    "precoAntigo": null,
    "descricao": "Calça Alfaiataria Verde/Marrom de alfaiataria leve, caimento impecável e muito conforto.",
    "cores": [
      "#2f6b4a",
      "#8a5a3b"
    ],
    "colorway": {
      "base": "#2f6b4a",
      "mesh": "#2f6b4a",
      "stripe": "#8a5a3b",
      "sole": "#efe9dc",
      "accent": "#8a5a3b",
      "lace": "#2f6b4a"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 9,
    "img": "calca-verde-marrom.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-calca-preta-creme",
    "nome": "Calça Alfaiataria Preto/Creme",
    "marca": "Mikka",
    "tipo": "Roupas",
    "categoria": "Calça",
    "genero": "Masculino",
    "preco": 90,
    "precoAntigo": null,
    "descricao": "Calça Alfaiataria Preto/Creme de alfaiataria leve, caimento impecável e muito conforto.",
    "cores": [
      "#161616",
      "#e8e0d0"
    ],
    "colorway": {
      "base": "#161616",
      "mesh": "#161616",
      "stripe": "#e8e0d0",
      "sole": "#efe9dc",
      "accent": "#e8e0d0",
      "lace": "#161616"
    },
    "tamanhos": [
      "P",
      "M",
      "G",
      "GG"
    ],
    "estoque": 9,
    "img": "calca-preta-creme.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-bolsa-caramelo",
    "nome": "Bolsa Iconic Caramelo",
    "marca": "Mikka",
    "tipo": "Bolsas",
    "categoria": "Bolsa",
    "genero": "Feminino",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Bolsa Iconic Caramelo estruturada com fecho H dourado e alça de corrente. Elegância atemporal.",
    "cores": [
      "#a45a34",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#a45a34",
      "mesh": "#a45a34",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#a45a34"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 8,
    "img": "bolsa-caramelo.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-bolsa-preta",
    "nome": "Bolsa Iconic Preta",
    "marca": "Mikka",
    "tipo": "Bolsas",
    "categoria": "Bolsa",
    "genero": "Feminino",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Bolsa Iconic Preta estruturada com fecho H dourado e alça de corrente. Elegância atemporal.",
    "cores": [
      "#121316",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#121316",
      "mesh": "#121316",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#121316"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 9,
    "img": "bolsa-preta.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-bolsa-rosa",
    "nome": "Bolsa Iconic Rosé",
    "marca": "Mikka",
    "tipo": "Bolsas",
    "categoria": "Bolsa",
    "genero": "Feminino",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Bolsa Iconic Rosé estruturada com fecho H dourado e alça de corrente. Elegância atemporal.",
    "cores": [
      "#c07a8a",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#c07a8a",
      "mesh": "#c07a8a",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#c07a8a"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 7,
    "img": "bolsa-rosa.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-bolsa-navy",
    "nome": "Bolsa Iconic Navy",
    "marca": "Mikka",
    "tipo": "Bolsas",
    "categoria": "Bolsa",
    "genero": "Feminino",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Bolsa Iconic Navy estruturada com fecho H dourado e alça de corrente. Elegância atemporal.",
    "cores": [
      "#1c2438",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#1c2438",
      "mesh": "#1c2438",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#1c2438"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 8,
    "img": "bolsa-navy.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-bolsa-vinho",
    "nome": "Bolsa Iconic Vinho",
    "marca": "Mikka",
    "tipo": "Bolsas",
    "categoria": "Bolsa",
    "genero": "Feminino",
    "preco": 150,
    "precoAntigo": null,
    "descricao": "Bolsa Iconic Vinho estruturada com fecho H dourado e alça de corrente. Elegância atemporal.",
    "cores": [
      "#5a1f2a",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#5a1f2a",
      "mesh": "#5a1f2a",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#5a1f2a"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 7,
    "img": "bolsa-vinho.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-carteira-caramelo",
    "nome": "Carteira Caramelo",
    "marca": "Mikka",
    "tipo": "Acessórios",
    "categoria": "Carteira",
    "genero": "Unissex",
    "preco": 90,
    "precoAntigo": null,
    "descricao": "Carteira Caramelo em couro com acabamento premium. Organização e sofisticação no seu bolso.",
    "cores": [
      "#a45a34",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#a45a34",
      "mesh": "#a45a34",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#a45a34"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 10,
    "img": "carteira-caramelo.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-carteira-set",
    "nome": "Kit Carteira + Necessaire",
    "marca": "Mikka",
    "tipo": "Acessórios",
    "categoria": "Carteira",
    "genero": "Unissex",
    "preco": 90,
    "precoAntigo": null,
    "descricao": "Kit Carteira + Necessaire em couro com acabamento premium. Organização e sofisticação no seu bolso.",
    "cores": [
      "#3a3a3a",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#3a3a3a",
      "mesh": "#3a3a3a",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#3a3a3a"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 9,
    "img": "carteira-set.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-perfume-fabulous",
    "nome": "Perfume Fabulous Red",
    "marca": "Mikka",
    "tipo": "Acessórios",
    "categoria": "Perfumaria",
    "genero": "Feminino",
    "preco": 90,
    "precoAntigo": null,
    "descricao": "Perfume Fabulous Red — fragrância marcante e duradoura. 50 ml. O toque final que faz a diferença.",
    "cores": [
      "#8e1420",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#8e1420",
      "mesh": "#8e1420",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#8e1420"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 20,
    "img": "perfume-fabulous.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-perfume-f1black",
    "nome": "Perfume F1 Black",
    "marca": "Mikka",
    "tipo": "Acessórios",
    "categoria": "Perfumaria",
    "genero": "Masculino",
    "preco": 90,
    "precoAntigo": null,
    "descricao": "Perfume F1 Black — fragrância marcante e duradoura. 50 ml. O toque final que faz a diferença.",
    "cores": [
      "#161616",
      "#e3b768"
    ],
    "colorway": {
      "base": "#161616",
      "mesh": "#161616",
      "stripe": "#e3b768",
      "sole": "#efe9dc",
      "accent": "#e3b768",
      "lace": "#161616"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 18,
    "img": "perfume-f1black.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-perfume-black-oud",
    "nome": "Perfume Black Oud",
    "marca": "Mikka",
    "tipo": "Acessórios",
    "categoria": "Perfumaria",
    "genero": "Unissex",
    "preco": 90,
    "precoAntigo": null,
    "descricao": "Perfume Black Oud — fragrância marcante e duradoura. 50 ml. O toque final que faz a diferença.",
    "cores": [
      "#1c241c",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#1c241c",
      "mesh": "#1c241c",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#1c241c"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 16,
    "img": "perfume-black-oud.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-oculos-01",
    "nome": "Aviador Clássico",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Aviador Clássico com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#3a2a1e",
      "#c9a24a"
    ],
    "colorway": {
      "base": "#3a2a1e",
      "mesh": "#3a2a1e",
      "stripe": "#c9a24a",
      "sole": "#efe9dc",
      "accent": "#c9a24a",
      "lace": "#3a2a1e"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 8,
    "img": "oculos-01.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-oculos-02",
    "nome": "Retrô Tartaruga",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Retrô Tartaruga com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#6b4230",
      "#e0a35f"
    ],
    "colorway": {
      "base": "#6b4230",
      "mesh": "#6b4230",
      "stripe": "#e0a35f",
      "sole": "#efe9dc",
      "accent": "#e0a35f",
      "lace": "#6b4230"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 9,
    "img": "oculos-02.jpg",
    "destaque": true,
    "tag": "Novo"
  },
  {
    "id": "rsf-oculos-03",
    "nome": "Esportivo Wrap",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Esportivo Wrap com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#1c2a52",
      "#9ccdf5"
    ],
    "colorway": {
      "base": "#1c2a52",
      "mesh": "#1c2a52",
      "stripe": "#9ccdf5",
      "sole": "#efe9dc",
      "accent": "#9ccdf5",
      "lace": "#1c2a52"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 10,
    "img": "oculos-03.jpg",
    "destaque": true,
    "tag": "Lançamento"
  },
  {
    "id": "rsf-oculos-04",
    "nome": "Redondo Vintage",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Redondo Vintage com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#c0663a",
      "#e6bd8c"
    ],
    "colorway": {
      "base": "#c0663a",
      "mesh": "#c0663a",
      "stripe": "#e6bd8c",
      "sole": "#efe9dc",
      "accent": "#e6bd8c",
      "lace": "#c0663a"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 11,
    "img": "oculos-04.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-oculos-05",
    "nome": "Quadrado Moderno",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Quadrado Moderno com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#2e2016",
      "#d8834e"
    ],
    "colorway": {
      "base": "#2e2016",
      "mesh": "#2e2016",
      "stripe": "#d8834e",
      "sole": "#efe9dc",
      "accent": "#d8834e",
      "lace": "#2e2016"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 12,
    "img": "oculos-05.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-oculos-06",
    "nome": "Aviador Espelhado",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Aviador Espelhado com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#4a4f52",
      "#9adfc3"
    ],
    "colorway": {
      "base": "#4a4f52",
      "mesh": "#4a4f52",
      "stripe": "#9adfc3",
      "sole": "#efe9dc",
      "accent": "#9adfc3",
      "lace": "#4a4f52"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 13,
    "img": "oculos-06.jpg",
    "destaque": true,
    "tag": "Best-seller"
  },
  {
    "id": "rsf-oculos-07",
    "nome": "Esportivo Rainbow",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Esportivo Rainbow com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#c4499c",
      "#59e3d8"
    ],
    "colorway": {
      "base": "#c4499c",
      "mesh": "#c4499c",
      "stripe": "#59e3d8",
      "sole": "#efe9dc",
      "accent": "#59e3d8",
      "lace": "#c4499c"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 8,
    "img": "oculos-07.jpg",
    "destaque": true,
    "tag": "Edição limitada"
  },
  {
    "id": "rsf-oculos-08",
    "nome": "Retrô Âmbar",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Retrô Âmbar com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#8a5a3b",
      "#e3b768"
    ],
    "colorway": {
      "base": "#8a5a3b",
      "mesh": "#8a5a3b",
      "stripe": "#e3b768",
      "sole": "#efe9dc",
      "accent": "#e3b768",
      "lace": "#8a5a3b"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 9,
    "img": "oculos-08.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-oculos-09",
    "nome": "Piloto Degradê",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Piloto Degradê com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#3a2a1e",
      "#d8a63a"
    ],
    "colorway": {
      "base": "#3a2a1e",
      "mesh": "#3a2a1e",
      "stripe": "#d8a63a",
      "sole": "#efe9dc",
      "accent": "#d8a63a",
      "lace": "#3a2a1e"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 10,
    "img": "oculos-09.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-oculos-10",
    "nome": "Wayfarer Noir",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Wayfarer Noir com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#141110",
      "#6c5f51"
    ],
    "colorway": {
      "base": "#141110",
      "mesh": "#141110",
      "stripe": "#6c5f51",
      "sole": "#efe9dc",
      "accent": "#6c5f51",
      "lace": "#141110"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 11,
    "img": "oculos-10.jpg",
    "destaque": true,
    "tag": null
  },
  {
    "id": "rsf-oculos-11",
    "nome": "Esportivo Azul",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Esportivo Azul com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#1c2a52",
      "#62a0ff"
    ],
    "colorway": {
      "base": "#1c2a52",
      "mesh": "#1c2a52",
      "stripe": "#62a0ff",
      "sole": "#efe9dc",
      "accent": "#62a0ff",
      "lace": "#1c2a52"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 12,
    "img": "oculos-11.jpg",
    "destaque": false,
    "tag": null
  },
  {
    "id": "rsf-oculos-12",
    "nome": "Redondo Metal",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Redondo Metal com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#a38b74",
      "#e6bd8c"
    ],
    "colorway": {
      "base": "#a38b74",
      "mesh": "#a38b74",
      "stripe": "#e6bd8c",
      "sole": "#efe9dc",
      "accent": "#e6bd8c",
      "lace": "#a38b74"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 13,
    "img": "oculos-12.jpg",
    "destaque": false,
    "tag": "Novo"
  },
  {
    "id": "rsf-oculos-13",
    "nome": "Aviador Dourado",
    "marca": "Mikka",
    "tipo": "Óculos",
    "categoria": "Óculos de sol",
    "genero": "Unissex",
    "preco": 100,
    "precoAntigo": null,
    "descricao": "Aviador Dourado com proteção UV400 e acabamento premium. Acompanha estojo e flanela Mikka.",
    "cores": [
      "#c9a24a",
      "#f6ece0"
    ],
    "colorway": {
      "base": "#c9a24a",
      "mesh": "#c9a24a",
      "stripe": "#f6ece0",
      "sole": "#efe9dc",
      "accent": "#f6ece0",
      "lace": "#c9a24a"
    },
    "tamanhos": [
      "Único"
    ],
    "estoque": 8,
    "img": "oculos-13.jpg",
    "destaque": true,
    "tag": "Premium"
  }
];

/* fábrica de produtos de tamanho único (bolsas, perfumes, acessórios) */
function mikkaProd(id, tipo, categoria, genero, nome, preco, precoAntigo, descricao, img, estoque, destaque, tag, cores) {
  return {
    id, nome, marca: 'Mikka', tipo, categoria, genero,
    preco, precoAntigo, descricao, cores,
    colorway: { base: '#2e2016', mesh: '#3a2a1e', stripe: '#c0663a', sole: '#e6bd8c', accent: '#c9a24a', lace: '#e6bd8c' },
    tamanhos: ['Único'], estoque, img, destaque, tag
  };
}

/* fábrica de produtos de óculos — reduz repetição no seed */
function oculosProd(id, nome, preco, precoAntigo, descricao, img, estoque, destaque, tag, cores) {
  return {
    id, nome, marca: 'Mikka', tipo: 'Óculos', categoria: 'Óculos de sol', genero: 'Unissex',
    preco, precoAntigo, descricao, cores,
    colorway: { base: '#2e2016', mesh: '#3a2a1e', stripe: '#c0663a', sole: '#e6bd8c', accent: '#c9a24a', lace: '#e6bd8c' },
    tamanhos: ['Único'], estoque, img, destaque, tag
  };
}

/* Senha da equipe guardada SOMENTE como hash — o texto puro não fica no
   código nem no bundle. Para trocar a senha, use "Alterar senha" no painel
   (isso regrava o hash em localStorage). */
const SEED_STAFF = { passHash: 'hltbjm510' };

function hashPass(p) {
  // hash simples para não guardar a senha em texto puro no navegador
  let h = 5381;
  for (let i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36) + p.length;
}

/* ---------- primitivas (camada resiliente) ----------
   Guarda uma cópia em memória (mem) que funciona mesmo quando o
   localStorage está indisponível (ex.: Safari em aba privada) ou cheio.
   Quando o localStorage funciona, ele é usado para persistir entre visitas. */
const mem = new Map();
let storagePersistent = true;

function lsGet(key) {
  try { return localStorage.getItem(key); } catch { storagePersistent = false; return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); return true; }
  catch { storagePersistent = false; return false; }
}
function lsDel(key) {
  try { localStorage.removeItem(key); } catch { /* ignora */ }
}
function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function read(key, fallback) {
  if (mem.has(key)) return mem.get(key);
  const raw = lsGet(key);
  const value = raw ? safeParse(raw, fallback) : fallback;
  mem.set(key, value);
  return value;
}

function write(key, value) {
  // guarda uma nova referência (arrays) para o useSyncExternalStore detectar a mudança
  mem.set(key, Array.isArray(value) ? value.slice() : value);
  if (value == null) lsDel(key);
  else lsSet(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

/* true quando as alterações estão sendo salvas no navegador (persistem entre visitas) */
export function isStoragePersistent() { return storagePersistent; }

function ensureSeed() {
  if (!mem.has(KEYS.products) && !lsGet(KEYS.products)) write(KEYS.products, SEED_PRODUCTS);
  if (!mem.has(KEYS.staff) && !lsGet(KEYS.staff)) write(KEYS.staff, SEED_STAFF);
}
ensureSeed();

function subscribe(cb) {
  const handler = e => {
    if (e && e.type === 'storage') mem.clear(); // outra aba mudou: recarrega do storage
    cb();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshot(key, fallback) {
  return read(key, fallback);
}

export function useStoreKey(name, fallback) {
  const key = KEYS[name];
  return useSyncExternalStore(subscribe, () => getSnapshot(key, fallback));
}

/* ============================================================
   Backend compartilhado (Netlify Functions + Netlify Blobs)

   O localStorage continua sendo a base: tudo funciona sem servidor.
   Quando a API responde, ela vira a fonte da verdade do catálogo e dos
   pedidos, e o localStorage passa a ser o espelho local (offline).
   ============================================================ */

let catalogoRev = null;   // versão do catálogo no servidor (null = ainda não sei)
let pedidosRev = null;
let sincronizacaoIniciada = false;

const ESTADO_INICIAL_BACKEND = {
  estado: api.ESTADO.DESCONHECIDO, // desconhecido | online | offline
  rev: null,
  publicado: false,     // já existe catálogo no servidor?
  sincronizando: false,
  ultimaSync: null,
  erro: null
};

let infoBackend = ESTADO_INICIAL_BACKEND;
const ouvintesBackend = new Set();

function atualizarInfo(parcial) {
  const proximo = { ...infoBackend, ...parcial };
  const mudou = Object.keys(proximo).some(k => proximo[k] !== infoBackend[k]);
  if (!mudou) return;
  infoBackend = proximo;
  ouvintesBackend.forEach(cb => { try { cb(); } catch { /* ignora */ } });
}

api.ouvirBackend(estado => atualizarInfo({ estado, erro: estado === api.ESTADO.OFFLINE ? api.erroBackend() : null }));

/* Estas três funções são definidas UMA vez, fora do componente, de propósito:
   se a `subscribe` mudasse de identidade a cada render, o React cancelaria e
   refaria a inscrição em todo render — troca-troca de efeitos sem necessidade,
   justamente durante as atualizações vindas do servidor. */
function assinarBackend(cb) {
  ouvintesBackend.add(cb);
  return () => { ouvintesBackend.delete(cb); };
}
const lerInfoBackend = () => infoBackend;
const lerInfoBackendInicial = () => ESTADO_INICIAL_BACKEND;

/* Estado do servidor compartilhado, para a interface avisar o lojista. */
export function useBackend() {
  return useSyncExternalStore(assinarBackend, lerInfoBackend, lerInfoBackendInicial);
}

function tokenEquipe() {
  const sessao = read(KEYS.session, null);
  return (sessao && sessao.token) || null;
}

let assinaturaCatalogo = null;

/* Só reescreve o catálogo local quando o conteúdo mudou de verdade. Um
   `write` troca a identidade do array e re-renderiza a árvore inteira —
   fazer isso à toa (a cada resync forçado) é desperdício e, pior, obriga o
   React a montar e desmontar componentes sem motivo. */
function aplicarProdutosRemotos(produtos) {
  if (!Array.isArray(produtos)) return false;
  let assinatura;
  try {
    assinatura = JSON.stringify(produtos);
  } catch {
    assinatura = null;
  }
  if (assinatura != null && assinatura === assinaturaCatalogo) return false;
  assinaturaCatalogo = assinatura;
  write(KEYS.products, produtos);
  return true;
}

/* ---------- catálogo: baixar do servidor ---------- */
export async function sincronizarCatalogo({ forcar = false } = {}) {
  atualizarInfo({ sincronizando: true });
  try {
    const dados = await api.buscarCatalogo(forcar ? null : catalogoRev);
    catalogoRev = dados.rev;

    if (dados.semMudanca) {
      atualizarInfo({ sincronizando: false, rev: dados.rev, ultimaSync: Date.now(), erro: null });
      return { ok: true, mudou: false };
    }

    const publicado = Array.isArray(dados.produtos) && dados.produtos.length > 0;
    if (publicado) aplicarProdutosRemotos(dados.produtos);

    atualizarInfo({ sincronizando: false, rev: dados.rev, publicado, ultimaSync: Date.now(), erro: null });

    // Servidor ainda vazio e a equipe está logada: publica o catálogo local
    // (é assim que a loja "nasce" no backend, sem passo manual).
    if (!publicado && tokenEquipe()) await publicarCatalogoAtual();

    return { ok: true, mudou: publicado, publicado };
  } catch (e) {
    atualizarInfo({ sincronizando: false, erro: e.message });
    return { ok: false, erro: e };
  }
}

/* ---------- catálogo: enviar para o servidor ---------- */
async function enviarCatalogo(lista, mutacao) {
  const token = tokenEquipe();
  if (!api.backendAtivo() || !token) return { ok: true, remoto: false };

  try {
    const r = await api.publicarCatalogo(lista, { rev: catalogoRev, token });
    catalogoRev = r.rev;
    aplicarProdutosRemotos(r.produtos);
    atualizarInfo({ rev: r.rev, publicado: true, ultimaSync: Date.now(), erro: null });
    return { ok: true, remoto: true };
  } catch (e) {
    // Alguém salvou primeiro: reaplica a mesma mudança sobre a versão nova.
    if (e.conflito && e.dados && Array.isArray(e.dados.produtos) && mutacao) {
      catalogoRev = e.dados.rev;
      const refeita = mutacao(e.dados.produtos);
      write(KEYS.products, refeita);
      try {
        const r2 = await api.publicarCatalogo(refeita, { rev: catalogoRev, token });
        catalogoRev = r2.rev;
        aplicarProdutosRemotos(r2.produtos);
        atualizarInfo({ rev: r2.rev, publicado: true, ultimaSync: Date.now(), erro: null });
        return { ok: true, remoto: true, refeito: true };
      } catch (e2) {
        atualizarInfo({ erro: e2.message });
        return { ok: false, remoto: true, erro: e2 };
      }
    }
    if (!e.offline) atualizarInfo({ erro: e.message });
    return { ok: false, remoto: true, erro: e };
  }
}

/* Publica o catálogo local inteiro (usado no primeiro login e no botão
   "Publicar catálogo" do painel). */
export async function publicarCatalogoAtual() {
  const r = await enviarCatalogo(getProducts(), null);
  if (r.ok && r.remoto) atualizarInfo({ publicado: true });
  return r;
}

/* Aplica a mudança no aparelho (resposta imediata) e replica no servidor. */
function alterarProdutos(mutacao) {
  const lista = mutacao(getProducts());
  write(KEYS.products, lista);
  return enviarCatalogo(lista, mutacao);
}

/* ---------- pedidos: baixar do servidor (só a equipe) ---------- */
export async function sincronizarPedidos({ forcar = false } = {}) {
  const token = tokenEquipe();
  if (!token || !api.backendAtivo()) return { ok: true, remoto: false };
  try {
    const dados = await api.buscarPedidos(token, forcar ? null : pedidosRev);
    pedidosRev = dados.rev;
    if (dados.semMudanca) return { ok: true, mudou: false };
    mesclarPedidosRemotos(dados.pedidos || []);
    return { ok: true, mudou: true };
  } catch (e) {
    return { ok: false, erro: e };
  }
}

/* O servidor manda a lista sem os comprovantes (que são pesados e ficam
   guardados à parte). Preservamos o comprovante que já estiver no aparelho. */
function mesclarPedidosRemotos(remotos) {
  const locais = read(KEYS.orders, []);
  const porId = new Map(locais.map(o => [o.id, o]));
  const mesclados = remotos.map(o => {
    const local = porId.get(o.id);
    return local && local.comprovante ? { ...o, comprovante: local.comprovante } : o;
  });
  const idsRemotos = new Set(remotos.map(o => o.id));
  // pedidos que ficaram só no aparelho (feitos sem servidor) continuam na lista
  const sobras = locais.filter(o => !idsRemotos.has(o.id) && o.somenteLocal);
  write(KEYS.orders, [...mesclados, ...sobras].sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm))));
}

function guardarPedidoLocal(pedido) {
  const orders = read(KEYS.orders, []);
  const i = orders.findIndex(o => o.id === pedido.id);
  if (i >= 0) orders[i] = { ...orders[i], ...pedido };
  else orders.unshift(pedido);
  write(KEYS.orders, orders);
}

/* ---------- sincronização ao vivo ----------
   Sem WebSocket: uma consulta curta de tempos em tempos (e sempre que a aba
   volta ao foco). Quando nada mudou, o servidor responde só com o número da
   versão, então o custo é mínimo. */
export function iniciarSincronizacao({ intervalo = 20000 } = {}) {
  if (sincronizacaoIniciada || typeof window === 'undefined') return () => {};
  sincronizacaoIniciada = true;

  let parado = false;
  let timer = null;

  const ciclo = async () => {
    if (parado) return;
    if (!document.hidden) {
      await sincronizarCatalogo();
      if (tokenEquipe()) await sincronizarPedidos();
    }
    if (!parado) timer = setTimeout(ciclo, intervalo);
  };

  const agora = () => {
    if (parado || document.hidden) return;
    sincronizarCatalogo();
    if (tokenEquipe()) sincronizarPedidos();
  };

  ciclo();

  const aoVoltar = () => { if (!document.hidden) agora(); };
  window.addEventListener('focus', aoVoltar);
  window.addEventListener('online', agora);
  document.addEventListener('visibilitychange', aoVoltar);

  return () => {
    parado = true;
    sincronizacaoIniciada = false;
    if (timer) clearTimeout(timer);
    window.removeEventListener('focus', aoVoltar);
    window.removeEventListener('online', agora);
    document.removeEventListener('visibilitychange', aoVoltar);
  };
}

/* ---------- categorias (tipos de produto) ---------- */
export const CATEGORIAS = ['Tênis', 'Roupas', 'Óculos', 'Bolsas', 'Cuecas', 'Acessórios'];

/* ---------- produtos / estoque ---------- */
export const useProducts = () => useStoreKey('products', []);

export function getProducts() {
  return read(KEYS.products, []);
}

/* Sobe a foto para o endereço dela e devolve a referência curta que vai para
   o catálogo. Sem servidor (ou sem sessão), a foto continua embutida — o modo
   local não tem onde guardá-la separada. */
async function guardarFoto(img) {
  const token = tokenEquipe();
  if (!img || !String(img).startsWith('data:')) return { img, ok: true };
  if (!api.backendAtivo() || !token) return { img, ok: true, local: true };
  try {
    const r = await api.enviarFoto(img, token);
    return { img: r.caminho, ok: true };
  } catch (e) {
    return { img, ok: false, erro: e };
  }
}

export async function saveProduct(product) {
  const id = product.id || 'rsf-' + Math.random().toString(36).slice(2, 8);

  const foto = await guardarFoto(product.img);
  if (!foto.ok) return { ok: false, erro: foto.erro };

  const produto = { ...product, id, img: foto.img };
  return alterarProdutos(lista => {
    const i = lista.findIndex(p => p.id === id);
    const nova = lista.slice();
    if (i >= 0) nova[i] = produto;
    else nova.unshift(produto);
    return nova;
  });
}

/* Converte para o formato novo as fotos que ficaram embutidas no catálogo
   (cadastradas antes desta mudança). Um clique no painel, sem programação. */
export async function otimizarFotos() {
  const token = tokenEquipe();
  if (!api.backendAtivo() || !token) return { ok: false, motivo: 'sem-servidor' };

  const lista = getProducts();
  const pendentes = lista.filter(p => String(p.img || '').startsWith('data:'));
  if (!pendentes.length) return { ok: true, convertidas: 0, jaOtimizado: true };

  const mapa = new Map();
  for (const p of pendentes) {
    const r = await guardarFoto(p.img);
    if (!r.ok) return { ok: false, convertidas: mapa.size, erro: r.erro };
    mapa.set(p.id, r.img);
  }

  const sync = await alterarProdutos(atual =>
    atual.map(p => (mapa.has(p.id) ? { ...p, img: mapa.get(p.id) } : p))
  );
  return { ok: sync.ok !== false, convertidas: mapa.size, sync };
}

/* quantas fotos ainda viajam dentro do catálogo */
export function fotosEmbutidas() {
  return getProducts().filter(p => String(p.img || '').startsWith('data:')).length;
}

export function deleteProduct(id) {
  return alterarProdutos(lista => lista.filter(p => p.id !== id));
}

export function adjustStock(id, delta) {
  return alterarProdutos(lista =>
    lista.map(p => (p.id === id ? { ...p, estoque: Math.max(0, (p.estoque || 0) + delta) } : p))
  );
}

/* ---------- exportar / importar catálogo (backup local em arquivo) ----------
   Permite ao lojista salvar todos os produtos + fotos num arquivo .json e
   recarregar depois, garantindo que o trabalho não se perca entre visitas. */
export function exportCatalog() {
  return JSON.stringify({ tipo: 'casa-mikka-catalogo', versao: 1, data: new Date().toISOString(), produtos: getProducts() });
}

export async function importCatalog(text, { mesclar = false } = {}) {
  const parsed = JSON.parse(text);
  const produtos = Array.isArray(parsed) ? parsed : parsed && parsed.produtos;
  if (!Array.isArray(produtos) || !produtos.length) throw new Error('Arquivo sem produtos válidos.');
  const norm = produtos.map(p => ({ ...p, id: p.id || 'rsf-' + Math.random().toString(36).slice(2, 8) }));

  let total = norm.length;
  const sync = await alterarProdutos(lista => {
    if (!mesclar) return norm;
    const byId = new Map(lista.map(p => [p.id, p]));
    norm.forEach(p => byId.set(p.id, p));
    const mesclada = [...byId.values()];
    total = mesclada.length;
    return mesclada;
  });
  return { total, sync };
}

/* ---------- carrinho ---------- */
export const useCart = () => useStoreKey('cart', []);

export function addToCart(productId, tamanho, qtd = 1) {
  const cart = read(KEYS.cart, []);
  const item = cart.find(i => i.productId === productId && i.tamanho === tamanho);
  if (item) item.qtd += qtd;
  else cart.push({ productId, tamanho, qtd });
  write(KEYS.cart, cart);
}

export function setCartQty(productId, tamanho, qtd) {
  let cart = read(KEYS.cart, []);
  const item = cart.find(i => i.productId === productId && i.tamanho === tamanho);
  if (item) item.qtd = qtd;
  cart = cart.filter(i => i.qtd > 0);
  write(KEYS.cart, cart);
}

export function clearCart() {
  write(KEYS.cart, []);
}

export function cartDetails(cart, products) {
  const items = cart
    .map(i => {
      const produto = products.find(p => p.id === i.productId);
      return produto ? { ...i, produto, subtotal: produto.preco * i.qtd } : null;
    })
    .filter(Boolean);
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const count = items.reduce((s, i) => s + i.qtd, 0);
  return { items, total, count };
}

/* ---------- pedidos ---------- */
export const useOrders = () => useStoreKey('orders', []);

export const ORDER_STATUS = {
  AGUARDANDO: 'aguardando',   // comprovante enviado, aguardando confirmação
  PAGO: 'pago',               // venda confirmada, estoque baixado, preparando
  ENVIADO: 'enviado',
  CANCELADO: 'cancelado'
};

/* Checkout público. Com servidor, o pedido cai na conta da loja (qualquer
   aparelho da equipe vê). Sem servidor, fica salvo no aparelho do cliente,
   exatamente como antes. */
export async function createOrder({ cliente, itens, total, comprovante }) {
  if (api.backendAtivo()) {
    try {
      const r = await api.enviarPedido({
        cliente,
        itens: itens.map(i => ({ productId: i.productId, tamanho: i.tamanho, qtd: i.qtd })),
        comprovante
      });
      const pedido = { ...r.pedido, comprovante: comprovante || null };
      guardarPedidoLocal(pedido);
      clearCart();
      return pedido;
    } catch (e) {
      // erro de validação precisa chegar ao cliente; queda de rede não.
      if (!e.offline && e.status !== 503) throw e;
    }
  }

  const orders = read(KEYS.orders, []);
  const id = 'RSF' + Date.now().toString(36).toUpperCase().slice(-6);
  const order = {
    id,
    criadoEm: new Date().toISOString(),
    status: ORDER_STATUS.AGUARDANDO,
    cliente,
    itens,
    total,
    comprovante, // dataURL da imagem/pdf do comprovante
    temComprovante: !!comprovante,
    somenteLocal: true
  };
  orders.unshift(order);
  write(KEYS.orders, orders);
  clearCart();
  return order;
}

export async function updateOrderStatus(orderId, status) {
  const token = tokenEquipe();
  const pedidoLocal = read(KEYS.orders, []).find(o => o.id === orderId);

  if (api.backendAtivo() && token && pedidoLocal && !pedidoLocal.somenteLocal) {
    try {
      const r = await api.mudarStatusPedido(orderId, status, token);
      pedidosRev = r.rev;
      guardarPedidoLocal(r.pedido);
      if (r.catalogo) {
        catalogoRev = r.catalogo.rev;
        aplicarProdutosRemotos(r.catalogo.produtos);
        atualizarInfo({ rev: r.catalogo.rev });
      }
      return { ok: true, remoto: true };
    } catch (e) {
      if (!e.offline) return { ok: false, erro: e };
    }
  }

  const orders = read(KEYS.orders, []);
  const order = orders.find(o => o.id === orderId);
  if (!order) return { ok: false, erro: new Error('Pedido não encontrado.') };

  // confirmar a venda baixa o estoque automaticamente (uma única vez)
  if (status === ORDER_STATUS.PAGO && order.status === ORDER_STATUS.AGUARDANDO) {
    await alterarProdutos(lista =>
      lista.map(p => {
        const item = order.itens.find(i => i.productId === p.id);
        return item ? { ...p, estoque: Math.max(0, (p.estoque || 0) - item.qtd) } : p;
      })
    );
  }

  order.status = status;
  write(KEYS.orders, orders);
  return { ok: true, remoto: false };
}

/* Comprovantes ficam num blob separado: busca sob demanda ao abrir o modal. */
export async function obterComprovante(orderId) {
  const local = read(KEYS.orders, []).find(o => o.id === orderId);
  if (local && local.comprovante) return local.comprovante;
  const token = tokenEquipe();
  if (!api.backendAtivo() || !token) return null;
  const r = await api.buscarComprovante(orderId, token);
  if (r && r.comprovante) {
    guardarPedidoLocal({ id: orderId, comprovante: r.comprovante });
    return r.comprovante;
  }
  return null;
}

/* ---------- autenticação da equipe ----------
   A senha do painel é também o token de escrita da API: ela vai no cabeçalho
   Authorization das rotas protegidas. */
export const useSession = () => useStoreKey('session', null);

export async function login(password) {
  if (api.estadoBackend() !== api.ESTADO.OFFLINE) {
    try {
      const r = await api.entrar(password);
      write(KEYS.session, {
        at: Date.now(),
        token: r.token,
        remoto: true,
        // o servidor avisa quando a senha em uso ainda é a de fábrica /
        // está guardada no formato fraco, que dá para forjar
        senhaFraca: !!r.senhaFraca,
        senhaNoAmbiente: !!r.senhaFixadaNoAmbiente
      });
      write(KEYS.staff, { passHash: hashPass(password) }); // mantém o modo local em dia
      await sincronizarCatalogo({ forcar: true });
      await sincronizarPedidos({ forcar: true });
      return true;
    } catch (e) {
      if (!e.offline) return false; // senha errada / bloqueio: não tenta local
    }
  }

  const staff = read(KEYS.staff, SEED_STAFF);
  if (hashPass(password) === staff.passHash) {
    write(KEYS.session, { at: Date.now(), token: password, remoto: false });
    return true;
  }
  return false;
}

export function logout() {
  pedidosRev = null;
  write(KEYS.session, null);
}

export async function changePassword(current, next) {
  const staff = read(KEYS.staff, SEED_STAFF);

  if (api.backendAtivo()) {
    try {
      // a senha atual é o próprio token: o servidor confere antes de trocar
      const r = await api.trocarSenhaRemota(next, current);
      write(KEYS.staff, { passHash: hashPass(next) });
      write(KEYS.session, { at: Date.now(), token: r.token || next, remoto: true, senhaFraca: false });
      return true;
    } catch (e) {
      if (!e.offline) return false;
    }
  }

  if (hashPass(current) !== staff.passHash) return false;
  write(KEYS.staff, { passHash: hashPass(next) });
  const sessao = read(KEYS.session, null);
  if (sessao) write(KEYS.session, { ...sessao, token: next });
  return true;
}

/* dados fixos da loja */
export const LOJA = {
  nome: 'Casa Mikka',
  slogan: 'Elegância para o dia a dia.',
  pixTelefone: '+55 62 9236-8358',
  pixChave: 'romulo.santosflores@icloud.com',
  whatsapp: '556292368358',
  instagram: '@mikka_shoes_',
  instagramUrl: 'https://instagram.com/mikka_shoes_',
  email: 'contato@casamikka.com.br',
  endereco: 'R. 261, 450 — Qd 24 Lt 54, St. Coimbra, Goiânia - GO, 74533-050',
  horario: 'Seg a Sáb — 9h às 19h',
  cidade: 'GOIANIA'
};
