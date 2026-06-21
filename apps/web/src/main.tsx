import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { injectTheme } from './theme.js';
import { App } from './App.js';
import { useClientStore } from './state/clientStore.js';

injectTheme();

if (import.meta.env.DEV) {
  (window as unknown as { civaStore?: unknown }).civaStore = useClientStore;
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
