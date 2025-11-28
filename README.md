# 🤖 Telegram Analytics Bot - Firebase Cloud Functions

Bot Telegram para análises de futebol e basquete com pagamentos via Mercado Pago, hospedado em Firebase Cloud Functions.

## 📋 Pré-requisitos

- Node.js 18+
- Firebase CLI instalado globalmente (`npm install -g firebase-tools`)
- Conta Google/Firebase
- Token do BotFather do Telegram
- Chave de API do Mercado Pago
- Chave de API da API-Football (ou BallDontLie para basquete)

## 🚀 Setup Inicial

### 1. Clonar e instalar dependências

```bash
cd functions
npm install
```

### 2. Configurar variáveis de ambiente do Firebase

As variáveis de ambiente devem ser definidas no Firebase (Runtime Config). Execute:

```bash
firebase functions:config:set telegram.token="seu_token_aqui"
firebase functions:config:set mercado_pago.access_token="seu_token_aqui"
firebase functions:config:set api_football.key="sua_chave_aqui"
firebase functions:config:set app.base_url="https://seu-region-seu-projeto.cloudfunctions.net"
```

Ou edite o arquivo `.runtimeconfig.json` localmente:

```json
{
  "telegram": {
    "token": "seu_token_do_botfather"
  },
  "mercado_pago": {
    "access_token": "seu_access_token_mercado_pago"
  },
  "api_football": {
    "key": "sua_chave_api_football"
  },
  "app": {
    "base_url": "https://us-central1-seu-projeto.cloudfunctions.net"
  }
}
```

> **Importante:** Não commitá `.runtimeconfig.json` no Git! Adicione ao `.gitignore`.

### 3. Configurar Firestore

A primeira vez que o bot rodar, as coleções serão criadas automaticamente. Você pode configurar regras de segurança:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || request.auth == null;
    }
    
    // Analyses
    match /analyses/{document=**} {
      allow read, create: if true;
    }
    
    // Payments
    match /payments/{document=**} {
      allow read, create: if true;
    }
  }
}
```

## 🔧 Desenvolvimento Local

### Iniciar emulator

```bash
firebase emulators:start --only functions
```

A função estará disponível em `http://localhost:5001/seu-projeto/us-central1/telegramWebhook`.

### Build

```bash
npm run build
```

## 🌐 Deploy para Firebase

### Deploy da função

```bash
npm run deploy
```

Ou:

```bash
firebase deploy --only functions
```

### Registrar webhook do Telegram

Após o deploy, execute a função `registerWebhook` (via HTTP call ou Firebase Console):

**URL da função:**
```
https://us-central1-seu-projeto.cloudfunctions.net/registerWebhook
```

**Ou execute via CLI:**
```bash
firebase functions:call registerWebhook
```

Isso registrará automaticamente o webhook do Telegram apontando para sua Cloud Function.

## 💳 Configurar Mercado Pago Webhook

No [Painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel):

1. Vá para **Webhooks**
2. Registre a URL:
   ```
   https://us-central1-seu-projeto.cloudfunctions.net/mercadoPagoWebhook
   ```
3. Selecione os eventos: `payment.created` e `payment.updated`

## 📚 Estrutura do Projeto

```
functions/
├── src/
│   ├── index.ts              # Entry point + webhook
│   ├── telegram.ts           # Setup bot + handlers
│   ├── analyzeFootball.ts    # Análise futebol (Poisson)
│   ├── analyzeBasketball.ts  # Análise basquete (Normal)
│   ├── firestore.ts          # Helpers Firestore
│   ├── payments.ts           # Integração Mercado Pago
├── package.json
├── tsconfig.json
└── lib/                       # Output compilado (gerado)
```

## 🎮 Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `/start` | Inicializa o bot e mostra menu |
| `/futebol Time1 x Time2` | Analisa jogo de futebol |
| `/basquete Time1 x Time2` | Analisa jogo de basquete |
| `💰 Saldo` | Mostra créditos e status VIP |
| `⭐ VIP` | Ativa assinatura VIP por 30 dias |
| `🛒 Comprar créditos` | Compra pacotes de créditos |

### Exemplos de Uso

```
/start
/futebol Corinthians x Palmeiras
/basquete Lakers x Celtics
```

## 💰 Monetização

### VIP (Assinatura)
- **Preço:** R$ 29,90 por mês
- **Benefício:** Análises ilimitadas (sem deducção de créditos)

### Créditos
- **5 créditos:** R$ 4,90
- **15 créditos:** R$ 12,90
- **50 créditos:** R$ 39,90
- **Uso:** 1 crédito por análise (se não VIP)

## 🔒 Segurança

- Tokens sensíveis em variáveis de ambiente do Firebase
- Firestore com autenticação mínima (ajuste as regras conforme necessário)
- Webhook do Telegram validado automaticamente pelo SDK

## 📊 Base de Dados (Firestore)

### Coleção `users`
```json
{
  "telegramId": "123456789",
  "createdAt": "timestamp",
  "vip": false,
  "vipExpiresAt": 1234567890,
  "credits": 10,
  "firstName": "João",
  "lastName": "Silva"
}
```

### Coleção `analyses`
```json
{
  "userId": "123456789",
  "type": "futebol" | "basquete",
  "query": "Corinthians x Palmeiras",
  "timestamp": "timestamp"
}
```

### Coleção `payments`
```json
{
  "userId": "123456789",
  "type": "vip" | "credits",
  "amount": 29.90,
  "mpReference": "mercadopago-ref-123",
  "status": "pending" | "confirmed",
  "timestamp": "timestamp"
}
```

## 🐛 Troubleshooting

### Webhook não funciona
- Verifique se o token do Telegram está correto em `firebase functions:config:get`
- Confirme que a URL do webhook está registrada com `firebase functions:call registerWebhook`

### Erro de credenciais
- Certifique-se de que as variáveis de ambiente foram definidas: `firebase functions:config:get`

### Firestore não inicializa
- Confirme que o banco de dados Firestore foi criado no Firebase Console

## 📝 Logs

Para ver logs da function:

```bash
firebase functions:log --follow
```

Ou via Firebase Console > Functions > Logs.

## 🔄 Atualizações Futuras

- [ ] Integração com mais APIs (Statsbomb, Understat, etc)
- [ ] Análises personalizadas por liga
- [ ] Histórico de acertos do bot
- [ ] Sistema de afiliados
- [ ] Dashboard web para estatísticas

---

**Desenvolvido com ❤️ usando Firebase + Telegram Bot API**
