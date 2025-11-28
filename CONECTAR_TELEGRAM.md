# 🔧 CONECTAR BOT AO TELEGRAM - Instruções Finais

Seu bot está deployado no Vercel! Agora faltam poucos passos para conectar tudo.

## ✅ O que você precisa fazer:

### 1️⃣ Desabilitar Proteção de Deploy no Vercel (IMPORTANTE)

O Vercel está bloqueando acesso ao webhook do Telegram. Faça isto:

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto **goalguru**
3. Vá para **Settings** > **Deployment Protection**
4. **Desabilite** a proteção ou mude para "Only Preview Deployments"
5. **Redeploy** o projeto

Ou execute:
```bash
# Push da configuração que liberou o acesso
git push
# Vercel vai redeployar automaticamente
```

### 2️⃣ Aguarde o redeploy terminar

Quando o deploy estiver pronto (status verde), execute:

```bash
curl -X POST https://goalguru-hqwg9c60d-victorhf220s-projects.vercel.app/api/register-webhook
```

Você verá uma resposta como:
```json
{
  "success": true,
  "webhook_url": "https://goalguru-hqwg9c60d-victorhf220s-projects.vercel.app/api/telegram"
}
```

### 3️⃣ Verifique se o bot está respondendo

Abra o Telegram e procure por **@seu_bot_username** (o que você criou no BotFather)

Envie `/start` 

Se receber uma resposta, tudo está funcionando! 🎉

### 4️⃣ Se não funcionar, verifique:

**A. Health check do servidor:**
```bash
curl https://goalguru-hqwg9c60d-victorhf220s-projects.vercel.app/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "bot": "initialized"
}
```

**B. Logs do Vercel:**
1. Vá para https://vercel.com/dashboard
2. Abra seu projeto
3. **Deployments** > seu deploy > **Logs**

**C. Variáveis de ambiente:**
1. **Settings** > **Environment Variables**
2. Verifique se todas estão setadas:
   - ✅ TELEGRAM_TOKEN = seu token
   - ✅ MONGODB_URI = sua string MongoDB
   - ✅ MERCADO_PAGO_ACCESS_TOKEN = seu token

Se alguma estiver faltando ou errada, corrija e redeploy.

## 📱 Testando o Bot

Depois que registrar o webhook, no Telegram:

```
/start                                    → Mostra menu
/futebol Corinthians x Palmeiras         → Análise de futebol
/basquete Lakers x Celtics               → Análise de basquete
💰 Saldo                                   → Mostra seus créditos
⭐ VIP                                      → Ativa assinatura
🛒 Comprar Créditos                       → Compra créditos
```

---

**Pronto! Em poucos minutos seu bot estará totalmente funcional** 🚀
