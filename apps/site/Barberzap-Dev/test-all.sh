#!/bin/bash

# Script de Teste BarberZap Dashboard
# Execute este script para verificar o status dos servidores

echo "==================================="
echo "🔍 BarberZap Dashboard - Diagnóstico"
echo "==================================="
echo ""

# Verificar se Vite está rodando
echo "1️⃣ Verificando Vite Dev Server..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "   ✅ Vite rodando em http://localhost:5173"
else
    echo "   ❌ Vite não encontrado na porta 5173"
fi
echo ""

# Verificar se Preview está rodando
echo "2️⃣ Verificando Production Preview..."
if curl -s http://localhost:4173 > /dev/null; then
    echo "   ✅ Preview rodando em http://localhost:4173"
else
    echo "   ⚠️  Preview não encontrado (execute: npm run preview)"
fi
echo ""

# Testar HTML
echo "3️⃣ Testando HTML da página..."
HTML=$(curl -s http://localhost:5173)
if echo "$HTML" | grep -q '<div id="root"></div>'; then
    echo "   ✅ HTML válido com elemento #root"
else
    echo "   ❌ HTML sem elemento #root"
fi
echo ""

# Testar módulos
echo "4️⃣ Testando módulos Vite..."
if curl -s http://localhost:5173/src/main.jsx | grep -q "console.log"; then
    echo "   ✅ Módulos principais carregando"
else
    echo "   ❌ Módulos não encontrados"
fi
echo ""

# Verificar processos
echo "5️⃣ Verificando processos Node..."
if pgrep -f "vite" > /dev/null; then
    echo "   ✅ Processo Vite encontrado (PID: $(pgrep -f 'node.*vite' | head -1))"
else
    echo "   ❌ Nenhum processo Vite rodando"
fi
echo ""

echo "==================================="
echo "📌 URLs para Testar:"
echo "==================================="
echo "Development:  http://localhost:5173/"
echo "Preview:      http://localhost:4173/"
echo "Teste Inline: http://localhost:5173/test-inline.html"
echo "Teste React:  http://localhost:5173/test-react-bundle.html"
echo ""
echo "==================================="
echo "🔧 Comandos Úteis:"
echo "==================================="
echo "Reiniciar Vite:  pkill -f vite; npm run dev"
echo "Iniciar Preview: npm run preview"
echo "Novo Build:      npm run build"
echo "Ver Logs:        ps aux | grep -E '(vite|node)'"
echo ""
