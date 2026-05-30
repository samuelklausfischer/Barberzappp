console.log('=== MAIN.JSX - CARREGANDO ===');

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Error handling global para capturar qualquer erro não tratado
window.addEventListener('error', (event) => {
  console.error('❌ ERROR GLOBAL CAPTURADO:', event.error);
  document.body.innerHTML = `
    <div style="background:#dc2626;color:white;padding:30px;font-family:monospace;">
      <h1>❌ Erro JavaScript Capturado</h1>
      <p><strong>Message:</strong> ${event.message}</p>
      <p><strong>Source:</strong> ${event.filename}:${event.lineno}:${event.colno}</p>
      <details>
        <summary>Stack Trace</summary>
        <pre style="background:#991b1b;padding:10px;margin-top:10px;overflow:auto;">
          ${event.error ? event.error.stack : 'No stack available'}
        </pre>
      </details>
    </div>
  `;
});

// Capturar erros de Promise
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise Rejection:', event.reason);
  document.body.innerHTML = `
    <div style="background:#ea580c;color:white;padding:30px;font-family:monospace;">
      <h1>❌ Erro de Promise</h1>
      <p><strong>Reason:</strong> ${event.reason}</p>
      <pre style="background:#c2410c;padding:10px;margin-top:10px;">
        ${event.reason ? event.reason.stack || String(event.reason) : 'No details'}
      </pre>
    </div>
  `;
});

console.log('CSS carregado');
console.log('React type:', typeof React);
console.log('createRoot type:', typeof createRoot);
console.log('App type:', typeof App);

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('ERRO CRÍTICO: Elemento #root não encontrado!');
    document.body.innerHTML = `
      <div style="background:red;color:white;padding:50px;text-align:center;font-size:24px;font-family:sans-serif;">
        ❌ ERRO CRÍTICO<br>
        Elemento #root não encontrado no DOM<br>
        <small>Verifique se index.html tem &lt;div id="root"&gt;&lt;/div&gt;</small>
      </div>
    `;
    throw new Error('Root element not found');
  }
  
  console.log('✓ Root element encontrado');
  console.log('Criando React root...');
  const root = createRoot(rootElement);
  
  console.log('✓ Root criado');
  console.log('Renderizando App...');
  root.render(
    React.createElement(React.StrictMode, null,
      React.createElement(App, null)
    )
  );
  
  console.log('✅ Renderização concluída com sucesso!');
  
  // Adicionar indicador visual de sucesso
  setTimeout(() => {
    const devIndicator = document.createElement('div');
    devIndicator.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: #22c55e;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 12px;
      font-family: monospace;
      z-index: 9999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    devIndicator.textContent = '✅ React funcionando | Dev Mode';
    document.body.appendChild(devIndicator);
  }, 1000);
  
} catch (error) {
  console.error('❌ Erro durante renderização:', error);
  console.error('Stack trace:', error.stack);
  
  // Mostrar erro na tela
  document.body.innerHTML = `
    <div style="
      background:#dc2626;
      color:white;
      padding:40px;
      font-family:monospace;
      max-width:900px;
      margin:40px auto;
      border-radius:8px;
      box-shadow:0 4px 6px rgba(0,0,0,0.3);
    ">
      <h1 style="margin:0 0 20px 0;font-size:32px;">❌ Erro ao Renderizar React</h1>
      
      <div style="margin-bottom:20px;">
        <strong style="font-size:18px;">Mensagem:</strong>
        <p style="background:#991b1b;padding:10px;margin-top:5px;border-radius:4px;">
          ${error.message}
        </p>
      </div>
      
      <details style="background:#991b1b;padding:10px;border-radius:4px;">
        <summary style="cursor:pointer;font-weight:bold;margin-bottom:10px;">
          📋 Stack Trace Completo
        </summary>
        <pre style="margin:0; white-space:pre-wrap; font-size:12px; overflow-x:auto;">
          ${error.stack}
        </pre>
      </details>

      <div style="margin-top:20px;font-size:14px;opacity:0.9;">
        <strong>Dicas de Debug:</strong>
        <ul style="margin-top:5px; padding-left:20px;">
          <li>Abra o Console do browser (F12) para ver mais detalhes</li>
          <li>Verifique se todos os módulos estão carregando (Network tab)</li>
          <li>Tente limpar o cache do browser (Ctrl+Shift+R)</li>
          <li>Se usar VPN/firewall, desative temporariamente</li>
        </ul>
      </div>
    </div>
  `;
}
