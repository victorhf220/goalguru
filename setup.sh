#!/bin/bash
# Setup rápido do bot Telegram + Firebase

echo "🚀 GoalGuru - Telegram Analytics Bot"
echo "====================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI não encontrado. Instalando..."
    npm install -g firebase-tools
fi

echo "✅ Verificações concluídas"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
cd functions
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao compilar TypeScript"
    exit 1
fi

echo ""
echo "✅ Projeto compilado com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure as variáveis de ambiente:"
echo "   firebase functions:config:set telegram.token=\"seu_token\""
echo "   firebase functions:config:set mercado_pago.access_token=\"seu_token\""
echo "   firebase functions:config:set api_football.key=\"sua_chave\""
echo ""
echo "2. Deploy das funções:"
echo "   firebase deploy --only functions"
echo ""
echo "3. Registre o webhook do Telegram:"
echo "   firebase functions:call registerWebhook"
echo ""
echo "📖 Consulte README.md para mais informações"
