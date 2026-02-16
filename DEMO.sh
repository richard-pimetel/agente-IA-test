#!/bin/bash

echo "======================================"
echo "🤖 EMERGENT AI - DEMONSTRAÇÃO"
echo "======================================"
echo ""

echo "1️⃣  Verificando configuração..."
node dist/index.js config --show
echo ""

echo "2️⃣  Executando code review..."
node dist/index.js review
echo ""

echo "3️⃣  Gerando documentação..."
node dist/index.js doc --format markdown
echo ""

echo "4️⃣  Visualizando documentação gerada:"
head -30 README-generated.markdown
echo ""

echo "======================================"
echo "✅ Demonstração concluída!"
echo "======================================"
echo ""
echo "Próximos comandos disponíveis:"
echo "  - node dist/index.js deploy"
echo "  - node dist/index.js rollback"
echo "  - node dist/index.js generate <prompt>"
echo ""
