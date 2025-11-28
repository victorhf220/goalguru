import TelegramBot from "node-telegram-bot-api";
import { analyzeFootball } from "./analyzeFootball";
import { analyzeBasketball } from "./analyzeBasketball";
import { createMercadoPagoPreference } from "./payments";
import {
  ensureUserExists,
  getUser,
  logAnalysis,
  recordPayment,
  deductCredits
} from "./firestore";

const token = process.env.TELEGRAM_TOKEN!;
let botInstance: TelegramBot | null = null;

export async function setupTelegramHandlers(): Promise<TelegramBot> {
  if (botInstance) return botInstance;

  botInstance = new TelegramBot(token, { polling: false });
  const bot = botInstance;

  // Comando /start
  bot.onText(/\/start/, async (msg: any) => {
    const userId = msg.from!.id;
    const firstName = msg.from!.first_name;
    const chatId = msg.chat.id;

    await ensureUserExists(userId, firstName, msg.from!.last_name);

    const keyboard = {
      reply_markup: {
        keyboard: [
          [{ text: "⚽ Futebol" }, { text: "🏀 Basquete" }],
          [{ text: "📅 Jogos de hoje" }, { text: "⭐ VIP" }],
          [{ text: "💰 Saldo" }, { text: "🛒 Comprar créditos" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };

    await bot.sendMessage(
      chatId,
      `Olá ${firstName}! 👋\n\nSou o Bot de Análises de Futebol e Basquete.\n\nEscolha uma opção abaixo para começar!`,
      keyboard
    );
  });

  // Análise de Futebol: /futebol Time1 x Time2
  bot.onText(/\/futebol\s+(.+)/i, async (msg: any, match: any) => {
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const query = match![1];

    await ensureUserExists(userId);
    const user = await getUser(userId);

    if (!user) {
      await bot.sendMessage(chatId, "Erro ao carregar perfil do usuário.");
      return;
    }

    // Verificar créditos
    if (!user.vip && user.credits < 1) {
      await bot.sendMessage(
        chatId,
        "❌ Créditos insuficientes. Compre créditos ou ative VIP para continuar.\n\n Use /comprar"
      );
      return;
    }

    const statusMsg = await bot.sendMessage(chatId, "⏳ Analisando futebol... aguarde um momento.");

    try {
      const result = await analyzeFootball(query);
      await bot.editMessageText(result, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown"
      });

      // Deductar crédito se não for VIP
      if (!user.vip) {
        await deductCredits(userId, 1);
      }

      // Log de análise
      await logAnalysis(userId, "futebol", query);
    } catch (err: any) {
      console.error("Erro análise futebol:", err);
      await bot.editMessageText(`❌ Erro ao analisar: ${err.message}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  });

  // Análise de Basquete: /basquete Time1 x Time2
  bot.onText(/\/basquete\s+(.+)/i, async (msg: any, match: any) => {
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const query = match![1];

    await ensureUserExists(userId);
    const user = await getUser(userId);

    if (!user) {
      await bot.sendMessage(chatId, "Erro ao carregar perfil do usuário.");
      return;
    }

    if (!user.vip && user.credits < 1) {
      await bot.sendMessage(
        chatId,
        "❌ Créditos insuficientes. Compre créditos ou ative VIP.\n\nUse /comprar"
      );
      return;
    }

    const statusMsg = await bot.sendMessage(chatId, "⏳ Analisando basquete... aguarde um momento.");

    try {
      const result = await analyzeBasketball(query);
      await bot.editMessageText(result, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown"
      });

      if (!user.vip) {
        await deductCredits(userId, 1);
      }

      await logAnalysis(userId, "basquete", query);
    } catch (err: any) {
      console.error("Erro análise basquete:", err);
      await bot.editMessageText(`❌ Erro ao analisar: ${err.message}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id
      });
    }
  });

  // Mensagens de texto do menu
  bot.on("message", async (msg: any) => {
    const text = msg.text || "";
    const chatId = msg.chat.id;
    const userId = msg.from!.id;

    // Evitar processar comandos já tratados
    if (text.startsWith("/")) return;

    await ensureUserExists(userId);
    const user = await getUser(userId);

    if (!user) return;

    // Saldo
    if (text.toLowerCase().includes("saldo") || text === "💰 Saldo") {
      const vipStatus = user.vip ? "✅ VIP ativo" : "❌ Sem VIP";
      const expiresIn = user.vipExpiresAt
        ? Math.ceil((user.vipExpiresAt - Date.now()) / (24 * 60 * 60 * 1000))
        : 0;
      const vipInfo = user.vip && expiresIn > 0 ? ` (expira em ${expiresIn} dias)` : "";

      await bot.sendMessage(
        chatId,
        `💼 *Seu Saldo*\n\n💳 Créditos: ${user.credits}\n${vipStatus}${vipInfo}\n\n` +
          `Use /futebol ou /basquete para analisar.\nOU compre créditos com /comprar`
      );
      return;
    }

    // VIP
    if (text.toLowerCase().includes("vip") || text === "⭐ VIP") {
      if (user.vip) {
        const expiresIn = Math.ceil((user.vipExpiresAt! - Date.now()) / (24 * 60 * 60 * 1000));
        await bot.sendMessage(chatId, `✅ Você já é VIP! Válido por ${expiresIn} dias.`);
        return;
      }

      try {
        const pref = await createMercadoPagoPreference(String(userId), "vip", 29.9);
        await recordPayment(userId, "vip", 29.9, pref.id);

        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💳 Comprar VIP - R$ 29,90",
                  url: pref.init_point
                }
              ]
            ]
          }
        };

        await bot.sendMessage(
          chatId,
          `⭐ *VIP - 30 dias*\n\nDesfrute de:\n• ✅ Análises ilimitadas\n• ✅ Prioridade no suporte\n\nClique no botão abaixo para ativar:`,
          keyboard
        );
      } catch (err: any) {
        console.error("Erro ao criar preferência VIP:", err);
        await bot.sendMessage(chatId, `❌ Erro ao processar pagamento: ${err.message}`);
      }
      return;
    }

    // Comprar Créditos
    if (text.toLowerCase().includes("comprar") || text === "🛒 Comprar créditos") {
      const creditOptions = [
        { amount: 5, price: 4.9 },
        { amount: 15, price: 12.9 },
        { amount: 50, price: 39.9 }
      ];

      const keyboard = {
        reply_markup: {
          inline_keyboard: creditOptions.map((opt) => [
            {
              text: `${opt.amount} créditos - R$ ${opt.price.toFixed(2)}`,
              callback_data: `buy_credits_${opt.amount}_${opt.price}`
            }
          ])
        }
      };

      await bot.sendMessage(chatId, "💰 *Escolha uma opção:*", keyboard);
      return;
    }

    // Jogos de hoje (placeholder)
    if (text.toLowerCase().includes("jogos de hoje") || text === "📅 Jogos de hoje") {
      await bot.sendMessage(
        chatId,
        "📅 *Jogos de Hoje*\n\nEste recurso em desenvolvimento. Por enquanto, use /futebol e /basquete para análises!"
      );
      return;
    }
  });

  // Callbacks de botões inline
  bot.on("callback_query", async (query: any) => {
    const data = query.data;
    const chatId = query.message!.chat.id;
    const userId = query.from.id;

    await ensureUserExists(userId);

    if (data.startsWith("buy_credits_")) {
      const parts = data.split("_");
      const amount = parseInt(parts[2]);
      const price = parseFloat(parts[3]);

      try {
        const pref = await createMercadoPagoPreference(String(userId), "credits", price);
        await recordPayment(userId, "credits", price, pref.id);

        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💳 Pagar com Mercado Pago",
                  url: pref.init_point
                }
              ]
            ]
          }
        };

        await bot.editMessageText(
          `💰 *${amount} créditos - R$ ${price.toFixed(2)}*\n\nClique abaixo para finalizar a compra:`,
          {
            chat_id: chatId,
            message_id: query.message!.message_id,
            ...keyboard
          }
        );

        await bot.answerCallbackQuery(query.id, { text: "Redirecionando para checkout..." });
      } catch (err: any) {
        console.error("Erro ao criar preferência de créditos:", err);
        await bot.answerCallbackQuery(query.id, { text: `Erro: ${err.message}`, show_alert: true });
      }
      return;
    }

    await bot.answerCallbackQuery(query.id);
  });

  return bot;
}
