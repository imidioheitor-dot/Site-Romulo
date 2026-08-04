import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { iniciarSincronizacao } from './lib/store';
import './styles/global.css';
import './styles/app.css';

// Liga o catálogo/pedidos ao servidor compartilhado. Se ele não existir,
// a chamada falha em silêncio e o site segue no modo local.
iniciarSincronizacao();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
