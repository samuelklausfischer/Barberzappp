// Versão de teste sem JSX - verifica se o problema é com JSX/transformação

console.log('=== TESTE MAIN carregado ===');
console.log('document:', typeof document);
console.log('root:', document.getElementById('root'));

// Teste simples sem React
const rootDiv = document.getElementById('root');
if (rootDiv) {
  rootDiv.innerHTML = '<div style="background:red;color:white;padding:50px;text-align:center;">TESTE SEM REACT - Se você ver isso, JavaScript está funcionando!</div>';
  console.log('Conteúdo definido no root');
} else {
  console.error('Root não encontrado!');
  document.body.innerHTML = '<div style="background:red;color:white;padding:50px;text-align:center;">ERRO - Root não encontrado!</div>';
}
