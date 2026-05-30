import React from 'react';

export default function TestSimple() {
  console.log('TestSimple component rendered');
  return React.createElement('div', {
    style: {
      background: 'red',
      color: 'white',
      padding: '50px',
      textAlign: 'center'
    }
  }, 'TESTE SIMPLES - Se você ver isso, React está funcionando!');
}
