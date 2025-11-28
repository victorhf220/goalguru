# 📁 Estrutura do Projeto GoalGuru

```
goalguru/
├── 📁 functions/                    # Cloud Functions (entrypoint)
│   ├── 📁 src/                      # Código-fonte TypeScript
│   │   ├── index.ts                 # Entry point + webhook endpoint
│   │   ├── telegram.ts              # Setup bot + handlers de comandos
│   │   ├── analyzeFootball.ts       # Análise de futebol (método Poisson)
│   │   ├── analyzeBasketball.ts     # Análise de basquete (distribuição Normal)
│   │   ├── firestore.ts             # Helpers para banco de dados
│   │   └── payments.ts              # Integração Mercado Pago
│   │
│   ├── 📁 lib/                      # Código compilado (gerado)
│   │   ├── index.js
│   │   ├── telegram.js
│   │   ├── analyzeFootball.js
│   │   ├── analyzeBasketball.js
│   │   ├── firestore.js
│   │   ├── payments.js
│   │   └── *.js.map                 # Source maps
│   │
│   ├── package.json                 # Dependências da função
│   ├── package-lock.json            # Lock file
│   └── tsconfig.json                # Config TypeScript
│
├── 📄 firebase.json                 # Config de deploy Firebase
├── 📄 .gitignore                    # Arquivos ignorados pelo git
├── 📄 .runtimeconfig.json.example   # Template de variáveis de ambiente
├── 📄 setup.sh                      # Script de setup automático
├── 📄 README.md                     # Documentação completa
├── 📄 QUICK_START.md                # Guia de início rápido
├── 📄 ESTRUTURA.md                  # Este arquivo
└── 📁 .git/                         # Repositório Git
```

## 📂 O que cada arquivo faz

### Core da Aplicação

| Arquivo | Propósito |
|---------|-----------|
| `index.ts` | Exports das Cloud Functions `telegramWebhook` e `registerWebhook` |
| `telegram.ts` | Setup do bot Telegram, handlers de comandos e callbacks |
| `analyzeFootball.ts` | Análise de futebol usando distribuição de Poisson |
| `analyzeBasketball.ts` | Análise de basquete usando distribuição Normal |
| `firestore.ts` | CRUD de usuários, créditos, VIP e logs no Firestore |
| `payments.ts` | Webhook para Mercado Pago e criação de preferências |

### Configuração

| Arquivo | Propósito |
|---------|-----------|
| `firebase.json` | Define functions, hosting e configurações de deploy |
| `package.json` | Dependências (firebase-admin, telegram-bot-api, axios, etc) |
| `tsconfig.json` | Configuração do compilador TypeScript |
| `.gitignore` | Arquivos a não commitá (node_modules, .env, etc) |

### Documentação

| Arquivo | Propósito |
|---------|-----------|
| `README.md` | Documentação técnica completa |
| `QUICK_START.md` | Passo a passo para setup e deploy rápido |
| `setup.sh` | Script bash para automatizar o setup |

## 🔄 Fluxo de Dados

```
Telegram
   ↓ (webhook POST)
Cloud Functions (telegramWebhook)
   ↓
telegram.ts (setupTelegramHandlers)
   ├→ /start → firestore.ts (ensureUserExists)
   ├→ /futebol → analyzeFootball.ts → API-Football
   ├→ /basquete → analyzeBasketball.ts → BallDontLie
   ├→ /comprar → payments.ts → Mercado Pago
   └→ firestore.ts → Firestore Database

Mercado Pago
   ↓ (webhook POST)
Cloud Functions (mercadoPagoWebhook)
   ↓
payments.ts (confirmPayment)
   ↓
firestore.ts (setVip / addCredits)
   ↓
Firestore Database
```

## 🗄️ Banco de Dados (Firestore)

### Coleção: `users`
Armazena dados do usuário
```json
{
  "telegramId": "123456789",
  "createdAt": "2024-11-28T00:00:00Z",
  "vip": true,
  "vipExpiresAt": 1735689600000,
  "credits": 25,
  "firstName": "João",
  "lastName": "Silva"
}
```

### Coleção: `analyses`
Log de análises realizadas
```json
{
  "userId": "123456789",
  "type": "futebol",
  "query": "Corinthians x Palmeiras",
  "timestamp": "2024-11-28T12:30:00Z"
}
```

### Coleção: `payments`
Histórico de pagamentos
```json
{
  "userId": "123456789",
  "type": "vip",
  "amount": 29.90,
  "mpReference": "MP-12345",
  "status": "confirmed",
  "timestamp": "2024-11-28T12:00:00Z"
}
```

## 🚀 Fluxo de Deploy

```
1. npm install (instalar deps)
2. npm run build (compilar TS → JS)
3. firebase deploy --only functions (upload para Google Cloud)
4. firebase functions:call registerWebhook (registrar webhook)
5. Mercado Pago webhook configurado manualmente
```

## 📦 Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| firebase-admin | ^11.0.0 | Admin SDK para Firestore |
| firebase-functions | ^4.0.0 | Cloud Functions runtime |
| node-telegram-bot-api | ^0.61.0 | SDK do Telegram Bot |
| axios | ^1.4.0 | HTTP client para APIs |
| mercadopago | ^2.1.0 | SDK do Mercado Pago |
| typescript | ^5.0.0 | Compilador TypeScript |

## 🎯 Variáveis de Ambiente

Devem ser configuradas no Firebase com `firebase functions:config:set`:

```json
{
  "telegram": {
    "token": "seu_token_botfather"
  },
  "mercado_pago": {
    "access_token": "seu_token_mp"
  },
  "api_football": {
    "key": "sua_chave_api_football"
  },
  "app": {
    "base_url": "https://us-central1-seu-projeto.cloudfunctions.net"
  }
}
```

## 🔐 Segurança

- ✅ Tokens em variáveis de ambiente (não versionados)
- ✅ Firestore com regras de segurança
- ✅ Webhook do Telegram validado automaticamente
- ✅ Rate limiting implícito (Firebase quota)

---

**Última atualização:** 2024-11-28
