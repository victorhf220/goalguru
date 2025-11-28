# 🚀 Deploy no Vercel - Passo a Passo

## 1️⃣ Prepare o MongoDB Atlas

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta (gratuita)
3. Crie um novo projeto e cluster (gratuito)
4. Na seção **Databases**, clique em **Connect**
5. Escolha **Drivers**
6. Copie a connection string:
   ```
   mongodb+srv://usuario:senha@cluster.mongodb.net/goalguru?retryWrites=true&w=majority
   ```

## 2️⃣ Configure o Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login ou crie conta
3. Vá para **Credenciais**
4. Copie o **Access Token** (sandbox ou produção)

## 3️⃣ Deploy no Vercel

### Opção A: Via CLI (Recomendado)

```bash
# Instale Vercel CLI globalmente
npm install -g vercel

# Na pasta do projeto, execute:
vercel

# Siga as instruções:
# - Selecione "Create a new project"
# - Dê um nome (ex: goalguru)
# - Selecione a conta/organização
# - Build Command: deixe em branco (padrão)
```

### Opção B: Via GitHub

1. Faça push para o GitHub:
   ```bash
   git push origin main
   ```

2. No [Vercel Dashboard](https://vercel.com/dashboard):
   - Clique em **Add New** > **Project**
   - Selecione seu repositório GitHub
   - Deixe as configurações padrão
   - Clique em **Deploy**

## 4️⃣ Configure Variáveis de Ambiente

No [Vercel Dashboard](https://vercel.com):

1. Vá para seu projeto **GoalGuru**
2. **Settings** > **Environment Variables**
3. Adicione as variáveis:

| Chave | Valor |
|-------|-------|
| `TELEGRAM_TOKEN` | `8498886777:AAGzd3XQdsLjOsD6yaVfreOUV8uHxI9vJ9Q` |
| `MERCADO_PAGO_ACCESS_TOKEN` | Seu token do Mercado Pago |
| `API_FOOTBALL_KEY` | Sua chave da API Football (opcional) |
| `MONGODB_URI` | `mongodb+srv://usuario:senha@cluster.mongodb.net/goalguru...` |
| `WEBHOOK_URL` | `https://seu-projeto.vercel.app` |

4. Clique em **Save**
5. Redeploy: **Deployments** > Clique em **Redeploy**

## 5️⃣ Registre o Webhook do Telegram

Após o deploy estar pronto, execute:

```bash
curl -X POST https://seu-projeto.vercel.app/api/register-webhook
```

Você verá uma resposta como:
```json
{
  "success": true,
  "webhook_url": "https://seu-projeto.vercel.app/api/telegram"
}
```

## 6️⃣ Configure o Webhook do Mercado Pago

1. No [Mercado Pago Dashboard](https://www.mercadopago.com.br/developers)
2. Vá para **Webhooks**
3. Registre a URL:
   ```
   https://seu-projeto.vercel.app/api/payment-webhook
   ```
4. Selecione os eventos:
   - `payment.created`
   - `payment.updated`

## ✅ Teste o Bot

1. Abra o Telegram
2. Procure por `@seu_bot_username`
3. Envie `/start`
4. Teste os comandos:
   - `/futebol Corinthians x Palmeiras`
   - `/basquete Lakers x Celtics`

## 🐛 Troubleshooting

### Bot não responde
- Verifique os logs: **Vercel Dashboard** > **Deployments** > **Logs**
- Confirme que as variáveis de ambiente foram salvas
- Tente redeployar: **Deployments** > **Redeploy**

### Erro de conexão MongoDB
- Verifique a connection string no `MONGODB_URI`
- Confirme que o cluster está ativo em MongoDB Atlas
- Verifique se o IP está autorizado (Network Access)

### Webhook não funciona
- Execute novamente: `curl -X POST https://seu-projeto.vercel.app/api/register-webhook`
- Verifique os logs do Vercel
- Teste manualmente: `curl https://seu-projeto.vercel.app/api/health`

## 📊 Monitoramento

Verifique os logs em tempo real:

```bash
vercel logs seu-projeto-vercel
```

Ou no [Vercel Dashboard](https://vercel.com):
- **Deployments** > Seu deploy > **Logs**

---

**Seu bot está pronto para produção!** 🎉
