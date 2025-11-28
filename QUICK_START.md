# 🚀 Início Rápido - GoalGuru Bot

## 1️⃣ Obtenha suas credenciais

### Telegram Token
1. Abra o [BotFather](https://t.me/botfather) no Telegram
2. Use `/newbot` e siga os passos
3. Copie o **token** fornecido

### Firebase Project
1. Vá para [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto (ou use um existente)
3. Habilite **Firestore Database** (modo de teste)
4. Vá para **Project Settings** (⚙️ > Project Settings)
5. Copie o **Project ID**

### Mercado Pago
1. Crie conta em [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Vá para **Credenciais** > **Produção**
3. Copie **Access Token**

### API Football
1. Registre-se em [API-Football](https://www.api-football.com)
2. Copie sua **API Key** do dashboard

## 2️⃣ Configure o Firebase

```bash
# Login no Firebase
firebase login

# Defina o projeto
firebase use seu-project-id

# Configure as variáveis de ambiente
firebase functions:config:set \
  telegram.token="seu_token_aqui" \
  mercado_pago.access_token="seu_token_aqui" \
  api_football.key="sua_chave_aqui"

# Verifique a configuração
firebase functions:config:get
```

## 3️⃣ Deploy

```bash
# Na pasta raiz do projeto
firebase deploy --only functions
```

## 4️⃣ Registrar Webhook do Telegram

Após o deploy, registre o webhook:

```bash
firebase functions:call registerWebhook
```

Você verá uma mensagem como:
```
✅ Webhook registrado em https://us-central1-seu-projeto.cloudfunctions.net/telegramWebhook
```

## 5️⃣ Teste o Bot

1. Abra o Telegram
2. Busque por `@seu_bot_username`
3. Envie `/start`
4. Experimente os comandos:
   - `/futebol Corinthians x Palmeiras`
   - `/basquete Lakers x Celtics`

## 🔧 Troubleshooting

### Webhook não funciona
```bash
# Re-registre o webhook
firebase functions:call registerWebhook

# Verifique os logs
firebase functions:log --follow
```

### Erro de credenciais
```bash
# Verifique se foram definidas
firebase functions:config:get

# Se não aparecer, defina novamente
firebase functions:config:set telegram.token="seu_token"
```

### Firestore não inicializa
1. Vá para [Firebase Console](https://console.firebase.google.com)
2. Acesse **Firestore Database**
3. Clique em **Criar banco de dados**
4. Selecione **Modo de teste**

## 📊 Monitorar Pagamentos

1. Vá para [Painel Mercado Pago](https://www.mercadopago.com.br/home)
2. Configure um webhook para sua função:
   ```
   https://us-central1-seu-projeto.cloudfunctions.net/mercadoPagoWebhook
   ```

## 💡 Dicas

- Use `firebase emulators:start --only functions` para testar localmente
- Consulte `README.md` para documentação completa
- Verifique os logs: `firebase functions:log`

---

Pronto! Seu bot deve estar funcionando agora! 🎉
