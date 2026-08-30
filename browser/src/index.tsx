import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { canonicalRedirectUrl } from './canonicalHost';
import './index.css';

const redirectUrl = canonicalRedirectUrl(new URL(window.location.href));

if (redirectUrl) {
  window.location.replace(redirectUrl);
} else {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }

  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
