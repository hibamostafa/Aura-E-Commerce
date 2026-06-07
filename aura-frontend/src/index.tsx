import React from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore: allow CSS side-effect import without type declarations
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// 1. IMPORT YOUR PROVIDER
import { AuraProvider } from './context/AuraContext'; 

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {/* 2. WRAP THE APP HERE */}
    <AuraProvider>
      <App />
    </AuraProvider>
  </React.StrictMode>
);

reportWebVitals();