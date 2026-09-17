import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/app.css';
import { installSelfCheck } from './lib/selfCheck.js';

/* Console helper: `__jabSelfCheck()` asserts the scoring invariants and the
   CTA wiring in the running page. */
installSelfCheck();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
