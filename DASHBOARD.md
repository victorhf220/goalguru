# 📊 Dashboard GoalGuru - Guia de Uso

Seu dashboard está pronto! Ele mostra estatísticas em tempo real do seu bot.

## 🔐 Como Acessar

### Opção 1: URL com Token
```
https://seu-projeto.vercel.app/dashboard?token=admin123
```

### Opção 2: Via Header
```bash
curl -H "Authorization: Bearer admin123" https://seu-projeto.vercel.app/dashboard
```

### Opção 3: Alterar Senha (Recomendado)

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Seu projeto **goalguru**
3. **Settings** > **Environment Variables**
4. Adicione: `ADMIN_PASSWORD=sua_senha_super_secreta`
5. **Redeploy**

Depois acesse:
```
https://seu-projeto.vercel.app/dashboard?token=sua_senha_super_secreta
```

## 📈 O que você vê no Dashboard

### 📊 Cartões de Estatísticas
- **👥 Total de Usuários** - Quantos usuários usaram o bot
- **⭐ Usuários VIP** - Quantos têm assinatura ativa
- **📊 Análises Realizadas** - Total de análises (futebol + basquete)
- **💰 Pagamentos Confirmados** - Total de pagamentos recebidos

### 👤 Tabela de Usuários Recentes
Mostra os últimos usuários que se cadastraram:
- Nome do usuário
- ID do Telegram
- Status (VIP ou Regular)
- Quantidade de créditos
- Data de cadastro

### 📋 Tabela de Análises Recentes
Mostra as últimas análises realizadas:
- Tipo (⚽ Futebol ou 🏀 Basquete)
- Consulta (TimeA x TimeB)
- Data e hora

## 🔌 APIs do Dashboard

Você também pode acessar os dados em JSON:

### Stats Gerais
```bash
curl "https://seu-projeto.vercel.app/api/dashboard/stats?token=admin123"
```

Retorna:
```json
{
  "totalUsers": 42,
  "vipUsers": 8,
  "totalAnalyses": 156,
  "totalPayments": 5,
  "timestamp": "2025-11-28T01:30:00.000Z"
}
```

### Lista de Usuários
```bash
curl "https://seu-projeto.vercel.app/api/dashboard/users?token=admin123"
```

### Lista de Análises
```bash
curl "https://seu-projeto.vercel.app/api/dashboard/analyses?token=admin123"
```

## 🎨 Personalização

O dashboard é totalmente responsivo e funciona bem em:
- 💻 Computador
- 📱 Tablet
- 📲 Smartphone

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Mude a senha padrão (`admin123`) na variável `ADMIN_PASSWORD`
- Use senhas fortes
- Não compartilhe seu token publicamente
- O acesso é apenas com token (sem banco de dados de usuários)

## 💡 Dicas

1. **Bookmark**: Salve a URL do dashboard nos favoritos
2. **Monitorar**: Acesse regularmente para acompanhar o crescimento
3. **Mobile**: Use no seu celular para monitorar em qualquer lugar

## 🐛 Troubleshooting

### "Unauthorized" ou erro 401
- Verifique se está usando o token correto
- Confirme que a variável `ADMIN_PASSWORD` foi definida no Vercel
- Aguarde alguns minutos se acabou de alterar a senha

### Dashboard em branco
- Verifique os logs do Vercel: **Deployments** > **Logs**
- Confirme que o MongoDB está conectado
- Tente recarregar a página (F5)

### Dados não aparecem
- Certifique-se de que o bot está ativo e recebendo mensagens
- Aguarde alguns usuários se cadastrarem
- Faça algumas análises para aparecer nos dados

---

**Seu dashboard está pronto para monitorar o sucesso do bot!** 🚀
