# 🤖 GoalGuru - Telegram Analytics Bot (Vercel)

Bot Telegram para análises de futebol e basquete, rodando em Node.js no Vercel com MongoDB.

## 🚀 Deploy Rápido

### 1. Prepare o repositório

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy no Vercel

```bash
npm i -g vercel
vercel
```

Siga as instruções interativas.

### 3. Configure variáveis de ambiente

No [Vercel Dashboard](https://vercel.com/dashboard):

1. Vá para **Settings** > **Environment Variables**
2. Adicione:
   - `TELEGRAM_TOKEN`: 8498886777:AAGzd3XQdsLjOsD6yaVfreOUV8uHxI9vJ9Q
   - `MERCADO_PAGO_ACCESS_TOKEN`: seu token Mercado Pago
   - `API_FOOTBALL_KEY`: sua chave API Football
   - `MONGODB_URI`: URI do MongoDB (MongoDB Atlas)
   - `WEBHOOK_URL`: `https://seu-projeto.vercel.app` (após deploy)

### 4. Registre o webhook do Telegram

```bash
curl -X POST https://seu-projeto.vercel.app/api/register-webhook
```

## 📦 Stack

- **Runtime**: Node.js 18
- **Framework**: Express
- **Bot**: node-telegram-bot-api
- **Database**: MongoDB
- **Deploy**: Vercel
- **Pagamentos**: Mercado Pago

## 📁 Estrutura

```
├── server.ts              # Express server
├── src/
│   ├── db.ts             # MongoDB models
│   ├── telegram.ts       # Bot handlers
│   ├── analyzeFootball.ts
│   ├── analyzeBasketball.ts
│   └── payments.ts
├── package.json
└── vercel.json
```

## 🎮 Comandos

- `/start` - Menu principal
- `/futebol TimeA x TimeB` - Análise de futebol
- `/basquete TimeA x TimeB` - Análise de basquete

## 💡 Desenvolvimento Local

```bash
npm install
npm run dev
```

Acesso em `http://localhost:3000`

## 🔐 Variáveis de Ambiente

Crie `.env.local`:

```env
TELEGRAM_TOKEN=8498886777:AAGzd3XQdsLjOsD6yaVfreOUV8uHxI9vJ9Q
MERCADO_PAGO_ACCESS_TOKEN=seu_token
API_FOOTBALL_KEY=sua_chave
MONGODB_URI=mongodb+srv://...
WEBHOOK_URL=http://localhost:3000
```

## 📊 MongoDB Atlas

1. Crie conta em [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster gratuito
3. Copie a connection string
4. Configure na variável `MONGODB_URI`

---

**Pronto para deploy!** 🚀
