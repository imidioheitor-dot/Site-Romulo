import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import Boundary from './components/fx/Boundary.jsx';
import TelaDeErro from './components/TelaDeErro.jsx';
import { iniciarSincronizacao } from './lib/store';
import './styles/global.css';
import './styles/app.css';

// Liga o catálogo/pedidos ao servidor compartilhado. Se ele não existir,
// a chamada falha em silêncio e o site segue no modo local.
iniciarSincronizacao();

// Rede de segurança da raiz: sem ela, uma exceção que escape de qualquer
// ponto (inclusive da limpeza de um efeito, durante o desmonte) faz o React
// desmontar a árvore inteira — o site fica com a tela preta e só volta com F5.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Boundary fallback={TelaDeErro}>
      <HashRouter>
        <App />
      </HashRouter>
    </Boundary>
  </React.StrictMode>
);
